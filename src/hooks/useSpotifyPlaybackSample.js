import { useCallback, useEffect, useState } from 'react';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { useActivityInterval } from './useActivityInterval';

/**
 * Samples Spotify progress/duration at a low rate while playing to avoid re-rendering
 * immersive overlays on every high-frequency Web API tick (~progress updates).
 *
 * Automatically pauses when the app window is hidden/unfocused via the shared activity
 * interval policy, so off-screen work doesn't continue to mutate overlay state.
 */
export function useSpotifyPlaybackSample(intervalMs = 200) {
  const isPlaying = useConsolidatedAppStore((s) => s.spotify.isPlaying);

  const [playback, setPlayback] = useState(() => {
    const s = useConsolidatedAppStore.getState().spotify;
    return { progress: s.progress || 0, duration: s.duration || 1 };
  });

  const sync = useCallback(() => {
    const s = useConsolidatedAppStore.getState().spotify;
    setPlayback({ progress: s.progress || 0, duration: s.duration || 1 });
  }, []);

  // Always sync once when playing toggles on so UI reflects fresh values.
  useEffect(() => {
    if (isPlaying) sync();
  }, [isPlaying, sync]);

  useActivityInterval(sync, intervalMs, { enabled: isPlaying });

  return playback;
}
