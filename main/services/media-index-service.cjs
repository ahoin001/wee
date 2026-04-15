function createMediaIndexService({
  fs,
  fsPromises,
  path,
  Database,
  sharp,
  dataDir,
  mediaIndexDbFile,
  userWallpaperThumbnailsPath,
  userWallpapersPath,
}) {
  let mediaIndexDb = null;

  function getMediaIndexDb() {
    if (mediaIndexDb) return mediaIndexDb;

    fs.mkdirSync(dataDir, { recursive: true });
    mediaIndexDb = new Database(mediaIndexDbFile);
    mediaIndexDb.pragma('journal_mode = WAL');
    mediaIndexDb.exec(`
      CREATE TABLE IF NOT EXISTS wallpaper_assets (
        url TEXT PRIMARY KEY,
        name TEXT,
        type TEXT,
        source_path TEXT,
        size_bytes INTEGER,
        width INTEGER,
        height INTEGER,
        thumbnail_url TEXT,
        created_at INTEGER,
        updated_at INTEGER
      );
    `);

    return mediaIndexDb;
  }

  function getWallpaperAssetFromIndex(url) {
    try {
      const db = getMediaIndexDb();
      return db
        .prepare('SELECT url, thumbnail_url AS thumbnailUrl, width, height, size_bytes AS sizeBytes FROM wallpaper_assets WHERE url = ?')
        .get(url);
    } catch (error) {
      console.warn('[MEDIA-INDEX] Failed to read wallpaper index entry:', error.message);
      return null;
    }
  }

  function upsertWallpaperAssetInIndex(asset) {
    try {
      const db = getMediaIndexDb();
      db.prepare(`
        INSERT INTO wallpaper_assets (
          url, name, type, source_path, size_bytes, width, height, thumbnail_url, created_at, updated_at
        ) VALUES (
          @url, @name, @type, @sourcePath, @sizeBytes, @width, @height, @thumbnailUrl, @createdAt, @updatedAt
        )
        ON CONFLICT(url) DO UPDATE SET
          name=excluded.name,
          type=excluded.type,
          source_path=excluded.source_path,
          size_bytes=excluded.size_bytes,
          width=excluded.width,
          height=excluded.height,
          thumbnail_url=excluded.thumbnail_url,
          updated_at=excluded.updated_at
      `).run({
        ...asset,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.warn('[MEDIA-INDEX] Failed to upsert wallpaper entry:', error.message);
    }
  }

  async function removeWallpaperAssetFromIndex(url) {
    try {
      const existing = getWallpaperAssetFromIndex(url);
      const db = getMediaIndexDb();
      db.prepare('DELETE FROM wallpaper_assets WHERE url = ?').run(url);

      if (existing?.thumbnailUrl?.startsWith('userdata://wallpaper-thumbs/')) {
        const thumbnailName = existing.thumbnailUrl.replace('userdata://wallpaper-thumbs/', '');
        await fsPromises.rm(path.join(userWallpaperThumbnailsPath, thumbnailName), { force: true });
      }
    } catch (error) {
      console.warn('[MEDIA-INDEX] Failed to remove wallpaper entry:', error.message);
    }
  }

  async function createWallpaperThumbnail(sourcePath, stem) {
    try {
      await fsPromises.mkdir(userWallpaperThumbnailsPath, { recursive: true });
      const thumbnailFilename = `${stem}-${Date.now()}.webp`;
      const thumbnailPath = path.join(userWallpaperThumbnailsPath, thumbnailFilename);

      await sharp(sourcePath)
        .resize(640, 360, { fit: 'cover', position: 'attention', withoutEnlargement: true })
        .webp({ quality: 72 })
        .toFile(thumbnailPath);

      return `userdata://wallpaper-thumbs/${thumbnailFilename}`;
    } catch (error) {
      console.warn('[WALLPAPER] Thumbnail generation skipped:', error.message);
      return null;
    }
  }

  async function getWallpaperMetadata(sourcePath) {
    try {
      const [stats, metadata] = await Promise.all([
        fsPromises.stat(sourcePath),
        sharp(sourcePath).metadata(),
      ]);

      return {
        sizeBytes: stats?.size || null,
        width: metadata?.width || null,
        height: metadata?.height || null,
      };
    } catch {
      try {
        const stats = await fsPromises.stat(sourcePath);
        return {
          sizeBytes: stats?.size || null,
          width: null,
          height: null,
        };
      } catch {
        return {
          sizeBytes: null,
          width: null,
          height: null,
        };
      }
    }
  }

  function hydrateWallpapersFromIndex(savedWallpapers) {
    if (!Array.isArray(savedWallpapers) || savedWallpapers.length === 0) {
      return [];
    }

    return savedWallpapers.map((wallpaper) => {
      if (!wallpaper?.url) return wallpaper;
      const indexed = getWallpaperAssetFromIndex(wallpaper.url);
      if (!indexed) return wallpaper;

      return {
        ...wallpaper,
        thumbnailUrl: indexed.thumbnailUrl || wallpaper.thumbnailUrl || null,
        width: indexed.width ?? wallpaper.width ?? null,
        height: indexed.height ?? wallpaper.height ?? null,
        sizeBytes: indexed.sizeBytes ?? wallpaper.sizeBytes ?? null,
      };
    });
  }

  async function backfillWallpaperIndex(savedWallpapers) {
    if (!Array.isArray(savedWallpapers) || savedWallpapers.length === 0) {
      return savedWallpapers;
    }

    const nextWallpapers = [];
    for (const wallpaper of savedWallpapers) {
      if (!wallpaper?.url || !wallpaper.url.startsWith('userdata://wallpapers/')) {
        nextWallpapers.push(wallpaper);
        continue;
      }

      const indexed = getWallpaperAssetFromIndex(wallpaper.url);
      if (indexed?.thumbnailUrl) {
        nextWallpapers.push({
          ...wallpaper,
          thumbnailUrl: indexed.thumbnailUrl,
          width: indexed.width ?? wallpaper.width ?? null,
          height: indexed.height ?? wallpaper.height ?? null,
          sizeBytes: indexed.sizeBytes ?? wallpaper.sizeBytes ?? null,
        });
        continue;
      }

      const filename = wallpaper.url.replace('userdata://wallpapers/', '');
      const sourcePath = path.join(userWallpapersPath, filename);
      const sourceExists = fs.existsSync(sourcePath);
      if (!sourceExists) {
        nextWallpapers.push(wallpaper);
        continue;
      }

      const stem = path.basename(filename, path.extname(filename));
      const thumbnailUrl = await createWallpaperThumbnail(sourcePath, stem);
      const metadata = await getWallpaperMetadata(sourcePath);
      upsertWallpaperAssetInIndex({
        url: wallpaper.url,
        name: wallpaper.name || filename,
        type: wallpaper.type || path.extname(filename).replace('.', ''),
        sourcePath,
        sizeBytes: metadata.sizeBytes,
        width: metadata.width,
        height: metadata.height,
        thumbnailUrl,
        createdAt: wallpaper.added || Date.now(),
        updatedAt: Date.now(),
      });

      nextWallpapers.push({
        ...wallpaper,
        thumbnailUrl: thumbnailUrl || wallpaper.thumbnailUrl || null,
        width: metadata.width ?? wallpaper.width ?? null,
        height: metadata.height ?? wallpaper.height ?? null,
        sizeBytes: metadata.sizeBytes ?? wallpaper.sizeBytes ?? null,
      });
    }

    return nextWallpapers;
  }

  function ensureMediaIndexReady() {
    getMediaIndexDb();
  }

  return {
    ensureMediaIndexReady,
    upsertWallpaperAssetInIndex,
    removeWallpaperAssetFromIndex,
    createWallpaperThumbnail,
    getWallpaperMetadata,
    hydrateWallpapersFromIndex,
    backfillWallpaperIndex,
  };
}

module.exports = {
  createMediaIndexService,
};
