import React from 'react';
import PropTypes from 'prop-types';
import WButton from '../WButton';

const VARIANT_MAP = {
  primary: 'primary',
  secondary: 'secondary',
  danger: 'danger-secondary',
};

/**
 * Wee-styled actions for modal footers (uppercase / tracking aligned with DLS).
 */
function WeeButton({ variant = 'primary', className = '', ...rest }) {
  return (
    <WButton
      variant={VARIANT_MAP[variant] || 'primary'}
      className={`!font-black !uppercase !tracking-widest !text-[11px] ${className}`.trim()}
      {...rest}
    />
  );
}

WeeButton.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger']),
  className: PropTypes.string,
};

export default WeeButton;
