/**
 * Home-grid slot kind registry — single source for labels, default spans, and size presets.
 * Render components are resolved by `HomeSlot` from `render` ids.
 */

import {
  HOME_SLOT_SIZE_PRESETS,
  getHomeSlotSizePresetById,
  matchSizePresetBySpan,
} from '../../utils/homeSlotSizePresets';

export { HOME_SLOT_SIZE_PRESETS };

export const HOME_SLOT_KINDS = {
  channel: {
    id: 'channel',
    label: 'Home Channel',
    colSpan: 1,
    rowSpan: 1,
    defaultSizePreset: 'S',
    /** Channel tiles resize through the same Edit Home preset row as widgets. */
    sizePresets: HOME_SLOT_SIZE_PRESETS,
    render: 'ChannelSlot',
  },
  adminQuickAccess: {
    id: 'adminQuickAccess',
    label: 'Quick Access',
    description: 'Pin admin & system actions to a tile',
    icon: '🛡️',
    colSpan: HOME_SLOT_SIZE_PRESETS.S.colSpan,
    rowSpan: HOME_SLOT_SIZE_PRESETS.S.rowSpan,
    defaultSizePreset: 'M',
    sizePresets: HOME_SLOT_SIZE_PRESETS,
    render: 'AdminQuickAccessSlot',
    /** Shown in the Edit Home “Add widget” picker. */
    placeable: true,
  },
  nowPlaying: {
    id: 'nowPlaying',
    label: 'Now Playing',
    description: 'Live Spotify track on a tile',
    icon: '🎵',
    colSpan: HOME_SLOT_SIZE_PRESETS.M.colSpan,
    rowSpan: HOME_SLOT_SIZE_PRESETS.M.rowSpan,
    defaultSizePreset: 'M',
    sizePresets: HOME_SLOT_SIZE_PRESETS,
    render: 'NowPlayingSlot',
    placeable: true,
  },
  recentlyUsed: {
    id: 'recentlyUsed',
    label: 'Recently Used',
    description: 'Relaunch your last apps fast',
    icon: '🕘',
    colSpan: HOME_SLOT_SIZE_PRESETS.M.colSpan,
    rowSpan: HOME_SLOT_SIZE_PRESETS.M.rowSpan,
    defaultSizePreset: 'M',
    sizePresets: HOME_SLOT_SIZE_PRESETS,
    render: 'RecentlyUsedSlot',
    placeable: true,
  },
};

/**
 * @param {string} id
 * @returns {typeof HOME_SLOT_KINDS[keyof typeof HOME_SLOT_KINDS] | null}
 */
export function getHomeSlotKind(id) {
  if (!id) return null;
  return HOME_SLOT_KINDS[id] ?? null;
}

/**
 * @returns {Array<typeof HOME_SLOT_KINDS[keyof typeof HOME_SLOT_KINDS]>}
 */
export function listHomeSlotKinds() {
  return Object.values(HOME_SLOT_KINDS);
}

/**
 * Widget kinds users can place from the Edit Home picker.
 * @returns {Array<typeof HOME_SLOT_KINDS[keyof typeof HOME_SLOT_KINDS]>}
 */
export function listPlaceableHomeSlotKinds() {
  return Object.values(HOME_SLOT_KINDS).filter((kind) => kind.placeable);
}

/**
 * @param {string} kindId
 * @param {string} presetId
 * @returns {{ id: string, label: string, colSpan: number, rowSpan: number, capacity: number } | null}
 */
export function getHomeSlotSizePreset(kindId, presetId) {
  const kind = getHomeSlotKind(kindId);
  if (!kind?.sizePresets) return getHomeSlotSizePresetById(presetId);
  return kind.sizePresets[presetId] ?? null;
}

/**
 * Resolve which size preset matches a slot's current span (best exact match, else null).
 * @param {string} kindId
 * @param {number} colSpan
 * @param {number} rowSpan
 */
export function matchHomeSlotSizePreset(kindId, colSpan, rowSpan) {
  const kind = getHomeSlotKind(kindId);
  if (!kind?.sizePresets) return matchSizePresetBySpan(colSpan, rowSpan);
  return matchSizePresetBySpan(colSpan, rowSpan);
}
