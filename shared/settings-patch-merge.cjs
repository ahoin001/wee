/**
 * Canonical settings patch merge contract for `data:patch-settings`.
 *
 * Rules:
 * - Plain objects merge deeply.
 * - Non-object values replace previous values.
 * - `undefined` in patch does not mutate existing value.
 */
function isPlainObject(v) {
  return Object.prototype.toString.call(v) === '[object Object]';
}

function mergeSettingsPatch(base, patch) {
  if (!isPlainObject(base)) return isPlainObject(patch) ? { ...patch } : (patch ?? base);
  if (!isPlainObject(patch)) return patch === undefined ? base : patch;
  const out = { ...base };
  for (const key of Object.keys(patch)) {
    const bv = base[key];
    const pv = patch[key];
    if (pv === undefined) continue;
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
};
