import React from 'react';
import PropTypes from 'prop-types';

/**
 * Small uppercase section label (Wee DLS eyebrow).
 */
function WeeSectionEyebrow({ children, className = '', trackingClassName = 'tracking-[0.2em]' }) {
  return (
    <h4
      className={`text-[10px] font-black uppercase text-[hsl(var(--wee-text-rail-muted))] ${trackingClassName} ${className}`.trim()}
    >
      {children}
    </h4>
  );
}

WeeSectionEyebrow.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  trackingClassName: PropTypes.string,
};

export default WeeSectionEyebrow;
