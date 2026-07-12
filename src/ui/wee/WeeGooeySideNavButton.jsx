import React, { forwardRef, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { createWeeTransition, useWeeMotion } from '../../design/weeMotion';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';
import WeeGlassPill from './WeeGlassPill';
import { WEE_GOOEY_ICON_PRESS } from './WeeGooeyIconButton';
import './WeeGooeySideNavButton.css';

const MotionButton = m.button;
const MotionSpan = m.span;

/** Peek distance — keep in sync with `--side-nav-peek-offset` in design-system.css */
export const WEE_SIDE_NAV_PEEK_PX = 100;

/**
 * Edge-peek prev/next control — glass pill chrome + WeeGooeySpacePill spring family
 * (railNudge / pillOpen / press). Prefer this over ad-hoc Wii side-nav markup.
 */
const WeeGooeySideNavButton = forwardRef(function WeeGooeySideNavButton(
  {
    side = 'left',
    isOpen = true,
    disabled = false,
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
  const { pillSurfacePress } = useWeeMotion();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const reducedMotion = Boolean(osReduced || !gooey?.enabled);
  const revealed = (hovered || focused) && !disabled;
  const peekX = side === 'left' ? -WEE_SIDE_NAV_PEEK_PX : WEE_SIDE_NAV_PEEK_PX;
  const pressEnabled = ribbonTap && !reducedMotion;

  const shellTransition = useMemo(() => {
    if (reducedMotion) {
      return createWeeTransition('railNudge', { reducedMotion: true });
    }
    return createWeeTransition(revealed ? 'pillOpen' : 'railNudge');
  }, [reducedMotion, revealed]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <MotionButton
          key={`wee-side-nav-${side}`}
          ref={ref}
          type={type}
          disabled={disabled}
          title={title}
          aria-label={ariaLabel || title}
          className={[
            'wee-side-nav-btn',
            side === 'left' ? 'wee-side-nav-btn--left' : 'wee-side-nav-btn--right',
            revealed ? 'wee-side-nav-btn--revealed' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          initial={
            reducedMotion
              ? { opacity: 0, x: peekX, y: '-50%' }
              : { opacity: 0, scale: 0.88, x: peekX * 1.12, y: '-50%' }
          }
          animate={{
            opacity: 1,
            scale: revealed && !reducedMotion ? 1.04 : 1,
            x: revealed ? 0 : peekX,
            y: '-50%',
          }}
          exit={
            reducedMotion
              ? { opacity: 0, x: peekX, y: '-50%', transition: { duration: 0.1 } }
              : {
                  opacity: 0,
                  scale: 0.9,
                  x: peekX * 1.08,
                  y: '-50%',
                  transition: createWeeTransition('pillClose', { reducedMotion }),
                }
          }
          transition={shellTransition}
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onClick={onClick}
          onContextMenu={onContextMenu}
          {...rest}
        >
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
