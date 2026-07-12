import React from 'react';
import PropTypes from 'prop-types';
import { m } from 'framer-motion';
import { createWeeTransition } from '../../design/weeMotion';

const MotionDiv = m.div;

/**
 * Shared layoutId selection disc — same chrome as space-rail `pillActive`.
 * Wrap sibling options in a Framer `LayoutGroup` so the disc morphs between them.
 */
function WeeLayoutActiveDisc({
  layoutId = 'weeActiveDisc',
  className = '',
  reducedMotion = false,
  transition,
}) {
  return (
    <MotionDiv
      layoutId={layoutId}
      className={[
        'absolute inset-0 z-0 rounded-full',
        'bg-[hsl(var(--surface-elevated))] shadow-[var(--shadow-md)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      transition={transition ?? createWeeTransition('pillOpen', { reducedMotion })}
      aria-hidden
    />
  );
}

WeeLayoutActiveDisc.propTypes = {
  layoutId: PropTypes.string,
  className: PropTypes.string,
  reducedMotion: PropTypes.bool,
  transition: PropTypes.object,
};

export default WeeLayoutActiveDisc;
