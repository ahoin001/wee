const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('installerApi', {
  getStep: () => ipcRenderer.invoke('installer:get-step'),
  nextStep: (options) => ipcRenderer.invoke('installer:next-step', options),
  startInstall: () => ipcRenderer.invoke('installer:start-install'),
  launchAppAfterInstall: () => ipcRenderer.send('launch-app-after-install'),
  closeWindow: () => window.close(),
  onProgressUpdate: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const wrapped = (_event, data) => callback(data);
    ipcRenderer.on('installer:progress-update', wrapped);
    return () => ipcRenderer.removeListener('installer:progress-update', wrapped);
  },
});
