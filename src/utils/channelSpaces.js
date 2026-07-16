import {
  clampPageIndex,
  DEFAULT_CHANNEL_NAVIGATION,
  normalizeLayoutByPage,
  normalizeLayoutConfig,
  resolveLayout,
  WII_LAYOUT_PRESET,
  WII_STRIP_PEEK_PERCENT,
  CHANNEL_PAGE_FLIP_MS,
} from './channelLayoutSystem';
import { migrateSpaceDataToSlots } from './homeGridSlots';

/**
 * Channel grid data is scoped per shell space profile layer:
 * - `dataBySpace.home` is the live Home board.
 * - `secondaryChannelProfiles[id].channelSpace` stores Home Profile channel layouts.
 * - `dataBySpace.workspaces` remains a persistence mirror of the active Home Profile.
 * - `slots[]` is the widget-ready SSOT; configuredChannels/channelConfigs/slotMeta are projections.
 */

export const CHANNEL_SPACE_KEYS = ['home', 'workspaces'];

/** Vertical shell rail order: Home → Focus (workspaces) → Game Hub. Media Hub is opt-in. */
export const DEFAULT_SHELL_SPACE_ORDER = ['home', 'workspaces', 'gamehub'];

/**
 * Resolve whether Media Hub belongs in the shell rail.
 * When `mediaHubEnabled` is omitted, legacy orders that still include `mediahub` count as enabled.
 *
 * @param {string[]|unknown} order
 * @param {{ mediaHubEnabled?: boolean }} [opts]
 */
export function resolveMediaHubEnabled(order, { mediaHubEnabled } = {}) {
  if (typeof mediaHubEnabled === 'boolean') return mediaHubEnabled;
  return Array.isArray(order) && order.includes('mediahub');
}

/**
 * Normalize rail order to the canonical set for the current Media Hub flag.
 * Base: home → workspaces → gamehub. When enabled, mediahub sits after workspaces.
 *
 * @param {string[]|unknown} order
 * @param {{ mediaHubEnabled?: boolean }} [opts]
 */
export function normalizeShellSpaceOrder(order, { mediaHubEnabled } = {}) {
  const enabled = resolveMediaHubEnabled(order, { mediaHubEnabled });
  const canonical = enabled
    ? ['home', 'workspaces', 'mediahub', 'gamehub']
    : ['home', 'workspaces', 'gamehub'];
  const want = new Set(canonical);

  if (!Array.isArray(order)) return [...canonical];

  const filtered = [];
  const seen = new Set();
  for (const id of order) {
    if (!want.has(id) || seen.has(id)) continue;
    seen.add(id);
    filtered.push(id);
  }

  for (const id of canonical) {
    if (seen.has(id)) continue;
    if (id === 'mediahub') {
      const afterWs = filtered.indexOf('workspaces');
      if (afterWs >= 0) filtered.splice(afterWs + 1, 0, id);
      else {
        const beforeGh = filtered.indexOf('gamehub');
        if (beforeGh >= 0) filtered.splice(beforeGh, 0, id);
        else filtered.push(id);
      }
    } else if (id === 'workspaces') {
      const afterHome = filtered.indexOf('home');
      if (afterHome >= 0) filtered.splice(afterHome + 1, 0, id);
      else filtered.push(id);
    } else if (id === 'home') {
      filtered.unshift(id);
    } else {
      filtered.push(id);
    }
    seen.add(id);
  }

  if (filtered.length !== canonical.length) return [...canonical];
  return filtered;
}

/** Default profile id for the second space’s channel grid (after migration). */
export const DEFAULT_SECONDARY_CHANNEL_PROFILE_ID = 'sec-default';

/** @returns {'home' | 'workspaces'} */
export function normalizeChannelSpaceKey(spaceId) {
  return spaceId === 'workspaces' ? 'workspaces' : 'home';
}

/**
 * Page/sidebar chrome should follow the visible channel space when on Home or Focus.
 * When Game Hub / Media Hub is active, channel nav is hidden — use `home` for fallback reads.
 * @returns {'home' | 'workspaces'}
 */
export function resolveActiveChannelSpaceKey(activeSpaceId) {
  return activeSpaceId === 'workspaces' ? 'workspaces' : 'home';
}

/**
 * Current channel-board page index for wallpaper / nav coupling on Home or Focus.
 * Hub spaces fall back to Home’s page (wallpaper still resolves via appearance).
 * @param {{ activeSpaceId?: string, channels?: object }} args
 * @returns {number}
 */
export function resolveActiveBoardCurrentPage({ activeSpaceId, channels } = {}) {
  const key = resolveActiveChannelSpaceKey(activeSpaceId);
  if (key === 'workspaces') {
    const page = getSecondaryChannelSpaceData(channels)?.navigation?.currentPage;
    return Number.isFinite(page) ? page : 0;
  }
  const page = channels?.dataBySpace?.home?.navigation?.currentPage;
  return Number.isFinite(page) ? page : 0;
}

export function createDefaultChannelSpaceData() {
  const layout = normalizeLayoutConfig({
    columns: WII_LAYOUT_PRESET.columns,
    rows: WII_LAYOUT_PRESET.rows,
    totalPages: WII_LAYOUT_PRESET.totalPages,
    peekPercent: WII_STRIP_PEEK_PERCENT,
  });
  const totalChannels = layout.columns * layout.rows * layout.totalPages;
  return {
    layout,
    layoutByPage: {},
    gridColumns: layout.columns,
    gridRows: layout.rows,
    totalChannels,
    slots: [],
    configuredChannels: {},
    channelConfigs: {},
    slotMeta: {},
    navigation: {
      currentPage: 0,
      totalPages: layout.totalPages,
      mode: 'wii',
      isAnimating: false,
      animationDirection: 'none',
      animationType: 'slide',
      animationDuration: CHANNEL_PAGE_FLIP_MS,
      animationEasing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      enableSlideAnimation: true,
    },
  };
}

export function normalizeChannelSpaceData(raw) {
  const base = createDefaultChannelSpaceData();
  const incoming = raw && typeof raw === 'object' ? raw : {};
  const incomingNav = incoming.navigation && typeof incoming.navigation === 'object' ? incoming.navigation : {};

  const layout = resolveLayout(incoming);
  const currentPage = clampPageIndex(
    incomingNav.currentPage ?? DEFAULT_CHANNEL_NAVIGATION.currentPage,
    layout.totalPages
  );

  const normalized = {
    ...base,
    ...incoming,
    layout: {
      columns: layout.columns,
      rows: layout.rows,
      totalPages: layout.totalPages,
      peekPercent: layout.peekPercent,
    },
    layoutByPage: normalizeLayoutByPage(incoming.layoutByPage, layout),
    gridColumns: layout.columns,
    gridRows: layout.rows,
    totalChannels: layout.totalChannels,
    configuredChannels:
      incoming.configuredChannels && typeof incoming.configuredChannels === 'object'
        ? incoming.configuredChannels
        : base.configuredChannels,
    channelConfigs:
      incoming.channelConfigs && typeof incoming.channelConfigs === 'object'
        ? incoming.channelConfigs
        : base.channelConfigs,
    slotMeta:
      incoming.slotMeta && typeof incoming.slotMeta === 'object' ? incoming.slotMeta : base.slotMeta,
    slots: Array.isArray(incoming.slots) ? incoming.slots : base.slots,
    navigation: {
      ...base.navigation,
      ...incomingNav,
      mode: 'wii',
      totalPages: layout.totalPages,
      currentPage,
      animationType: incomingNav.animationType || 'slide',
      animationDuration: incomingNav.animationDuration || CHANNEL_PAGE_FLIP_MS,
      enableSlideAnimation:
        incomingNav.enableSlideAnimation !== undefined ? incomingNav.enableSlideAnimation : true,
    },
  };

  return migrateSpaceDataToSlots(normalized);
}

/**
 * Channel grid for the second shell space (rail id `workspaces`), from the active profile.
 */
export function getSecondaryChannelSpaceData(channels) {
  if (!channels || typeof channels !== 'object') {
    return createDefaultChannelSpaceData();
  }
  const id = channels.activeSecondaryChannelProfileId || DEFAULT_SECONDARY_CHANNEL_PROFILE_ID;
  const profiles = channels.secondaryChannelProfiles || {};
  const entry = profiles[id];
  if (entry && typeof entry.channelSpace === 'object') {
    return normalizeChannelSpaceData(entry.channelSpace);
  }
  return normalizeChannelSpaceData(channels.dataBySpace?.workspaces || createDefaultChannelSpaceData());
}

export function getChannelDataSlice(channels, spaceKey) {
  const key = normalizeChannelSpaceKey(spaceKey);
  if (key === 'workspaces') {
    return getSecondaryChannelSpaceData(channels);
  }
  return normalizeChannelSpaceData(channels?.dataBySpace?.[key] || createDefaultChannelSpaceData());
}

/**
 * One-shot migration: legacy `dataBySpace.workspaces` only → secondary profile map.
 * @returns {object} patched `channels` slice
 */
export function normalizeSecondaryChannelProfiles(channels) {
  if (!channels || typeof channels !== 'object') return channels;
  const empty = createDefaultChannelSpaceData();
  const legacyWs = channels.dataBySpace?.workspaces;

  let profiles = { ...(channels.secondaryChannelProfiles || {}) };
  let activeId = channels.activeSecondaryChannelProfileId || DEFAULT_SECONDARY_CHANNEL_PROFILE_ID;

  const hasProfiles = profiles && Object.keys(profiles).length > 0;
  if (!hasProfiles) {
    const source =
      legacyWs && typeof legacyWs === 'object'
        ? JSON.parse(JSON.stringify(legacyWs))
        : JSON.parse(JSON.stringify(empty));
    profiles = {
      [DEFAULT_SECONDARY_CHANNEL_PROFILE_ID]: {
        id: DEFAULT_SECONDARY_CHANNEL_PROFILE_ID,
        name: 'Second',
        channelSpace: source,
      },
    };
    activeId = DEFAULT_SECONDARY_CHANNEL_PROFILE_ID;
  } else if (!profiles[activeId]) {
    const firstId = Object.keys(profiles)[0];
    activeId = firstId || DEFAULT_SECONDARY_CHANNEL_PROFILE_ID;
  }

  const activeEntry = profiles[activeId];
  const activeSpace = activeEntry?.channelSpace
    ? normalizeChannelSpaceData(JSON.parse(JSON.stringify(activeEntry.channelSpace)))
    : legacyWs && typeof legacyWs === 'object'
      ? normalizeChannelSpaceData(JSON.parse(JSON.stringify(legacyWs)))
      : JSON.parse(JSON.stringify(empty));

  return {
    ...channels,
    secondaryChannelProfiles: profiles,
    activeSecondaryChannelProfileId: activeId,
    dataBySpace: {
      ...channels.dataBySpace,
      home: normalizeChannelSpaceData(channels.dataBySpace?.home || empty),
      workspaces: activeSpace,
    },
  };
}

/**
 * Copy legacy `channels.data` into both spaces (same starting point), or fill missing keys.
 */
export function migrateLegacyChannelsToDataBySpace(channels) {
  if (!channels || typeof channels !== 'object') return channels;
  const empty = createDefaultChannelSpaceData();
  const hasBoth = channels.dataBySpace?.home && channels.dataBySpace?.workspaces;
  if (hasBoth) {
    const { data: _drop, ...rest } = channels;
    return normalizeSecondaryChannelProfiles(rest);
  }
  const legacy = channels.data;
  const partialHome = channels.dataBySpace?.home;
  const partialWs = channels.dataBySpace?.workspaces;
  if (partialHome || partialWs) {
    return normalizeSecondaryChannelProfiles({
      ...channels,
      dataBySpace: {
        home: partialHome ? JSON.parse(JSON.stringify(partialHome)) : legacy ? JSON.parse(JSON.stringify(legacy)) : empty,
        workspaces: partialWs ? JSON.parse(JSON.stringify(partialWs)) : legacy ? JSON.parse(JSON.stringify(legacy)) : empty,
      },
    });
  }
  return normalizeSecondaryChannelProfiles({
    ...channels,
    dataBySpace: {
      home: legacy ? JSON.parse(JSON.stringify(legacy)) : empty,
      workspaces: legacy ? JSON.parse(JSON.stringify(legacy)) : empty,
    },
  });
}
