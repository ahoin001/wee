import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { musicLevelVar } from '../../hooks/useMusicReactiveLevels';

/**
 * Compact music-reactive bar strip — shared by floating widget + ribbon chrome.
 * Bars read `--lvl-i` (0–1) from this container, written by `useMusicReactiveLevels`
 * via the forwarded ref. Height is fixed; motion is a compositor-only `scaleY`.
 */
const MusicReactiveBars = forwardRef(function MusicReactiveBars(
  {
    bandCount = 8,
    className = '',
    barClassName = '',
    color = 'hsl(var(--primary))',
    minHeightPx = 3,
    maxHeightPx = 28,
    opacity = 0.85,
  },
  ref
) {
  const restScale = Math.min(1, minHeightPx / Math.max(1, maxHeightPx));

  return (
    <div
      ref={ref}
      className={`flex items-end justify-center gap-[3px] ${className}`.trim()}
      aria-hidden
      style={{ opacity }}
    >
      {Array.from({ length: bandCount }, (_, i) => (
        <span
          key={i}
          className={`inline-block w-[3px] origin-bottom rounded-full transition-transform duration-[60ms] ease-linear ${barClassName}`.trim()}
          style={{
            height: `${maxHeightPx}px`,
            background: color,
            transform: `scaleY(calc(${restScale} + var(${musicLevelVar(i)}, 0) * ${1 - restScale}))`,
          }}
        />
      ))}
    </div>
  );
});

MusicReactiveBars.propTypes = {
  bandCount: PropTypes.number,
  className: PropTypes.string,
  barClassName: PropTypes.string,
  color: PropTypes.string,
  minHeightPx: PropTypes.number,
  maxHeightPx: PropTypes.number,
  opacity: PropTypes.number,
};

export default React.memo(MusicReactiveBars);
