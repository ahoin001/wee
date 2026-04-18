import React from 'react';
import PropTypes from 'prop-types';

/**
 * Chunky horizontal sub-tabs for Dock settings (matches Channel board picker / tabseries tactility).
 */
function WeeDockSettingsSubtabs({ tabs, value, onChange, ariaLabel = 'Dock settings sections' }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex flex-wrap gap-3 border-b border-[hsl(var(--border-primary)/0.45)] pb-4"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            id={`dock-subtab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={`flex min-w-[min(100%,11rem)] flex-1 items-start gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors md:min-w-[10.5rem] md:px-5 md:py-3.5 ${
              selected
                ? 'border-[hsl(var(--primary))] bg-[hsl(var(--surface-wii-tint)/0.55)] shadow-[var(--shadow-sm)]'
                : 'border-[hsl(var(--wee-border-card))] bg-[hsl(var(--surface-primary))] hover:border-[hsl(var(--border-secondary))]'
            }`}
          >
            <div
              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                selected
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--text-on-accent))]'
                  : 'bg-[hsl(var(--surface-tertiary))] text-[hsl(var(--text-tertiary))]'
              }`}
            >
              {Icon ? <Icon size={20} strokeWidth={2.25} aria-hidden /> : null}
            </div>
            <span className="min-w-0">
              <span
                className={`block text-[11px] font-black uppercase italic leading-tight tracking-tight md:text-xs ${
                  selected ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--text-primary))]'
                }`}
              >
                {tab.label}
              </span>
              {tab.description ? (
                <span className="mt-1 block text-[9px] font-bold uppercase leading-snug tracking-wide text-[hsl(var(--text-tertiary))] md:text-[10px]">
                  {tab.description}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

WeeDockSettingsSubtabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      icon: PropTypes.elementType,
    })
  ).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string,
};

export default React.memo(WeeDockSettingsSubtabs);
