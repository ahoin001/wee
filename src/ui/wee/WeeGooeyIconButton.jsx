import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { m } from 'framer-motion';
import { createWeeTransition } from '../../design/weeMotion';
import WeeLayoutActiveDisc from './WeeLayoutActiveDisc';

const MotionButton = m.button;

/** Pill-row press amplitudes — single source with WeePressSurface / space rail. */
export const WEE_GOOEY_ICON_PRESS = Object.freeze({
  hoverScale: 1.12,
  tapScale: 0.92,
  solidHoverRotate: 12,
  rowHoverRotate: [0, -5, 5, 0],
  outlineHoverScale: 1.08,
  outlineTapScale: 0.94,
});

const SIZE_CLASS = {
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-14 w-14',
};

const VARIANT_CLASS = {
  ghost:
    'rounded-full transition-colors text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--text-primary))]',
  solid:
    'rounded-full bg-[hsl(var(--text-primary))] text-[hsl(var(--text-on-accent))] shadow-[var(--shadow-card)]',
  outline:
    'rounded-full border-2 border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-elevated))] text-[hsl(var(--text-primary))] shadow-[var(--shadow-card)]',
};

/**
 * Rounded icon control with space-pill gooey press physics.
 * Optional `active` + `layoutId` renders {@link WeeLayoutActiveDisc}.
 */
const WeeGooeyIconButton = forwardRef(function WeeGooeyIconButton(
  {
    variant = 'ghost',
    size = 'lg',
    active = false,
    layoutId,
    reducedMotion = false,
    className = '',
    children,
    type = 'button',
    ...rest
  },
  ref
) {
  const press = WEE_GOOEY_ICON_PRESS;
  let whileHover;
  let whileTap;
  if (!reducedMotion) {
    if (variant === 'solid') {
      whileHover = { scale: press.hoverScale, rotate: press.solidHoverRotate };
      whileTap = { scale: press.tapScale };
    } else if (variant === 'outline') {
      whileHover = { scale: press.outlineHoverScale };
      whileTap = { scale: press.outlineTapScale };
    } else {
      whileHover = { scale: press.hoverScale, rotate: press.rowHoverRotate };
      whileTap = { scale: press.tapScale, rotate: 0 };
    }
  }

  return (
    <MotionButton
      ref={ref}
      type={type}
      whileHover={whileHover || {}}
      whileTap={whileTap || {}}
      transition={createWeeTransition('press', { reducedMotion })}
      className={[
        'relative flex shrink-0 items-center justify-center',
        SIZE_CLASS[size] || SIZE_CLASS.lg,
        VARIANT_CLASS[variant] || VARIANT_CLASS.ghost,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={active || undefined}
      {...rest}
    >
      {active && layoutId ? (
        <WeeLayoutActiveDisc layoutId={layoutId} reducedMotion={reducedMotion} />
      ) : null}
      {children}
    </MotionButton>
  );
});

WeeGooeyIconButton.displayName = 'WeeGooeyIconButton';

WeeGooeyIconButton.propTypes = {
  variant: PropTypes.oneOf(['ghost', 'solid', 'outline']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  active: PropTypes.bool,
  layoutId: PropTypes.string,
  reducedMotion: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
  type: PropTypes.string,
};

export default WeeGooeyIconButton;
