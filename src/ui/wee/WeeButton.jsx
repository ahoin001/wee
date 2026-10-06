import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { createWeeTransition } from '../../design/weeMotion';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';
import { PLAYFUL_AMPLITUDE } from '../../design/playfulMotion';
import WeeGlassPill from './WeeGlassPill';
import WeePillFloorShadow from './WeePillFloorShadow';

/** Radius rides with height so every size reads as one corner family. */
const SIZE_CLASS = {
  sm: 'min-h-[40px] px-4 py-2 text-[length:var(--font-size-micro)] rounded-[var(--control-radius-sm)]',
  md: 'min-h-[44px] px-5 py-2.5 text-[length:var(--font-size-caption)] rounded-[var(--control-radius-md)]',
  lg: 'min-h-[48px] px-6 py-3 text-xs rounded-[var(--control-radius-lg)]',
};

const VARIANT_CLASS = {
  primary:
    '!border-[hsl(var(--primary)/0.55)] !bg-[hsl(var(--primary))] !text-[hsl(var(--text-on-accent))] shadow-[var(--shadow-hover-glow)]',
  secondary: '',
  danger:
    '!border-[hsl(var(--state-error)/0.55)] !bg-[hsl(var(--state-error))] !text-[hsl(var(--text-on-accent))]',
};

const ACTIVE_CLASS =
  '!border-[hsl(var(--primary)/0.55)] !bg-[hsl(var(--primary)/0.22)] !text-[hsl(var(--text-accent))] shadow-[var(--shadow-hover-glow)]';

const DISABLED_CLASS =
  '!cursor-not-allowed !border-[hsl(var(--border-primary)/0.42)] !bg-[hsl(var(--surface-wii-tint))] !text-[hsl(var(--text-secondary))] !shadow-none';

/**
 * Labeled Wee action — glass squircle + floor shadow + press spring.
 * Stadium `rounded-full` is reserved for icon discs, not text chips.
 */
function WeeButton({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  active = false,
  type = 'button',
  children,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...rest
}) {
  const { osReduced, prefs } = useMotionFeedback();
  const reducedMotion = Boolean(osReduced) || prefs?.master === false;
  const press = createWeeTransition('press', { reducedMotion });
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const revealed = !disabled && (hovered || focused);

  return (
    <span className="relative inline-flex">
      <WeePillFloorShadow expanded={revealed} reducedMotion={reducedMotion} />
      <WeeGlassPill
        as="button"
        motion
        type={type}
        disabled={disabled}
        aria-pressed={active || undefined}
        whileHover={
          reducedMotion || disabled
            ? undefined
            : { scale: PLAYFUL_AMPLITUDE.hoverScale, y: PLAYFUL_AMPLITUDE.hoverLiftY }
        }
        whileTap={reducedMotion || disabled ? undefined : { scale: PLAYFUL_AMPLITUDE.pressScale }}
        transition={press}
        onMouseEnter={(event) => {
          setHovered(true);
          onMouseEnter?.(event);
        }}
        onMouseLeave={(event) => {
          setHovered(false);
          onMouseLeave?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        className={`relative z-10 inline-flex items-center justify-center font-black uppercase italic tracking-widest focus:outline-none focus-visible:shadow-[var(--shadow-hover-glow)] ${
          SIZE_CLASS[size] || SIZE_CLASS.md
        } ${
          disabled
            ? DISABLED_CLASS
            : active
              ? ACTIVE_CLASS
              : VARIANT_CLASS[variant] || VARIANT_CLASS.secondary
        } ${className}`.trim()}
        {...rest}
      >
        {children}
      </WeeGlassPill>
    </span>
  );
}

WeeButton.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  disabled: PropTypes.bool,
  active: PropTypes.bool,
  type: PropTypes.string,
  children: PropTypes.node,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
};

export default WeeButton;
