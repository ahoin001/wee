import React, { forwardRef, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { useWeeMotion } from '../../design/weeMotion';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';
import WeeGlassPill from './WeeGlassPill';
import WeePillFloorShadow from './WeePillFloorShadow';
import WeeGlyphField from './WeeGlyphField';

const GLYPH_TYPES = new Set(['text', 'search', 'url', 'email', 'password']);

const LABEL_CLASS =
  'mb-2 block text-[0.68rem] font-black uppercase tracking-[0.08em] text-[hsl(var(--text-tertiary))]';

const INPUT_CLASS = `
  relative z-[1] w-full bg-transparent caret-[hsl(var(--text-primary))]
  px-[var(--control-padding-x-playful)] py-[var(--control-padding-y-playful)]
  text-[length:var(--control-font-size)] font-black tracking-[0.01em]
  text-[hsl(var(--text-primary))] placeholder-[hsl(var(--text-tertiary))]
  rounded-[var(--control-radius-lg)] border-0 focus:outline-none
  disabled:cursor-not-allowed
`;

/**
 * Text field on the space-rail clock: glass well, floor shadow, pillOpen on focus.
 */
const WeeGooeyField = forwardRef(function WeeGooeyField(
  {
    type = 'text',
    placeholder,
    value,
    onChange,
    onFocus,
    onBlur,
    disabled = false,
    error = false,
    className = '',
    label,
    helperText,
    required = false,
    ...props
  },
  ref
) {
  const [focused, setFocused] = useState(false);
  const { pillOpen, pillClose } = useWeeMotion();
  const { osReduced, prefs } = useMotionFeedback();
  const reducedMotion = Boolean(osReduced) || prefs?.master === false;
  const glyphType = GLYPH_TYPES.has(type);
  const controlled = typeof value === 'string';
  const showGlyphs = focused && !disabled && glyphType && controlled && !reducedMotion;
  const masked = type === 'password';
  const revealed = focused && !disabled;

  const handleFocus = useCallback(
    (event) => {
      setFocused(true);
      onFocus?.(event);
    },
    [onFocus]
  );

  const handleBlur = useCallback(
    (event) => {
      setFocused(false);
      onBlur?.(event);
    },
    [onBlur]
  );

  return (
    <div className="w-full">
      {label ? (
        <label className={LABEL_CLASS}>
          {label}
          {required ? <span className="ml-1 text-[hsl(var(--state-error))]">*</span> : null}
        </label>
      ) : null}

      <div className="relative w-full">
        <WeePillFloorShadow expanded={revealed} reducedMotion={reducedMotion} />
        <WeeGlassPill
          motion
          initial={false}
          animate={
            reducedMotion
              ? { scale: 1 }
              : { scale: revealed ? 1.02 : 1 }
          }
          transition={revealed ? pillOpen : pillClose}
          className={`relative z-10 overflow-hidden rounded-[var(--control-radius-lg)] ${
            disabled
              ? '!border-[hsl(var(--border-primary)/0.42)] !bg-[hsl(var(--surface-wii-tint))]'
              : error
                ? 'border-[hsl(var(--state-error))]'
                : revealed
                  ? 'shadow-[var(--shadow-hover-glow)]'
                  : ''
          }`}
        >
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
            className={clsx(INPUT_CLASS, showGlyphs && 'text-transparent', className)}
            {...props}
          />
          <WeeGlyphField
            value={controlled ? value : ''}
            active={showGlyphs}
            masked={masked}
            reducedMotion={reducedMotion}
            className="px-[var(--control-padding-x-playful)] text-[length:var(--control-font-size)] font-black tracking-[0.01em] text-[hsl(var(--text-primary))]"
          />
        </WeeGlassPill>
      </div>

      {helperText ? (
        <p className={`mt-2 text-sm ${error ? 'text-[hsl(var(--state-error))]' : 'text-[hsl(var(--text-tertiary))]'}`}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

WeeGooeyField.propTypes = {
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  className: PropTypes.string,
  label: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
};

export default WeeGooeyField;
