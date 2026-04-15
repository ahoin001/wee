function registerAppScanHandlers({ ipcMain, appScanService }) {
  ipcMain.handle('apps:getInstalled', async () => {
    return await appScanService.getInstalledApps();
  });

  ipcMain.handle('apps:rescanInstalled', async () => {
    return await appScanService.rescanInstalledApps();
  });
}

module.exports = {
  registerAppScanHandlers,
};
