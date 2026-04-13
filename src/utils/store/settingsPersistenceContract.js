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
];

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

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
  spotify: state.spotify || {},
  sounds: state.sounds || {},
  floatingWidgets: state.floatingWidgets || {},
  navigation: state.navigation || {},
  presets: Array.isArray(state.presets) ? state.presets : [],
});

const mapLegacyUnifiedSettings = (settings = {}) => {
  const appearance = settings.appearance || {};
  const dock = settings.dock || {};
  const channels = settings.channels || {};
  const wallpaper = settings.wallpaper || {};
  const wallpaperCycling = wallpaper.cycling || {};
  const wallpaperOverlay = wallpaper.overlay || {};
  const system = settings.system || {};

  return {
    ui: {
      isDarkMode: appearance.theme === 'dark',
      useCustomCursor: appearance.useCustomCursor,
      cursorStyle: appearance.cursorStyle,
      immersivePip: appearance.immersivePip,
      startInFullscreen: appearance.startInFullscreen,
      showPresetsButton: appearance.showPresetsButton,
      startOnBoot: system.startOnBoot,
      settingsShortcut: system.settingsShortcut,
      lowPowerMode: system.lowPowerMode,
      showDock: dock.showDock,
      classicMode: dock.classicMode,
      spotifyMatchEnabled: appearance.spotifyMatchEnabled,
    },
    channels,
    ribbon: settings.ribbon,
    time: settings.time,
    dock,
    sounds: settings.sounds,
    wallpaper: {
      opacity: wallpaper.opacity,
      blur: wallpaper.blur,
      cycleWallpapers: wallpaperCycling.enabled,
      cycleInterval: wallpaperCycling.interval,
      cycleAnimation: wallpaperCycling.animation,
      slideDirection: wallpaperCycling.slideDirection,
      crossfadeDuration: wallpaperCycling.crossfadeDuration,
      crossfadeEasing: wallpaperCycling.crossfadeEasing,
      slideRandomDirection: wallpaperCycling.slideRandomDirection,
      slideDuration: wallpaperCycling.slideDuration,
      slideEasing: wallpaperCycling.slideEasing,
    },
    overlay: {
      enabled: wallpaperOverlay.enabled,
      effect: wallpaperOverlay.effect,
      intensity: wallpaperOverlay.intensity,
      speed: wallpaperOverlay.speed,
      wind: wallpaperOverlay.wind,
      gravity: wallpaperOverlay.gravity,
    },
    presets: settings.presets,
    floatingWidgets: settings.floatingWidgets,
    navigation: settings.navigation,
    monitors: settings.monitors,
    spotify: settings.spotify,
  };
};

export const normalizeUnifiedSettingsSnapshot = (settings = {}) => {
  if (!isPlainObject(settings)) return {};

  const source =
    settings.ui || settings.ribbon || settings.time
      ? settings
      : settings.appearance || settings.dock || settings.channels
        ? mapLegacyUnifiedSettings(settings)
        : settings;

  const canonical = {};
  CANONICAL_SETTINGS_KEYS.forEach((key) => {
    if (source[key] !== undefined) {
      canonical[key] = source[key];
    }
  });

  if (canonical.ui) {
    canonical.ui = selectPersistedUi(canonical.ui);
  }

  return canonical;
};

export const mergeCanonicalSettings = (baseSettings, nextPatch) => {
  return deepMerge(
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
