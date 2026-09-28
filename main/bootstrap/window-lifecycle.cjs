function createWindowLifecycle({
  BrowserWindow,
  Menu,
  globalShortcut,
  path,
  process,
  appBasePath,
  unifiedData,
  appUserModelId,
  appDisplayName,
  /** Called once per window after it is first shown (post first paint). */
  onWindowRevealed,
}) {
  let mainWindow = null;
  let isCurrentlyFullscreen = false;
  let isFrameless = true;
  /** Bounds to restore when leaving fullscreen / maximized chrome. */
  let lastWindowedBounds = { width: 1280, height: 800 };
  const isDev = process.env.NODE_ENV === 'development';

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

  function getIsCurrentlyFullscreen() {
    return isCurrentlyFullscreen;
  }

  function captureWindowedBounds(win = mainWindow) {
    if (!win || win.isDestroyed()) return;
    try {
      if (!win.isFullScreen() && !win.isMaximized()) {
        lastWindowedBounds = win.getBounds();
      }
    } catch {
      /* ignore */
    }
  }

  /**
   * Leave exclusive fullscreen and any maximized cover so the shell is truly windowed.
   * Frameless Windows builds often leave a maximized frame after setFullScreen(false),
   * which looks like fullscreen and makes the next toggle re-enter FS.
   */
  function exitToWindowed(win = mainWindow) {
    if (!win || win.isDestroyed()) return;
    try {
      if (win.isFullScreen()) {
        win.setFullScreen(false);
      }
    } catch (error) {
      console.warn('[WINDOW] setFullScreen(false) failed:', error?.message || error);
    }
    try {
      if (win.isMaximized()) {
        win.unmaximize();
      }
    } catch (error) {
      console.warn('[WINDOW] unmaximize failed:', error?.message || error);
    }
    const bounds = lastWindowedBounds || { width: 1280, height: 800 };
    try {
      if (Number.isFinite(bounds.x) && Number.isFinite(bounds.y)) {
        win.setBounds({
          x: bounds.x,
          y: bounds.y,
          width: Math.max(900, bounds.width || 1280),
          height: Math.max(600, bounds.height || 800),
        });
      } else {
        win.setSize(Math.max(900, bounds.width || 1280), Math.max(600, bounds.height || 800));
        win.center();
      }
    } catch (error) {
      console.warn('[WINDOW] restore bounds failed:', error?.message || error);
    }
    isCurrentlyFullscreen = false;
  }

  function enterFullscreen(win = mainWindow) {
    if (!win || win.isDestroyed()) return;
    captureWindowedBounds(win);
    try {
      win.setFullScreen(true);
    } catch (error) {
      console.warn('[WINDOW] setFullScreen(true) failed:', error?.message || error);
    }
    isCurrentlyFullscreen = true;
  }

  function toggleFullscreenMode(win = mainWindow) {
    if (!win || win.isDestroyed()) return false;
    const effectivelyFullscreen = win.isFullScreen() || isCurrentlyFullscreen;
    if (effectivelyFullscreen) {
      exitToWindowed(win);
      return false;
    }
    enterFullscreen(win);
    return true;
  }

  function setFullscreenMode(shouldBeFullscreen, win = mainWindow) {
    if (!win || win.isDestroyed()) return;
    if (shouldBeFullscreen) {
      if (!win.isFullScreen()) {
        enterFullscreen(win);
      } else {
        isCurrentlyFullscreen = true;
      }
      return;
    }
    // Already a normal windowed frame — avoid a needless bounds reset on startup sync.
    if (!win.isFullScreen() && !win.isMaximized() && !isCurrentlyFullscreen) {
      isCurrentlyFullscreen = false;
      return;
    }
    exitToWindowed(win);
  }

  function sendWindowState() {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.webContents.send('fullscreen-state', mainWindow.isFullScreen());
    mainWindow.webContents.send('frame-state', isFrameless);
  }

  /** Renderer uses this to align pause/gating with minimize/focus beyond document visibility alone. */
  function sendAppWindowActivity() {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    try {
      mainWindow.webContents.send('app-window-activity', {
        isMinimized: mainWindow.isMinimized(),
        isFocused: mainWindow.isFocused(),
        isVisible: mainWindow.isVisible(),
      });
    } catch {
      // ignore
    }
  }

  function openDevToolsSafe(options) {
    if (!isDev) return;
    if (!mainWindow || mainWindow.isDestroyed()) return;
    try {
      mainWindow.webContents.openDevTools(options);
    } catch (error) {
      console.error('[WINDOW] Failed to open DevTools:', error);
    }
  }

  function registerDevtoolsMenu() {
    if (!isDev) return;
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
    if (!isDev) return;
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
      captureWindowedBounds(mainWindow);
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

    const startBounds = opts.bounds || lastWindowedBounds || {};
    const width = Math.max(900, startBounds.width || 1280);
    const height = Math.max(600, startBounds.height || 800);

    mainWindow = new BrowserWindow({
      width,
      height,
      x: Number.isFinite(startBounds.x) ? startBounds.x : undefined,
      y: Number.isFinite(startBounds.y) ? startBounds.y : undefined,
      minWidth: 900,
      minHeight: 600,
      /** Revealed on `ready-to-show` so the first visible frame is already painted. */
      show: false,
      backgroundColor: '#000000',
      frame: opts.frame === undefined ? !isFrameless : opts.frame,
      fullscreen: shouldStartFullscreen,
      fullscreenable: true,
      title: appDisplayName || 'Wee',
      webPreferences: {
        preload: path.join(appBasePath, 'preload.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        devTools: isDev,
        webSecurity: true,
        /** Throttle timers/animations when the window is occluded or backgrounded (wallpaper-style idle target). */
        backgroundThrottling: true,
      },
    });

    if (!shouldStartFullscreen && !Number.isFinite(startBounds.x)) {
      try {
        mainWindow.center();
      } catch {
        /* ignore */
      }
    }

    if (process.platform === 'win32' && typeof mainWindow.setAppDetails === 'function' && appUserModelId) {
      try {
        mainWindow.setAppDetails({
          appId: appUserModelId,
          relaunchDisplayName: appDisplayName || 'Wee',
        });
      } catch (err) {
        console.warn('[WINDOW] setAppDetails failed:', err?.message || err);
      }
    }

    if (isDev) {
      mainWindow.loadURL('http://localhost:5173');
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
    mainWindow.on('resize', () => {
      captureWindowedBounds(mainWindow);
    });
    mainWindow.on('move', () => {
      captureWindowedBounds(mainWindow);
    });
    const createdWindow = mainWindow;
    let revealed = false;
    let revealFallback = null;
    const reveal = () => {
      if (revealed || !createdWindow || createdWindow.isDestroyed()) return;
      revealed = true;
      clearTimeout(revealFallback);
      if (!createdWindow.isVisible()) createdWindow.show();
      if (typeof onWindowRevealed === 'function') {
        try {
          onWindowRevealed(createdWindow);
        } catch (error) {
          console.warn('[WINDOW] onWindowRevealed failed:', error?.message || error);
        }
      }
    };
    // Safety net: never leave the app invisible if the renderer stalls before first paint.
    revealFallback = setTimeout(reveal, 5000);

    mainWindow.once('ready-to-show', () => {
      isCurrentlyFullscreen = Boolean(shouldStartFullscreen || mainWindow.isFullScreen());
      if (!shouldStartFullscreen) {
        captureWindowedBounds(mainWindow);
      }
      reveal();
      sendWindowState();
      sendAppWindowActivity();
    });

    mainWindow.on('focus', sendAppWindowActivity);
    mainWindow.on('blur', sendAppWindowActivity);
    mainWindow.on('minimize', sendAppWindowActivity);
    mainWindow.on('restore', sendAppWindowActivity);
    mainWindow.on('show', sendAppWindowActivity);
    mainWindow.on('hide', sendAppWindowActivity);

    registerDevtoolsMenu();
    registerDevShortcuts();
  }

  return {
    getMainWindow,
    getIsFrameless,
    setIsFrameless,
    setIsCurrentlyFullscreen,
    getIsCurrentlyFullscreen,
    sendWindowState,
    createWindow,
    toggleFullscreenMode,
    setFullscreenMode,
    captureWindowedBounds,
    exitToWindowed,
    enterFullscreen,
  };
}

module.exports = {
  createWindowLifecycle,
};
