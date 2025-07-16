const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  launchApp: (data) => ipcRenderer.send('launch-app', data),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getChannelConfigs: () => ipcRenderer.invoke('get-channel-configs'),
  saveChannelConfigs: (configs) => ipcRenderer.invoke('save-channel-configs', configs),
  getSavedSounds: () => ipcRenderer.invoke('get-saved-sounds'),
  saveSavedSounds: (sounds) => ipcRenderer.invoke('save-saved-sounds', sounds),
});
