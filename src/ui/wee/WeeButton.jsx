import React from 'react';
import PropTypes from 'prop-types';
import { createWeeTransition } from '../../design/weeMotion';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';
import { PLAYFUL_AMPLITUDE } from '../../design/playfulMotion';
import WeeGlassPill from './WeeGlassPill';

const SIZE_CLASS = {
  sm: 'px-3 py-1.5 text-[10px]',
  md: 'px-5 py-2.5 text-[11px]',
  lg: 'px-6 py-3 text-xs',
};

const VARIANT_CLASS = {
  primary:
    '!border-[hsl(var(--primary)/0.55)] !bg-[hsl(var(--primary))] !text-[hsl(var(--text-on-accent))] shadow-[var(--shadow-hover-glow)]',
  secondary: '',
  danger:
    '!border-[hsl(var(--state-error)/0.55)] !bg-[hsl(var(--state-error))] !text-[hsl(var(--text-on-accent))]',
};

/**
 * Wee actions on the space-rail clock — glass pill + press spring.
 */
function WeeButton({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  children,
  ...rest
}) {
  const { osReduced, prefs } = useMotionFeedback();
  const reducedMotion = Boolean(osReduced) || prefs?.master === false;
  const press = createWeeTransition('press', { reducedMotion });

  return (
    <WeeGlassPill
      as="button"
      motion
      type={type}
      disabled={disabled}
      whileHover={
        reducedMotion || disabled
          ? undefined
          : { scale: PLAYFUL_AMPLITUDE.hoverScale, y: PLAYFUL_AMPLITUDE.hoverLiftY }
      }
      whileTap={reducedMotion || disabled ? undefined : { scale: PLAYFUL_AMPLITUDE.pressScale }}
      transition={press}
      className={`inline-flex items-center justify-center rounded-full font-black uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-50 ${
        SIZE_CLASS[size] || SIZE_CLASS.md
      } ${VARIANT_CLASS[variant] || VARIANT_CLASS.secondary} ${className}`.trim()}
      {...rest}
    >
      {children}
    </WeeGlassPill>
  );
}

WeeButton.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  disabled: PropTypes.bool,
  type: PropTypes.string,
  children: PropTypes.node,
};

export default WeeButton;
