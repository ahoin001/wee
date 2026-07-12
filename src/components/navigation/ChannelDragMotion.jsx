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
 * Empty slots still lift so blank channels feel rearrangable like filled ones.
 */
export function ChannelDragOverlayFrame({ children, empty = false }) {
  const osReduced = useReducedMotion();
  const { channelDragPreview } = useMotionFeedback();
  const reduceMotion = osReduced || !channelDragPreview;

  if (reduceMotion) {
    return (
      <div
        className={`channel-drag-overlay channel-drag-overlay--reduced pointer-events-none rounded-xl${
          empty ? ' channel-drag-overlay--empty' : ''
        }`}
      >
        {children}
      </div>
    );
  }

  return (
    <m.div
      className={`channel-drag-overlay pointer-events-none rounded-xl${
        empty ? ' channel-drag-overlay--empty' : ''
      }`}
      initial={{ scale: 1, rotate: 0, y: 0 }}
      animate={{
        scale: empty ? 1.05 : 1.1,
        rotate: empty ? 1.5 : -3.2,
        y: empty ? -5 : -10,
      }}
      transition={channelDragSpring}
      style={{
        boxShadow: empty
          ? '0 16px 40px hsl(var(--foreground) / 0.18), 0 0 0 2px hsl(var(--primary) / 0.35), 0 0 36px hsl(var(--primary) / 0.2)'
          : '0 24px 56px hsl(var(--foreground) / 0.42), 0 0 0 1px hsl(var(--background) / 0.14), 0 0 48px hsl(var(--primary) / 0.35)',
        filter: empty ? 'brightness(1.02)' : 'brightness(1.06) saturate(1.08)',
      }}
    >
      {children}
    </m.div>
  );
}

ChannelDragOverlayFrame.propTypes = {
  children: PropTypes.node.isRequired,
  empty: PropTypes.bool,
};

ChannelDragOverlayFrame.defaultProps = {
  empty: false,
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
