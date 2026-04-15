function handleSpotifyProtocolUrl({ protocolUrl, getMainWindow }) {
  try {
    const urlObj = new URL(protocolUrl);
    const code = urlObj.searchParams.get('code');
    const error = urlObj.searchParams.get('error');

    const mainWindow = getMainWindow();
    if (error) {
      console.error('[Spotify Protocol] OAuth error:', error);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('spotify-auth-error', { error });
      }
      return { code: null, error };
    }

    if (code) {
      console.log('[Spotify Protocol] OAuth code received:', code);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('spotify-auth-success', { code });
      }
    }
    return { code, error: null };
  } catch (error) {
    console.error('[Spotify Protocol] Error parsing URL:', error);
    return { code: null, error: 'invalid_url' };
  }
}

module.exports = {
  handleSpotifyProtocolUrl,
};
