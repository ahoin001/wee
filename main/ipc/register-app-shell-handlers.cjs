function registerAppShellHandlers({
  ipcMain,
  BrowserWindow,
  shell,
  app,
  getMainWindow,
}) {
  ipcMain.on('open-pip-window', (_event, urlToOpen) => {
    const pipWindow = new BrowserWindow({
      width: 900,
      height: 600,
      minWidth: 400,
      minHeight: 300,
      frame: false,
      alwaysOnTop: false,
      resizable: true,
      movable: true,
      show: true,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    pipWindow.loadURL(urlToOpen);
    pipWindow.setMenuBarVisibility(false);
  });

  ipcMain.on('open-external-url', (_event, urlToOpen) => {
    shell.openExternal(urlToOpen);
  });

  /** Promise-based openExternal for UI that needs success/error (e.g. Media Hub stream modal). */
  ipcMain.handle('open-external-url-invoke', async (_event, urlToOpen) => {
    const s = String(urlToOpen || '').trim();
    if (!s) return { ok: false, error: 'No URL provided' };
    try {
      await shell.openExternal(s);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle('get-fullscreen-state', async () => {
    const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
    return win ? win.isFullScreen() : false;
  });

  ipcMain.handle('get-app-version', async () => app.getVersion());

  ipcMain.handle('open-dev-tools', async () => {
    console.log('[DEBUG] 🔧 IPC: open-dev-tools called');
    try {
      const mainWindow = getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        const isFullscreen = mainWindow.isFullScreen();
        console.log('[DEBUG] 🔧 IPC: Window fullscreen state:', isFullscreen);

        if (!isFullscreen) {
          mainWindow.focus();
          console.log('[DEBUG] 🔧 IPC: Window focused for DevTools');
        }

        try {
          mainWindow.webContents.openDevTools();
          console.log('[DEBUG] 🔧 IPC: Standard DevTools opened');
        } catch (standardError) {
          console.error('[DEBUG] 🔧 IPC: Standard DevTools failed:', standardError);
        }

        if (!isFullscreen) {
          setTimeout(() => {
            const currentWindow = getMainWindow();
            if (currentWindow && !currentWindow.isDestroyed()) {
              try {
                currentWindow.webContents.openDevTools({ mode: 'detach' });
                console.log('[DEBUG] 🔧 IPC: Detached DevTools opened for windowed mode');

                setTimeout(() => {
                  try {
                    const allWindows = BrowserWindow.getAllWindows();
                    const devToolsWindow = allWindows.find((w) =>
                      w.getTitle().includes('Developer Tools') || w.getTitle().includes('DevTools')
                    );
                    if (devToolsWindow) {
                      devToolsWindow.focus();
                      devToolsWindow.moveTop();
                      console.log('[DEBUG] 🔧 IPC: DevTools window brought to front');
                    }
                  } catch (frontError) {
                    console.error('[DEBUG] 🔧 IPC: Error bringing DevTools to front:', frontError);
                  }
                }, 100);
              } catch (detachError) {
                console.error('[DEBUG] 🔧 IPC: Detached DevTools failed:', detachError);
                try {
                  currentWindow.webContents.openDevTools({ mode: 'right' });
                  console.log('[DEBUG] 🔧 IPC: Right mode DevTools opened as fallback');
                } catch (rightError) {
                  console.error('[DEBUG] 🔧 IPC: Right mode DevTools failed:', rightError);
                }
              }
            }
          }, 200);
        }

        return { success: true, message: 'Developer tools opened' };
      }
      console.log('[DEBUG] 🔧 IPC: Window not available');
      return { success: false, message: 'Window not available' };
    } catch (error) {
      console.error('[DEBUG] 🔧 IPC: Error opening DevTools:', error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle('force-dev-tools', async () => {
    console.log('[DEBUG] 🔧 IPC: force-dev-tools called');
    try {
      const mainWindow = getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        const isFullscreen = mainWindow.isFullScreen();
        console.log('[DEBUG] 🔧 IPC: Force DevTools - Window fullscreen state:', isFullscreen);

        if (!isFullscreen) {
          mainWindow.focus();
          console.log('[DEBUG] 🔧 IPC: Force DevTools - Window focused');
        }

        try {
          mainWindow.webContents.openDevTools();
          console.log('[DEBUG] 🔧 IPC: Force DevTools - Standard method');
        } catch (standardError) {
          console.error('[DEBUG] 🔧 IPC: Force DevTools - Standard method failed:', standardError);
        }

        if (!isFullscreen) {
          setTimeout(() => {
            const currentWindow = getMainWindow();
            if (currentWindow && !currentWindow.isDestroyed()) {
              try {
                currentWindow.webContents.openDevTools({ mode: 'detach' });
                console.log('[DEBUG] 🔧 IPC: Force DevTools - Detached mode opened');

                setTimeout(() => {
                  try {
                    const allWindows = BrowserWindow.getAllWindows();
                    const devToolsWindow = allWindows.find((w) =>
                      w.getTitle().includes('Developer Tools') || w.getTitle().includes('DevTools')
                    );
                    if (devToolsWindow) {
                      devToolsWindow.focus();
                      devToolsWindow.moveTop();
                      devToolsWindow.show();
                      console.log('[DEBUG] 🔧 IPC: Force DevTools - DevTools window brought to front');
                    }
                  } catch (frontError) {
                    console.error('[DEBUG] 🔧 IPC: Force DevTools - Error bringing to front:', frontError);
                  }
                }, 100);
              } catch (detachError) {
                console.error('[DEBUG] 🔧 IPC: Force DevTools - Detached mode failed:', detachError);
                try {
                  currentWindow.webContents.openDevTools({ mode: 'right' });
                  console.log('[DEBUG] 🔧 IPC: Force DevTools - Right mode fallback');
                } catch (rightError) {
                  console.error('[DEBUG] 🔧 IPC: Force DevTools - Right mode failed:', rightError);
                }
              }
            }
          }, 200);
        }

        setTimeout(() => {
          const currentWindow = getMainWindow();
          if (currentWindow && !currentWindow.isDestroyed()) {
            try {
              currentWindow.focus();
              currentWindow.webContents.focus();
              console.log('[DEBUG] 🔧 IPC: Force DevTools - Window and WebContents focused');
            } catch (focusError) {
              console.error('[DEBUG] 🔧 IPC: Force DevTools - Focus error:', focusError);
            }
          }
        }, 300);

        console.log('[DEBUG] 🔧 IPC: Force DevTools completed');
        return { success: true, message: 'Developer tools forced open' };
      }

      console.log('[DEBUG] 🔧 IPC: Window not available for force');
      return { success: false, message: 'Window not available' };
    } catch (error) {
      console.error('[DEBUG] 🔧 IPC: Error forcing DevTools:', error);
      try {
        console.log('[DEBUG] 🔧 IPC: Attempting fallback DevTools window...');
        const devToolsWindow = new BrowserWindow({
          width: 1200,
          height: 800,
          title: 'Developer Tools - Fallback',
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
          },
        });
        devToolsWindow.webContents.openDevTools();
        devToolsWindow.focus();
        console.log('[DEBUG] 🔧 IPC: Fallback DevTools window created');
        return { success: true, message: 'Developer tools opened in fallback window' };
      } catch (fallbackError) {
        console.error('[DEBUG] 🔧 IPC: Fallback DevTools failed:', fallbackError);
        return { success: false, message: error.message };
      }
    }
  });

  ipcMain.handle('closeApp', async () => {
    console.log('[SYSTEM] IPC: closeApp called - shutting down application');
    try {
      const mainWindow = getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.close();
      }

      setTimeout(() => {
        app.quit();
      }, 100);

      return { success: true, message: 'Application closing' };
    } catch (error) {
      console.error('[SYSTEM] Error closing app:', error);
      app.quit();
      return { success: true, message: 'Application force closed' };
    }
  });
}

module.exports = {
  registerAppShellHandlers,
};
