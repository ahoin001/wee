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
  Object.freeze({ id: 'steam', label: 'Games' }),
  Object.freeze({ id: 'media', label: 'Media' }),
  Object.freeze({ id: 'glance', label: 'Glance' }),
  Object.freeze({ id: 'system', label: 'System' }),
]);

/** Now Playing size set — max 3×3 (never 4 cols/rows). Art + controls on every size. */
const NOW_PLAYING_SIZE_PRESETS = Object.freeze({
  S: Object.freeze({ id: 'S', label: '1×1', colSpan: 1, rowSpan: 1, capacity: 0 }),
  T: Object.freeze({ id: 'T', label: '1×2', colSpan: 1, rowSpan: 2, capacity: 2 }),
  M: Object.freeze({ id: 'M', label: '2×1', colSpan: 2, rowSpan: 1, capacity: 3 }),
  L: Object.freeze({ id: 'L', label: '2×2', colSpan: 2, rowSpan: 2, capacity: 6 }),
  W: Object.freeze({ id: 'W', label: '3×2', colSpan: 3, rowSpan: 2, capacity: 8 }),
  V: Object.freeze({ id: 'V', label: '2×3', colSpan: 2, rowSpan: 3, capacity: 8 }),
  XL: Object.freeze({ id: 'XL', label: '3×3', colSpan: 3, rowSpan: 3, capacity: 12 }),
});

/** Clock — keep S for compact glance. */
const GLANCE_TILE_SIZE_PRESETS = Object.freeze({
  S: HOME_SLOT_SIZE_PRESETS.S,
  M: HOME_SLOT_SIZE_PRESETS.M,
  L: HOME_SLOT_SIZE_PRESETS.L,
});

/** Weather — taller / wider boards unlock daily + hourly depth. */
const WEATHER_TILE_SIZE_PRESETS = Object.freeze({
  S: HOME_SLOT_SIZE_PRESETS.S,
  M: HOME_SLOT_SIZE_PRESETS.M,
  L: HOME_SLOT_SIZE_PRESETS.L,
  /** Wide 3×1 shelf for daily chips beside current. */
  W: Object.freeze({ id: 'W', label: '3×1', colSpan: 3, rowSpan: 1, capacity: 0 }),
  V: Object.freeze({ id: 'V', label: '2×3', colSpan: 2, rowSpan: 3, capacity: 0 }),
  XL: HOME_SLOT_SIZE_PRESETS.XL,
});

/**
 * Steam Recent / Most Played tiles — never 1×1. Min 2 columns.
 * Shelves (1-row) first, then tall boards, then wide 3×2. Cap matches 4×4 board max.
 */
export const STEAM_TILE_SIZE_PRESETS = Object.freeze({
  H2: Object.freeze({ id: 'H2', label: '2×1', colSpan: 2, rowSpan: 1, capacity: 12 }),
  H3: Object.freeze({ id: 'H3', label: '3×1', colSpan: 3, rowSpan: 1, capacity: 14 }),
  H4: Object.freeze({ id: 'H4', label: '4×1', colSpan: 4, rowSpan: 1, capacity: 16 }),
  M: Object.freeze({ id: 'M', label: '2×2', colSpan: 2, rowSpan: 2, capacity: 12 }),
  L: Object.freeze({ id: 'L', label: '2×3', colSpan: 2, rowSpan: 3, capacity: 18 }),
  XL: Object.freeze({ id: 'XL', label: '2×4', colSpan: 2, rowSpan: 4, capacity: 24 }),
  /** Wide layout — horizontal shelf scroll by default (auto axis). */
  W: Object.freeze({ id: 'W', label: '3×2', colSpan: 3, rowSpan: 2, capacity: 16 }),
});

/**
 * Steam Friends — 1-row shelves (H*) use horizontal friend cards; taller sizes keep the list.
 */
export const STEAM_FRIENDS_SIZE_PRESETS = Object.freeze({
  H2: Object.freeze({ id: 'H2', label: '2×1', colSpan: 2, rowSpan: 1, capacity: 10 }),
  H3: Object.freeze({ id: 'H3', label: '3×1', colSpan: 3, rowSpan: 1, capacity: 14 }),
  H4: Object.freeze({ id: 'H4', label: '4×1', colSpan: 4, rowSpan: 1, capacity: 18 }),
  M: Object.freeze({ id: 'M', label: '2×2', colSpan: 2, rowSpan: 2, capacity: 12 }),
  L: Object.freeze({ id: 'L', label: '2×3', colSpan: 2, rowSpan: 3, capacity: 18 }),
  W: Object.freeze({ id: 'W', label: '3×2', colSpan: 3, rowSpan: 2, capacity: 16 }),
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
    sizePresets: WEATHER_TILE_SIZE_PRESETS,
    render: 'WeatherSlot',
    placeable: true,
  },
  steamGames: {
    id: 'steamGames',
    label: 'Steam Games',
    description: 'Recent, most played, or favorites — switch in Looks',
    icon: '🎮',
    category: 'steam',
    colSpan: STEAM_TILE_SIZE_PRESETS.M.colSpan,
    rowSpan: STEAM_TILE_SIZE_PRESETS.M.rowSpan,
    defaultSizePreset: 'M',
    sizePresets: STEAM_TILE_SIZE_PRESETS,
    render: 'SteamGamesSlot',
    placeable: true,
  },
  /** @deprecated Migrated to steamGames + widget.mode — kept for normalize aliases only. */
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
    placeable: false,
  },
  /** @deprecated Migrated to steamGames + widget.mode */
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
    placeable: false,
  },
  /** @deprecated Migrated to steamGames + widget.mode */
  steamFavorites: {
    id: 'steamFavorites',
    label: 'Steam Favorites',
    description: 'Games you starred in Wee Game Hub',
    icon: '⭐',
    category: 'steam',
    colSpan: STEAM_TILE_SIZE_PRESETS.M.colSpan,
    rowSpan: STEAM_TILE_SIZE_PRESETS.M.rowSpan,
    defaultSizePreset: 'M',
    sizePresets: STEAM_TILE_SIZE_PRESETS,
    render: 'SteamFavoritesSlot',
    placeable: false,
  },
  steamTags: {
    id: 'steamTags',
    label: 'Steam Tags',
    description: 'A shelf for one of your Steam library tags',
    icon: '🏷️',
    category: 'steam',
    colSpan: STEAM_TILE_SIZE_PRESETS.M.colSpan,
    rowSpan: STEAM_TILE_SIZE_PRESETS.M.rowSpan,
    defaultSizePreset: 'M',
    sizePresets: STEAM_TILE_SIZE_PRESETS,
    render: 'SteamTagsSlot',
    placeable: true,
  },
  steamFriends: {
    id: 'steamFriends',
    label: 'Steam Friends',
    description: 'Friends online & offline — 1-row shelves scroll as cards',
    icon: '👥',
    category: 'steam',
    colSpan: STEAM_FRIENDS_SIZE_PRESETS.M.colSpan,
    rowSpan: STEAM_FRIENDS_SIZE_PRESETS.M.rowSpan,
    defaultSizePreset: 'M',
    sizePresets: STEAM_FRIENDS_SIZE_PRESETS,
    render: 'SteamFriendsSlot',
    placeable: true,
  },
  epicLibrary: {
    id: 'epicLibrary',
    label: 'Epic Library',
    description: 'Installed Epic Games titles',
    icon: '🎯',
    category: 'steam',
    colSpan: STEAM_TILE_SIZE_PRESETS.M.colSpan,
    rowSpan: STEAM_TILE_SIZE_PRESETS.M.rowSpan,
    defaultSizePreset: 'M',
    sizePresets: STEAM_TILE_SIZE_PRESETS,
    render: 'EpicLibrarySlot',
    placeable: true,
  },
  systemPad: {
    id: 'systemPad',
    label: 'System Pad',
    description: 'Power status plus Lock, Task Manager, Explorer',
    icon: '🔋',
    category: 'system',
    colSpan: HOME_SLOT_SIZE_PRESETS.M.colSpan,
    rowSpan: HOME_SLOT_SIZE_PRESETS.M.rowSpan,
    defaultSizePreset: 'M',
    sizePresets: HOME_SLOT_SIZE_PRESETS,
    render: 'SystemPadSlot',
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
