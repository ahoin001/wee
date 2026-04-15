const { handleSpotifyProtocolUrl } = require('./handle-spotify-protocol-url.cjs');

function registerProtocols({
  protocol,
  fsPromises,
  paths,
  getMainWindow,
}) {
  const {
    userWallpapersPath,
    userWallpaperThumbnailsPath,
    userSoundsPath,
    userChannelHoverSoundsPath,
    userIconsPath,
  } = paths;

  protocol.registerFileProtocol('userdata', async (request, callback) => {
    try {
      const url = decodeURIComponent(request.url.replace('userdata://', ''));
      console.log('[Protocol] Requested URL:', request.url);
      console.log('[Protocol] Parsed URL (decoded):', url);

      let filePath;
      if (url.startsWith('wallpapers/')) {
        filePath = path.join(userWallpapersPath, url.replace(/^wallpapers[\\\/]/, ''));
      } else if (url.startsWith('wallpaper-thumbs/')) {
        filePath = path.join(userWallpaperThumbnailsPath, url.replace(/^wallpaper-thumbs[\\\/]/, ''));
      } else if (url.startsWith('sounds/')) {
        filePath = path.join(userSoundsPath, url.replace(/^sounds[\\\/]/, ''));
      } else if (url.startsWith('channel-hover-sounds/')) {
        filePath = path.join(userChannelHoverSoundsPath, url.replace(/^channel-hover-sounds[\\\/]/, ''));
      } else if (url.startsWith('icons/')) {
        filePath = path.join(userIconsPath, url.replace(/^icons[\\\/]/, ''));
      } else {
        console.warn('[Protocol] Blocked access to invalid path:', url);
        return callback({ error: -6 });
      }

      console.log('[Protocol] Resolved file path:', filePath);

      try {
        await fsPromises.access(filePath, fsPromises.constants.F_OK);
        console.log('[Protocol] File exists and is accessible:', filePath);
        await fsPromises.access(filePath, fsPromises.constants.R_OK);
        callback({ path: filePath });
      } catch (error) {
        console.warn('[Protocol] File access failed:', filePath, error.message);
        if (error.code === 'ENOENT') {
          callback({ error: -6 });
        } else if (error.code === 'EACCES') {
          callback({ error: -13 });
        } else {
          callback({ error: -2 });
        }
        return;
      }
    } catch (protocolError) {
      console.error('[Protocol] Protocol handler error:', protocolError);
      callback({ error: -2 });
    }
  });

  protocol.registerFileProtocol('wee-desktop-launcher', (request, callback) => {
    try {
      const url = request.url;
      console.log('[Spotify Protocol] Received callback:', url);
      const result = handleSpotifyProtocolUrl({ protocolUrl: url, getMainWindow });
      const hasError = Boolean(result?.error);

      callback({
        mimeType: 'text/html',
        data: Buffer.from(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Spotify Authentication</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  text-align: center;
                  padding: 50px;
                  background: #1db954;
                  color: white;
                }
                .success { background: #1db954; }
                .error { background: #dc3545; }
              </style>
            </head>
            <body class="${hasError ? 'error' : 'success'}">
              <h2>${hasError ? 'Authentication Failed' : 'Authentication Successful!'}</h2>
              <p>${hasError ? 'Please try again.' : 'You can close this window now.'}</p>
              <script>
                setTimeout(() => window.close(), 2000);
              </script>
            </body>
          </html>
        `),
      });
    } catch (protocolError) {
      console.error('[Spotify Protocol] Protocol handler error:', protocolError);
      callback({ error: -2 });
    }
  });
}

const path = require('path');

module.exports = {
  registerProtocols,
};
