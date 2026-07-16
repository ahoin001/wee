import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { pickPrimarySystemSession } from '../utils/nowPlayingShape';
import { useSharedSpotifyPlaybackSampler } from './useSharedSpotifyPlaybackSampler';
import { useNowPlayingColorMatch } from './useNowPlayingColorMatch';

/** Renderer watchdog — main start is non-blocking; this only clears a stuck UI flag. */
const STARTING_WATCHDOG_MS = 8000;

/**
 * Map an SMTC session DTO into the store's systemMedia.session shape.
 * @param {object} session
 */
function toStoredSession(session) {
  if (!session || typeof session !== 'object') return null;
  return {
    id: session.id,
    sourceAppUserModelId: session.sourceAppUserModelId || '',
    sourceAppDisplayName: session.sourceAppDisplayName || '',
    title: session.title || '',
    artist: session.artist || '',
    albumTitle: session.albumTitle || '',
    playbackStatus: session.playbackStatus,
    timeline: session.timeline
      ? {
          positionMs: session.timeline.positionMs,
          durationMs: session.timeline.durationMs,
        }
      : undefined,
    controls: session.controls
      ? {
          canPlay: session.controls.canPlay,
          canPause: session.controls.canPause,
          canSkipNext: session.controls.canSkipNext,
          canSkipPrevious: session.controls.canSkipPrevious,
        }
      : undefined,
    thumbnail: session.thumbnail || '',
  };
}

/**
 * Process-wide retain count so React Strict Mode remounts do not stop() the
 * SMTC bridge between the double-invoke cleanup and the second mount.
 */
let smtcRetainCount = 0;
/** @type {ReturnType<typeof setTimeout> | null} */
let smtcReleaseTimer = null;
/** Monotonic generation so a cancelled effect cannot leave `starting: true`. */
let smtcStartGeneration = 0;

/**
 * Owns system-media (SMTC) subscription + shared Spotify sampler.
 * Mount once from App — event-driven SMTC, no renderer poll of system sessions.
 *
 * Free-first: SMTC stays up for Auto/System so desktop Spotify / Apple Music / etc.
 * always feed the tile. Spotify Web API is sampled separately for Premium controls.
 */
export function useNowPlayingSources() {
  useSharedSpotifyPlaybackSampler();
  useNowPlayingColorMatch();

  const { systemMediaEnabled, preference } = useConsolidatedAppStore(
    useShallow((s) => ({
      systemMediaEnabled: s.ui.systemMediaEnabled !== false,
      preference: s.ui.nowPlayingSourcePreference || 'auto',
    }))
  );

  const setSystemMediaState = useConsolidatedAppStore((s) => s.actions.setSystemMediaState);

  const lastSessionsRef = useRef([]);
  const lastMetaRef = useRef({ available: false, error: null });

  const publishPrimary = (sessions, meta = {}) => {
    const list = Array.isArray(sessions) ? sessions : [];
    const storedList = list.map(toStoredSession).filter(Boolean);
    lastSessionsRef.current = storedList;
    if (meta.available != null) lastMetaRef.current.available = Boolean(meta.available);
    if (Object.prototype.hasOwnProperty.call(meta, 'error')) {
      lastMetaRef.current.error = meta.error || null;
    }
    const session = pickPrimarySystemSession(storedList, {});
    setSystemMediaState({
      available: lastMetaRef.current.available,
      error: lastMetaRef.current.error,
      starting: false,
      sessions: storedList,
      session: session || null,
    });
  };

  const wantsSystem = systemMediaEnabled;

  useEffect(() => {
    const api = window.api?.systemMedia;
    if (!api) {
      setSystemMediaState({
        available: false,
        starting: false,
        error: 'System media API unavailable',
        session: null,
        sessions: [],
      });
      return undefined;
    }

    if (!wantsSystem) {
      if (smtcReleaseTimer) {
        clearTimeout(smtcReleaseTimer);
        smtcReleaseTimer = null;
      }
      smtcRetainCount = 0;
      smtcStartGeneration += 1;
      api.stop?.().catch(() => {});
      lastSessionsRef.current = [];
      lastMetaRef.current = { available: false, error: null };
      setSystemMediaState({
        session: null,
        sessions: [],
        starting: false,
        error: null,
        available: false,
      });
      return undefined;
    }

    let cancelled = false;
    let unsub = null;
    /** @type {ReturnType<typeof setTimeout> | null} */
    let watchdog = null;
    const myGeneration = ++smtcStartGeneration;

    const applyPayload = (payload) => {
      if (cancelled || myGeneration !== smtcStartGeneration) return;
      publishPrimary(payload?.sessions, {
        available: payload?.available,
        error: payload?.error || null,
      });
    };

    const clearStartingIfCurrent = (extra = {}) => {
      if (cancelled || myGeneration !== smtcStartGeneration) return;
      setSystemMediaState({ starting: false, ...extra });
    };

    unsub = api.onUpdate?.(applyPayload);

    if (smtcReleaseTimer) {
      clearTimeout(smtcReleaseTimer);
      smtcReleaseTimer = null;
    }
    smtcRetainCount += 1;

    setSystemMediaState({ starting: true, error: null });

    watchdog = setTimeout(() => {
      clearStartingIfCurrent();
    }, STARTING_WATCHDOG_MS);

    (async () => {
      try {
        const status = await api.start();
        if (watchdog) {
          clearTimeout(watchdog);
          watchdog = null;
        }
        // Always clear starting for this generation — even if cancelled — so a
        // Strict Mode remount cannot leave the UI stuck on "Starting…".
        if (myGeneration === smtcStartGeneration) {
          if (cancelled) {
            setSystemMediaState({ starting: false });
            return;
          }
          applyPayload(status);
        }
      } catch (err) {
        if (watchdog) {
          clearTimeout(watchdog);
          watchdog = null;
        }
        if (myGeneration !== smtcStartGeneration) return;
        lastMetaRef.current = {
          available: false,
          error: err?.message || String(err),
        };
        setSystemMediaState({
          available: false,
          starting: false,
          error: err?.message || String(err),
          session: null,
          sessions: [],
        });
      }
    })();

    return () => {
      cancelled = true;
      if (watchdog) {
        clearTimeout(watchdog);
        watchdog = null;
      }
      // If no newer generation took over, drop the stuck flag immediately.
      if (myGeneration === smtcStartGeneration) {
        setSystemMediaState({ starting: false });
      }
      if (typeof unsub === 'function') unsub();
      smtcRetainCount = Math.max(0, smtcRetainCount - 1);
      if (smtcRetainCount === 0) {
        smtcReleaseTimer = setTimeout(() => {
          smtcReleaseTimer = null;
          if (smtcRetainCount === 0) {
            api.stop?.().catch(() => {});
          }
        }, 75);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- publishPrimary uses stable setState + refs
  }, [wantsSystem, setSystemMediaState]);

  useEffect(() => {
    if (!wantsSystem) return;
    if (!lastSessionsRef.current.length && !lastMetaRef.current.available) return;
    publishPrimary(lastSessionsRef.current, lastMetaRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsSystem, preference, setSystemMediaState]);
}

export default useNowPlayingSources;
