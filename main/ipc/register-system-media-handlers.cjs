function registerSystemMediaHandlers({ ipcMain, systemMediaService, getMainWindow }) {
  if (!ipcMain || !systemMediaService) return;

  ipcMain.handle('system-media:get-status', async () => {
    try {
      return { success: true, ...systemMediaService.getStatus() };
    } catch (error) {
      return { success: false, available: false, error: error.message, sessions: [] };
    }
  });

  ipcMain.handle('system-media:start', async () => {
    try {
      const status = await systemMediaService.start();
      return { success: true, ...status };
    } catch (error) {
      return { success: false, available: false, error: error.message, sessions: [] };
    }
  });

  ipcMain.handle('system-media:stop', async () => {
    try {
      await systemMediaService.stop();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('system-media:transport', async (_event, action) => {
    try {
      const result = await systemMediaService.sendMediaKey(action);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Warm status so renderer can know availability without starting the backend.
  try {
    const status = systemMediaService.getStatus();
    const win = typeof getMainWindow === 'function' ? getMainWindow() : null;
    if (win && !win.isDestroyed() && status) {
      // no-op until start; availability is probed on start / get-status
    }
  } catch {
    /* ignore */
  }
}

module.exports = {
  registerSystemMediaHandlers,
};
