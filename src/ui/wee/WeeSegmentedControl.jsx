import React, { useId } from 'react';
import PropTypes from 'prop-types';
import { LayoutGroup } from 'framer-motion';
import { createWeeTransition } from '../../design/weeMotion';
import { useWeeMotion } from '../../design/weeMotion';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';
import { PLAYFUL_AMPLITUDE } from '../../design/playfulMotion';
import WeeGlassPill from './WeeGlassPill';
import WeeLayoutActiveDisc, { WEE_LIQUID_ROOT_ATTR } from './WeeLayoutActiveDisc';

const SQUIRCLE = 'rounded-[var(--control-radius-playful)]';

/**
 * Space-rail cells — one glass squircle per option, traveling liquid disc.
 * Not a stadium capsule of oval chips.
 */
function WeeSegmentedControl({
  value,
  onChange,
  options,
  ariaLabel,
  className = '',
  size = 'md',
  wrap = false,
  disabled = false,
  layoutId = 'weeSegmentedActive',
  onDisabledOption,
}) {
  const baseId = useId();
  const { reducedMotion } = useWeeMotion();
  const { osReduced, prefs } = useMotionFeedback();
  const motionOff = Boolean(reducedMotion || osReduced || prefs?.master === false);
  const press = createWeeTransition('press', { reducedMotion: motionOff });
  const pad = size === 'sm'
    ? 'px-3.5 py-2 text-[length:var(--font-size-micro)]'
    : 'px-5 py-2.5 text-[length:var(--font-size-micro)] md:px-6';

  const layoutClass = wrap
    ? 'flex w-full max-w-full flex-wrap gap-2'
    : 'inline-flex flex-wrap gap-2';

  return (
    <LayoutGroup id={layoutId}>
      <div
        role="group"
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
        {...{ [WEE_LIQUID_ROOT_ATTR]: '' }}
        className={`relative ${layoutClass} ${className}`.trim()}
      >
        {options.map((opt) => {
          const selected = opt.value === value;
          const optionDisabled = disabled || opt.disabled;
          const softDisable = Boolean(optionDisabled && onDisabledOption);
          const id = `${baseId}-${opt.value}`;
          return (
            <WeeGlassPill
              key={String(opt.value)}
              as="button"
              motion
              id={id}
              type="button"
              aria-pressed={selected}
              aria-disabled={optionDisabled || undefined}
              disabled={optionDisabled && !softDisable}
              title={opt.title}
              whileHover={
                motionOff || optionDisabled
                  ? undefined
                  : { scale: PLAYFUL_AMPLITUDE.hoverScale, y: PLAYFUL_AMPLITUDE.hoverLiftY }
              }
              whileTap={
                motionOff || optionDisabled ? undefined : { scale: PLAYFUL_AMPLITUDE.pressScale }
              }
              transition={press}
              onClick={() => {
                if (optionDisabled) {
                  onDisabledOption?.(opt.value);
                  return;
                }
                onChange(opt.value);
              }}
              className={`relative overflow-hidden ${SQUIRCLE} font-black uppercase italic tracking-wide ${pad} ${
                selected
                  ? 'text-[hsl(var(--wee-text-header))] shadow-[var(--shadow-hover-glow)]'
                  : optionDisabled
                    ? 'cursor-not-allowed !bg-[hsl(var(--surface-wii-tint))] !text-[hsl(var(--text-secondary))]'
                    : 'text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--text-primary))] hover:shadow-[var(--shadow-hover-glow)]'
              }`}
            >
              {selected ? (
                <WeeLayoutActiveDisc
                  layoutId={layoutId}
                  reducedMotion={motionOff}
                  className={`${SQUIRCLE} !rounded-[var(--control-radius-playful)] bg-[hsl(var(--primary)/0.28)] shadow-[var(--shadow-hover-glow)]`}
                />
              ) : null}
              <span className="relative z-10">{opt.label}</span>
            </WeeGlassPill>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

WeeSegmentedControl.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      disabled: PropTypes.bool,
      title: PropTypes.string,
    })
  ).isRequired,
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md']),
  wrap: PropTypes.bool,
  disabled: PropTypes.bool,
  layoutId: PropTypes.string,
  onDisabledOption: PropTypes.func,
};

WeeSegmentedControl.defaultProps = {
  ariaLabel: 'Choose option',
  className: '',
  size: 'md',
  wrap: false,
  disabled: false,
  layoutId: 'weeSegmentedActive',
};

export default WeeSegmentedControl;
