/**
 * Hub-widget reference palettes (hub-widget.html PALETTES.mint / PALETTES.daylight).
 * Hex/rgba live here per project rules — widgets consume via spotifyGooeyTokens CSS vars.
 */

/** Classic Mint — dark shell (hub `mint`) */
export const GOOEY_HUB_CLASSIC_MINT = {
  name: 'Classic Mint',
  type: 'dark',
  primary: '#1DB954',
  bg: '#121212',
  surface: 'rgba(255, 255, 255, 0.05)',
  surfaceHover: 'rgba(255, 255, 255, 0.1)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.4)',
  border: 'rgba(255, 255, 255, 0.05)',
  glow: 'rgba(29, 185, 84, 0.3)',
  contrastOnPrimary: '#000000',
};

/** Daylight Mint — light shell (hub `daylight`) */
export const GOOEY_HUB_DAYLIGHT_MINT = {
  name: 'Daylight Mint',
  type: 'light',
  primary: '#1DB954',
  bg: '#F8F9FA',
  surface: 'rgba(0, 0, 0, 0.03)',
  surfaceHover: 'rgba(0, 0, 0, 0.06)',
  textPrimary: '#121212',
  textSecondary: 'rgba(0, 0, 0, 0.5)',
  border: 'rgba(0, 0, 0, 0.05)',
  glow: 'rgba(29, 185, 84, 0.2)',
  /** Hub: white on green for light theme primary chips */
  contrastOnPrimary: '#FFFFFF',
};

/**
 * @param {boolean} isDarkMode — from app UI store (`useIsDarkMode`)
 * @returns {typeof GOOEY_HUB_CLASSIC_MINT}
 */
export function getGooeyMintPalette(isDarkMode) {
  return isDarkMode ? GOOEY_HUB_CLASSIC_MINT : GOOEY_HUB_DAYLIGHT_MINT;
}
