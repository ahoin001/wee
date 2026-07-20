/**
 * Enter / exit helpers for Immersive Sound Mode.
 * Isolated from Spotify takeover — own transient session flag.
 */

import { normalizeImmersiveSoundMode } from './immersiveSoundModePrefs.js';

/** @param {object} state */
export function selectImmersiveSoundModePrefs(state) {
  return normalizeImmersiveSoundMode(state?.ui?.immersiveSoundMode);
}

/** Feature master + session visibility. */
export function selectImmersiveSoundModeActive(state) {
  const prefs = selectImmersiveSoundModePrefs(state);
  if (!prefs.enabled) return false;
  return Boolean(state?.ui?.immersiveSoundModeActive);
}

/**
 * @param {{ getState: Function }} store
 * @param {'manual' | 'auto'} [source]
 */
export function enterImmersiveSoundMode(store, source = 'manual') {
  const state = store.getState();
  const prefs = selectImmersiveSoundModePrefs(state);
  if (!prefs.enabled) return;
  if (!state.nowPlaying?.isPlaying && !state.nowPlaying?.trackName) return;
  state.actions.setUIState({
    immersiveSoundModeActive: source,
    /** Close settings so the stage isn’t trapped under the modal. */
    showSettingsModal: false,
  });
}

/**
 * @param {{ getState: Function }} store
 */
export function exitImmersiveSoundMode(store) {
  const state = store.getState();
  if (!state.ui?.immersiveSoundModeActive) return;
  state.actions.setUIState({ immersiveSoundModeActive: false });
}

/**
 * @param {{ getState: Function }} store
 * @param {'manual' | 'auto'} [source]
 */
export function toggleImmersiveSoundMode(store, source = 'manual') {
  const state = store.getState();
  if (state.ui?.immersiveSoundModeActive) {
    exitImmersiveSoundMode(store);
    return;
  }
  enterImmersiveSoundMode(store, source);
}
