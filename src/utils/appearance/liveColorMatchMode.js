/**
 * Live color-match modes for ribbon / --primary.
 * Wallpaper Color Match and Now Playing Color Match are mutually exclusive —
 * enabling one turns the other off so Effective accent and ribbon stay in sync.
 */

/**
 * @typedef {'wallpaper' | 'spotify' | 'off'} LiveColorMatchMode
 */

/**
 * @param {LiveColorMatchMode} mode
 * @returns {{ wallpaperMatchEnabled: boolean, spotifyMatchEnabled: boolean }}
 */
export function liveColorMatchUiPatch(mode) {
  if (mode === 'wallpaper') {
    return { wallpaperMatchEnabled: true, spotifyMatchEnabled: false };
  }
  if (mode === 'spotify') {
    return { wallpaperMatchEnabled: false, spotifyMatchEnabled: true };
  }
  return { wallpaperMatchEnabled: false, spotifyMatchEnabled: false };
}
