function registerSoundHandlers({
  ipcMain,
  dialog,
  getMainWindow,
  path,
  fsPromises,
  fs,
  userSoundsPath,
  userWallpapersPath,
  soundTypes,
  loadSoundLibrary,
  writeJson,
  savedSoundsPath,
  copyFileToUserDirectory,
  refreshSoundLibraryUrls,
}) {
  ipcMain.handle('get-sound-library', async () => {
    try {
      const library = await loadSoundLibrary();
      console.log('[SOUNDS] Loaded sound library:', Object.keys(library).map((k) => `${k}: ${library[k].length} sounds`));
      return library;
    } catch (error) {
      console.error('[SOUNDS] Error getting sound library:', error);
      return {};
    }
  });

  ipcMain.handle('save-sound-library', async (_event, library) => {
    try {
      await writeJson(savedSoundsPath, library);
      console.log('[SOUNDS] Saved sound library');
      return { success: true };
    } catch (error) {
      console.error('[SOUNDS] Error saving sound library:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-saved-sounds', async () => await loadSoundLibrary());
  ipcMain.handle('save-saved-sounds', async (_event, sounds) => await writeJson(savedSoundsPath, sounds));

  ipcMain.handle('select-sound-file', async () => {
    try {
      console.log('[SOUNDS] Opening file dialog for sound selection');
      const result = await dialog.showOpenDialog(getMainWindow(), {
        properties: ['openFile'],
        filters: [
          { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        title: 'Select Audio File',
      });
      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const filename = path.basename(filePath);
        try {
          await fsPromises.access(filePath);
        } catch {
          return { success: false, error: 'Selected file no longer exists. Please try again.' };
        }
        const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
        const fileExtension = path.extname(filename).toLowerCase();
        if (!validExtensions.includes(fileExtension)) {
          return { success: false, error: `Invalid file type: ${fileExtension}\n\nSupported formats: ${validExtensions.join(', ')}` };
        }
        let fileSize = null;
        try {
          const stats = await fsPromises.stat(filePath);
          fileSize = stats.size;
          if (stats.size > 10 * 1024 * 1024) {
            return { success: false, error: 'File is too large.\n\nMaximum file size is 10MB. Please select a smaller file.' };
          }
          if (stats.size === 0) {
            return { success: false, error: 'File is empty.\n\nPlease select a valid audio file.' };
          }
        } catch (error) {
          console.warn(`[SOUNDS] Could not check file stats: ${error.message}`);
        }
        return { success: true, file: { path: filePath, name: filename, size: fileSize } };
      }
      return { success: false, error: 'No file selected' };
    } catch (error) {
      return { success: false, error: `Failed to open file dialog: ${error.message}\n\nPlease try again or restart the application.` };
    }
  });

  ipcMain.handle('add-sound', async (_event, { soundType, file, name }) => {
    try {
      if (!soundTypes.includes(soundType)) return { success: false, error: `Invalid sound type: ${soundType}. Valid types: ${soundTypes.join(', ')}` };
      if (!file || !file.path || !file.name) return { success: false, error: 'Invalid file object provided' };
      try { await fsPromises.access(file.path); } catch { return { success: false, error: `Source file not found: ${file.path}` }; }
      const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
      const fileExtension = path.extname(file.name).toLowerCase();
      if (!validExtensions.includes(fileExtension)) return { success: false, error: `Invalid file type: ${fileExtension}. Supported formats: ${validExtensions.join(', ')}` };
      const stats = await fsPromises.stat(file.path).catch(() => null);
      if (stats?.size > 10 * 1024 * 1024) return { success: false, error: 'File is too large. Maximum size is 10MB.' };
      if (!name || name.trim().length === 0) return { success: false, error: 'Sound name cannot be empty' };
      if (name.length > 50) return { success: false, error: 'Sound name is too long. Maximum length is 50 characters.' };
      const timestamp = Date.now();
      const filename = `user-${soundType}-${timestamp}${fileExtension}`;
      await fsPromises.mkdir(userSoundsPath, { recursive: true });
      const targetPath = await copyFileToUserDirectory(file.path, userSoundsPath, filename);
      const soundId = `user-${soundType}-${timestamp}`;
      const newSound = { id: soundId, name: name.trim(), filename, url: `userdata://sounds/${filename}`, volume: 0.5, enabled: false, isDefault: false };
      const library = await loadSoundLibrary();
      if (!library[soundType]) library[soundType] = [];
      const existingSound = library[soundType].find((s) => s.name.toLowerCase() === name.toLowerCase());
      if (existingSound) return { success: false, error: `A sound with the name "${name}" already exists in ${soundType}` };
      library[soundType].push(newSound);
      try {
        await writeJson(savedSoundsPath, library);
        return { success: true, sound: newSound };
      } catch (error) {
        try { await fsPromises.unlink(targetPath); } catch {}
        return { success: false, error: 'Failed to save sound library. Please try again.' };
      }
    } catch (error) {
      return { success: false, error: `Unexpected error: ${error.message}` };
    }
  });

  ipcMain.handle('remove-sound', async (_event, { soundType, soundId }) => {
    try {
      const library = await loadSoundLibrary();
      if (!library[soundType]) return { success: false, error: 'Sound type not found' };
      const soundIndex = library[soundType].findIndex((s) => s.id === soundId);
      if (soundIndex === -1) return { success: false, error: 'Sound not found' };
      const sound = library[soundType][soundIndex];
      if (sound.isDefault) return { success: false, error: 'Cannot remove default sounds' };
      library[soundType].splice(soundIndex, 1);
      try { await fsPromises.unlink(path.join(userSoundsPath, sound.filename)); } catch {}
      await writeJson(savedSoundsPath, library);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('update-sound', async (_event, { soundType, soundId, updates }) => {
    try {
      const library = await loadSoundLibrary();
      if (!library[soundType]) return { success: false, error: 'Sound type not found' };
      const soundIndex = library[soundType].findIndex((s) => s.id === soundId);
      if (soundIndex === -1) return { success: false, error: 'Sound not found' };
      const sound = library[soundType][soundIndex];
      if (sound.isDefault) {
        const allowedUpdates = ['enabled', 'volume'];
        const invalidUpdates = Object.keys(updates).filter((key) => !allowedUpdates.includes(key));
        if (invalidUpdates.length > 0) return { success: false, error: `Cannot modify ${invalidUpdates.join(', ')} for default sounds` };
      }
      Object.assign(library[soundType][soundIndex], updates);
      await writeJson(savedSoundsPath, library);
      return { success: true, sound: library[soundType][soundIndex] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('sounds:toggleLike', async (_event, { soundId }) => {
    try {
      const library = await loadSoundLibrary();
      if (!library.backgroundMusic) library.backgroundMusic = [];
      const soundIndex = library.backgroundMusic.findIndex((s) => s.id === soundId);
      if (soundIndex === -1) return { success: false, error: 'Sound not found' };
      const wasLiked = library.backgroundMusic[soundIndex].liked || false;
      library.backgroundMusic[soundIndex].liked = !wasLiked;
      await writeJson(savedSoundsPath, library);
      return { success: true, liked: !wasLiked, sound: library.backgroundMusic[soundIndex] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('sounds:setBackgroundMusicSettings', async (_event, settings) => {
    try {
      const library = await loadSoundLibrary();
      if (!library.backgroundMusic) library.backgroundMusic = [];
      library.backgroundMusicSettings = {
        looping: !!settings.looping,
        playlistMode: !!settings.playlistMode,
        enabled: settings.enabled !== undefined ? !!settings.enabled : true,
      };
      await writeJson(savedSoundsPath, library);
      return { success: true, settings: library.backgroundMusicSettings };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('sounds:getBackgroundMusicSettings', async () => {
    try {
      const library = await loadSoundLibrary();
      const settings = library.backgroundMusicSettings || { looping: true, playlistMode: false, enabled: true };
      return { success: true, settings };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('copy-sound-file', async (_event, { sourcePath, filename }) => {
    try {
      const targetPath = await copyFileToUserDirectory(sourcePath, userSoundsPath, filename);
      return { success: true, path: targetPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('copy-wallpaper-file', async (_event, { sourcePath, filename }) => {
    try {
      const targetPath = await copyFileToUserDirectory(sourcePath, userWallpapersPath, filename);
      return { success: true, path: targetPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-user-files', async () => {
    try {
      const [soundFiles, wallpaperFiles] = await Promise.all([
        fsPromises.readdir(userSoundsPath).catch(() => []),
        fsPromises.readdir(userWallpapersPath).catch(() => []),
      ]);
      return {
        sounds: soundFiles.map((file) => path.join(userSoundsPath, file)),
        wallpapers: wallpaperFiles.map((file) => path.join(userWallpapersPath, file)),
      };
    } catch {
      return { sounds: [], wallpapers: [] };
    }
  });

  ipcMain.handle('debug-sounds', async () => {
    const isDev = process.env.NODE_ENV === 'development';
    const debugInfo = {
      isDev,
      userSoundsPath,
      userSoundsFiles: [],
      extraResourcePath: null,
      extraResourceFiles: [],
      defaultSounds: null,
      soundLibrary: null,
      protocolRegistered: false,
      devServerUrl: null,
    };
    try {
      debugInfo.userSoundsFiles = await fsPromises.readdir(userSoundsPath).catch(() => []);
      if (!isDev) {
        const extraResourcePath = path.join(process.resourcesPath, 'public', 'sounds');
        debugInfo.extraResourcePath = extraResourcePath;
        debugInfo.extraResourceFiles = await fsPromises.readdir(extraResourcePath).catch(() => []);
      }
      debugInfo.soundLibrary = await loadSoundLibrary();
      debugInfo.protocolRegistered = true;
      const mainWindow = getMainWindow();
      if (isDev && mainWindow) {
        debugInfo.devServerUrl = mainWindow.webContents.getURL();
      }
      return debugInfo;
    } catch (error) {
      return { error: error.message, ...debugInfo };
    }
  });

  ipcMain.handle('refresh-sound-urls', async () => {
    try {
      await refreshSoundLibraryUrls();
      const library = await loadSoundLibrary();
      return { success: true, library };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('copy-wallpaper-to-user-directory', async (_event, { filePath, filename }) => {
    try {
      if (!fs.existsSync(userWallpapersPath)) {
        fs.mkdirSync(userWallpapersPath, { recursive: true });
      }
      const destPath = path.join(userWallpapersPath, filename);
      await fsPromises.copyFile(filePath, destPath);
      return { success: true, url: `userdata://wallpapers/${filename}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('select-wallpaper-file', async () => {
    try {
      const result = await dialog.showOpenDialog(getMainWindow(), {
        properties: ['openFile'],
        filters: [
          { name: 'Images & Videos', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'mp4', 'webm', 'mov', 'avi', 'mkv'] },
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] },
          { name: 'Videos', extensions: ['mp4', 'webm', 'mov', 'avi', 'mkv'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        title: 'Select Wallpaper Image or Video',
      });
      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const filename = path.basename(filePath);
        try { await fsPromises.access(filePath); } catch { return { success: false, error: 'Selected file no longer exists. Please try again.' }; }
        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.mp4', '.webm', '.mov', '.avi', '.mkv'];
        const fileExtension = path.extname(filename).toLowerCase();
        if (!validExtensions.includes(fileExtension)) {
          return { success: false, error: `Invalid file type: ${fileExtension}\n\nSupported formats: ${validExtensions.join(', ')}` };
        }
        let fileSize = null;
        try {
          const stats = await fsPromises.stat(filePath);
          fileSize = stats.size;
          if (stats.size > 20 * 1024 * 1024) return { success: false, error: 'File is too large.\n\nMaximum file size is 20MB. Please select a smaller file.' };
          if (stats.size === 0) return { success: false, error: 'File is empty.\n\nPlease select a valid image or video file.' };
        } catch {}
        return { success: true, file: { path: filePath, name: filename, size: fileSize } };
      }
      return { success: false, error: 'No file selected' };
    } catch (error) {
      return { success: false, error: `Failed to open file dialog: ${error.message}\n\nPlease try again or restart the application.` };
    }
  });
}

module.exports = {
  registerSoundHandlers,
};
