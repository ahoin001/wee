import React, { forwardRef, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { m } from 'framer-motion';
import { createWeeTransition } from '../design/weeMotion';
import { useMotionFeedback } from '../hooks/useMotionFeedback';
import WeeGlyphField from './wee/WeeGlyphField';

const MotionDiv = m.div;

const GLYPH_TYPES = new Set(['text', 'search', 'url', 'email', 'password']);

const playfulBaseClasses = `
    w-full px-[var(--control-padding-x-playful)] py-[var(--control-padding-y-playful)] text-[length:var(--control-font-size)] font-black tracking-[0.01em]
    bg-transparent
    border-[var(--control-border-width-playful)] border-transparent
    text-[hsl(var(--text-primary))]
    placeholder-[hsl(var(--text-tertiary))]
    rounded-[var(--control-radius-playful)]
    focus:outline-none
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

/** Wee modal / hub — soft well. The painted well sits behind the native field. */
const weeBaseClasses = `
    w-full px-[var(--control-padding-x-playful)] py-[var(--control-padding-y-playful)] text-[length:var(--control-font-size)] font-black tracking-[0.01em]
    border border-transparent bg-transparent
    text-[hsl(var(--text-primary))]
    placeholder-[hsl(var(--text-tertiary))]
    rounded-[var(--radius-lg)]
    focus:outline-none
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

const WInput = forwardRef(({
  type = 'text',
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  disabled = false,
  error = false,
  className = '',
  variant = 'playful',
  label,
  helperText,
  required = false,
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);
  const { osReduced, prefs } = useMotionFeedback();
  const reducedMotion = Boolean(osReduced) || prefs?.master === false;
  const press = createWeeTransition('press', { reducedMotion });
  const glyphType = GLYPH_TYPES.has(type);
  const controlled = typeof value === 'string';
  const showGlyphs = focused && !disabled && glyphType && controlled && !reducedMotion;
  const masked = type === 'password';
  const baseClasses = variant === 'wee' ? weeBaseClasses : playfulBaseClasses;
  const errorClasses = error ? 'border-[hsl(var(--state-error))]' : '';
  const wellClass = variant === 'wee'
    ? 'rounded-[var(--radius-lg)] border border-[hsl(var(--wee-border-field))] bg-[hsl(var(--wee-surface-input))] shadow-[var(--wee-shadow-field)]'
    : 'rounded-[var(--control-radius-playful)] border-[var(--control-border-width-playful)] border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-primary))] shadow-[var(--playful-inner-glow)]';

  const handleFocus = useCallback((event) => {
    setFocused(true);
    onFocus?.(event);
  }, [onFocus]);

  const handleBlur = useCallback((event) => {
    setFocused(false);
    onBlur?.(event);
  }, [onBlur]);

  return (
    <div className="w-full">
      {label && (
        <label className="playful-system-label mb-2 block text-[hsl(var(--text-secondary))]">
          {label}
          {required && <span className="text-[hsl(var(--state-error))] ml-1">*</span>}
        </label>
      )}

      <div className={`relative w-full ${disabled ? 'opacity-50' : ''}`}>
        <MotionDiv
          aria-hidden
          className={`pointer-events-none absolute inset-0 ${wellClass} ${
            error ? 'border-[hsl(var(--state-error))]' : ''
          } ${
            focused && variant === 'wee' && !error
              ? 'border-[hsl(var(--border-accent))]'
              : ''
          }`}
          initial={false}
          animate={
            reducedMotion
              ? { scale: 1 }
              : { scale: focused && !disabled ? 1.015 : 1 }
          }
          transition={press}
          style={{ transformOrigin: 'center center' }}
        />
        <input
          ref={ref}
          type={type}
          placeholder={showGlyphs && value ? '' : placeholder}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          className={clsx(
            'relative z-[1] caret-[hsl(var(--text-primary))]',
            baseClasses,
            errorClasses,
            showGlyphs && 'text-transparent',
            className
          )}
          {...props}
        />
        <WeeGlyphField
          value={controlled ? value : ''}
          active={showGlyphs}
          masked={masked}
          reducedMotion={reducedMotion}
          className={
            variant === 'wee'
              ? 'px-[var(--control-padding-x-playful)] text-[length:var(--control-font-size)] font-black tracking-[0.01em] text-[hsl(var(--text-primary))]'
              : 'px-[var(--control-padding-x-playful)] text-[length:var(--control-font-size)] font-black tracking-[0.01em] text-[hsl(var(--text-primary))]'
          }
        />
      </div>

      {helperText && (
        <p className={`mt-2 text-sm ${error ? 'text-[hsl(var(--state-error))]' : 'text-[hsl(var(--text-tertiary))]'}`}>
          {helperText}
        </p>
      )}
    </div>
  );
});

WInput.displayName = 'WInput';

WInput.propTypes = {
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['playful', 'wee']),
  label: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
};

export default WInput;
