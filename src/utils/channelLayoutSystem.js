/**
 * Channel grid geometry — single source of truth helpers.
 * Defaults match classic Wii 4×3×3; user layout lives on channel space `layout`.
 */

import { channelIdAtIndex as channelIdAtIndexFromReorder } from './channelReorder';

export const WII_LAYOUT_PRESET = Object.freeze({
  columns: 4,
  rows: 3,
  totalPages: 3,
});

/** Canonical live tile aspect (~classic Wii 2:1). CSS `aspect-ratio` is the SSOT in cells. */
export const WII_TILE_ASPECT = 1.95;

/**
 * Estimate cell-fill aspect if tiles were stretched to fill the board (legacy fill).
 * Live tiles use `WII_TILE_ASPECT` via CSS instead — this is for captions/tests only,
 * not a second layout path.
 *
 * @param {{ columns: number, rows: number, boardWidth: number, boardHeight: number, gap?: number }} opts
 * @returns {number} width/height of one cell
 */
export function estimateWiiTileAspect({
  columns,
  rows,
  boardWidth,
  boardHeight,
  gap = 0,
} = {}) {
  const cols = Math.max(1, Number(columns) || 1);
  const rws = Math.max(1, Number(rows) || 1);
  const bw = Math.max(0, Number(boardWidth) || 0);
  const bh = Math.max(0, Number(boardHeight) || 0);
  const g = Math.max(0, Number(gap) || 0);
  if (!bw || !bh) return WII_TILE_ASPECT;
  const cellW = (bw - g * (cols - 1)) / cols;
  const cellH = (bh - g * (rws - 1)) / rws;
  if (!(cellW > 0) || !(cellH > 0)) return WII_TILE_ASPECT;
  return cellW / cellH;
}

/**
 * Live Wii strip board tracks — keeps classic tile scale on 2–3 row boards.
 * Rows use `min(1fr, --wii-row-max)` so 3/4-column layouts do not inflate into
 * giant empty shelves when only a few rows are configured. `--wii-row-max` is
 * resolved in CSS from the visible board column width ÷ {@link WII_TILE_ASPECT}.
 *
 * @param {{ columns?: number, rows?: number, totalPages?: number }} opts
 * @returns {Record<string, string | number>}
 */
export function createWiiBoardTrackStyle({ columns = 4, rows = 3, totalPages = 1 } = {}) {
  const cols = Math.max(1, Math.floor(Number(columns)) || 1);
  const rws = Math.max(1, Math.floor(Number(rows)) || 1);
  const pages = Math.max(1, Math.floor(Number(totalPages)) || 1);
  return {
    gridTemplateColumns: `repeat(${cols * pages}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${rws}, minmax(0, min(1fr, var(--wii-row-max, 1fr))))`,
    '--wii-page-columns': cols,
    '--wii-page-rows': rws,
    '--wii-tile-aspect': String(WII_TILE_ASPECT),
    alignContent: rws <= 3 ? 'center' : 'stretch',
  };
}

/** Clamped ranges for settings geometry controls. */
export const CHANNEL_LAYOUT_LIMITS = Object.freeze({
  columns: { min: 3, max: 4 },
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

/**
 * Coerce persisted/legacy page-flip duration to a positive number (never a string).
 * String `"520"` must not stick via `!==` against numeric `520` (React #185 write storm).
 * @param {unknown} value
 * @returns {number}
 */
export function coerceChannelPageFlipMs(value) {
  const ms = Number(value);
  if (Number.isFinite(ms) && ms > 0) return ms;
  return CHANNEL_PAGE_FLIP_MS;
}

export const DEFAULT_CHANNEL_NAVIGATION = Object.freeze({
  currentPage: 0,
  totalPages: 3,
  mode: 'wii',
  isAnimating: false,
  animationDirection: 'none',
  /** True when next/prev wrapped last↔first — strip uses one-step enter, not a long scrub. */
  animationWrapped: false,
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

/**
 * Circular page index — used for infinite Home board paging (last ↔ first).
 * @param {number} pageIndex
 * @param {number} totalPages
 * @returns {number}
 */
export function wrapPageIndex(pageIndex, totalPages) {
  const total = Math.max(1, Math.floor(Number(totalPages)) || 1);
  if (total <= 1) return 0;
  const raw = Math.floor(Number(pageIndex));
  const n = Number.isFinite(raw) ? raw : 0;
  return ((n % total) + total) % total;
}

/**
 * Step ±1 (or more) with wrap. Direction follows the step, including wrap-around.
 * @param {number} currentPage
 * @param {number} delta
 * @param {number} totalPages
 * @returns {{ page: number, direction: 'left' | 'right' | 'none', wrapped: boolean }}
 */
export function resolveSteppedChannelPage(currentPage, delta, totalPages) {
  const total = Math.max(1, Math.floor(Number(totalPages)) || 1);
  const from = clampPageIndex(currentPage, total);
  const step = Math.trunc(Number(delta)) || 0;
  if (total <= 1 || step === 0) {
    return { page: from, direction: 'none', wrapped: false };
  }
  const page = wrapPageIndex(from + step, total);
  const direction = step > 0 ? 'right' : 'left';
  const wrapped = step > 0 ? page < from : page > from;
  return { page, direction, wrapped };
}

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
 * Space-level layout is the continuous-strip geometry SSOT (slot indexing, CSS strip).
 * Per-page column/row overrides live in `layoutByPage` — see resolveLayoutForPage.
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

/**
 * Normalize `layoutByPage` map. Keys are page indices; values may override columns/rows only.
 * totalPages / peekPercent always come from space-level layout.
 *
 * @param {unknown} raw
 * @param {{ columns: number, rows: number, totalPages: number }} spaceLayout
 * @returns {Record<string, { columns: number, rows: number }>}
 */
export function normalizeLayoutByPage(raw, spaceLayout) {
  const strip = spaceLayout && typeof spaceLayout === 'object' ? spaceLayout : WII_LAYOUT_PRESET;
  const totalPages = Math.max(1, strip.totalPages | 0);
  const incoming = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const out = {};
  for (const [key, value] of Object.entries(incoming)) {
    const pageIndex = Number(key);
    if (!Number.isInteger(pageIndex) || pageIndex < 0 || pageIndex >= totalPages) continue;
    if (!value || typeof value !== 'object') continue;
    const columns = clampInt(
      value.columns,
      CHANNEL_LAYOUT_LIMITS.columns.min,
      CHANNEL_LAYOUT_LIMITS.columns.max,
      strip.columns ?? WII_LAYOUT_PRESET.columns
    );
    const rows = clampInt(
      value.rows,
      CHANNEL_LAYOUT_LIMITS.rows.min,
      CHANNEL_LAYOUT_LIMITS.rows.max,
      strip.rows ?? WII_LAYOUT_PRESET.rows
    );
    // Drop no-ops that match the strip exactly.
    if (columns === strip.columns && rows === strip.rows) continue;
    out[String(pageIndex)] = { columns, rows };
  }
  return out;
}

/**
 * Effective columns/rows for a page (layoutByPage override → space layout fallback).
 *
 * v1 strip note: the continuous Wii strip CSS and absolute slot indexing always use
 * space-level `resolveLayout` (max/strip geometry). `layoutByPage` drives settings
 * preview, "this page only" edits, and page-scoped occupancy/placement probes via
 * `pageColumns`/`pageRows` on resolveGridConfig — it does not reshape per-page strip
 * widths (different column counts per page would break the continuous strip).
 *
 * @param {object} [channelData]
 * @param {number} [pageIndex]
 */
export function resolveLayoutForPage(channelData = {}, pageIndex = 0) {
  const strip = resolveLayout(channelData);
  const page = clampPageIndex(pageIndex, strip.totalPages);
  const byPage = normalizeLayoutByPage(channelData?.layoutByPage, strip);
  const override = byPage[String(page)];
  const columns = override?.columns ?? strip.columns;
  const rows = override?.rows ?? strip.rows;
  const channelsPerPage = getChannelsPerPage(columns, rows);
  return {
    columns,
    rows,
    totalPages: strip.totalPages,
    peekPercent: strip.peekPercent,
    channelsPerPage,
    // Slot indexing / strip length stay on space geometry.
    stripChannelsPerPage: strip.channelsPerPage,
    totalChannels: strip.totalChannels,
    pageAdvancePercent: strip.pageAdvancePercent,
    pageIndex: page,
    hasPageOverride: Boolean(override),
  };
}

/**
 * Effective layout for the page that owns an absolute slot index (strip-indexed).
 * @param {object} [channelData]
 * @param {number} absoluteIndex
 */
export function resolveLayoutForSlotIndex(channelData = {}, absoluteIndex = 0) {
  const strip = resolveLayout(channelData);
  const per = Math.max(1, strip.channelsPerPage);
  const pageIndex = Math.floor(Math.max(0, absoluteIndex | 0) / per);
  return resolveLayoutForPage(channelData, pageIndex);
}

/**
 * Apply a columns/rows override for one page. Expands strip geometry when the page
 * needs more columns/rows than the space layout; snapshots other pages at the prior
 * strip size so they keep their previous effective grid.
 *
 * @param {object} channelData
 * @param {number} pageIndex
 * @param {{ columns?: number, rows?: number }} partial
 * @returns {{ dataPatch: object, stripExpand: { columns: number, rows: number } | null }}
 */
export function buildPageLayoutOverridePatch(channelData, pageIndex, partial = {}) {
  const strip = resolveLayout(channelData);
  const page = clampPageIndex(pageIndex, strip.totalPages);
  const existing = normalizeLayoutByPage(channelData?.layoutByPage, strip);
  const prevPage = existing[String(page)] || { columns: strip.columns, rows: strip.rows };
  const nextPage = {
    columns: clampInt(
      partial.columns ?? prevPage.columns,
      CHANNEL_LAYOUT_LIMITS.columns.min,
      CHANNEL_LAYOUT_LIMITS.columns.max,
      prevPage.columns
    ),
    rows: clampInt(
      partial.rows ?? prevPage.rows,
      CHANNEL_LAYOUT_LIMITS.rows.min,
      CHANNEL_LAYOUT_LIMITS.rows.max,
      prevPage.rows
    ),
  };

  const needsExpand =
    nextPage.columns > strip.columns || nextPage.rows > strip.rows;

  /** @type {Record<string, { columns: number, rows: number }>} */
  const layoutByPage = { ...existing };

  if (needsExpand) {
    // Freeze other pages at the old strip size before growing the board.
    for (let p = 0; p < strip.totalPages; p += 1) {
      const key = String(p);
      if (p === page) continue;
      if (!layoutByPage[key]) {
        layoutByPage[key] = { columns: strip.columns, rows: strip.rows };
      }
    }
  }

  if (nextPage.columns === strip.columns && nextPage.rows === strip.rows && !needsExpand) {
    delete layoutByPage[String(page)];
  } else {
    layoutByPage[String(page)] = nextPage;
  }

  const stripExpand = needsExpand
    ? {
        columns: Math.max(strip.columns, nextPage.columns),
        rows: Math.max(strip.rows, nextPage.rows),
      }
    : null;

  return {
    dataPatch: {
      layoutByPage: normalizeLayoutByPage(layoutByPage, {
        ...strip,
        ...(stripExpand || {}),
      }),
    },
    stripExpand,
  };
}

export const resolveNavigation = (rawNavigation = {}) => ({
  ...DEFAULT_CHANNEL_NAVIGATION,
  ...rawNavigation,
});

/**
 * Grid config for strip / reorder / ops — reads store layout (unlocked).
 * Strip fields (`columns`/`rows`/…) are space-level. `pageColumns`/`pageRows` are the
 * effective geometry for `navigation.currentPage` (layoutByPage → space fallback).
 */
export const resolveGridConfig = (channelData, navigation) => {
  const layout = resolveLayout(channelData);
  const pageIndex = navigation?.currentPage ?? 0;
  const pageLayout = resolveLayoutForPage(channelData, pageIndex);
  return {
    columns: layout.columns,
    rows: layout.rows,
    totalChannels: layout.totalChannels,
    channelsPerPage: layout.channelsPerPage,
    totalPages: layout.totalPages,
    peekPercent: layout.peekPercent,
    pageColumns: pageLayout.columns,
    pageRows: pageLayout.rows,
    pageChannelsPerPage: pageLayout.channelsPerPage,
    pageHasLayoutOverride: pageLayout.hasPageOverride,
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
    coerceChannelPageFlipMs(currentNavigation.animationDuration) !==
      navigationPatch.animationDuration;

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

/** Canonical id helper — defined in channelReorder.js */
export function channelIdAtIndex(index) {
  return channelIdAtIndexFromReorder(index);
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
 * Global geometry changes clear `layoutByPage` (board was fully remapped).
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
  const geometryChanged =
    nextLayout.columns !== prev.columns ||
    nextLayout.rows !== prev.rows ||
    nextLayout.totalPages !== prev.totalPages;
  return {
    layout: nextLayout,
    gridColumns: nextLayout.columns,
    gridRows: nextLayout.rows,
    totalChannels: nextTotal,
    ...(geometryChanged ? { layoutByPage: {} } : {}),
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
