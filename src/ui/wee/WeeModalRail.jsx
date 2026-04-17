import React from 'react';
import PropTypes from 'prop-types';

export function WeeModalRail({ children, className = '' }) {
  return (
    <div
      className={`hidden w-[min(20rem,28vw)] shrink-0 flex-col gap-8 border-r-[0.25rem] border-[hsl(var(--wee-border-rail))] bg-[hsl(var(--wee-surface-rail))] p-8 md:flex ${className}`.trim()}
    >
      {children}
    </div>
  );
}

WeeModalRail.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

export function WeeModalRailSection({ label, children }) {
  return (
    <div className="flex flex-col gap-3">
      {label ? (
        <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-[hsl(var(--wee-text-rail-muted))]">
          {label}
        </p>
      ) : null}
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

WeeModalRailSection.propTypes = {
  label: PropTypes.string,
  children: PropTypes.node,
};

export function WeeModalRailItem({ icon: Icon, title, subtitle, active, onClick, accent = 'primary' }) {
  const iconClass =
    accent === 'discovery'
      ? active
        ? 'text-[hsl(var(--wee-accent-discovery))]'
        : 'text-[hsl(var(--wee-text-rail-muted))] group-hover:text-[hsl(var(--text-secondary))]'
      : active
        ? 'text-[hsl(var(--primary))]'
        : 'text-[hsl(var(--wee-text-rail-muted))] group-hover:text-[hsl(var(--text-secondary))]';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-4 rounded-[var(--wee-radius-rail-item)] p-4 text-left transition-colors ${
        active
          ? 'bg-[hsl(var(--wee-surface-card))] text-[hsl(var(--wee-text-header))] shadow-[var(--wee-shadow-rail-active)]'
          : 'text-[hsl(var(--wee-text-rail-muted))] hover:bg-[hsl(var(--state-hover)/0.65)]'
      }`}
    >
      {Icon ? <Icon size={22} strokeWidth={2.2} className={`shrink-0 ${iconClass}`} aria-hidden /> : null}
      <div className="min-w-0">
        <p className="mb-1 text-[11px] font-black uppercase italic leading-none tracking-widest">{title}</p>
        {subtitle ? (
          <p className="text-[9px] font-bold uppercase opacity-70">{subtitle}</p>
        ) : null}
      </div>
    </button>
  );
}

WeeModalRailItem.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  active: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  accent: PropTypes.oneOf(['primary', 'discovery']),
};

WeeModalRailItem.defaultProps = {
  subtitle: '',
  active: false,
  accent: 'primary',
};
