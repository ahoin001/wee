/**
 * Span / occupancy helpers for the continuous home channel strip.
 * Spans never cross page boundaries; footprints are clamped to the page grid.
 */

import { SLOT_KIND_CHANNEL } from './homeGridSlots';

/**
 * @param {number} value
 * @param {number} fallback
 */
function safePositiveInt(value, fallback = 1) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.floor(n);
}

/**
 * @param {number} anchorIndex
 * @param {number} colSpan
 * @param {number} rowSpan
 * @param {number} columns
 * @param {number} rows
 * @returns {{ colSpan: number, rowSpan: number }}
 */
export function clampSpanToPage(anchorIndex, colSpan, rowSpan, columns, rows) {
  const cols = Math.max(1, columns | 0);
  const rws = Math.max(1, rows | 0);
  const channelsPerPage = cols * rws;
  const idxInPage = Math.max(0, anchorIndex | 0) % channelsPerPage;
  const row = Math.floor(idxInPage / cols);
  const colInPage = idxInPage % cols;
  return {
    colSpan: Math.max(1, Math.min(safePositiveInt(colSpan, 1), cols - colInPage)),
    rowSpan: Math.max(1, Math.min(safePositiveInt(rowSpan, 1), rws - row)),
  };
}

/**
 * Absolute slot indices covered by a spanned tile (page-clamped).
 * @param {number} anchorIndex
 * @param {number} colSpan
 * @param {number} rowSpan
 * @param {number} columns
 * @param {number} rows
 * @param {number} totalSlots
 * @returns {number[]}
 */
export function getFootprintIndices(anchorIndex, colSpan, rowSpan, columns, rows, totalSlots) {
  const cols = Math.max(1, columns | 0);
  const rws = Math.max(1, rows | 0);
  const total = Math.max(0, totalSlots | 0);
  const anchor = Math.max(0, anchorIndex | 0);
  if (anchor >= total) return [];

  const { colSpan: cs, rowSpan: rs } = clampSpanToPage(anchor, colSpan, rowSpan, cols, rws);
  const channelsPerPage = cols * rws;
  const page = Math.floor(anchor / channelsPerPage);
  const idxInPage = anchor % channelsPerPage;
  const baseRow = Math.floor(idxInPage / cols);
  const baseCol = idxInPage % cols;
  const indices = [];

  for (let r = 0; r < rs; r += 1) {
    for (let c = 0; c < cs; c += 1) {
      const pageIdx = (baseRow + r) * cols + (baseCol + c);
      const abs = page * channelsPerPage + pageIdx;
      if (abs < total) indices.push(abs);
    }
  }
  return indices;
}

/**
 * CSS grid line placement for continuous strip cells.
 * @param {number} index
 * @param {number} colSpan
 * @param {number} rowSpan
 * @param {number} columns
 * @param {number} rows
 * @param {number} totalPages
 */
export function getStripGridPlacement(index, colSpan, rowSpan, columns, rows, totalPages = 1) {
  const cols = Math.max(1, columns | 0);
  const rws = Math.max(1, rows | 0);
  void totalPages;
  const channelsPerPage = cols * rws;
  const page = Math.floor(Math.max(0, index | 0) / channelsPerPage);
  const idxInPage = Math.max(0, index | 0) % channelsPerPage;
  const row = Math.floor(idxInPage / cols);
  const col = (idxInPage % cols) + page * cols;
  const { colSpan: cs, rowSpan: rs } = clampSpanToPage(index, colSpan, rowSpan, cols, rws);

  return {
    gridColumn: cs > 1 ? `${col + 1} / span ${cs}` : col + 1,
    gridRow: rs > 1 ? `${row + 1} / span ${rs}` : row + 1,
    colSpan: cs,
    rowSpan: rs,
    page,
    row,
    col,
  };
}

/**
 * @param {import('./homeGridSlots').HomeGridSlot | null | undefined} slot
 * @returns {{ colSpan: number, rowSpan: number }}
 */
export function getSlotSpan(slot) {
  return {
    colSpan: safePositiveInt(slot?.colSpan, 1),
    rowSpan: safePositiveInt(slot?.rowSpan, 1),
  };
}

/**
 * @typedef {{ anchorIndex: number, role: 'anchor' | 'covered', colSpan: number, rowSpan: number }} HomeGridOccupancyCell
 */

/**
 * Build occupancy for the strip. Covered cells never start a second tile.
 *
 * @param {Array<import('./homeGridSlots').HomeGridSlot | null | undefined> | null | undefined} slots
 * @param {number} columns
 * @param {number} rows
 * @param {number} [totalSlots]
 * @returns {(HomeGridOccupancyCell | null)[]}
 */
export function buildOccupancyMap(slots, columns, rows, totalSlots) {
  const list = Array.isArray(slots) ? slots : [];
  const total = Math.max(0, totalSlots != null ? totalSlots | 0 : list.length);
  /** @type {(HomeGridOccupancyCell | null)[]} */
  const map = Array.from({ length: total }, () => null);

  for (let i = 0; i < total; i += 1) {
    if (map[i]) continue;
    const { colSpan, rowSpan } = getSlotSpan(list[i]);
    const placement = getStripGridPlacement(i, colSpan, rowSpan, columns, rows);
    const footprint = getFootprintIndices(i, colSpan, rowSpan, columns, rows, total);

    for (const idx of footprint) {
      if (map[idx]) continue;
      map[idx] = {
        anchorIndex: i,
        role: idx === i ? 'anchor' : 'covered',
        colSpan: placement.colSpan,
        rowSpan: placement.rowSpan,
      };
    }

    if (!map[i]) {
      map[i] = {
        anchorIndex: i,
        role: 'anchor',
        colSpan: placement.colSpan,
        rowSpan: placement.rowSpan,
      };
    }
  }

  return map;
}

/**
 * Default free-cell check: empty channel (no media/path), not a foreign widget.
 * @param {import('./homeGridSlots').HomeGridSlot | null | undefined} slot
 */
export function isSlotFreeForSpan(slot) {
  if (!slot) return true;
  if (slot.kind !== SLOT_KIND_CHANNEL) return false;
  const channel = slot.channel;
  return !channel || (!channel.media && !channel.path);
}

/**
 * Whether every cell in the footprint is free for place/resize.
 * Free = empty channel slot, or already owned by `selfIndex`.
 *
 * @param {object} args
 * @param {Array<import('./homeGridSlots').HomeGridSlot | null | undefined>} args.slots
 * @param {number} args.anchorIndex
 * @param {number} args.colSpan
 * @param {number} args.rowSpan
 * @param {number} args.columns
 * @param {number} args.rows
 * @param {number | null} [args.selfIndex]
 * @param {(slot: import('./homeGridSlots').HomeGridSlot | null | undefined) => boolean} [args.isFree]
 */
export function canPlaceSpan({
  slots,
  anchorIndex,
  colSpan,
  rowSpan,
  columns,
  rows,
  selfIndex = null,
  isFree = isSlotFreeForSpan,
}) {
  const list = Array.isArray(slots) ? slots : [];
  const total = list.length;
  const footprint = getFootprintIndices(anchorIndex, colSpan, rowSpan, columns, rows, total);
  if (footprint.length === 0) return false;

  const occupancy = buildOccupancyMap(list, columns, rows, total);

  for (const idx of footprint) {
    const occ = occupancy[idx];
    if (selfIndex != null && occ?.anchorIndex === selfIndex) continue;

    if (occ?.role === 'covered') return false;

    const slot = list[idx];
    if (slot?.hidden) return false;
    if (!isFree(slot)) return false;
  }

  return true;
}

/**
 * Apply discrete span to a slot copy (clamped to page).
 * @param {import('./homeGridSlots').HomeGridSlot} slot
 * @param {number} colSpan
 * @param {number} rowSpan
 * @param {number} anchorIndex
 * @param {number} columns
 * @param {number} rows
 */
export function applySlotSpan(slot, colSpan, rowSpan, anchorIndex, columns, rows) {
  const clamped = clampSpanToPage(anchorIndex, colSpan, rowSpan, columns, rows);
  return {
    ...slot,
    colSpan: clamped.colSpan,
    rowSpan: clamped.rowSpan,
  };
}
