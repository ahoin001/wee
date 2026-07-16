import useConsolidatedAppStore from './useConsolidatedAppStore';

/**
 * Settings modal tab ids — must match `SETTINGS_TAB_META[].id` in `settingsRegistry.js`.
 * (The old Layout tab is merged into `channels` — label "Channels & layout".)
 */
export const SETTINGS_TAB_ID = {
  API_INTEGRATIONS: 'api-integrations',
  CHANNELS: 'channels',
  DOCK: 'dock',
  COLORS: 'colors',
  GENERAL: 'general',
  GAMEHUB: 'gamehub',
  SOUNDS: 'sounds',
  /** Presets tab route id. */
  PRESETS: 'themes',
  /** Back-compat alias retained for older callsites. */
  THEMES: 'themes',
  UPDATES: 'updates',
  WALLPAPER: 'wallpaper',
  TIME: 'time',
  SHORTCUTS: 'shortcuts',
  MONITOR: 'monitor',
  MOTION: 'motion',
  NAVIGATION: 'navigation',
  /** Home Profiles tab id (kept as `workspaces` for route stability). */
  WORKSPACES: 'workspaces',
};

/**
 * Open the settings modal and select a tab (used from CTAs on toasts, widgets, etc.).
 * @param {string} tabId — see SETTINGS_TAB_ID
 * @param {{ dockSubTab?: string }} [options] — Dock tab deep-link (e.g. `animations`, `wii-ribbon`)
 */
export function openSettingsToTab(tabId, options = {}) {
  const patch = {
    showSettingsModal: true,
    settingsActiveTab: tabId,
  };
  if (tabId === SETTINGS_TAB_ID.DOCK && options.dockSubTab) {
    patch.dockSubTab = options.dockSubTab;
  }
  useConsolidatedAppStore.getState().actions.setUIState(patch);
}

/** Open Dock settings on a specific subtab (type / classic / ribbon / animations). */
export function openSettingsToDockSubtab(dockSubTab) {
  openSettingsToTab(SETTINGS_TAB_ID.DOCK, { dockSubTab });
}

/**
 * Open Spotify in the default browser / OS handler (helps when no active playback device).
 */
export function openSpotifyWebApp() {
  openExternalUrl('https://open.spotify.com');
}

/**
 * Open a URL in the OS default browser (Electron `openExternal`, else `window.open`).
 * @param {string} url
 */
export function openExternalUrl(url) {
  if (!url) return;
  if (typeof window !== 'undefined' && window.api?.openExternal) {
    window.api.openExternal(url);
    return;
  }
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
