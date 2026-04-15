function setupDisplayEvents({ screen, getMainWindow }) {
  screen.on('display-added', (_event, display) => {
    console.log('[MONITOR] Display added:', display.id);
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('display-added', display);
    }
  });

  screen.on('display-removed', (_event, display) => {
    console.log('[MONITOR] Display removed:', display.id);
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('display-removed', display);
    }
  });

  screen.on('display-metrics-changed', (_event, display, changedMetrics) => {
    console.log('[MONITOR] Display metrics changed:', display.id, changedMetrics);
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('display-metrics-changed', { display, changedMetrics });
    }
  });
}

module.exports = {
  setupDisplayEvents,
};
