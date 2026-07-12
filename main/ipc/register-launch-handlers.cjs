const { isTrustedMainWindowEvent } = require('./trusted-renderer-utils.cjs');

function registerLaunchHandlers({
  ipcMain,
  app,
  process,
  launchChannelApp,
  getMainWindow,
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

  ipcMain.handle('launch-app', async (event, payload) => {
    if (!isTrustedMainWindowEvent(event, getMainWindow)) {
      return { ok: false, error: 'Untrusted renderer' };
    }
    try {
      const safePayload = {
        ...payload,
        // Renderer-initiated launches cannot request elevation.
        asAdmin: false,
      };
      return await launchChannelApp(safePayload);
    } catch (err) {
      console.error('[launch-app] handler error:', err);
      return { ok: false, error: err.message || String(err) };
    }
  });
}

module.exports = {
  registerLaunchHandlers,
};
