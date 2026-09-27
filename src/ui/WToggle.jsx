import React, { useLayoutEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Field, Label, Switch } from '@headlessui/react';
import { animate, m, useMotionValue } from 'framer-motion';
import { useMotionFeedback } from '../hooks/useMotionFeedback';
import { assignLiquidEdgeSprings } from '../design/weeMotion';

const MotionSpan = m.span;

function LiquidToggleThumb({ checked, reducedMotion, iconTilt }) {
  const ref = useRef(null);
  const left = useMotionValue(0);
  const right = useMotionValue(0);
  const width = useMotionValue(0);
  const rotate = useMotionValue(0);

  useLayoutEffect(() => {
    const thumb = ref.current;
    const track = thumb?.parentElement;
    if (!thumb || !track) return undefined;

    const cs = getComputedStyle(track);
    const padL = parseFloat(cs.paddingLeft) || 0;
    const padR = parseFloat(cs.paddingRight) || 0;
    const thumbSize = thumb.offsetHeight || parseFloat(cs.getPropertyValue('--toggle-thumb-size')) || 20;
    const off = padL;
    const on = Math.max(off, track.clientWidth - padR - thumbSize);
    const targetLeft = checked ? on : off;
    const targetRight = targetLeft + thumbSize;
    const prevLeft = left.get();
    const prevRight = right.get() || prevLeft + thumbSize;
    const delta = targetLeft - prevLeft;
    const first = width.get() === 0;
    const edges = assignLiquidEdgeSprings(first ? 0 : delta, reducedMotion);
    const controls = [];

    if (first || reducedMotion) {
      left.set(targetLeft);
      right.set(targetRight);
      width.set(thumbSize);
    } else {
      left.set(prevLeft);
      right.set(prevRight);
      width.set(Math.max(thumbSize, prevRight - prevLeft));
      const syncWidth = () => width.set(Math.max(0, right.get() - left.get()));
      const unsubL = left.on('change', syncWidth);
      const unsubR = right.on('change', syncWidth);
      controls.push(animate(left, targetLeft, edges.start));
      controls.push(animate(right, targetRight, edges.end));
      controls.push({
        stop: () => {
          unsubL();
          unsubR();
        },
      });
    }

    controls.push(
      animate(rotate, !reducedMotion && iconTilt && checked ? -8 : 0, edges.start)
    );

    return () => {
      controls.forEach((control) => {
        try {
          control.stop();
        } catch {
          /* finished */
        }
      });
    };
  }, [checked, iconTilt, left, reducedMotion, right, rotate, width]);

  return (
    <MotionSpan
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 h-[var(--toggle-thumb-size)] rounded-[var(--radius-pill)] bg-[hsl(var(--surface-primary))] shadow-[var(--toggle-thumb-shadow)]"
      style={{ left, width, rotate, y: '-50%' }}
    />
  );
}

LiquidToggleThumb.propTypes = {
  checked: PropTypes.bool.isRequired,
  reducedMotion: PropTypes.bool,
  iconTilt: PropTypes.bool,
};

const WToggle = React.memo(
  ({
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
  }) => {
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
          group relative flex h-[var(--toggle-track-height)] w-[var(--toggle-track-width)] cursor-pointer rounded-[var(--toggle-track-radius)] p-0.5 ease-in-out focus:outline-none focus:ring-2 focus:ring-wii-blue focus:ring-offset-2 focus:ring-offset-surface-primary
          border-2 border-[hsl(var(--border-primary))]
          ${checked 
            ? 'bg-[hsl(var(--primary))] shadow-[var(--playful-shadow-active)]' 
            : 'bg-[hsl(var(--border-primary))] shadow-[var(--playful-inner-glow)]'
          }
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer transition-transform duration-200 hover:scale-[1.04]'
          }
        `}
        {...props}
      >
        <LiquidToggleThumb
          checked={checked}
          reducedMotion={reducedMotion || disabled}
          iconTilt={Boolean(iconTilt)}
        />
      </Switch>
      {label && (
        <Label
          passive={disableLabelClick}
          className={`
            text-[15px] font-medium
            ${disabled 
              ? 'text-[hsl(var(--text-tertiary))] cursor-not-allowed' 
              : disableLabelClick
                ? 'text-[hsl(var(--text-primary))] cursor-default'
                : 'text-[hsl(var(--text-primary))] cursor-pointer hover:text-[hsl(var(--text-accent))] transition-colors duration-200'
            }
          `}
        >
          {label}
        </Label>
      )}
    </Field>
  );
  },
);

WToggle.displayName = 'WToggle';

WToggle.propTypes = {
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

export default WToggle; 