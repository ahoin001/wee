const { relativeFromPrefixedUrl, resolvePathInsideRoot } = require('../utils/path-guard-utils.cjs');

function registerIconsHandlers({
  ipcMain,
  ensureDataDir,
  fs,
  path,
  fsExtra,
  userIconsPath,
  getUnifiedIcons,
  saveUnifiedIcons,
}) {
  ipcMain.handle('icons:add', async (_event, { filePath, filename }) => {
    try {
      await ensureDataDir();
      if (!fs.existsSync(userIconsPath)) {
        fs.mkdirSync(userIconsPath, { recursive: true });
      }
      const safeFilename = path.basename(filename);
      let base = path.basename(safeFilename, path.extname(safeFilename));
      let ext = path.extname(safeFilename);
      let uniqueName = base + ext;
      let counter = 1;
      while (fs.existsSync(resolvePathInsideRoot(userIconsPath, uniqueName))) {
        uniqueName = `${base}_${counter}${ext}`;
        counter++;
      }
      const destPath = resolvePathInsideRoot(userIconsPath, uniqueName);
      await fsExtra.copy(filePath, destPath);
      const url = `userdata://icons/${uniqueName}`;
      const newIcon = { url, name: filename, added: Date.now() };
      const icons = await getUnifiedIcons();
      await saveUnifiedIcons([...icons, newIcon]);
      return { success: true, icon: newIcon };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('icons:list', async () => {
    try {
      return { success: true, icons: await getUnifiedIcons() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('icons:delete', async (_event, { url }) => {
    try {
      const filename = relativeFromPrefixedUrl(url, 'userdata://icons/');
      const filePath = resolvePathInsideRoot(userIconsPath, filename);
      await fsExtra.remove(filePath);
      const icons = await getUnifiedIcons();
      const filteredIcons = icons.filter((icon) => icon.url !== url);
      await saveUnifiedIcons(filteredIcons);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  registerIconsHandlers,
};
