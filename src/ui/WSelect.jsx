import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { Listbox, Transition } from '@headlessui/react';

const WSelect = ({ 
  options = [],
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  error = false,
  className = '',
  label,
  helperText,
  required = false,
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const baseClasses = `
    relative w-full
    bg-[hsl(var(--surface-secondary))] 
    border border-[hsl(var(--border-primary))]
    text-[hsl(var(--text-primary))]
    rounded-lg
    transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
    hover:border-[hsl(var(--border-secondary))]
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const errorClasses = error ? 'border-[hsl(var(--state-error))]' : '';

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-[hsl(var(--text-primary))] mb-2">
          {label}
          {required && <span className="text-[hsl(var(--state-error))] ml-1">*</span>}
        </label>
      )}
      
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <Listbox.Button 
            className={`
              ${baseClasses} ${errorClasses} ${className}
              px-4 py-3 text-left text-base font-medium
              focus:outline-none focus:ring-2 focus:ring-[hsl(var(--wii-blue))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--surface-primary))]
              focus:border-[hsl(var(--wii-blue))]
            `}
            {...props}
          >
            <span className={`block truncate ${selectedOption ? 'text-[hsl(var(--text-primary))]' : 'text-[hsl(var(--text-tertiary))]'}`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <svg 
                className={`h-5 w-5 text-[hsl(var(--text-tertiary))] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
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
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-[hsl(var(--surface-secondary))] py-1 shadow-[var(--shadow-lg)] border border-[hsl(var(--border-primary))] focus:outline-none">
              {options.map((option, index) => (
                <Listbox.Option
                  key={option.value}
                  className={({ active, selected }) => `
                    relative cursor-pointer select-none py-3 px-4 text-base
                    ${active 
                      ? 'bg-[hsl(var(--wii-blue))] text-[hsl(var(--text-inverse))]' 
                      : 'text-[hsl(var(--text-primary))]'
                    }
                    ${selected ? 'bg-[hsl(var(--wii-blue))] text-[hsl(var(--text-inverse))]' : ''}
                  `}
                  value={option.value}
                >
                  {({ selected, active }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                        {option.label}
                      </span>
                      {selected && (
                        <span className={`absolute inset-y-0 right-0 flex items-center pr-4 ${active ? 'text-[hsl(var(--text-inverse))]' : 'text-[hsl(var(--wii-blue))]'}`}>
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
  label: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
};

export default WSelect; 