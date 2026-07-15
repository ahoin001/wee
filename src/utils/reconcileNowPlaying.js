import useConsolidatedAppStore from './useConsolidatedAppStore';
import {
  EMPTY_NOW_PLAYING,
  nowPlayingFromSpotify,
  nowPlayingFromSystemSession,
  normalizeNowPlayingSourcePreference,
  resolveNowPlaying,
} from './nowPlayingShape';

/**
 * Recompute the active `nowPlaying` projection from Spotify + system media candidates.
 * Safe to call from event handlers / intervals — uses getState() only.
 */
export function reconcileNowPlaying() {
  const store = useConsolidatedAppStore.getState();
  const preference = normalizeNowPlayingSourcePreference(
    store.ui?.nowPlayingSourcePreference
  );
  const systemEnabled = store.ui?.systemMediaEnabled !== false;
  const spotifyConnected = Boolean(store.spotify?.isConnected);
  const spotifyCandidate = spotifyConnected
    ? nowPlayingFromSpotify(store.spotify)
    : null;
  const systemCandidate = store.systemMedia?.session
    ? nowPlayingFromSystemSession(store.systemMedia.session)
    : null;

  const next = resolveNowPlaying({
    preference,
    systemEnabled,
    spotifyConnected,
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
    prev.canSkipPrevious === next.canSkipPrevious;

  if (unchanged) return prev;

  store.actions.setNowPlayingState(next);
  return next;
}
