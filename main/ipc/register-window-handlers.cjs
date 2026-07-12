const { isTrustedMainWindowEvent } = require('./trusted-renderer-utils.cjs');

function registerWindowHandlers({
  ipcMain,
  app,
  getMainWindow,
  sendWindowState,
  createWindow,
  setIsCurrentlyFullscreen,
  getIsFrameless,
  setIsFrameless,
}) {
  ipcMain.on('close-window', (event) => {
    if (!isTrustedMainWindowEvent(event, getMainWindow)) return;
    app.quit();
  });

  ipcMain.on('toggle-fullscreen', (event) => {
    if (!isTrustedMainWindowEvent(event, getMainWindow)) return;
    const mainWindow = getMainWindow();
    if (!mainWindow) return;
    if (mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false);
      setIsCurrentlyFullscreen(false);
    } else {
      mainWindow.setFullScreen(true);
      setIsCurrentlyFullscreen(true);
    }
    sendWindowState();
  });

  ipcMain.on('set-fullscreen', (event, shouldBeFullscreen) => {
    if (!isTrustedMainWindowEvent(event, getMainWindow)) return;
    const mainWindow = getMainWindow();
    if (!mainWindow) return;
    if (shouldBeFullscreen !== mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(shouldBeFullscreen);
      setIsCurrentlyFullscreen(shouldBeFullscreen);
      sendWindowState();
    }
  });

  ipcMain.handle('set-fullscreen', (event, shouldBeFullscreen) => {
    if (!isTrustedMainWindowEvent(event, getMainWindow)) {
      return { success: false, error: 'Untrusted renderer' };
    }
    const mainWindow = getMainWindow();
    if (!mainWindow) return { success: false, error: 'Window not available' };
    try {
      if (shouldBeFullscreen !== mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(shouldBeFullscreen);
        setIsCurrentlyFullscreen(shouldBeFullscreen);
        sendWindowState();
      }
      return { success: true };
    } catch (error) {
      console.error('[SET-FULLSCREEN] Error setting fullscreen:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.on('toggle-frame', (event) => {
    if (!isTrustedMainWindowEvent(event, getMainWindow)) return;
    const mainWindow = getMainWindow();
    if (!mainWindow) return;
    const bounds = mainWindow.getBounds();
    const wasFullScreen = mainWindow.isFullScreen();
    const nextIsFrameless = !getIsFrameless();
    setIsFrameless(nextIsFrameless);
    createWindow({
      frame: !nextIsFrameless,
      fullscreen: wasFullScreen,
      bounds,
    }).catch(console.error);
  });

  ipcMain.on('minimize-window', (event) => {
    if (!isTrustedMainWindowEvent(event, getMainWindow)) return;
    const mainWindow = getMainWindow();
    if (mainWindow) mainWindow.minimize();
  });
}

module.exports = {
  registerWindowHandlers,
};
