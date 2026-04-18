import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * Single continuous 4×N column grid (Option A): one uniform gap everywhere,
 * including between “pages”. Pan with translateX(-page * 100% / totalPages) of the strip.
 * Expects `--wii-strip-current-page` / `--wii-total-pages` on an ancestor (e.g. `.channels-content`).
 */
const WiiChannelStrip = ({
  totalPages,
  isAnimating,
  isGridFaded,
  columns,
  rows,
  onGridMouseEnter,
  onGridMouseLeave,
  onGridPointerMove,
  onGridPointerDown,
  onGridWheel,
  renderChannelAtIndex,
}) => {
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const safeColumns = Math.max(1, Number(columns) || 1);
  const safeRows = Math.max(1, Number(rows) || 1);
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

  return (
    <div
      className={`wii-mode-grid${isGridFaded ? ' auto-fade' : ''}`}
      onMouseEnter={onGridMouseEnter}
      onMouseLeave={onGridMouseLeave}
      onPointerMove={onGridPointerMove}
      onPointerDown={onGridPointerDown}
      onWheel={onGridWheel}
    >
      <div
        className={`wii-strip-continuous${isAnimating ? ' wii-strip-track--animating' : ''}`}
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
            return (
              <div
                key={`wii-cell-${i}`}
                className="wii-strip-channel-cell wii-strip-channel-cell--enter"
                style={{
                  gridColumn: col + 1,
                  gridRow: row + 1,
                  '--wii-enter-delay': `${Math.min(idxInPage * 24, 260)}ms`,
                }}
              >
                {renderChannelAtIndex(i, true)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

WiiChannelStrip.propTypes = {
  totalPages: PropTypes.number.isRequired,
  isAnimating: PropTypes.bool.isRequired,
  isGridFaded: PropTypes.bool.isRequired,
  columns: PropTypes.number.isRequired,
  rows: PropTypes.number.isRequired,
  onGridMouseEnter: PropTypes.func.isRequired,
  onGridMouseLeave: PropTypes.func.isRequired,
  onGridPointerMove: PropTypes.func,
  onGridPointerDown: PropTypes.func,
  onGridWheel: PropTypes.func,
  renderChannelAtIndex: PropTypes.func.isRequired,
};

export default React.memo(WiiChannelStrip);
