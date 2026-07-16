import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { pickPrimarySystemSession } from '../utils/nowPlayingShape';
import { useSharedSpotifyPlaybackSampler } from './useSharedSpotifyPlaybackSampler';

/**
 * Owns system-media (SMTC) subscription + shared Spotify sampler.
 * Mount once from App — event-driven SMTC, no renderer poll of system sessions.
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

    let unsub = null;
    let cancelled = false;

    const applyPayload = (payload) => {
      if (cancelled) return;
      const sessions = Array.isArray(payload?.sessions) ? payload.sessions : [];
      const session = pickPrimarySystemSession(sessions, {
        excludeSpotify: excludeSpotifyRef.current,
      });
      setSystemMediaState({
        available: Boolean(payload?.available),
        error: payload?.error || null,
        session: session
          ? {
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
              // Thumbnail can be large; keep when present for art.
              thumbnail: session.thumbnail,
            }
          : null,
      });
    };

    const wantsSystem =
      systemMediaEnabled && (preference === 'system' || preference === 'auto');

    if (!wantsSystem) {
      api.stop?.().catch(() => {});
      setSystemMediaState({ session: null });
      return undefined;
    }

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
      api.stop?.().catch(() => {});
    };
  }, [systemMediaEnabled, preference, playerWebApiForbidden, setSystemMediaState]);
}

export default useNowPlayingSources;
