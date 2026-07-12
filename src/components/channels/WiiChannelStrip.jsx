import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { m } from 'framer-motion';
import {
  useWeeMotion,
  createWeeChannelTileItemVariants,
  createWeeTransition,
} from '../../design/weeMotion';
import { SPACE_SHELL_ENTRANCE_TIERS } from '../../design/spaceShellMotion';
import { isSlotHidden } from '../../utils/channelLayoutSystem';

/**
 * Continuous channel strip: uniform gap grid, pan via Framer (`channelPageFlip`).
 * Peek / page math use `--wii-strip-peek` / `--wii-total-pages` from the parent.
 * Hidden slots (`slotMeta`) keep absolute cells as wallpaper holes.
 */
const WiiChannelStrip = ({
  totalPages,
  currentPage = 0,
  isAnimating,
  isGridFaded,
  columns,
  rows,
  slotMeta = {},
  onGridMouseEnter,
  onGridMouseLeave,
  onGridPointerMove,
  onGridPointerDown,
  onGridWheel,
  renderChannelAtIndex,
  onPageFlipComplete,
  hubEntranceKey = 0,
  hubEntranceTier = SPACE_SHELL_ENTRANCE_TIERS.firstVisitPlayful,
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

  return (
    <div
      className={`wii-mode-grid${isGridFaded ? ' auto-fade' : ''}`}
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
          className="wii-strip-board wii-strip-board--continuous"
          style={boardStyle}
        >
          {Array.from({ length: totalChannelSlots }, (_, i) => {
            const page = Math.floor(i / channelsPerPage);
            const idxInPage = i % channelsPerPage;
            const row = Math.floor(idxInPage / safeColumns);
            const col = (idxInPage % safeColumns) + page * safeColumns;
            const hidden = isSlotHidden(slotMeta, i);

            if (hidden) {
              return (
                <div
                  key={`tile-hole-${hubEntranceKey}-${i}`}
                  className="wii-strip-channel-cell wii-strip-channel-cell--hidden"
                  style={{
                    gridColumn: col + 1,
                    gridRow: row + 1,
                  }}
                  aria-hidden
                />
              );
            }

            return (
              <m.div
                key={`tile-${hubEntranceKey}-${i}`}
                className="wii-strip-channel-cell"
                style={{
                  gridColumn: col + 1,
                  gridRow: row + 1,
                }}
                variants={tileItemVariants}
                custom={idxInPage}
                initial="closed"
                animate={tileAnimate}
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
  onGridMouseEnter: PropTypes.func.isRequired,
  onGridMouseLeave: PropTypes.func.isRequired,
  onGridPointerMove: PropTypes.func,
  onGridPointerDown: PropTypes.func,
  onGridWheel: PropTypes.func,
  renderChannelAtIndex: PropTypes.func.isRequired,
  onPageFlipComplete: PropTypes.func,
  hubEntranceKey: PropTypes.number,
  hubEntranceTier: PropTypes.oneOf(Object.values(SPACE_SHELL_ENTRANCE_TIERS)),
};

export default React.memo(WiiChannelStrip);
