const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { execFile, spawn } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadURL('http://localhost:5173');
}

app.whenReady().then(createWindow);

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
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
