import React, { useEffect, useId, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useMotionFeedback } from '../../../hooks/useMotionFeedback';
import { useAnimationActivity } from '../../../hooks/useAnimationActivity';
import {
  RIBBON_VIEWBOX,
  RIBBON_SILHOUETTE_PATH,
  RIBBON_SHINE_PATH,
  RIBBON_FULL_OUTLINE_PATH,
  sampleRibbonTopEdgePoints,
} from './ribbonSilhouette';
import {
  RIBBON_CHROME_EFFECTS,
  RIBBON_CHROME_HOVER_DAMPEN,
  RIBBON_CHROME_IDLE_DELAY_MS,
  isRibbonChromeEffectId,
} from './ribbonChromeEffectMeta';
import './RibbonChromeEffects.css';

export { RIBBON_CHROME_EFFECTS };

function glowToRgba(glowColor, alpha) {
  const a = Math.min(1, Math.max(0, alpha));
  if (!glowColor || typeof glowColor !== 'string') {
    return `rgba(90, 170, 255, ${a})`;
  }
  const hex = glowColor.trim();
  if (hex.startsWith('#') && (hex.length === 7 || hex.length === 4)) {
    let r;
    let g;
    let b;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else {
      r = parseInt(hex.slice(1, 3), 16);
      g = parseInt(hex.slice(3, 5), 16);
      b = parseInt(hex.slice(5, 7), 16);
    }
    if ([r, g, b].every((n) => Number.isFinite(n))) {
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
  }
  const rgb = hex.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) {
    return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${a})`;
  }
  // CSS vars / named colors: fall back to white-tinted highlight
  return `rgba(255, 255, 255, ${a})`;
}

const SPARKLE_POINTS = sampleRibbonTopEdgePoints(28).filter((_, i) => i % 3 === 0);

/**
 * Path-masked chrome FX overlay.
 * Sits above RibbonChrome, below accessories. pointer-events: none.
 */
function RibbonChromeEffects({
  effect = 'none',
  intensity = 0.55,
  speed = 1,
  glowColor,
  hovered = false,
  idleOnly = false,
}) {
  const uid = useId().replace(/:/g, '');
  const motion = useMotionFeedback();
  const motionOff = motion.osReduced || !motion.prefs?.master;
  const { shouldAnimate, isLowPowerMode } = useAnimationActivity({
    activeFps: 30,
    lowPowerFps: 12,
    inactiveFps: 4,
  });

  const [idleReady, setIdleReady] = useState(!idleOnly);

  useEffect(() => {
    if (!idleOnly) {
      setIdleReady(true);
      return undefined;
    }
    if (hovered) {
      setIdleReady(false);
      return undefined;
    }
    const t = window.setTimeout(() => setIdleReady(true), RIBBON_CHROME_IDLE_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [idleOnly, hovered]);

  const mode = isRibbonChromeEffectId(effect) ? effect : 'none';
  const active = mode !== 'none' && !motionOff;

  // Idle only: animate only after unhover delay. Otherwise always animate when allowed,
  // but dampen intensity while hovered so FX don't fight gooey buttons.
  const idlePaused = idleOnly && !idleReady;
  const animate =
    active && shouldAnimate && !isLowPowerMode && !idlePaused;

  const baseIntensity = Math.min(1, Math.max(0, intensity ?? 0.55));
  const hoverDampen = !idleOnly && hovered ? RIBBON_CHROME_HOVER_DAMPEN : 1;
  const clampedIntensity = baseIntensity * hoverDampen;
  const clampedSpeed = Math.min(2, Math.max(0.25, speed ?? 1));
  const durationSec = (2.4 / clampedSpeed).toFixed(2);
  const resolvedGlow = glowColor || 'hsl(var(--wii-blue))';

  const styleVars = useMemo(
    () => ({
      ['--ribbon-fx-intensity']: String(clampedIntensity),
      ['--ribbon-fx-duration']: `${durationSec}s`,
      ['--ribbon-fx-glow']: resolvedGlow,
      ['--ribbon-fx-opacity']: String(0.22 + clampedIntensity * 0.5),
    }),
    [clampedIntensity, durationSec, resolvedGlow]
  );

  const shimmerPeak = glowToRgba(resolvedGlow, 0.12 + clampedIntensity * 0.38);
  const shimmerMid = glowToRgba(resolvedGlow, 0.04 + clampedIntensity * 0.12);
  const auroraA = glowToRgba(resolvedGlow, 0.18 + clampedIntensity * 0.28);
  const auroraB = glowToRgba(resolvedGlow, 0.08 + clampedIntensity * 0.18);
  const scanAlpha = 0.06 + clampedIntensity * 0.16;
  const frostTint = glowToRgba('#c8e8ff', 0.1 + clampedIntensity * 0.28);
  const emberCore = glowToRgba(resolvedGlow, 0.2 + clampedIntensity * 0.35);

  if (!active) return null;

  const maskId = `ribbon-fx-mask-${uid}`;
  const shimmerId = `ribbon-fx-shimmer-${uid}`;
  const auroraId1 = `ribbon-fx-aurora-1-${uid}`;
  const auroraId2 = `ribbon-fx-aurora-2-${uid}`;
  const auroraId3 = `ribbon-fx-aurora-3-${uid}`;
  const glowFilterId = `ribbon-fx-glow-${uid}`;
  const softBlurId = `ribbon-fx-soft-${uid}`;
  const emberGradId = `ribbon-fx-ember-${uid}`;
  const neonDash = 10 + clampedIntensity * 16;
  const neonGap = Math.max(8, 100 - neonDash);

  const animClass = animate
    ? 'ribbon-chrome-effects--animate'
    : 'ribbon-chrome-effects--static';

  return (
    <div
      className={`ribbon-chrome-effects pointer-events-none absolute inset-0 z-[1] ${animClass}`}
      style={styleVars}
      aria-hidden
      data-ribbon-fx={mode}
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

          <linearGradient id={shimmerId} x1="0%" y1="8%" x2="100%" y2="28%">
            <stop offset="0%" stopColor={glowToRgba(resolvedGlow, 0)} />
            <stop offset="28%" stopColor={glowToRgba(resolvedGlow, 0)} />
            <stop offset="42%" stopColor={shimmerMid} />
            <stop offset="50%" stopColor={shimmerPeak} />
            <stop offset="58%" stopColor={shimmerMid} />
            <stop offset="72%" stopColor={glowToRgba(resolvedGlow, 0)} />
            <stop offset="100%" stopColor={glowToRgba(resolvedGlow, 0)} />
          </linearGradient>

          <linearGradient id={auroraId1} x1="0%" y1="0%" x2="100%" y2="40%">
            <stop offset="0%" stopColor={glowToRgba(resolvedGlow, 0)} />
            <stop offset="35%" stopColor={auroraA} />
            <stop offset="55%" stopColor={auroraB} />
            <stop offset="100%" stopColor={glowToRgba(resolvedGlow, 0)} />
          </linearGradient>
          <linearGradient id={auroraId2} x1="100%" y1="20%" x2="0%" y2="80%">
            <stop offset="0%" stopColor={glowToRgba('#a78bfa', 0)} />
            <stop offset="40%" stopColor={glowToRgba('#a78bfa', 0.12 + clampedIntensity * 0.2)} />
            <stop offset="70%" stopColor={glowToRgba(resolvedGlow, 0.08)} />
            <stop offset="100%" stopColor={glowToRgba('#a78bfa', 0)} />
          </linearGradient>
          <linearGradient id={auroraId3} x1="20%" y1="100%" x2="80%" y2="0%">
            <stop offset="0%" stopColor={glowToRgba('#34d399', 0)} />
            <stop offset="45%" stopColor={glowToRgba('#34d399', 0.08 + clampedIntensity * 0.14)} />
            <stop offset="100%" stopColor={glowToRgba('#34d399', 0)} />
          </linearGradient>

          <radialGradient id={emberGradId} cx="50%" cy="58%" r="42%">
            <stop offset="0%" stopColor={emberCore} />
            <stop offset="45%" stopColor={glowToRgba(resolvedGlow, 0.08 + clampedIntensity * 0.12)} />
            <stop offset="100%" stopColor={glowToRgba(resolvedGlow, 0)} />
          </radialGradient>

          <filter id={glowFilterId} x="-25%" y="-40%" width="150%" height="180%">
            <feGaussianBlur stdDeviation={2.5 + clampedIntensity * 4} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id={softBlurId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={8 + clampedIntensity * 10} />
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
              opacity={0.4 + clampedIntensity * 0.55}
            />
          </g>
        ) : null}

        {mode === 'pulse' ? (
          <g mask={`url(#${maskId})`}>
            <path
              className="ribbon-fx-pulse-fill"
              d={RIBBON_SILHOUETTE_PATH}
              fill={resolvedGlow}
              opacity={0.08 + clampedIntensity * 0.22}
            />
          </g>
        ) : null}

        {mode === 'neonTrace' ? (
          <g>
            <path
              className="ribbon-fx-neon-trace ribbon-fx-neon-trace--under"
              d={RIBBON_FULL_OUTLINE_PATH}
              fill="none"
              stroke={resolvedGlow}
              strokeWidth={3.5 + clampedIntensity * 3}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${glowFilterId})`}
              pathLength={100}
              strokeDasharray={`${neonDash} ${neonGap}`}
              opacity={0.35 + clampedIntensity * 0.35}
            />
            <path
              className="ribbon-fx-neon-trace"
              d={RIBBON_FULL_OUTLINE_PATH}
              fill="none"
              stroke={resolvedGlow}
              strokeWidth={1.2 + clampedIntensity * 1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={100}
              strokeDasharray={`${neonDash * 0.7} ${neonGap + neonDash * 0.3}`}
              opacity={0.75 + clampedIntensity * 0.25}
            />
          </g>
        ) : null}

        {mode === 'aurora' ? (
          <g mask={`url(#${maskId})`}>
            <rect
              className="ribbon-fx-aurora-band ribbon-fx-aurora-band--a"
              x="-480"
              y="0"
              width="2400"
              height="240"
              fill={`url(#${auroraId1})`}
              opacity={0.55 + clampedIntensity * 0.35}
            />
            <rect
              className="ribbon-fx-aurora-band ribbon-fx-aurora-band--b"
              x="-480"
              y="0"
              width="2400"
              height="240"
              fill={`url(#${auroraId2})`}
              opacity={0.4 + clampedIntensity * 0.3}
            />
            <rect
              className="ribbon-fx-aurora-band ribbon-fx-aurora-band--c"
              x="-480"
              y="0"
              width="2400"
              height="240"
              fill={`url(#${auroraId3})`}
              opacity={0.35 + clampedIntensity * 0.25}
            />
          </g>
        ) : null}

        {mode === 'ripple' ? (
          <g mask={`url(#${maskId})`}>
            <ellipse
              className="ribbon-fx-ripple ribbon-fx-ripple--1"
              cx="420"
              cy="130"
              rx={140 + clampedIntensity * 60}
              ry={50 + clampedIntensity * 25}
              fill={glowToRgba(resolvedGlow, 0.14 + clampedIntensity * 0.2)}
              filter={`url(#${softBlurId})`}
            />
            <ellipse
              className="ribbon-fx-ripple ribbon-fx-ripple--2"
              cx="780"
              cy="150"
              rx={160 + clampedIntensity * 50}
              ry={55 + clampedIntensity * 20}
              fill={glowToRgba(resolvedGlow, 0.1 + clampedIntensity * 0.16)}
              filter={`url(#${softBlurId})`}
            />
            <ellipse
              className="ribbon-fx-ripple ribbon-fx-ripple--3"
              cx="1100"
              cy="120"
              rx={120 + clampedIntensity * 40}
              ry={45 + clampedIntensity * 18}
              fill={glowToRgba('#ffffff', 0.06 + clampedIntensity * 0.1)}
              filter={`url(#${softBlurId})`}
            />
          </g>
        ) : null}

        {mode === 'edgeEmber' ? (
          <g mask={`url(#${maskId})`}>
            <rect
              className="ribbon-fx-ember-pool"
              x="0"
              y="0"
              width="1440"
              height="240"
              fill={`url(#${emberGradId})`}
              opacity={0.55 + clampedIntensity * 0.4}
            />
            <path
              className="ribbon-fx-ember-edge"
              d={RIBBON_FULL_OUTLINE_PATH}
              fill="none"
              stroke={resolvedGlow}
              strokeWidth={1 + clampedIntensity * 1.5}
              strokeLinecap="round"
              filter={`url(#${glowFilterId})`}
              opacity={0.35 + clampedIntensity * 0.4}
            />
          </g>
        ) : null}

        {mode === 'scanline' ? (
          <g mask={`url(#${maskId})`}>
            <rect
              className="ribbon-fx-scanline"
              x="0"
              y="-20"
              width="1440"
              height={6 + clampedIntensity * 8}
              fill={glowToRgba(resolvedGlow, scanAlpha)}
            />
          </g>
        ) : null}

        {mode === 'sparkle' ? (
          <g>
            {SPARKLE_POINTS.map((p, i) => (
              <circle
                key={`sp-${i}`}
                className={`ribbon-fx-sparkle ribbon-fx-sparkle--${i % 5}`}
                cx={p.x}
                cy={p.y}
                r={1.2 + (i % 3) * 0.55 + clampedIntensity * 0.8}
                fill={glowToRgba(resolvedGlow, 0.55 + clampedIntensity * 0.4)}
                style={{ ['--ribbon-fx-sparkle-delay']: `${(i % 7) * 0.18}s` }}
              />
            ))}
          </g>
        ) : null}

        {mode === 'frost' ? (
          <g mask={`url(#${maskId})`}>
            <path
              className="ribbon-fx-frost"
              d={RIBBON_SHINE_PATH}
              fill={frostTint}
              opacity={0.45 + clampedIntensity * 0.4}
            />
            <path
              className="ribbon-fx-frost ribbon-fx-frost--edge"
              d={RIBBON_SHINE_PATH}
              fill="none"
              stroke={glowToRgba('#e8f6ff', 0.35 + clampedIntensity * 0.35)}
              strokeWidth={1.5}
            />
          </g>
        ) : null}

        {mode === 'spectrum' ? (
          <g mask={`url(#${maskId})`}>
            <path
              className="ribbon-fx-spectrum"
              d={RIBBON_SILHOUETTE_PATH}
              fill={resolvedGlow}
              opacity={0.12 + clampedIntensity * 0.22}
            />
            <path
              className="ribbon-fx-spectrum ribbon-fx-spectrum--edge"
              d={RIBBON_FULL_OUTLINE_PATH}
              fill="none"
              stroke={resolvedGlow}
              strokeWidth={1.5 + clampedIntensity * 1.5}
              strokeLinecap="round"
              filter={`url(#${glowFilterId})`}
              opacity={0.45 + clampedIntensity * 0.4}
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
  hovered: PropTypes.bool,
  idleOnly: PropTypes.bool,
};

export default React.memo(RibbonChromeEffects);
