const { IPC_CHANNELS } = require('../../shared/ipc-channels.cjs');

/** First packaged check shortly after ready so startup popup can appear. */
const FIRST_CHECK_DELAY_MS = 20 * 1000;
const UPDATE_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

function setupAutoUpdater({ autoUpdater, app, getMainWindow }) {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  // Stable clients only consume non-prerelease GitHub Releases.
  autoUpdater.allowPrerelease = false;

  let lastUpdateCheck = 0;

  const checkForUpdatesBackground = async ({ force = false } = {}) => {
    const now = Date.now();
    if (!force && now - lastUpdateCheck < UPDATE_CHECK_INTERVAL_MS) {
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
    setTimeout(() => {
      checkForUpdatesBackground({ force: true });
    }, FIRST_CHECK_DELAY_MS);
    setInterval(() => {
      checkForUpdatesBackground({ force: false });
    }, UPDATE_CHECK_INTERVAL_MS);
  } else {
    console.log('[AUTO-UPDATE] Background update checking disabled in development mode');
  }

  autoUpdater.on('checking-for-update', () => {
    console.log('[AUTO-UPDATE] Checking for updates...');
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send(IPC_CHANNELS.updater.statusEvent, { status: 'checking' });
    }
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[AUTO-UPDATE] Update available:', info);
    const mainWindow = getMainWindow();
    if (mainWindow) {
      const payload = {
        status: 'available',
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
      };
      mainWindow.webContents.send(IPC_CHANNELS.updater.statusEvent, payload);
      mainWindow.webContents.send(IPC_CHANNELS.updater.updateAvailableEvent, payload);
    }
  });

  autoUpdater.on('update-not-available', () => {
    console.log('[AUTO-UPDATE] No updates available');
    const mainWindow = getMainWindow();
    if (mainWindow) {
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
