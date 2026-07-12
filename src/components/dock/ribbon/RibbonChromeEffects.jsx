import React, { useId, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useMotionFeedback } from '../../../hooks/useMotionFeedback';
import { useAnimationActivity } from '../../../hooks/useAnimationActivity';
import {
  RIBBON_VIEWBOX,
  RIBBON_SILHOUETTE_PATH,
  RIBBON_TOP_EDGE_PATH,
} from './ribbonSilhouette';
import './RibbonChromeEffects.css';

export const RIBBON_CHROME_EFFECTS = ['none', 'shimmer', 'pulse', 'neonTrace'];

/**
 * Path-masked chrome FX overlay (shimmer / pulse / neon edge-trace).
 * Sits above RibbonChrome, below accessories. pointer-events: none.
 */
function RibbonChromeEffects({
  effect = 'none',
  intensity = 0.55,
  speed = 1,
  glowColor,
}) {
  const uid = useId().replace(/:/g, '');
  const motion = useMotionFeedback();
  const motionOff = motion.osReduced || !motion.prefs?.master;
  const { shouldAnimate, isLowPowerMode } = useAnimationActivity({
    activeFps: 30,
    lowPowerFps: 12,
    inactiveFps: 4,
  });

  const mode = RIBBON_CHROME_EFFECTS.includes(effect) ? effect : 'none';
  const active = mode !== 'none' && !motionOff;
  const animate = active && shouldAnimate && !isLowPowerMode;

  const clampedIntensity = Math.min(1, Math.max(0, intensity ?? 0.55));
  const clampedSpeed = Math.min(2, Math.max(0.25, speed ?? 1));
  const durationSec = (2.4 / clampedSpeed).toFixed(2);

  const styleVars = useMemo(
    () => ({
      ['--ribbon-fx-intensity']: String(clampedIntensity),
      ['--ribbon-fx-duration']: `${durationSec}s`,
      ['--ribbon-fx-glow']: glowColor || 'hsl(var(--wii-blue))',
      ['--ribbon-fx-opacity']: String(0.25 + clampedIntensity * 0.55),
    }),
    [clampedIntensity, durationSec, glowColor]
  );

  if (!active) return null;

  const maskId = `ribbon-fx-mask-${uid}`;
  const shimmerId = `ribbon-fx-shimmer-${uid}`;
  const glowFilterId = `ribbon-fx-glow-${uid}`;

  return (
    <div
      className={`ribbon-chrome-effects pointer-events-none absolute inset-0 z-[1] ${
        animate ? 'ribbon-chrome-effects--animate' : 'ribbon-chrome-effects--static'
      }`}
      style={styleVars}
      aria-hidden
    >
      <svg
        className="h-full w-full"
        width="100%"
        height="100%"
        viewBox={RIBBON_VIEWBOX}
        preserveAspectRatio="none"
      >
        <defs>
          <mask id={maskId}>
            <rect width="1440" height="240" fill="black" />
            <path d={RIBBON_SILHOUETTE_PATH} fill="white" />
          </mask>
          <linearGradient id={shimmerId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="45%" stopColor="rgba(255,255,255,0)" />
            <stop
              offset="50%"
              stopColor={`rgba(255,255,255,${0.15 + clampedIntensity * 0.55})`}
            />
            <stop offset="55%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <filter id={glowFilterId} x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation={2 + clampedIntensity * 4} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {mode === 'shimmer' ? (
          <g mask={`url(#${maskId})`}>
            <rect
              className="ribbon-fx-shimmer-band"
              x="-720"
              y="0"
              width="2880"
              height="240"
              fill={`url(#${shimmerId})`}
              opacity={0.35 + clampedIntensity * 0.65}
            />
          </g>
        ) : null}

        {mode === 'pulse' ? (
          <g mask={`url(#${maskId})`}>
            <path
              className="ribbon-fx-pulse-fill"
              d={RIBBON_SILHOUETTE_PATH}
              fill={glowColor || 'hsl(var(--wii-blue))'}
              opacity={0.08 + clampedIntensity * 0.22}
            />
          </g>
        ) : null}

        {mode === 'neonTrace' ? (
          <g>
            <path
              className="ribbon-fx-neon-trace"
              d={RIBBON_TOP_EDGE_PATH}
              fill="none"
              stroke={glowColor || 'hsl(var(--wii-blue))'}
              strokeWidth={1.5 + clampedIntensity * 2.5}
              strokeLinecap="round"
              filter={`url(#${glowFilterId})`}
              pathLength={100}
              strokeDasharray={`${12 + clampedIntensity * 18} ${100 - (12 + clampedIntensity * 18)}`}
            />
          </g>
        ) : null}
      </svg>
    </div>
  );
}

RibbonChromeEffects.propTypes = {
  effect: PropTypes.oneOf(RIBBON_CHROME_EFFECTS),
  intensity: PropTypes.number,
  speed: PropTypes.number,
  glowColor: PropTypes.string,
};

export default React.memo(RibbonChromeEffects);
