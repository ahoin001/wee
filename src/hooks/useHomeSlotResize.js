import { useCallback, useEffect, useRef, useState } from 'react';
import {
  canPlaceSpan,
  clampSpanToPage,
} from '../utils/homeGridOccupancy';

/**
 * Pointer-drag resize for home-grid slots (Edit Home corner grabbers).
 * Transient candidate spans only — commits via `onCommit` on valid release.
 * Corner handles may invert drag axes so grabbing any corner grows the span
 * from the tile’s top-left grid anchor.
 *
 * @param {object} args
 * @param {boolean} args.enabled
 * @param {number} args.anchorIndex
 * @param {number} args.colSpan
 * @param {number} args.rowSpan
 * @param {Array} args.slots
 * @param {number} args.columns
 * @param {number} args.rows
 * @param {number} [args.maxColSpan]
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

  const updateDraftFromEvent = useCallback(
    (event, session) => {
      const rawDx = event.clientX - session.startClientX;
      const rawDy = event.clientY - session.startClientY;
      const signedDx = session.invertX ? -rawDx : rawDx;
      const signedDy = session.invertY ? -rawDy : rawDy;
      const deltaCols = Math.round(signedDx / session.cellPitchX);
      const deltaRows = Math.round(signedDy / session.cellPitchY);
      const candidate = resolveCandidate(
        session.startCol + deltaCols,
        session.startRow + deltaRows
      );

      const width = candidate.colSpan * session.cellPitchX - session.gapX;
      const height = candidate.rowSpan * session.cellPitchY - session.gapY;

      setDraft({
        colSpan: candidate.colSpan,
        rowSpan: candidate.rowSpan,
        valid: candidate.valid,
        width: Math.max(0, width),
        height: Math.max(0, height),
        left: session.tileLeft,
        top: session.tileTop,
      });

      return candidate;
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

      let candidate = {
        colSpan: session.startCol,
        rowSpan: session.startRow,
        valid: true,
      };
      if (event) {
        candidate = updateDraftFromEvent(event, session);
      }

      sessionRef.current = null;
      setDraft(null);
      onResizeEnd?.();

      window.removeEventListener('pointermove', session.onWindowMove);
      window.removeEventListener('pointerup', session.onWindowUp);
      window.removeEventListener('pointercancel', session.onWindowCancel);

      if (
        commit &&
        candidate.valid &&
        (candidate.colSpan !== session.startCol || candidate.rowSpan !== session.startRow)
      ) {
        onCommit?.(candidate.colSpan, candidate.rowSpan);
      }
    },
    [updateDraftFromEvent, onCommit, onResizeEnd]
  );

  const beginResize = useCallback(
    (event, { invertX = false, invertY = false } = {}) => {
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
        const parts = String(gap).split(/\s+/);
        gapX = Number.parseFloat(parts[0]) || 0;
        gapY = Number.parseFloat(parts[1] ?? parts[0]) || 0;
      }

      const startCol = Math.max(1, colSpan | 0);
      const startRow = Math.max(1, rowSpan | 0);
      const cellPitchX = (tileRect.width + gapX) / startCol;
      const cellPitchY = (tileRect.height + gapY) / startRow;

      const onWindowMove = (moveEvent) => {
        const session = sessionRef.current;
        if (!session || moveEvent.pointerId !== session.pointerId) return;
        moveEvent.preventDefault();
        updateDraftFromEvent(moveEvent, session);
      };
      const onWindowUp = (upEvent) => {
        endSession(upEvent, { commit: true });
      };
      const onWindowCancel = (cancelEvent) => {
        endSession(cancelEvent, { commit: false });
      };

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
        invertX: Boolean(invertX),
        invertY: Boolean(invertY),
        onWindowMove,
        onWindowUp,
        onWindowCancel,
      };

      try {
        handleEl.setPointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }

      window.addEventListener('pointermove', onWindowMove);
      window.addEventListener('pointerup', onWindowUp);
      window.addEventListener('pointercancel', onWindowCancel);

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
    [
      enabled,
      colSpan,
      rowSpan,
      resolveCandidate,
      updateDraftFromEvent,
      endSession,
      onResizeStart,
    ]
  );

  useEffect(() => {
    return () => {
      const session = sessionRef.current;
      if (!session) return;
      window.removeEventListener('pointermove', session.onWindowMove);
      window.removeEventListener('pointerup', session.onWindowUp);
      window.removeEventListener('pointercancel', session.onWindowCancel);
    };
  }, []);

  return {
    isResizing: draft != null,
    draft,
    beginResize,
  };
}

export default useHomeSlotResize;
