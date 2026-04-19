import { useEffect, useState } from 'react';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';

/**
 * Samples Spotify progress/duration at a low rate while playing to avoid re-rendering
 * immersive overlays on every high-frequency Web API tick (~progress updates).
 */
export function useSpotifyPlaybackSample(intervalMs = 200) {
  const isPlaying = useConsolidatedAppStore((s) => s.spotify.isPlaying);

  const [playback, setPlayback] = useState(() => {
    const s = useConsolidatedAppStore.getState().spotify;
    return { progress: s.progress || 0, duration: s.duration || 1 };
  });

  useEffect(() => {
    const sync = () => {
      const s = useConsolidatedAppStore.getState().spotify;
      setPlayback({ progress: s.progress || 0, duration: s.duration || 1 });
    };
    sync();
    if (!isPlaying) return undefined;
    const id = window.setInterval(sync, intervalMs);
    return () => window.clearInterval(id);
  }, [isPlaying, intervalMs]);

  return playback;
}
