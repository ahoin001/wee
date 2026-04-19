import React from 'react';
import PropTypes from 'prop-types';
import { m, useReducedMotion } from 'framer-motion';
import { WEE_SPRINGS } from '../../design/weeMotion';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';

/** Spring used for tile lift + drop-target feedback (aligned with WeeGooey pill / pillOpen family) */
export const channelDragSpring = WEE_SPRINGS.channelDragOverlay;

export const channelDragSpringSoft = WEE_SPRINGS.channelDragSoft;

/**
 * Floating preview while dragging — playful lift, tilt, glow (respects reduced motion).
 */
export function ChannelDragOverlayFrame({ children }) {
  const osReduced = useReducedMotion();
  const { channelDragPreview } = useMotionFeedback();
  const reduceMotion = osReduced || !channelDragPreview;

  if (reduceMotion) {
    return (
      <div className="channel-drag-overlay channel-drag-overlay--reduced pointer-events-none rounded-xl">
        {children}
      </div>
    );
  }

  return (
    <m.div
      className="channel-drag-overlay pointer-events-none rounded-xl"
      initial={{ scale: 1, rotate: 0, y: 0 }}
      animate={{
        scale: 1.08,
        rotate: -2.5,
        y: -7,
      }}
      transition={channelDragSpring}
      style={{
        boxShadow:
          '0 24px 56px rgba(0, 0, 0, 0.42), 0 0 0 1px rgba(255, 255, 255, 0.14), 0 0 48px hsl(var(--primary) / 0.35)',
        filter: 'brightness(1.06) saturate(1.08)',
      }}
    >
      {children}
    </m.div>
  );
}

ChannelDragOverlayFrame.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Subtle “breathing” on valid drop targets under the pointer.
 */
export function ChannelDropTargetMotion({ isActive, isSource, children }) {
  const osReduced = useReducedMotion();
  const { channelDropTarget } = useMotionFeedback();
  const reduceMotion = osReduced || !channelDropTarget;

  if (reduceMotion) {
    return <div className="h-full w-full min-h-0 min-w-0">{children}</div>;
  }

  return (
    <m.div
      className="h-full w-full min-h-0 min-w-0 rounded-[inherit]"
      animate={{
        scale: isActive && !isSource ? 1.035 : 1,
      }}
      transition={channelDragSpringSoft}
      style={{
        transformOrigin: 'center center',
        boxShadow:
          isActive && !isSource
            ? 'inset 0 0 0 2px hsl(var(--primary) / 0.85), 0 0 28px hsl(var(--primary) / 0.25)'
            : 'none',
      }}
    >
      {children}
    </m.div>
  );
}

ChannelDropTargetMotion.propTypes = {
  isActive: PropTypes.bool,
  isSource: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

ChannelDropTargetMotion.defaultProps = {
  isActive: false,
  isSource: false,
};
