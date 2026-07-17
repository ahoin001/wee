import useConsolidatedAppStore from './useConsolidatedAppStore';
import {
  EMPTY_NOW_PLAYING,
  nowPlayingFromSystemSession,
  pickPrimarySystemSession,
  resolveNowPlaying,
} from './nowPlayingShape';

/**
 * Recompute the active `nowPlaying` projection from Windows system media.
 * Safe to call from event handlers / intervals — uses getState() only.
 */
export function reconcileNowPlaying() {
  const store = useConsolidatedAppStore.getState();
  const systemEnabled = store.ui?.systemMediaEnabled !== false;
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
    systemEnabled,
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
