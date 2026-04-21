const { IPC_CHANNELS } = require('../../shared/ipc-channels.cjs');
const { isPlainObject, mergeSettingsPatch } = require('../../shared/settings-patch-merge.cjs');

const SETTINGS_PATCH_DEBOUNCE_MS = 200;

function registerCoreDataHandlers({
  ipcMain,
  unifiedData,
  wallpapersData,
  channelsData,
  getMainWindow,
}) {
  // Patch-based settings persistence: accumulates renderer deltas in-memory and
  // flushes them to the unified-data file via a single read–merge–write after a
  // short debounce. Replaces the per-change full round-trip with a batched path.
  let pendingSettingsPatch = null;
  let pendingPatchTimer = null;
  let pendingPatchWaiters = [];
  let flushChain = Promise.resolve();

  const schedulePatchFlush = () => {
    if (pendingPatchTimer) return;
    pendingPatchTimer = setTimeout(async () => {
      pendingPatchTimer = null;
      const patch = pendingSettingsPatch;
      const waiters = pendingPatchWaiters;
      pendingSettingsPatch = null;
      pendingPatchWaiters = [];
      if (!patch || !Object.keys(patch).length) {
        waiters.forEach((w) => w.resolve(true));
        return;
      }
      flushChain = flushChain
        .then(async () => {
          const current = await unifiedData.get();
          const mergedSettings = mergeSettingsPatch(current?.settings || {}, patch);
          const next = { ...(current || {}), settings: mergedSettings };
          await unifiedData.set(next);
          waiters.forEach((w) => w.resolve(true));
        })
        .catch((err) => {
          console.warn('[data:patch-settings] flush failed:', err?.message || err);
          waiters.forEach((w) => w.reject(err));
        });
    }, SETTINGS_PATCH_DEBOUNCE_MS);
  };

  ipcMain.handle(IPC_CHANNELS.data.get, async () => await unifiedData.get());
  ipcMain.handle(IPC_CHANNELS.data.set, async (_event, data) => {
    await unifiedData.set(data);
    return true;
  });
  ipcMain.handle(IPC_CHANNELS.data.patchSettings, async (_event, patch) => {
    if (!isPlainObject(patch)) return true;
    pendingSettingsPatch = mergeSettingsPatch(pendingSettingsPatch || {}, patch);
    return new Promise((resolve, reject) => {
      pendingPatchWaiters.push({ resolve, reject });
      schedulePatchFlush();
    });
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
