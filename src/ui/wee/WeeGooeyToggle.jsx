import React from 'react';
import PropTypes from 'prop-types';
import { Field, Label, Switch } from '@headlessui/react';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';
import { LiquidToggleThumb } from '../WToggle';

/**
 * Toggle on the space-rail clock: pill-glass track, primary when on, liquid thumb.
 */
function WeeGooeyToggle({
  checked,
  onChange,
  label,
  disabled = false,
  disableLabelClick = false,
  style,
  containerClassName = '',
  disabledHint,
  title,
  ...props
}) {
  const { iconTilt, osReduced, prefs } = useMotionFeedback();
  const reducedMotion = Boolean(osReduced) || prefs?.master === false;
  const tooltip = disabled && disabledHint ? disabledHint : title;

  return (
    <Field
      as="div"
      disabled={disabled}
      className={`flex items-center gap-2.5 ${containerClassName}`.trim()}
      style={style}
      title={tooltip || undefined}
    >
      <Switch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={`
          group relative flex h-[var(--toggle-track-height)] w-[var(--toggle-track-width)]
          cursor-pointer rounded-full p-0.5
          border-4 border-[hsl(var(--wee-pill-border))]
          backdrop-blur-xl shadow-[var(--wee-pill-shadow)]
          focus:outline-none focus-visible:shadow-[var(--shadow-hover-glow)]
          ${checked
            ? 'bg-[hsl(var(--primary))]'
            : 'bg-[hsl(var(--wee-pill-glass))]'}
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        `}
        {...props}
      >
        <LiquidToggleThumb
          checked={checked}
          reducedMotion={reducedMotion || disabled}
          iconTilt={Boolean(iconTilt)}
        />
      </Switch>
      {label ? (
        <Label
          passive={disableLabelClick}
          className={`text-[0.68rem] font-black uppercase tracking-[0.08em] ${
            disabled
              ? 'cursor-not-allowed text-[hsl(var(--text-tertiary))]'
              : disableLabelClick
                ? 'cursor-default text-[hsl(var(--text-primary))]'
                : 'cursor-pointer text-[hsl(var(--text-primary))]'
          }`}
        >
          {label}
        </Label>
      ) : null}
    </Field>
  );
}

WeeGooeyToggle.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  disabled: PropTypes.bool,
  disableLabelClick: PropTypes.bool,
  style: PropTypes.object,
  containerClassName: PropTypes.string,
  disabledHint: PropTypes.string,
  title: PropTypes.string,
};

export default WeeGooeyToggle;
