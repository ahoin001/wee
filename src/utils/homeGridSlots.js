import { channelIdAtIndex } from './channelReorder';
import {
  HOME_WIDGET_SURFACES,
  DEFAULT_HOME_WIDGET_SURFACE,
  normalizeHomeWidgetSurface,
} from './homeWidgetSurface';

export {
  HOME_WIDGET_SURFACES,
  DEFAULT_HOME_WIDGET_SURFACE,
  normalizeHomeWidgetSurface,
};

export const SLOT_KIND_CHANNEL = 'channel';
/** @deprecated Prefer SLOT_KIND_ADMIN_QUICK_ACCESS — kept for migrate of early stubs. */
export const SLOT_KIND_WIDGET = 'widget';
export const SLOT_KIND_ADMIN_QUICK_ACCESS = 'adminQuickAccess';

/**
 * @param {import('./homeGridSlots').HomeGridSlot | null | undefined} slot
 * @returns {boolean}
 */
export function isNonChannelSlot(slot) {
  return Boolean(slot && slot.kind && slot.kind !== SLOT_KIND_CHANNEL);
}

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
 * Generic widget slot for any registered non-channel kind
 * (see `slotKindRegistry.js` for labels/render ids/size presets).
 * @param {string} kindId
 * @param {{ colSpan?: number, rowSpan?: number, surface?: string }} [span]
 * @returns {import('./homeGridSlots').HomeGridSlot}
 */
export function createHomeWidgetSlot(kindId, span = {}) {
  return {
    kind: kindId,
    hidden: false,
    colSpan: span.colSpan ?? 1,
    rowSpan: span.rowSpan ?? 1,
    surface: normalizeHomeWidgetSurface(span.surface),
    channel: null,
    widget: {
      widgetId: kindId,
      ...(kindId === 'nowPlaying' ? { listenApp: 'any' } : {}),
    },
  };
}

/**
 * @param {{ colSpan?: number, rowSpan?: number }} [span]
 * @returns {import('./homeGridSlots').HomeGridSlot}
 */
export function createAdminQuickAccessSlot(span = {}) {
  return createHomeWidgetSlot(SLOT_KIND_ADMIN_QUICK_ACCESS, span);
}

/**
 * Normalize legacy `widget` stubs → adminQuickAccess.
 * @param {import('./homeGridSlots').HomeGridSlot | null | undefined} slot
 */
export function normalizeHomeGridSlot(slot) {
  if (!slot || typeof slot !== 'object') return createEmptyChannelSlot();
  if (slot.kind === SLOT_KIND_WIDGET) {
    return {
      ...createAdminQuickAccessSlot({
        colSpan: slot.colSpan ?? 1,
        rowSpan: slot.rowSpan ?? 1,
        surface: slot.surface,
      }),
      hidden: Boolean(slot.hidden),
    };
  }
  if (isNonChannelSlot(slot)) {
    return {
      ...slot,
      surface: normalizeHomeWidgetSurface(slot.surface),
      hidden: Boolean(slot.hidden),
      colSpan: Math.max(1, Number(slot.colSpan) || 1),
      rowSpan: Math.max(1, Number(slot.rowSpan) || 1),
    };
  }
  return slot;
}

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
    performancePauseMode: configuredEntry.performancePauseMode ?? 'auto',
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
  if (channel.performancePauseMode === 'on' || channel.performancePauseMode === 'off') {
    entry.performancePauseMode = channel.performancePauseMode;
  } else if (channel.performancePauseMode === 'auto') {
    // Explicit auto clears a previous on/off override when projecting slots → maps.
    entry.performancePauseMode = 'auto';
  }

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
    if (!slot) continue;

    // Non-channel kinds still project slotMeta (hidden / spans) so punch + layout survive sync.
    const metaEntry = slotToMetaEntry(slot);
    if (metaEntry) slotMeta[id] = metaEntry;

    if (slot.kind !== SLOT_KIND_CHANNEL) continue;

    const configuredEntry = channelToConfiguredEntry(slot.channel);
    if (configuredEntry) configuredChannels[id] = configuredEntry;

    const kenBurnsEntry = channelToKenBurnsEntry(slot.channel);
    if (kenBurnsEntry) channelConfigs[id] = kenBurnsEntry;
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

  slots = slots.map((s) => normalizeHomeGridSlot(s));

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
  if (!slot) return true;
  if (slot.kind !== SLOT_KIND_CHANNEL) return false;
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
    const legacyHasChannelPayload =
      fromLegacy?.kind === SLOT_KIND_CHANNEL &&
      fromLegacy.channel &&
      (fromLegacy.channel.media || fromLegacy.channel.path);

    // Channel payloads from legacy maps win. Widgets are only preserved when the
    // index has no channel payload (widgets never write configuredChannels).
    if (
      !legacyHasChannelPayload &&
      prev &&
      prev.kind &&
      prev.kind !== SLOT_KIND_CHANNEL
    ) {
      const meta = existingSlotMeta[id];
      slots.push(
        normalizeHomeGridSlot({
          ...prev,
          hidden: Boolean(meta?.hidden) || Boolean(prev.hidden),
          colSpan: meta?.colSpan ?? prev.colSpan ?? 1,
          rowSpan: meta?.rowSpan ?? prev.rowSpan ?? 1,
        })
      );
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

/**
 * Replace an empty channel slot with a widget kind (registry-driven).
 * Caller should verify `canPlaceSpan` first for multi-cell presets.
 * @param {Record<string, unknown>} spaceData
 * @param {number} channelIndex
 * @param {string} kindId — non-channel kind id from `slotKindRegistry.js`
 * @param {{ colSpan?: number, rowSpan?: number }} [span]
 */
export function placeHomeWidgetInSpaceData(spaceData, channelIndex, kindId, span = {}) {
  const input = spaceData && typeof spaceData === 'object' ? spaceData : {};
  const slots = Array.isArray(input.slots) ? [...input.slots] : [];
  const index = channelIndex | 0;
  if (index < 0 || index >= slots.length) return input;
  if (!kindId || kindId === SLOT_KIND_CHANNEL) return input;

  slots[index] = createHomeWidgetSlot(kindId, {
    colSpan: span.colSpan ?? 1,
    rowSpan: span.rowSpan ?? 1,
  });

  const legacy = projectSlotsToLegacyMaps(slots);
  return { ...input, slots, ...legacy };
}

/**
 * @deprecated Use `placeHomeWidgetInSpaceData(spaceData, index, SLOT_KIND_ADMIN_QUICK_ACCESS, span)`.
 */
export function placeAdminQuickAccessInSpaceData(spaceData, channelIndex, span = {}) {
  return placeHomeWidgetInSpaceData(spaceData, channelIndex, SLOT_KIND_ADMIN_QUICK_ACCESS, span);
}

/**
 * Convert a non-channel widget slot back to an empty channel.
 * @param {Record<string, unknown>} spaceData
 * @param {number} channelIndex
 */
export function removeHomeWidgetFromSpaceData(spaceData, channelIndex) {
  const input = spaceData && typeof spaceData === 'object' ? spaceData : {};
  const slots = Array.isArray(input.slots) ? [...input.slots] : [];
  const index = channelIndex | 0;
  if (index < 0 || index >= slots.length) return input;
  if (!isNonChannelSlot(slots[index])) return input;

  slots[index] = createEmptyChannelSlot();
  const legacy = projectSlotsToLegacyMaps(slots);
  return { ...input, slots, ...legacy };
}

/**
 * Update colSpan/rowSpan on a slot (any kind).
 * @param {Record<string, unknown>} spaceData
 * @param {number} channelIndex
 * @param {number} colSpan
 * @param {number} rowSpan
 */
export function setHomeSlotSpanInSpaceData(spaceData, channelIndex, colSpan, rowSpan) {
  const input = spaceData && typeof spaceData === 'object' ? spaceData : {};
  const slots = Array.isArray(input.slots) ? [...input.slots] : [];
  const index = channelIndex | 0;
  if (index < 0 || index >= slots.length || !slots[index]) return input;

  slots[index] = {
    ...slots[index],
    colSpan: Math.max(1, colSpan | 0),
    rowSpan: Math.max(1, rowSpan | 0),
  };
  const legacy = projectSlotsToLegacyMaps(slots);
  return { ...input, slots, ...legacy };
}

/**
 * Update widget surface (glass | clear) on a non-channel slot.
 * @param {Record<string, unknown>} spaceData
 * @param {number} channelIndex
 * @param {string} surface
 */
export function setHomeSlotSurfaceInSpaceData(spaceData, channelIndex, surface) {
  const input = spaceData && typeof spaceData === 'object' ? spaceData : {};
  const slots = Array.isArray(input.slots) ? [...input.slots] : [];
  const index = channelIndex | 0;
  if (index < 0 || index >= slots.length || !slots[index]) return input;
  if (!isNonChannelSlot(slots[index])) return input;

  slots[index] = {
    ...slots[index],
    surface: normalizeHomeWidgetSurface(surface),
  };
  const legacy = projectSlotsToLegacyMaps(slots);
  return { ...input, slots, ...legacy };
}

/**
 * Patch `slot.widget` on a non-channel Home tile (e.g. Now Playing `listenApp`).
 * @param {Record<string, unknown>} spaceData
 * @param {number} channelIndex
 * @param {Record<string, unknown>} widgetPatch
 */
export function setHomeSlotWidgetPatchInSpaceData(spaceData, channelIndex, widgetPatch) {
  const input = spaceData && typeof spaceData === 'object' ? spaceData : {};
  const slots = Array.isArray(input.slots) ? [...input.slots] : [];
  const index = channelIndex | 0;
  if (index < 0 || index >= slots.length || !slots[index]) return input;
  if (!isNonChannelSlot(slots[index])) return input;
  if (!widgetPatch || typeof widgetPatch !== 'object') return input;

  const prev = slots[index];
  const prevWidget =
    prev.widget && typeof prev.widget === 'object' ? prev.widget : { widgetId: prev.kind };
  slots[index] = {
    ...prev,
    widget: { ...prevWidget, ...widgetPatch },
  };
  const legacy = projectSlotsToLegacyMaps(slots);
  return { ...input, slots, ...legacy };
}
