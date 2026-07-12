import React from 'react';
import PropTypes from 'prop-types';

/**
 * Ribbon accessories layer (time pill, primary buttons, settings hosts).
 * Full-bleed absolute host so child absolute coords stay footer-relative.
 */
function RibbonAccessories({ children, className = '' }) {
  return (
    <div className={`ribbon-accessories absolute inset-0 z-20 ${className}`.trim()}>
      {children}
    </div>
  );
}

RibbonAccessories.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};

export default React.memo(RibbonAccessories);
