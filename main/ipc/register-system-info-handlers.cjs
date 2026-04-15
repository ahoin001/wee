function registerSystemInfoHandlers({
  ipcMain,
  exec,
  process,
  getMainWindow,
}) {
  ipcMain.handle('get-system-info', async () => {
    try {
      console.log('[SYSTEM] Starting system info collection...');

      let si;
      try {
        si = require('systeminformation');
        console.log('[SYSTEM] systeminformation package loaded successfully');
      } catch (requireError) {
        console.error('[SYSTEM] Failed to require systeminformation:', requireError);
        return {
          success: false,
          error: 'Failed to load systeminformation package',
          data: null,
        };
      }

      console.log('[SYSTEM] Getting CPU info...');
      const cpuInfo = await si.cpu();
      console.log('[SYSTEM] CPU info:', cpuInfo);

      const cpuLoad = await si.currentLoad();
      console.log('[SYSTEM] CPU load:', cpuLoad);

      const memInfo = await si.mem();
      console.log('[SYSTEM] Memory info:', memInfo);

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

      console.log('[SYSTEM] Retrieved system information successfully');
      return { success: true, data: systemInfo };
    } catch (error) {
      console.error('[SYSTEM] Error getting system information:', error);
      return { success: false, error: error.message, data: null };
    }
  });

  ipcMain.handle('open-task-manager', async () => {
    try {
      if (process.platform === 'win32') {
        exec('taskmgr.exe', (error) => {
          if (error) {
            console.error('[SYSTEM] Error opening task manager:', error);
          } else {
            console.log('[SYSTEM] Task manager opened');
          }
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

  ipcMain.handle('open-file-explorer', async (_event, path) => {
    try {
      if (process.platform === 'win32') {
        exec(`explorer.exe "${path}"`, (error) => {
          if (error) {
            console.error('[SYSTEM] Error opening file explorer:', error);
          } else {
            console.log('[SYSTEM] File explorer opened to:', path);
          }
        });
        return { success: true };
      }

      exec(`xdg-open "${path}"`, (error) => {
        if (error) {
          console.error('[SYSTEM] Error opening file manager:', error);
        } else {
          console.log('[SYSTEM] File manager opened to:', path);
        }
      });
      return { success: true };
    } catch (error) {
      console.error('[SYSTEM] Error opening file explorer:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('open-admin-panel', async () => {
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
