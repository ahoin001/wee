import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Rail tab for Settings: emoji icon + labels, token accent (matches WeeModalRailItem layout).
 * `matchHint` shows why a tab matched a search (keyword path, e.g. "Ken Burns").
 */
function SettingsRailTabButton({ tab, isActive, onClick, matchHint = null }) {
  const handleClick = useCallback(() => onClick(tab.id), [onClick, tab.id]);

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={handleClick}
      className={`group flex w-full items-center gap-4 rounded-[var(--wee-radius-rail-item)] border-l-[0.25rem] p-4 text-left transition-colors ${
        isActive
          ? 'border-solid bg-[hsl(var(--wee-surface-card))] text-[hsl(var(--wee-text-header))] shadow-[var(--wee-shadow-rail-active)]'
          : 'border-transparent text-[hsl(var(--wee-text-rail-muted))] hover:bg-[hsl(var(--state-hover)/0.65)]'
      }`}
      style={
        isActive
          ? {
              borderLeftColor: tab.color,
            }
          : undefined
      }
    >
      <span className="text-xl leading-none" aria-hidden>
        {tab.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="mb-1 flex items-center gap-1.5 text-[length:var(--font-size-caption)] font-black uppercase italic leading-none tracking-widest">
          <span className="truncate">{tab.label}</span>
          {tab.beta ? (
            <span className="shrink-0 rounded-full bg-[hsl(var(--state-warning)/0.18)] px-1.5 py-0.5 text-[length:var(--font-size-micro)] not-italic tracking-[0.14em] text-[hsl(var(--state-warning))]">
              Beta
            </span>
          ) : null}
        </p>
        {matchHint ? (
          <p className="text-[length:var(--font-size-micro)] font-bold uppercase text-[hsl(var(--primary))]">
            Contains “{matchHint}”
          </p>
        ) : tab.description ? (
          <p className="text-[length:var(--font-size-micro)] font-bold uppercase text-[hsl(var(--wee-text-rail-muted))]">
            {tab.description}
          </p>
        ) : null}
      </div>
    </button>
  );
}

SettingsRailTabButton.propTypes = {
  tab: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired,
    color: PropTypes.string.isRequired,
    description: PropTypes.string,
    beta: PropTypes.bool,
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  matchHint: PropTypes.string,
};

export default SettingsRailTabButton;
