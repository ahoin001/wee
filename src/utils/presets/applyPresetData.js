import { saveUnifiedSoundSettings } from '../electronApi';
import { normalizePresetSoundsSnapshot } from '../presetSoundSettings';
import useConsolidatedAppStore from '../useConsolidatedAppStore';

function normalizeSettingsShape(settingsToApply) {
  const hasOldStructure =
    settingsToApply &&
    (settingsToApply.timeColor !== undefined ||
      settingsToApply.enableTimePill !== undefined ||
      settingsToApply.ribbonColor !== undefined ||
      settingsToApply.glassWiiRibbon !== undefined ||
      settingsToApply.wallpaperOpacity !== undefined);

  if (!hasOldStructure) return settingsToApply;

  return {
    time: {
      color: settingsToApply.timeColor,
      enablePill: settingsToApply.enableTimePill,
      pillBlur: settingsToApply.timePillBlur,
      pillOpacity: settingsToApply.timePillOpacity,
      font: settingsToApply.timeFont,
    },
    ribbon: {
      ribbonColor: settingsToApply.ribbonColor,
      ribbonGlowColor: settingsToApply.ribbonGlowColor,
      ribbonGlowStrength: settingsToApply.ribbonGlowStrength,
      ribbonGlowStrengthHover: settingsToApply.ribbonGlowStrengthHover,
      glassWiiRibbon: settingsToApply.glassWiiRibbon,
      glassOpacity: settingsToApply.glassOpacity,
      glassBlur: settingsToApply.glassBlur,
      glassBorderOpacity: settingsToApply.glassBorderOpacity,
      glassShineOpacity: settingsToApply.glassShineOpacity,
      ribbonButtonConfigs: settingsToApply.ribbonButtonConfigs,
      recentRibbonColors: settingsToApply.recentRibbonColors,
      recentRibbonGlowColors: settingsToApply.recentRibbonGlowColors,
    },
    wallpaper: {
      current: settingsToApply.wallpaper,
      opacity: settingsToApply.wallpaperOpacity,
      blur: settingsToApply.wallpaperBlur,
      cycleWallpapers: settingsToApply.cycleWallpapers,
      cycleInterval: settingsToApply.cycleInterval,
      cycleAnimation: settingsToApply.cycleAnimation,
      savedWallpapers: settingsToApply.savedWallpapers,
      likedWallpapers: settingsToApply.likedWallpapers,
      slideDirection: settingsToApply.slideDirection,
      slideDuration: settingsToApply.slideDuration,
      slideEasing: settingsToApply.slideEasing,
      slideRandomDirection: settingsToApply.slideRandomDirection,
      crossfadeDuration: settingsToApply.crossfadeDuration,
      crossfadeEasing: settingsToApply.crossfadeEasing,
    },
    ui: {
      presetsButtonConfig: settingsToApply.presetsButtonConfig,
    },
  };
}

/**
 * Apply a preset's `data` to the consolidated store and persist legacy + wallpaper backends.
 */
export async function applyPresetData(preset) {
  if (!preset?.data) {
    console.error('[applyPresetData] No preset data');
    return;
  }

  let settingsToApply = preset.data;
  if (preset.isCommunity && preset.data.settings) {
    settingsToApply = preset.data.settings;
  }

  settingsToApply = normalizeSettingsShape(settingsToApply);

  if (!settingsToApply || typeof settingsToApply !== 'object') {
    console.error('[applyPresetData] Invalid settings structure');
    return;
  }

  const { setWallpaperState, setRibbonState, setTimeState, setOverlayState, setUIState, setSoundsState } =
    useConsolidatedAppStore.getState().actions;

  if (settingsToApply.wallpaper) {
    setWallpaperState(settingsToApply.wallpaper);
  }

  if (settingsToApply.ribbon) {
    setRibbonState(settingsToApply.ribbon);
  }

  if (settingsToApply.time) {
    const timeSettings = {};
    if (settingsToApply.time.timeColor !== undefined) timeSettings.color = settingsToApply.time.timeColor;
    if (settingsToApply.time.enableTimePill !== undefined) timeSettings.enablePill = settingsToApply.time.enableTimePill;
    if (settingsToApply.time.timePillBlur !== undefined) timeSettings.pillBlur = settingsToApply.time.timePillBlur;
    if (settingsToApply.time.timePillOpacity !== undefined) timeSettings.pillOpacity = settingsToApply.time.timePillOpacity;
    if (settingsToApply.time.timeFont !== undefined) timeSettings.font = settingsToApply.time.timeFont;
    if (settingsToApply.time.color !== undefined) timeSettings.color = settingsToApply.time.color;
    if (settingsToApply.time.enablePill !== undefined) timeSettings.enablePill = settingsToApply.time.enablePill;
    if (settingsToApply.time.pillBlur !== undefined) timeSettings.pillBlur = settingsToApply.time.pillBlur;
    if (settingsToApply.time.pillOpacity !== undefined) timeSettings.pillOpacity = settingsToApply.time.pillOpacity;
    if (settingsToApply.time.font !== undefined) timeSettings.font = settingsToApply.time.font;
    setTimeState(timeSettings);
  }

  if (settingsToApply.overlay) {
    setOverlayState(settingsToApply.overlay);
  }

  if (settingsToApply.ui) {
    setUIState(settingsToApply.ui);
  }

  if (settingsToApply.channels) {
    const { setChannelState } = useConsolidatedAppStore.getState().actions;
    setChannelState(settingsToApply.channels);
  }

  const normalizedSounds = normalizePresetSoundsSnapshot(settingsToApply.sounds);
  if (normalizedSounds) {
    setSoundsState(normalizedSounds);
    try {
      await saveUnifiedSoundSettings(normalizedSounds);
    } catch (e) {
      console.warn('[applyPresetData] Failed to persist sounds:', e);
    }
  }

  if (settingsToApply.capturedSpotifyPalette) {
    const c = settingsToApply.capturedSpotifyPalette;
    const r = useConsolidatedAppStore.getState().ribbon;
    const t = useConsolidatedAppStore.getState().time;
    setRibbonState({
      ...r,
      ribbonColor: c.primary ?? r.ribbonColor,
      ribbonGlowColor: c.accent ?? r.ribbonGlowColor,
    });
    setTimeState({
      ...t,
      color: c.text ?? c.textSecondary ?? t.color,
    });
    setUIState({ spotifyMatchEnabled: false });
  }

  try {
    if (window.api?.settings?.get && window.api?.settings?.set) {
      const currentSettings = await window.api.settings.get();
      const updatedSettings = { ...currentSettings };
      if (settingsToApply.ribbon) updatedSettings.ribbon = settingsToApply.ribbon;
      if (settingsToApply.time) updatedSettings.time = settingsToApply.time;
      if (settingsToApply.ui) updatedSettings.ui = { ...currentSettings.ui, ...settingsToApply.ui };
      if (settingsToApply.channels) updatedSettings.channels = settingsToApply.channels;
      if (normalizedSounds) updatedSettings.sounds = normalizedSounds;
      await window.api.settings.set(updatedSettings);
    }

    if (settingsToApply.wallpaper && window.api?.wallpapers?.get && window.api?.wallpapers?.set) {
      try {
        const currentWallpaperData = await window.api.wallpapers.get();
        const updatedWallpaperData = { ...currentWallpaperData };
        if (settingsToApply.wallpaper.current !== undefined) {
          updatedWallpaperData.wallpaper = settingsToApply.wallpaper.current;
        }
        if (settingsToApply.wallpaper.opacity !== undefined) {
          updatedWallpaperData.wallpaperOpacity = settingsToApply.wallpaper.opacity;
        }
        if (settingsToApply.wallpaper.blur !== undefined) {
          updatedWallpaperData.wallpaperBlur = settingsToApply.wallpaper.blur;
        }
        if (settingsToApply.wallpaper.savedWallpapers !== undefined) {
          updatedWallpaperData.savedWallpapers = settingsToApply.wallpaper.savedWallpapers;
        }
        if (settingsToApply.wallpaper.likedWallpapers !== undefined) {
          updatedWallpaperData.likedWallpapers = settingsToApply.wallpaper.likedWallpapers;
        }
        if (
          settingsToApply.wallpaper.cycleWallpapers !== undefined ||
          settingsToApply.wallpaper.cycleInterval !== undefined ||
          settingsToApply.wallpaper.cycleAnimation !== undefined
        ) {
          updatedWallpaperData.cyclingSettings = {
            ...updatedWallpaperData.cyclingSettings,
            enabled: settingsToApply.wallpaper.cycleWallpapers ?? updatedWallpaperData.cyclingSettings?.enabled ?? false,
            interval: settingsToApply.wallpaper.cycleInterval ?? updatedWallpaperData.cyclingSettings?.interval ?? 30,
            animation: settingsToApply.wallpaper.cycleAnimation ?? updatedWallpaperData.cyclingSettings?.animation ?? 'fade',
            slideDirection:
              settingsToApply.wallpaper.slideDirection ?? updatedWallpaperData.cyclingSettings?.slideDirection ?? 'right',
            crossfadeDuration:
              settingsToApply.wallpaper.crossfadeDuration ?? updatedWallpaperData.cyclingSettings?.crossfadeDuration ?? 1.2,
            crossfadeEasing:
              settingsToApply.wallpaper.crossfadeEasing ?? updatedWallpaperData.cyclingSettings?.crossfadeEasing ?? 'ease-out',
            slideRandomDirection:
              settingsToApply.wallpaper.slideRandomDirection ??
              updatedWallpaperData.cyclingSettings?.slideRandomDirection ??
              false,
            slideDuration: settingsToApply.wallpaper.slideDuration ?? updatedWallpaperData.cyclingSettings?.slideDuration ?? 1.5,
            slideEasing: settingsToApply.wallpaper.slideEasing ?? updatedWallpaperData.cyclingSettings?.slideEasing ?? 'ease-out',
          };
        }
        await window.api.wallpapers.set(updatedWallpaperData);
      } catch (wallpaperError) {
        console.error('[applyPresetData] Wallpaper save failed:', wallpaperError);
      }
    }

    if (settingsToApply.overlay && window.api?.wallpapers?.get && window.api?.wallpapers?.set) {
      try {
        const currentWallpaperData = await window.api.wallpapers.get();
        const updatedWallpaperData = { ...currentWallpaperData };
        if (settingsToApply.overlay.enabled !== undefined) updatedWallpaperData.overlayEnabled = settingsToApply.overlay.enabled;
        if (settingsToApply.overlay.effect !== undefined) updatedWallpaperData.overlayEffect = settingsToApply.overlay.effect;
        if (settingsToApply.overlay.intensity !== undefined) {
          updatedWallpaperData.overlayIntensity = settingsToApply.overlay.intensity;
        }
        if (settingsToApply.overlay.speed !== undefined) updatedWallpaperData.overlaySpeed = settingsToApply.overlay.speed;
        if (settingsToApply.overlay.wind !== undefined) updatedWallpaperData.overlayWind = settingsToApply.overlay.wind;
        if (settingsToApply.overlay.gravity !== undefined) {
          updatedWallpaperData.overlayGravity = settingsToApply.overlay.gravity;
        }
        await window.api.wallpapers.set(updatedWallpaperData);
      } catch (overlayError) {
        console.error('[applyPresetData] Overlay save failed:', overlayError);
      }
    }
  } catch (error) {
    console.error('[applyPresetData] Backend persist failed:', error);
  }
}
