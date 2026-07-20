import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { m, useReducedMotion } from 'framer-motion';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';
import { PLAYFUL_AMPLITUDE } from '../../design/playfulMotion';
import { createWeeTransition, useWeeMotion } from '../../design/weeMotion';
import { WEE_GOOEY_ICON_PRESS } from './WeeGooeyIconButton';

/** Inner tap under `.channel` — CSS keeps hover scale on the outer shell. */
const CHANNEL_TAP = { scale: 0.95, rotate: -0.75 };

/** Soft glow hover for full-width rows/cards — no Framer scale (icon scales are too large). */
const LIST_ROW_HOVER_GLOW_CLASS =
  'transition-[box-shadow,border-color] duration-200 hover:[box-shadow:var(--shadow-soft-hover),var(--shadow-hover-glow)]';

const PRESS_VARIANT = {
  dockButton: {
    tap: { scale: WEE_GOOEY_ICON_PRESS.tapScale, rotate: PLAYFUL_AMPLITUDE.pressRotate },
    hover: {
      scale: WEE_GOOEY_ICON_PRESS.hoverScale,
      rotate: 0.35,
      y: PLAYFUL_AMPLITUDE.hoverLiftY,
    },
  },
  dockAccessory: {
    tap: { scale: WEE_GOOEY_ICON_PRESS.tapScale, rotate: -2 },
    hover: {
      scale: WEE_GOOEY_ICON_PRESS.hoverScale,
      rotate: 0,
      y: PLAYFUL_AMPLITUDE.hoverLiftY,
    },
  },
  ribbon: {
    tap: { scale: WEE_GOOEY_ICON_PRESS.tapScale, rotate: -0.65 },
  },
  mediaHub: {
    tap: { scale: 0.985 },
    hover: { y: -2, scale: 1.01 },
  },
  /**
   * Full-width library / picker rows — press spring only; hover is token soft glow (CSS).
   * Do not reuse dockButton hoverScale (1.12) on large surfaces.
   */
  listRow: {
    tap: { scale: 0.985 },
  },
};

/**
 * Full-surface press + optional hover. Canonical press layer for dock, ribbon, media hub,
 * and list/picker rows (`listRow` = soft glow, no hover scale).
 * Use `enableHover={false}` when CSS owns hover (legacy ribbon glass).
 */
export const WeePressSurface = forwardRef(function WeePressSurface(
  { as = 'div', variant = 'dockButton', enableHover = true, className, style, children, ...rest },
  ref
) {
  const osReduced = useReducedMotion();
  const mf = useMotionFeedback();
  const { pillSurfacePress } = useWeeMotion();
  const allowDock =
    variant === 'dockButton' || variant === 'dockAccessory'
      ? mf.dockPress
      : variant === 'mediaHub' || variant === 'listRow'
        ? mf.gooey.enabled
        : mf.ribbonTap;
  const reduced = osReduced || !allowDock;
  const v = PRESS_VARIANT[variant] || PRESS_VARIANT.dockButton;
  const Comp = as === 'button' ? m.button : m.div;
  const ribbonGooey = variant === 'ribbon' && mf.gooey.ribbonHover.enabled;
  const mediaHubGooey = variant === 'mediaHub' && mf.gooey.mediaHubHover?.enabled;
  const listRowGlow = variant === 'listRow' && enableHover;
  const ribbonHoverTarget = ribbonGooey
    ? {
        ...(mf.gooey.ribbonHover.whileHover || {}),
        y: PLAYFUL_AMPLITUDE.hoverLiftY * mf.gooey.ribbonIntensity,
      }
    : v.hover;
  const mediaHubHoverTarget = mediaHubGooey
    ? {
        ...(mf.gooey.mediaHubHover.whileHover || {}),
        y: -2 * (mf.gooey.mediaHubIntensity ?? 1),
      }
    : v.hover;
  const hoverTransition = ribbonGooey
    ? mf.gooey.ribbonHover.transition
    : mediaHubGooey
      ? mf.gooey.mediaHubHover.transition
      : pillSurfacePress || createWeeTransition('press');

  const surfaceClassName = [
    className,
    ribbonGooey ? 'playful-press--gooey-ribbon' : '',
    ribbonGooey && mf.gooey.ribbonHover.includeGlow ? 'playful-press--gooey-glow' : '',
    listRowGlow ? LIST_ROW_HOVER_GLOW_CLASS : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (reduced) {
    const Plain = as === 'button' ? 'button' : 'div';
    return (
      <Plain
        ref={ref}
        type={as === 'button' ? 'button' : undefined}
        className={surfaceClassName}
        style={style}
        {...rest}
      >
        {children}
      </Plain>
    );
  }

  const hoverEnabled = enableHover || ribbonGooey || mediaHubGooey;
  const hoverTarget =
    variant === 'listRow'
      ? undefined
      : variant === 'mediaHub'
        ? mediaHubHoverTarget
        : ribbonGooey
          ? ribbonHoverTarget
          : v.hover;

  return (
    <Comp
      ref={ref}
      type={as === 'button' ? 'button' : undefined}
      className={surfaceClassName}
      style={{ transformOrigin: 'center center', ...style }}
      whileTap={v.tap}
      whileHover={hoverEnabled && hoverTarget ? hoverTarget : undefined}
      transition={hoverTransition}
      {...rest}
    >
      {children}
    </Comp>
  );
});

WeePressSurface.displayName = 'WeePressSurface';

WeePressSurface.propTypes = {
  as: PropTypes.oneOf(['div', 'button']),
  variant: PropTypes.oneOf(['dockButton', 'dockAccessory', 'ribbon', 'mediaHub', 'listRow']),
  enableHover: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
  children: PropTypes.node.isRequired,
};

/**
 * Tap-only layer (e.g. inside `.channel` so outer CSS hover transform stays intact).
 */
export const WeeTapLayer = forwardRef(function WeeTapLayer(
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
    <m.div
      ref={ref}
      className={className}
      style={{ transformOrigin: 'center center', ...style }}
      whileTap={CHANNEL_TAP}
      transition={createWeeTransition('press')}
      {...rest}
    >
      {children}
    </m.div>
  );
});

WeeTapLayer.displayName = 'WeeTapLayer';

WeeTapLayer.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object,
  children: PropTypes.node.isRequired,
};
