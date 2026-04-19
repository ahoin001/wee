const { runExclusive } = require('../services/scan-serialization.cjs');

function registerAppScanHandlers({ ipcMain, appScanService }) {
  ipcMain.handle('apps:getInstalled', async () => {
    return runExclusive(() => appScanService.getInstalledApps());
  });

  ipcMain.handle('apps:rescanInstalled', async () => {
    return runExclusive(() => appScanService.rescanInstalledApps());
  });
}

module.exports = {
  registerAppScanHandlers,
};
