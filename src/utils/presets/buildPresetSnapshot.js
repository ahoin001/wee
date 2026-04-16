import useConsolidatedAppStore from '../useConsolidatedAppStore';

/**
 * Build preset `data` payload from the consolidated store.
 * @param {object} opts
 * @param {boolean} [opts.includeSounds]
 * @param {boolean} [opts.includeSpotifyPalette] — freeze current `spotify.extractedColors` into the preset
 */
export function buildPresetDataFromStore({
  includeSounds = false,
  includeSpotifyPalette = false,
} = {}) {
  const { wallpaper, ribbon, time, overlay, ui, sounds, spotify } =
    useConsolidatedAppStore.getState();

  const presetData = {
    wallpaper: {
      current: wallpaper.current,
      opacity: wallpaper.opacity,
      blur: wallpaper.blur,
      workspaceBrightness: wallpaper.workspaceBrightness,
      workspaceSaturate: wallpaper.workspaceSaturate,
      gameHubBrightness: wallpaper.gameHubBrightness,
      gameHubSaturate: wallpaper.gameHubSaturate,
      cycleWallpapers: wallpaper.cycleWallpapers,
      cycleInterval: wallpaper.cycleInterval,
      cycleAnimation: wallpaper.cycleAnimation,
      savedWallpapers: wallpaper.savedWallpapers,
      likedWallpapers: wallpaper.likedWallpapers,
      slideDirection: wallpaper.slideDirection,
      crossfadeDuration: wallpaper.crossfadeDuration,
      crossfadeEasing: wallpaper.crossfadeEasing,
      slideRandomDirection: wallpaper.slideRandomDirection,
      slideDuration: wallpaper.slideDuration,
      slideEasing: wallpaper.slideEasing,
    },
    ribbon: {
      ribbonColor: ribbon.ribbonColor,
      ribbonGlowColor: ribbon.ribbonGlowColor,
      ribbonGlowStrength: ribbon.ribbonGlowStrength,
      ribbonGlowStrengthHover: ribbon.ribbonGlowStrengthHover,
      ribbonDockOpacity: ribbon.ribbonDockOpacity,
      glassWiiRibbon: ribbon.glassWiiRibbon,
      glassOpacity: ribbon.glassOpacity,
      glassBlur: ribbon.glassBlur,
      glassBorderOpacity: ribbon.glassBorderOpacity,
      glassShineOpacity: ribbon.glassShineOpacity,
    },
    time: {
      color: time.color,
      enablePill: time.enablePill,
      pillBlur: time.pillBlur,
      pillOpacity: time.pillOpacity,
      font: time.font,
    },
    overlay: {
      enabled: overlay.enabled,
      effect: overlay.effect,
      intensity: overlay.intensity,
      speed: overlay.speed,
      wind: overlay.wind,
      gravity: overlay.gravity,
    },
    ui: {
      isDarkMode: ui.isDarkMode,
      useCustomCursor: ui.useCustomCursor,
      classicMode: ui.classicMode,
      spotifyMatchEnabled: includeSpotifyPalette ? false : (ui.spotifyMatchEnabled ?? false),
    },
  };

  if (includeSounds) {
    try {
      presetData.sounds = sounds ? JSON.parse(JSON.stringify(sounds)) : null;
    } catch {
      presetData.sounds = null;
    }
  }

  if (includeSpotifyPalette && spotify?.extractedColors) {
    presetData.capturedSpotifyPalette = JSON.parse(JSON.stringify(spotify.extractedColors));
  }

  return presetData;
}
