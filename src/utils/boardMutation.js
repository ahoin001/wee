/**
 * Pure board mutation engine for Home / Focus channel grids.
 *
 * Contract:
 * - `slots[]` is the mutation SSOT; legacy maps are projections.
 * - Punched holes (`hidden: true`) are fixed geometry during reorder.
 * - Channels, empties, and widgets are first-class movable occupants (anchors).
 * - Spans move as footprints; covered cells are never drop targets.
 */

import {
  CHANNEL_LAYOUT_LIMITS,
  getTotalChannels,
  normalizeLayoutByPage,
  normalizeLayoutConfig,
  clampPageIndex,
  CHANNEL_PAGE_FLIP_MS,
  resolveLayout,
  buildPageLayoutOverridePatch,
} from './channelLayoutSystem';
import {
  createEmptyChannelSlot,
  normalizeHomeGridSlot,
  projectSlotsToLegacyMaps,
  isChannelSlotEmpty,
} from './homeGridSlots';
import {
  buildOccupancyMap,
  canPlaceSpan,
  getSlotSpan,
  getFootprintIndices,
  isSlotFreeForSpan,
} from './homeGridOccupancy';

/**
 * @param {import('./homeGridSlots').HomeGridSlot | null | undefined} slot
 */
function cloneSlot(slot) {
  return normalizeHomeGridSlot(
    slot ? JSON.parse(JSON.stringify(slot)) : createEmptyChannelSlot()
  );
}

/**
 * @param {Array<import('./homeGridSlots').HomeGridSlot | null | undefined>} slots
 */
export function cloneSlots(slots) {
  const list = Array.isArray(slots) ? slots : [];
  return list.map((s) => cloneSlot(s));
}

/**
 * @param {import('./homeGridSlots').HomeGridSlot | null | undefined} slot
 */
export function isPunchedHole(slot) {
  return Boolean(slot?.hidden);
}

/**
 * @param {object} layout
 * @returns {{ columns: number, rows: number, totalPages: number, peekPercent?: number }}
 */
function resolveBoardLayout(layout) {
  return normalizeLayoutConfig(layout || {});
}

/**
 * Movable = non-hidden anchor (not a covered footprint cell).
 * @param {Array<import('./homeGridSlots').HomeGridSlot>} slots
 * @param {number} columns
 * @param {number} rows
 * @returns {number[]}
 */
export function getMovableAnchorIndices(slots, columns, rows) {
  const list = Array.isArray(slots) ? slots : [];
  const n = list.length;
  const occupancy = buildOccupancyMap(list, columns, rows, n);
  const out = [];
  for (let i = 0; i < n; i += 1) {
    if (isPunchedHole(list[i])) continue;
    if (occupancy[i]?.role === 'covered') continue;
    out.push(i);
  }
  return out;
}

/**
 * Clear covered footprint cells to empty channels (holes stay holes).
 * @param {Array<import('./homeGridSlots').HomeGridSlot>} slots
 * @param {number} columns
 * @param {number} rows
 */
function sanitizeCoveredCells(slots, columns, rows) {
  const list = slots.map((s) => cloneSlot(s));
  const n = list.length;
  const occupancy = buildOccupancyMap(list, columns, rows, n);
  for (let i = 0; i < n; i += 1) {
    if (occupancy[i]?.role !== 'covered') continue;
    if (isPunchedHole(list[i])) continue;
    list[i] = createEmptyChannelSlot();
  }
  return list;
}

/**
 * @param {object} args
 * @param {Array<import('./homeGridSlots').HomeGridSlot>} args.slots
 * @param {{ columns: number, rows: number, totalPages?: number }} args.layout
 * @param {number} args.hoverIndex
 * @param {number} args.movingIndex
 * @returns {number | null} legal absolute index, or null if none
 */
export function normalizeDropTarget({ slots, layout, hoverIndex, movingIndex }) {
  const { columns, rows } = resolveBoardLayout(layout);
  const list = Array.isArray(slots) ? slots : [];
  const n = list.length;
  if (n <= 0) return null;

  const from = movingIndex | 0;
  let to = hoverIndex | 0;
  if (from < 0 || from >= n) return null;
  if (to < 0 || to >= n) return null;
  if (isPunchedHole(list[from])) return null;

  const occupancy = buildOccupancyMap(list, columns, rows, n);
  if (occupancy[from]?.role === 'covered') return null;

  const movable = getMovableAnchorIndices(list, columns, rows);
  if (!movable.includes(from)) return null;

  // Snap hole / covered hover to nearest movable index (prefer same direction).
  if (isPunchedHole(list[to]) || occupancy[to]?.role === 'covered') {
    let best = null;
    let bestDist = Infinity;
    for (const idx of movable) {
      if (idx === from) continue;
      const dist = Math.abs(idx - to);
      if (dist < bestDist) {
        bestDist = dist;
        best = idx;
      }
    }
    if (best == null) return from;
    to = best;
  }

  const moving = list[from];
  const { colSpan, rowSpan } = getSlotSpan(moving);

  // Probe with mover removed so its old footprint does not block itself.
  const probe = list.map((s, i) => (i === from ? createEmptyChannelSlot() : cloneSlot(s)));
  if (
    canPlaceSpan({
      slots: probe,
      anchorIndex: to,
      colSpan,
      rowSpan,
      columns,
      rows,
      selfIndex: to,
      isFree: (slot) => {
        if (isPunchedHole(slot)) return false;
        return isSlotFreeForSpan(slot) || slot === probe[to];
      },
    })
  ) {
    return to;
  }

  // Scan outward for a legal landing.
  for (let delta = 1; delta < n; delta += 1) {
    for (const candidate of [to + delta, to - delta]) {
      if (candidate < 0 || candidate >= n) continue;
      if (!movable.includes(candidate) && candidate !== from) continue;
      if (isPunchedHole(list[candidate])) continue;
      if (
        canPlaceSpan({
          slots: probe,
          anchorIndex: candidate,
          colSpan,
          rowSpan,
          columns,
          rows,
          selfIndex: candidate,
        })
      ) {
        return candidate;
      }
    }
  }

  return from;
}

/**
 * Fixed-hole iPhone insert reorder on movable anchors.
 * @param {object} args
 * @param {Array<import('./homeGridSlots').HomeGridSlot>} args.slots
 * @param {{ columns: number, rows: number, totalPages?: number }} args.layout
 * @param {number} args.fromIndex
 * @param {number} args.toIndex
 * @returns {{ slots: import('./homeGridSlots').HomeGridSlot[], ok: boolean, toIndex: number }}
 */
export function reorderSlots({ slots, layout, fromIndex, toIndex }) {
  const { columns, rows } = resolveBoardLayout(layout);
  const list = cloneSlots(slots);
  const n = list.length;
  const from = fromIndex | 0;
  let to = toIndex | 0;

  if (n <= 0 || from === to) {
    return { slots: list, ok: true, toIndex: from };
  }
  if (from < 0 || to < 0 || from >= n || to >= n) {
    return { slots: list, ok: false, toIndex: from };
  }

  const legalTo = normalizeDropTarget({
    slots: list,
    layout: { columns, rows },
    hoverIndex: to,
    movingIndex: from,
  });
  if (legalTo == null) {
    return { slots: list, ok: false, toIndex: from };
  }
  to = legalTo;
  if (from === to) {
    return { slots: list, ok: true, toIndex: to };
  }

  const movable = getMovableAnchorIndices(list, columns, rows);
  const laneFrom = movable.indexOf(from);
  const laneTo = movable.indexOf(to);
  if (laneFrom < 0 || laneTo < 0) {
    return { slots: list, ok: false, toIndex: from };
  }

  const holeMask = list.map((s) => isPunchedHole(s));
  const lane = movable.map((i) => cloneSlot(list[i]));
  const [moved] = lane.splice(laneFrom, 1);
  lane.splice(laneTo, 0, moved);

  const result = Array.from({ length: n }, () => createEmptyChannelSlot());
  for (let i = 0; i < n; i += 1) {
    if (holeMask[i]) {
      result[i] = { ...createEmptyChannelSlot(), hidden: true };
    }
  }

  for (let k = 0; k < movable.length; k += 1) {
    const abs = movable[k];
    result[abs] = cloneSlot(lane[k]);
    result[abs].hidden = false;
  }

  const sanitized = sanitizeCoveredCells(result, columns, rows);
  return { slots: sanitized, ok: true, toIndex: to };
}

/**
 * Punch / unpunch a slot. Rejects punching a covered cell (punch the anchor instead).
 * @param {object} args
 * @param {Array<import('./homeGridSlots').HomeGridSlot>} args.slots
 * @param {number} args.index
 * @param {boolean} args.hidden
 * @param {{ columns: number, rows: number }} args.layout
 */
export function setSlotHidden({ slots, index, hidden, layout }) {
  const { columns, rows } = resolveBoardLayout(layout);
  const list = cloneSlots(slots);
  const i = index | 0;
  if (i < 0 || i >= list.length) {
    return { slots: list, ok: false };
  }

  const occupancy = buildOccupancyMap(list, columns, rows, list.length);
  if (occupancy[i]?.role === 'covered') {
    return { slots: list, ok: false };
  }

  if (hidden) {
    // Punching clears content — hole shows wallpaper.
    list[i] = { ...createEmptyChannelSlot(), hidden: true };
  } else {
    list[i] = { ...cloneSlot(list[i]), hidden: false };
  }

  return { slots: sanitizeCoveredCells(list, columns, rows), ok: true };
}

/**
 * Content-preserving layout change. Holes keep page-relative positions when possible.
 * @param {object} args
 * @param {Array<import('./homeGridSlots').HomeGridSlot>} args.slots
 * @param {object} args.fromLayout
 * @param {object} args.toLayout — partial or full
 */
export function relayoutBoard({ slots, fromLayout, toLayout }) {
  const from = resolveBoardLayout(fromLayout);
  const to = normalizeLayoutConfig({ ...from, ...toLayout });
  const list = cloneSlots(slots);
  const fromN = getTotalChannels(from.columns, from.rows, from.totalPages);

  // Ensure length matches from geometry.
  while (list.length < fromN) list.push(createEmptyChannelSlot());
  const trimmed = list.slice(0, fromN);

  const fromOccupancy = buildOccupancyMap(trimmed, from.columns, from.rows, fromN);
  const anchors = [];
  for (let i = 0; i < fromN; i += 1) {
    if (isPunchedHole(trimmed[i])) continue;
    if (fromOccupancy[i]?.role === 'covered') continue;
    const slot = trimmed[i];
    // Skip empty channel padding — only pack content, widgets, and non-empty cells.
    const isWidget = Boolean(slot?.kind && slot.kind !== 'channel');
    if (!isWidget && isChannelSlotEmpty(slot)) continue;
    anchors.push(cloneSlot(slot));
  }

  // Map holes to page-relative indices, then onto the new grid.
  const fromPerPage = from.columns * from.rows;
  const toPerPage = to.columns * to.rows;
  const toCapacity = toPerPage * to.totalPages;
  const holeMask = Array.from({ length: toCapacity }, () => false);

  for (let i = 0; i < fromN; i += 1) {
    if (!isPunchedHole(trimmed[i])) continue;
    const page = Math.floor(i / fromPerPage);
    const idxInPage = i % fromPerPage;
    const oldRow = Math.floor(idxInPage / from.columns);
    const oldCol = idxInPage % from.columns;
    if (oldRow >= to.rows || oldCol >= to.columns) {
      // Hole falls outside new page grid — place at end of that page if possible.
      const clampedRow = Math.min(oldRow, to.rows - 1);
      const clampedCol = Math.min(oldCol, to.columns - 1);
      const destPage = Math.min(page, to.totalPages - 1);
      const dest = destPage * toPerPage + clampedRow * to.columns + clampedCol;
      if (dest >= 0 && dest < toCapacity) holeMask[dest] = true;
      continue;
    }
    const destPage = Math.min(page, Math.max(0, to.totalPages - 1));
    const dest = destPage * toPerPage + oldRow * to.columns + oldCol;
    if (dest >= 0 && dest < toCapacity) holeMask[dest] = true;
  }

  const packed = packAnchorsSimple(anchors, holeMask, to);
  return packed;
}

/**
 * Simpler packer used by relayoutBoard (avoids the messy fallback above).
 */
function packAnchorsSimple(anchors, holeMask, layout) {
  const { columns, rows } = layout;
  let totalPages = layout.totalPages;
  const maxPages = CHANNEL_LAYOUT_LIMITS.totalPages.max;

  const tryPack = (pageCount) => {
    const cap = columns * rows * pageCount;
    const holes = holeMask.slice(0, cap);
    while (holes.length < cap) holes.push(false);
    const board = Array.from({ length: cap }, () => createEmptyChannelSlot());
    for (let i = 0; i < cap; i += 1) {
      if (holes[i]) board[i] = { ...createEmptyChannelSlot(), hidden: true };
    }
    let cursor = 0;
    const placedAnchors = [];
    for (const anchor of anchors) {
      const { colSpan, rowSpan } = getSlotSpan(anchor);
      let placed = false;
      for (let i = cursor; i < cap; i += 1) {
        if (holes[i] || board[i].hidden) continue;
        if (
          canPlaceSpan({
            slots: board,
            anchorIndex: i,
            colSpan,
            rowSpan,
            columns,
            rows,
          })
        ) {
          board[i] = { ...cloneSlot(anchor), hidden: false };
          placedAnchors.push(anchor);
          cursor = i + 1;
          placed = true;
          break;
        }
      }
      if (!placed) return null;
    }
    return {
      slots: sanitizeCoveredCells(board, columns, rows),
      layout: normalizeLayoutConfig({ ...layout, columns, rows, totalPages: pageCount }),
      overflow: false,
      placedCount: placedAnchors.length,
    };
  };

  let result = tryPack(totalPages);
  while (!result && totalPages < maxPages) {
    totalPages += 1;
    result = tryPack(totalPages);
  }

  if (!result) {
    // Fit as many as possible at max pages.
    const cap = columns * rows * maxPages;
    const holes = holeMask.slice(0, cap);
    while (holes.length < cap) holes.push(false);
    const board = Array.from({ length: cap }, () => createEmptyChannelSlot());
    for (let i = 0; i < cap; i += 1) {
      if (holes[i]) board[i] = { ...createEmptyChannelSlot(), hidden: true };
    }
    let cursor = 0;
    let placedCount = 0;
    for (const anchor of anchors) {
      const { colSpan, rowSpan } = getSlotSpan(anchor);
      let placed = false;
      for (let i = cursor; i < cap; i += 1) {
        if (holes[i] || board[i].hidden) continue;
        if (
          canPlaceSpan({
            slots: board,
            anchorIndex: i,
            colSpan,
            rowSpan,
            columns,
            rows,
          })
        ) {
          board[i] = { ...cloneSlot(anchor), hidden: false };
          cursor = i + 1;
          placed = true;
          placedCount += 1;
          break;
        }
      }
      if (!placed) break;
    }
    return {
      slots: sanitizeCoveredCells(board, columns, rows),
      layout: normalizeLayoutConfig({ ...layout, columns, rows, totalPages: maxPages }),
      overflow: placedCount < anchors.length,
      placedCount,
    };
  }

  return result;
}

/**
 * Dev / test invariant gate.
 * @param {Array<import('./homeGridSlots').HomeGridSlot>} slots
 * @param {{ columns: number, rows: number, totalPages: number }} layout
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function assertBoardInvariants(slots, layout) {
  const errors = [];
  const { columns, rows, totalPages } = resolveBoardLayout(layout);
  const expected = getTotalChannels(columns, rows, totalPages);
  const list = Array.isArray(slots) ? slots : [];

  if (list.length !== expected) {
    errors.push(`length ${list.length} !== expected ${expected}`);
  }

  const occupancy = buildOccupancyMap(list, columns, rows, list.length);
  const seenAnchors = new Set();

  for (let i = 0; i < list.length; i += 1) {
    const slot = list[i];
    const occ = occupancy[i];
    if (!occ) {
      errors.push(`missing occupancy at ${i}`);
      continue;
    }
    if (occ.role === 'anchor') {
      if (seenAnchors.has(i)) errors.push(`duplicate anchor ${i}`);
      seenAnchors.add(i);
    }
    if (occ.role === 'covered') {
      if (slot && !isPunchedHole(slot) && !isChannelSlotEmpty(slot)) {
        errors.push(`covered cell ${i} has content`);
      }
      if (slot && slot.kind && slot.kind !== 'channel' && !isPunchedHole(slot)) {
        errors.push(`covered cell ${i} is a widget`);
      }
    }
    if (isPunchedHole(slot) && occ.role === 'covered') {
      // hole under span is invalid
      errors.push(`hole at covered index ${i}`);
    }
  }

  // Overlapping footprints: buildOccupancyMap first-wins; detect second claim attempts.
  for (let i = 0; i < list.length; i += 1) {
    if (occupancy[i]?.role !== 'anchor') continue;
    if (isPunchedHole(list[i])) continue;
    const { colSpan, rowSpan } = getSlotSpan(list[i]);
    const fp = getFootprintIndices(i, colSpan, rowSpan, columns, rows, list.length);
    for (const idx of fp) {
      if (idx === i) continue;
      if (occupancy[idx]?.anchorIndex !== i && occupancy[idx]?.role === 'anchor') {
        const other = list[idx];
        if (other && !isPunchedHole(other) && (!isChannelSlotEmpty(other) || (other.kind && other.kind !== 'channel'))) {
          errors.push(`footprint collision at ${idx} from anchor ${i}`);
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Apply mutated slots onto space data and reproject legacy maps.
 * @param {Record<string, unknown>} spaceData
 * @param {import('./homeGridSlots').HomeGridSlot[]} nextSlots
 * @param {object} [layoutOverride]
 */
export function applySlotsToSpaceData(spaceData, nextSlots, layoutOverride) {
  const input = spaceData && typeof spaceData === 'object' ? spaceData : {};
  const layout = normalizeLayoutConfig(layoutOverride || input.layout || {
    columns: input.gridColumns,
    rows: input.gridRows,
    totalPages: input.navigation?.totalPages ?? input.layout?.totalPages,
    peekPercent: input.layout?.peekPercent,
  });
  const totalChannels = getTotalChannels(layout.columns, layout.rows, layout.totalPages);
  let slots = cloneSlots(nextSlots);
  if (slots.length < totalChannels) {
    while (slots.length < totalChannels) slots.push(createEmptyChannelSlot());
  } else if (slots.length > totalChannels) {
    slots = slots.slice(0, totalChannels);
  }
  slots = sanitizeCoveredCells(slots, layout.columns, layout.rows);
  const legacy = projectSlotsToLegacyMaps(slots);
  const nav = input.navigation && typeof input.navigation === 'object' ? input.navigation : {};
  return {
    ...input,
    layout,
    layoutByPage: normalizeLayoutByPage(input.layoutByPage, layout),
    gridColumns: layout.columns,
    gridRows: layout.rows,
    totalChannels,
    slots,
    ...legacy,
    navigation: {
      ...nav,
      totalPages: layout.totalPages,
      currentPage: clampPageIndex(nav.currentPage || 0, layout.totalPages),
      animationDuration: nav.animationDuration ?? CHANNEL_PAGE_FLIP_MS,
    },
  };
}

/**
 * Relayout space data via relayoutBoard + project.
 * Global geometry changes clear `layoutByPage` unless `preserveLayoutByPage` is set
 * (used when expanding the strip for a page-only override that outgrows space layout).
 */
export function applyRelayoutToSpaceData(spaceData, layoutPartial, options = {}) {
  const input = spaceData && typeof spaceData === 'object' ? spaceData : {};
  const fromLayout = normalizeLayoutConfig(input.layout || {
    columns: input.gridColumns,
    rows: input.gridRows,
    totalPages: input.navigation?.totalPages,
    peekPercent: input.layout?.peekPercent,
  });
  let slots = Array.isArray(input.slots) ? input.slots : [];
  if (slots.length === 0 && input.totalChannels) {
    // Inbound: prefer migrate path caller; here synthesize empties.
    slots = Array.from({ length: input.totalChannels }, () => createEmptyChannelSlot());
  }
  const partial = layoutPartial || {};
  const { slots: nextSlots, layout, overflow } = relayoutBoard({
    slots,
    fromLayout,
    toLayout: partial,
  });
  const geometryChanged =
    layout.columns !== fromLayout.columns ||
    layout.rows !== fromLayout.rows ||
    layout.totalPages !== fromLayout.totalPages;
  const baseInput =
    geometryChanged && !options.preserveLayoutByPage
      ? { ...input, layoutByPage: {} }
      : input;
  const next = applySlotsToSpaceData(baseInput, nextSlots, layout);
  return { ...next, _relayoutOverflow: Boolean(overflow) };
}

/**
 * Write layoutByPage[page] columns/rows. Expands strip via relayoutBoard when needed.
 * Peek / totalPages always stay space-level.
 */
export function applyPageLayoutOverrideToSpaceData(spaceData, pageIndex, partial) {
  const input = spaceData && typeof spaceData === 'object' ? spaceData : {};
  const { dataPatch, stripExpand } = buildPageLayoutOverridePatch(input, pageIndex, partial || {});
  let next = {
    ...input,
    layoutByPage: dataPatch.layoutByPage,
  };
  if (stripExpand) {
    const { _relayoutOverflow, ...relayouted } = applyRelayoutToSpaceData(
      next,
      stripExpand,
      { preserveLayoutByPage: true }
    );
    void _relayoutOverflow;
    next = {
      ...relayouted,
      layoutByPage: normalizeLayoutByPage(dataPatch.layoutByPage, resolveLayout(relayouted)),
    };
  } else {
    next = {
      ...next,
      layoutByPage: normalizeLayoutByPage(dataPatch.layoutByPage, resolveLayout(next)),
    };
  }
  return next;
}
