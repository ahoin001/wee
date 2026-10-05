import React, { useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, LayoutGroup, m } from 'framer-motion';
import { Plus } from 'lucide-react';
import {
  useWeeMotion,
  createWeeChannelTileItemVariants,
  createWeeTransition,
} from '../../design/weeMotion';
import { SPACE_SHELL_ENTRANCE_TIERS } from '../../design/spaceShellMotion';
import { createWiiBoardTrackStyle, isSlotHidden } from '../../utils/channelLayoutSystem';
import {
  buildOccupancyMap,
  getSlotSpan,
  getStripGridPlacement,
} from '../../utils/homeGridOccupancy';
import { useStartupPhase } from '../../hooks/useStartupPhase';
import useChannelShelfPan from '../../hooks/useChannelShelfPan';
import { StripCellOnCurrentPageContext } from './stripCellVisibility';
import { pointFromElement } from '../../utils/boardSlotRect';

/**
 * Continuous channel shelf: one window onto a uniform-gap grid, with a cut neighbour
 * peeking either side. Pan is owned by `useChannelShelfPan` (`channelPageFlip`); the peek
 * band itself is CSS (`--wii-shelf-peek`), sized off `--wii-strip-peek` / `--wii-total-pages`.
 * Hidden slots (`slotMeta`) keep absolute cells as wallpaper holes.
 * Spanned slots (`slots[].colSpan` / `rowSpan`) occupy multiple cells; covered cells skip render.
 * Live Board Studio (`arrangeModeActive` + `punchModeActive`) intercepts tile taps to punch
 * or restore a wallpaper hole — punch applies to the **anchor** slot only.
 *
 * Infinite wrap (last→first / first→last): enter from one page-step off the target so the
 * pan never scrubs middle boards.
 */
const WiiChannelStrip = ({
  totalPages,
  currentPage = 0,
  animationDirection = 'none',
  animationWrapped = false,
  isAnimating,
  isGridFaded,
  columns,
  rows,
  slotMeta = {},
  slots = null,
  onGridMouseEnter,
  onGridMouseLeave,
  onGridPointerMove,
  onGridPointerDown,
  onGridWheel,
  renderChannelAtIndex,
  onPageFlipComplete,
  hubEntranceKey = 0,
  hubEntranceTier = SPACE_SHELL_ENTRANCE_TIERS.firstVisitPlayful,
  hubEntranceShellMs,
  focusRecedeEnabled = false,
  arrangeModeActive = false,
  punchModeActive = false,
  onTogglePunch,
  onArrangeSelectIndex,
  onPeekPageSelect,
}) => {
  const { pillOpen, pillClose, reducedMotion } = useWeeMotion();
  const tileItemVariants = useMemo(
    () => createWeeChannelTileItemVariants(pillOpen, reducedMotion, hubEntranceShellMs),
    [pillOpen, reducedMotion, hubEntranceShellMs]
  );
  const tileAnimate =
    hubEntranceTier === SPACE_SHELL_ENTRANCE_TIERS.revisitSubtleGooey ? 'revisit' : 'open';

  const pageFlipTransition = useMemo(
    () => createWeeTransition('channelPageFlip', { reducedMotion }),
    [reducedMotion]
  );

  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const safeColumns = Math.max(1, Number(columns) || 1);
  const safeRows = Math.max(1, Number(rows) || 1);
  const safeCurrentPage = Math.max(
    0,
    Math.min(Number(currentPage) || 0, safeTotalPages - 1)
  );
  const channelsPerPage = safeColumns * safeRows;
  const totalChannelSlots = channelsPerPage * safeTotalPages;
  const isWrap =
    Boolean(animationWrapped) &&
    safeTotalPages > 1 &&
    (animationDirection === 'left' || animationDirection === 'right');

  const { stripRef, stripX, visiblePages } = useChannelShelfPan({
    totalPages: safeTotalPages,
    currentPage: safeCurrentPage,
    isAnimating,
    animationDirection,
    animationWrapped,
    transition: pageFlipTransition,
    reducedMotion,
    onSettled: onPageFlipComplete,
  });

  const occupancy = useMemo(
    () => buildOccupancyMap(slots, safeColumns, safeRows, totalChannelSlots),
    [slots, safeColumns, safeRows, totalChannelSlots]
  );

  // Page window: current page always; the cut neighbours either side of it from startup idle1.
  // The page being flipped away from stays mounted until the pan settles (no blank slide-out).
  const neighborsReady = useStartupPhase('idle1');
  const previousPageRef = useRef(safeCurrentPage);
  const flipSourcePageRef = useRef(null);
  if (previousPageRef.current !== safeCurrentPage) {
    flipSourcePageRef.current = previousPageRef.current;
    previousPageRef.current = safeCurrentPage;
  }
  if (!isAnimating && !isWrap) flipSourcePageRef.current = null;
  const flipSourcePage = flipSourcePageRef.current;

  const mountedPages = useMemo(() => {
    const pages = new Set([safeCurrentPage]);
    if (neighborsReady) {
      for (const page of visiblePages) pages.add(page);
    }
    if (flipSourcePage != null && flipSourcePage < safeTotalPages) pages.add(flipSourcePage);
    return pages;
  }, [safeCurrentPage, safeTotalPages, neighborsReady, visiblePages, flipSourcePage]);

  /** Only the page shown when this entrance began staggers in; later pages mount already open. */
  const entranceRef = useRef({ key: hubEntranceKey, page: safeCurrentPage });
  if (entranceRef.current.key !== hubEntranceKey) {
    entranceRef.current = { key: hubEntranceKey, page: safeCurrentPage };
  }
  const entrancePage = entranceRef.current.page;

  // Columns are page×N tracks; rows are SHARED across every page in the continuous strip.
  // Tracks stay capped (`min(1fr, --wii-row-max)`) so 2–3 row × 3/4-col boards keep classic
  // tile scale — never `auto` max, so widget content cannot inflate sibling channels.
  const boardStyle = useMemo(
    () =>
      createWiiBoardTrackStyle({
        columns: safeColumns,
        rows: safeRows,
        totalPages: safeTotalPages,
      }),
    [safeColumns, safeRows, safeTotalPages]
  );

  const canPunch = arrangeModeActive && punchModeActive && typeof onTogglePunch === 'function';
  const canSelect =
    arrangeModeActive && !punchModeActive && typeof onArrangeSelectIndex === 'function';
  /** Arrange mode (even outside punch): punched holes stay visible so they can be restored. */
  const canRestoreHole = arrangeModeActive && typeof onTogglePunch === 'function';

  const handlePunchCapture = useCallback(
    (index) => (event) => {
      if (!canPunch && !canRestoreHole) return;
      event.preventDefault();
      event.stopPropagation();
      const occ = occupancy[index];
      const punchIndex = occ?.anchorIndex ?? index;
      onTogglePunch(punchIndex, pointFromElement(event.currentTarget));
    },
    [canPunch, canRestoreHole, onTogglePunch, occupancy]
  );

  const handleArrangeSelectCapture = useCallback(
    (index) => (event) => {
      if (!canSelect) return;
      event.preventDefault();
      event.stopPropagation();
      const occ = occupancy[index];
      const selectIndex = occ?.anchorIndex ?? index;
      onArrangeSelectIndex(selectIndex, 'click');
    },
    [canSelect, onArrangeSelectIndex, occupancy]
  );

  /** Tapping a cut neighbour travels to it — the peek is an affordance, not a dead zone. */
  const canSelectPeekPage = typeof onPeekPageSelect === 'function' && !isAnimating;
  const handlePeekPageSelect = useCallback(
    (pageIndex) => (event) => {
      event.preventDefault();
      event.stopPropagation();
      onPeekPageSelect(pageIndex);
    },
    [onPeekPageSelect]
  );

  const handleArrangeContextMenuCapture = useCallback(
    (index) => (event) => {
      if (!canSelect && !canPunch) return;
      if (canPunch) {
        // Punch owns the grid entirely — no board context menu while punching.
        event.preventDefault();
        event.stopPropagation();
        const occ = occupancy[index];
        const punchIndex = occ?.anchorIndex ?? index;
        onTogglePunch(punchIndex, pointFromElement(event.currentTarget));
        return;
      }
      // Arrange: select the tile but let the event bubble so the unified board
      // context menu opens with arrange-aware items (add / replace / punch / done).
      const occ = occupancy[index];
      const selectIndex = occ?.anchorIndex ?? index;
      onArrangeSelectIndex(selectIndex, 'contextmenu');
    },
    [canSelect, canPunch, onArrangeSelectIndex, onTogglePunch, occupancy]
  );

  return (
    <div
      className={`wii-mode-grid${isGridFaded ? ' auto-fade' : ''}${
        arrangeModeActive ? ' wii-mode-grid--arrange' : ''
      }${canPunch ? ' wii-mode-grid--punch' : ''}`}
      onMouseEnter={onGridMouseEnter}
      onMouseLeave={onGridMouseLeave}
      onPointerMove={onGridPointerMove}
      onPointerDown={onGridPointerDown}
      onWheel={onGridWheel}
    >
      <LayoutGroup id="homeArrangeSelectionGroup">
      <m.div ref={stripRef} className="wii-strip-continuous" style={{ x: stripX }}>
        <div
          className={`wii-strip-board wii-strip-board--continuous${
            focusRecedeEnabled && !arrangeModeActive
              ? ' wii-strip-board--focus-recede'
              : ''
          }`}
          style={boardStyle}
        >
          {Array.from({ length: totalChannelSlots }, (_, i) => {
            const occ = occupancy[i];
            if (occ?.role === 'covered') return null;

            const idxInPage = i % channelsPerPage;
            const spanSource = Array.isArray(slots) ? slots[i] : null;
            const { colSpan, rowSpan } = occ
              ? { colSpan: occ.colSpan, rowSpan: occ.rowSpan }
              : getSlotSpan(spanSource);
            const placement = getStripGridPlacement(
              i,
              colSpan,
              rowSpan,
              safeColumns,
              safeRows,
              safeTotalPages
            );
            const gridStyle = {
              gridColumn: placement.gridColumn,
              gridRow: placement.gridRow,
            };

            const hidden = isSlotHidden(slotMeta, i);
            const pageIndex = Math.floor(i / channelsPerPage);

            const punchTransition = reducedMotion ? { duration: 0.12 } : pillClose;

            if (!hidden && !mountedPages.has(pageIndex)) {
              return (
                <div
                  key={`tile-idle-${hubEntranceKey}-${i}`}
                  className="wii-strip-channel-cell"
                  style={gridStyle}
                  aria-hidden
                />
              );
            }

            // Peeked neighbour: recede it, and let a tap on the cut tile page toward it
            // rather than launch. `inert` keeps the clipped lip out of the tab order —
            // the click still lands, because it falls through to this cell.
            const offPage = pageIndex !== safeCurrentPage && !arrangeModeActive;
            const peekable = offPage && canSelectPeekPage;

            return (
              <div
                key={`tile-cell-${hubEntranceKey}-${i}`}
                className="wii-strip-channel-cell relative min-h-0 min-w-0"
                data-wee-board-slot={i}
                data-shelf-offpage={offPage ? '' : undefined}
                data-shelf-peekable={peekable ? '' : undefined}
                style={gridStyle}
                onClick={peekable ? handlePeekPageSelect(pageIndex) : undefined}
              >
                <AnimatePresence initial={false} mode="wait">
                  {hidden ? (
                    canPunch || canRestoreHole ? (
                      <m.button
                        key={`hole-${i}`}
                        type="button"
                        className={`absolute inset-0 wii-strip-channel-cell--hidden${
                          canPunch
                            ? ' wii-strip-channel-cell--punchable'
                            : ' wii-strip-channel-cell--restorable'
                        }`}
                        initial={{ scale: 0.72, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.72, opacity: 0 }}
                        transition={punchTransition}
                        onClick={handlePunchCapture(i)}
                        aria-label={`Restore slot ${i + 1}`}
                        title="Restore this slot"
                      >
                        <Plus size={18} strokeWidth={2.5} aria-hidden />
                      </m.button>
                    ) : (
                      <m.div
                        key={`hole-empty-${i}`}
                        className="absolute inset-0 wii-strip-channel-cell--hidden"
                        initial={{ scale: 0.72, opacity: 0 }}
                        animate={{ scale: 0, opacity: 0 }}
                        exit={{ scale: 0.72, opacity: 0 }}
                        transition={punchTransition}
                        aria-hidden
                      />
                    )
                  ) : (
                    <m.div
                      key={`tile-${i}`}
                      className={`h-full w-full${canPunch ? ' wii-strip-channel-cell--punchable' : ''}`}
                      inert={offPage}
                      variants={tileItemVariants}
                      custom={idxInPage}
                      initial={pageIndex === entrancePage ? 'closed' : false}
                      animate={tileAnimate}
                      exit={{ scale: 0.72, opacity: 0, transition: punchTransition }}
                      whileTap={
                        reducedMotion || !(canPunch || canSelect)
                          ? undefined
                          : { scale: 0.94 }
                      }
                      onClickCapture={
                        canPunch
                          ? handlePunchCapture(i)
                          : canSelect
                            ? handleArrangeSelectCapture(i)
                            : undefined
                      }
                      onContextMenuCapture={
                        canPunch || canSelect ? handleArrangeContextMenuCapture(i) : undefined
                      }
                    >
                      <StripCellOnCurrentPageContext.Provider value={pageIndex === safeCurrentPage}>
                        {renderChannelAtIndex(i, true)}
                      </StripCellOnCurrentPageContext.Provider>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </m.div>
      </LayoutGroup>
    </div>
  );
};

WiiChannelStrip.propTypes = {
  totalPages: PropTypes.number.isRequired,
  currentPage: PropTypes.number,
  animationDirection: PropTypes.oneOf(['none', 'left', 'right']),
  animationWrapped: PropTypes.bool,
  isAnimating: PropTypes.bool.isRequired,
  isGridFaded: PropTypes.bool.isRequired,
  columns: PropTypes.number.isRequired,
  rows: PropTypes.number.isRequired,
  slotMeta: PropTypes.object,
  slots: PropTypes.array,
  onGridMouseEnter: PropTypes.func.isRequired,
  onGridMouseLeave: PropTypes.func.isRequired,
  onGridPointerMove: PropTypes.func,
  onGridPointerDown: PropTypes.func,
  onGridWheel: PropTypes.func,
  renderChannelAtIndex: PropTypes.func.isRequired,
  onPageFlipComplete: PropTypes.func,
  hubEntranceKey: PropTypes.number,
  hubEntranceTier: PropTypes.oneOf(Object.values(SPACE_SHELL_ENTRANCE_TIERS)),
  hubEntranceShellMs: PropTypes.number,
  focusRecedeEnabled: PropTypes.bool,
  arrangeModeActive: PropTypes.bool,
  punchModeActive: PropTypes.bool,
  onTogglePunch: PropTypes.func,
  onArrangeSelectIndex: PropTypes.func,
  onPeekPageSelect: PropTypes.func,
};

export default React.memo(WiiChannelStrip);
