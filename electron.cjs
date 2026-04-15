require('./scripts/load-env.cjs');

const { app, BrowserWindow, ipcMain, shell, protocol, dialog, screen, nativeImage, globalShortcut, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');

const path = require('path');
const { exec, execFile, spawn } = require('child_process');
const fs = require('fs');
const fsPromises = require('fs/promises');
const url = require('url');
const os = require('os');
const { promisify } = require('util');

const fsExtra = require('fs-extra');
const ws = require('windows-shortcuts');
const vdf = require('vdf');

const { registerAllIpcHandlers } = require('./main/ipc/register-all-handlers.cjs');
const { registerInstallerHandlers } = require('./main/ipc/register-installer-handlers.cjs');
const { createGameSourceService } = require('./main/services/game-source-service.cjs');
const { createAppScanService } = require('./main/services/app-scan-service.cjs');
const { createMediaIndexService } = require('./main/services/media-index-service.cjs');
const { createSoundLibraryService } = require('./main/services/sound-library-service.cjs');
const { createAppDataStores } = require('./main/data/create-app-data-stores.cjs');
const { createJsonStorageUtils } = require('./main/utils/json-storage-utils.cjs');
const { setupAutoUpdater } = require('./main/bootstrap/setup-auto-updater.cjs');
const { registerProtocols } = require('./main/bootstrap/register-protocols.cjs');
const { handleSpotifyProtocolUrl } = require('./main/bootstrap/handle-spotify-protocol-url.cjs');
const { setupDisplayEvents } = require('./main/bootstrap/setup-display-events.cjs');
const { createWindowLifecycle } = require('./main/bootstrap/window-lifecycle.cjs');

const wsQuery = promisify(ws.query);

const gameSourceService = createGameSourceService({ fs, path, vdf, os });
const appScanService = createAppScanService({
  fs,
  fsPromises,
  path,
  os,
  nativeImage,
  wsQuery,
});

// --- Version Constants for Manual Fresh Install ---
const CURRENT_VERSION = '2.7.4';
const MIN_VERSION_FOR_FRESH_START = '0.0.0';

// --- Data module helpers ---
const dataDir = path.join(app.getPath('userData'), 'data');
const savedSoundsPath = path.join(dataDir, 'savedSounds.json');
const wallpapersFile = path.join(dataDir, 'wallpapers.json');
const channelsFile = path.join(dataDir, 'channels.json');
const channelConfigsPath = path.join(dataDir, 'channel-configs.json');
const userWallpapersPath = path.join(dataDir, 'wallpapers');
const userSoundsPath = path.join(dataDir, 'sounds');
const userChannelHoverSoundsPath = path.join(dataDir, 'channel-hover-sounds');
const userIconsPath = path.join(dataDir, 'icons');
const userWallpaperThumbnailsPath = path.join(dataDir, 'wallpaper-thumbs');
const mediaIndexDbFile = path.join(dataDir, 'media-index.sqlite');

const { readJson, writeJson, copyFileToUserDirectory } = createJsonStorageUtils({
  fsPromises,
  path,
});

const mediaIndexService = createMediaIndexService({
  fs,
  fsPromises,
  path,
  Database: require('better-sqlite3'),
  sharp: require('sharp'),
  dataDir,
  mediaIndexDbFile,
  userWallpaperThumbnailsPath,
  userWallpapersPath,
});

const {
  upsertWallpaperAssetInIndex,
  removeWallpaperAssetFromIndex,
  createWallpaperThumbnail,
  getWallpaperMetadata,
  hydrateWallpapersFromIndex,
  backfillWallpaperIndex,
} = mediaIndexService;

async function ensureDataDir() {
  await fsPromises.mkdir(dataDir, { recursive: true });
  await fsPromises.mkdir(userWallpapersPath, { recursive: true });
  await fsPromises.mkdir(userSoundsPath, { recursive: true });
  await fsPromises.mkdir(userChannelHoverSoundsPath, { recursive: true });
  await fsPromises.mkdir(userIconsPath, { recursive: true });
  await fsPromises.mkdir(userWallpaperThumbnailsPath, { recursive: true });
  mediaIndexService.ensureMediaIndexReady();
}

const {
  wallpapersData,
  channelsData,
  unifiedData,
  getUnifiedIcons,
  saveUnifiedIcons,
} = createAppDataStores({
  fsPromises,
  ensureDataDir,
  paths: {
    wallpapersFile,
    channelsFile,
    unifiedDataFile: path.join(dataDir, 'unified-data.json'),
  },
  mediaIndex: {
    hydrateWallpapersFromIndex,
    backfillWallpaperIndex,
  },
});

// Sound Management System
const SOUND_TYPES = ['channelClick', 'channelHover', 'backgroundMusic', 'startup'];

// Default sound definitions
const DEFAULT_SOUNDS = {
  channelClick: [
    {
      id: 'default-channelClick-1',
      name: 'Wii Click 1',
      filename: 'wii-click-1.mp3',
      volume: 0.5,
      isDefault: true
    }
  ],
  channelHover: [
    {
      id: 'default-channelHover-1', 
      name: 'Wii Hover 1',
      filename: 'wii-hover-1.mp3',
      volume: 0.3,
      isDefault: true
    }
  ],
  backgroundMusic: [
    {
      id: 'default-backgroundMusic-1',
      name: 'Wii Menu Music',
      filename: 'wii-menu-music.mp3', 
      volume: 0.4,
      isDefault: true
    }
  ],
  startup: [
    {
      id: 'default-startup-1',
      name: 'Wii Startup 1',
      filename: 'wii-startup-1.mp3',
      volume: 0.6,
      isDefault: true
    }
  ]
};


function getDefaultChannels() {
  // 12 empty channels
  const channels = {};
  for (let i = 0; i < 12; i++) {
    channels[`channel-${i}`] = {};
  }
  return channels;
}




// --- Wallpaper IPC Handlers ---

// Emit wallpapers:updated to all renderer processes
function emitWallpapersUpdated() {
  BrowserWindow.getAllWindows().forEach(win => {
    win.webContents.send('wallpapers:updated');
  });
}

// --- IPC: User Icons ---

// --- IPC: Reset to Default ---

// --- Auto-launch (Run at Startup) IPC Handlers ---

// --- App Launching Logic (see launchApp.cjs) ---
const { launchChannelApp } = require('./launchApp.cjs');

// --- Electron Main Window Creation ---
const windowLifecycle = createWindowLifecycle({
  BrowserWindow,
  Menu,
  globalShortcut,
  path,
  process,
  appBasePath: __dirname,
  unifiedData,
});
const {
  getMainWindow,
  getIsFrameless,
  setIsFrameless,
  setIsCurrentlyFullscreen,
  sendWindowState,
  createWindow,
} = windowLifecycle;

const soundLibraryService = createSoundLibraryService({
  process,
  path,
  fsPromises,
  appBasePath: __dirname,
  savedSoundsPath,
  userSoundsPath,
  soundTypes: SOUND_TYPES,
  defaultSounds: DEFAULT_SOUNDS,
  getMainWindow,
  readJson,
  writeJson,
});

const {
  ensureDefaultSoundsExist,
  getDevServerUrl,
  refreshSoundLibraryUrls,
  loadSoundLibrary,
} = soundLibraryService;

app.whenReady().then(async () => {
  console.log('[DEBUG] 🚀 App is ready, starting initialization...');
  
  // Register custom protocol for Spotify OAuth
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('wee-desktop-launcher', process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient('wee-desktop-launcher');
  }
  
  // Spotify backend server removed - using direct client-side API calls
  
  // Check if this is the first run (installer mode)
  const isFirstRun = await checkIfFirstRun();
  
  if (isFirstRun) {
    // Show custom installer
    await showCustomInstaller();
  }
  
  // Ensure default sounds exist in production
  await ensureDefaultSoundsExist();
  
  setupAutoUpdater({
    autoUpdater,
    app,
    getMainWindow,
  });
  
  registerProtocols({
    protocol,
    fsPromises,
    paths: {
      userWallpapersPath,
      userWallpaperThumbnailsPath,
      userSoundsPath,
      userChannelHoverSoundsPath,
      userIconsPath,
    },
    getMainWindow,
  });
  
  // Handle protocol activation (when app is launched via custom protocol)
  app.on('open-url', (event, url) => {
    event.preventDefault();
    console.log('[Spotify Protocol] App launched via protocol:', url);
    handleSpotifyProtocolUrl({ protocolUrl: url, getMainWindow });
  });

  // Handle protocol activation via command line arguments (Windows)
  const gotTheLock = app.requestSingleInstanceLock();
  
  if (!gotTheLock) {
    app.quit();
  } else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      // Someone tried to run a second instance, we should focus our window instead.
      const mainWindow = getMainWindow();
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
      
      // Check if the second instance was launched with a protocol URL
      const protocolUrl = commandLine.find(arg => arg.startsWith('wee-desktop-launcher://'));
      if (protocolUrl) {
        console.log('[Spotify Protocol] Second instance launched with protocol:', protocolUrl);
        handleSpotifyProtocolUrl({ protocolUrl, getMainWindow });
      }
    });
  }
  

  // Installer functions
  async function checkIfFirstRun() {
    try {
      const userDataPath = app.getPath('userData');
      const firstRunFile = path.join(userDataPath, 'first-run-complete.json');
      
      // Check if first run file exists
      const exists = await fsPromises.access(firstRunFile).then(() => true).catch(() => false);
      
      if (!exists) {
        // Create first run file to mark as completed
        await fsPromises.writeFile(firstRunFile, {
          completed: true,
          date: new Date().toISOString(),
          version: app.getVersion()
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking first run status:', error);
      return false;
    }
  }
  
  async function showCustomInstaller() {
    return new Promise((resolve) => {
      const installerWindow = new BrowserWindow({
        width: 800,
        height: 600,
        resizable: false,
        maximizable: false,
        minimizable: false,
        fullscreenable: false,
        show: false,
        frame: false,
        transparent: true,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          enableRemoteModule: true
        }
      });
      
      // Load the installer HTML
      installerWindow.loadFile(path.join(__dirname, 'scripts', 'installer.html'));
      
      installerWindow.once('ready-to-show', () => {
        installerWindow.show();
      });
      
      installerWindow.on('closed', () => {
        resolve();
      });
      
      const unregisterInstallerHandlers = registerInstallerHandlers({
        ipcMain,
        installerWindow,
        createShortcuts,
      });

      installerWindow.on('closed', () => {
        unregisterInstallerHandlers();
      });
    });
  }
  
  async function createShortcuts(options) {
    try {
      if (options.desktop) {
        await createDesktopShortcut();
      }
      
      if (options.startmenu) {
        await createStartMenuShortcut();
      }
      
      if (options.taskbar) {
        await pinToTaskbar();
      }
      
      if (options.autostart) {
        await setupAutoStart();
      }
    } catch (error) {
      console.error('Error creating shortcuts:', error);
    }
  }
  
  async function createDesktopShortcut() {
    try {
      const os = require('os');
      const desktopPath = path.join(os.homedir(), 'Desktop');
      const shortcutPath = path.join(desktopPath, 'WeeDesktopLauncher.lnk');
      const exePath = app.getPath('exe');
      
      const command = `powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('${shortcutPath}'); $Shortcut.TargetPath = '${exePath}'; $Shortcut.Save()"`;
      
      return new Promise((resolve, reject) => {
        exec(command, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    } catch (error) {
      console.error('Error creating desktop shortcut:', error);
    }
  }
  
  async function createStartMenuShortcut() {
    try {
      const os = require('os');
      const startMenuPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs');
      const shortcutPath = path.join(startMenuPath, 'WeeDesktopLauncher.lnk');
      const exePath = app.getPath('exe');
      
      const command = `powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('${shortcutPath}'); $Shortcut.TargetPath = '${exePath}'; $Shortcut.Save()"`;
      
      return new Promise((resolve, reject) => {
        exec(command, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    } catch (error) {
      console.error('Error creating start menu shortcut:', error);
    }
  }
  
  async function pinToTaskbar() {
    try {
      const exePath = app.getPath('exe');
      const command = `powershell -Command "& { $shell = New-Object -ComObject Shell.Application; $shell.NameSpace('shell:::{4234d49b-0245-4df3-b780-3893943456e1}').Items() | Where-Object {$_.Path -eq '${exePath}'} | ForEach-Object {$_.InvokeVerb('taskbarpin')}"}`;
      
      return new Promise((resolve, reject) => {
        exec(command, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    } catch (error) {
      console.error('Error pinning to taskbar:', error);
    }
  }
  
  async function setupAutoStart() {
    try {
      app.setLoginItemSettings({
        openAtLogin: true,
        path: app.getPath('exe')
      });
    } catch (error) {
      console.error('Error setting up auto-start:', error);
    }
  }
  
  await createWindow();
  
  setupDisplayEvents({
    screen,
    getMainWindow,
  });
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow().catch(console.error);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

registerAllIpcHandlers({
  core: {
    ipcMain,
    app,
    autoUpdater,
    BrowserWindow,
    shell,
    dialog,
    process,
    exec,
    ensureDataDir,
  },
  runtime: {
    fs,
    fsPromises,
    fsExtra,
    ws,
    path,
  },
  state: {
    getMainWindow,
    createWindow,
    sendWindowState,
    setIsCurrentlyFullscreen,
    getIsFrameless,
    setIsFrameless,
  },
  paths: {
    userChannelHoverSoundsPath,
    userSoundsPath,
    userWallpapersPath,
    userIconsPath,
    wallpapersFile,
    screen,
  },
  services: {
    data: {
      unifiedData,
      wallpapersData,
      channelsData,
      channelConfigsPath,
    },
    apps: {
      gameSourceService,
      appScanService,
      launchChannelApp,
    },
  },
  wallpaper: {
    createWallpaperThumbnail,
    getWallpaperMetadata,
    upsertWallpaperAssetInIndex,
    removeWallpaperAssetFromIndex,
    emitWallpapersUpdated,
  },
  sounds: {
    soundTypes: SOUND_TYPES,
    loadSoundLibrary,
    writeJson,
    savedSoundsPath,
    copyFileToUserDirectory,
    refreshSoundLibraryUrls,
  },
  icons: {
    getUnifiedIcons,
    saveUnifiedIcons,
  },
  reset: {
    currentVersion: CURRENT_VERSION,
    minVersionForFreshStart: MIN_VERSION_FOR_FRESH_START,
    defaultSounds: DEFAULT_SOUNDS,
    getDevServerUrl,
    getDefaultChannels,
  },
});
