import React from 'react';
import PropTypes from 'prop-types';
import { m } from 'framer-motion';
import { createWeeTransition } from '../../design/weeMotion';

const MotionDiv = m.div;

/**
 * Secondary mass cue under glass pills (space rail floor blur).
 */
function WeePillFloorShadow({
  expanded = false,
  reducedMotion = false,
  className = '',
  transition,
}) {
  return (
    <MotionDiv
      className={[
        'pointer-events-none absolute -bottom-4 left-1/2 z-0 h-2 w-12 -translate-x-1/2',
        'rounded-full bg-[hsl(var(--wee-pill-floor))] blur-sm',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      animate={{
        scaleX: expanded ? 2.5 : 1,
        opacity: expanded ? 0.15 : 0.4,
      }}
      transition={transition ?? createWeeTransition('pillClose', { reducedMotion })}
      aria-hidden
    />
  );
}

WeePillFloorShadow.propTypes = {
  expanded: PropTypes.bool,
  reducedMotion: PropTypes.bool,
  className: PropTypes.string,
  transition: PropTypes.object,
};

export default WeePillFloorShadow;
