import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

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
  label,
  helperText,
  required = false,
  ...props 
}, ref) => {
  const baseClasses = `
    w-full px-4 py-3 text-base font-medium
    bg-[hsl(var(--surface-secondary))] 
    border border-[hsl(var(--border-primary))]
    text-[hsl(var(--text-primary))]
    placeholder-[hsl(var(--text-tertiary))]
    rounded-lg
    transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
    focus:outline-none focus:ring-2 focus:ring-[hsl(var(--wii-blue))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--surface-primary))]
    focus:border-[hsl(var(--wii-blue))]
    hover:border-[hsl(var(--border-secondary))]
    disabled:opacity-50 disabled:cursor-not-allowed
    disabled:bg-[hsl(var(--surface-tertiary))]
  `;

  const errorClasses = error ? 'border-[hsl(var(--state-error))] focus:ring-[hsl(var(--state-error))]' : '';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-[hsl(var(--text-primary))] mb-2">
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
        className={`${baseClasses} ${errorClasses} ${className}`}
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
  label: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
};

export default WInput; 