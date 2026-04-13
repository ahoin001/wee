/**
 * Append 2-digit hex alpha to a hex color string (e.g. for SVG `fill` on rgba base colors).
 * @param {number} opacity 0–1
 * @returns {string} '' when fully opaque, else 'aa' hex suffix
 */
export function hexAlpha(opacity) {
  const a = Math.round(Math.max(0, Math.min(1, opacity)) * 255);
  return a === 255 ? '' : a.toString(16).padStart(2, '0');
}
