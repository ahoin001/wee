/**
 * Append 2-digit hex alpha to a hex color string (e.g. for SVG `fill` on rgba base colors).
 * @param {number} opacity 0–1
 * @returns {string} '' when fully opaque, else 'aa' hex suffix
 */
export function hexAlpha(opacity) {
  const a = Math.round(Math.max(0, Math.min(1, opacity)) * 255);
  return a === 255 ? '' : a.toString(16).padStart(2, '0');
}

/**
 * Build `#rrggbbaa` (or `#rrggbb`) from a hex/rgb fill, replacing any existing alpha.
 * Used so glass ribbon frost tints with the painted ribbon color instead of pure white.
 *
 * @param {string|null|undefined} fillColor
 * @param {number} opacity 0–1
 * @returns {string}
 */
export function tintedHexFill(fillColor, opacity) {
  const fallbackWhite = `#ffffff${hexAlpha(opacity)}`;
  if (typeof fillColor !== 'string' || !fillColor.trim()) return fallbackWhite || '#ffffff';

  const trimmed = fillColor.trim();
  let rgb = null;

  if (trimmed.startsWith('#')) {
    const raw = trimmed.slice(1);
    if (/^[0-9a-fA-F]{3}$/.test(raw)) {
      rgb = raw
        .split('')
        .map((c) => c + c)
        .join('');
    } else if (/^[0-9a-fA-F]{6}$|^[0-9a-fA-F]{8}$/.test(raw)) {
      rgb = raw.slice(0, 6);
    }
  } else {
    const rgbMatch = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (rgbMatch) {
      rgb = [rgbMatch[1], rgbMatch[2], rgbMatch[3]]
        .map((n) => Number(n).toString(16).padStart(2, '0'))
        .join('');
    }
  }

  if (!rgb) return fallbackWhite || '#ffffff';
  const alpha = hexAlpha(opacity);
  return alpha ? `#${rgb}${alpha}` : `#${rgb}`;
}
