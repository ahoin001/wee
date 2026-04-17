import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { motion, useReducedMotion } from 'framer-motion';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';
import { PLAYFUL_SPRINGS, PLAYFUL_AMPLITUDE } from '../../design/playfulMotion';

/** Snappy spring for press / release — aligned with channel drag springs */
const playfulTapSpring = {
  ...PLAYFUL_SPRINGS.press,
};

/** Inner tap under `.channel` — CSS keeps hover scale on the outer shell */
const CHANNEL_TAP = { scale: 0.97, rotate: -0.75 };

const PRESS_VARIANT = {
  dockButton: {
    tap: { scale: PLAYFUL_AMPLITUDE.pressScale, rotate: PLAYFUL_AMPLITUDE.pressRotate },
    hover: { scale: PLAYFUL_AMPLITUDE.hoverScale, rotate: 0.35, y: PLAYFUL_AMPLITUDE.hoverLiftY },
  },
  dockAccessory: {
    tap: { scale: PLAYFUL_AMPLITUDE.pressScale, rotate: -2 },
    hover: { scale: PLAYFUL_AMPLITUDE.hoverScale, rotate: 0, y: PLAYFUL_AMPLITUDE.hoverLiftY },
  },
  ribbon: {
    tap: { scale: PLAYFUL_AMPLITUDE.pressScale, rotate: -0.65 },
  },
};

/**
 * Full-surface press + optional hover (dock). Use `enableHover={false}` when CSS owns hover.
 */
export const PlayfulPressSurface = forwardRef(function PlayfulPressSurface(
  { as = 'div', variant = 'dockButton', enableHover = true, className, style, children, ...rest },
  ref
) {
  const osReduced = useReducedMotion();
  const mf = useMotionFeedback();
  const allowDock = variant === 'dockButton' || variant === 'dockAccessory' ? mf.dockPress : mf.ribbonTap;
  const reduced = osReduced || !allowDock;
  const v = PRESS_VARIANT[variant] || PRESS_VARIANT.dockButton;
  const Comp = as === 'button' ? motion.button : motion.div;

  if (reduced) {
    const Plain = as === 'button' ? 'button' : 'div';
    return (
      <Plain ref={ref} type={as === 'button' ? 'button' : undefined} className={className} style={style} {...rest}>
        {children}
      </Plain>
    );
  }

  return (
    <Comp
      ref={ref}
      type={as === 'button' ? 'button' : undefined}
      className={className}
      style={{ transformOrigin: 'center center', ...style }}
      whileTap={v.tap}
      whileHover={enableHover && v.hover ? v.hover : undefined}
      transition={playfulTapSpring}
      {...rest}
    >
      {children}
    </Comp>
  );
});

PlayfulPressSurface.displayName = 'PlayfulPressSurface';

PlayfulPressSurface.propTypes = {
  as: PropTypes.oneOf(['div', 'button']),
  variant: PropTypes.oneOf(['dockButton', 'dockAccessory', 'ribbon']),
  enableHover: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
  children: PropTypes.node.isRequired,
};

PlayfulPressSurface.defaultProps = {
  as: 'div',
  variant: 'dockButton',
  enableHover: true,
  className: '',
  style: undefined,
};

/**
 * Tap-only layer (e.g. inside `.channel` so outer CSS hover transform stays intact).
 */
export const PlayfulTapLayer = forwardRef(function PlayfulTapLayer(
  { className, style, children, ...rest },
  ref
) {
  const osReduced = useReducedMotion();
  const { channelTap } = useMotionFeedback();
  const reduced = osReduced || !channelTap;
  if (reduced) {
    return (
      <div ref={ref} className={className} style={style} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ transformOrigin: 'center center', ...style }}
      whileTap={CHANNEL_TAP}
      transition={playfulTapSpring}
      {...rest}
    >
      {children}
    </motion.div>
  );
});

PlayfulTapLayer.displayName = 'PlayfulTapLayer';

PlayfulTapLayer.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object,
  children: PropTypes.node.isRequired,
};
