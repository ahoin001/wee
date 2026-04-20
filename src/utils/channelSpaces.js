import { clampPageIndex, DEFAULT_CHANNEL_NAVIGATION, WII_LAYOUT_PRESET } from './channelLayoutSystem';

/**
 * Channel grid data is scoped per shell space profile layer:
 * - `dataBySpace.home` is the live Home board.
 * - `secondaryChannelProfiles[id].channelSpace` stores Home Profile channel layouts.
 * - `dataBySpace.workspaces` remains a persistence mirror of the active Home Profile.
 */

export const CHANNEL_SPACE_KEYS = ['home', 'workspaces'];

/** Vertical shell rail order: Home → Media Hub → Game Hub. */
export const DEFAULT_SHELL_SPACE_ORDER = ['home', 'mediahub', 'gamehub'];

/** Migrate legacy orders and any invalid order to the canonical rail. */
export function normalizeShellSpaceOrder(order) {
  const canonical = [...DEFAULT_SHELL_SPACE_ORDER];
  const want = new Set(canonical);
  if (!Array.isArray(order)) return canonical;

  // Legacy order with secondary shell space.
  if (order.includes('workspaces')) {
    const withoutSecondary = order.filter((id) => id !== 'workspaces');
    return normalizeShellSpaceOrder(withoutSecondary);
  }

  // Legacy persisted order before Media Hub existed.
  if (order.length === 2 && order.includes('home') && order.includes('gamehub')) {
    return ['home', 'mediahub', 'gamehub'];
  }

  if (order.length !== canonical.length) return canonical;
  const got = new Set(order);
  if (want.size !== got.size) return canonical;
  for (const id of want) {
    if (!got.has(id)) return canonical;
  }
  return [...order];
}

/** Default profile id for the second space’s channel grid (after migration). */
export const DEFAULT_SECONDARY_CHANNEL_PROFILE_ID = 'sec-default';

/** @returns {'home' | 'workspaces'} */
export function normalizeChannelSpaceKey(spaceId) {
  return spaceId === 'workspaces' ? 'workspaces' : 'home';
}

/**
 * Page/sidebar chrome should follow the visible channel space when on Home or Work.
 * When Game Hub is active, channel nav is hidden — use `home` for any fallback reads.
 */
export function resolveActiveChannelSpaceKey(activeSpaceId) {
  return 'home';
}

export function createDefaultChannelSpaceData() {
  return {
    gridColumns: 4,
    gridRows: 3,
    totalChannels: 36,
    configuredChannels: {},
    channelConfigs: {},
    navigation: {
      currentPage: 0,
      totalPages: 3,
      mode: 'wii',
      isAnimating: false,
      animationDirection: 'none',
      animationType: 'slide',
      animationDuration: 500,
      animationEasing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      enableSlideAnimation: true,
    },
  };
}

export function normalizeChannelSpaceData(raw) {
  const base = createDefaultChannelSpaceData();
  const incoming = raw && typeof raw === 'object' ? raw : {};
  const incomingNav = incoming.navigation && typeof incoming.navigation === 'object' ? incoming.navigation : {};

  const totalPages = WII_LAYOUT_PRESET.totalPages;
  const currentPage = clampPageIndex(
    incomingNav.currentPage ?? DEFAULT_CHANNEL_NAVIGATION.currentPage,
    totalPages
  );

  return {
    ...base,
    ...incoming,
    gridColumns: WII_LAYOUT_PRESET.columns,
    gridRows: WII_LAYOUT_PRESET.rows,
    totalChannels: WII_LAYOUT_PRESET.columns * WII_LAYOUT_PRESET.rows * WII_LAYOUT_PRESET.totalPages,
    configuredChannels:
      incoming.configuredChannels && typeof incoming.configuredChannels === 'object'
        ? incoming.configuredChannels
        : base.configuredChannels,
    channelConfigs:
      incoming.channelConfigs && typeof incoming.channelConfigs === 'object'
        ? incoming.channelConfigs
        : base.channelConfigs,
    navigation: {
      ...base.navigation,
      ...incomingNav,
      mode: 'wii',
      totalPages,
      currentPage,
      animationType: 'slide',
      animationDuration: 500,
      enableSlideAnimation: true,
    },
  };
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
