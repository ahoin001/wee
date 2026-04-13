/**
 * Runtime color strings for JS inline styles — resolve against design-system.css :root.
 * Do not use raw hex in components; import from here.
 */

/** Default Spotify widget shell (matches .floating-spotify-widget CSS). */
export const SPOTIFY_DEFAULT_GRADIENT =
  'linear-gradient(135deg, rgb(var(--spotify-green-rgb)) 0%, rgb(var(--spotify-green-secondary-rgb)) 100%)';

export const CSS_SPOTIFY_PRIMARY = 'rgb(var(--spotify-green-rgb))';
export const CSS_SPOTIFY_SECONDARY = 'rgb(var(--spotify-green-secondary-rgb))';

/** Brand / chrome */
export const CSS_WII_BLUE = 'hsl(var(--wii-blue))';
export const CSS_TEXT_ON_ACCENT = 'hsl(var(--text-on-accent))';
export const CSS_COLOR_PURE_WHITE = 'hsl(var(--color-pure-white))';
export const CSS_COLOR_PURE_BLACK = 'hsl(var(--color-pure-black))';
export const CSS_COLOR_PURE_WHITE_90 = 'hsl(var(--color-pure-white) / 0.9)';
/** Canvas 2D debug / overlay text on gradients */
export const CANVAS_FILL_WHITE_80 = 'hsl(var(--color-pure-white) / 0.8)';

/** Common semantic tokens for inline styles */
export const CSS_TEXT_TERTIARY = 'hsl(var(--text-tertiary))';
export const CSS_STATE_SUCCESS = 'hsl(var(--state-success))';
export const CSS_STATE_ERROR = 'hsl(var(--state-error))';
export const CSS_STATE_WARNING = 'hsl(var(--state-warning))';
export const CSS_LINK = 'hsl(var(--link))';

/** CollapsibleSection / API integrations — avoid inline hex in settings tabs */
export const INTEGRATION_PANEL_INSET_BG = 'hsl(var(--color-pure-black) / 0.2)';
export const SPOTIFY_ICON_FILL = 'rgb(var(--spotify-green-rgb))';
export const SPOTIFY_CARD_SHADOW_SOFT = 'rgb(var(--spotify-green-rgb) / 0.3)';
export const SYSTEM_INFO_GRADIENT =
  'linear-gradient(135deg, hsl(var(--link)) 0%, hsl(var(--link-hover)) 100%)';
export const SYSTEM_INFO_CARD_SHADOW = 'hsl(var(--link) / 0.3)';
export const ADMIN_WIDGET_GRADIENT =
  'linear-gradient(135deg, hsl(var(--admin-widget-gradient-start)) 0%, hsl(var(--admin-widget-gradient-end)) 100%)';
export const ADMIN_WIDGET_CARD_SHADOW = 'hsl(var(--admin-widget-gradient-start) / 0.3)';

/** Saved-wallpaper default thumbnail — checkerboard uses --wallpaper-checker-tile */
export const WALLPAPER_CHECKERBOARD_BG =
  'linear-gradient(45deg, hsl(var(--wallpaper-checker-tile)) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--wallpaper-checker-tile)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--wallpaper-checker-tile)) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--wallpaper-checker-tile)) 75%)';

/** Default ribbon chrome (matches light --surface-secondary / Wii blue accent). */
export const DEFAULT_RIBBON_SURFACE_HEX = '#e0e6ef';
export const DEFAULT_RIBBON_GLOW_HEX = '#0099ff';

/**
 * HTML5 <input type="color"> requires #rrggbb. Default only — synced with --text-on-accent light.
 * @see design-system.css --text-on-accent
 */
export const INPUT_COLOR_DEFAULT_HEX = '#ffffff';

/** Default dock time label color (hex in persisted settings; matches --color-pure-white). */
export const DEFAULT_TIME_COLOR_HEX = INPUT_COLOR_DEFAULT_HEX;
