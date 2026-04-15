function registerLaunchHandlers({
  ipcMain,
  app,
  process,
  launchChannelApp,
}) {
  ipcMain.handle('get-auto-launch', () => {
    const settings = app.getLoginItemSettings();
    return settings.openAtLogin;
  });

  ipcMain.handle('set-auto-launch', (_event, enable) => {
    app.setLoginItemSettings({
      openAtLogin: !!enable,
      path: process.execPath,
      args: [],
    });
    return true;
  });

  ipcMain.handle('launch-app', async (_event, payload) => {
    try {
      return await launchChannelApp(payload);
    } catch (err) {
      console.error('[launch-app] handler error:', err);
      return { ok: false, error: err.message || String(err) };
    }
  });
}

module.exports = {
  registerLaunchHandlers,
};
