import React from 'react';
import PropTypes from 'prop-types';

/**
 * Icon tile + title row (behavior section headers).
 */
function WeeIconHeadingRow({ icon: Icon, title, iconClassName = 'text-[hsl(var(--primary))]' }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      {Icon ? (
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--surface-secondary))] shadow-[var(--shadow-sm)] ${iconClassName}`}
        >
          <Icon size={22} strokeWidth={2} aria-hidden />
        </div>
      ) : null}
      <span className="font-black uppercase italic tracking-tight text-[hsl(var(--wee-text-header))]">
        {title}
      </span>
    </div>
  );
}

WeeIconHeadingRow.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  iconClassName: PropTypes.string,
};

export default WeeIconHeadingRow;
