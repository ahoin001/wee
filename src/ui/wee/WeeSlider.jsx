import React from 'react';
import PropTypes from 'prop-types';

/**
 * Range input styled for wee modal surfaces (tokens only — see design-system.css).
 */
function WeeSlider({
  value,
  min,
  max,
  step,
  onChange,
  disabled = false,
  className = '',
  id,
  'aria-label': ariaLabel,
}) {
  return (
    <input
      id={id}
      type="range"
      aria-label={ariaLabel}
      disabled={disabled}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`h-2 w-full cursor-pointer appearance-none rounded-full bg-[hsl(var(--wee-surface-well))] accent-[hsl(var(--primary))] disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
    />
  );
}

WeeSlider.propTypes = {
  value: PropTypes.number.isRequired,
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  step: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  id: PropTypes.string,
  'aria-label': PropTypes.string,
};

WeeSlider.defaultProps = {
  step: 1,
  disabled: false,
  className: '',
};

export default WeeSlider;
