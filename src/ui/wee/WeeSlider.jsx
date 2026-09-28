import React, { useCallback, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { animate, m, useMotionValue, useTransform } from 'framer-motion';
import { createWeeTransition } from '../../design/weeMotion';
import { useMotionFeedback } from '../../hooks/useMotionFeedback';

const MotionDiv = m.div;
const STRETCH_PX = 12;
const THUMB_PX = 28;

function snapToStep(raw, min, max, step) {
  const span = max - min;
  if (!Number.isFinite(span) || span === 0) return min;
  const s = step > 0 ? step : 1;
  const steps = Math.round((raw - min) / s);
  const next = min + steps * s;
  return Math.min(max, Math.max(min, Number(next.toFixed(6))));
}

/**
 * Thick glass range on the space-rail clock.
 * Pointer tracks 1:1; the track stretches past the ends and springs home on pillClose.
 */
function WeeSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled = false,
  className = '',
  id,
  'aria-label': ariaLabel,
}) {
  const trackRef = useRef(null);
  const stretchAnimRef = useRef(null);
  const stretch = useMotionValue(0);
  const originX = useMotionValue(0.5);
  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const { osReduced, prefs } = useMotionFeedback();
  const reducedMotion = Boolean(osReduced) || prefs?.master === false;
  const scaleX = useTransform(stretch, (s) => {
    if (reducedMotion) return 1;
    return 1 + Math.min(STRETCH_PX, Math.abs(s)) / 180;
  });
  const press = createWeeTransition('press', { reducedMotion });

  const span = max - min;
  const ratio = span === 0 ? 0 : (Number(value) - min) / span;
  const clampedRatio = Math.min(1, Math.max(0, ratio));

  const applyPointer = useCallback(
    (clientX) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const width = rect.width || 1;
      const x = clientX - rect.left;
      const t = x / width;
      const over = x < 0 ? x : x > width ? x - width : 0;
      const visual = Math.max(-STRETCH_PX, Math.min(STRETCH_PX, over * 0.45));
      if (!reducedMotion) {
        stretch.set(visual);
        originX.set(over > 0 ? 0 : over < 0 ? 1 : 0.5);
      }
      const raw = min + Math.min(1, Math.max(0, t)) * (max - min);
      onChange(snapToStep(raw, min, max, step));
    },
    [max, min, onChange, originX, reducedMotion, step, stretch]
  );

  const release = useCallback(() => {
    draggingRef.current = false;
    setDragging(false);
    if (reducedMotion) {
      stretch.set(0);
      return;
    }
    const home = createWeeTransition('pillClose', { reducedMotion: false });
    stretchAnimRef.current = animate(stretch, 0, home);
    animate(originX, 0.5, home);
  }, [originX, reducedMotion, stretch]);

  const onPointerDown = (event) => {
    if (disabled) return;
    stretchAnimRef.current?.stop?.();
    draggingRef.current = true;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    applyPointer(event.clientX);
  };

  const onPointerMove = (event) => {
    if (!draggingRef.current) return;
    applyPointer(event.clientX);
  };

  const nudge = (direction) => {
    if (disabled) return;
    const s = step > 0 ? step : 1;
    onChange(snapToStep(Number(value) + direction * s, min, max, step));
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      nudge(1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      nudge(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      onChange(min);
    } else if (event.key === 'End') {
      event.preventDefault();
      onChange(max);
    }
  };

  const thumbLeft = `calc(${clampedRatio * 100}% - ${THUMB_PX / 2}px)`;

  return (
    <div
      id={id}
      ref={trackRef}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Number(value)}
      aria-disabled={disabled || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={release}
      onPointerCancel={release}
      onKeyDown={onKeyDown}
      className={`relative flex h-10 w-full cursor-pointer items-center touch-none focus-visible:outline-none focus-visible:shadow-[var(--shadow-hover-glow)] ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      } ${className}`.trim()}
    >
      <MotionDiv
        className="h-10 w-full overflow-hidden rounded-full border-4 border-[hsl(var(--wee-pill-border))] bg-[hsl(var(--wee-pill-glass))] shadow-[var(--wee-pill-shadow)] backdrop-blur-xl"
        style={{ scaleX, originX }}
      >
        <div
          className="h-full rounded-full bg-[hsl(var(--primary))] shadow-[var(--shadow-hover-glow)]"
          style={{ width: `${clampedRatio * 100}%` }}
        />
      </MotionDiv>
      <MotionDiv
        className="pointer-events-none absolute top-1/2 h-7 w-7 -translate-y-1/2 rounded-full border-4 border-[hsl(var(--wee-pill-border))] bg-[hsl(var(--primary))] shadow-[var(--shadow-hover-glow)]"
        style={{ left: thumbLeft, x: stretch }}
        animate={reducedMotion ? undefined : { scale: dragging ? 1.12 : 1 }}
        transition={press}
      />
    </div>
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
