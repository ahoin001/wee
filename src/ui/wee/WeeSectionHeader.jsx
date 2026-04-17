import React from 'react';
import PropTypes from 'prop-types';

function WeeSectionHeader({ icon: Icon, label, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      {Icon ? (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--text-primary))] text-[hsl(var(--text-on-accent))] shadow-[var(--wee-shadow-rail-active)]">
          <Icon size={24} aria-hidden />
        </div>
      ) : null}
      <div className="min-w-0">
        <h2 className="m-0 text-xl font-black uppercase italic leading-none tracking-tight text-[hsl(var(--wee-text-header))]">
          {label}
        </h2>
      </div>
    </div>
  );
}

WeeSectionHeader.propTypes = {
  icon: PropTypes.elementType,
  label: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default WeeSectionHeader;
