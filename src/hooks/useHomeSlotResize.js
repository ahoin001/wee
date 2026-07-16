import { useCallback, useEffect, useRef, useState } from 'react';
import {
  canPlaceSpan,
  clampSpanToPage,
} from '../utils/homeGridOccupancy';

/**
 * Pointer-drag resize for home-grid slots (Edit Home corner grabber).
 * Transient candidate spans only — commits via `onCommit` on valid release.
 *
 * @param {object} args
 * @param {boolean} args.enabled
 * @param {number} args.anchorIndex
 * @param {number} args.colSpan
 * @param {number} args.rowSpan
 * @param {Array} args.slots
 * @param {number} args.columns
 * @param {number} args.rows
 * @param {number} [args.maxColSpan] — kind registry ceiling (e.g. Now Playing max 2)
 * @param {number} [args.maxRowSpan]
 * @param {(colSpan: number, rowSpan: number) => void} args.onCommit
 * @param {() => void} [args.onResizeStart]
 * @param {() => void} [args.onResizeEnd]
 */
export function useHomeSlotResize({
  enabled,
  anchorIndex,
  colSpan,
  rowSpan,
  slots,
  columns,
  rows,
  maxColSpan = Infinity,
  maxRowSpan = Infinity,
  onCommit,
  onResizeStart,
  onResizeEnd,
}) {
  const [draft, setDraft] = useState(null);
  const sessionRef = useRef(null);

  useEffect(() => {
    if (!enabled && sessionRef.current) {
      sessionRef.current = null;
      setDraft(null);
      onResizeEnd?.();
    }
  }, [enabled, onResizeEnd]);

  const resolveCandidate = useCallback(
    (nextCol, nextRow) => {
      const kindCapped = {
        colSpan: Math.min(Math.max(1, nextCol | 0), Number.isFinite(maxColSpan) ? maxColSpan : nextCol),
        rowSpan: Math.min(Math.max(1, nextRow | 0), Number.isFinite(maxRowSpan) ? maxRowSpan : nextRow),
      };
      const clamped = clampSpanToPage(
        anchorIndex,
        kindCapped.colSpan,
        kindCapped.rowSpan,
        columns,
        rows
      );
      const valid = canPlaceSpan({
        slots,
        anchorIndex,
        colSpan: clamped.colSpan,
        rowSpan: clamped.rowSpan,
        columns,
        rows,
        selfIndex: anchorIndex,
      });
      return { ...clamped, valid };
    },
    [anchorIndex, columns, rows, slots, maxColSpan, maxRowSpan]
  );

  const handlePointerDown = useCallback(
    (event) => {
      if (!enabled || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();

      const handleEl = event.currentTarget;
      const tileEl =
        handleEl.closest('[data-channel-slot]') ||
        handleEl.closest('.wii-strip-channel-cell') ||
        handleEl.parentElement;
      if (!tileEl) return;

      const tileRect = tileEl.getBoundingClientRect();
      const boardEl = tileEl.closest('.wii-strip-board');
      let gapX = 0;
      let gapY = 0;
      if (boardEl) {
        const styles = getComputedStyle(boardEl);
        const gap = styles.gap || styles.columnGap || '0';
        // gap may be "12px" or "12px 12px"
        const parts = String(gap).split(/\s+/);
        gapX = Number.parseFloat(parts[0]) || 0;
        gapY = Number.parseFloat(parts[1] ?? parts[0]) || 0;
      }

      const startCol = Math.max(1, colSpan | 0);
      const startRow = Math.max(1, rowSpan | 0);
      const cellPitchX = (tileRect.width + gapX) / startCol;
      const cellPitchY = (tileRect.height + gapY) / startRow;

      sessionRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startCol,
        startRow,
        cellPitchX,
        cellPitchY,
        gapX,
        gapY,
        tileLeft: tileRect.left,
        tileTop: tileRect.top,
      };

      try {
        handleEl.setPointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }

      const initial = resolveCandidate(startCol, startRow);
      setDraft({
        colSpan: initial.colSpan,
        rowSpan: initial.rowSpan,
        valid: initial.valid,
        width: tileRect.width,
        height: tileRect.height,
        left: tileRect.left,
        top: tileRect.top,
      });
      onResizeStart?.();
    },
    [enabled, colSpan, rowSpan, resolveCandidate, onResizeStart]
  );

  const handlePointerMove = useCallback(
    (event) => {
      const session = sessionRef.current;
      if (!session || event.pointerId !== session.pointerId) return;
      event.preventDefault();
      event.stopPropagation();

      const deltaCols = Math.round(
        (event.clientX - session.startClientX) / session.cellPitchX
      );
      const deltaRows = Math.round(
        (event.clientY - session.startClientY) / session.cellPitchY
      );
      const candidate = resolveCandidate(
        session.startCol + deltaCols,
        session.startRow + deltaRows
      );

      const width =
        candidate.colSpan * session.cellPitchX - session.gapX;
      const height =
        candidate.rowSpan * session.cellPitchY - session.gapY;

      setDraft({
        colSpan: candidate.colSpan,
        rowSpan: candidate.rowSpan,
        valid: candidate.valid,
        width: Math.max(0, width),
        height: Math.max(0, height),
        left: session.tileLeft,
        top: session.tileTop,
      });
    },
    [resolveCandidate]
  );

  const endSession = useCallback(
    (event, { commit }) => {
      const session = sessionRef.current;
      if (!session || (event && event.pointerId !== session.pointerId)) return;

      const handleEl = event?.currentTarget;
      if (handleEl?.hasPointerCapture?.(session.pointerId)) {
        try {
          handleEl.releasePointerCapture(session.pointerId);
        } catch {
          /* ignore */
        }
      }

      const deltaCols = event
        ? Math.round((event.clientX - session.startClientX) / session.cellPitchX)
        : 0;
      const deltaRows = event
        ? Math.round((event.clientY - session.startClientY) / session.cellPitchY)
        : 0;
      const candidate = resolveCandidate(
        session.startCol + deltaCols,
        session.startRow + deltaRows
      );

      sessionRef.current = null;
      setDraft(null);
      onResizeEnd?.();

      if (
        commit &&
        candidate.valid &&
        (candidate.colSpan !== session.startCol || candidate.rowSpan !== session.startRow)
      ) {
        onCommit?.(candidate.colSpan, candidate.rowSpan);
      }
    },
    [resolveCandidate, onCommit, onResizeEnd]
  );

  const handlePointerUp = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      endSession(event, { commit: true });
    },
    [endSession]
  );

  const handlePointerCancel = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      endSession(event, { commit: false });
    },
    [endSession]
  );

  return {
    isResizing: draft != null,
    draft,
    handleProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    },
  };
}

export default useHomeSlotResize;
