import React from 'react';
import PropTypes from 'prop-types';

/**
 * Compact music-reactive bar strip — shared by floating widget + ribbon chrome.
 * Levels are 0–1; idle (all zero) keeps bars at a tiny resting height.
 */
function MusicReactiveBars({
  levels = [],
  className = '',
  barClassName = '',
  color = 'hsl(var(--primary))',
  minHeightPx = 3,
  maxHeightPx = 28,
  opacity = 0.85,
}) {
  const bars = Array.isArray(levels) && levels.length ? levels : [0, 0, 0, 0, 0, 0, 0, 0];

  return (
    <div
      className={`flex items-end justify-center gap-[3px] ${className}`.trim()}
      aria-hidden
      style={{ opacity }}
    >
      {bars.map((level, i) => {
        const h = minHeightPx + Math.max(0, Math.min(1, level || 0)) * (maxHeightPx - minHeightPx);
        return (
          <span
            key={i}
            className={`inline-block w-[3px] rounded-full ${barClassName}`.trim()}
            style={{
              height: `${h}px`,
              background: color,
              transition: 'height 60ms linear',
            }}
          />
        );
      })}
    </div>
  );
}

MusicReactiveBars.propTypes = {
  levels: PropTypes.arrayOf(PropTypes.number),
  className: PropTypes.string,
  barClassName: PropTypes.string,
  color: PropTypes.string,
  minHeightPx: PropTypes.number,
  maxHeightPx: PropTypes.number,
  opacity: PropTypes.number,
};

export default React.memo(MusicReactiveBars);
