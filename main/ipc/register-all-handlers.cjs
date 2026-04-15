const { registerCoreDataHandlers } = require('./register-core-data-handlers.cjs');
const { registerUpdaterHandlers } = require('./register-updater-handlers.cjs');
const { registerWindowHandlers } = require('./register-window-handlers.cjs');
const { registerAppShellHandlers } = require('./register-app-shell-handlers.cjs');
const { registerMediaFileHandlers } = require('./register-media-file-handlers.cjs');
const { registerGameSourceHandlers } = require('./register-game-source-handlers.cjs');
const { registerAppScanHandlers } = require('./register-app-scan-handlers.cjs');
const { registerWallpaperFileHandlers } = require('./register-wallpaper-file-handlers.cjs');
const { registerSystemCommandHandlers } = require('./register-system-command-handlers.cjs');
const { registerCaptureHandlers } = require('./register-capture-handlers.cjs');
const { registerFreshInstallHandlers } = require('./register-fresh-install-handlers.cjs');
const { registerMonitorHandlers } = require('./register-monitor-handlers.cjs');
const { registerSystemInfoHandlers } = require('./register-system-info-handlers.cjs');
const { registerChannelConfigHandlers } = require('./register-channel-config-handlers.cjs');
const { registerSoundHandlers } = require('./register-sound-handlers.cjs');
const { registerWallpaperManagementHandlers } = require('./register-wallpaper-management-handlers.cjs');
const { registerIconsHandlers } = require('./register-icons-handlers.cjs');
const { registerResetHandlers } = require('./register-reset-handlers.cjs');
const { registerLaunchHandlers } = require('./register-launch-handlers.cjs');

function registerAllIpcHandlers({
  core,
  runtime,
  state,
  paths,
  services,
  wallpaper,
  sounds,
  icons,
  reset,
}) {
  const { ipcMain, app, autoUpdater, BrowserWindow, shell, dialog, process, exec, ensureDataDir } = core;
  const { fs, fsPromises, fsExtra, ws, path } = runtime;
  const { getMainWindow, createWindow, sendWindowState, setIsCurrentlyFullscreen, getIsFrameless, setIsFrameless } = state;
  const { unifiedData, wallpapersData, channelsData, channelConfigsPath } = services.data;
  const { gameSourceService, appScanService, launchChannelApp } = services.apps;
  const { createWallpaperThumbnail, getWallpaperMetadata, upsertWallpaperAssetInIndex, removeWallpaperAssetFromIndex, emitWallpapersUpdated } = wallpaper;
  const { soundTypes, loadSoundLibrary, writeJson, savedSoundsPath, copyFileToUserDirectory, refreshSoundLibraryUrls } = sounds;
  const { getUnifiedIcons, saveUnifiedIcons } = icons;
  const { currentVersion, minVersionForFreshStart, defaultSounds, getDevServerUrl, getDefaultChannels } = reset;
  const { userSoundsPath, userWallpapersPath } = paths;

  registerCoreDataHandlers({
    ipcMain,
    unifiedData,
    wallpapersData,
    channelsData,
    getMainWindow,
  });

  registerUpdaterHandlers({
    ipcMain,
    autoUpdater,
    app,
  });

  registerWindowHandlers({
    ipcMain,
    app,
    getMainWindow,
    sendWindowState,
    createWindow,
    setIsCurrentlyFullscreen,
    getIsFrameless,
    setIsFrameless,
  });

  registerAppShellHandlers({
    ipcMain,
    BrowserWindow,
    shell,
    app,
    getMainWindow,
  });

  registerMediaFileHandlers({
    ipcMain,
    dialog,
    fsPromises,
    path,
    ensureDataDir,
    fs,
    fsExtra,
    ws,
    getMainWindow,
    paths: {
      userChannelHoverSoundsPath: paths.userChannelHoverSoundsPath,
      userSoundsPath: paths.userSoundsPath,
      userWallpapersPath: paths.userWallpapersPath,
      userIconsPath: paths.userIconsPath,
    },
  });

  registerGameSourceHandlers({
    ipcMain,
    gameSourceService,
    dialog,
  });

  registerAppScanHandlers({
    ipcMain,
    appScanService,
  });

  registerWallpaperFileHandlers({
    ipcMain,
    fsPromises,
    path,
    fs,
    ensureDataDir,
    userWallpapersPath: paths.userWallpapersPath,
    createWallpaperThumbnail,
    getWallpaperMetadata,
    upsertWallpaperAssetInIndex,
  });

  registerSystemCommandHandlers({
    ipcMain,
    exec,
  });

  registerCaptureHandlers({
    ipcMain,
    BrowserWindow,
    dialog,
    fsPromises,
    path,
  });

  registerFreshInstallHandlers({
    ipcMain,
    app,
    path,
    fsPromises,
    fsExtra,
    currentVersion,
    minVersionForFreshStart,
  });

  registerMonitorHandlers({
    ipcMain,
    screen: paths.screen,
    getMainWindow,
  });

  registerSystemInfoHandlers({
    ipcMain,
    exec,
    process,
    getMainWindow,
  });

  registerChannelConfigHandlers({
    ipcMain,
    fsPromises,
    channelConfigsPath,
  });

  registerSoundHandlers({
    ipcMain,
    dialog,
    getMainWindow,
    path,
    fsPromises,
    fs,
    userSoundsPath,
    userWallpapersPath,
    soundTypes,
    loadSoundLibrary,
    writeJson,
    savedSoundsPath,
    copyFileToUserDirectory,
    refreshSoundLibraryUrls,
  });

  registerWallpaperManagementHandlers({
    ipcMain,
    ensureDataDir,
    fs,
    path,
    fsPromises,
    fsExtra,
    userWallpapersPath: paths.userWallpapersPath,
    wallpapersFile: paths.wallpapersFile,
    createWallpaperThumbnail,
    getWallpaperMetadata,
    upsertWallpaperAssetInIndex,
    removeWallpaperAssetFromIndex,
    emitWallpapersUpdated,
  });

  registerIconsHandlers({
    ipcMain,
    ensureDataDir,
    fs,
    path,
    fsExtra,
    userIconsPath: paths.userIconsPath,
    getUnifiedIcons,
    saveUnifiedIcons,
  });

  registerResetHandlers({
    ipcMain,
    unifiedData,
    wallpapersData,
    fsPromises,
    path,
    userSoundsPath,
    userWallpapersPath,
    soundTypes,
    defaultSounds,
    getDevServerUrl,
    writeJson,
    savedSoundsPath,
    channelConfigsPath,
    getDefaultChannels,
  });

  registerLaunchHandlers({
    ipcMain,
    app,
    process,
    launchChannelApp,
  });
}

module.exports = {
  registerAllIpcHandlers,
};
