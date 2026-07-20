import React from 'react';
import PropTypes from 'prop-types';
import Slider from '../../ui/Slider';
import { WeeSliderValue } from '../../ui/wee';

/** Shared 0–1 intensity row for Scene FX settings cards. */
function SceneFxIntensityRow({ id, label, value, onChange }) {
  return (
    <div className="settings-wee-slider-row">
      <label className="settings-wee-slider-row__label" htmlFor={id}>
        {label}
      </label>
      <div className="min-w-0 flex-1">
        <Slider
          id={id}
          aria-label={label}
          min={0}
          max={1}
          step={0.05}
          value={value}
          onChange={onChange}
          containerClassName="!mb-0"
          hideValue
        />
      </div>
      <WeeSliderValue
        value={value}
        min={0}
        max={1}
        step={0.05}
        onChange={onChange}
        format={(v) => `${Math.round(v * 100)}`}
        suffix="%"
        aria-label={`${label} value`}
      />
    </div>
  );
}

SceneFxIntensityRow.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default React.memo(SceneFxIntensityRow);
