const { contextBridge, ipcRenderer } = require('electron');
const appWindowActivityListenerMap = new WeakMap();
const updateStatusListenerMap = new WeakMap();
const updateNotificationAvailableListenerMap = new WeakMap();
const updateNotificationNotAvailableListenerMap = new WeakMap();
const updateNotificationDismissedListenerMap = new WeakMap();
const updateNotificationInstallListenerMap = new WeakMap();

const addMappedListener = (channel, cb, listenerMap, wrap) => {
  if (typeof cb !== 'function') return;
  const existing = listenerMap.get(cb);
  if (existing) {
    ipcRenderer.removeListener(channel, existing);
  }
  const wrapped = wrap(cb);
  listenerMap.set(cb, wrapped);
  ipcRenderer.on(channel, wrapped);
};

const removeMappedListener = (channel, cb, listenerMap) => {
  const wrapped = listenerMap.get(cb);
  if (!wrapped) return;
  ipcRenderer.removeListener(channel, wrapped);
  listenerMap.delete(cb);
};
const IPC_CHANNELS = {
  data: {
    get: 'data:get',
    set: 'data:set',
    patchSettings: 'data:patch-settings',
  },
  wallpapers: {
    get: 'wallpapers:get',
    set: 'wallpapers:set',
    reset: 'wallpapers:reset',
    getMonitorWallpaper: 'wallpapers:getMonitorWallpaper',
    setMonitorWallpaper: 'wallpapers:setMonitorWallpaper',
    getMonitorSettings: 'wallpapers:getMonitorSettings',
    setMonitorSettings: 'wallpapers:setMonitorSettings',
  },
  channels: {
    get: 'channels:get',
    set: 'channels:set',
    reset: 'channels:reset',
  },
  updateNotification: {
    dismiss: 'update-notification:dismiss',
    installUpdate: 'update-notification:install-update',
    dismissedEvent: 'update-notification-dismissed',
    installEvent: 'update-notification-install',
  },
  updater: {
    checkForUpdates: 'check-for-updates',
    downloadUpdate: 'download-update',
    installUpdate: 'install-update',
    statusEvent: 'update-status',
    updateAvailableEvent: 'update-notification-available',
    updateNotAvailableEvent: 'update-notification-not-available',
  },
};

contextBridge.exposeInMainWorld('api', {
  // Unified data API - single source of truth
  data: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.data.get),
    set: (data) => ipcRenderer.invoke(IPC_CHANNELS.data.set, data),
    /**
     * Patch-based settings write. Sends only the canonical settings delta to main;
     * main-process store merges + batches writes to `unified-data.json`.
     * Avoids the full read-merge-write round-trip on the renderer side.
     */
    patchSettings: (patch) => ipcRenderer.invoke(IPC_CHANNELS.data.patchSettings, patch),
  },
  channels: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.channels.get),
    set: (data) => ipcRenderer.invoke(IPC_CHANNELS.channels.set, data),
  },
  sounds: {
    add: (args) => ipcRenderer.invoke('add-sound', args),
    remove: (args) => ipcRenderer.invoke('remove-sound', args),
    update: (args) => ipcRenderer.invoke('update-sound', args),
    getLibrary: () => ipcRenderer.invoke('get-sound-library'),
    selectFile: () => ipcRenderer.invoke('select-sound-file'),
    toggleLike: (args) => ipcRenderer.invoke('sounds:toggleLike', args),
    setBackgroundMusicSettings: (settings) => ipcRenderer.invoke('sounds:setBackgroundMusicSettings', settings),
    getBackgroundMusicSettings: () => ipcRenderer.invoke('sounds:getBackgroundMusicSettings'),
  },
  steam: {
    getInstalledGames: () => ipcRenderer.invoke('steam:getInstalledGames'),
    pickLibraryFolder: () => ipcRenderer.invoke('steam:pickLibraryFolder'),
    // New Steam APIs for enhanced integration
    detectInstallation: () => ipcRenderer.invoke('detectSteamInstallation'),
    getLibraries: (args) => ipcRenderer.invoke('getSteamLibraries', args),
    scanGames: (args) => ipcRenderer.invoke('scanSteamGames', args),
    getEnrichedGames: (args) => ipcRenderer.invoke('steam:getEnrichedGames', args),
    getClientLibraryMetadata: (args) => ipcRenderer.invoke('steam:getClientLibraryMetadata', args),
  },
  epic: {
    getInstalledGames: () => ipcRenderer.invoke('epic:getInstalledGames'),
  },
  wallpapers: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.wallpapers.get),
    set: (data) => ipcRenderer.invoke(IPC_CHANNELS.wallpapers.set, data),
    reset: () => ipcRenderer.invoke(IPC_CHANNELS.wallpapers.reset),
    add: (args) => ipcRenderer.invoke('wallpapers:add', args),
    delete: (args) => ipcRenderer.invoke('wallpapers:delete', args),
    setActive: (args) => ipcRenderer.invoke('wallpapers:setActive', args),
    toggleLike: (args) => ipcRenderer.invoke('wallpapers:toggleLike', args),
    setCyclingSettings: (args) => ipcRenderer.invoke('wallpapers:setCyclingSettings', args),
    getFile: (url) => ipcRenderer.invoke('wallpapers:get-file', url),
    saveFile: (args) => ipcRenderer.invoke('wallpapers:save-file', args),
    // Monitor-specific wallpaper APIs
    getMonitorWallpaper: (monitorId) => ipcRenderer.invoke(IPC_CHANNELS.wallpapers.getMonitorWallpaper, monitorId),
    setMonitorWallpaper: (monitorId, wallpaperData) => ipcRenderer.invoke(IPC_CHANNELS.wallpapers.setMonitorWallpaper, { monitorId, wallpaperData }),
    getMonitorSettings: (monitorId) => ipcRenderer.invoke(IPC_CHANNELS.wallpapers.getMonitorSettings, monitorId),
    setMonitorSettings: (monitorId, settings) => ipcRenderer.invoke(IPC_CHANNELS.wallpapers.setMonitorSettings, { monitorId, settings }),
  },
  icons: {
    add: ({ filePath, filename }) => ipcRenderer.invoke('icons:add', { filePath, filename }),
    list: () => ipcRenderer.invoke('icons:list'),
    delete: (url) => ipcRenderer.invoke('icons:delete', { url }),
  },
  selectWallpaperFile: () => ipcRenderer.invoke('wallpaper:selectFile'),
  selectIconFile: () => ipcRenderer.invoke('icon:selectFile'),
  selectExeOrShortcutFile: () => ipcRenderer.invoke('select-exe-or-shortcut-file'),
  onWallpapersUpdated: (cb) => ipcRenderer.on('wallpapers:updated', cb),
  offWallpapersUpdated: (cb) => ipcRenderer.removeListener('wallpapers:updated', cb),
  resetAll: () => ipcRenderer.invoke('settings:resetAll'),
  resolveUserdataUrl: (url) => ipcRenderer.invoke('resolve-userdata-url', url),
  // Window management APIs
  close: () => ipcRenderer.send('close-window'),
  toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen'),
  setFullscreen: (shouldBeFullscreen) => ipcRenderer.invoke('set-fullscreen', shouldBeFullscreen),
  toggleFrame: () => ipcRenderer.send('toggle-frame'),
  minimize: () => ipcRenderer.send('minimize-window'),
  onFullscreenState: (cb) => ipcRenderer.on('fullscreen-state', (e, val) => cb(val)),
  onFrameState: (cb) => ipcRenderer.on('frame-state', (e, val) => cb(val)),
  onAppWindowActivity: (cb) => {
    addMappedListener('app-window-activity', cb, appWindowActivityListenerMap, (listener) => (_e, payload) => listener(payload));
  },
  offAppWindowActivity: (cb) => {
    removeMappedListener('app-window-activity', cb, appWindowActivityListenerMap);
  },
  openPipWindow: (url) => ipcRenderer.send('open-pip-window', url),
  openExternal: (url) => ipcRenderer.send('open-external-url', url),
  /** @returns {Promise<{ ok: boolean, error?: string }>} */
  openExternalWithResult: (url) => ipcRenderer.invoke('open-external-url-invoke', url),
  launchApp: (data) => ipcRenderer.invoke('launch-app', data),
  mediaHub: {
    getDefaultLibraryPath: () => ipcRenderer.invoke('mediahub:get-default-library-path'),
    pickFolder: () => ipcRenderer.invoke('mediahub:pick-folder'),
    scanFolder: (args) => ipcRenderer.invoke('mediahub:scan-folder', args),
    detectSuggestedPlayers: () => ipcRenderer.invoke('mediahub:detect-suggested-players'),
    openWithWindowsDialog: (args) => ipcRenderer.invoke('mediahub:open-with-windows-dialog', args),
    getFileThumbnail: (args) => ipcRenderer.invoke('mediahub:get-file-thumbnail', args),
  },
  getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),
  setAutoLaunch: (enable) => ipcRenderer.invoke('set-auto-launch', enable),
  // Auto-updater APIs
  updater: {
    checkForUpdates: () => ipcRenderer.invoke(IPC_CHANNELS.updater.checkForUpdates),
    dismissUpdateNotification: () => ipcRenderer.invoke(IPC_CHANNELS.updateNotification.dismiss),
    downloadUpdate: () => ipcRenderer.invoke(IPC_CHANNELS.updater.downloadUpdate),
    installUpdate: () => ipcRenderer.invoke(IPC_CHANNELS.updater.installUpdate),
    onUpdateStatus: (cb) =>
      addMappedListener(IPC_CHANNELS.updater.statusEvent, cb, updateStatusListenerMap, (listener) => (_e, data) => listener(data)),
    offUpdateStatus: (cb) => removeMappedListener(IPC_CHANNELS.updater.statusEvent, cb, updateStatusListenerMap),
  },
  // Top-level updater aliases for legacy settings tabs
  checkForUpdates: () => ipcRenderer.invoke(IPC_CHANNELS.updater.checkForUpdates),
  downloadUpdate: () => ipcRenderer.invoke(IPC_CHANNELS.updater.downloadUpdate),
  installUpdate: () => ipcRenderer.invoke(IPC_CHANNELS.updater.installUpdate),
  // Update notification event listeners
  onUpdateNotificationAvailable: (cb) =>
    addMappedListener(IPC_CHANNELS.updater.updateAvailableEvent, cb, updateNotificationAvailableListenerMap, (listener) => (_e, data) => listener(data)),
  offUpdateNotificationAvailable: (cb) =>
    removeMappedListener(IPC_CHANNELS.updater.updateAvailableEvent, cb, updateNotificationAvailableListenerMap),
  onUpdateNotificationNotAvailable: (cb) =>
    addMappedListener(IPC_CHANNELS.updater.updateNotAvailableEvent, cb, updateNotificationNotAvailableListenerMap, (listener) => () => listener()),
  offUpdateNotificationNotAvailable: (cb) =>
    removeMappedListener(IPC_CHANNELS.updater.updateNotAvailableEvent, cb, updateNotificationNotAvailableListenerMap),
  onUpdateNotificationDismissed: (cb) =>
    addMappedListener(IPC_CHANNELS.updateNotification.dismissedEvent, cb, updateNotificationDismissedListenerMap, (listener) => () => listener()),
  offUpdateNotificationDismissed: (cb) =>
    removeMappedListener(IPC_CHANNELS.updateNotification.dismissedEvent, cb, updateNotificationDismissedListenerMap),
  onUpdateNotificationInstall: (cb) =>
    addMappedListener(IPC_CHANNELS.updateNotification.installEvent, cb, updateNotificationInstallListenerMap, (listener) => () => listener()),
  offUpdateNotificationInstall: (cb) =>
    removeMappedListener(IPC_CHANNELS.updateNotification.installEvent, cb, updateNotificationInstallListenerMap),
  getFullscreenState: () => ipcRenderer.invoke('get-fullscreen-state'),
  // Spotify OAuth APIs
  onSpotifyAuthSuccess: (cb) => ipcRenderer.on('spotify-auth-success', (e, data) => cb(data)),
  onSpotifyAuthError: (cb) => ipcRenderer.on('spotify-auth-error', (e, data) => cb(data)),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  apps: {
    getInstalled: () => ipcRenderer.invoke('apps:getInstalled'),
    rescanInstalled: () => ipcRenderer.invoke('apps:rescanInstalled'),
  },
  uwp: {
    listApps: () => ipcRenderer.invoke('uwp:list-apps'),
    launch: (appId) => ipcRenderer.invoke('uwp:launch', appId),
  },
  // Multi-monitor support
  monitors: {
    getDisplays: () => ipcRenderer.invoke('get-displays'),
    getPrimaryDisplay: () => ipcRenderer.invoke('get-primary-display'),
    getCurrentDisplay: () => ipcRenderer.invoke('get-current-display'),
    moveToDisplay: (displayId) => ipcRenderer.invoke('move-to-display', displayId),
    onDisplayAdded: (callback) => ipcRenderer.on('display-added', callback),
    onDisplayRemoved: (callback) => ipcRenderer.on('display-removed', callback),
    onDisplayMetricsChanged: (callback) => ipcRenderer.on('display-metrics-changed', callback),
  },
  executeCommand: (command) => ipcRenderer.invoke('execute-command', command),
  takeScreenshot: () => ipcRenderer.invoke('take-screenshot'),
  capturePresetThumbnail: (options) => ipcRenderer.invoke('capture-preset-thumbnail', options),
  // Fresh install API
  getFreshInstallInfo: () => ipcRenderer.invoke('get-fresh-install-info'),
  triggerFreshInstall: () => ipcRenderer.invoke('trigger-fresh-install'),
  // System information API
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  openTaskManager: () => ipcRenderer.invoke('open-task-manager'),
  openFileExplorer: (path) => ipcRenderer.invoke('open-file-explorer', path),
  openAdminPanel: () => ipcRenderer.invoke('open-admin-panel'),
  onShowAdminPanel: (cb) => ipcRenderer.on('show-admin-panel', cb),
  offShowAdminPanel: (cb) => ipcRenderer.removeListener('show-admin-panel', cb),
  // Developer tools
  openDevTools: () => ipcRenderer.invoke('open-dev-tools'),
  forceDevTools: () => ipcRenderer.invoke('force-dev-tools'),
});
