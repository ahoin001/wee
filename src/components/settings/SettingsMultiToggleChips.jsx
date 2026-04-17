import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Multi-select chip row for settings (e.g. idle animation types). Token borders only.
 */
function SettingsMultiToggleChips({ items, selectedValues, onToggle, ariaLabel = 'Options' }) {
  const selected = Array.isArray(selectedValues) ? selectedValues : [];

  const handleKeyDown = useCallback(
    (e, value) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onToggle(value);
      }
    },
    [onToggle]
  );

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={ariaLabel}>
      {items.map(({ value, label }) => {
        const isOn = selected.includes(value);
        return (
          <button
            key={value}
            type="button"
            aria-pressed={isOn}
            onClick={() => onToggle(value)}
            onKeyDown={(e) => handleKeyDown(e, value)}
            className={`rounded-[var(--wee-radius-rail-item)] border px-3 py-2 text-[11px] font-black uppercase tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--primary))] ${
              isOn
                ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--wee-text-header))] shadow-[var(--wee-shadow-field)]'
                : 'border-[hsl(var(--wee-border-field))] bg-[hsl(var(--wee-surface-input))] text-[hsl(var(--text-secondary))] hover:border-[hsl(var(--wee-border-field-hover))] hover:bg-[hsl(var(--state-hover)/0.35)]'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

SettingsMultiToggleChips.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  selectedValues: PropTypes.arrayOf(PropTypes.string),
  onToggle: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string,
};

SettingsMultiToggleChips.defaultProps = {
  selectedValues: [],
  ariaLabel: 'Options',
};

export default React.memo(SettingsMultiToggleChips);
