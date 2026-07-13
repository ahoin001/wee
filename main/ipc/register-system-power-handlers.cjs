/**
 * Forward Electron powerMonitor events to the renderer for efficient / suspend bias.
 * Never minimizes the main window — decorative pause only.
 */
function registerSystemPowerHandlers({ ipcMain, getMainWindow }) {
  const { powerMonitor } = require('electron');

  const send = (payload) => {
    const win = typeof getMainWindow === 'function' ? getMainWindow() : null;
    if (!win || win.isDestroyed()) return;
    try {
      win.webContents.send('system-power', payload);
    } catch {
      // ignore
    }
  };

  const emitSnapshot = () => {
    let onBattery = false;
    try {
      onBattery = Boolean(powerMonitor?.isOnBatteryPower?.());
    } catch {
      onBattery = false;
    }
    send({ onBattery, suspended: false });
  };

  try {
    powerMonitor.on('on-battery', () => send({ onBattery: true }));
    powerMonitor.on('on-ac', () => send({ onBattery: false }));
    powerMonitor.on('suspend', () => send({ suspended: true }));
    powerMonitor.on('resume', () => {
      let onBattery = false;
      try {
        onBattery = Boolean(powerMonitor.isOnBatteryPower?.());
      } catch {
        onBattery = false;
      }
      send({ onBattery, suspended: false });
    });
  } catch (err) {
    console.warn('[system-power] powerMonitor subscribe failed:', err?.message || err);
  }

  ipcMain.handle('system-power:get', async () => {
    let onBattery = false;
    try {
      onBattery = Boolean(powerMonitor?.isOnBatteryPower?.());
    } catch {
      onBattery = false;
    }
    return { onBattery, suspended: false };
  });

  setTimeout(emitSnapshot, 1500);
}

module.exports = {
  registerSystemPowerHandlers,
};
