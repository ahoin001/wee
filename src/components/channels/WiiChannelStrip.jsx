import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

const WiiChannelStrip = ({
  currentPage,
  totalPages,
  isAnimating,
  isGridFaded,
  columns,
  rows,
  onGridMouseEnter,
  onGridMouseLeave,
  renderChannelAtIndex,
}) => {
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const safeCurrentPage = Math.max(0, Math.min(Number(currentPage) || 0, safeTotalPages - 1));
  const safeColumns = Math.max(1, Number(columns) || 1);
  const safeRows = Math.max(1, Number(rows) || 1);
  const channelsPerPage = safeColumns * safeRows;

  const trackStyle = useMemo(
    () => ({
      '--wii-strip-current-page': safeCurrentPage,
    }),
    [safeCurrentPage]
  );

  return (
    <div
      className={`wii-mode-grid${isGridFaded ? ' auto-fade' : ''}`}
      onMouseEnter={onGridMouseEnter}
      onMouseLeave={onGridMouseLeave}
    >
      <div
        className={`wii-strip-track${isAnimating ? ' wii-strip-track--animating' : ''}`}
        style={trackStyle}
      >
        {Array.from({ length: safeTotalPages }, (_, pageIndex) => {
          const pageStart = pageIndex * channelsPerPage;
          return (
            <div
              key={`wii-page-${pageIndex}`}
              className="wii-strip-page"
            >
              <div
                className="wii-strip-board"
                style={{
                  gridTemplateColumns: `repeat(${safeColumns}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${safeRows}, minmax(clamp(86px, 11.8vh, 156px), auto))`,
                }}
              >
                {Array.from({ length: channelsPerPage }, (_, offset) =>
                  renderChannelAtIndex(pageStart + offset, true)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

WiiChannelStrip.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  isAnimating: PropTypes.bool.isRequired,
  isGridFaded: PropTypes.bool.isRequired,
  columns: PropTypes.number.isRequired,
  rows: PropTypes.number.isRequired,
  onGridMouseEnter: PropTypes.func.isRequired,
  onGridMouseLeave: PropTypes.func.isRequired,
  renderChannelAtIndex: PropTypes.func.isRequired,
};

export default React.memo(WiiChannelStrip);

