import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { isSpotifyPremiumUser } from '../utils/spotifyTier';
import { useActivityInterval } from './useActivityInterval';
import { useAnimationActivity } from './useAnimationActivity';

/**
 * Spotify Web API sampler for the dedicated Spotify widget.
 * Shared Now Playing uses Windows system media and never consumes this sampler.
 */
export function useSharedSpotifyPlaybackSampler() {
  const { isConnected, playerWebApiForbidden, widgetVisible, isPremium } =
    useConsolidatedAppStore(
      useShallow((s) => ({
        isConnected: Boolean(s.spotify.isConnected),
        playerWebApiForbidden: Boolean(s.spotify.playerWebApiForbidden),
        widgetVisible: Boolean(s.floatingWidgets.spotify?.visible),
        isPremium: isSpotifyPremiumUser(s.spotify.currentUser),
      }))
    );

  const { isAppActive, isLowPowerMode, pollIntervalMultiplier } = useAnimationActivity({
    activeFps: 30,
    lowPowerFps: 12,
  });

  const spotifyManager = useConsolidatedAppStore((s) => s.actions.spotifyManager);

  // Keep API polling scoped to the visible Spotify experience.
  const needsSpotify =
    isConnected &&
    isPremium &&
    !playerWebApiForbidden &&
    widgetVisible;

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
