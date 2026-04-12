/**
 * One-time migration: copy `media-library` Storage objects + `media_library` rows
 * from a legacy Supabase project into this app (destination: VITE_SUPABASE_URL + app_wee_v1).
 *
 * Does NOT migrate presets, preset storage, or download analytics.
 *
 * Prerequisites:
 * - Legacy: Project Settings → API → service_role key (source).
 * - Destination: SUPABASE_SERVICE_ROLE_KEY in .env (same project as VITE_SUPABASE_URL).
 * - Destination bucket `media-library` must exist (see supabase migrations).
 *
 * Usage:
 *   node scripts/migrate-media-from-legacy-supabase.cjs
 *   node scripts/migrate-media-from-legacy-supabase.cjs --dry-run
 *   node scripts/migrate-media-from-legacy-supabase.cjs --storage-only
 *   node scripts/migrate-media-from-legacy-supabase.cjs --db-only
 */
require('./load-env.cjs');
const { createClient } = require('@supabase/supabase-js');

const SOURCE_URL = process.env.MIGRATE_SOURCE_SUPABASE_URL || '';
const SOURCE_KEY = process.env.MIGRATE_SOURCE_SERVICE_ROLE_KEY || '';
const DEST_URL = process.env.VITE_SUPABASE_URL || '';
const DEST_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const DEST_SCHEMA = process.env.VITE_SUPABASE_APP_SCHEMA || 'app_wee_v1';
/** Legacy table location: `public` (default) or e.g. app_wee_v1 if you already moved it */
const SOURCE_DB_SCHEMA = process.env.MIGRATE_SOURCE_DB_SCHEMA || 'public';
/** Legacy Storage bucket id (must match paths in media_library.file_url) */
const SOURCE_BUCKET = process.env.MIGRATE_SOURCE_BUCKET || 'media-library';
const DEST_BUCKET = process.env.MIGRATE_DEST_BUCKET || 'media-library';
const DRY_RUN = process.argv.includes('--dry-run');
const STORAGE_ONLY = process.argv.includes('--storage-only');
const DB_ONLY = process.argv.includes('--db-only');

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function listStorageFilesRecursive(supabase, bucket, prefix = '') {
  const out = [];
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) throw error;
  for (const item of data || []) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.metadata) {
      out.push({ path, metadata: item.metadata });
    } else {
      const sub = await listStorageFilesRecursive(supabase, bucket, path);
      out.push(...sub);
    }
  }
  return out;
}

function mapRowToDest(row) {
  const tags = Array.isArray(row.tags) ? row.tags : [];
  const ft = row.file_type;
  if (!['image', 'gif', 'video'].includes(ft)) return null;
  return {
    id: row.id,
    title: row.title ?? 'Untitled',
    description: row.description,
    tags,
    file_type: ft,
    mime_type: row.mime_type ?? 'application/octet-stream',
    file_size: typeof row.file_size === 'number' ? row.file_size : 0,
    width: row.width,
    height: row.height,
    duration_ms: row.duration_ms,
    file_url: row.file_url,
    thumbnail_url: row.thumbnail_url,
    preview_url: row.preview_url,
    downloads: row.downloads ?? 0,
    views: row.views ?? 0,
    is_featured: !!row.is_featured,
    is_approved: row.is_approved !== false,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by_session_id: row.created_by_session_id,
    created_by_user_id: row.created_by_user_id,
  };
}

async function migrateStorage(source, dest) {
  console.log(`\n[storage] Listing "${SOURCE_BUCKET}" → "${DEST_BUCKET}"`);
  let files;
  try {
    files = await listStorageFilesRecursive(source, SOURCE_BUCKET);
  } catch (e) {
    console.error(`[storage] Failed to list source bucket "${SOURCE_BUCKET}".`, e.message);
    throw e;
  }
  console.log(`[storage] Found ${files.length} object(s).`);

  let ok = 0;
  let fail = 0;
  for (let i = 0; i < files.length; i++) {
    const { path, metadata } = files[i];
    const mime = metadata?.mimetype || 'application/octet-stream';
    if (DRY_RUN) {
      console.log(`[storage] dry-run: would copy "${path}"`);
      ok++;
      continue;
    }
    const { data: blob, error: dlErr } = await source.storage.from(SOURCE_BUCKET).download(path);
    if (dlErr) {
      console.warn(`[storage] skip download failed: ${path}`, dlErr.message);
      fail++;
      continue;
    }
    const buf = Buffer.from(await blob.arrayBuffer());
    const { error: upErr } = await dest.storage.from(DEST_BUCKET).upload(path, buf, {
      contentType: mime,
      upsert: true,
    });
    if (upErr) {
      console.warn(`[storage] skip upload failed: ${path}`, upErr.message);
      fail++;
    } else {
      ok++;
      if ((i + 1) % 25 === 0) console.log(`[storage] ... ${i + 1}/${files.length}`);
    }
    await delay(30);
  }
  console.log(`[storage] Done. uploaded: ${ok}, failed: ${fail}${DRY_RUN ? ' (dry-run)' : ''}`);
}

async function migrateDbRows(source, dest) {
  const src = SOURCE_DB_SCHEMA === 'public' ? source : source.schema(SOURCE_DB_SCHEMA);
  console.log(`\n[db] Fetching media_library from source schema "${SOURCE_DB_SCHEMA}"...`);

  const { data: rows, error } = await src.from('media_library').select('*').order('created_at', { ascending: true });
  if (error) {
    console.error('[db] Select failed:', error.message);
    throw error;
  }
  if (!rows?.length) {
    console.log('[db] No rows to migrate.');
    return;
  }
  console.log(`[db] ${rows.length} row(s) to upsert into ${DEST_SCHEMA}.media_library`);

  const destSpoke = dest.schema(DEST_SCHEMA);
  const chunkSize = 40;
  let ok = 0;
  let skip = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const mapped = [];
    for (const row of chunk) {
      const m = mapRowToDest(row);
      if (!m) {
        console.warn(`[db] skip row id=${row.id} (invalid file_type or shape)`);
        skip++;
        continue;
      }
      mapped.push(m);
    }
    if (!mapped.length) continue;

    if (DRY_RUN) {
      console.log(`[db] dry-run: would upsert ${mapped.length} rows`);
      ok += mapped.length;
      continue;
    }

    const { error: upErr } = await destSpoke.from('media_library').upsert(mapped, { onConflict: 'id' });
    if (upErr) {
      console.error('[db] Upsert error:', upErr.message);
      throw upErr;
    }
    ok += mapped.length;
    console.log(`[db] ... ${Math.min(i + chunkSize, rows.length)}/${rows.length}`);
    await delay(50);
  }
  console.log(`[db] Done. upserted: ${ok}, skipped: ${skip}${DRY_RUN ? ' (dry-run)' : ''}`);
}

async function main() {
  if (DB_ONLY && STORAGE_ONLY) {
    console.error('Use only one of --storage-only or --db-only');
    process.exit(1);
  }

  const runStorage = !STORAGE_ONLY;
  const runDb = !DB_ONLY;

  if (!SOURCE_URL || !SOURCE_KEY) {
    console.error('Set MIGRATE_SOURCE_SUPABASE_URL and MIGRATE_SOURCE_SERVICE_ROLE_KEY (legacy project).');
    process.exit(1);
  }
  if (!DEST_URL || !DEST_KEY) {
    console.error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (destination project).');
    process.exit(1);
  }

  const source = createClient(SOURCE_URL, SOURCE_KEY);
  const dest = createClient(DEST_URL, DEST_KEY);

  console.log('=== Migrate legacy media → new project (app spoke) ===');
  if (DRY_RUN) console.log('DRY RUN — no writes.');
  console.log(`Destination: ${DEST_URL}`);
  console.log(`Destination schema: ${DEST_SCHEMA}`);
  console.log(`Source: ${SOURCE_URL}`);
  console.log(`Source DB schema for media_library: ${SOURCE_DB_SCHEMA}`);

  try {
    if (runStorage) await migrateStorage(source, dest);
    if (runDb) await migrateDbRows(source, dest);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  console.log('\nFinished.');
}

main();
