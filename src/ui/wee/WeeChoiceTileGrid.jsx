import React from 'react';
import PropTypes from 'prop-types';

/**
 * Selectable tile grid (e.g. animation strategy). Uses buttons + aria-pressed.
 */
function WeeChoiceTileGrid({ value, onChange, items, icon: Icon, className = '' }) {
  return (
    <div
      role="group"
      className={`grid grid-cols-1 gap-4 sm:grid-cols-3 ${className}`.trim()}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={String(item.value)}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(item.value)}
            className={`flex flex-col items-center gap-4 rounded-[2.5rem] border-4 p-8 transition-all ${
              selected
                ? 'border-[hsl(var(--primary))] bg-[hsl(var(--surface-wii-tint)/0.65)]'
                : 'border-[hsl(var(--wee-border-card))] hover:border-[hsl(var(--border-secondary))]'
            }`}
          >
            {Icon ? (
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all ${
                  selected
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--text-on-accent))]'
                    : 'bg-[hsl(var(--surface-secondary))] text-[hsl(var(--text-tertiary))]'
                }`}
              >
                <Icon size={32} strokeWidth={1.8} aria-hidden />
              </div>
            ) : null}
            <div className="text-center">
              <p
                className={`font-black uppercase italic ${
                  selected ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--wee-text-header))]'
                }`}
              >
                {item.title}
              </p>
              {item.subtitle ? (
                <p className="mt-1 text-[10px] font-bold uppercase text-[hsl(var(--text-tertiary))]">
                  {item.subtitle}
                </p>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}

WeeChoiceTileGrid.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]).isRequired,
  onChange: PropTypes.func.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]).isRequired,
      title: PropTypes.string.isRequired,
      subtitle: PropTypes.string,
    })
  ).isRequired,
  icon: PropTypes.elementType,
  className: PropTypes.string,
};

WeeChoiceTileGrid.defaultProps = {
  icon: null,
  className: '',
};

export default WeeChoiceTileGrid;
