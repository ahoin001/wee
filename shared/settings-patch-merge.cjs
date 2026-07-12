/**
 * Canonical settings patch merge contract for `data:patch-settings`.
 *
 * Rules:
 * - Plain objects merge deeply.
 * - Non-object values replace previous values.
 * - `undefined` in patch does not mutate existing value.
 * - Channel slot maps (`configuredChannels` / `channelConfigs`) replace wholesale
 *   when present in the patch. Deep-merge would keep stale slot keys after reorder
 *   (emptied slots omitted from the patch) and duplicate tiles after restart.
 */

function isPlainObject(v) {
  return Object.prototype.toString.call(v) === '[object Object]';
}

/** Slot-keyed maps under each channel space (`channel-0` …). */
const CHANNEL_DATA_SLOT_KEYED_MAPS = new Set(['configuredChannels', 'channelConfigs']);

/** Empty `{}` patches must not wipe a populated slot map (bad partial saves). */
function shouldIgnoreEmptySlotMapPatch(patchVal, baseVal) {
  if (!isPlainObject(patchVal) || !isPlainObject(baseVal)) return false;
  return Object.keys(patchVal).length === 0 && Object.keys(baseVal).length > 0;
}

function mergeSettingsPatch(base, patch) {
  if (!isPlainObject(base)) return isPlainObject(patch) ? { ...patch } : (patch ?? base);
  if (!isPlainObject(patch)) return patch === undefined ? base : patch;
  const out = { ...base };
  for (const key of Object.keys(patch)) {
    const bv = base[key];
    const pv = patch[key];
    if (pv === undefined) continue;

    if (CHANNEL_DATA_SLOT_KEYED_MAPS.has(key) && isPlainObject(pv)) {
      out[key] = shouldIgnoreEmptySlotMapPatch(pv, bv) ? bv : pv;
      continue;
    }

    if (isPlainObject(bv) && isPlainObject(pv)) {
      out[key] = mergeSettingsPatch(bv, pv);
    } else {
      out[key] = pv;
    }
  }
  return out;
}

module.exports = {
  isPlainObject,
  mergeSettingsPatch,
  CHANNEL_DATA_SLOT_KEYED_MAPS,
};
