import React from 'react';
import PropTypes from 'prop-types';

/**
 * Description block + trailing control (usually WToggle / WeeToggle).
 * Pass `descriptionClassName=""` when using `<Text />` or other rich body copy.
 */
function WeeDescriptionToggleRow({
  description,
  children,
  className = '',
  descriptionClassName = 'text-[11px] font-bold uppercase leading-relaxed',
}) {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 ${className}`.trim()}>
      <div
        className={`min-w-0 max-w-[85%] flex-1 text-[hsl(var(--text-tertiary))] ${descriptionClassName}`.trim()}
      >
        {description}
      </div>
      <div className="shrink-0 sm:pt-0.5">{children}</div>
    </div>
  );
}

WeeDescriptionToggleRow.propTypes = {
  description: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  descriptionClassName: PropTypes.string,
};

export default WeeDescriptionToggleRow;
