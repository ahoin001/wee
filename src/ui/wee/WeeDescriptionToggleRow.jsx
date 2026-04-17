import React from 'react';
import PropTypes from 'prop-types';

/**
 * Description block + trailing control (usually WToggle / WeeToggle).
 */
function WeeDescriptionToggleRow({ description, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 ${className}`.trim()}>
      <p className="max-w-[85%] text-[11px] font-bold uppercase leading-relaxed text-[hsl(var(--text-tertiary))]">
        {description}
      </p>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

WeeDescriptionToggleRow.propTypes = {
  description: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default WeeDescriptionToggleRow;
