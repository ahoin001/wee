const { IPC_CHANNELS } = require('../../shared/ipc-channels.cjs');

function registerCoreDataHandlers({
  ipcMain,
  unifiedData,
  wallpapersData,
  channelsData,
  getMainWindow,
}) {
  ipcMain.handle(IPC_CHANNELS.data.get, async () => await unifiedData.get());
  ipcMain.handle(IPC_CHANNELS.data.set, async (_event, data) => {
    await unifiedData.set(data);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.wallpapers.get, async () => {
    console.log('[DEBUG] IPC: wallpapers:get called');
    const result = await wallpapersData.get();
    console.log('[DEBUG] IPC: wallpapers:get completed');
    return result;
  });
  ipcMain.handle(IPC_CHANNELS.wallpapers.set, async (_event, data) => {
    await wallpapersData.set(data);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.channels.get, async () => {
    console.log('[DEBUG] IPC: channels:get called');
    const result = await channelsData.get();
    console.log('[DEBUG] IPC: channels:get completed');
    return result;
  });
  ipcMain.handle(IPC_CHANNELS.channels.set, async (_event, data) => {
    await channelsData.set(data);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.wallpapers.getMonitorWallpaper, async (_event, monitorId) => {
    const data = await wallpapersData.get();
    return data.monitorWallpapers?.[monitorId] || null;
  });

  ipcMain.handle(IPC_CHANNELS.wallpapers.setMonitorWallpaper, async (_event, { monitorId, wallpaperData }) => {
    const data = await wallpapersData.get();
    if (!data.monitorWallpapers) data.monitorWallpapers = {};
    data.monitorWallpapers[monitorId] = wallpaperData;
    await wallpapersData.set(data);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.wallpapers.getMonitorSettings, async (_event, monitorId) => {
    const data = await wallpapersData.get();
    return data.monitorSettings?.[monitorId] || null;
  });

  ipcMain.handle(IPC_CHANNELS.wallpapers.setMonitorSettings, async (_event, { monitorId, settings }) => {
    const data = await wallpapersData.get();
    if (!data.monitorSettings) data.monitorSettings = {};
    data.monitorSettings[monitorId] = settings;
    await wallpapersData.set(data);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.updateNotification.dismiss, () => {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send(IPC_CHANNELS.updateNotification.dismissedEvent);
    }
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.updateNotification.installUpdate, () => {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send(IPC_CHANNELS.updateNotification.installEvent);
    }
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.wallpapers.reset, async () => {
    await wallpapersData.reset();
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.channels.reset, async () => {
    await channelsData.reset();
    return true;
  });
}

module.exports = {
  registerCoreDataHandlers,
};
