const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { execFile, spawn } = require('child_process');
const fs = require('fs/promises');

// Paths for persistent storage
const userDataPath = app.getPath('userData');
const settingsPath = path.join(userDataPath, 'settings.json');
const channelConfigsPath = path.join(userDataPath, 'channelConfigs.json');
const savedSoundsPath = path.join(userDataPath, 'savedSounds.json');

// User file directories
const userSoundsPath = path.join(userDataPath, 'sounds');
const userWallpapersPath = path.join(userDataPath, 'wallpapers');

let mainWindow = null;
let isCurrentlyFullscreen = true;
let isFrameless = true;

// Ensure user directories exist
async function ensureUserDirectories() {
  try {
    await fs.mkdir(userSoundsPath, { recursive: true });
    await fs.mkdir(userWallpapersPath, { recursive: true });
  } catch (err) {
    console.error('Failed to create user directories:', err);
  }
}

function sendWindowState() {
  if (mainWindow) {
    mainWindow.webContents.send('fullscreen-state', isCurrentlyFullscreen);
    mainWindow.webContents.send('frame-state', !isFrameless);
  }
}

function createWindow({ frame = false, fullscreen = true, bounds = null } = {}) {
  // If bounds are provided, use them; otherwise, use defaults
  const options = {
    width: 1280,
    height: 720,
    frame: frame,
    fullscreen: fullscreen,
    webPreferences: {
      autoHideMenuBar: true, // press alt to show,
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  };
  if (bounds) {
    options.x = bounds.x;
    options.y = bounds.y;
    options.width = bounds.width;
    options.height = bounds.height;
  }

  if (mainWindow) {
    mainWindow.destroy();
  }
  mainWindow = new BrowserWindow(options);
  mainWindow.setMenu(null);

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  isCurrentlyFullscreen = fullscreen;
  isFrameless = !frame;

  // Send drag-region state to renderer
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('update-drag-region', isFrameless && !isCurrentlyFullscreen);
    sendWindowState();
  });
}

app.whenReady().then(async () => {
  console.log('User data is stored at:', app.getPath('userData'));
  await ensureUserDirectories();
  createWindow({ frame: false, fullscreen: true });
});

// Log user data paths on startup
console.log('Electron userDataPath:', userDataPath);
console.log('Settings path:', settingsPath);
console.log('Channel configs path:', channelConfigsPath);
console.log('Saved sounds path:', savedSoundsPath);
console.log('User sounds path:', userSoundsPath);
console.log('User wallpapers path:', userWallpapersPath);

// --- Persistent Storage IPC Handlers ---

// Helper: Read JSON file, return defaultValue if not found or error
async function readJson(filePath, defaultValue) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    console.log(`[READ] Successfully read file: ${filePath}`);
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn(`[READ] File not found: ${filePath}`);
    } else if (err.code === 'EACCES') {
      console.error(`[READ] Permission denied: ${filePath}`);
    } else {
      console.error(`[READ] Error reading file ${filePath}:`, err);
    }
    return defaultValue;
  }
}

// Helper: Write JSON file
async function writeJson(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[WRITE] Successfully wrote file: ${filePath}`);
    return true;
  } catch (err) {
    if (err.code === 'EACCES') {
      console.error(`[WRITE] Permission denied: ${filePath}`);
    } else {
      console.error(`[WRITE] Error writing file ${filePath}:`, err);
    }
    return false;
  }
}

// Helper: Copy file to user directory and return new path
async function copyFileToUserDirectory(sourcePath, targetDirectory, filename) {
  try {
    const targetPath = path.join(targetDirectory, filename);
    await fs.copyFile(sourcePath, targetPath);
    console.log(`[COPY] Copied file to: ${targetPath}`);
    return targetPath;
  } catch (err) {
    console.error(`[COPY] Failed to copy file:`, err);
    throw err;
  }
}

// Helper: Get default sounds from app resources
function getDefaultSounds() {
  const isDev = process.env.NODE_ENV === 'development';
  let basePath;
  
  if (isDev) {
    basePath = path.join(__dirname, 'public');
  } else {
    // In production, sounds are in the extraResource folder
    basePath = path.join(process.resourcesPath, 'public', 'sounds');
  }
  
  return {
    channelClick: [
      { 
        id: 'default-click-1',
        name: 'Wii Click 1', 
        url: isDev ? '/sounds/wii-click-1.mp3' : `file://${path.join(basePath, 'wii-click-1.mp3')}`,
        volume: 0.5,
        isDefault: true
      }
    ],
    channelHover: [
      { 
        id: 'default-hover-1',
        name: 'Wii Hover 1', 
        url: isDev ? '/sounds/wii-hover-1.mp3' : `file://${path.join(basePath, 'wii-hover-1.mp3')}`,
        volume: 0.3,
        isDefault: true
      }
    ],
    backgroundMusic: [
      { 
        id: 'default-music-1',
        name: 'Wii Menu Music', 
        url: isDev ? '/sounds/wii-menu-music.mp3' : `file://${path.join(basePath, 'wii-menu-music.mp3')}`,
        volume: 0.4,
        isDefault: true
      }
    ],
    startup: [
      { 
        id: 'default-startup-1',
        name: 'Wii Startup 1', 
        url: isDev ? '/sounds/wii-startup-1.mp3' : `file://${path.join(basePath, 'wii-startup-1.mp3')}`,
        volume: 0.6,
        isDefault: true
      }
    ]
  };
}

ipcMain.handle('get-settings', async () => {
  return await readJson(settingsPath, null);
});

ipcMain.handle('save-settings', async (event, settings) => {
  return await writeJson(settingsPath, settings);
});

ipcMain.handle('get-channel-configs', async () => {
  try {
    await fs.access(channelConfigsPath);
    const data = await fs.readFile(channelConfigsPath, 'utf-8');
    console.log(`[READ] Successfully read file: ${channelConfigsPath}`);
    const parsed = JSON.parse(data);
    // Return empty object if file is empty or contains invalid data
    if (!parsed || typeof parsed !== 'object') {
      console.warn(`[READ] Channel configs file is empty or invalid, returning empty object`);
      return {};
    }
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`[READ] Channel configs file not found: ${channelConfigsPath}`);
    } else if (error.code === 'EACCES') {
      console.error(`[READ] Permission denied: ${channelConfigsPath}`);
    } else {
      console.error(`[READ] Error reading channel configs:`, error);
    }
    // Don't create default file if it doesn't exist - let the app handle empty state
    return {};
  }
});

ipcMain.handle('save-channel-configs', async (event, configs) => {
  try {
    await fs.writeFile(channelConfigsPath, JSON.stringify(configs, null, 2));
    console.log(`[WRITE] Successfully wrote file: ${channelConfigsPath}`);
    return { success: true };
  } catch (error) {
    if (error.code === 'EACCES') {
      console.error(`[WRITE] Permission denied: ${channelConfigsPath}`);
    } else {
      console.error('Failed to save channel configs:', error);
    }
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-saved-sounds', async () => {
  try {
    const saved = await readJson(savedSoundsPath, null);
    if (!saved) {
      // Return default sounds if no saved sounds exist
      const defaultSounds = getDefaultSounds();
      await writeJson(savedSoundsPath, defaultSounds);
      return defaultSounds;
    }
    return saved;
  } catch (error) {
    console.error('Error loading saved sounds:', error);
    // Return default sounds as fallback
    return getDefaultSounds();
  }
});

ipcMain.handle('save-saved-sounds', async (event, sounds) => {
  return await writeJson(savedSoundsPath, sounds);
});

// New IPC handlers for file management
ipcMain.handle('copy-sound-file', async (event, { sourcePath, filename }) => {
  try {
    const targetPath = await copyFileToUserDirectory(sourcePath, userSoundsPath, filename);
    return { success: true, path: targetPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('copy-wallpaper-file', async (event, { sourcePath, filename }) => {
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
      fs.readdir(userSoundsPath).catch(() => []),
      fs.readdir(userWallpapersPath).catch(() => [])
    ]);
    
    return {
      sounds: soundFiles.map(file => path.join(userSoundsPath, file)),
      wallpapers: wallpaperFiles.map(file => path.join(userWallpapersPath, file))
    };
  } catch (error) {
    console.error('Error reading user files:', error);
    return { sounds: [], wallpapers: [] };
  }
});

// --- App Launching Logic ---
ipcMain.on('launch-app', (event, { type, path: appPath, asAdmin }) => {
  console.log(`Launching app: type=${type}, path=${appPath}, asAdmin=${asAdmin}`);

  if (type === 'url') {
    shell.openExternal(appPath).catch(err => {
      console.error('Failed to open URL:', err);
    });
  } else if (type === 'exe') {
    try {
      if (asAdmin) {
        // Launch as admin using PowerShell
        const command = `Start-Process -FilePath \"${appPath.replace(/"/g, '\"')}\" -Verb RunAs`;
        const child = spawn('powershell', ['-Command', command], {
          detached: true,
          stdio: 'ignore',
          shell: true
        });
        child.on('error', (err) => {
          console.error('Failed to launch executable as admin:', err);
        });
        child.on('spawn', () => {
          console.log('Executable launched as admin successfully');
          child.unref();
        });
      } else {
        // Normal launch
        const child = spawn(appPath, [], {
          detached: true,
          stdio: 'ignore',
          shell: true
        });
        child.on('error', (err) => {
          console.error('Failed to launch executable:', err);
        });
        child.on('spawn', () => {
          console.log('Executable launched successfully');
          child.unref();
        });
      }
    } catch (err) {
      console.error('Failed to launch executable:', err);
    }
  } else {
    shell.openPath(appPath).catch(err => {
      console.error('Failed to open path:', err);
    });
  }
});

// IPC handler for toggling fullscreen/windowed mode
ipcMain.on('toggle-fullscreen', () => {
  if (!mainWindow) return;
  if (isCurrentlyFullscreen) {
    mainWindow.setFullScreen(false);
    mainWindow.setSize(1920, 1080);
    mainWindow.center();
    isCurrentlyFullscreen = false;
  } else {
    mainWindow.setFullScreen(true);
    isCurrentlyFullscreen = true;
  }
  // Update drag region
  mainWindow.webContents.send('update-drag-region', isFrameless && !isCurrentlyFullscreen);
  sendWindowState();
});

// IPC handler for toggling window frame
ipcMain.on('toggle-frame', () => {
  if (!mainWindow) return;
  const bounds = mainWindow.getBounds();
  const wasFullScreen = mainWindow.isFullScreen();
  // Only recreate if needed
  createWindow({
    frame: isFrameless, // toggle
    fullscreen: wasFullScreen,
    bounds,
  });
  // sendWindowState will be called after load
});

// IPC handler for minimizing window
ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

// IPC handler for closing window
ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
