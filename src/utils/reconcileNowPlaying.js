import useConsolidatedAppStore from './useConsolidatedAppStore';
import { isSpotifyPremiumUser } from './spotifyTier';
import {
  EMPTY_NOW_PLAYING,
  nowPlayingFromSpotify,
  nowPlayingFromSystemSession,
  normalizeNowPlayingSourcePreference,
  pickPrimarySystemSession,
  resolveNowPlaying,
} from './nowPlayingShape';

/**
 * Recompute the active `nowPlaying` projection from Spotify + system media candidates.
 * Safe to call from event handlers / intervals — uses getState() only.
 *
 * Display is SMTC-first (free desktop players). Premium Spotify Web API enriches controls.
 */
export function reconcileNowPlaying() {
  const store = useConsolidatedAppStore.getState();
  const preference = normalizeNowPlayingSourcePreference(
    store.ui?.nowPlayingSourcePreference
  );
  const systemEnabled = store.ui?.systemMediaEnabled !== false;
  const spotifyConnected = Boolean(store.spotify?.isConnected);
  const spotifyPremium = isSpotifyPremiumUser(store.spotify?.currentUser);
  const spotifyCandidate = spotifyConnected
    ? nowPlayingFromSpotify(store.spotify)
    : null;
  const sessions = Array.isArray(store.systemMedia?.sessions)
    ? store.systemMedia.sessions
    : [];
  const primarySession =
    store.systemMedia?.session ||
    (systemEnabled ? pickPrimarySystemSession(sessions, {}) : null);
  const systemCandidate = primarySession
    ? nowPlayingFromSystemSession(primarySession)
    : null;

  const next = resolveNowPlaying({
    preference,
    systemEnabled,
    spotifyConnected,
    spotifyPremium,
    spotifyCandidate,
    systemCandidate,
  });

  const prev = store.nowPlaying || EMPTY_NOW_PLAYING;
  const unchanged =
    prev.source === next.source &&
    prev.trackName === next.trackName &&
    prev.artistLine === next.artistLine &&
    prev.albumArtUrl === next.albumArtUrl &&
    prev.isPlaying === next.isPlaying &&
    prev.progressMs === next.progressMs &&
    prev.durationMs === next.durationMs &&
    prev.appName === next.appName &&
    prev.canPlay === next.canPlay &&
    prev.canPause === next.canPause &&
    prev.canSkipNext === next.canSkipNext &&
    prev.canSkipPrevious === next.canSkipPrevious &&
    prev.controlsVia === next.controlsVia &&
    prev.sourceAppUserModelId === next.sourceAppUserModelId;

  if (unchanged) return prev;

  store.actions.setNowPlayingState(next);
  return next;
}
