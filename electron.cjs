const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { execFile, spawn } = require('child_process');
const fs = require('fs/promises');

// Paths for persistent storage
const userDataPath = app.getPath('userData');
const settingsPath = path.join(userDataPath, 'settings.json');
const channelConfigsPath = path.join(userDataPath, 'channelConfigs.json');
const savedSoundsPath = path.join(userDataPath, 'savedSounds.json');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(createWindow);

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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
