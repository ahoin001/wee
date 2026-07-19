import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { Listbox, Transition } from '@headlessui/react';

const playfulButtonClasses = `
    relative w-full
    bg-[hsl(var(--surface-primary))]
    border-[var(--control-border-width-playful)] border-[hsl(var(--border-primary))]
    text-[hsl(var(--text-primary))]
    rounded-[var(--control-radius-playful)]
    shadow-[var(--playful-inner-glow)]
    transition-all duration-[var(--control-transition-duration)] ease-[var(--control-ease)]
    hover:border-[hsl(var(--border-secondary))] hover:-translate-y-[1px]
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-[hsl(var(--wii-blue))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--surface-primary))]
    focus:border-[hsl(var(--wii-blue))]
  `;

/** Wee modal / hub — mirrors WInput's `wee` variant field well so selects read as inputs. */
const weeButtonClasses = `
    relative w-full cursor-pointer
    border border-[hsl(var(--wee-border-field))] bg-[hsl(var(--wee-surface-input))]
    text-[hsl(var(--text-primary))]
    rounded-[var(--radius-lg)]
    shadow-[var(--wee-shadow-field)]
    transition-[border-color,box-shadow] duration-[var(--control-transition-duration)] ease-[var(--control-ease)]
    hover:border-[hsl(var(--wee-border-field-hover))]
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:border-[hsl(var(--border-accent))] focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]
  `;

const playfulOptionsClasses =
  'absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-[var(--control-radius-playful)] bg-[hsl(var(--surface-primary))] py-1 shadow-[var(--playful-shadow-elevated)] border-[var(--control-border-width-playful)] border-[hsl(var(--border-primary))] focus:outline-none';

const weeOptionsClasses =
  'absolute z-10 mt-1.5 max-h-60 w-full overflow-auto rounded-[var(--radius-lg)] bg-[hsl(var(--wee-surface-card))] py-1.5 shadow-[var(--shadow-lg)] border border-[hsl(var(--wee-border-field))] focus:outline-none';

const WSelect = ({ 
  options = [],
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  error = false,
  className = '',
  variant = 'playful',
  label,
  helperText,
  required = false,
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isWee = variant === 'wee';

  const baseClasses = isWee ? weeButtonClasses : playfulButtonClasses;

  const errorClasses = error ? 'border-[hsl(var(--state-error))]' : '';

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className="w-full">
      {label && (
        <label className="playful-system-label mb-2 block text-[hsl(var(--text-secondary))]">
          {label}
          {required && <span className="text-[hsl(var(--state-error))] ml-1">*</span>}
        </label>
      )}
      
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <Listbox.Button 
            className={`
              ${baseClasses} ${errorClasses} ${className}
              px-[var(--control-padding-x-playful)] py-[var(--control-padding-y-playful)] pr-12 text-left text-[length:var(--control-font-size)] font-black
            `}
            {...props}
          >
            <span className={`block truncate ${selectedOption ? 'text-[hsl(var(--text-primary))]' : 'text-[hsl(var(--text-tertiary))]'}`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-200 ${
                  isWee
                    ? 'bg-[hsl(var(--surface-secondary))] text-[hsl(var(--text-secondary))]'
                    : 'text-[hsl(var(--text-tertiary))]'
                } ${isOpen ? 'rotate-180' : ''}`}
              >
                <svg 
                  className="h-4 w-4"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </span>
          </Listbox.Button>
          
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            onEnter={() => setIsOpen(true)}
            onLeave={() => setIsOpen(false)}
          >
            <Listbox.Options className={isWee ? weeOptionsClasses : playfulOptionsClasses}>
              {options.map((option) => (
                <Listbox.Option
                  key={option.value}
                  className={({ active, selected }) => `
                    relative cursor-pointer select-none py-3 px-4 text-base font-bold
                    ${active 
                      ? 'playful-gooey-highlight text-[hsl(var(--text-primary))]' 
                      : 'text-[hsl(var(--text-primary))]'
                    }
                    ${selected ? 'playful-gooey-highlight text-[hsl(var(--text-primary))]' : ''}
                  `}
                  value={option.value}
                >
                  {({ selected, active }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                        {option.label}
                      </span>
                      {selected && (
                        <span className={`absolute inset-y-0 right-0 flex items-center pr-4 ${active ? 'text-[hsl(var(--text-on-accent))]' : 'text-[hsl(var(--wii-blue))]'}`}>
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
      
      {helperText && (
        <p className={`mt-2 text-sm ${error ? 'text-[hsl(var(--state-error))]' : 'text-[hsl(var(--text-tertiary))]'}`}>
          {helperText}
        </p>
      )}
    </div>
  );
};

WSelect.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
  })).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['playful', 'wee']),
  label: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
};

export default WSelect; 