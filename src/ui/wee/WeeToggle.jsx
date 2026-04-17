import React from 'react';
import PropTypes from 'prop-types';
import WToggle from '../WToggle';

/** Wee modal wrapper — same behavior as WToggle; use inside cards with stopPropagation on the control. */
function WeeToggle({ containerClassName = '', ...rest }) {
  return <WToggle containerClassName={containerClassName} {...rest} />;
}

WeeToggle.propTypes = {
  containerClassName: PropTypes.string,
};

export default WeeToggle;
