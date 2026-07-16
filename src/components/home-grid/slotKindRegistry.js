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

/** Picker section order + labels for Edit Home “Add widget”. */
export const HOME_SLOT_PICKER_CATEGORIES = Object.freeze([
  Object.freeze({ id: 'steam', label: 'Steam' }),
  Object.freeze({ id: 'media', label: 'Media' }),
  Object.freeze({ id: 'glance', label: 'Glance' }),
  Object.freeze({ id: 'system', label: 'System' }),
]);

/** Now Playing size set: 1×1, 1×2, 2×1, 2×2 — art + controls on every size. */
const NOW_PLAYING_SIZE_PRESETS = Object.freeze({
  S: Object.freeze({ id: 'S', label: '1×1', colSpan: 1, rowSpan: 1, capacity: 0 }),
  T: Object.freeze({ id: 'T', label: '1×2', colSpan: 1, rowSpan: 2, capacity: 2 }),
  M: Object.freeze({ id: 'M', label: '2×1', colSpan: 2, rowSpan: 1, capacity: 3 }),
  L: Object.freeze({ id: 'L', label: '2×2', colSpan: 2, rowSpan: 2, capacity: 6 }),
});

/** Clock / weather — keep S for compact glance. */
const GLANCE_TILE_SIZE_PRESETS = Object.freeze({
  S: HOME_SLOT_SIZE_PRESETS.S,
  M: HOME_SLOT_SIZE_PRESETS.M,
  L: HOME_SLOT_SIZE_PRESETS.L,
});

/**
 * Steam Recent / Most Played tiles — never 1×1. Min 2 columns.
 * Includes tall 2×3 (fits default 3-row home boards) plus 2×4 / wide 3×2.
 */
export const STEAM_TILE_SIZE_PRESETS = Object.freeze({
  M: Object.freeze({ id: 'M', label: '2×2', colSpan: 2, rowSpan: 2, capacity: 12 }),
  L: Object.freeze({ id: 'L', label: '2×3', colSpan: 2, rowSpan: 3, capacity: 18 }),
  XL: Object.freeze({ id: 'XL', label: '2×4', colSpan: 2, rowSpan: 4, capacity: 24 }),
  /** Wide layout — horizontal shelf scroll by default (auto axis). */
  W: Object.freeze({ id: 'W', label: '3×2', colSpan: 3, rowSpan: 2, capacity: 16 }),
});

/**
 * Steam Friends list tiles — short 2×1 banner + standard 2×2 board.
 */
export const STEAM_FRIENDS_SIZE_PRESETS = Object.freeze({
  S: Object.freeze({ id: 'S', label: '2×1', colSpan: 2, rowSpan: 1, capacity: 4 }),
  M: Object.freeze({ id: 'M', label: '2×2', colSpan: 2, rowSpan: 2, capacity: 8 }),
});

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
    category: 'system',
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
    description: 'Desktop music from Spotify, Apple Music, and more',
    icon: '🎵',
    category: 'media',
    colSpan: HOME_SLOT_SIZE_PRESETS.M.colSpan,
    rowSpan: HOME_SLOT_SIZE_PRESETS.M.rowSpan,
    defaultSizePreset: 'M',
    sizePresets: NOW_PLAYING_SIZE_PRESETS,
    render: 'NowPlayingSlot',
    placeable: true,
  },
  recentlyUsed: {
    id: 'recentlyUsed',
    label: 'Recently Used',
    description: 'Relaunch your last apps fast',
    icon: '🕘',
    category: 'system',
    colSpan: HOME_SLOT_SIZE_PRESETS.M.colSpan,
    rowSpan: HOME_SLOT_SIZE_PRESETS.M.rowSpan,
    defaultSizePreset: 'M',
    sizePresets: HOME_SLOT_SIZE_PRESETS,
    render: 'RecentlyUsedSlot',
    placeable: true,
  },
  clock: {
    id: 'clock',
    label: 'Clock',
    description: 'Local time and date at a glance',
    icon: '🕐',
    category: 'glance',
    colSpan: HOME_SLOT_SIZE_PRESETS.S.colSpan,
    rowSpan: HOME_SLOT_SIZE_PRESETS.S.rowSpan,
    defaultSizePreset: 'M',
    sizePresets: GLANCE_TILE_SIZE_PRESETS,
    render: 'ClockSlot',
    placeable: true,
  },
  weather: {
    id: 'weather',
    label: 'Weather',
    description: 'Local conditions via Open-Meteo',
    icon: '⛅',
    category: 'glance',
    colSpan: HOME_SLOT_SIZE_PRESETS.M.colSpan,
    rowSpan: HOME_SLOT_SIZE_PRESETS.M.rowSpan,
    defaultSizePreset: 'M',
    sizePresets: GLANCE_TILE_SIZE_PRESETS,
    render: 'WeatherSlot',
    placeable: true,
  },
  steamRecent: {
    id: 'steamRecent',
    label: 'Steam Recent',
    description: 'Recently played Steam games',
    icon: '🎮',
    category: 'steam',
    colSpan: STEAM_TILE_SIZE_PRESETS.M.colSpan,
    rowSpan: STEAM_TILE_SIZE_PRESETS.M.rowSpan,
    defaultSizePreset: 'M',
    sizePresets: STEAM_TILE_SIZE_PRESETS,
    render: 'SteamRecentSlot',
    placeable: true,
  },
  steamMostPlayed: {
    id: 'steamMostPlayed',
    label: 'Steam Most Played',
    description: 'Your highest lifetime playtime titles',
    icon: '🏆',
    category: 'steam',
    colSpan: STEAM_TILE_SIZE_PRESETS.M.colSpan,
    rowSpan: STEAM_TILE_SIZE_PRESETS.M.rowSpan,
    defaultSizePreset: 'M',
    sizePresets: STEAM_TILE_SIZE_PRESETS,
    render: 'SteamMostPlayedSlot',
    placeable: true,
  },
  steamFriends: {
    id: 'steamFriends',
    label: 'Steam Friends',
    description: 'Friends & what they’re playing',
    icon: '👥',
    category: 'steam',
    colSpan: STEAM_FRIENDS_SIZE_PRESETS.M.colSpan,
    rowSpan: STEAM_FRIENDS_SIZE_PRESETS.M.rowSpan,
    defaultSizePreset: 'M',
    sizePresets: STEAM_FRIENDS_SIZE_PRESETS,
    render: 'SteamFriendsSlot',
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
 * Placeable kinds grouped for the Edit Home picker.
 * @returns {Array<{ id: string, label: string, kinds: Array<typeof HOME_SLOT_KINDS[keyof typeof HOME_SLOT_KINDS]> }>}
 */
export function listPlaceableHomeSlotKindsGrouped() {
  const kinds = listPlaceableHomeSlotKinds();
  const byCat = new Map();
  for (const kind of kinds) {
    const catId = kind.category || 'system';
    if (!byCat.has(catId)) byCat.set(catId, []);
    byCat.get(catId).push(kind);
  }
  const groups = [];
  for (const cat of HOME_SLOT_PICKER_CATEGORIES) {
    const list = byCat.get(cat.id);
    if (list?.length) {
      groups.push({ id: cat.id, label: cat.label, kinds: list });
      byCat.delete(cat.id);
    }
  }
  for (const [id, list] of byCat) {
    if (list.length) {
      groups.push({
        id,
        label: id.charAt(0).toUpperCase() + id.slice(1),
        kinds: list,
      });
    }
  }
  return groups;
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
  const cs = Number(colSpan) || 1;
  const rs = Number(rowSpan) || 1;
  return (
    Object.values(kind.sizePresets).find((p) => p.colSpan === cs && p.rowSpan === rs) ?? null
  );
}

/**
 * Prefer kind.defaultSizePreset, then remaining kind presets largest-first that fit.
 * @param {string} kindId
 * @param {(preset: { id: string, colSpan: number, rowSpan: number }) => boolean} fits
 * @returns {string}
 */
export function pickPlaceableSizePresetId(kindId, fits) {
  const kind = getHomeSlotKind(kindId);
  const presets = kind?.sizePresets
    ? Object.values(kind.sizePresets)
    : Object.values(HOME_SLOT_SIZE_PRESETS);
  const preferredId = kind?.defaultSizePreset || 'M';
  const ordered = [
    ...presets.filter((p) => p.id === preferredId),
    ...presets
      .filter((p) => p.id !== preferredId)
      .sort((a, b) => b.colSpan * b.rowSpan - a.colSpan * a.rowSpan),
  ];
  for (const preset of ordered) {
    if (typeof fits === 'function' && fits(preset)) return preset.id;
  }
  return preferredId;
}
