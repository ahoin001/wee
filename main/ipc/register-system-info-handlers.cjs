const { execFile } = require('child_process');
const si = require('systeminformation');
const { isTrustedMainWindowEvent } = require('./trusted-renderer-utils.cjs');

function registerSystemInfoHandlers({
  ipcMain,
  exec,
  process,
  getMainWindow,
  shell,
}) {
  let cachedSystemInfo = null;
  let lastSystemInfoAt = 0;
  const SYSTEM_INFO_TTL_MS = 5000;

  ipcMain.handle('get-system-info', async (event) => {
    if (!isTrustedMainWindowEvent(event, getMainWindow)) {
      return { success: false, error: 'Untrusted renderer', data: null };
    }
    try {
      const now = Date.now();
      if (cachedSystemInfo && now - lastSystemInfoAt < SYSTEM_INFO_TTL_MS) {
        return { success: true, data: cachedSystemInfo };
      }
      const cpuInfo = await si.cpu();
      const cpuLoad = await si.currentLoad();
      const memInfo = await si.mem();

      const systemInfo = {
        cpu: {
          model: `${cpuInfo.manufacturer} ${cpuInfo.brand}`,
          cores: cpuInfo.cores,
          speed: `${cpuInfo.speed} GHz`,
          usage: Math.round(cpuLoad.currentLoad),
          temperature: null,
        },
        memory: {
          total: memInfo.total,
          used: memInfo.used,
          free: memInfo.free,
          usage: Math.round((memInfo.used / memInfo.total) * 100),
        },
        storage: [{
          name: 'C:',
          total: 1000000000000,
          used: 500000000000,
          usage: 50,
        }],
        gpu: {
          name: 'Test GPU',
          memory: 8000000000,
          usage: 0,
          temperature: 0,
        },
        battery: null,
      };

      cachedSystemInfo = systemInfo;
      lastSystemInfoAt = now;
      return { success: true, data: systemInfo };
    } catch (error) {
      console.error('[SYSTEM] Error getting system information:', error);
      return { success: false, error: error.message, data: null };
    }
  });

  ipcMain.handle('open-task-manager', async (event) => {
    if (!isTrustedMainWindowEvent(event, getMainWindow)) {
      return { success: false, error: 'Untrusted renderer' };
    }
    try {
      if (process.platform === 'win32') {
        execFile('taskmgr.exe', [], { windowsHide: true }, (error) => {
          if (error) console.error('[SYSTEM] Error opening task manager:', error);
        });
        return { success: true };
      }

      exec('gnome-system-monitor', (error) => {
        if (error) {
          console.error('[SYSTEM] Error opening system monitor:', error);
        } else {
          console.log('[SYSTEM] System monitor opened');
        }
      });
      return { success: true };
    } catch (error) {
      console.error('[SYSTEM] Error opening task manager:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('open-file-explorer', async (event, path) => {
    if (!isTrustedMainWindowEvent(event, getMainWindow)) {
      return { success: false, error: 'Untrusted renderer' };
    }
    try {
      const targetPath = String(path || '').trim();
      if (!targetPath) return { success: false, error: 'No path provided' };
      if (process.platform === 'win32') {
        execFile('explorer.exe', [targetPath], { windowsHide: true }, (error) => {
          if (error) {
            console.error('[SYSTEM] Error opening file explorer:', error);
          }
        });
        return { success: true };
      }
      const err = await shell.openPath(targetPath);
      if (err) return { success: false, error: err };
      return { success: true };
    } catch (error) {
      console.error('[SYSTEM] Error opening file explorer:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('open-admin-panel', async (event) => {
    if (!isTrustedMainWindowEvent(event, getMainWindow)) {
      return { success: false, error: 'Untrusted renderer' };
    }
    try {
      const mainWindow = getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('show-admin-panel');
        console.log('[SYSTEM] Admin panel opened');
        return { success: true };
      }
      console.error('[SYSTEM] Main window not available');
      return { success: false, error: 'Main window not available' };
    } catch (error) {
      console.error('[SYSTEM] Error opening admin panel:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  registerSystemInfoHandlers,
};
