import { channelIdAtIndex } from './channelReorder';

export const SLOT_KIND_CHANNEL = 'channel';
export const SLOT_KIND_WIDGET = 'widget';

const KEN_BURNS_KEYS = [
  'kenBurnsEnabled',
  'kenBurnsMode',
  'kenBurnsHoverScale',
  'kenBurnsAutoplayScale',
  'kenBurnsSlideshowScale',
  'kenBurnsHoverDuration',
  'kenBurnsAutoplayDuration',
  'kenBurnsSlideshowDuration',
  'kenBurnsCrossfadeDuration',
  'kenBurnsForGifs',
  'kenBurnsForVideos',
  'kenBurnsEasing',
  'kenBurnsAnimationType',
  'kenBurnsCrossfadeReturn',
  'kenBurnsTransitionType',
];

/**
 * @returns {import('./homeGridSlots').HomeGridSlot}
 */
export function createEmptyChannelSlot() {
  return {
    kind: SLOT_KIND_CHANNEL,
    hidden: false,
    colSpan: 1,
    rowSpan: 1,
    channel: null,
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} kenBurnsEntry
 * @returns {Record<string, unknown> | undefined}
 */
function extractKenBurnsPayload(kenBurnsEntry) {
  if (!kenBurnsEntry || typeof kenBurnsEntry !== 'object') return undefined;
  const kenBurns = {};
  for (const key of KEN_BURNS_KEYS) {
    if (kenBurnsEntry[key] !== undefined) {
      kenBurns[key] = kenBurnsEntry[key];
    }
  }
  return Object.keys(kenBurns).length > 0 ? kenBurns : undefined;
}

/**
 * @param {Record<string, unknown> | null | undefined} configuredEntry
 * @param {Record<string, unknown> | null | undefined} kenBurnsEntry
 * @returns {import('./homeGridSlots').HomeChannelPayload | null}
 */
function buildChannelPayload(configuredEntry, kenBurnsEntry) {
  if (!configuredEntry || typeof configuredEntry !== 'object') return null;

  const channel = {
    media: configuredEntry.media ?? null,
    path: configuredEntry.path ?? null,
    launchType: configuredEntry.type ?? null,
    icon: configuredEntry.icon ?? null,
    asAdmin: configuredEntry.asAdmin ?? false,
    hoverSound: configuredEntry.hoverSound ?? null,
    animatedOnHover: configuredEntry.animatedOnHover,
    title: configuredEntry.title,
  };

  const kenBurns = extractKenBurnsPayload(kenBurnsEntry);
  if (kenBurns) {
    channel.kenBurns = kenBurns;
  }

  return channel;
}

/**
 * @param {Record<string, unknown> | null | undefined} configuredEntry
 * @param {Record<string, unknown> | null | undefined} kenBurnsEntry
 * @param {Record<string, unknown> | null | undefined} slotMetaEntry
 * @returns {import('./homeGridSlots').HomeGridSlot}
 */
export function createChannelSlotFromLegacy(configuredEntry, kenBurnsEntry, slotMetaEntry) {
  const channel = buildChannelPayload(configuredEntry, kenBurnsEntry);
  const meta = slotMetaEntry && typeof slotMetaEntry === 'object' ? slotMetaEntry : {};

  return {
    kind: SLOT_KIND_CHANNEL,
    hidden: Boolean(meta.hidden),
    colSpan: meta.colSpan ?? 1,
    rowSpan: meta.rowSpan ?? 1,
    channel,
  };
}

/**
 * @param {import('./homeGridSlots').HomeChannelPayload | null | undefined} channel
 * @returns {Record<string, unknown> | undefined}
 */
function channelToConfiguredEntry(channel) {
  if (!channel || typeof channel !== 'object') return undefined;

  const entry = {};
  if (channel.media != null) entry.media = channel.media;
  if (channel.path != null) entry.path = channel.path;
  if (channel.launchType != null) entry.type = channel.launchType;
  if (channel.icon != null) entry.icon = channel.icon;
  if (channel.asAdmin != null) entry.asAdmin = channel.asAdmin;
  if (channel.hoverSound != null) entry.hoverSound = channel.hoverSound;
  if (channel.animatedOnHover !== undefined) entry.animatedOnHover = channel.animatedOnHover;
  if (channel.title !== undefined) entry.title = channel.title;

  return Object.keys(entry).length > 0 ? entry : undefined;
}

/**
 * @param {import('./homeGridSlots').HomeChannelPayload | null | undefined} channel
 * @returns {Record<string, unknown> | undefined}
 */
function channelToKenBurnsEntry(channel) {
  return extractKenBurnsPayload(channel?.kenBurns);
}

/**
 * @param {import('./homeGridSlots').HomeGridSlot} slot
 * @returns {Record<string, unknown> | undefined}
 */
function slotToMetaEntry(slot) {
  const meta = {};
  if (slot.hidden) meta.hidden = true;
  if (slot.colSpan != null && slot.colSpan !== 1) meta.colSpan = slot.colSpan;
  if (slot.rowSpan != null && slot.rowSpan !== 1) meta.rowSpan = slot.rowSpan;
  return Object.keys(meta).length > 0 ? meta : undefined;
}

/**
 * @param {import('./homeGridSlots').HomeGridSlot[]} slots
 * @returns {{ configuredChannels: Record<string, unknown>, channelConfigs: Record<string, unknown>, slotMeta: Record<string, unknown> }}
 */
export function projectSlotsToLegacyMaps(slots) {
  const configuredChannels = {};
  const channelConfigs = {};
  const slotMeta = {};

  if (!Array.isArray(slots)) {
    return { configuredChannels, channelConfigs, slotMeta };
  }

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const id = channelIdAtIndex(i);
    if (!slot || slot.kind !== SLOT_KIND_CHANNEL) continue;

    const configuredEntry = channelToConfiguredEntry(slot.channel);
    if (configuredEntry) configuredChannels[id] = configuredEntry;

    const kenBurnsEntry = channelToKenBurnsEntry(slot.channel);
    if (kenBurnsEntry) channelConfigs[id] = kenBurnsEntry;

    const metaEntry = slotToMetaEntry(slot);
    if (metaEntry) slotMeta[id] = metaEntry;
  }

  return { configuredChannels, channelConfigs, slotMeta };
}

/**
 * @param {Record<string, unknown>} spaceData
 * @returns {Record<string, unknown>}
 */
export function migrateSpaceDataToSlots(spaceData) {
  const input = spaceData && typeof spaceData === 'object' ? spaceData : {};
  const totalChannels = Math.max(0, input.totalChannels | 0);

  let slots = Array.isArray(input.slots) ? [...input.slots] : [];

  // Grow/shrink slots to match layout geometry.
  if (slots.length < totalChannels) {
    const configuredChannels = input.configuredChannels || {};
    const channelConfigs = input.channelConfigs || {};
    const existingSlotMeta = input.slotMeta || {};
    for (let i = slots.length; i < totalChannels; i++) {
      const id = channelIdAtIndex(i);
      slots.push(
        createChannelSlotFromLegacy(
          configuredChannels[id],
          channelConfigs[id],
          existingSlotMeta[id]
        )
      );
    }
  } else if (slots.length > totalChannels) {
    slots = slots.slice(0, totalChannels);
  }

  const hasLegacyContent =
    Object.keys(input.configuredChannels || {}).length > 0 ||
    Object.keys(input.channelConfigs || {}).length > 0 ||
    Object.keys(input.slotMeta || {}).length > 0;

  // First-time migration from legacy maps when slots are all empty placeholders
  // but legacy maps still hold content.
  const slotsLookEmpty = slots.every(
    (s) => !s || (s.kind === SLOT_KIND_CHANNEL && !s.channel && !s.hidden)
  );
  if ((slots.length === 0 || (slotsLookEmpty && hasLegacyContent)) && totalChannels > 0) {
    const configuredChannels = input.configuredChannels || {};
    const channelConfigs = input.channelConfigs || {};
    const existingSlotMeta = input.slotMeta || {};
    slots = [];
    for (let i = 0; i < totalChannels; i++) {
      const id = channelIdAtIndex(i);
      slots.push(
        createChannelSlotFromLegacy(
          configuredChannels[id],
          channelConfigs[id],
          existingSlotMeta[id]
        )
      );
    }
  }

  const legacy = projectSlotsToLegacyMaps(slots);
  return {
    ...input,
    slots,
    ...legacy,
  };
}

/**
 * @param {import('./homeGridSlots').HomeGridSlot[] | null | undefined} slots
 * @param {string} channelId
 * @returns {import('./homeGridSlots').HomeGridSlot | null}
 */
export function getSlotAt(slots, channelId) {
  if (!Array.isArray(slots) || !channelId) return null;
  const match = /^channel-(\d+)$/.exec(channelId);
  if (!match) return null;
  const index = Number(match[1]);
  if (!Number.isFinite(index) || index < 0) return null;
  return slots[index] ?? null;
}

/**
 * @param {import('./homeGridSlots').HomeGridSlot | null | undefined} slot
 * @returns {boolean}
 */
export function isChannelSlotEmpty(slot) {
  if (!slot || slot.kind !== SLOT_KIND_CHANNEL) return true;
  const channel = slot.channel;
  return !channel || (!channel.media && !channel.path);
}

/**
 * Prefer `normalizeChannelSpaceData` (which migrates) then this helper when
 * you already hold normalized space data without slots.
 * @param {Record<string, unknown>} spaceData
 */
export function ensureSpaceDataSlots(spaceData) {
  return migrateSpaceDataToSlots(spaceData && typeof spaceData === 'object' ? spaceData : {});
}

/**
 * Sync slots[] as SSOT then reproject legacy maps for read compatibility.
 * Call after mutating configuredChannels / channelConfigs / slotMeta / slots.
 * @param {Record<string, unknown>} spaceData
 */
export function syncSpaceDataFromLegacyMaps(spaceData) {
  const input = spaceData && typeof spaceData === 'object' ? spaceData : {};
  const totalChannels = Math.max(0, input.totalChannels | 0);
  const configuredChannels = input.configuredChannels || {};
  const channelConfigs = input.channelConfigs || {};
  const existingSlotMeta = input.slotMeta || {};
  const prevSlots = Array.isArray(input.slots) ? input.slots : [];

  const slots = [];
  for (let i = 0; i < totalChannels; i++) {
    const id = channelIdAtIndex(i);
    const fromLegacy = createChannelSlotFromLegacy(
      configuredChannels[id],
      channelConfigs[id],
      existingSlotMeta[id]
    );
    const prev = prevSlots[i];
    // Preserve widget kind / spans when legacy maps have no content for this index.
    if (prev && prev.kind === SLOT_KIND_WIDGET) {
      slots.push({
        ...prev,
        hidden: Boolean(existingSlotMeta[id]?.hidden) || Boolean(prev.hidden),
      });
    } else {
      slots.push(fromLegacy);
    }
  }

  const legacy = projectSlotsToLegacyMaps(slots);
  return {
    ...input,
    slots,
    ...legacy,
  };
}

/**
 * After reordering legacy maps, rebuild slots from those maps.
 */
export function syncSpaceDataSlotsAfterReorder(spaceData) {
  return syncSpaceDataFromLegacyMaps(spaceData);
}
