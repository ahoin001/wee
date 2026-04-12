/** Reserved preset used for Spotify Match defaults and migration. */
export const SPOTIFY_MATCH_PRESET_NAME = 'Spotify Match';

export function createDefaultSpotifyMatchPreset() {
  return {
    name: SPOTIFY_MATCH_PRESET_NAME,
    data: {
      ui: {
        spotifyMatchEnabled: false,
      },
      ribbon: {
        ribbonColor: '#0099ff',
        ribbonGlowColor: '#0099ff',
        ribbonGlowStrength: 20,
        ribbonGlowStrengthHover: 28,
        ribbonDockOpacity: 1.0,
        glassWiiRibbon: false,
        glassOpacity: 0.18,
        glassBlur: 2.5,
        glassBorderOpacity: 0.5,
        glassShineOpacity: 0.7,
      },
      time: {
        color: '#ffffff',
        enablePill: true,
        pillBlur: 15,
        pillOpacity: 0.8,
        font: 'digital',
      },
    },
    timestamp: new Date().toISOString(),
    isSpotifyMatch: true,
  };
}
