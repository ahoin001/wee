function isTrustedMainWindowEvent(event, getMainWindow) {
  try {
    const mainWindow = typeof getMainWindow === 'function' ? getMainWindow() : null;
    if (!mainWindow || mainWindow.isDestroyed()) return false;
    return event?.sender?.id === mainWindow.webContents.id;
  } catch {
    return false;
  }
}

module.exports = {
  isTrustedMainWindowEvent,
};
