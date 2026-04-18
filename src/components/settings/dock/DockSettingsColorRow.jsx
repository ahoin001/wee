import React from 'react';
import PropTypes from 'prop-types';
import Text from '../../../ui/Text';

/** Classic / ribbon color row — color input is allowed (API / persisted settings). */
function DockSettingsColorRow({ label, value, fallback, onChange }) {
  const resolvedValue = value ?? fallback;
  return (
    <div className="surface-row">
      <Text variant="body" className="surface-color-label">
        {label}
      </Text>
      <input
        type="color"
        value={resolvedValue}
        onChange={(e) => onChange(e.target.value)}
        className="surface-color-input"
      />
      <Text variant="caption" className="surface-caption !mt-0">
        {resolvedValue.toUpperCase()}
      </Text>
    </div>
  );
}

DockSettingsColorRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  fallback: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default React.memo(DockSettingsColorRow);
