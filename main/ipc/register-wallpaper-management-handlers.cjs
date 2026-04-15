function registerWallpaperManagementHandlers({
  ipcMain,
  ensureDataDir,
  fs,
  path,
  fsPromises,
  fsExtra,
  userWallpapersPath,
  wallpapersFile,
  createWallpaperThumbnail,
  getWallpaperMetadata,
  upsertWallpaperAssetInIndex,
  removeWallpaperAssetFromIndex,
  emitWallpapersUpdated,
}) {
  ipcMain.handle('wallpapers:add', async (_event, { filePath, filename }) => {
    try {
      await ensureDataDir();
      if (!fs.existsSync(userWallpapersPath)) {
        fs.mkdirSync(userWallpapersPath, { recursive: true });
      }
      let base = path.basename(filename, path.extname(filename));
      let ext = path.extname(filename);
      let uniqueName = base + ext;
      let counter = 1;
      while (fs.existsSync(path.join(userWallpapersPath, uniqueName))) {
        uniqueName = `${base}_${counter}${ext}`;
        counter++;
      }
      const destPath = path.join(userWallpapersPath, uniqueName);
      await fsExtra.copy(filePath, destPath);
      const stem = path.basename(uniqueName, path.extname(uniqueName));
      const thumbnailUrl = await createWallpaperThumbnail(destPath, stem);
      const metadata = await getWallpaperMetadata(destPath);
      let data;
      try { data = JSON.parse(await fsPromises.readFile(wallpapersFile, 'utf-8')); } catch { data = {}; }
      if (!data.savedWallpapers) data.savedWallpapers = [];
      const url = `userdata://wallpapers/${uniqueName}`;
      const newWallpaper = {
        url,
        name: filename,
        type: ext.replace('.', ''),
        added: Date.now(),
        thumbnailUrl,
        width: metadata.width,
        height: metadata.height,
        sizeBytes: metadata.sizeBytes,
      };
      data.savedWallpapers.push(newWallpaper);
      data.wallpaper = newWallpaper;
      await fsPromises.writeFile(wallpapersFile, JSON.stringify(data, null, 2), 'utf-8');
      upsertWallpaperAssetInIndex({
        url,
        name: filename,
        type: ext.replace('.', ''),
        sourcePath: destPath,
        sizeBytes: metadata.sizeBytes,
        width: metadata.width,
        height: metadata.height,
        thumbnailUrl,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      emitWallpapersUpdated();
      return { success: true, url, wallpaper: newWallpaper };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('wallpapers:delete', async (_event, { url }) => {
    try {
      if (!url || !url.startsWith('userdata://wallpapers/')) return { success: false, error: 'Invalid wallpaper URL' };
      const filename = url.replace('userdata://wallpapers/', '');
      const filePath = path.join(userWallpapersPath, filename);
      await fsExtra.remove(filePath);
      let data;
      try { data = JSON.parse(await fsPromises.readFile(wallpapersFile, 'utf-8')); } catch { data = {}; }
      data.savedWallpapers = (data.savedWallpapers || []).filter((w) => w.url !== url);
      data.likedWallpapers = (data.likedWallpapers || []).filter((u) => u !== url);
      if (data.wallpaper && data.wallpaper.url === url) data.wallpaper = null;
      await fsPromises.writeFile(wallpapersFile, JSON.stringify(data, null, 2), 'utf-8');
      await removeWallpaperAssetFromIndex(url);
      emitWallpapersUpdated();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('wallpapers:setActive', async (_event, { url }) => {
    try {
      let data;
      try { data = JSON.parse(await fsPromises.readFile(wallpapersFile, 'utf-8')); } catch { data = {}; }
      if (url === null) {
        data.wallpaper = null;
        await fsPromises.writeFile(wallpapersFile, JSON.stringify(data, null, 2), 'utf-8');
        emitWallpapersUpdated();
        return { success: true };
      }
      const found = (data.savedWallpapers || []).find((w) => w.url === url);
      if (!found) return { success: false, error: 'Wallpaper not found' };
      data.wallpaper = found;
      await fsPromises.writeFile(wallpapersFile, JSON.stringify(data, null, 2), 'utf-8');
      emitWallpapersUpdated();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('wallpapers:toggleLike', async (_event, { url }) => {
    try {
      let data;
      try { data = JSON.parse(await fsPromises.readFile(wallpapersFile, 'utf-8')); } catch { data = {}; }
      if (!data.likedWallpapers) data.likedWallpapers = [];
      let liked;
      if (data.likedWallpapers.includes(url)) {
        data.likedWallpapers = data.likedWallpapers.filter((u) => u !== url);
        liked = false;
      } else {
        data.likedWallpapers.push(url);
        liked = true;
      }
      await fsPromises.writeFile(wallpapersFile, JSON.stringify(data, null, 2), 'utf-8');
      emitWallpapersUpdated();
      return { success: true, liked, likedWallpapers: data.likedWallpapers };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('wallpapers:setCyclingSettings', async (_event, settings) => {
    try {
      let data;
      try { data = JSON.parse(await fsPromises.readFile(wallpapersFile, 'utf-8')); } catch { data = {}; }
      data.cyclingSettings = {
        enabled: !!settings.enabled,
        interval: Math.max(2, Math.min(600, Number(settings.interval) || 30)),
        animation: settings.animation || 'fade',
        transitionType: settings.transitionType || 'crossfade',
        slideDirection: settings.slideDirection || 'right',
      };
      await fsPromises.writeFile(wallpapersFile, JSON.stringify(data, null, 2), 'utf-8');
      emitWallpapersUpdated();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  registerWallpaperManagementHandlers,
};
