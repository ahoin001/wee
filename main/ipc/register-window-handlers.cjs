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
  ipcMain.on('close-window', () => {
    app.quit();
  });

  ipcMain.on('toggle-fullscreen', () => {
    const mainWindow = getMainWindow();
    if (!mainWindow) return;
    console.log('[DEBUG] Toggle fullscreen requested');
    const wasFullScreen = mainWindow.isFullScreen();

    if (wasFullScreen) {
      mainWindow.setFullScreen(false);
      setIsCurrentlyFullscreen(false);

      setTimeout(() => {
        const currentWindow = getMainWindow();
        if (currentWindow && !currentWindow.isDestroyed()) {
          try {
            if (!currentWindow.webContents.isDevToolsOpened()) {
              currentWindow.webContents.openDevTools();
              console.log('[DEBUG] DevTools re-opened after fullscreen toggle');
            }
          } catch (error) {
            console.error('[DEBUG] Error re-opening DevTools after fullscreen toggle:', error);
          }
        }
      }, 300);
    } else {
      mainWindow.setFullScreen(true);
      setIsCurrentlyFullscreen(true);
    }
    sendWindowState();
  });

  ipcMain.on('set-fullscreen', (_event, shouldBeFullscreen) => {
    const mainWindow = getMainWindow();
    if (!mainWindow) return;
    if (shouldBeFullscreen !== mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(shouldBeFullscreen);
      setIsCurrentlyFullscreen(shouldBeFullscreen);
      sendWindowState();
    }
  });

  ipcMain.handle('set-fullscreen', (_event, shouldBeFullscreen) => {
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

  ipcMain.on('toggle-frame', () => {
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

  ipcMain.on('minimize-window', () => {
    const mainWindow = getMainWindow();
    if (mainWindow) mainWindow.minimize();
  });
}

module.exports = {
  registerWindowHandlers,
};
