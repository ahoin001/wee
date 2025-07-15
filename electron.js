const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { execFile } = require('child_process');

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
  if (type === 'url') {
    shell.openExternal(appPath);
  } else if (type === 'exe') {
    execFile(appPath, (err) => {
      if (err) {
        console.error('Failed to launch app:', err);
      }
    });
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
