const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  sounds: {
    get: () => ipcRenderer.invoke('sounds:get'),
    set: (data) => ipcRenderer.invoke('sounds:set', data),
    reset: () => ipcRenderer.invoke('sounds:reset'),
    add: (args) => ipcRenderer.invoke('add-sound', args),
    remove: (args) => ipcRenderer.invoke('remove-sound', args),
    update: (args) => ipcRenderer.invoke('update-sound', args),
    getLibrary: () => ipcRenderer.invoke('get-sound-library'),
    selectFile: () => ipcRenderer.invoke('select-sound-file'),
  },
  wallpapers: {
    get: () => ipcRenderer.invoke('wallpapers:get'),
    set: (data) => ipcRenderer.invoke('wallpapers:set', data),
    add: (args) => ipcRenderer.invoke('wallpapers:add', args),
    delete: (args) => ipcRenderer.invoke('wallpapers:delete', args),
    setActive: (args) => ipcRenderer.invoke('wallpapers:setActive', args),
    toggleLike: (args) => ipcRenderer.invoke('wallpapers:toggleLike', args),
    setCyclingSettings: (args) => ipcRenderer.invoke('wallpapers:setCyclingSettings', args),
  },
  selectWallpaperFile: () => ipcRenderer.invoke('wallpaper:selectFile'),
  onWallpapersUpdated: (cb) => ipcRenderer.on('wallpapers:updated', cb),
  offWallpapersUpdated: (cb) => ipcRenderer.removeListener('wallpapers:updated', cb),
  channels: {
    get: () => ipcRenderer.invoke('channels:get'),
    set: (data) => ipcRenderer.invoke('channels:set', data),
    reset: () => ipcRenderer.invoke('channels:reset'),
  },
  resetAll: () => ipcRenderer.invoke('settings:resetAll'),
  // Window management APIs
  close: () => ipcRenderer.send('close-window'),
  toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen'),
  toggleFrame: () => ipcRenderer.send('toggle-frame'),
  minimize: () => ipcRenderer.send('minimize-window'),
  onFullscreenState: (cb) => ipcRenderer.on('fullscreen-state', (e, val) => cb(val)),
  onFrameState: (cb) => ipcRenderer.on('frame-state', (e, val) => cb(val)),
  openPipWindow: (url) => ipcRenderer.send('open-pip-window', url),
  openExternal: (url) => ipcRenderer.send('open-external-url', url),
});
