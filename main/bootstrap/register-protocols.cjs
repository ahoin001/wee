const { handleSpotifyProtocolUrl } = require('./handle-spotify-protocol-url.cjs');
const { resolvePathInsideRoot } = require('../utils/path-guard-utils.cjs');

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

      let filePath;
      if (url.startsWith('wallpapers/')) {
        filePath = resolvePathInsideRoot(userWallpapersPath, url.replace(/^wallpapers[\\\/]/, ''));
      } else if (url.startsWith('wallpaper-thumbs/')) {
        filePath = resolvePathInsideRoot(userWallpaperThumbnailsPath, url.replace(/^wallpaper-thumbs[\\\/]/, ''));
      } else if (url.startsWith('sounds/')) {
        filePath = resolvePathInsideRoot(userSoundsPath, url.replace(/^sounds[\\\/]/, ''));
      } else if (url.startsWith('channel-hover-sounds/')) {
        filePath = resolvePathInsideRoot(userChannelHoverSoundsPath, url.replace(/^channel-hover-sounds[\\\/]/, ''));
      } else if (url.startsWith('icons/')) {
        filePath = resolvePathInsideRoot(userIconsPath, url.replace(/^icons[\\\/]/, ''));
      } else {
        return callback({ error: -6 });
      }

      try {
        await fsPromises.access(filePath, fsPromises.constants.R_OK);
        callback({ path: filePath });
      } catch (error) {
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
      callback({ error: -2 });
    }
  });

  protocol.registerFileProtocol('wee-desktop-launcher', (request, callback) => {
    try {
      const url = request.url;
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
