const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  launchApp: (data) => ipcRenderer.send('launch-app', data)
});
