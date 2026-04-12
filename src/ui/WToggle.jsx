import React from 'react';
import PropTypes from 'prop-types';
import { Switch } from '@headlessui/react';

const WToggle = React.memo(({ checked, onChange, label, disabled = false, disableLabelClick = false, style, containerClassName = '', ...props }) => {
  const handleLabelClick = () => {
    if (!disabled && !disableLabelClick && onChange) {
      onChange(!checked);
    }
  };

  return (
    <div className={`flex items-center gap-2.5 ${containerClassName}`.trim()} style={style}>
      <Switch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={`
          group relative flex h-[var(--toggle-track-height)] w-[var(--toggle-track-width)] cursor-pointer rounded-[var(--toggle-track-radius)] p-0.5 ease-in-out focus:outline-none focus:ring-2 focus:ring-wii-blue focus:ring-offset-2 focus:ring-offset-surface-primary
          ${checked 
            ? 'bg-[hsl(var(--wii-blue))]' 
            : 'bg-[hsl(var(--border-primary))]'
          }
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer'
          }
        `}
        {...props}
      >
        <span
          aria-hidden="true"
          className={`
            pointer-events-none inline-block h-[var(--toggle-thumb-size)] w-[var(--toggle-thumb-size)] rounded-[var(--radius-pill)] bg-[hsl(var(--surface-primary))] shadow-[var(--toggle-thumb-shadow)] ring-0 transition duration-220 ease-[cubic-bezier(.4,1.3,.5,1)]
            ${checked ? 'translate-x-[calc(var(--toggle-track-width)-var(--toggle-thumb-size)-4px)]' : 'translate-x-0'}
          `}
        />
      </Switch>
      {label && (
        <label 
          onClick={handleLabelClick}
          className={`
            text-[15px] font-medium
            ${disabled 
              ? 'text-[hsl(var(--text-tertiary))] cursor-not-allowed' 
              : disableLabelClick
                ? 'text-[hsl(var(--text-primary))] cursor-default'
                : 'text-[hsl(var(--text-primary))] cursor-pointer hover:text-[hsl(var(--text-accent))] transition-colors duration-200'
            }
          `}
        >
          {label}
        </label>
      )}
    </div>
  );
});

WToggle.displayName = 'WToggle';

WToggle.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  disabled: PropTypes.bool,
  disableLabelClick: PropTypes.bool,
  style: PropTypes.object,
  containerClassName: PropTypes.string,
};

export default WToggle; 