function mapDisplay(display) {
  return {
    id: display.id,
    bounds: display.bounds,
    workArea: display.workArea,
    scaleFactor: display.scaleFactor,
    rotation: display.rotation,
    internal: display.internal,
    primary: display.primary,
    size: display.size,
    colorSpace: display.colorSpace,
    colorDepth: display.colorDepth,
    monochrome: display.monochrome,
    depthPerComponent: display.depthPerComponent,
    displayFrequency: display.displayFrequency,
  };
}

function registerMonitorHandlers({
  ipcMain,
  screen,
  getMainWindow,
}) {
  ipcMain.handle('get-displays', () => {
    try {
      const displays = screen.getAllDisplays();
      console.log('[MONITOR] Found displays:', displays.length);
      return displays.map(mapDisplay);
    } catch (error) {
      console.error('[MONITOR] Error getting displays:', error);
      return [];
    }
  });

  ipcMain.handle('get-primary-display', () => {
    try {
      const primaryDisplay = screen.getPrimaryDisplay();
      console.log('[MONITOR] Primary display:', primaryDisplay.id);
      return mapDisplay(primaryDisplay);
    } catch (error) {
      console.error('[MONITOR] Error getting primary display:', error);
      return null;
    }
  });

  ipcMain.handle('move-to-display', (_event, displayId) => {
    try {
      const displays = screen.getAllDisplays();
      const targetDisplay = displays.find((d) => d.id === displayId);
      const mainWindow = getMainWindow();

      if (targetDisplay && mainWindow) {
        console.log('[MONITOR] Moving window to display:', displayId);
        mainWindow.setBounds(targetDisplay.bounds);
        return { success: true, displayId };
      }

      console.error('[MONITOR] Display not found:', displayId);
      return { success: false, error: 'Display not found' };
    } catch (error) {
      console.error('[MONITOR] Error moving to display:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-current-display', () => {
    try {
      const mainWindow = getMainWindow();
      if (!mainWindow) return null;

      const currentBounds = mainWindow.getBounds();
      const displays = screen.getAllDisplays();
      const currentDisplay = displays.find((display) => {
        const { x, y, width, height } = display.bounds;
        const windowCenterX = currentBounds.x + (currentBounds.width / 2);
        const windowCenterY = currentBounds.y + (currentBounds.height / 2);
        return windowCenterX >= x &&
          windowCenterX <= x + width &&
          windowCenterY >= y &&
          windowCenterY <= y + height;
      });

      if (currentDisplay) {
        console.log('[MONITOR] Current display:', currentDisplay.id);
        return mapDisplay(currentDisplay);
      }

      console.log('[MONITOR] Could not determine current display');
      return null;
    } catch (error) {
      console.error('[MONITOR] Error getting current display:', error);
      return null;
    }
  });
}

module.exports = {
  registerMonitorHandlers,
};
