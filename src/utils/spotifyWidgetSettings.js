import {
  CSS_COLOR_PURE_WHITE,
  CSS_SPOTIFY_PRIMARY,
  CSS_SPOTIFY_SECONDARY,
} from '../design/runtimeColorStrings';

/** Default dynamic palette when album art is unavailable or matching is off. */
export const SPOTIFY_WIDGET_DEFAULT_DYNAMIC_COLORS = {
  primary: CSS_SPOTIFY_PRIMARY,
  secondary: CSS_SPOTIFY_SECONDARY,
  accent: CSS_COLOR_PURE_WHITE,
  text: CSS_COLOR_PURE_WHITE,
  textSecondary: 'hsl(var(--color-pure-white) / 0.88)',
};

/**
 * Resolved widget settings with defaults (mirrors FloatingSpotifyWidget prior behavior).
 * @param {{ settings?: Record<string, unknown> }} spotify
 */
export function getResolvedSpotifyWidgetSettings(spotify) {
  const s = spotify?.settings;
  return {
    dynamicColors: s?.dynamicColors ?? true,
    useBlurredBackground: s?.useBlurredBackground ?? false,
    blurAmount: s?.blurAmount ?? 30,
    autoShowWidget: s?.autoShowWidget ?? false,
    trackInfoPanelOpacity: s?.trackInfoPanelOpacity ?? 0.6,
    trackInfoPanelBlur: s?.trackInfoPanelBlur ?? 10,
  };
}
