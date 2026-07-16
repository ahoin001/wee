import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { isSpotifyPremiumUser } from '../utils/spotifyTier';
import { useActivityInterval } from './useActivityInterval';
import { useAnimationActivity } from './useAnimationActivity';

/**
 * Shared Spotify Web API playback sampler — Premium controls / enrichment only.
 * Free users rely on Windows SMTC for display; do not poll the Player API for them.
 */
export function useSharedSpotifyPlaybackSampler() {
  const { isConnected, playerWebApiForbidden, preference, isPremium } =
    useConsolidatedAppStore(
      useShallow((s) => ({
        isConnected: Boolean(s.spotify.isConnected),
        playerWebApiForbidden: Boolean(s.spotify.playerWebApiForbidden),
        preference: s.ui.nowPlayingSourcePreference || 'auto',
        isPremium: isSpotifyPremiumUser(s.spotify.currentUser),
      }))
    );

  const { isAppActive, isLowPowerMode, pollIntervalMultiplier } = useAnimationActivity({
    activeFps: 30,
    lowPowerFps: 12,
  });

  const spotifyManager = useConsolidatedAppStore((s) => s.actions.spotifyManager);

  // Premium + connected: sample Web API for transport enrichment (and Spotify-preferred display).
  // Free / forbidden: SMTC owns display — skip Player API polling.
  const needsSpotify =
    isConnected &&
    isPremium &&
    !playerWebApiForbidden &&
    (preference === 'spotify' || preference === 'auto' || preference === 'system');

  const baseMs = isLowPowerMode ? 6000 : 2000;
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
