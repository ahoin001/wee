import { mergeMotionFeedback } from '../motionFeedbackDefaults.js';
import {
  createDefaultChannelSpaceData,
  DEFAULT_SECONDARY_CHANNEL_PROFILE_ID,
  migrateLegacyChannelsToDataBySpace,
  normalizeSecondaryChannelProfiles,
} from '../channelSpaces.js';

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
  'workspaces',
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
 */
const CHANNEL_DATA_SLOT_KEYED_MAPS = ['configuredChannels', 'channelConfigs'];

/** Empty `{}` patches must not wipe a populated slot map (bad partial saves / merge bugs). */
function shouldIgnoreEmptySlotMapPatch(patchVal, baseVal) {
  if (!isPlainObject(patchVal) || !isPlainObject(baseVal)) return false;
  return Object.keys(patchVal).length === 0 && Object.keys(baseVal).length > 0;
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
    omitKeys(baseData, CHANNEL_DATA_SLOT_KEYED_MAPS),
    omitKeys(patchData, CHANNEL_DATA_SLOT_KEYED_MAPS)
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
  return merged;
}

function mergeSecondaryProfilesMap(baseProfiles, patchProfiles) {
  const out = { ...(baseProfiles || {}) };
  Object.entries(patchProfiles || {}).forEach(([id, entry]) => {
    if (!isPlainObject(entry)) return;
    const prev = out[id];
    const def = createDefaultChannelSpaceData();
    const prevSpace = prev?.channelSpace || def;
    const patchSpace = entry.channelSpace;
    const mergedSpace =
      patchSpace != null && isPlainObject(patchSpace)
        ? mergeChannelData(prevSpace, patchSpace)
        : prevSpace;
    out[id] = {
      id,
      name: typeof entry.name === 'string' && entry.name.trim() ? entry.name.trim() : prev?.name || 'Second',
      channelSpace: mergedSpace,
    };
  });
  return out;
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
  merged.secondaryChannelProfiles = mergeSecondaryProfilesMap(
    baseM.secondaryChannelProfiles,
    patchM.secondaryChannelProfiles
  );
  merged.activeSecondaryChannelProfileId =
    patchM.activeSecondaryChannelProfileId !== undefined && patchM.activeSecondaryChannelProfileId !== null
      ? patchM.activeSecondaryChannelProfileId
      : baseM.activeSecondaryChannelProfileId ?? DEFAULT_SECONDARY_CHANNEL_PROFILE_ID;
  delete merged.data;
  return normalizeSecondaryChannelProfiles(merged);
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
  spotifyWidgetShortcut: ui.spotifyWidgetShortcut ?? '',
  systemInfoWidgetShortcut: ui.systemInfoWidgetShortcut ?? '',
  adminPanelWidgetShortcut: ui.adminPanelWidgetShortcut ?? '',
  performanceMonitorShortcut: ui.performanceMonitorShortcut ?? '',
  nextPageShortcut: ui.nextPageShortcut ?? '',
  prevPageShortcut: ui.prevPageShortcut ?? '',
  toggleDockShortcut: ui.toggleDockShortcut ?? '',
  toggleDarkModeShortcut: ui.toggleDarkModeShortcut ?? '',
  toggleCustomCursorShortcut: ui.toggleCustomCursorShortcut ?? '',
  lowPowerMode: ui.lowPowerMode ?? false,
  immersivePip: ui.immersivePip ?? false,
  showDock: ui.showDock ?? true,
  classicMode: ui.classicMode ?? false,
  spotifyMatchEnabled: ui.spotifyMatchEnabled ?? false,
  channelOpacity: ui.channelOpacity ?? 1,
  keyboardShortcuts: Array.isArray(ui.keyboardShortcuts) ? ui.keyboardShortcuts : [],
  motionFeedback: mergeMotionFeedback(ui.motionFeedback),
  spaceRailAutoHide: ui.spaceRailAutoHide ?? true,
  spaceRailPinned: ui.spaceRailPinned ?? false,
  spaceRailRevealWidth: ui.spaceRailRevealWidth ?? 28,
});

export const buildSettingsSnapshotFromStore = (state = {}) => ({
  ui: selectPersistedUi(state.ui || {}),
  ribbon: state.ribbon || {},
  wallpaper: state.wallpaper || {},
  overlay: state.overlay || {},
  time: state.time || {},
  channels: state.channels || {},
  dock: state.dock || {},
  monitors: state.monitors || {},
  spotify: omitKeys(state.spotify || {}, ['playerWebApiForbidden']),
  sounds: state.sounds || {},
  floatingWidgets: state.floatingWidgets || {},
  navigation: state.navigation || {},
  presets: Array.isArray(state.presets) ? state.presets : [],
  workspaces: state.workspaces || {},
  spaces: state.spaces || {},
  appearanceBySpace: state.appearanceBySpace || {
    home: null,
    workspaces: null,
    mediahub: null,
    gamehub: null,
  },
  gameHub: state.gameHub || {},
  mediaHub: state.mediaHub || {},
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
