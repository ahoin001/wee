import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import {
  createWeeSideNavPeekVariants,
  createWeeSideNavShellMotion,
  createWeeTransition,
  useWeeMotion,
} from '../../design/weeMotion';
import { PLAYFUL_AMPLITUDE } from '../../design/playfulMotion';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';
import useAnimationActivity from '../../hooks/useAnimationActivity';
import WeeGlassPill from './WeeGlassPill';
import WeePillFloorShadow from './WeePillFloorShadow';
import { WEE_GOOEY_ICON_PRESS } from './WeeGooeyIconButton';
import './WeeGooeySideNavButton.css';

const MotionButton = m.button;
const MotionSpan = m.span;
const MotionDiv = m.div;

/** Classic peek distance — keep in sync with `--side-nav-peek-offset` in design-system.css */
export const WEE_SIDE_NAV_PEEK_PX = 100;

/** Wee compact nub size (matches space-rail compact footprint family). */
export const WEE_SIDE_NAV_COMPACT_PX = 56;

/**
 * Edge-peek prev/next control.
 * - `variant="wee"` (default): tucked idle + friendly bounce peek → morph expand on hover.
 * - `variant="classic"`: legacy translate-x edge slide.
 */
const WeeGooeySideNavButton = forwardRef(function WeeGooeySideNavButton(
  {
    side = 'left',
    isOpen = true,
    disabled = false,
    variant = 'wee',
    className = '',
    surfaceStyle,
    children,
    type = 'button',
    title,
    'aria-label': ariaLabel,
    onClick,
    onContextMenu,
    ...rest
  },
  ref
) {
  const osReduced = useReducedMotion();
  const { gooey, ribbonTap } = useMotionFeedback();
  const { shouldAnimate, isLowPowerMode } = useAnimationActivity({
    activeFps: 30,
    lowPowerFps: 12,
  });
  const { pillSurfacePress, pillOpen, pillClose } = useWeeMotion();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const reducedMotion = Boolean(osReduced || !gooey?.enabled);
  const idlePeek = shouldAnimate && !isLowPowerMode;
  const revealed = (hovered || focused) && !disabled;
  const isClassic = variant === 'classic';
  const peekX = side === 'left' ? -WEE_SIDE_NAV_PEEK_PX : WEE_SIDE_NAV_PEEK_PX;
  const pressEnabled = ribbonTap && !reducedMotion;

  useEffect(() => {
    if (!isOpen || disabled) {
      setHovered(false);
      setFocused(false);
    }
  }, [isOpen, disabled]);

  const classicShellTransition = useMemo(() => {
    if (reducedMotion) {
      return createWeeTransition('railNudge', { reducedMotion: true });
    }
    return createWeeTransition(revealed ? 'pillOpen' : 'railNudge');
  }, [reducedMotion, revealed]);

  const weePeekVariants = useMemo(
    () =>
      createWeeSideNavPeekVariants(side, {
        compactSize: WEE_SIDE_NAV_COMPACT_PX,
        expandedWidth: 156,
        expandedHeight: 64,
        pillClose,
        pillOpen,
        reducedMotion,
      }),
    [side, pillClose, pillOpen, reducedMotion]
  );

  const weeShellMotion = useMemo(
    () =>
      createWeeSideNavShellMotion(side, {
        revealed,
        reducedMotion,
        idlePeek,
        tuckPx: PLAYFUL_AMPLITUDE.sideNavIdleTuckPx,
        peekPx: PLAYFUL_AMPLITUDE.sideNavIdlePeekPx,
      }),
    [side, revealed, reducedMotion, idlePeek]
  );

  const presenceInitial = useMemo(() => {
    if (isClassic) {
      return reducedMotion
        ? { opacity: 0, x: peekX, y: '-50%' }
        : { opacity: 0, scale: 0.88, x: peekX * 1.12, y: '-50%' };
    }
    const tuck =
      (side === 'left' ? -1 : 1) * PLAYFUL_AMPLITUDE.sideNavIdleTuckPx;
    return reducedMotion
      ? { opacity: 0, x: tuck, y: '-50%' }
      : { opacity: 0, scale: 0.9, x: tuck * 1.15, y: '-50%' };
  }, [isClassic, peekX, reducedMotion, side]);

  const presenceExit = useMemo(() => {
    if (isClassic) {
      return reducedMotion
        ? { opacity: 0, x: peekX, y: '-50%', transition: { duration: 0.1 } }
        : {
            opacity: 0,
            scale: 0.9,
            x: peekX * 1.08,
            y: '-50%',
            transition: createWeeTransition('pillClose', { reducedMotion }),
          };
    }
    const tuck =
      (side === 'left' ? -1 : 1) * PLAYFUL_AMPLITUDE.sideNavIdleTuckPx;
    return reducedMotion
      ? { opacity: 0, x: tuck, y: '-50%', transition: { duration: 0.1 } }
      : {
          opacity: 0,
          scale: 0.9,
          x: tuck * 1.1,
          y: '-50%',
          transition: createWeeTransition('pillClose', { reducedMotion }),
        };
  }, [isClassic, peekX, reducedMotion, side]);

  const clearReveal = () => {
    setHovered(false);
    setFocused(false);
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <MotionButton
          key={`wee-side-nav-${side}-${variant}`}
          ref={ref}
          type={type}
          disabled={disabled}
          title={title}
          aria-label={ariaLabel || title}
          className={[
            'wee-side-nav-btn',
            side === 'left' ? 'wee-side-nav-btn--left' : 'wee-side-nav-btn--right',
            isClassic ? 'wee-side-nav-btn--classic' : 'wee-side-nav-btn--wee',
            revealed ? 'wee-side-nav-btn--revealed' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          initial={presenceInitial}
          animate={
            isClassic
              ? {
                  opacity: 1,
                  scale: revealed && !reducedMotion ? 1.04 : 1,
                  x: revealed ? 0 : peekX,
                  y: '-50%',
                }
              : weeShellMotion.animate
          }
          exit={presenceExit}
          transition={isClassic ? classicShellTransition : weeShellMotion.transition}
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          onPointerLeave={clearReveal}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onClick={onClick}
          onContextMenu={onContextMenu}
          {...rest}
        >
          {isClassic ? (
            <WeeGlassPill as="div" className="wee-side-nav-btn__surface !shadow-none" style={surfaceStyle}>
              <MotionSpan
                className="wee-side-nav-btn__icon"
                style={{ transformOrigin: 'center center' }}
                whileTap={pressEnabled ? { scale: WEE_GOOEY_ICON_PRESS.tapScale } : undefined}
                transition={pillSurfacePress || createWeeTransition('press', { reducedMotion })}
              >
                {children}
              </MotionSpan>
            </WeeGlassPill>
          ) : (
            <MotionDiv className="wee-side-nav-btn__morph-shell relative flex items-center justify-center">
              <WeePillFloorShadow
                expanded={revealed}
                reducedMotion={reducedMotion}
                className="wee-side-nav-btn__floor"
              />
              <WeeGlassPill
                motion
                initial="closed"
                animate={revealed ? 'open' : 'closed'}
                variants={weePeekVariants}
                className="wee-side-nav-btn__surface wee-side-nav-btn__surface--wee relative z-10 !shadow-none overflow-hidden"
                style={surfaceStyle}
              >
                <MotionSpan
                  className="wee-side-nav-btn__icon"
                  style={{ transformOrigin: 'center center' }}
                  whileHover={
                    pressEnabled && revealed
                      ? { scale: WEE_GOOEY_ICON_PRESS.hoverScale, rotate: WEE_GOOEY_ICON_PRESS.rowHoverRotate }
                      : undefined
                  }
                  whileTap={pressEnabled ? { scale: WEE_GOOEY_ICON_PRESS.tapScale, rotate: 0 } : undefined}
                  transition={pillSurfacePress || createWeeTransition('press', { reducedMotion })}
                >
                  {children}
                </MotionSpan>
              </WeeGlassPill>
            </MotionDiv>
          )}
        </MotionButton>
      ) : null}
    </AnimatePresence>
  );
});

WeeGooeySideNavButton.displayName = 'WeeGooeySideNavButton';

WeeGooeySideNavButton.propTypes = {
  side: PropTypes.oneOf(['left', 'right']),
  isOpen: PropTypes.bool,
  disabled: PropTypes.bool,
  /** `'wee'` = morphing glass peek (default); `'classic'` = legacy edge slide */
  variant: PropTypes.oneOf(['wee', 'classic']),
  className: PropTypes.string,
  /** Optional CSS variables / overrides for glass surface (Spotify tint, etc.) */
  surfaceStyle: PropTypes.object,
  children: PropTypes.node,
  type: PropTypes.string,
  title: PropTypes.string,
  'aria-label': PropTypes.string,
  onClick: PropTypes.func,
  onContextMenu: PropTypes.func,
};

export default WeeGooeySideNavButton;
