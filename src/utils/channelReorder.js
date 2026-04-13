/**
 * Linear slot reorder for channel grids. Slots are always `channel-0` … `channel-(N-1)`;
 * this module permutes stored payloads without creating or destroying slots.
 */

export function channelIdAtIndex(index) {
  return `channel-${index}`;
}

/**
 * Collect per-slot payloads in index order (undefined = empty slot / missing key).
 */
function collectSlots(totalChannels, configuredChannels, channelConfigs) {
  const cfg = [];
  const ken = [];
  for (let i = 0; i < totalChannels; i++) {
    const id = channelIdAtIndex(i);
    cfg.push(configuredChannels[id]);
    ken.push(channelConfigs[id]);
  }
  return { cfg, ken };
}

/**
 * Write slot arrays back to id-keyed records. Omits keys for empty slots.
 */
function scatterSlots(totalChannels, cfg, ken) {
  const nextConfigured = {};
  const nextKen = {};
  for (let i = 0; i < totalChannels; i++) {
    const id = channelIdAtIndex(i);
    const c = cfg[i];
    const k = ken[i];
    if (c !== undefined && c !== null) {
      nextConfigured[id] = c;
    }
    if (k !== undefined && k !== null) {
      nextKen[id] = k;
    }
  }
  return { configuredChannels: nextConfigured, channelConfigs: nextKen };
}

/**
 * Move the item at `fromIndex` to `toIndex` (same semantics as splice insert).
 */
function moveParallelArrays(cfg, ken, fromIndex, toIndex) {
  if (fromIndex === toIndex) return;
  const [movedC] = cfg.splice(fromIndex, 1);
  const [movedK] = ken.splice(fromIndex, 1);
  cfg.splice(toIndex, 0, movedC);
  ken.splice(toIndex, 0, movedK);
}

/**
 * @param {object} params
 * @param {number} params.fromIndex
 * @param {number} params.toIndex
 * @param {number} params.totalChannels
 * @param {Record<string, unknown>} params.configuredChannels
 * @param {Record<string, unknown>} params.channelConfigs
 * @returns {{ configuredChannels: Record<string, unknown>, channelConfigs: Record<string, unknown> }}
 */
export function applyChannelSlotReorder({
  fromIndex,
  toIndex,
  totalChannels,
  configuredChannels,
  channelConfigs,
}) {
  const cfgIn = configuredChannels || {};
  const kenIn = channelConfigs || {};
  const n = totalChannels | 0;

  if (n <= 0 || fromIndex === toIndex) {
    return { configuredChannels: { ...cfgIn }, channelConfigs: { ...kenIn } };
  }

  if (fromIndex < 0 || toIndex < 0 || fromIndex >= n || toIndex >= n) {
    return { configuredChannels: { ...cfgIn }, channelConfigs: { ...kenIn } };
  }

  const { cfg, ken } = collectSlots(n, cfgIn, kenIn);
  moveParallelArrays(cfg, ken, fromIndex, toIndex);
  return scatterSlots(n, cfg, ken);
}
