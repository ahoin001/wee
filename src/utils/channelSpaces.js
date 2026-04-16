/**
 * Channel grid data is scoped per shell space: `home` vs `workspaces` (not Game Hub).
 * Persisted under `channels.dataBySpace` in unified settings.
 */

export const CHANNEL_SPACE_KEYS = ['home', 'workspaces'];

/** @returns {'home' | 'workspaces'} */
export function normalizeChannelSpaceKey(spaceId) {
  return spaceId === 'workspaces' ? 'workspaces' : 'home';
}

/**
 * Page/sidebar chrome should follow the visible channel space when on Home or Work.
 * When Game Hub is active, channel nav is hidden — use `home` for any fallback reads.
 */
export function resolveActiveChannelSpaceKey(activeSpaceId) {
  if (activeSpaceId === 'workspaces') return 'workspaces';
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

export function getChannelDataSlice(channels, spaceKey) {
  const key = normalizeChannelSpaceKey(spaceKey);
  return channels?.dataBySpace?.[key] || createDefaultChannelSpaceData();
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
    return rest;
  }
  const legacy = channels.data;
  const partialHome = channels.dataBySpace?.home;
  const partialWs = channels.dataBySpace?.workspaces;
  if (partialHome || partialWs) {
    return {
      ...channels,
      dataBySpace: {
        home: partialHome ? JSON.parse(JSON.stringify(partialHome)) : legacy ? JSON.parse(JSON.stringify(legacy)) : empty,
        workspaces: partialWs ? JSON.parse(JSON.stringify(partialWs)) : legacy ? JSON.parse(JSON.stringify(legacy)) : empty,
      },
    };
  }
  return {
    ...channels,
    dataBySpace: {
      home: legacy ? JSON.parse(JSON.stringify(legacy)) : empty,
      workspaces: legacy ? JSON.parse(JSON.stringify(legacy)) : empty,
    },
  };
}
