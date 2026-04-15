const { IPC_CHANNELS } = require('../../shared/ipc-channels.cjs');

function setupAutoUpdater({ autoUpdater, app, getMainWindow }) {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  let lastUpdateCheck = 0;
  const updateCheckInterval = 24 * 60 * 60 * 1000;

  const checkForUpdatesBackground = async () => {
    const now = Date.now();
    if (now - lastUpdateCheck < updateCheckInterval) {
      return;
    }

    try {
      console.log('[AUTO-UPDATE] Background update check started');
      lastUpdateCheck = now;
      await autoUpdater.checkForUpdates();
    } catch (error) {
      console.error('[AUTO-UPDATE] Background update check failed:', error);
    }
  };

  if (app.isPackaged) {
    setTimeout(checkForUpdatesBackground, 5 * 60 * 1000);
    setInterval(checkForUpdatesBackground, updateCheckInterval);
  } else {
    console.log('[AUTO-UPDATE] Background update checking disabled in development mode');
  }

  autoUpdater.on('checking-for-update', () => {
    console.log('[AUTO-UPDATE] Checking for updates...');
    const mainWindow = getMainWindow();
    if (mainWindow) {
      console.log('[AUTO-UPDATE] Sending checking status to renderer');
      mainWindow.webContents.send(IPC_CHANNELS.updater.statusEvent, { status: 'checking' });
    }
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[AUTO-UPDATE] Update available:', info);
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send(IPC_CHANNELS.updater.statusEvent, {
        status: 'available',
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
      });

      mainWindow.webContents.send(IPC_CHANNELS.updater.updateAvailableEvent, {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
      });
    }
  });

  autoUpdater.on('update-not-available', () => {
    console.log('[AUTO-UPDATE] No updates available');
    const mainWindow = getMainWindow();
    if (mainWindow) {
      console.log('[AUTO-UPDATE] Sending not-available status to renderer');
      mainWindow.webContents.send(IPC_CHANNELS.updater.statusEvent, { status: 'not-available' });
      mainWindow.webContents.send(IPC_CHANNELS.updater.updateNotAvailableEvent);
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('[AUTO-UPDATE] Error:', err);
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send(IPC_CHANNELS.updater.statusEvent, {
        status: 'error',
        error: err.message,
      });
    }
  });

  autoUpdater.on('download-progress', (progressObj) => {
    console.log('[AUTO-UPDATE] Download progress:', progressObj.percent);
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send(IPC_CHANNELS.updater.statusEvent, {
        status: 'downloading',
        progress: progressObj.percent,
      });
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AUTO-UPDATE] Update downloaded:', info);
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send(IPC_CHANNELS.updater.statusEvent, {
        status: 'downloaded',
        version: info.version,
      });
    }
  });
}

module.exports = {
  setupAutoUpdater,
};
