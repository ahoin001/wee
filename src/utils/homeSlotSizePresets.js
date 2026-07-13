/**
 * Discrete home-widget size presets (spans + in-tile action capacity).
 * Shared by registry UI and store place/resize actions.
 */

export const HOME_SLOT_SIZE_PRESETS = Object.freeze({
  S: Object.freeze({ id: 'S', label: 'S', colSpan: 1, rowSpan: 1, capacity: 0 }),
  M: Object.freeze({ id: 'M', label: 'M', colSpan: 2, rowSpan: 1, capacity: 3 }),
  L: Object.freeze({ id: 'L', label: 'L', colSpan: 2, rowSpan: 2, capacity: 6 }),
  XL: Object.freeze({ id: 'XL', label: 'XL', colSpan: 3, rowSpan: 2, capacity: 10 }),
});

/**
 * @param {string} presetId
 * @returns {{ id: string, label: string, colSpan: number, rowSpan: number, capacity: number } | null}
 */
export function getHomeSlotSizePresetById(presetId) {
  if (!presetId) return null;
  return HOME_SLOT_SIZE_PRESETS[presetId] ?? null;
}

/**
 * @param {number} colSpan
 * @param {number} rowSpan
 */
export function matchSizePresetBySpan(colSpan, rowSpan) {
  const cs = Number(colSpan) || 1;
  const rs = Number(rowSpan) || 1;
  return (
    Object.values(HOME_SLOT_SIZE_PRESETS).find((p) => p.colSpan === cs && p.rowSpan === rs) ?? null
  );
}
