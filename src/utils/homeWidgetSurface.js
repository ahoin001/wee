/**
 * Per-widget board look: surface mode + optional text color / size.
 * Persisted on `slots[].surface` / `slots[].textColor` / `slots[].textSize` (Home grid SSOT).
 *
 * - `clear` — floating default: no plate; wallpaper shows through (lock-screen / low-blur time-pill)
 * - `glass` — same floating content + shared light frost/tint (`ui.homeWidgetGlass`)
 * - `basic` — solid WeeGlassPill card chrome
 */

export const HOME_WIDGET_SURFACES = Object.freeze(['clear', 'glass', 'basic']);

export const DEFAULT_HOME_WIDGET_SURFACE = 'clear';

/** Per-tile text size override. `null` → Auto (density-driven). */
export const HOME_WIDGET_TEXT_SIZES = Object.freeze(['sm', 'md', 'lg']);

/**
 * @param {unknown} value
 * @returns {'basic' | 'glass' | 'clear'}
 */
export function normalizeHomeWidgetSurface(value) {
  if (value === 'clear') return 'clear';
  if (value === 'glass') return 'glass';
  if (value === 'basic') return 'basic';
  return DEFAULT_HOME_WIDGET_SURFACE;
}

/**
 * Optional per-tile widget text color. `null` → theme tokens (auto).
 * Hex required by `<input type="color">`; flows into `--hw-text` on the shell.
 * @param {unknown} value
 * @returns {string | null}
 */
export function normalizeHomeWidgetTextColor(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed.toLowerCase() : null;
}

/**
 * Optional per-tile text size. `null` → Auto (layout density).
 * @param {unknown} value
 * @returns {'sm' | 'md' | 'lg' | null}
 */
export function normalizeHomeWidgetTextSize(value) {
  if (value === 'sm' || value === 'md' || value === 'lg') return value;
  return null;
}

/**
 * Steam / Epic shelf heading override on `slot.widget.heading`.
 * `null` → use default title; `''` → hide; other string → custom label.
 * @param {unknown} value
 * @returns {string | null}
 */
export function normalizeSteamWidgetHeading(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return null;
  if (value === '') return '';
  const trimmed = value.trim();
  return trimmed === '' ? '' : trimmed;
}

/**
 * @param {string} defaultTitle
 * @param {unknown} heading
 * @returns {string | null} Resolved title, or `null` when hidden
 */
export function resolveSteamHeading(defaultTitle, heading) {
  const normalized = normalizeSteamWidgetHeading(heading);
  if (normalized === '') return null;
  if (typeof normalized === 'string' && normalized) return normalized;
  return defaultTitle || null;
}

function isNonChannelSlotLike(slot) {
  return Boolean(slot && slot.kind && slot.kind !== 'channel');
}

/**
 * Pre-liquid releases stored WeeGlassPill chrome as `surface: 'glass'`.
 * Map those to `basic` once so the Glass label can mean liquid glass.
 * @param {unknown[]} slots
 * @returns {unknown[]}
 */
export function migrateLegacyGlassSurfacesToBasic(slots) {
  if (!Array.isArray(slots)) return slots;
  let changed = false;
  const next = slots.map((slot) => {
    if (!slot || typeof slot !== 'object') return slot;
    if (!isNonChannelSlotLike(slot)) return slot;
    if (slot.surface === 'glass' || slot.surface == null) {
      changed = true;
      return { ...slot, surface: 'basic' };
    }
    return slot;
  });
  return changed ? next : slots;
}

/**
 * @param {Record<string, unknown> | null | undefined} spaceData
 */
export function migrateSpaceDataLegacyGlassSurfaces(spaceData) {
  if (!spaceData || typeof spaceData !== 'object') return spaceData;
  const slots = migrateLegacyGlassSurfacesToBasic(spaceData.slots);
  if (slots === spaceData.slots) return spaceData;
  return { ...spaceData, slots };
}

/**
 * Walk `channels.dataBySpace` and rewrite legacy glass → basic.
 * @param {Record<string, unknown> | null | undefined} channels
 */
export function migrateChannelsLegacyGlassSurfaces(channels) {
  if (!channels || typeof channels !== 'object') return channels;
  const dataBySpace = channels.dataBySpace;
  if (!dataBySpace || typeof dataBySpace !== 'object') return channels;

  let changed = false;
  const nextBySpace = {};
  for (const [key, space] of Object.entries(dataBySpace)) {
    const next = migrateSpaceDataLegacyGlassSurfaces(space);
    nextBySpace[key] = next;
    if (next !== space) changed = true;
  }

  if (!changed) return channels;
  return {
    ...channels,
    dataBySpace: nextBySpace,
  };
}
