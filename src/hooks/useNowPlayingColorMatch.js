import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { extractColorsFromAlbumArt } from '../utils/extractColorsFromAlbumArt';

/**
 * Shared Now Playing → album-art palette pipeline.
 * Writes `spotify.extractedColors` (existing SSOT for ribbon + overlays) from
 * whatever is on `nowPlaying.albumArtUrl` — Spotify Web API *or* SMTC (Apple Music, etc.).
 *
 * Runs whenever Color Match (ribbon / wallpaper overlay / widget dynamic colors) is on,
 * so Free desktop players get the same chrome matching as Premium Spotify.
 */
export function useNowPlayingColorMatch() {
  const {
    albumArtUrl,
    trackName,
    spotifyMatchEnabled,
    liveGradientWallpaper,
    immersiveEnabled,
    widgetDynamicColors,
    setSpotifyState,
  } = useConsolidatedAppStore(
    useShallow((s) => ({
      albumArtUrl: s.nowPlaying?.albumArtUrl || '',
      trackName: s.nowPlaying?.trackName || '',
      spotifyMatchEnabled: Boolean(s.ui?.spotifyMatchEnabled),
      liveGradientWallpaper: Boolean(s.spotify?.immersiveMode?.liveGradientWallpaper),
      immersiveEnabled: Boolean(s.spotify?.immersiveMode?.enabled),
      widgetDynamicColors: Boolean(s.floatingWidgets?.spotify?.settings?.dynamicColors),
      setSpotifyState: s.actions.setSpotifyState,
    }))
  );

  const colorMatchActive =
    spotifyMatchEnabled || liveGradientWallpaper || immersiveEnabled || widgetDynamicColors;

  const lastArtRef = useRef('');
  const lastColorsRef = useRef(null);

  useEffect(() => {
    if (!colorMatchActive) {
      lastArtRef.current = '';
      if (lastColorsRef.current) {
        lastColorsRef.current = null;
        setSpotifyState({ extractedColors: null });
      }
      return undefined;
    }

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
  }, [albumArtUrl, trackName, colorMatchActive, setSpotifyState]);
}

export default useNowPlayingColorMatch;
