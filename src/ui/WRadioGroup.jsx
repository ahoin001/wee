import React from 'react';
import PropTypes from 'prop-types';
import { RadioGroup } from '@headlessui/react';

const WRadioGroup = ({ 
  options = [],
  value,
  onChange,
  disabled = false,
  error = false,
  className = '',
  label,
  helperText,
  required = false,
  name,
  ...props 
}) => {
  return (
    <div className="w-full">
      <RadioGroup value={value} onChange={onChange} disabled={disabled} name={name} {...props}>
        {label && (
          <RadioGroup.Label className="block text-sm font-semibold text-[hsl(var(--text-primary))] mb-3">
            {label}
            {required && <span className="text-[hsl(var(--state-error))] ml-1">*</span>}
          </RadioGroup.Label>
        )}
        
        <div className={`space-y-3 ${className}`}>
          {options.map((option) => (
            <RadioGroup.Option
              key={option.value}
              value={option.value}
              className={({ active, checked, disabled }) => `
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                relative flex items-start p-4 rounded-lg border transition-all duration-200
                ${checked 
                  ? 'border-[hsl(var(--wii-blue))] bg-[hsl(var(--wii-blue))]/5' 
                  : 'border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))]'
                }
                ${active && !disabled ? 'ring-2 ring-[hsl(var(--wii-blue))] ring-offset-2 ring-offset-[hsl(var(--surface-primary))]' : ''}
                ${error ? 'border-[hsl(var(--state-error))]' : ''}
              `}
            >
              {({ checked, disabled }) => (
                <>
                  <div className="flex items-center h-5">
                    <RadioGroup.Description as="div" className="flex items-center">
                      <div className={`
                        w-4 h-4 border-2 rounded-full flex items-center justify-center
                        ${checked 
                          ? 'border-[hsl(var(--wii-blue))] bg-[hsl(var(--wii-blue))]' 
                          : 'border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-primary))]'
                        }
                        ${disabled ? 'opacity-50' : ''}
                      `}>
                        {checked && (
                          <div className="w-2 h-2 bg-[hsl(var(--text-inverse))] rounded-full" />
                        )}
                      </div>
                    </RadioGroup.Description>
                  </div>
                  <div className="ml-3 flex-1">
                    <RadioGroup.Label as="div" className={`
                      text-base font-medium
                      ${checked ? 'text-[hsl(var(--text-primary))]' : 'text-[hsl(var(--text-primary))]'}
                      ${disabled ? 'opacity-50' : ''}
                    `}>
                      {option.label}
                    </RadioGroup.Label>
                    {option.description && (
                      <RadioGroup.Description as="div" className={`
                        text-sm mt-1
                        ${checked ? 'text-[hsl(var(--text-secondary))]' : 'text-[hsl(var(--text-tertiary))]'}
                        ${disabled ? 'opacity-50' : ''}
                      `}>
                        {option.description}
                      </RadioGroup.Description>
                    )}
                  </div>
                </>
              )}
            </RadioGroup.Option>
          ))}
        </div>
        
        {helperText && (
          <p className={`mt-2 text-sm ${error ? 'text-[hsl(var(--state-error))]' : 'text-[hsl(var(--text-tertiary))]'}`}>
            {helperText}
          </p>
        )}
      </RadioGroup>
    </div>
  );
};

WRadioGroup.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
  })).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  className: PropTypes.string,
  label: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  name: PropTypes.string,
};

export default WRadioGroup; 