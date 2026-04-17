import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import Text from '../../ui/Text';
import WToggle from '../../ui/WToggle';
import WeeModalFieldCard from '../../ui/wee/WeeModalFieldCard';

/**
 * Clickable field card: tapping the row toggles; switch stops propagation.
 */
function SettingsToggleFieldCard({
  title,
  desc,
  checked,
  onChange,
  disabled,
  className = '',
  titleClassName = '',
  hoverAccent = 'primary',
  children,
}) {
  const toggle = useCallback(() => {
    if (!disabled) onChange(!checked);
  }, [checked, disabled, onChange]);

  const onKeyDown = useCallback(
    (e) => {
      if (disabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onChange(!checked);
      }
    },
    [checked, disabled, onChange]
  );

  return (
    <WeeModalFieldCard hoverAccent={hoverAccent} className={`p-0 overflow-hidden ${className}`.trim()} paddingClassName="p-0">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={toggle}
        onKeyDown={onKeyDown}
        className={`flex w-full cursor-pointer items-start gap-4 p-6 text-left transition-colors md:p-8 ${
          disabled
            ? 'cursor-not-allowed opacity-50'
            : 'hover:bg-[hsl(var(--state-hover)/0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--primary))]'
        }`}
      >
        <div className="min-w-0 flex-1">
          <Text variant="h3" className={clsx('m-0 text-[hsl(var(--text-primary))]', titleClassName)}>
            {title}
          </Text>
          {desc ? (
            <Text variant="desc" className="mt-1 block">
              {desc}
            </Text>
          ) : null}
          {children}
        </div>
        <div
          className="shrink-0 pt-0.5"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <WToggle checked={checked} onChange={onChange} disabled={disabled} disableLabelClick />
        </div>
      </div>
    </WeeModalFieldCard>
  );
}

SettingsToggleFieldCard.propTypes = {
  title: PropTypes.node.isRequired,
  desc: PropTypes.node,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  titleClassName: PropTypes.string,
  hoverAccent: PropTypes.oneOf(['none', 'primary', 'discovery']),
  children: PropTypes.node,
};

SettingsToggleFieldCard.defaultProps = {
  desc: null,
  disabled: false,
  className: '',
  titleClassName: '',
  hoverAccent: 'primary',
  children: null,
};

export default SettingsToggleFieldCard;
