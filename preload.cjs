const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  launchApp: (data) => ipcRenderer.send('launch-app', data),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getChannelConfigs: () => ipcRenderer.invoke('get-channel-configs'),
  saveChannelConfigs: (configs) => ipcRenderer.invoke('save-channel-configs', configs),
  getSavedSounds: () => ipcRenderer.invoke('get-saved-sounds'),
  saveSavedSounds: (sounds) => ipcRenderer.invoke('save-saved-sounds', sounds),
  getSoundUrl: (filename) => ipcRenderer.invoke('get-sound-url', filename),
  toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen'),
  toggleFrame: () => ipcRenderer.send('toggle-frame'),
  minimize: () => ipcRenderer.send('minimize-window'),
  close: () => ipcRenderer.send('close-window'),
  onUpdateDragRegion: (callback) => ipcRenderer.on('update-drag-region', (event, shouldShow) => callback(shouldShow)),
  onFullscreenState: (callback) => ipcRenderer.on('fullscreen-state', (event, val) => callback(val)),
  onFrameState: (callback) => ipcRenderer.on('frame-state', (event, val) => callback(val)),
});
