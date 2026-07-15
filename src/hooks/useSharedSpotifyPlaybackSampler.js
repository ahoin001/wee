import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { useActivityInterval } from './useActivityInterval';
import { useAnimationActivity } from './useAnimationActivity';

/**
 * Shared Spotify Web API playback sampler — not gated on widget visibility.
 * Polls only when Spotify is connected and now-playing prefs may need Spotify data.
 */
export function useSharedSpotifyPlaybackSampler() {
  const { isConnected, playerWebApiForbidden, preference, systemMediaEnabled } =
    useConsolidatedAppStore(
      useShallow((s) => ({
        isConnected: Boolean(s.spotify.isConnected),
        playerWebApiForbidden: Boolean(s.spotify.playerWebApiForbidden),
        preference: s.ui.nowPlayingSourcePreference || 'auto',
        systemMediaEnabled: s.ui.systemMediaEnabled !== false,
      }))
    );

  const { isAppActive, isLowPowerMode, pollIntervalMultiplier } = useAnimationActivity({
    activeFps: 30,
    lowPowerFps: 12,
  });

  const spotifyManager = useConsolidatedAppStore((s) => s.actions.spotifyManager);

  const needsSpotify =
    isConnected &&
    (preference === 'spotify' || preference === 'auto' || !systemMediaEnabled);

  const baseMs = playerWebApiForbidden ? 120000 : isLowPowerMode ? 6000 : 2000;
  const intervalMs = Math.round(baseMs * (pollIntervalMultiplier || 1));

  const refresh = useCallback(() => {
    spotifyManager?.refreshPlaybackState?.();
  }, [spotifyManager]);

  useActivityInterval(refresh, intervalMs, {
    enabled: Boolean(needsSpotify && isAppActive),
  });

  return useMemo(
    () => ({ enabled: needsSpotify && isAppActive, intervalMs }),
    [needsSpotify, isAppActive, intervalMs]
  );
}
