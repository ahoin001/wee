import { saveUnifiedSettingsSnapshot, saveUnifiedSoundSettings } from '../electronApi';
import { normalizePresetSoundsSnapshot } from '../presetSoundSettings';
import useConsolidatedAppStore from '../useConsolidatedAppStore';
import { normalizeWallpaperCurrentShape } from '../presetSharing';
import { syncActiveSpaceAppearanceCapture } from '../appearance/spaceAppearance';
import {
  PRESET_SCOPE_VISUAL,
  isPresetScopeWithHomeChannels,
  normalizePresetScope,
} from './presetScopes';

function normalizeSettingsShape(settingsToApply) {
  const hasOldStructure =
    settingsToApply &&
    (settingsToApply.timeColor !== undefined ||
      settingsToApply.enableTimePill !== undefined ||
      settingsToApply.ribbonColor !== undefined ||
      settingsToApply.glassWiiRibbon !== undefined ||
      settingsToApply.wallpaperOpacity !== undefined);

  if (!hasOldStructure) {
    if (settingsToApply?.wallpaper) {
      return {
        ...settingsToApply,
        wallpaper: normalizeWallpaperCurrentShape(settingsToApply.wallpaper),
      };
    }
    return settingsToApply;
  }

  return {
    time: {
      color: settingsToApply.timeColor,
      enablePill: settingsToApply.enableTimePill,
      pillBlur: settingsToApply.timePillBlur,
      pillOpacity: settingsToApply.timePillOpacity,
      font: settingsToApply.timeFont,
    },
    ribbon: {
      dynamicRibbonColorEnabled: settingsToApply.dynamicRibbonColorEnabled,
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
    wallpaper: normalizeWallpaperCurrentShape({
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
    }),
    ui: {
      presetsButtonConfig: settingsToApply.presetsButtonConfig,
    },
    ...(settingsToApply.dock ? { dock: settingsToApply.dock } : {}),
    ...(settingsToApply.appearanceBySpace
      ? { appearanceBySpace: settingsToApply.appearanceBySpace }
      : {}),
  };
}

/**
 * Apply a preset's `data` to the consolidated store and unified persistence backends.
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
  const captureScope = normalizePresetScope(preset.captureScope);

  if (!settingsToApply || typeof settingsToApply !== 'object') {
    console.error('[applyPresetData] Invalid settings structure');
    return;
  }

  const { setWallpaperState, setRibbonState, setTimeState, setOverlayState, setUIState, setSoundsState, setDockState, setAppearanceBySpaceState } =
    useConsolidatedAppStore.getState().actions;

  if (settingsToApply.wallpaper) {
    setWallpaperState(settingsToApply.wallpaper);
  }

  if (settingsToApply.ribbon) {
    const wallpaperMatchEnabled = useConsolidatedAppStore.getState().ui?.wallpaperMatchEnabled;
    const presetWantsWallpaperMatch = settingsToApply.ui?.wallpaperMatchEnabled === true;
    const hasExplicitRibbonColor =
      Boolean(settingsToApply.ribbon.ribbonColor) || Boolean(settingsToApply.ribbon.ribbonGlowColor);
    // Explicit Look ribbon colors win unless the preset intentionally keeps match on.
    if (wallpaperMatchEnabled && hasExplicitRibbonColor && !presetWantsWallpaperMatch) {
      setUIState({ wallpaperMatchEnabled: false });
      setRibbonState(settingsToApply.ribbon);
    } else if ((wallpaperMatchEnabled || presetWantsWallpaperMatch) && !hasExplicitRibbonColor) {
      // Match stays on / will be on — leave ambient ownership of ribbon hexes.
      const ribbonRest = { ...settingsToApply.ribbon };
      delete ribbonRest.ribbonColor;
      delete ribbonRest.ribbonGlowColor;
      delete ribbonRest.recentRibbonColors;
      delete ribbonRest.recentRibbonGlowColors;
      setRibbonState(ribbonRest);
    } else {
      setRibbonState(settingsToApply.ribbon);
    }
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

  if (settingsToApply.dock && typeof setDockState === 'function') {
    setDockState(settingsToApply.dock);
  }

  if (settingsToApply.appearanceBySpace && typeof setAppearanceBySpaceState === 'function') {
    const abs = settingsToApply.appearanceBySpace;
    const appearancePatch = {};
    if (abs.home !== undefined) appearancePatch.home = abs.home;
    if (abs.workspaces !== undefined) appearancePatch.workspaces = abs.workspaces;
    if (abs.mediahub !== undefined) appearancePatch.mediahub = abs.mediahub;
    if (abs.gamehub !== undefined) appearancePatch.gamehub = abs.gamehub;
    setAppearanceBySpaceState(
      Object.keys(appearancePatch).length > 0 ? appearancePatch : abs
    );
  }

  if (isPresetScopeWithHomeChannels(captureScope)) {
    const { setChannelDataForSpace, setChannelState } = useConsolidatedAppStore.getState().actions;
    if (settingsToApply.homeChannels) {
      setChannelDataForSpace('home', settingsToApply.homeChannels);
    }
    if (settingsToApply.focusChannels) {
      setChannelDataForSpace('workspaces', settingsToApply.focusChannels);
    }
    if (!settingsToApply.homeChannels && !settingsToApply.focusChannels && settingsToApply.channels) {
      setChannelState(settingsToApply.channels);
    }
  }
  const channelsPatchForPersist = (() => {
    if (!isPresetScopeWithHomeChannels(captureScope)) return settingsToApply.channels;
    if (!settingsToApply.homeChannels && !settingsToApply.focusChannels) {
      return settingsToApply.channels;
    }
    return {
      dataBySpace: {
        ...(settingsToApply.homeChannels ? { home: settingsToApply.homeChannels } : {}),
        ...(settingsToApply.focusChannels ? { workspaces: settingsToApply.focusChannels } : {}),
      },
    };
  })();

  const normalizedSounds = captureScope === PRESET_SCOPE_VISUAL
    ? null
    : normalizePresetSoundsSnapshot(settingsToApply.sounds);
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

  // Re-capture the active space so boot hydration cannot clobber the look we just applied
  // with a stale appearanceBySpace snapshot (wallpaper.current survives; ribbon does not).
  const synced = syncActiveSpaceAppearanceCapture({
    getState: () => useConsolidatedAppStore.getState(),
    setAppearanceBySpaceState,
  });
  const appearanceBySpaceForPersist = synced
    ? {
        ...(settingsToApply.appearanceBySpace || {}),
        [synced.spaceId]: synced.appearance,
      }
    : settingsToApply.appearanceBySpace || null;

  try {
    const matchOffForRibbon =
      Boolean(settingsToApply.ribbon?.ribbonColor || settingsToApply.ribbon?.ribbonGlowColor) &&
      useConsolidatedAppStore.getState().ui?.wallpaperMatchEnabled === false;
    const uiForPersist = {
      ...(settingsToApply.ui || {}),
      ...(matchOffForRibbon ? { wallpaperMatchEnabled: false } : {}),
    };

    await saveUnifiedSettingsSnapshot({
      ...(Object.keys(uiForPersist).length > 0 ? { ui: uiForPersist } : {}),
      ...(settingsToApply.ribbon ? { ribbon: settingsToApply.ribbon } : {}),
      ...(settingsToApply.time ? { time: settingsToApply.time } : {}),
      ...(isPresetScopeWithHomeChannels(captureScope) && channelsPatchForPersist
        ? { channels: channelsPatchForPersist }
        : {}),
      ...(settingsToApply.wallpaper ? { wallpaper: settingsToApply.wallpaper } : {}),
      ...(settingsToApply.overlay ? { overlay: settingsToApply.overlay } : {}),
      ...(settingsToApply.dock ? { dock: settingsToApply.dock } : {}),
      ...(appearanceBySpaceForPersist
        ? { appearanceBySpace: appearanceBySpaceForPersist }
        : {}),
      ...(normalizedSounds ? { sounds: normalizedSounds } : {}),
    });

    if (settingsToApply.wallpaper && window.api?.wallpapers?.get && window.api?.wallpapers?.set) {
      try {
        const currentWallpaperData = await window.api.wallpapers.get();
        const updatedWallpaperData = { ...currentWallpaperData };
        const activeWallpaper =
          settingsToApply.wallpaper.current !== undefined
            ? settingsToApply.wallpaper.current
            : typeof settingsToApply.wallpaper.url === 'string'
              ? {
                  url: settingsToApply.wallpaper.url,
                  name: settingsToApply.wallpaper.name,
                  mimeType: settingsToApply.wallpaper.mimeType,
                  source: settingsToApply.wallpaper.source,
                }
              : undefined;
        if (activeWallpaper !== undefined) {
          updatedWallpaperData.wallpaper = activeWallpaper;
        }
        if (settingsToApply.wallpaper.opacity !== undefined) {
          updatedWallpaperData.wallpaperOpacity = settingsToApply.wallpaper.opacity;
        }
        if (settingsToApply.wallpaper.blur !== undefined) {
          updatedWallpaperData.wallpaperBlur = settingsToApply.wallpaper.blur;
        }
        if (settingsToApply.wallpaper.workspaceBrightness !== undefined) {
          updatedWallpaperData.wallpaperWorkspaceBrightness = settingsToApply.wallpaper.workspaceBrightness;
        }
        if (settingsToApply.wallpaper.workspaceSaturate !== undefined) {
          updatedWallpaperData.wallpaperWorkspaceSaturate = settingsToApply.wallpaper.workspaceSaturate;
        }
        if (settingsToApply.wallpaper.gameHubBrightness !== undefined) {
          updatedWallpaperData.wallpaperGameHubBrightness = settingsToApply.wallpaper.gameHubBrightness;
        }
        if (settingsToApply.wallpaper.gameHubSaturate !== undefined) {
          updatedWallpaperData.wallpaperGameHubSaturate = settingsToApply.wallpaper.gameHubSaturate;
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
