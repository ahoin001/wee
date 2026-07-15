import React, { useId } from 'react';
import PropTypes from 'prop-types';
import { LayoutGroup } from 'framer-motion';
import { useWeeMotion } from '../../design/weeMotion';
import WeeLayoutActiveDisc from './WeeLayoutActiveDisc';

/**
 * Pill segmented control — `role="group"` with `aria-pressed` per option.
 * Active option uses shared {@link WeeLayoutActiveDisc} (space-pill selection chrome).
 */
function WeeSegmentedControl({
  value,
  onChange,
  options,
  ariaLabel,
  className = '',
  size = 'md',
  wrap = false,
  disabled = false,
  layoutId = 'weeSegmentedActive',
}) {
  const baseId = useId();
  const { reducedMotion } = useWeeMotion();
  const pad = size === 'sm' ? 'px-4 py-2 text-[10px]' : 'px-6 py-2.5 text-[10px] md:px-8';

  const trackClass =
    'border border-[hsl(var(--wee-border-field))] bg-[hsl(var(--wee-surface-input))] shadow-[var(--wee-shadow-field)]';
  const layoutClass = wrap
    ? `flex w-full max-w-full flex-wrap gap-2 rounded-2xl ${trackClass} p-1.5`
    : `inline-flex rounded-2xl ${trackClass} p-1.5`;

  return (
    <LayoutGroup id={layoutId}>
      <div
        role="group"
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
        className={`${layoutClass} ${disabled ? 'opacity-50' : ''} ${className}`.trim()}
      >
        {options.map((opt) => {
          const selected = opt.value === value;
          const optionDisabled = disabled || opt.disabled;
          const id = `${baseId}-${opt.value}`;
          return (
            <button
              key={String(opt.value)}
              id={id}
              type="button"
              aria-pressed={selected}
              disabled={optionDisabled}
              title={opt.title}
              onClick={() => onChange(opt.value)}
              className={`relative rounded-xl font-black uppercase italic transition-colors ${pad} ${
                selected
                  ? 'text-[hsl(var(--wee-text-header))]'
                  : optionDisabled
                    ? 'cursor-not-allowed text-[hsl(var(--text-tertiary))] opacity-45'
                    : 'text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--text-secondary))]'
              }`}
            >
              {selected ? (
                <WeeLayoutActiveDisc
                  layoutId={layoutId}
                  reducedMotion={reducedMotion}
                  className="rounded-xl bg-[hsl(var(--wee-surface-card))] shadow-[var(--shadow-sm)]"
                />
              ) : null}
              <span className="relative z-10">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

WeeSegmentedControl.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      disabled: PropTypes.bool,
      title: PropTypes.string,
    })
  ).isRequired,
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md']),
  wrap: PropTypes.bool,
  disabled: PropTypes.bool,
  layoutId: PropTypes.string,
};

WeeSegmentedControl.defaultProps = {
  ariaLabel: 'Choose option',
  className: '',
  size: 'md',
  wrap: false,
  disabled: false,
  layoutId: 'weeSegmentedActive',
};

export default WeeSegmentedControl;
