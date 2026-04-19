const os = require('os');
const { execFile } = require('child_process');

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
  app,
  paths,
}) {
  const {
    userChannelHoverSoundsPath,
    userSoundsPath,
    userWallpapersPath,
    userIconsPath,
  } = paths;
  const MEDIA_EXTENSIONS = new Set([
    '.mp4',
    '.mkv',
    '.webm',
    '.avi',
    '.mov',
    '.m4v',
    '.wmv',
    '.flv',
    '.mpg',
    '.mpeg',
    '.ts',
    '.mp3',
    '.m4a',
    '.wav',
    '.flac',
    '.aac',
    '.ogg',
    '.opus',
  ]);

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

  ipcMain.handle('mediahub:get-default-library-path', async () => {
    try {
      if (!app?.getPath) {
        return { success: false, error: 'App path API unavailable', path: '' };
      }
      const videosPath = app.getPath('videos');
      return { success: true, path: typeof videosPath === 'string' ? videosPath : '' };
    } catch (error) {
      return { success: false, error: error?.message || 'Failed to resolve default library path', path: '' };
    }
  });

  ipcMain.handle('mediahub:pick-folder', async () => {
    try {
      const result = await dialog.showOpenDialog(getMainWindow(), {
        properties: ['openDirectory', 'createDirectory'],
        title: 'Select Media Folder',
      });
      if (result.canceled || !Array.isArray(result.filePaths) || result.filePaths.length === 0) {
        return { success: false, error: 'No folder selected' };
      }
      return { success: true, folderPath: result.filePaths[0] };
    } catch (error) {
      return { success: false, error: `Failed to open folder dialog: ${error.message}` };
    }
  });

  ipcMain.handle('mediahub:scan-folder', async (_event, args = {}) => {
    const folderPath = typeof args.folderPath === 'string' ? args.folderPath.trim() : '';
    const maxFiles = Math.max(10, Math.min(Number(args.maxFiles) || 300, 2000));
    const maxDepth = Math.max(0, Math.min(Number(args.maxDepth) || 1, 3));
    if (!folderPath) {
      return { success: false, error: 'Missing folderPath', files: [] };
    }

    try {
      const rootStats = await fsPromises.stat(folderPath);
      if (!rootStats.isDirectory()) {
        return { success: false, error: 'Selected path is not a folder', files: [] };
      }

      const files = [];
      const queue = [{ dir: folderPath, depth: 0 }];
      while (queue.length > 0 && files.length < maxFiles) {
        const { dir, depth } = queue.shift();
        const entries = await fsPromises.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (files.length >= maxFiles) break;
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (depth < maxDepth) {
              queue.push({ dir: fullPath, depth: depth + 1 });
            }
            continue;
          }
          if (!entry.isFile()) continue;

          const ext = path.extname(entry.name).toLowerCase();
          if (!MEDIA_EXTENSIONS.has(ext)) continue;

          let size = 0;
          let modifiedAt = null;
          try {
            const stat = await fsPromises.stat(fullPath);
            size = Number(stat.size) || 0;
            modifiedAt = stat.mtime?.toISOString?.() || null;
          } catch {
            // Keep entry even when stats fail to avoid aborting full scan.
          }

          files.push({
            id: `local:${fullPath}`,
            path: fullPath,
            name: entry.name,
            extension: ext,
            size,
            modifiedAt,
            source: 'local',
          });
        }
      }

      return {
        success: true,
        folderPath,
        files,
        scannedAt: new Date().toISOString(),
        truncated: files.length >= maxFiles,
      };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to scan folder', files: [] };
    }
  });

  /**
   * Common install locations for media apps (Windows). Used for “suggested apps” in Media Hub.
   */
  ipcMain.handle('mediahub:detect-suggested-players', async () => {
    const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    const candidates = [
      { id: 'vlc', label: 'VLC media player', path: path.join(programFiles, 'VideoLAN', 'VLC', 'vlc.exe') },
      { id: 'vlc-x86', label: 'VLC media player', path: path.join(programFilesX86, 'VideoLAN', 'VLC', 'vlc.exe') },
      {
        id: 'wmp-legacy',
        label: 'Windows Media Player (legacy)',
        path: path.join(programFilesX86, 'Windows Media Player', 'wmplayer.exe'),
      },
      {
        id: 'wmp-legacy-pf',
        label: 'Windows Media Player (legacy)',
        path: path.join(programFiles, 'Windows Media Player', 'wmplayer.exe'),
      },
    ];
    const seen = new Set();
    const players = [];
    for (const c of candidates) {
      const key = c.path.toLowerCase();
      if (seen.has(key)) continue;
      try {
        await fsPromises.access(c.path);
        seen.add(key);
        players.push({ id: c.id, label: c.label, path: c.path });
      } catch {
        // not installed at this path
      }
    }
    return { success: true, players };
  });

  /**
   * Shows the classic Windows “Open with” dialog for a temp file (same mechanism as Explorer).
   * - http(s): writes a minimal M3U pointing at the URL (apps that handle .m3u appear in the list).
   * - magnet: writes a one-line .magnet file (torrent clients / some players may appear).
   */
  ipcMain.handle('mediahub:open-with-windows-dialog', async (_event, payload = {}) => {
    const uri = typeof payload.uri === 'string' ? payload.uri.trim() : '';
    if (!uri) {
      return { success: false, error: 'No URI' };
    }
    const isMagnet = /^magnet:/i.test(uri);
    const tmpDir = os.tmpdir();
    const base = `wee-mediahub-openwith-${Date.now()}`;
    let tempPath;
    let content;
    if (isMagnet) {
      tempPath = path.join(tmpDir, `${base}.magnet`);
      content = uri;
    } else {
      tempPath = path.join(tmpDir, `${base}.m3u`);
      content = `#EXTM3U\n#EXTINF:-1,Wee Media Hub\n${uri}\n`;
    }
    try {
      await fsPromises.writeFile(tempPath, content, 'utf8');
    } catch (err) {
      return { success: false, error: err?.message || 'Could not write temp file' };
    }
    return new Promise((resolve) => {
      execFile(
        'rundll32.exe',
        ['shell32.dll,OpenAs_RunDLL', tempPath],
        { windowsHide: true },
        (err) => {
          if (err) {
            resolve({ success: false, error: err.message || String(err) });
            return;
          }
          resolve({ success: true, tempPath });
        }
      );
    });
  });
}

module.exports = {
  registerMediaFileHandlers,
};
