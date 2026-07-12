/**
 * Channel grid geometry — single source of truth helpers.
 * Defaults match classic Wii 4×3×3; user layout lives on channel space `layout`.
 */

export const WII_LAYOUT_PRESET = Object.freeze({
  columns: 4,
  rows: 3,
  totalPages: 3,
});

/** Clamped ranges for settings geometry controls. */
export const CHANNEL_LAYOUT_LIMITS = Object.freeze({
  columns: { min: 3, max: 6 },
  rows: { min: 2, max: 4 },
  totalPages: { min: 1, max: 5 },
  peekPercent: { min: 4, max: 14 },
});

/** Must stay in sync with --wii-strip-peek (driven from JS via resolveLayout). */
export const WII_STRIP_PEEK_PERCENT = 8;

export const WII_STRIP_LAYOUT_PRESET = Object.freeze({
  peekPercent: WII_STRIP_PEEK_PERCENT,
  pageAdvancePercent: 100 - WII_STRIP_PEEK_PERCENT,
});

/** Page flip duration (ms) — shared by goToPage timeout + CSS/Framer strip. */
export const CHANNEL_PAGE_FLIP_MS = 520;

export const DEFAULT_CHANNEL_NAVIGATION = Object.freeze({
  currentPage: 0,
  totalPages: 3,
  mode: 'wii',
  isAnimating: false,
  animationDirection: 'none',
  animationType: 'slide',
  animationDuration: CHANNEL_PAGE_FLIP_MS,
  animationEasing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
  enableSlideAnimation: true,
});

export const getChannelsPerPage = (columns, rows) => columns * rows;

export const getTotalChannels = (columns, rows, totalPages) =>
  getChannelsPerPage(columns, rows) * totalPages;

export const clampPageIndex = (currentPage, totalPages) =>
  Math.max(0, Math.min(currentPage || 0, Math.max(1, totalPages) - 1));

const clampInt = (value, min, max, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
};

/**
 * @param {object} [raw]
 * @returns {{ columns: number, rows: number, totalPages: number, peekPercent: number }}
 */
export function normalizeLayoutConfig(raw = {}) {
  const incoming = raw && typeof raw === 'object' ? raw : {};
  const columns = clampInt(
    incoming.columns ?? incoming.gridColumns,
    CHANNEL_LAYOUT_LIMITS.columns.min,
    CHANNEL_LAYOUT_LIMITS.columns.max,
    WII_LAYOUT_PRESET.columns
  );
  const rows = clampInt(
    incoming.rows ?? incoming.gridRows,
    CHANNEL_LAYOUT_LIMITS.rows.min,
    CHANNEL_LAYOUT_LIMITS.rows.max,
    WII_LAYOUT_PRESET.rows
  );
  const totalPages = clampInt(
    incoming.totalPages,
    CHANNEL_LAYOUT_LIMITS.totalPages.min,
    CHANNEL_LAYOUT_LIMITS.totalPages.max,
    WII_LAYOUT_PRESET.totalPages
  );
  const peekPercent = clampInt(
    incoming.peekPercent,
    CHANNEL_LAYOUT_LIMITS.peekPercent.min,
    CHANNEL_LAYOUT_LIMITS.peekPercent.max,
    WII_STRIP_PEEK_PERCENT
  );
  return { columns, rows, totalPages, peekPercent };
}

/**
 * Resolve full layout + derived metrics from channel space data.
 * Prefer `layout` object; fall back to legacy gridColumns/gridRows/totalChannels/nav.totalPages.
 *
 * @param {object} [channelData]
 * @returns {{
 *   columns: number,
 *   rows: number,
 *   totalPages: number,
 *   peekPercent: number,
 *   channelsPerPage: number,
 *   totalChannels: number,
 *   pageAdvancePercent: number,
 * }}
 */
export function resolveLayout(channelData = {}) {
  const data = channelData && typeof channelData === 'object' ? channelData : {};
  const nav = data.navigation && typeof data.navigation === 'object' ? data.navigation : {};
  const fromLayout = data.layout && typeof data.layout === 'object' ? data.layout : {};

  let totalPagesHint = fromLayout.totalPages ?? nav.totalPages;
  if (totalPagesHint == null && data.totalChannels && (fromLayout.columns || data.gridColumns)) {
    const cols = fromLayout.columns ?? data.gridColumns ?? WII_LAYOUT_PRESET.columns;
    const rows = fromLayout.rows ?? data.gridRows ?? WII_LAYOUT_PRESET.rows;
    const per = getChannelsPerPage(cols, rows);
    if (per > 0) totalPagesHint = Math.max(1, Math.round(Number(data.totalChannels) / per));
  }

  const layout = normalizeLayoutConfig({
    columns: fromLayout.columns ?? data.gridColumns,
    rows: fromLayout.rows ?? data.gridRows,
    totalPages: totalPagesHint,
    peekPercent: fromLayout.peekPercent,
  });

  const channelsPerPage = getChannelsPerPage(layout.columns, layout.rows);
  const totalChannels = getTotalChannels(layout.columns, layout.rows, layout.totalPages);

  return {
    ...layout,
    channelsPerPage,
    totalChannels,
    pageAdvancePercent: 100 - layout.peekPercent,
  };
}

export const resolveNavigation = (rawNavigation = {}) => ({
  ...DEFAULT_CHANNEL_NAVIGATION,
  ...rawNavigation,
});

/**
 * Grid config for strip / reorder / ops — reads store layout (unlocked).
 */
export const resolveGridConfig = (channelData, _navigation) => {
  const layout = resolveLayout(channelData);
  return {
    columns: layout.columns,
    rows: layout.rows,
    totalChannels: layout.totalChannels,
    channelsPerPage: layout.channelsPerPage,
    totalPages: layout.totalPages,
    peekPercent: layout.peekPercent,
  };
};

/**
 * Soft sync: only fills missing layout fields; never overwrites user geometry.
 * @deprecated Prefer resolveLayout + explicit migration on user change.
 */
export const getWiiNormalization = (channelData) => {
  const layout = resolveLayout(channelData);
  const currentNavigation = channelData.navigation || {};
  const normalizedPage = clampPageIndex(currentNavigation.currentPage || 0, layout.totalPages);

  const dataPatch = {
    layout: {
      columns: layout.columns,
      rows: layout.rows,
      totalPages: layout.totalPages,
      peekPercent: layout.peekPercent,
    },
    gridColumns: layout.columns,
    gridRows: layout.rows,
    totalChannels: layout.totalChannels,
  };

  const navigationPatch = {
    mode: 'wii',
    currentPage: normalizedPage,
    totalPages: layout.totalPages,
    animationType: 'slide',
    animationDuration: CHANNEL_PAGE_FLIP_MS,
    enableSlideAnimation: true,
  };

  const hasLayoutObject = channelData.layout && typeof channelData.layout === 'object';
  const hasDataMismatch =
    !hasLayoutObject ||
    channelData.gridColumns !== dataPatch.gridColumns ||
    channelData.gridRows !== dataPatch.gridRows ||
    channelData.totalChannels !== dataPatch.totalChannels;
  const hasNavigationMismatch =
    (currentNavigation.totalPages ?? DEFAULT_CHANNEL_NAVIGATION.totalPages) !== navigationPatch.totalPages ||
    (currentNavigation.currentPage || 0) !== navigationPatch.currentPage ||
    currentNavigation.animationDuration !== navigationPatch.animationDuration;

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

export function channelIdAtIndex(index) {
  return `channel-${index}`;
}

/**
 * When total slot count shrinks, drop keys beyond the new range.
 * Growing pads with empty slots (no keys). Does not reindex content.
 *
 * @param {Record<string, unknown>} configuredChannels
 * @param {Record<string, unknown>} channelConfigs
 * @param {Record<string, unknown>} slotMeta
 * @param {number} nextTotalChannels
 */
export function migrateChannelSlotMaps(
  configuredChannels = {},
  channelConfigs = {},
  slotMeta = {},
  nextTotalChannels
) {
  const n = Math.max(0, nextTotalChannels | 0);
  const nextConfigured = {};
  const nextKen = {};
  const nextMeta = {};
  for (let i = 0; i < n; i++) {
    const id = channelIdAtIndex(i);
    if (configuredChannels[id] != null) nextConfigured[id] = configuredChannels[id];
    if (channelConfigs[id] != null) nextKen[id] = channelConfigs[id];
    if (slotMeta[id] != null) nextMeta[id] = slotMeta[id];
  }
  return {
    configuredChannels: nextConfigured,
    channelConfigs: nextKen,
    slotMeta: nextMeta,
  };
}

/**
 * Apply a new layout to space data maps (truncate/pad keys).
 */
export function applyLayoutChangeToSpaceData(channelData, nextLayoutPartial) {
  const prev = resolveLayout(channelData);
  const nextLayout = normalizeLayoutConfig({
    ...prev,
    ...nextLayoutPartial,
  });
  const nextTotal = getTotalChannels(nextLayout.columns, nextLayout.rows, nextLayout.totalPages);
  const migrated = migrateChannelSlotMaps(
    channelData.configuredChannels || {},
    channelData.channelConfigs || {},
    channelData.slotMeta || {},
    nextTotal
  );
  const nav = channelData.navigation || {};
  return {
    layout: nextLayout,
    gridColumns: nextLayout.columns,
    gridRows: nextLayout.rows,
    totalChannels: nextTotal,
    ...migrated,
    navigation: {
      ...nav,
      totalPages: nextLayout.totalPages,
      currentPage: clampPageIndex(nav.currentPage || 0, nextLayout.totalPages),
      animationDuration: CHANNEL_PAGE_FLIP_MS,
    },
  };
}

export function isSlotHidden(slotMeta, channelIndex) {
  const id = channelIdAtIndex(channelIndex);
  const meta = slotMeta && slotMeta[id];
  return Boolean(meta && meta.hidden);
}
