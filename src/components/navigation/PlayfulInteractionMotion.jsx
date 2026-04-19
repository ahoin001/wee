import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { m, useReducedMotion } from 'framer-motion';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';
import { PLAYFUL_AMPLITUDE } from '../../design/playfulMotion';
import { useWeeMotion } from '../../design/weeMotion';

/** Matches WeeGooeySpacePill row buttons (whileTap / whileHover scale). */
const PILL_ROW_PRESS_SCALE = 0.92;
const PILL_ROW_HOVER_SCALE = 1.12;

/** Inner tap under `.channel` — CSS keeps hover scale on the outer shell; subtler than full chrome. */
const CHANNEL_TAP = { scale: 0.95, rotate: -0.75 };

const PRESS_VARIANT = {
  dockButton: {
    tap: { scale: PILL_ROW_PRESS_SCALE, rotate: PLAYFUL_AMPLITUDE.pressRotate },
    hover: { scale: PILL_ROW_HOVER_SCALE, rotate: 0.35, y: PLAYFUL_AMPLITUDE.hoverLiftY },
  },
  dockAccessory: {
    tap: { scale: PILL_ROW_PRESS_SCALE, rotate: -2 },
    hover: { scale: PILL_ROW_HOVER_SCALE, rotate: 0, y: PLAYFUL_AMPLITUDE.hoverLiftY },
  },
  ribbon: {
    tap: { scale: PILL_ROW_PRESS_SCALE, rotate: -0.65 },
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
  const { pillSurfacePress } = useWeeMotion();
  const allowDock = variant === 'dockButton' || variant === 'dockAccessory' ? mf.dockPress : mf.ribbonTap;
  const reduced = osReduced || !allowDock;
  const v = PRESS_VARIANT[variant] || PRESS_VARIANT.dockButton;
  const Comp = as === 'button' ? m.button : m.div;

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
      transition={pillSurfacePress}
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
  const { pillSurfacePress } = useWeeMotion();
  const reduced = osReduced || !channelTap;
  if (reduced) {
    return (
      <div ref={ref} className={className} style={style} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <m.div
      ref={ref}
      className={className}
      style={{ transformOrigin: 'center center', ...style }}
      whileTap={CHANNEL_TAP}
      transition={pillSurfacePress}
      {...rest}
    >
      {children}
    </m.div>
  );
});

PlayfulTapLayer.displayName = 'PlayfulTapLayer';

PlayfulTapLayer.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object,
  children: PropTypes.node.isRequired,
};
