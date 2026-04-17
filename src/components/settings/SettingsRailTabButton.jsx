import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Rail tab for Settings: emoji icon + labels, token accent (matches WeeModalRailItem layout).
 */
function SettingsRailTabButton({ tab, isActive, onClick }) {
  const handleClick = useCallback(() => onClick(tab.id), [onClick, tab.id]);

  return (
    <button
      type="button"
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
        <p className="mb-1 text-[11px] font-black uppercase italic leading-none tracking-widest">{tab.label}</p>
        {tab.description ? (
          <p className="text-[9px] font-bold uppercase opacity-70">{tab.description}</p>
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
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default SettingsRailTabButton;
