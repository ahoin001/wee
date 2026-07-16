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
  return {
    id: session.id,
    sourceAppUserModelId: session.sourceAppUserModelId,
    sourceAppDisplayName: session.sourceAppDisplayName,
    title: session.title,
    artist: session.artist,
    albumTitle: session.albumTitle,
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
    thumbnail: session.thumbnail,
  };
}

/**
 * Owns system-media (SMTC) subscription + shared Spotify sampler.
 * Mount once from App — event-driven SMTC, no renderer poll of system sessions.
 *
 * Lifecycle (start/stop) is separate from Spotify-exclusion filtering so a Web API
 * flag flip never tears down the Windows media bridge.
 */
export function useNowPlayingSources() {
  useSharedSpotifyPlaybackSampler();

  const { systemMediaEnabled, preference, spotifyConnected, playerWebApiForbidden } =
    useConsolidatedAppStore(
      useShallow((s) => ({
        systemMediaEnabled: s.ui.systemMediaEnabled !== false,
        preference: s.ui.nowPlayingSourcePreference || 'auto',
        spotifyConnected: Boolean(s.spotify.isConnected),
        playerWebApiForbidden: Boolean(s.spotify.playerWebApiForbidden),
      }))
    );

  const setSystemMediaState = useConsolidatedAppStore((s) => s.actions.setSystemMediaState);

  const excludeSpotifyRef = useRef(false);
  // When Web API cannot supply playback, keep Spotify's SMTC session so the tile still reacts.
  excludeSpotifyRef.current =
    preference === 'auto' &&
    spotifyConnected &&
    systemMediaEnabled &&
    !playerWebApiForbidden;

  const lastSessionsRef = useRef([]);
  const lastMetaRef = useRef({ available: false, error: null });

  const publishPrimary = (sessions, meta = {}) => {
    const list = Array.isArray(sessions) ? sessions : [];
    lastSessionsRef.current = list;
    if (meta.available != null) lastMetaRef.current.available = Boolean(meta.available);
    if (Object.prototype.hasOwnProperty.call(meta, 'error')) {
      lastMetaRef.current.error = meta.error || null;
    }
    const session = pickPrimarySystemSession(list, {
      excludeSpotify: excludeSpotifyRef.current,
    });
    setSystemMediaState({
      available: lastMetaRef.current.available,
      error: lastMetaRef.current.error,
      session: session ? toStoredSession(session) : null,
    });
  };

  const wantsSystem =
    systemMediaEnabled && (preference === 'system' || preference === 'auto');

  // Lifecycle only — start/stop the bridge when system media is wanted.
  useEffect(() => {
    const api = window.api?.systemMedia;
    if (!api) {
      setSystemMediaState({
        available: false,
        error: 'System media API unavailable',
        session: null,
      });
      return undefined;
    }

    if (!wantsSystem) {
      api.stop?.().catch(() => {});
      lastSessionsRef.current = [];
      lastMetaRef.current = { available: lastMetaRef.current.available, error: null };
      setSystemMediaState({ session: null });
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

    (async () => {
      try {
        const status = await api.start();
        if (cancelled) return;
        applyPayload(status);
      } catch (err) {
        if (cancelled) return;
        setSystemMediaState({
          available: false,
          error: err?.message || String(err),
          session: null,
        });
      }
    })();

    return () => {
      cancelled = true;
      if (typeof unsub === 'function') unsub();
      // Always stop on unmount / leaving wantsSystem — main serializes vs overlapping start.
      api.stop?.().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- publishPrimary uses stable setState + refs
  }, [wantsSystem, setSystemMediaState]);

  // Filter-only: re-pick primary session when Spotify exclusion flips — no SMTC restart.
  useEffect(() => {
    if (!wantsSystem) return;
    if (!lastSessionsRef.current.length && !lastMetaRef.current.available) return;
    publishPrimary(lastSessionsRef.current, lastMetaRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs + setState; excludeSpotifyRef updated each render
  }, [
    wantsSystem,
    preference,
    spotifyConnected,
    playerWebApiForbidden,
    systemMediaEnabled,
    setSystemMediaState,
  ]);
}

export default useNowPlayingSources;
