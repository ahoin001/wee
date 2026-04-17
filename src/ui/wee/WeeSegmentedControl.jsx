import React, { useId } from 'react';
import PropTypes from 'prop-types';

/**
 * Pill segmented control — `role="group"` with `aria-pressed` per option.
 */
function WeeSegmentedControl({ value, onChange, options, ariaLabel, className = '', size = 'md', wrap = false }) {
  const baseId = useId();
  const pad = size === 'sm' ? 'px-4 py-2 text-[10px]' : 'px-6 py-2.5 text-[10px] md:px-8';

  const trackClass =
    'border border-[hsl(var(--wee-border-field))] bg-[hsl(var(--wee-surface-input))] shadow-[var(--wee-shadow-field)]';
  const layoutClass = wrap
    ? `flex w-full max-w-full flex-wrap gap-2 rounded-2xl ${trackClass} p-1.5`
    : `inline-flex rounded-2xl ${trackClass} p-1.5`;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`${layoutClass} ${className}`.trim()}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        const id = `${baseId}-${opt.value}`;
        return (
          <button
            key={String(opt.value)}
            id={id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(opt.value)}
            className={`rounded-xl font-black uppercase italic transition-all ${pad} ${
              selected
                ? 'bg-[hsl(var(--wee-surface-card))] text-[hsl(var(--wee-text-header))] shadow-[var(--shadow-sm)]'
                : 'text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--text-secondary))]'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

WeeSegmentedControl.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md']),
  wrap: PropTypes.bool,
};

WeeSegmentedControl.defaultProps = {
  ariaLabel: 'Choose option',
  className: '',
  size: 'md',
  wrap: false,
};

export default WeeSegmentedControl;
