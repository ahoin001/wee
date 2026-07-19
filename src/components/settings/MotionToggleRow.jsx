import React from 'react';
import PropTypes from 'prop-types';
import Text from '../../ui/Text';
import WToggle from '../../ui/WToggle';

/**
 * Shared labeled toggle row for motion / interaction settings.
 * Used by the Motion tab and the Channel style tab so channel-affecting
 * motion controls render identically in both places.
 */
function MotionToggleRow({ title, description, checked, onChange, disabled }) {
  return (
    <div
      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-[hsl(var(--border-primary)/0.35)] py-3 last:border-b-0 ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      <div className="min-w-0">
        <Text
          variant="body"
          className="text-[0.8125rem] font-black uppercase tracking-[0.08em] text-[hsl(var(--text-primary))]"
        >
          {title}
        </Text>
        {description ? (
          <Text variant="caption" className="!mt-1 block text-[hsl(var(--text-tertiary))]">
            {description}
          </Text>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center justify-end">
        <WToggle checked={checked} onChange={onChange} disabled={disabled} disableLabelClick />
      </div>
    </div>
  );
}

MotionToggleRow.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

MotionToggleRow.defaultProps = {
  description: null,
  disabled: false,
};

export default React.memo(MotionToggleRow);
