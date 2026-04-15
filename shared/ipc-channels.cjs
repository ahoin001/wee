const IPC_CHANNELS = {
  data: {
    get: 'data:get',
    set: 'data:set',
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

module.exports = {
  IPC_CHANNELS,
};
