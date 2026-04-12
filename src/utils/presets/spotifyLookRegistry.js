/** Live gradient component registers the save implementation; UI calls this instead of window globals. */
let saveGradientToWallpapersImpl = null;

export function registerSpotifyGradientSave(fn) {
  saveGradientToWallpapersImpl = typeof fn === 'function' ? fn : null;
  return () => {
    saveGradientToWallpapersImpl = null;
  };
}

export function saveSpotifyGradientToWallpapers() {
  if (typeof saveGradientToWallpapersImpl === 'function') {
    return saveGradientToWallpapersImpl();
  }
  return Promise.reject(new Error('Live gradient wallpaper is not ready. Enable it and wait for colors.'));
}
