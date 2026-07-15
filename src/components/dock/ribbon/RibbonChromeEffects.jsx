import React, { useId, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useShallow } from 'zustand/react/shallow';
import { useMotionFeedback } from '../../../hooks/useMotionFeedback';
import { useAnimationActivity } from '../../../hooks/useAnimationActivity';
import { useRibbonChromeIdleGate } from '../../../hooks/useRibbonChromeIdleGate';
import { useMusicReactiveLevels } from '../../../hooks/useMusicReactiveLevels';
import useConsolidatedAppStore from '../../../utils/useConsolidatedAppStore';
import {
  CSS_WII_BLUE,
  DEFAULT_RIBBON_GLOW_HEX,
} from '../../../design/runtimeColorStrings.js';
import {
  RIBBON_VIEWBOX,
  RIBBON_SILHOUETTE_PATH,
  RIBBON_SHINE_PATH,
  RIBBON_FULL_OUTLINE_PATH,
  RIBBON_TOP_EDGE_PATH,
  sampleRibbonTopEdgePoints,
} from './ribbonSilhouette';
import {
  RIBBON_CHROME_EFFECTS,
  RIBBON_CHROME_GLASS_INTENSITY_MULT,
  RIBBON_CHROME_GLASS_SOFT_MODES,
  RIBBON_CHROME_HOVER_DAMPEN,
  RIBBON_CHROME_DEFAULT_GLOW_STRENGTH,
  isRibbonChromeEffectId,
} from './ribbonChromeEffectMeta';
import './RibbonChromeEffects.css';

export { RIBBON_CHROME_EFFECTS };

/** Fallback RGB when glow is missing or unparsable (matches DEFAULT_RIBBON_GLOW_HEX). */
const FALLBACK_GLOW_RGB = [0, 153, 255];

function hslToRgb(h, s, l) {
  const hh = ((h % 360) + 360) % 360;
  const ss = Math.min(1, Math.max(0, s));
  const ll = Math.min(1, Math.max(0, l));
  const c = (1 - Math.abs(2 * ll - 1)) * ss;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = ll - c / 2;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (hh < 60) {
    rp = c;
    gp = x;
  } else if (hh < 120) {
    rp = x;
    gp = c;
  } else if (hh < 180) {
    gp = c;
    bp = x;
  } else if (hh < 240) {
    gp = x;
    bp = c;
  } else if (hh < 300) {
    rp = x;
    bp = c;
  } else {
    rp = c;
    bp = x;
  }
  return [
    Math.round((rp + m) * 255),
    Math.round((gp + m) * 255),
    Math.round((bp + m) * 255),
  ];
}

function parseGlowRgb(glowColor) {
  if (!glowColor || typeof glowColor !== 'string') {
    return FALLBACK_GLOW_RGB;
  }
  const raw = glowColor.trim();

  // Known ribbon token / CSS var wrappers → brand glow hex
  if (
    raw === CSS_WII_BLUE ||
    raw.includes('--wii-blue') ||
    raw.includes('var(--primary)')
  ) {
    return parseGlowRgb(DEFAULT_RIBBON_GLOW_HEX);
  }

  if (raw.startsWith('#') && (raw.length === 7 || raw.length === 4)) {
    let r;
    let g;
    let b;
    if (raw.length === 4) {
      r = parseInt(raw[1] + raw[1], 16);
      g = parseInt(raw[2] + raw[2], 16);
      b = parseInt(raw[3] + raw[3], 16);
    } else {
      r = parseInt(raw.slice(1, 3), 16);
      g = parseInt(raw.slice(3, 5), 16);
      b = parseInt(raw.slice(5, 7), 16);
    }
    if ([r, g, b].every((n) => Number.isFinite(n))) {
      return [r, g, b];
    }
  }

  const rgb = raw.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) {
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  }

  // hsl(195 75% 60%) or hsl(195, 75%, 60%)
  const hsl = raw.match(
    /hsla?\(\s*([-\d.]+)\s*[, ]\s*([-\d.]+)%\s*[, ]\s*([-\d.]+)%/i
  );
  if (hsl) {
    return hslToRgb(Number(hsl[1]), Number(hsl[2]) / 100, Number(hsl[3]) / 100);
  }

  return FALLBACK_GLOW_RGB;
}

function glowToRgba(glowColor, alpha) {
  const a = Math.min(1, Math.max(0, alpha));
  const [r, g, b] = parseGlowRgb(glowColor);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** Soft light-motes along the bow — fewer, calmer than a dense twinkle grid. */
const SPARKLE_MOTE_POINTS = sampleRibbonTopEdgePoints(36)
  .filter((_, i) => i % 4 === 0)
  .slice(1, -1)
  .map((p, i) => ({
    ...p,
    /** Sideways drift in viewBox px (gentle, like dock water drops). */
    driftX: ((i * 17) % 11) - 5,
    rise: 22 + ((i * 13) % 14),
    size: 1.6 + (i % 3) * 0.45,
    delay: (i % 9) * 0.55,
    life: 3.6 + (i % 5) * 0.45,
  }));
const FROST_CRYSTAL_POINTS = sampleRibbonTopEdgePoints(18).filter((_, i) => i % 2 === 0);
const NEON_STATIC_TIP = sampleRibbonTopEdgePoints(24)[10];

/** Short comet length as fraction of pathLength=100 — soft KH/Zelda tracer, not a long neon snake. */
function neonTrailLengths(intensity, glow) {
  const head = 4.5 + intensity * 3.5 + glow * 1.5;
  return {
    under: head * 1.65,
    core: head,
    white: head * 0.42,
  };
}

/**
 * Path-masked chrome FX overlay.
 * Sits above RibbonChrome, below accessories. pointer-events: none.
 */
function RibbonChromeEffects({
  effect = 'none',
  intensity = 0.55,
  speed = 1,
  glowStrength = RIBBON_CHROME_DEFAULT_GLOW_STRENGTH,
  glowColor,
  hovered = false,
  idleOnly = false,
  glassWiiRibbon = false,
}) {
  const uid = useId().replace(/:/g, '');
  const motion = useMotionFeedback();
  const motionOff = motion.osReduced || !motion.prefs?.master;
  const { shouldAnimate, isLowPowerMode } = useAnimationActivity({
    activeFps: 30,
    lowPowerFps: 12,
    inactiveFps: 4,
  });

  const idleReady = useRibbonChromeIdleGate(idleOnly, hovered);

  const mode = isRibbonChromeEffectId(effect) ? effect : 'none';
  const active = mode !== 'none' && !motionOff;
  const glassSoft =
    Boolean(glassWiiRibbon) && RIBBON_CHROME_GLASS_SOFT_MODES.includes(mode);

  // Idle only: animate only after unhover delay. Otherwise always animate when allowed,
  // but dampen intensity while hovered so FX don't fight gooey buttons.
  const idlePaused = idleOnly && !idleReady;
  const animate =
    active && shouldAnimate && !isLowPowerMode && !idlePaused;

  const nowPlaying = useConsolidatedAppStore(
    useShallow((s) => ({
      isPlaying: Boolean(s.nowPlaying?.isPlaying),
      progressMs: s.nowPlaying?.progressMs || 0,
      durationMs: s.nowPlaying?.durationMs || 0,
    }))
  );

  const musicLevels = useMusicReactiveLevels({
    isPlaying: nowPlaying.isPlaying,
    progressMs: nowPlaying.progressMs,
    durationMs: nowPlaying.durationMs,
    enabled: mode === 'musicBand' && animate,
    bandCount: 16,
  });

  const baseIntensity = Math.min(1, Math.max(0, intensity ?? 0.55));
  const glassBoost = glassSoft ? RIBBON_CHROME_GLASS_INTENSITY_MULT : 1;
  const hoverDampen = !idleOnly && hovered ? RIBBON_CHROME_HOVER_DAMPEN : 1;
  const clampedIntensity = Math.min(1, baseIntensity * glassBoost * hoverDampen);
  const clampedSpeed = Math.min(2, Math.max(0.25, speed ?? 1));
  const clampedGlow = Math.min(1, Math.max(0, glowStrength ?? RIBBON_CHROME_DEFAULT_GLOW_STRENGTH));
  const durationSec = (2.4 / clampedSpeed).toFixed(2);
  const resolvedGlow = glowColor || DEFAULT_RIBBON_GLOW_HEX;
  const opacityFloor = glassSoft ? 0.34 : 0.22;
  const opacitySpan = glassSoft ? 0.58 : 0.5;
  const neonTrails = neonTrailLengths(clampedIntensity, clampedGlow);
  /** Soft fairy-light tip — orb bloom, not a hard star spike. */
  const neonTipCore = 2.1 + clampedGlow * 2.2 + clampedIntensity * 0.7;
  const neonTipBloom = neonTipCore * (2.8 + clampedGlow * 1.4);
  const neonDurationSec = (3.6 / clampedSpeed).toFixed(2);

  const styleVars = useMemo(
    () => ({
      ['--ribbon-fx-intensity']: String(clampedIntensity),
      ['--ribbon-fx-duration']: `${durationSec}s`,
      ['--ribbon-fx-glow']: resolvedGlow,
      ['--ribbon-fx-opacity']: String(opacityFloor + clampedIntensity * opacitySpan),
      ['--ribbon-fx-neon-glow']: String(clampedGlow),
      ['--ribbon-fx-neon-duration']: `${neonDurationSec}s`,
    }),
    [
      clampedGlow,
      clampedIntensity,
      durationSec,
      neonDurationSec,
      opacityFloor,
      opacitySpan,
      resolvedGlow,
    ]
  );

  const shimmerPeak = glowToRgba(resolvedGlow, 0.12 + clampedIntensity * 0.38);
  const shimmerMid = glowToRgba(resolvedGlow, 0.04 + clampedIntensity * 0.12);
  const auroraA = glowToRgba(resolvedGlow, 0.28 + clampedIntensity * 0.42);
  const auroraB = glowToRgba(resolvedGlow, 0.14 + clampedIntensity * 0.28);
  const scanAlpha = (glassSoft ? 0.12 : 0.06) + clampedIntensity * (glassSoft ? 0.28 : 0.16);
  const frostTint = glowToRgba('#c8e8ff', 0.18 + clampedIntensity * 0.42);
  const frostVeil = glowToRgba('#dcefff', 0.12 + clampedIntensity * 0.28);
  const emberCore = glowToRgba(resolvedGlow, 0.2 + clampedIntensity * 0.35);
  const softBlurStd = glassSoft
    ? 4 + clampedIntensity * 5
    : 8 + clampedIntensity * 10;
  const pulseFillOpacity = (glassSoft ? 0.14 : 0.08) + clampedIntensity * (glassSoft ? 0.32 : 0.22);

  if (!active) return null;

  const maskId = `ribbon-fx-mask-${uid}`;
  const shimmerId = `ribbon-fx-shimmer-${uid}`;
  const auroraId1 = `ribbon-fx-aurora-1-${uid}`;
  const auroraId2 = `ribbon-fx-aurora-2-${uid}`;
  const auroraId3 = `ribbon-fx-aurora-3-${uid}`;
  const glowFilterId = `ribbon-fx-glow-${uid}`;
  const softBlurId = `ribbon-fx-soft-${uid}`;
  const emberGradId = `ribbon-fx-ember-${uid}`;
  const neonTipGlowId = `ribbon-fx-neon-tip-glow-${uid}`;
  const moteGlowId = `ribbon-fx-mote-glow-${uid}`;
  const neonCoreWidth = 1.15 + clampedIntensity * 0.85;
  const neonUnderWidth = neonCoreWidth * (2.8 + clampedGlow * 1.2);
  const neonWhiteWidth = Math.max(0.7, neonCoreWidth * 0.45);

  const animClass = animate
    ? 'ribbon-chrome-effects--animate'
    : 'ribbon-chrome-effects--static';

  return (
    <div
      className={`ribbon-chrome-effects pointer-events-none absolute inset-0 z-[1] ${animClass}${glassSoft ? ' ribbon-chrome-effects--glass' : ''}`}
      style={styleVars}
      aria-hidden
      data-ribbon-fx={mode}
    >
      <svg
        className="h-full w-full overflow-visible"
        width="100%"
        height="100%"
        viewBox={RIBBON_VIEWBOX}
        preserveAspectRatio="none"
        overflow="visible"
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
            <stop offset="40%" stopColor={glowToRgba('#a78bfa', 0.22 + clampedIntensity * 0.32)} />
            <stop offset="70%" stopColor={glowToRgba(resolvedGlow, 0.14 + clampedIntensity * 0.12)} />
            <stop offset="100%" stopColor={glowToRgba('#a78bfa', 0)} />
          </linearGradient>
          <linearGradient id={auroraId3} x1="20%" y1="100%" x2="80%" y2="0%">
            <stop offset="0%" stopColor={glowToRgba('#34d399', 0)} />
            <stop offset="45%" stopColor={glowToRgba('#34d399', 0.16 + clampedIntensity * 0.24)} />
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

          <filter id={neonTipGlowId} x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation={1.8 + clampedGlow * 3.5} result="tipBlur" />
            <feMerge>
              <feMergeNode in="tipBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id={moteGlowId} x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation={1.4 + clampedIntensity * 1.8} result="moteBlur" />
            <feMerge>
              <feMergeNode in="moteBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id={softBlurId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={softBlurStd} />
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
              fill={glowToRgba(resolvedGlow, 1)}
              opacity={pulseFillOpacity}
            />
          </g>
        ) : null}

        {mode === 'neonTrace' ? (
          <g className="ribbon-fx-neon-group" overflow="visible">
            {/* Soft afterglow trail — short comet, driven by SMIL so tip + dash stay in lockstep */}
            <path
              className="ribbon-fx-neon-trace ribbon-fx-neon-trace--under"
              d={RIBBON_TOP_EDGE_PATH}
              fill="none"
              stroke={resolvedGlow}
              strokeWidth={neonUnderWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${glowFilterId})`}
              pathLength={100}
              strokeDasharray={`${neonTrails.under} ${Math.max(1, 100 - neonTrails.under)}`}
              strokeDashoffset={animate ? undefined : neonTrails.under - 42}
              opacity={0.22 + clampedGlow * 0.28 + clampedIntensity * 0.12}
            >
              {animate ? (
                <animate
                  attributeName="stroke-dashoffset"
                  from={String(neonTrails.under)}
                  to={String(neonTrails.under - 100)}
                  dur={`${neonDurationSec}s`}
                  repeatCount="indefinite"
                />
              ) : null}
            </path>
            <path
              className="ribbon-fx-neon-trace"
              d={RIBBON_TOP_EDGE_PATH}
              fill="none"
              stroke={resolvedGlow}
              strokeWidth={neonCoreWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={100}
              strokeDasharray={`${neonTrails.core} ${Math.max(1, 100 - neonTrails.core)}`}
              strokeDashoffset={animate ? undefined : neonTrails.core - 42}
              opacity={0.55 + clampedIntensity * 0.3}
            >
              {animate ? (
                <animate
                  attributeName="stroke-dashoffset"
                  from={String(neonTrails.core)}
                  to={String(neonTrails.core - 100)}
                  dur={`${neonDurationSec}s`}
                  repeatCount="indefinite"
                />
              ) : null}
            </path>
            <path
              className="ribbon-fx-neon-trace ribbon-fx-neon-trace--core"
              d={RIBBON_TOP_EDGE_PATH}
              fill="none"
              stroke={glowToRgba('#ffffff', 0.92)}
              strokeWidth={neonWhiteWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={100}
              strokeDasharray={`${neonTrails.white} ${Math.max(1, 100 - neonTrails.white)}`}
              strokeDashoffset={animate ? undefined : neonTrails.white - 42}
              opacity={0.7 + clampedGlow * 0.25}
            >
              {animate ? (
                <animate
                  attributeName="stroke-dashoffset"
                  from={String(neonTrails.white)}
                  to={String(neonTrails.white - 100)}
                  dur={`${neonDurationSec}s`}
                  repeatCount="indefinite"
                />
              ) : null}
            </path>
            <g
              className="ribbon-fx-neon-tip"
              filter={`url(#${neonTipGlowId})`}
              opacity={0.88 + clampedGlow * 0.12}
              transform={
                animate
                  ? undefined
                  : `translate(${NEON_STATIC_TIP.x} ${NEON_STATIC_TIP.y})`
              }
            >
              {animate ? (
                <animateMotion
                  dur={`${neonDurationSec}s`}
                  repeatCount="indefinite"
                  path={RIBBON_TOP_EDGE_PATH}
                  rotate="0"
                />
              ) : null}
              {/* Soft orb layers — fairy / sacred-light tip */}
              <circle
                cx={0}
                cy={0}
                r={neonTipBloom}
                fill={glowToRgba(resolvedGlow, 0.14 + clampedGlow * 0.22)}
              />
              <circle
                cx={0}
                cy={0}
                r={neonTipCore * 1.55}
                fill={glowToRgba(resolvedGlow, 0.45 + clampedGlow * 0.25)}
              />
              <circle
                cx={0}
                cy={0}
                r={neonTipCore * 0.72}
                fill={glowToRgba('#ffffff', 0.92)}
              />
              <circle
                cx={0}
                cy={0}
                r={neonTipCore * 0.32}
                fill={glowToRgba('#ffffff', 1)}
              />
            </g>
          </g>
        ) : null}

        {mode === 'aurora' ? (
          <g mask={`url(#${maskId})`} className="ribbon-fx-aurora-group">
            <rect
              className="ribbon-fx-aurora-band ribbon-fx-aurora-band--a"
              x="-480"
              y="0"
              width="2400"
              height="240"
              fill={`url(#${auroraId1})`}
              opacity={0.7 + clampedIntensity * 0.3}
            />
            <rect
              className="ribbon-fx-aurora-band ribbon-fx-aurora-band--b"
              x="-480"
              y="0"
              width="2400"
              height="240"
              fill={`url(#${auroraId2})`}
              opacity={0.55 + clampedIntensity * 0.35}
            />
            <rect
              className="ribbon-fx-aurora-band ribbon-fx-aurora-band--c"
              x="-480"
              y="0"
              width="2400"
              height="240"
              fill={`url(#${auroraId3})`}
              opacity={0.45 + clampedIntensity * 0.35}
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
              fill={glowToRgba(resolvedGlow, (glassSoft ? 0.22 : 0.14) + clampedIntensity * 0.28)}
              filter={`url(#${softBlurId})`}
            />
            <ellipse
              className="ribbon-fx-ripple ribbon-fx-ripple--2"
              cx="780"
              cy="150"
              rx={160 + clampedIntensity * 50}
              ry={55 + clampedIntensity * 20}
              fill={glowToRgba(resolvedGlow, (glassSoft ? 0.18 : 0.1) + clampedIntensity * 0.22)}
              filter={`url(#${softBlurId})`}
            />
            <ellipse
              className="ribbon-fx-ripple ribbon-fx-ripple--3"
              cx="1100"
              cy="120"
              rx={120 + clampedIntensity * 40}
              ry={45 + clampedIntensity * 18}
              fill={glowToRgba('#e8f4ff', (glassSoft ? 0.12 : 0.06) + clampedIntensity * 0.14)}
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
          <g className="ribbon-fx-sparkle-group" filter={`url(#${moteGlowId})`} overflow="visible">
            {SPARKLE_MOTE_POINTS.map((p, i) => (
              <g key={`mote-${i}`} transform={`translate(${p.x} ${p.y})`}>
                <g
                  className="ribbon-fx-sparkle-mote"
                  style={{
                    ['--ribbon-fx-sparkle-delay']: `${p.delay.toFixed(2)}s`,
                    ['--ribbon-fx-sparkle-life']: `${(p.life / clampedSpeed).toFixed(2)}s`,
                    ['--ribbon-fx-sparkle-rise']: `${-p.rise}px`,
                    ['--ribbon-fx-sparkle-drift']: `${(p.driftX * 0.45).toFixed(1)}px`,
                  }}
                >
                  <circle
                    className="ribbon-fx-sparkle-halo"
                    cx={0}
                    cy={0}
                    r={p.size * (2.4 + clampedIntensity * 1.1)}
                    fill={glowToRgba(resolvedGlow, 0.18 + clampedIntensity * 0.22)}
                  />
                  <circle
                    className="ribbon-fx-sparkle-core"
                    cx={0}
                    cy={0}
                    r={p.size * (0.85 + clampedIntensity * 0.35)}
                    fill={glowToRgba('#ffffff', 0.72 + clampedIntensity * 0.22)}
                  />
                  <circle cx={0} cy={0} r={p.size * 0.35} fill={glowToRgba('#ffffff', 0.95)} />
                </g>
              </g>
            ))}
          </g>
        ) : null}

        {mode === 'frost' ? (
          <g mask={`url(#${maskId})`}>
            <path
              className="ribbon-fx-frost ribbon-fx-frost--veil"
              d={RIBBON_SILHOUETTE_PATH}
              fill={frostVeil}
              opacity={0.4 + clampedIntensity * 0.45}
            />
            <path
              className="ribbon-fx-frost"
              d={RIBBON_SHINE_PATH}
              fill={frostTint}
              opacity={0.55 + clampedIntensity * 0.4}
            />
            <path
              className="ribbon-fx-frost ribbon-fx-frost--edge"
              d={RIBBON_FULL_OUTLINE_PATH}
              fill="none"
              stroke={glowToRgba('#e8f6ff', 0.45 + clampedIntensity * 0.4)}
              strokeWidth={1.8 + clampedIntensity}
            />
            {FROST_CRYSTAL_POINTS.map((p, i) => (
              <circle
                key={`frost-c-${i}`}
                className="ribbon-fx-frost ribbon-fx-frost--crystal"
                cx={p.x}
                cy={p.y + 2}
                r={1.1 + (i % 3) * 0.45 + clampedIntensity * 0.6}
                fill={glowToRgba('#f0f9ff', 0.45 + clampedIntensity * 0.4)}
              />
            ))}
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

        {mode === 'musicBand' ? (
          <g mask={`url(#${maskId})`}>
            {musicLevels.map((level, i) => {
              const n = musicLevels.length || 1;
              const x = 80 + (i / Math.max(1, n - 1)) * 1280;
              const barH = 12 + level * (48 + clampedIntensity * 36);
              const y = 168 - barH;
              return (
                <rect
                  key={`mb-${i}`}
                  x={x - 8}
                  y={y}
                  width={14}
                  height={barH}
                  rx={5}
                  fill={resolvedGlow}
                  opacity={0.1 + clampedIntensity * 0.28 + level * 0.2}
                />
              );
            })}
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
  glowStrength: PropTypes.number,
  glowColor: PropTypes.string,
  hovered: PropTypes.bool,
  idleOnly: PropTypes.bool,
  glassWiiRibbon: PropTypes.bool,
};

export default React.memo(RibbonChromeEffects);
