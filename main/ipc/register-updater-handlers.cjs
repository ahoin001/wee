const { IPC_CHANNELS } = require('../../shared/ipc-channels.cjs');

function registerUpdaterHandlers({ ipcMain, autoUpdater, app }) {
  ipcMain.handle(IPC_CHANNELS.updater.checkForUpdates, async () => {
    try {
      console.log('[AUTO-UPDATE] Manual update check requested');

      if (app.isPackaged === false) {
        console.log('[AUTO-UPDATE] Running in development mode - skipping update check');
        return {
          success: true,
          status: 'no-update',
          message: 'Development mode - updates not available',
        };
      }

      console.log('[AUTO-UPDATE] Starting update check...');

      const updateCheckPromise = new Promise((resolve, reject) => {
        let hasResolved = false;

        const cleanup = () => {
          autoUpdater.removeListener('update-available', onUpdateAvailable);
          autoUpdater.removeListener('update-not-available', onUpdateNotAvailable);
          autoUpdater.removeListener('error', onError);
        };

        const onUpdateAvailable = (info) => {
          if (hasResolved) return;
          hasResolved = true;
          cleanup();
          console.log('[AUTO-UPDATE] Update available in manual check:', info);
          resolve({
            success: true,
            status: 'available',
            version: info.version,
            releaseDate: info.releaseDate,
            releaseNotes: info.releaseNotes,
          });
        };

        const onUpdateNotAvailable = () => {
          if (hasResolved) return;
          hasResolved = true;
          cleanup();
          console.log('[AUTO-UPDATE] No updates available in manual check');
          resolve({
            success: true,
            status: 'no-update',
            message: 'No updates available',
          });
        };

        const onError = (err) => {
          if (hasResolved) return;
          hasResolved = true;
          cleanup();
          console.error('[AUTO-UPDATE] Error in manual check:', err);
          reject(err);
        };

        autoUpdater.once('update-available', onUpdateAvailable);
        autoUpdater.once('update-not-available', onUpdateNotAvailable);
        autoUpdater.once('error', onError);

        autoUpdater.checkForUpdates().catch((err) => {
          if (hasResolved) return;
          hasResolved = true;
          cleanup();
          reject(err);
        });
      });

      const result = await updateCheckPromise;
      console.log('[AUTO-UPDATE] Manual update check completed:', result);
      return result;
    } catch (error) {
      console.error('[AUTO-UPDATE] Error checking for updates:', error);

      if (error.code === 'ENOENT' && error.message.includes('app-update.yml')) {
        console.log('[AUTO-UPDATE] app-update.yml not found - likely development build or missing update config');
        return {
          success: true,
          status: 'no-update',
          message: 'No update configuration found',
        };
      }

      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.updater.downloadUpdate, async () => {
    try {
      console.log('[AUTO-UPDATE] Download update requested');
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error) {
      console.error('[AUTO-UPDATE] Error downloading update:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.updater.installUpdate, async () => {
    try {
      console.log('[AUTO-UPDATE] Install update requested');
      autoUpdater.quitAndInstall();
      return { success: true };
    } catch (error) {
      console.error('[AUTO-UPDATE] Error installing update:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  registerUpdaterHandlers,
};
