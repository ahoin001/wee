import { useCallback, useEffect, useState } from 'react';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { useActivityInterval } from './useActivityInterval';

/**
 * Samples Now Playing progress/duration at a low rate while playing to avoid
 * re-rendering immersive overlays on every system-media tick.
 *
 * Automatically pauses when the app window is hidden/unfocused via the shared
 * activity interval policy, so off-screen work doesn't continue to mutate overlay state.
 */
export function useSpotifyPlaybackSample(intervalMs = 200) {
  const isPlaying = useConsolidatedAppStore((s) => Boolean(s.nowPlaying?.isPlaying));

  const [playback, setPlayback] = useState(() => {
    const np = useConsolidatedAppStore.getState().nowPlaying;
    return {
      progress: np?.progressMs || 0,
      duration: np?.durationMs || 1,
    };
  });

  const sync = useCallback(() => {
    const np = useConsolidatedAppStore.getState().nowPlaying;
    setPlayback({
      progress: np?.progressMs || 0,
      duration: np?.durationMs || 1,
    });
  }, []);

  // Always sync once when playing toggles on so UI reflects fresh values.
  useEffect(() => {
    if (isPlaying) sync();
  }, [isPlaying, sync]);

  useActivityInterval(sync, intervalMs, { enabled: isPlaying });

  return playback;
}
