export const WII_LAYOUT_PRESET = Object.freeze({
  columns: 4,
  rows: 3,
  totalPages: 3,
});

/** Must match --wii-strip-peek in design-system.css (pageAdvance = 100 - peek). */
const WII_STRIP_PEEK_PERCENT = 8;
export const WII_STRIP_LAYOUT_PRESET = Object.freeze({
  peekPercent: WII_STRIP_PEEK_PERCENT,
  pageAdvancePercent: 100 - WII_STRIP_PEEK_PERCENT,
});

export const DEFAULT_CHANNEL_NAVIGATION = Object.freeze({
  currentPage: 0,
  totalPages: 3,
  mode: 'wii',
  isAnimating: false,
  animationDirection: 'none',
  animationType: 'slide',
  animationDuration: 500,
  animationEasing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  enableSlideAnimation: true,
});

export const getChannelsPerPage = (columns, rows) => columns * rows;

export const getTotalChannels = (columns, rows, totalPages) =>
  getChannelsPerPage(columns, rows) * totalPages;

export const clampPageIndex = (currentPage, totalPages) =>
  Math.max(0, Math.min(currentPage || 0, Math.max(1, totalPages) - 1));

export const resolveNavigation = (rawNavigation = {}) => ({
  ...DEFAULT_CHANNEL_NAVIGATION,
  ...rawNavigation,
});

export const resolveGridConfig = (channelData, navigation) => {
  if (navigation.mode === 'wii') {
    const channelsPerPage = getChannelsPerPage(WII_LAYOUT_PRESET.columns, WII_LAYOUT_PRESET.rows);
    return {
      columns: WII_LAYOUT_PRESET.columns,
      rows: WII_LAYOUT_PRESET.rows,
      totalChannels: channelsPerPage * WII_LAYOUT_PRESET.totalPages,
      channelsPerPage,
    };
  }

  const columns = channelData.gridColumns || 4;
  const rows = channelData.gridRows || 3;
  const channelsPerPage = getChannelsPerPage(columns, rows);
  const fallbackTotalChannels = channelsPerPage * Math.max(1, navigation.totalPages || 1);
  return {
    columns,
    rows,
    totalChannels: channelData.totalChannels || fallbackTotalChannels,
    channelsPerPage,
  };
};

export const getWiiNormalization = (channelData) => {
  const expectedTotalChannels = getTotalChannels(
    WII_LAYOUT_PRESET.columns,
    WII_LAYOUT_PRESET.rows,
    WII_LAYOUT_PRESET.totalPages
  );
  const currentNavigation = channelData.navigation || {};
  const normalizedPage = clampPageIndex(currentNavigation.currentPage || 0, WII_LAYOUT_PRESET.totalPages);

  const dataPatch = {
    gridColumns: WII_LAYOUT_PRESET.columns,
    gridRows: WII_LAYOUT_PRESET.rows,
    totalChannels: expectedTotalChannels,
  };

  const navigationPatch = {
    mode: 'wii',
    currentPage: normalizedPage,
    totalPages: WII_LAYOUT_PRESET.totalPages,
    animationType: 'slide',
    animationDuration: 500,
    enableSlideAnimation: true,
  };

  const hasDataMismatch =
    channelData.gridColumns !== dataPatch.gridColumns ||
    channelData.gridRows !== dataPatch.gridRows ||
    channelData.totalChannels !== dataPatch.totalChannels;
  const hasNavigationMismatch =
    (currentNavigation.totalPages ?? DEFAULT_CHANNEL_NAVIGATION.totalPages) !== navigationPatch.totalPages ||
    currentNavigation.animationType !== navigationPatch.animationType ||
    currentNavigation.animationDuration !== navigationPatch.animationDuration ||
    currentNavigation.enableSlideAnimation !== navigationPatch.enableSlideAnimation ||
    (currentNavigation.currentPage || 0) !== navigationPatch.currentPage;

  return {
    dataPatch,
    navigationPatch,
    needsNormalization: hasDataMismatch || hasNavigationMismatch,
  };
};

export const getPageBounds = (pageIndex, channelsPerPage, totalChannels) => {
  const startIndex = pageIndex * channelsPerPage;
  const endIndex = Math.min(startIndex + channelsPerPage - 1, totalChannels - 1);
  return { startIndex, endIndex };
};

