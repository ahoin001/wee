import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { pickPrimarySystemSession } from '../utils/nowPlayingShape';
import { useSharedSpotifyPlaybackSampler } from './useSharedSpotifyPlaybackSampler';

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

/**
 * Owns system-media (SMTC) subscription + shared Spotify sampler.
 * Mount once from App — event-driven SMTC, no renderer poll of system sessions.
 *
 * Free-first: SMTC stays up for Auto/System so desktop Spotify / Apple Music / etc.
 * always feed the tile. Spotify Web API is sampled separately for Premium controls.
 */
export function useNowPlayingSources() {
  useSharedSpotifyPlaybackSampler();

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
    // Never exclude Spotify from SMTC — Free users rely on desktop SMTC for display.
    const session = pickPrimarySystemSession(storedList, {});
    setSystemMediaState({
      available: lastMetaRef.current.available,
      error: lastMetaRef.current.error,
      starting: false,
      sessions: storedList,
      session: session || null,
    });
  };

  // Keep SMTC running whenever the user wants system/auto display — including when
  // preference is Spotify (so Free desktop Spotify still works as a fallback).
  const wantsSystem = systemMediaEnabled;

  // Lifecycle only — start/stop the bridge when system media is wanted.
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

    let unsub = null;
    let cancelled = false;

    const applyPayload = (payload) => {
      if (cancelled) return;
      publishPrimary(payload?.sessions, {
        available: payload?.available,
        error: payload?.error || null,
      });
    };

    unsub = api.onUpdate?.(applyPayload);

    if (smtcReleaseTimer) {
      clearTimeout(smtcReleaseTimer);
      smtcReleaseTimer = null;
    }
    smtcRetainCount += 1;

    setSystemMediaState({ starting: true, error: null });

    (async () => {
      try {
        const status = await api.start();
        if (cancelled) return;
        applyPayload(status);
      } catch (err) {
        if (cancelled) return;
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

  // Preference changes only affect reconcile (via setUIState), not SMTC membership.
  useEffect(() => {
    if (!wantsSystem) return;
    if (!lastSessionsRef.current.length && !lastMetaRef.current.available) return;
    publishPrimary(lastSessionsRef.current, lastMetaRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsSystem, preference, setSystemMediaState]);
}

export default useNowPlayingSources;
