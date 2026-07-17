import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { extractColorsFromAlbumArt } from '../utils/extractColorsFromAlbumArt';

/**
 * Shared Now Playing → album-art palette pipeline.
 * Always samples when album art is present so the Home Now Playing tile
 * (and any chrome that opts in) stay color-matched — immersive by default.
 * Writes `spotify.extractedColors` (SSOT for ribbon + overlays).
 */
export function useNowPlayingColorMatch() {
  const { albumArtUrl, trackName, setSpotifyState } = useConsolidatedAppStore(
    useShallow((s) => ({
      albumArtUrl: s.nowPlaying?.albumArtUrl || '',
      trackName: s.nowPlaying?.trackName || '',
      setSpotifyState: s.actions.setSpotifyState,
    }))
  );

  const lastArtRef = useRef('');
  const lastColorsRef = useRef(null);

  useEffect(() => {
    const art = String(albumArtUrl || '').trim();
    if (!art) {
      lastArtRef.current = '';
      if (lastColorsRef.current) {
        lastColorsRef.current = null;
        setSpotifyState({ extractedColors: null });
      }
      return undefined;
    }

    if (art === lastArtRef.current && lastColorsRef.current) {
      return undefined;
    }

    let cancelled = false;
    lastArtRef.current = art;

    extractColorsFromAlbumArt(art)
      .then((result) => {
        if (cancelled) return;
        const colors = result?.colors || null;
        lastColorsRef.current = colors;
        setSpotifyState({ extractedColors: colors });
      })
      .catch(() => {
        if (cancelled) return;
        lastColorsRef.current = null;
        setSpotifyState({ extractedColors: null });
      });

    return () => {
      cancelled = true;
    };
  }, [albumArtUrl, trackName, setSpotifyState]);
}

export default useNowPlayingColorMatch;
