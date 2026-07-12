const { relativeFromPrefixedUrl, resolvePathInsideRoot } = require('../utils/path-guard-utils.cjs');

function registerWallpaperFileHandlers({
  ipcMain,
  fsPromises,
  path,
  fs,
  ensureDataDir,
  userWallpapersPath,
  createWallpaperThumbnail,
  getWallpaperMetadata,
  upsertWallpaperAssetInIndex,
}) {
  ipcMain.handle('wallpapers:get-file', async (_event, url) => {
    try {
      const filename = relativeFromPrefixedUrl(url, 'userdata://wallpapers/');
      const filePath = resolvePathInsideRoot(userWallpapersPath, filename);
      const data = await fsPromises.readFile(filePath);
      return { success: true, filename, data: data.toString('base64') };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('wallpapers:save-file', async (_event, { filename, data }) => {
    try {
      await ensureDataDir();
      const safeFilename = path.basename(filename);
      let base = path.basename(safeFilename, path.extname(safeFilename));
      let ext = path.extname(safeFilename);
      let uniqueName = safeFilename;
      let i = 1;
      while (fs.existsSync(resolvePathInsideRoot(userWallpapersPath, uniqueName))) {
        uniqueName = `${base}_${i}${ext}`;
        i++;
      }
      const filePath = resolvePathInsideRoot(userWallpapersPath, uniqueName);
      await fsPromises.writeFile(filePath, Buffer.from(data, 'base64'));
      const stem = path.basename(uniqueName, path.extname(uniqueName));
      const url = `userdata://wallpapers/${uniqueName}`;
      const thumbnailUrl = await createWallpaperThumbnail(filePath, stem);
      const metadata = await getWallpaperMetadata(filePath);

      upsertWallpaperAssetInIndex({
        url,
        name: uniqueName,
        type: path.extname(uniqueName).replace('.', ''),
        sourcePath: filePath,
        sizeBytes: metadata.sizeBytes,
        width: metadata.width,
        height: metadata.height,
        thumbnailUrl,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return { success: true, url, thumbnailUrl };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
}

module.exports = {
  registerWallpaperFileHandlers,
};
