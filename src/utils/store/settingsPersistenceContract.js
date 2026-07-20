import { mergeMotionFeedback } from '../motionFeedbackDefaults.js';
import { normalizeHomeWidgetGlass } from '../homeWidgetGlass.js';
import { normalizeHomeSteamWidget } from '../homeSteamWidgetPrefs.js';
import { normalizeHomeClockWidget } from '../homeClockWidgetPrefs.js';
import { normalizeHomeRecentlyUsedWidget } from '../homeRecentlyUsedWidgetPrefs.js';
import { normalizeHomeNowPlayingWidget } from '../homeNowPlayingWidgetPrefs.js';
/** BETA: Immersive Sound Mode — remove with `src/features/immersiveSoundMode/`. */
import { normalizeImmersiveSoundMode } from '../../features/immersiveSoundMode/immersiveSoundModePrefs.js';
/** BETA: Scene FX — remove with `src/features/sceneFxBeta/`. */
import { normalizeSceneFxBeta } from '../../features/sceneFxBeta/sceneFxBetaPrefs.js';
import {
  createDefaultChannelSpaceData,
  migrateLegacyChannelsToDataBySpace,
  normalizeShellSpaceOrder,
  resolveMediaHubEnabled,
} from '../channelSpaces.js';
import { sanitizeRecentLaunches } from '../recentLaunches.js';
import { pruneKeyedCacheForPersistence } from './persistedCachePrune.js';

export const SETTINGS_SCHEMA_VERSION = 2;

export const CANONICAL_SETTINGS_KEYS = [
  'ui',
  'ribbon',
  'wallpaper',
  'overlay',
  'time',
  'channels',
  'dock',
  'monitors',
  'spotify',
  'sounds',
  'floatingWidgets',
  'navigation',
  'presets',
  'spaces',
  'appearanceBySpace',
  'gameHub',
  'mediaHub',
];

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const omitKeys = (obj, keys) => {
  if (!isPlainObject(obj)) return {};
  const next = { ...obj };
  keys.forEach((k) => {
    delete next[k];
  });
  return next;
};

/**
 * Channel slot maps (`channel-0` …) encode order: the key set *is* the layout.
 * Deep-merge would keep stale slot keys when a reorder omits emptied slots, duplicating
 * tiles after persist. When the patch owns these keys, replace the whole map.
 * `slots` (array SSOT) is also replaced wholesale when present.
 * Keep in sync with `shared/settings-patch-merge.cjs` (`CHANNEL_DATA_SLOT_KEYED_MAPS`).
 */
const CHANNEL_DATA_SLOT_KEYED_MAPS = ['configuredChannels', 'channelConfigs', 'slotMeta'];

/** Empty `{}` patches must not wipe a populated slot map (bad partial saves / merge bugs). */
function shouldIgnoreEmptySlotMapPatch(patchVal, baseVal) {
  if (!isPlainObject(patchVal) || !isPlainObject(baseVal)) return false;
  return Object.keys(patchVal).length === 0 && Object.keys(baseVal).length > 0;
}

/** Empty `slots: []` must not wipe a populated board (same class of bug as empty maps). */
function shouldIgnoreEmptySlotsPatch(patchSlots, baseSlots) {
  return (
    Array.isArray(patchSlots) &&
    patchSlots.length === 0 &&
    Array.isArray(baseSlots) &&
    baseSlots.length > 0
  );
}

const deepMerge = (target, source) => {
  if (!isPlainObject(target) || !isPlainObject(source)) return source;
  const next = { ...target };
  Object.entries(source).forEach(([key, value]) => {
    if (isPlainObject(value) && isPlainObject(next[key])) {
      next[key] = deepMerge(next[key], value);
    } else {
      next[key] = value;
    }
  });
  return next;
};

function mergeChannelData(baseData, patchData) {
  if (!isPlainObject(patchData)) return isPlainObject(baseData) ? baseData : {};
  if (!isPlainObject(baseData)) return patchData;

  const mergedRest = deepMerge(
    omitKeys(baseData, [...CHANNEL_DATA_SLOT_KEYED_MAPS, 'slots']),
    omitKeys(patchData, [...CHANNEL_DATA_SLOT_KEYED_MAPS, 'slots'])
  );
  const merged = { ...mergedRest };
  CHANNEL_DATA_SLOT_KEYED_MAPS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(patchData, key)) {
      const pv = patchData[key];
      const bv = baseData[key];
      merged[key] = shouldIgnoreEmptySlotMapPatch(pv, bv) ? bv : pv;
    } else if (Object.prototype.hasOwnProperty.call(baseData, key)) {
      merged[key] = baseData[key];
    }
  });
  if (Object.prototype.hasOwnProperty.call(patchData, 'slots') && Array.isArray(patchData.slots)) {
    merged.slots = shouldIgnoreEmptySlotsPatch(patchData.slots, baseData.slots)
      ? baseData.slots
      : patchData.slots;
  } else if (Array.isArray(baseData.slots)) {
    merged.slots = baseData.slots;
  }
  return merged;
}

export function mergeChannelsSlice(baseChannels, patchChannels) {
  if (!isPlainObject(patchChannels)) return isPlainObject(baseChannels) ? baseChannels : {};
  if (!isPlainObject(baseChannels)) return patchChannels;

  const merged = deepMerge(
    omitKeys(baseChannels, [
      'data',
      'settings',
      'operations',
      'dataBySpace',
      'secondaryChannelProfiles',
      'activeSecondaryChannelProfileId',
    ]),
    omitKeys(patchChannels, [
      'data',
      'settings',
      'operations',
      'dataBySpace',
      'secondaryChannelProfiles',
      'activeSecondaryChannelProfileId',
    ])
  );
  merged.settings = deepMerge(baseChannels.settings || {}, patchChannels.settings || {});
  merged.operations = deepMerge(baseChannels.operations || {}, patchChannels.operations || {});

  const baseM = migrateLegacyChannelsToDataBySpace(baseChannels);
  const patchM = migrateLegacyChannelsToDataBySpace(patchChannels);
  const def = createDefaultChannelSpaceData();
  merged.dataBySpace = {
    home: mergeChannelData(
      baseM.dataBySpace?.home || def,
      patchM.dataBySpace?.home != null ? patchM.dataBySpace.home : patchChannels.data || {}
    ),
    workspaces: mergeChannelData(
      baseM.dataBySpace?.workspaces || def,
      patchM.dataBySpace?.workspaces != null ? patchM.dataBySpace.workspaces : patchChannels.data || {}
    ),
  };
  delete merged.data;
  delete merged.secondaryChannelProfiles;
  delete merged.activeSecondaryChannelProfileId;
  return merged;
}

function mergeSettingsAtRoot(base, patch) {
  if (!isPlainObject(base) && !isPlainObject(patch)) return patch ?? base;
  const next = { ...(isPlainObject(base) ? base : {}) };
  if (!isPlainObject(patch)) return next;

  Object.entries(patch).forEach(([key, value]) => {
    if (key === 'channels') {
      next[key] = mergeChannelsSlice(base?.channels, value);
    } else {
      next[key] = deepMerge(base?.[key], value);
    }
  });
  return next;
}

const selectPersistedUi = (ui = {}) => ({
  isDarkMode: ui.isDarkMode ?? false,
  useCustomCursor: ui.useCustomCursor ?? true,
  cursorStyle: ui.cursorStyle ?? 'classic',
  startInFullscreen: ui.startInFullscreen ?? false,
  showPresetsButton: ui.showPresetsButton ?? false,
  startOnBoot: ui.startOnBoot ?? false,
  settingsShortcut: ui.settingsShortcut ?? '',
  systemInfoWidgetShortcut: ui.systemInfoWidgetShortcut ?? '',
  adminPanelWidgetShortcut: ui.adminPanelWidgetShortcut ?? '',
  performanceMonitorShortcut: ui.performanceMonitorShortcut ?? '',
  nextPageShortcut: ui.nextPageShortcut ?? '',
  prevPageShortcut: ui.prevPageShortcut ?? '',
  toggleDockShortcut: ui.toggleDockShortcut ?? '',
  toggleDarkModeShortcut: ui.toggleDarkModeShortcut ?? '',
  toggleCustomCursorShortcut: ui.toggleCustomCursorShortcut ?? '',
  lowPowerMode: ui.lowPowerMode ?? false,
  performancePauseOnGameLaunch: ui.performancePauseOnGameLaunch !== false,
  immersivePip: ui.immersivePip ?? false,
  showDock: ui.showDock ?? true,
  classicMode: ui.classicMode ?? false,
  spotifyMatchEnabled: ui.spotifyMatchEnabled ?? false,
  wallpaperMatchEnabled: ui.wallpaperMatchEnabled !== false,
  channelOpacity: ui.channelOpacity ?? 1,
  keyboardShortcuts: Array.isArray(ui.keyboardShortcuts) ? ui.keyboardShortcuts : [],
  motionFeedback: mergeMotionFeedback(ui.motionFeedback),
  spaceRailAutoHide: ui.spaceRailAutoHide ?? true,
  spaceRailPinned: ui.spaceRailPinned ?? false,
  spaceRailRevealWidth: ui.spaceRailRevealWidth ?? 28,
  updateDismissedVersion: typeof ui.updateDismissedVersion === 'string' ? ui.updateDismissedVersion : '',
  /* One-time Home coach marks */
  homeArrangeHintSeen: ui.homeArrangeHintSeen ?? false,
  homeBoardWidgetCoachDismissed: ui.homeBoardWidgetCoachDismissed ?? false,
  presetHideBoardHintDismissed: ui.presetHideBoardHintDismissed ?? false,
  /* Command palette: open state stays transient; only recents persist */
  commandPaletteRecent: Array.isArray(ui.commandPaletteRecent) ? ui.commandPaletteRecent.slice(0, 8) : [],
  systemMediaEnabled: ui.systemMediaEnabled !== false,
  homeWidgetGlass: normalizeHomeWidgetGlass(ui.homeWidgetGlass),
  homeWeatherTempUnit: ui.homeWeatherTempUnit === 'C' ? 'C' : 'F',
  homeSteamWidget: normalizeHomeSteamWidget(ui.homeSteamWidget),
  homeClockWidget: normalizeHomeClockWidget(ui.homeClockWidget),
  homeNowPlayingWidget: normalizeHomeNowPlayingWidget(ui.homeNowPlayingWidget),
  homeRecentlyUsedWidget: normalizeHomeRecentlyUsedWidget(ui.homeRecentlyUsedWidget),
  /* BETA: Immersive Sound Mode — remove with feature folder */
  immersiveSoundMode: normalizeImmersiveSoundMode(ui.immersiveSoundMode),
  /* BETA: Scene FX — remove with feature folder */
  sceneFxBeta: normalizeSceneFxBeta(ui.sceneFxBeta),
});

/** Strip modal / loading chrome — prefs only. Side peeks are always Wee. */
export const sanitizePersistedNavigation = (navigation = {}) => {
  if (!isPlainObject(navigation)) return {};
  const next = omitKeys(navigation, ['showNavigationModal', 'loading', 'error']);
  const isRetiredSpotifyButton = (button) =>
    button?.id === 'spotify' || button?.action === 'toggle-spotify';
  if (Array.isArray(next.defaultButtons)) {
    next.defaultButtons = next.defaultButtons.filter((button) => !isRetiredSpotifyButton(button));
  }
  if (Array.isArray(next.customButtons)) {
    next.customButtons = next.customButtons.filter((button) => !isRetiredSpotifyButton(button));
  }
  if (Array.isArray(next.buttonOrder)) {
    next.buttonOrder = next.buttonOrder.filter((id) => id !== 'spotify');
  }
  next.sideNavStyle = 'wee';
  return next;
};

/** Strip live telemetry; keep positions, visibility, and configs.
 * Remove retired Spotify widget data and force archived System Info off.
 */
const selectPersistedFloatingWidgets = (floatingWidgets = {}) => {
  if (!isPlainObject(floatingWidgets)) return {};
  const next = omitKeys(floatingWidgets, ['spotify']);
  if (isPlainObject(next.systemInfo)) {
    next.systemInfo = omitKeys(
      { ...next.systemInfo, visible: false },
      ['data', 'isLoading', 'error']
    );
  }
  return next;
};

/** Strip rail animation flags; force Media Hub archived off when flagged. */
const selectPersistedSpaces = (spaces = {}) => {
  if (!isPlainObject(spaces)) return {};
  const next = omitKeys(spaces, ['isTransitioning', 'railVisible', 'shellTransitionMs']);
  const mediaHubEnabled = resolveMediaHubEnabled(next.order, {
    mediaHubEnabled: next.mediaHubEnabled,
  });
  next.mediaHubEnabled = mediaHubEnabled;
  next.order = normalizeShellSpaceOrder(next.order, { mediaHubEnabled });
  if (Array.isArray(next.order) && next.activeSpaceId && !next.order.includes(next.activeSpaceId)) {
    next.activeSpaceId =
      next.lastChannelSpaceId === 'workspaces' ? 'workspaces' : 'home';
  }
  return next;
};

/**
 * Persist channel boards + settings; drop operations runtime and in-flight page animation.
 * @param {Record<string, unknown>} spaceData
 */
function selectPersistedChannelSpaceData(spaceData) {
  if (!isPlainObject(spaceData)) return spaceData;
  const navigation = isPlainObject(spaceData.navigation)
    ? {
        ...spaceData.navigation,
        isAnimating: false,
        animationDirection: 'none',
        animationWrapped: false,
      }
    : spaceData.navigation;
  return {
    ...spaceData,
    navigation,
  };
}

const selectPersistedChannels = (channels = {}) => {
  if (!isPlainObject(channels)) return {};
  // Collapse removed Focus profiles before stripping their legacy keys so the
  // active board survives first hydration from older settings.
  const migrated = migrateLegacyChannelsToDataBySpace(channels);
  const next = omitKeys(migrated, [
    'operations',
    'data',
    'secondaryChannelProfiles',
    'activeSecondaryChannelProfileId',
  ]);
  // Tombstone nulls so main mergeSettingsPatch overwrites disk ghosts (omit alone keeps them).
  next.secondaryChannelProfiles = null;
  next.activeSecondaryChannelProfileId = null;
  next.recentLaunches = sanitizeRecentLaunches(migrated.recentLaunches);
  if (isPlainObject(migrated.dataBySpace)) {
    next.dataBySpace = {
      home: selectPersistedChannelSpaceData(migrated.dataBySpace.home),
      workspaces: selectPersistedChannelSpaceData(migrated.dataBySpace.workspaces),
    };
  }
  return next;
};

const selectPersistedMediaHub = (mediaHub = {}) => {
  if (!isPlainObject(mediaHub)) return {};
  const next = { ...mediaHub };
  if (isPlainObject(mediaHub.sources)) {
    next.sources = {
      ...mediaHub.sources,
      streamsById: pruneKeyedCacheForPersistence(mediaHub.sources.streamsById),
      seriesMetaById: pruneKeyedCacheForPersistence(mediaHub.sources.seriesMetaById),
    };
  }
  return next;
};

export const buildSettingsSnapshotFromStore = (state = {}) => ({
  ui: selectPersistedUi(state.ui || {}),
  ribbon: state.ribbon || {},
  wallpaper: omitKeys(state.wallpaper || {}, [
    'visualCommittedUrl',
    'isTransitioning',
    'next',
    'crossfadeProgress',
    'slideProgress',
  ]),
  overlay: state.overlay || {},
  time: state.time || {},
  channels: selectPersistedChannels(state.channels || {}),
  dock: state.dock || {},
  monitors: state.monitors || {},
  spotify: omitKeys(state.spotify || {}, ['playerWebApiForbidden', 'settings']),
  sounds: state.sounds || {},
  floatingWidgets: selectPersistedFloatingWidgets(state.floatingWidgets || {}),
  navigation: sanitizePersistedNavigation(state.navigation || {}),
  presets: Array.isArray(state.presets) ? state.presets : [],
  spaces: selectPersistedSpaces(state.spaces || {}),
  appearanceBySpace: state.appearanceBySpace || {
    home: null,
    workspaces: null,
    mediahub: null,
    gamehub: null,
  },
  gameHub: state.gameHub || {},
  mediaHub: selectPersistedMediaHub(state.mediaHub || {}),
});

export const normalizeUnifiedSettingsSnapshot = (settings = {}) => {
  if (!isPlainObject(settings)) return {};

  const canonical = {};
  CANONICAL_SETTINGS_KEYS.forEach((key) => {
    if (settings[key] !== undefined) {
      canonical[key] = settings[key];
    }
  });

  if (canonical.ui) {
    canonical.ui = selectPersistedUi(canonical.ui);
  }
  if (canonical.navigation) {
    canonical.navigation = sanitizePersistedNavigation(canonical.navigation);
  }
  if (canonical.floatingWidgets) {
    canonical.floatingWidgets = selectPersistedFloatingWidgets(canonical.floatingWidgets);
  }
  if (canonical.spaces) {
    canonical.spaces = selectPersistedSpaces(canonical.spaces);
  }
  if (canonical.channels) {
    canonical.channels = selectPersistedChannels(canonical.channels);
  }

  return canonical;
};

export const mergeCanonicalSettings = (baseSettings, nextPatch) => {
  return mergeSettingsAtRoot(
    normalizeUnifiedSettingsSnapshot(baseSettings || {}),
    normalizeUnifiedSettingsSnapshot(nextPatch || {})
  );
};

export const withSettingsSchemaMeta = (payload = {}) => {
  const meta = isPlainObject(payload.meta) ? payload.meta : {};
  return {
    ...payload,
    meta: {
      ...meta,
      settingsSchemaVersion: SETTINGS_SCHEMA_VERSION,
    },
  };
};
