import useConsolidatedAppStore from './useConsolidatedAppStore';

/**
 * Settings modal tab ids — must match `SETTINGS_TABS[].id` in SettingsModal.jsx.
 */
export const SETTINGS_TAB_ID = {
  API_INTEGRATIONS: 'api-integrations',
  CHANNELS: 'channels',
  DOCK: 'dock',
  GENERAL: 'general',
  GAMEHUB: 'gamehub',
  SOUNDS: 'sounds',
  THEMES: 'themes',
  UPDATES: 'updates',
  WALLPAPER: 'wallpaper',
  TIME: 'time',
  LAYOUT: 'layout',
  SHORTCUTS: 'shortcuts',
  MONITOR: 'monitor',
  MOTION: 'motion',
  NAVIGATION: 'navigation',
  WORKSPACES: 'workspaces',
};

/**
 * Open the settings modal and select a tab (used from CTAs on toasts, widgets, etc.).
 * @param {string} tabId — see SETTINGS_TAB_ID
 */
export function openSettingsToTab(tabId) {
  useConsolidatedAppStore.getState().actions.setUIState({
    showSettingsModal: true,
    settingsActiveTab: tabId,
  });
}

/**
 * Open Spotify in the default browser / OS handler (helps when no active playback device).
 */
export function openSpotifyWebApp() {
  const url = 'https://open.spotify.com';
  if (typeof window !== 'undefined' && window.api?.openExternal) {
    window.api.openExternal(url);
  } else if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
