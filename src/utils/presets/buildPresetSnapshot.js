import useConsolidatedAppStore from '../useConsolidatedAppStore';
import { captureSpaceAppearanceFromState } from '../appearance/spaceAppearance';
import {
  getSecondaryChannelSpaceData,
  normalizeChannelSpaceData,
} from '../channelSpaces';
import { PRESET_SCOPE_VISUAL, PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS } from './presetScopes';

function cloneSafe(value, fallback = null) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return fallback;
  }
}

/**
 * Deep-clone a channel board so punched (`hidden`) slots survive preset save.
 * Normalizes via slots SSOT first so legacy maps still project holes correctly.
 */
function cloneChannelBoardForPreset(raw) {
  if (!raw || typeof raw !== 'object') return null;
  return cloneSafe(normalizeChannelSpaceData(raw), null);
}

/**
 * Appearance snapshot for a shell space: live capture when active, else stored row.
 * Always merges space-scoped wallpaper keys (per-page maps, overrides).
 */
function appearanceForSpace(state, spaceId, liveAppearance) {
  const stored = state.appearanceBySpace?.[spaceId] ?? null;
  const activeId = state.spaces?.activeSpaceId || 'home';
  if (spaceId === activeId && liveAppearance) {
    const storedWp = stored?.wallpaper || {};
    return cloneSafe(
      {
        ...liveAppearance,
        wallpaper: {
          ...(storedWp || {}),
          ...(liveAppearance.wallpaper || {}),
          useGlobalWallpaper:
            liveAppearance.wallpaper?.useGlobalWallpaper ??
            storedWp.useGlobalWallpaper ??
            true,
          spaceWallpaperUrl:
            liveAppearance.wallpaper?.spaceWallpaperUrl ?? storedWp.spaceWallpaperUrl ?? null,
          wallpaperScope:
            liveAppearance.wallpaper?.wallpaperScope === 'perPage' ||
            storedWp.wallpaperScope === 'perPage'
              ? 'perPage'
              : 'space',
          wallpaperByPage:
            liveAppearance.wallpaper?.wallpaperByPage || storedWp.wallpaperByPage || {},
        },
      },
      null
    );
  }
  return cloneSafe(stored, null);
}

/**
 * Build preset `data` payload from the consolidated store.
 * @param {object} opts
 * @param {'visual' | 'visual+homeChannels'} [opts.captureScope]
 * @param {boolean} [opts.includeSpotifyPalette] — freeze current `spotify.extractedColors` into the preset
 */
export function buildPresetDataFromStore({
  captureScope = PRESET_SCOPE_VISUAL,
  includeSpotifyPalette = false,
} = {}) {
  const state = useConsolidatedAppStore.getState();
  const { wallpaper, ribbon, time, overlay, ui, channels, spotify, dock, spaces } = state;
  // Fresh capture — never bake a stale appearanceBySpace row from the last space switch.
  const liveAppearance = captureSpaceAppearanceFromState(state);
  const mediaHubEnabled = spaces?.mediaHubEnabled === true;

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
      dynamicRibbonColorEnabled: ribbon.dynamicRibbonColorEnabled ?? false,
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
      wallpaperMatchEnabled: ui.wallpaperMatchEnabled ?? false,
    },
    dock: cloneSafe(dock, {}),
    appearanceBySpace: {
      home: appearanceForSpace(state, 'home', liveAppearance),
      workspaces: appearanceForSpace(state, 'workspaces', liveAppearance),
      ...(mediaHubEnabled
        ? { mediahub: appearanceForSpace(state, 'mediahub', liveAppearance) }
        : {}),
    },
  };

  if (captureScope === PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS) {
    presetData.homeChannels = cloneChannelBoardForPreset(channels?.dataBySpace?.home);
    presetData.focusChannels = cloneChannelBoardForPreset(getSecondaryChannelSpaceData(channels));
  }

  if (includeSpotifyPalette && spotify?.extractedColors) {
    presetData.capturedSpotifyPalette = JSON.parse(JSON.stringify(spotify.extractedColors));
  }

  return presetData;
}

export function buildPresetFromCurrentStore({
  name,
  captureScope = PRESET_SCOPE_VISUAL,
  includeSpotifyPalette = false,
  timestamp = new Date().toISOString(),
} = {}) {
  return {
    name,
    data: buildPresetDataFromStore({ captureScope, includeSpotifyPalette }),
    captureScope,
    includesHomeChannels: captureScope === PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS,
    shareable: captureScope === PRESET_SCOPE_VISUAL,
    timestamp,
  };
}
