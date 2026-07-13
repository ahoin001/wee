import React from 'react';
import PropTypes from 'prop-types';
import WeeContentCollapse from './WeeContentCollapse';

/**
 * Semantic form helper: morph height when a condition becomes true
 * (e.g. toggle reveals sliders). Thin wrapper over {@link WeeContentCollapse}.
 */
function WeeRevealWhen({
  when,
  children,
  className = '',
  id,
  role,
  keepMounted = true,
  'aria-labelledby': ariaLabelledBy,
}) {
  return (
    <WeeContentCollapse
      open={Boolean(when)}
      className={className}
      id={id}
      role={role}
      keepMounted={keepMounted}
      aria-labelledby={ariaLabelledBy}
    >
      {children}
    </WeeContentCollapse>
  );
}

WeeRevealWhen.propTypes = {
  when: PropTypes.any,
  children: PropTypes.node,
  className: PropTypes.string,
  id: PropTypes.string,
  role: PropTypes.string,
  keepMounted: PropTypes.bool,
  'aria-labelledby': PropTypes.string,
};

WeeRevealWhen.defaultProps = {
  when: false,
  children: null,
  className: '',
  id: undefined,
  role: undefined,
  keepMounted: true,
  'aria-labelledby': undefined,
};

export default React.memo(WeeRevealWhen);
