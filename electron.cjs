const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { execFile, spawn } = require('child_process');
const fs = require('fs/promises');

// Paths for persistent storage
const userDataPath = app.getPath('userData');
const settingsPath = path.join(userDataPath, 'settings.json');
const channelConfigsPath = path.join(userDataPath, 'channelConfigs.json');
const savedSoundsPath = path.join(userDataPath, 'savedSounds.json');

let mainWindow = null;
let isCurrentlyFullscreen = true;
let isFrameless = true;

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

app.whenReady().then(() => createWindow({ frame: false, fullscreen: true }));

// --- Persistent Storage IPC Handlers ---

// Helper: Read JSON file, return defaultValue if not found or error
async function readJson(filePath, defaultValue) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return defaultValue;
  }
}

// Helper: Write JSON file
async function writeJson(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    return false;
  }
}

ipcMain.handle('get-settings', async () => {
  return await readJson(settingsPath, null);
});
ipcMain.handle('save-settings', async (event, settings) => {
  return await writeJson(settingsPath, settings);
});
ipcMain.handle('get-channel-configs', async () => {
  return await readJson(channelConfigsPath, null);
});
ipcMain.handle('save-channel-configs', async (event, configs) => {
  return await writeJson(channelConfigsPath, configs);
});
ipcMain.handle('get-saved-sounds', async () => {
  return await readJson(savedSoundsPath, null);
});
ipcMain.handle('save-saved-sounds', async (event, sounds) => {
  return await writeJson(savedSoundsPath, sounds);
});

// --- App Launching Logic ---
ipcMain.on('launch-app', (event, { type, path: appPath }) => {
  console.log(`Launching app: type=${type}, path=${appPath}`);

  if (type === 'url') {
    // Open URL in default browser
    shell.openExternal(appPath).catch(err => {
      console.error('Failed to open URL:', err);
    });
  } else if (type === 'exe') {
    // Launch executable on Windows
    try {
      // Use spawn for better Windows compatibility
      const child = spawn(appPath, [], {
        detached: true,
        stdio: 'ignore',
        shell: true // This helps with Windows path resolution
      });

      child.on('error', (err) => {
        console.error('Failed to launch executable:', err);
      });

      child.on('spawn', () => {
        console.log('Executable launched successfully');
        // Unref to prevent the child process from keeping the parent alive
        child.unref();
      });

    } catch (err) {
      console.error('Failed to launch executable:', err);
    }
  } else {
    // Fallback: try to open as file or URL
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
