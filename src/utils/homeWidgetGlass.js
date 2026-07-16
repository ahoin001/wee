/**
 * Global Home-widget liquid glass look — one SSOT so every `surface: 'glass'` tile stays in harmony.
 * Inspired by Apple-style liquid glass (blur, tint, saturation, edge refraction, shine).
 * @see https://github.com/rdev/liquid-glass-react
 */

export const DEFAULT_HOME_WIDGET_GLASS = Object.freeze({
  /** Backdrop blur in px (higher = frostier). Time-pill–subtle by default. */
  blur: 8,
  /** Fill opacity 0–1 — lower lets more wallpaper show through. */
  tint: 0.06,
  /** Color saturation % for backdrop-filter. */
  saturation: 140,
  /** Edge refraction / bend strength 0–1. */
  refraction: 0.28,
  /** Specular highlight strength 0–1. */
  shine: 0.35,
  /**
   * One-shot: legacy per-slot `surface: 'glass'` meant WeeGlassPill chrome → migrated to `basic`.
   */
  surfacesMigrated: false,
});

/**
 * @param {unknown} raw
 * @returns {{
 *   blur: number,
 *   tint: number,
 *   saturation: number,
 *   refraction: number,
 *   shine: number,
 *   surfacesMigrated: boolean,
 * }}
 */
export function normalizeHomeWidgetGlass(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const clamp = (n, min, max, fallback) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return fallback;
    return Math.min(max, Math.max(min, v));
  };
  return {
    blur: clamp(src.blur, 0, 40, DEFAULT_HOME_WIDGET_GLASS.blur),
    tint: clamp(src.tint, 0.02, 0.55, DEFAULT_HOME_WIDGET_GLASS.tint),
    saturation: clamp(src.saturation, 100, 220, DEFAULT_HOME_WIDGET_GLASS.saturation),
    refraction: clamp(src.refraction, 0, 1, DEFAULT_HOME_WIDGET_GLASS.refraction),
    shine: clamp(src.shine, 0, 1, DEFAULT_HOME_WIDGET_GLASS.shine),
    surfacesMigrated: Boolean(src.surfacesMigrated),
  };
}

/**
 * CSS custom properties for liquid glass widgets (shared look).
 * @param {ReturnType<typeof normalizeHomeWidgetGlass>} glass
 * @param {{ lowPower?: boolean }} [opts]
 */
export function homeWidgetGlassCssVars(glass, opts = {}) {
  const g = normalizeHomeWidgetGlass(glass);
  const lowPower = Boolean(opts.lowPower);
  const blur = lowPower ? Math.min(g.blur, 8) : g.blur;
  const refraction = lowPower ? g.refraction * 0.35 : g.refraction;
  return {
    '--hwg-blur': `${blur}px`,
    '--hwg-tint': String(g.tint),
    '--hwg-sat': `${g.saturation}%`,
    '--hwg-refract': String(refraction),
    '--hwg-shine': String(g.shine),
  };
}
