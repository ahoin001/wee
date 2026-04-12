/**
 * Upload local files from a legacy `media-library` export into the current Supabase project:
 * - Storage bucket `media-library` (preserves relative paths as object keys)
 * - Table `app_wee_v1.media_library` with seed placeholder session
 *
 * Usage:
 *   node scripts/seed-media-library-from-folder.cjs "C:\path\to\media-library"
 *   node scripts/seed-media-library-from-folder.cjs --dry-run "C:\path\to\media-library"
 *
 * Or set SEED_MEDIA_LOCAL_DIR in .env to the folder path.
 *
 * Requires: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_APP_SCHEMA (default app_wee_v1)
 */
require('./load-env.cjs');
const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const DEST_URL = process.env.VITE_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const APP_SCHEMA = process.env.VITE_SUPABASE_APP_SCHEMA || 'app_wee_v1';
const BUCKET = 'media-library';

const SEED_SESSION_TOKEN = '00000000-0000-4000-a000-00000000feed';
const DRY_RUN = process.argv.includes('--dry-run');

const EXT = {
  '.png': { mime: 'image/png', fileType: 'image' },
  '.jpg': { mime: 'image/jpeg', fileType: 'image' },
  '.jpeg': { mime: 'image/jpeg', fileType: 'image' },
  '.webp': { mime: 'image/webp', fileType: 'image' },
  '.bmp': { mime: 'image/bmp', fileType: 'image' },
  '.gif': { mime: 'image/gif', fileType: 'gif' },
  '.mp4': { mime: 'video/mp4', fileType: 'video' },
  '.webm': { mime: 'video/webm', fileType: 'video' },
  '.mov': { mime: 'video/quicktime', fileType: 'video' },
  '.mkv': { mime: 'video/x-matroska', fileType: 'video' },
};

function parseArgs() {
  const args = process.argv.slice(2).filter((a) => a !== '--dry-run');
  if (args[0]) return path.resolve(args[0]);
  if (process.env.SEED_MEDIA_LOCAL_DIR) return path.resolve(process.env.SEED_MEDIA_LOCAL_DIR.trim());
  return '';
}

async function walkFiles(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walkFiles(full)));
    else out.push(full);
  }
  return out;
}

function relPosix(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function metaForFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const m = EXT[ext];
  if (!m) return null;
  return m;
}

function titleFromPath(filePath) {
  const base = path.basename(filePath, path.extname(filePath));
  return base.replace(/[_-]+/g, ' ').trim() || 'Untitled';
}

async function ensureSeedSession(spoke) {
  const { data: existing, error: selErr } = await spoke
    .from('user_sessions')
    .select('id')
    .eq('session_token', SEED_SESSION_TOKEN)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing?.id) return existing.id;

  if (DRY_RUN) {
    console.log('[seed] dry-run: would create seed user_sessions row');
    return '00000000-0000-0000-0000-000000000001';
  }

  const { data, error } = await spoke
    .from('user_sessions')
    .insert({
      session_token: SEED_SESSION_TOKEN,
      user_agent: 'wee/seed-media-library-import',
      ip_address: null,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function rowExists(spoke, fileUrl) {
  const { data, error } = await spoke.from('media_library').select('id').eq('file_url', fileUrl).maybeSingle();
  if (error) throw error;
  return !!data;
}

async function main() {
  const localRoot = parseArgs();
  if (!DEST_URL || !SERVICE_KEY) {
    console.error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }
  if (!localRoot) {
    console.error('Pass the local media-library folder path as the first argument, or set SEED_MEDIA_LOCAL_DIR in .env');
    process.exit(1);
  }

  let stat;
  try {
    stat = await fs.stat(localRoot);
  } catch {
    console.error('Folder not found:', localRoot);
    process.exit(1);
  }
  if (!stat.isDirectory()) {
    console.error('Not a directory:', localRoot);
    process.exit(1);
  }

  const supabase = createClient(DEST_URL, SERVICE_KEY);
  const spoke = supabase.schema(APP_SCHEMA);

  console.log('=== Seed media-library ===');
  console.log('Local folder:', localRoot);
  console.log('Project:', DEST_URL);
  console.log('Schema:', APP_SCHEMA);
  if (DRY_RUN) console.log('DRY RUN (no uploads/inserts)');

  const allFiles = await walkFiles(localRoot);
  const candidates = allFiles.filter((f) => metaForFile(f));
  const skippedExt = allFiles.length - candidates.length;
  console.log(`Files found: ${allFiles.length} (${candidates.length} supported, ${skippedExt} skipped by extension)`);

  const sessionId = await ensureSeedSession(spoke);

  let uploaded = 0;
  let inserted = 0;
  let skippedDup = 0;
  let failed = 0;

  for (const filePath of candidates) {
    const objectKey = relPosix(localRoot, filePath);
    const meta = metaForFile(filePath);
    const st = await fs.stat(filePath);
    const size = Number(st.size);

    if (await rowExists(spoke, objectKey)) {
      skippedDup++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`[dry-run] ${objectKey}`);
      inserted++;
      continue;
    }

    const buf = await fs.readFile(filePath);
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(objectKey, buf, {
      contentType: meta.mime,
      upsert: true,
    });
    if (upErr) {
      console.warn('[storage]', objectKey, upErr.message);
      failed++;
      continue;
    }
    uploaded++;

    const { error: insErr } = await spoke.from('media_library').insert({
      title: titleFromPath(filePath),
      description: 'Imported from legacy Storage export (seed data).',
      tags: [],
      file_type: meta.fileType,
      mime_type: meta.mime,
      file_size: size,
      file_url: objectKey,
      downloads: 0,
      views: 0,
      is_featured: false,
      is_approved: true,
      created_by_session_id: sessionId,
      created_by_user_id: null,
    });
    if (insErr) {
      console.warn('[db]', objectKey, insErr.message);
      failed++;
      continue;
    }
    inserted++;
    if ((uploaded + skippedDup + failed) % 50 === 0) {
      console.log(`... progress: uploaded ${uploaded}, rows ${inserted}, skipped dup ${skippedDup}, failed ${failed}`);
    }
  }

  console.log('\nDone.');
  console.log(`Uploaded: ${uploaded}, DB rows: ${inserted}, skipped (already had row): ${skippedDup}, failed: ${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
