import React from 'react';
import PropTypes from 'prop-types';
import WeeButton from './WeeButton';

/**
 * Alias of {@link WeeButton} — labeled chrome uses the same squircle action.
 */
function WeeSpaceRailPillButton({ active = false, ...rest }) {
  return <WeeButton variant="secondary" active={active} {...rest} />;
}

WeeSpaceRailPillButton.propTypes = {
  type: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  children: PropTypes.node,
  disabled: PropTypes.bool,
  active: PropTypes.bool,
};

export default WeeSpaceRailPillButton;
