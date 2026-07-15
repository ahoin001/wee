/**
 * Now Playing takeover — one owner for deriving when the Spotify visual stack
 * (SpotifyImmersiveOverlay + gradient overlays) is active.
 *
 * Preference (persisted): `spotify.nowPlayingExperience`
 *   'off' | 'onDemand' | 'autoIdle'
 * Momentary visibility (transient, never persisted): `ui.spotifyTakeoverActive`
 *   false | 'manual' | 'auto'
 */

export const NOW_PLAYING_EXPERIENCE_MODES = Object.freeze(['off', 'onDemand', 'autoIdle']);

/** @param {unknown} value */
export function normalizeNowPlayingExperience(value) {
  return NOW_PLAYING_EXPERIENCE_MODES.includes(value) ? value : 'onDemand';
}

/** Momentary takeover is on (any source), respecting the Off preference. */
export function selectSpotifyTakeoverActive(state) {
  const mode = normalizeNowPlayingExperience(state.spotify?.nowPlayingExperience);
  if (mode === 'off') return false;
  return Boolean(state.ui?.spotifyTakeoverActive);
}

/**
 * The immersive overlay stack should render — either the always-on immersive
 * config or a momentary takeover. Single gate for all stack components.
 */
export function selectSpotifyImmersiveActive(state) {
  return Boolean(state.spotify?.immersiveMode?.enabled) || selectSpotifyTakeoverActive(state);
}

/**
 * Enter/exit takeover (manual path — palette, Now Playing tile).
 * @param {'manual' | 'auto'} [source]
 */
export function toggleSpotifyTakeover(store, source = 'manual') {
  const state = store.getState();
  const mode = normalizeNowPlayingExperience(state.spotify?.nowPlayingExperience);
  if (mode === 'off') return;
  const current = state.ui?.spotifyTakeoverActive;
  state.actions.setUIState({ spotifyTakeoverActive: current ? false : source });
}
