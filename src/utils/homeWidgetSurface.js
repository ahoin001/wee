/**
 * Per-widget board surface mode.
 * Persisted on `slots[].surface` (Home grid SSOT).
 *
 * - `clear` — floating default: no plate; wallpaper shows through (lock-screen / low-blur time-pill)
 * - `glass` — same floating content + shared light frost/tint (`ui.homeWidgetGlass`)
 * - `basic` — solid WeeGlassPill card chrome
 */

export const HOME_WIDGET_SURFACES = Object.freeze(['clear', 'glass', 'basic']);

export const DEFAULT_HOME_WIDGET_SURFACE = 'clear';

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
