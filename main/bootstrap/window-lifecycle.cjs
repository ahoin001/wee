function createWindowLifecycle({
  BrowserWindow,
  Menu,
  globalShortcut,
  path,
  process,
  appBasePath,
  unifiedData,
}) {
  let mainWindow = null;
  let isCurrentlyFullscreen = false;
  let isFrameless = true;

  function getMainWindow() {
    return mainWindow;
  }

  function getIsFrameless() {
    return isFrameless;
  }

  function setIsFrameless(value) {
    isFrameless = Boolean(value);
  }

  function setIsCurrentlyFullscreen(value) {
    isCurrentlyFullscreen = Boolean(value);
  }

  function sendWindowState() {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.webContents.send('fullscreen-state', mainWindow.isFullScreen());
    mainWindow.webContents.send('frame-state', isFrameless);
  }

  function openDevToolsSafe(options) {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    try {
      mainWindow.webContents.openDevTools(options);
    } catch (error) {
      console.error('[WINDOW] Failed to open DevTools:', error);
    }
  }

  function registerDevtoolsMenu() {
    const menu = Menu.buildFromTemplate([
      {
        label: 'Developer',
        submenu: [
          {
            label: 'Toggle Developer Tools',
            accelerator: 'F12',
            click: () => openDevToolsSafe(),
          },
        ],
      },
    ]);
    Menu.setApplicationMenu(menu);
  }

  function registerDevShortcuts() {
    if (process.env.NODE_ENV !== 'development') return;
    try {
      globalShortcut.unregister('CommandOrControl+Shift+I');
      globalShortcut.unregister('F12');
      globalShortcut.register('CommandOrControl+Shift+I', () => openDevToolsSafe({ mode: 'detach' }));
      globalShortcut.register('F12', () => openDevToolsSafe());
    } catch (error) {
      console.error('[WINDOW] Failed to register dev shortcuts:', error);
    }
  }

  async function createWindow(opts = {}) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
      mainWindow = null;
    }

    let shouldStartFullscreen = opts.fullscreen || false;
    if (opts.fullscreen === undefined) {
      try {
        const data = await unifiedData.get();
        shouldStartFullscreen = data?.settings?.ui?.startInFullscreen ?? false;
      } catch {
        shouldStartFullscreen = false;
      }
    }

    mainWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      minWidth: 900,
      minHeight: 600,
      show: true,
      backgroundColor: '#000000',
      frame: opts.frame === undefined ? !isFrameless : opts.frame,
      fullscreen: shouldStartFullscreen,
      webPreferences: {
        preload: path.join(appBasePath, 'preload.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        devTools: true,
        webSecurity: false,
        /** Throttle timers/animations when the window is occluded or backgrounded (wallpaper-style idle target). */
        backgroundThrottling: true,
      },
    });

    if (process.env.NODE_ENV === 'development') {
      mainWindow.loadURL('http://localhost:5173');
      openDevToolsSafe();
      setTimeout(() => openDevToolsSafe({ mode: 'detach' }), 750);
    } else {
      mainWindow.loadFile(path.join(appBasePath, 'dist', 'index.html'));
    }

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
    mainWindow.on('enter-full-screen', () => {
      isCurrentlyFullscreen = true;
      sendWindowState();
    });
    mainWindow.on('leave-full-screen', () => {
      isCurrentlyFullscreen = false;
      sendWindowState();
    });
    mainWindow.once('ready-to-show', () => {
      sendWindowState();
    });

    registerDevtoolsMenu();
    registerDevShortcuts();
  }

  return {
    getMainWindow,
    getIsFrameless,
    setIsFrameless,
    setIsCurrentlyFullscreen,
    sendWindowState,
    createWindow,
  };
}

module.exports = {
  createWindowLifecycle,
};
