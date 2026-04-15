function registerMediaFileHandlers({
  ipcMain,
  dialog,
  fsPromises,
  path,
  ensureDataDir,
  fs,
  fsExtra,
  ws,
  getMainWindow,
  paths,
}) {
  const {
    userChannelHoverSoundsPath,
    userSoundsPath,
    userWallpapersPath,
    userIconsPath,
  } = paths;

  ipcMain.handle('wallpaper:selectFile', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        title: 'Select Wallpaper Image',
      });
      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const filename = path.basename(filePath);
        try {
          await fsPromises.access(filePath);
        } catch {
          return { success: false, error: 'Selected file no longer exists. Please try again.' };
        }
        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        const fileExtension = path.extname(filename).toLowerCase();
        if (!validExtensions.includes(fileExtension)) {
          return { success: false, error: `Invalid file type: ${fileExtension}\n\nSupported formats: ${validExtensions.join(', ')}` };
        }
        let fileSize = null;
        try {
          const stats = await fsPromises.stat(filePath);
          fileSize = stats.size;
          if (stats.size > 20 * 1024 * 1024) {
            return { success: false, error: 'File is too large.\n\nMaximum file size is 20MB. Please select a smaller file.' };
          }
          if (stats.size === 0) {
            return { success: false, error: 'File is empty.\n\nPlease select a valid image file.' };
          }
        } catch (error) {
          console.warn(`[WALLPAPER] Could not check file stats: ${error.message}`);
        }
        console.log(`[WALLPAPER] Successfully selected file: ${filename} (${filePath})`);
        return {
          success: true,
          file: {
            path: filePath,
            name: filename,
            size: fileSize,
          },
        };
      }
      return { success: false, error: 'No file selected' };
    } catch (error) {
      return { success: false, error: `Failed to open file dialog: ${error.message}` };
    }
  });

  ipcMain.handle('channels:copyHoverSound', async (_event, { filePath, filename }) => {
    try {
      await ensureDataDir();
      if (!fs.existsSync(userChannelHoverSoundsPath)) {
        fs.mkdirSync(userChannelHoverSoundsPath, { recursive: true });
      }
      let base = path.basename(filename, path.extname(filename));
      let ext = path.extname(filename);
      let uniqueName = base + ext;
      let counter = 1;
      while (fs.existsSync(path.join(userChannelHoverSoundsPath, uniqueName))) {
        uniqueName = `${base}_${counter}${ext}`;
        counter++;
      }
      const destPath = path.join(userChannelHoverSoundsPath, uniqueName);
      await fsExtra.copy(filePath, destPath);
      const url = `userdata://channel-hover-sounds/${uniqueName}`;
      return { success: true, url };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('resolve-userdata-url', async (_event, url) => {
    if (typeof url !== 'string') return url;
    if (url.startsWith('userdata://')) {
      const rel = url.replace('userdata://', '');
      let filePath;
      if (rel.startsWith('sounds/')) {
        filePath = path.join(userSoundsPath, rel.replace(/^sounds[\\\/]/, ''));
      } else if (rel.startsWith('channel-hover-sounds/')) {
        filePath = path.join(userChannelHoverSoundsPath, rel.replace(/^channel-hover-sounds[\\\/]/, ''));
      } else if (rel.startsWith('wallpapers/')) {
        filePath = path.join(userWallpapersPath, rel.replace(/^wallpapers[\\\/]/, ''));
      } else if (rel.startsWith('icons/')) {
        filePath = path.join(userIconsPath, rel.replace(/^icons[\\\/]/, ''));
      }
      if (filePath) {
        return `file://${filePath}`;
      }
    }
    return url;
  });

  ipcMain.handle('icon:selectFile', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'PNG Images', extensions: ['png'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        title: 'Select Icon (PNG)',
      });
      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const filename = path.basename(filePath);
        try {
          await fsPromises.access(filePath);
        } catch {
          return { success: false, error: 'Selected file no longer exists. Please try again.' };
        }
        const validExtensions = ['.png'];
        const fileExtension = path.extname(filename).toLowerCase();
        if (!validExtensions.includes(fileExtension)) {
          return { success: false, error: `Invalid file type: ${fileExtension}\n\nOnly PNG images are supported.` };
        }
        let fileSize = null;
        try {
          const stats = await fsPromises.stat(filePath);
          fileSize = stats.size;
          if (stats.size > 2 * 1024 * 1024) {
            return { success: false, error: 'File is too large. Maximum file size is 2MB.' };
          }
          if (stats.size === 0) {
            return { success: false, error: 'File is empty. Please select a valid PNG file.' };
          }
        } catch {}
        return { success: true, file: { path: filePath, name: filename, size: fileSize } };
      }
      return { success: false, error: 'No file selected' };
    } catch (error) {
      return { success: false, error: `Failed to open file dialog: ${error.message}` };
    }
  });

  ipcMain.handle('select-exe-or-shortcut-file', async () => {
    try {
      console.log('[IPC] Opening file dialog for exe/shortcut selection');
      const result = await dialog.showOpenDialog(getMainWindow(), {
        properties: ['openFile'],
        filters: [
          { name: 'Executables and Shortcuts', extensions: ['exe', 'lnk'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        title: 'Select Application (.exe) or Shortcut (.lnk)',
      });
      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const ext = path.extname(filePath).toLowerCase();
        console.log(`[IPC] Selected file: ${filePath}, extension: ${ext}`);

        if (ext === '.lnk') {
          console.log('[IPC] Resolving shortcut...');
          return new Promise((resolve) => {
            ws.query(filePath, (err, options) => {
              if (err) {
                console.error('[IPC] Failed to resolve shortcut:', err);
                resolve({ success: false, error: `Failed to resolve shortcut: ${err.message}` });
              } else {
                console.log('[IPC] Shortcut resolved:', options);
                resolve({
                  success: true,
                  file: {
                    path: options.target,
                    name: path.basename(options.target),
                    args: options.args || '',
                    shortcut: filePath,
                  },
                });
              }
            });
          });
        }

        console.log('[IPC] Returning executable file');
        return {
          success: true,
          file: {
            path: filePath,
            name: path.basename(filePath),
            args: '',
            shortcut: '',
          },
        };
      }
      console.log('[IPC] No file selected');
      return { success: false, error: 'No file selected' };
    } catch (error) {
      console.error('[IPC] Error in select-exe-or-shortcut-file:', error);
      return { success: false, error: `Failed to open file dialog: ${error.message}` };
    }
  });
}

module.exports = {
  registerMediaFileHandlers,
};
