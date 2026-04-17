import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

const playfulBaseClasses = `
    w-full px-[var(--control-padding-x-playful)] py-[var(--control-padding-y-playful)] text-[length:var(--control-font-size)] font-black tracking-[0.01em]
    bg-[hsl(var(--surface-primary))]
    border-[var(--control-border-width-playful)] border-[hsl(var(--border-primary))]
    text-[hsl(var(--text-primary))]
    placeholder-[hsl(var(--text-tertiary))]
    rounded-[var(--control-radius-playful)]
    shadow-[var(--playful-inner-glow)]
    transition-all duration-[var(--control-transition-duration)] ease-[var(--control-ease)]
    focus:outline-none focus:ring-2 focus:ring-[hsl(var(--wii-blue))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--surface-primary))]
    focus:border-[hsl(var(--wii-blue))]
    hover:border-[hsl(var(--border-secondary))] hover:-translate-y-[1px]
    disabled:opacity-50 disabled:cursor-not-allowed
    disabled:bg-[hsl(var(--surface-tertiary))]
  `;

/** Wee modal / hub — #F8FAFC well, soft border (reference panels). */
const weeBaseClasses = `
    w-full px-[var(--control-padding-x-playful)] py-[var(--control-padding-y-playful)] text-[length:var(--control-font-size)] font-black tracking-[0.01em]
    border border-[hsl(var(--wee-border-field))] bg-[hsl(var(--wee-surface-input))]
    text-[hsl(var(--text-primary))]
    placeholder-[hsl(var(--text-tertiary))]
    rounded-[var(--radius-lg)]
    shadow-[var(--wee-shadow-field)]
    transition-[border-color,box-shadow] duration-[var(--control-transition-duration)] ease-[var(--control-ease)]
    focus:outline-none focus:border-[hsl(var(--border-accent))] focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]
    hover:border-[hsl(var(--wee-border-field-hover))]
    disabled:opacity-50 disabled:cursor-not-allowed
    disabled:bg-[hsl(var(--surface-tertiary))]
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
  const baseClasses = variant === 'wee' ? weeBaseClasses : playfulBaseClasses;

  const errorClasses = error ? 'border-[hsl(var(--state-error))] focus:ring-[hsl(var(--state-error))]' : '';

  return (
    <div className="w-full">
      {label && (
        <label className="playful-system-label mb-2 block text-[hsl(var(--text-secondary))]">
          {label}
          {required && <span className="text-[hsl(var(--state-error))] ml-1">*</span>}
        </label>
      )}
      
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        className={clsx(baseClasses, errorClasses, className)}
        {...props}
      />
      
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