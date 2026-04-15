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
      let base = path.basename(filename, path.extname(filename));
      let ext = path.extname(filename);
      let uniqueName = base + ext;
      let counter = 1;
      while (fs.existsSync(path.join(userIconsPath, uniqueName))) {
        uniqueName = `${base}_${counter}${ext}`;
        counter++;
      }
      const destPath = path.join(userIconsPath, uniqueName);
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
      if (!url || !url.startsWith('userdata://icons/')) return { success: false, error: 'Invalid icon URL' };
      const filename = url.replace('userdata://icons/', '');
      const filePath = path.join(userIconsPath, filename);
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
