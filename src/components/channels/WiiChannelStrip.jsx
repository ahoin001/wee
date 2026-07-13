import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { m } from 'framer-motion';
import { Plus } from 'lucide-react';
import {
  useWeeMotion,
  createWeeChannelTileItemVariants,
  createWeeTransition,
} from '../../design/weeMotion';
import { SPACE_SHELL_ENTRANCE_TIERS } from '../../design/spaceShellMotion';
import { isSlotHidden } from '../../utils/channelLayoutSystem';
import {
  buildOccupancyMap,
  getSlotSpan,
  getStripGridPlacement,
} from '../../utils/homeGridOccupancy';

/**
 * Continuous channel strip: uniform gap grid, pan via Framer (`channelPageFlip`).
 * Peek / page math use `--wii-strip-peek` / `--wii-total-pages` from the parent.
 * Hidden slots (`slotMeta`) keep absolute cells as wallpaper holes.
 * Spanned slots (`slots[].colSpan` / `rowSpan`) occupy multiple cells; covered cells skip render.
 * Live Board Studio (`arrangeModeActive` + `punchModeActive`) intercepts tile taps to punch
 * or restore a wallpaper hole — punch applies to the **anchor** slot only.
 */
const WiiChannelStrip = ({
  totalPages,
  currentPage = 0,
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
  focusRecedeEnabled = false,
  arrangeModeActive = false,
  punchModeActive = false,
  onTogglePunch,
  onArrangeSelectIndex,
}) => {
  const { pillOpen, reducedMotion } = useWeeMotion();
  const tileItemVariants = useMemo(
    () => createWeeChannelTileItemVariants(pillOpen, reducedMotion),
    [pillOpen, reducedMotion]
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
  const totalGridColumns = safeColumns * safeTotalPages;

  const occupancy = useMemo(
    () => buildOccupancyMap(slots, safeColumns, safeRows, totalChannelSlots),
    [slots, safeColumns, safeRows, totalChannelSlots]
  );

  const boardStyle = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${totalGridColumns}, minmax(0, 1fr))`,
      gridTemplateRows: `repeat(${safeRows}, minmax(clamp(86px, 11.8vh, 156px), auto))`,
    }),
    [totalGridColumns, safeRows]
  );

  const stripX = `-${(safeCurrentPage * 100) / safeTotalPages}%`;

  const handleStripAnimationComplete = useCallback(() => {
    if (isAnimating && typeof onPageFlipComplete === 'function') {
      onPageFlipComplete();
    }
  }, [isAnimating, onPageFlipComplete]);

  const canPunch = arrangeModeActive && punchModeActive && typeof onTogglePunch === 'function';
  const canSelect =
    arrangeModeActive && !punchModeActive && typeof onArrangeSelectIndex === 'function';

  const handlePunchCapture = useCallback(
    (index) => (event) => {
      if (!canPunch) return;
      event.preventDefault();
      event.stopPropagation();
      const occ = occupancy[index];
      const punchIndex = occ?.anchorIndex ?? index;
      onTogglePunch(punchIndex);
    },
    [canPunch, onTogglePunch, occupancy]
  );

  const handleArrangeSelectCapture = useCallback(
    (index) => (event) => {
      if (!canSelect) return;
      event.preventDefault();
      event.stopPropagation();
      const occ = occupancy[index];
      const selectIndex = occ?.anchorIndex ?? index;
      onArrangeSelectIndex(selectIndex);
    },
    [canSelect, onArrangeSelectIndex, occupancy]
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
      <m.div
        className="wii-strip-continuous"
        initial={false}
        animate={{ x: stripX }}
        transition={isAnimating || reducedMotion ? pageFlipTransition : { duration: 0 }}
        onAnimationComplete={handleStripAnimationComplete}
      >
        <div
          className={`wii-strip-board wii-strip-board--continuous${
            focusRecedeEnabled ? ' wii-strip-board--focus-recede' : ''
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

            if (hidden) {
              if (canPunch) {
                return (
                  <button
                    key={`tile-hole-${hubEntranceKey}-${i}`}
                    type="button"
                    className="wii-strip-channel-cell wii-strip-channel-cell--hidden wii-strip-channel-cell--punchable"
                    style={gridStyle}
                    onClick={handlePunchCapture(i)}
                    aria-label={`Restore slot ${i + 1}`}
                    title="Restore this slot"
                  >
                    <Plus size={18} strokeWidth={2.5} aria-hidden />
                  </button>
                );
              }
              return (
                <div
                  key={`tile-hole-${hubEntranceKey}-${i}`}
                  className="wii-strip-channel-cell wii-strip-channel-cell--hidden"
                  style={gridStyle}
                  aria-hidden
                />
              );
            }

            return (
              <m.div
                key={`tile-${hubEntranceKey}-${i}`}
                className={`wii-strip-channel-cell${canPunch ? ' wii-strip-channel-cell--punchable' : ''}`}
                style={gridStyle}
                variants={tileItemVariants}
                custom={idxInPage}
                initial="closed"
                animate={tileAnimate}
                onClickCapture={
                  canPunch
                    ? handlePunchCapture(i)
                    : canSelect
                      ? handleArrangeSelectCapture(i)
                      : undefined
                }
              >
                {renderChannelAtIndex(i, true)}
              </m.div>
            );
          })}
        </div>
      </m.div>
    </div>
  );
};

WiiChannelStrip.propTypes = {
  totalPages: PropTypes.number.isRequired,
  currentPage: PropTypes.number,
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
  focusRecedeEnabled: PropTypes.bool,
  arrangeModeActive: PropTypes.bool,
  punchModeActive: PropTypes.bool,
  onTogglePunch: PropTypes.func,
  onArrangeSelectIndex: PropTypes.func,
};

export default React.memo(WiiChannelStrip);
