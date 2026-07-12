import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { m, useReducedMotion } from 'framer-motion';
import { createWeeTransition } from '../../design/weeMotion';

/**
 * Gooey pill-style download progress for the unified Update modal.
 * Transform/opacity only — spring width via layout-friendly scaleX from left.
 */
function WeeUpdateProgress({ progress = 0, label = 'Downloading…', indeterminate = false }) {
  const reducedMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0));
  const spring = useMemo(
    () => createWeeTransition('press', { reducedMotion: Boolean(reducedMotion) }),
    [reducedMotion]
  );

  return (
    <div className="mt-4 space-y-3" role="status" aria-live="polite">
      <div className="flex items-end justify-between gap-3">
        <p className="m-0 text-[11px] font-black uppercase tracking-[0.18em] text-[hsl(var(--wee-text-rail-muted))]">
          {label}
        </p>
        <p className="m-0 text-2xl font-black uppercase italic tracking-tighter text-[hsl(var(--primary))]">
          {indeterminate ? '…' : `${Math.round(clamped)}%`}
        </p>
      </div>

      <div
        className="relative h-5 w-full overflow-hidden rounded-[var(--radius-pill)] border-4 border-[hsl(var(--wee-pill-border))] bg-[hsl(var(--wee-pill-glass))] shadow-[var(--wee-pill-shadow)] backdrop-blur-xl"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : Math.round(clamped)}
        aria-label={label}
      >
        <m.div
          className="absolute inset-y-0 left-0 origin-left rounded-[inherit] bg-[hsl(var(--primary))]"
          style={{ width: '100%' }}
          initial={false}
          animate={
            indeterminate
              ? { scaleX: [0.12, 0.55, 0.22], x: ['0%', '40%', '0%'] }
              : { scaleX: Math.max(0.02, clamped / 100), x: 0 }
          }
          transition={
            indeterminate
              ? {
                  duration: reducedMotion ? 0.01 : 1.6,
                  repeat: reducedMotion ? 0 : Infinity,
                  ease: 'easeInOut',
                }
              : spring
          }
        />
        {/* Soft shine — reads as gooey glass, not a flat bar */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-[inherit] bg-[linear-gradient(180deg,hsl(var(--text-on-accent)/0.28),transparent)]"
          aria-hidden
        />
      </div>

      <p className="m-0 text-[12px] font-semibold text-[hsl(var(--text-secondary))]">
        {indeterminate
          ? 'Getting things ready…'
          : clamped >= 100
            ? 'Almost done — preparing installer…'
            : 'Stay in this window while the update downloads.'}
      </p>
    </div>
  );
}

WeeUpdateProgress.propTypes = {
  progress: PropTypes.number,
  label: PropTypes.string,
  indeterminate: PropTypes.bool,
};

export default WeeUpdateProgress;
