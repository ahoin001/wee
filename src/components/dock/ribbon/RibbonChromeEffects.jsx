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
  RIBBON_VIEWBOX_WIDTH,
  RIBBON_SILHOUETTE_PATH,
  RIBBON_FULL_OUTLINE_PATH,
  sampleRibbonTopEdgePoints,
} from './ribbonSilhouette';
import {
  RIBBON_CHROME_EFFECTS,
  RIBBON_CHROME_GLASS_INTENSITY_MULT,
  RIBBON_CHROME_GLASS_SOFT_MODES,
  RIBBON_CHROME_HOVER_DAMPEN,
  RIBBON_CHROME_DEFAULT_GLOW_STRENGTH,
  RIBBON_CHROME_DEFAULT_NEON_COLOR_MODE,
  RIBBON_NEON_COLOR_MODES,
  normalizeRibbonChromeEffectId,
  isRibbonNeonColorMode,
} from './ribbonChromeEffectMeta';
import './RibbonChromeEffects.css';

export { RIBBON_CHROME_EFFECTS };

const FALLBACK_GLOW_RGB = [0, 153, 255];
const IDLE_NOW_PLAYING = Object.freeze({
  isPlaying: false,
  progressMs: 0,
  durationMs: 0,
});

const SPARKLE_MIN_MOTES = 6;
const SPARKLE_MAX_MOTES = 28;
const SPARKLE_POOL_SIZE = 32;

/**
 * Full-width sparkle pool — evenly spaced across the entire top bow,
 * spawned below the lip so motes form inside the ribbon body.
 */
const SPARKLE_MOTE_POOL = (() => {
  const edge = sampleRibbonTopEdgePoints(SPARKLE_POOL_SIZE - 1);
  return edge.map((p, i) => {
    const depth = 22 + ((i * 17) % 28) + (i % 3) * 4;
    return {
      x: p.x,
      y: p.y + depth,
      driftX: ((i * 19) % 13) - 6,
      rise: 22 + ((i * 11) % 22),
      size: 1.35 + (i % 4) * 0.35,
      delay: (i / SPARKLE_POOL_SIZE) * 5.2 + (i % 5) * 0.11,
      life: 3.6 + (i % 5) * 0.5,
    };
  });
})();

/** Warm travelers along the top bow for Edge ember. */
const EMBER_TRAVELER_POINTS = sampleRibbonTopEdgePoints(28)
  .filter((_, i) => i % 2 === 0)
  .slice(0, 14)
  .map((p, i) => ({
    ...p,
    driftX: 18 + (i % 5) * 6,
    size: 2.2 + (i % 3) * 0.7,
    delay: (i / 14) * 3.8 + (i % 3) * 0.19,
    life: 2.8 + (i % 4) * 0.45,
  }));

/**
 * Long ripple sequence — many foci across the ribbon; each fires once
 * per long seamless cycle (active pulse early, invisible for the rest).
 */
const RIPPLE_FOCI = Object.freeze([
  { cx: 160, cy: 150, rx: 58, ry: 26 },
  { cx: 300, cy: 168, rx: 72, ry: 30 },
  { cx: 440, cy: 142, rx: 64, ry: 28 },
  { cx: 560, cy: 175, rx: 80, ry: 34 },
  { cx: 680, cy: 155, rx: 70, ry: 30 },
  { cx: 800, cy: 178, rx: 76, ry: 32 },
  { cx: 920, cy: 148, rx: 62, ry: 28 },
  { cx: 1040, cy: 170, rx: 74, ry: 31 },
  { cx: 1160, cy: 145, rx: 60, ry: 27 },
  { cx: 1280, cy: 162, rx: 68, ry: 29 },
  { cx: 380, cy: 190, rx: 55, ry: 24 },
  { cx: 980, cy: 188, rx: 58, ry: 25 },
]);
const RIPPLE_CYCLE_MULT = 6.2;

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

/** Complementary-ish duo partner from glow RGB (rotate hue ~180° in HSL-ish space). */
function duoPartnerHex(glowColor) {
  const [r, g, b] = parseGlowRgb(glowColor);
  return `rgb(${255 - r}, ${255 - g}, ${Math.min(255, 255 - b + 40)})`;
}

/** Racing segment length as fraction of pathLength=100 (~¼–⅓ perimeter like webcam neon). */
function neonRaceLengths(intensity, glow) {
  const seg = 18 + intensity * 10 + glow * 4;
  return {
    bloom: Math.min(36, seg * 1.35),
    core: Math.min(28, seg),
    head: Math.min(8, seg * 0.28),
  };
}

/**
 * Path-masked ribbon dock FX overlay.
 * Sits above RibbonChrome, below accessories. pointer-events: none.
 */
function RibbonChromeEffects({
  effect = 'none',
  intensity = 0.55,
  speed = 1,
  glowStrength = RIBBON_CHROME_DEFAULT_GLOW_STRENGTH,
  neonColorMode = RIBBON_CHROME_DEFAULT_NEON_COLOR_MODE,
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

  const mode = normalizeRibbonChromeEffectId(effect);
  const active = mode !== 'none' && !motionOff;
  const glassSoft =
    Boolean(glassWiiRibbon) && RIBBON_CHROME_GLASS_SOFT_MODES.includes(mode);

  const idlePaused = idleOnly && !idleReady;
  const animate =
    active && shouldAnimate && !isLowPowerMode && !idlePaused;

  const musicMode = mode === 'musicBand';
  const nowPlaying = useConsolidatedAppStore(
    useShallow((s) => {
      if (!musicMode) return IDLE_NOW_PLAYING;
      return {
        isPlaying: Boolean(s.nowPlaying?.isPlaying),
        progressMs: s.nowPlaying?.progressMs || 0,
        durationMs: s.nowPlaying?.durationMs || 0,
      };
    })
  );

  const musicLevels = useMusicReactiveLevels({
    isPlaying: nowPlaying.isPlaying,
    progressMs: nowPlaying.progressMs,
    durationMs: nowPlaying.durationMs,
    enabled: musicMode && animate,
    bandCount: 16,
  });

  const baseIntensity = Math.min(1, Math.max(0, intensity ?? 0.55));
  const glassBoost = glassSoft ? RIBBON_CHROME_GLASS_INTENSITY_MULT : 1;
  // Stable paint intensity — hover dampens via CSS opacity only (no filter rebuild).
  const clampedIntensity = Math.min(1, baseIntensity * glassBoost);
  const hoverOpacity =
    !idleOnly && hovered ? RIBBON_CHROME_HOVER_DAMPEN : 1;
  const clampedSpeed = Math.min(2, Math.max(0.25, speed ?? 1));
  const clampedGlow = Math.min(
    1,
    Math.max(0, glowStrength ?? RIBBON_CHROME_DEFAULT_GLOW_STRENGTH)
  );
  const colorMode = isRibbonNeonColorMode(neonColorMode)
    ? neonColorMode
    : RIBBON_CHROME_DEFAULT_NEON_COLOR_MODE;
  const durationSec = (2.8 / clampedSpeed).toFixed(2);
  const neonDurationSec = (3.4 / clampedSpeed).toFixed(2);
  const resolvedGlow = glowColor || DEFAULT_RIBBON_GLOW_HEX;
  const duoGlow = duoPartnerHex(resolvedGlow);
  const opacityFloor = glassSoft ? 0.34 : 0.22;
  const opacitySpan = glassSoft ? 0.58 : 0.5;
  const neonLens = neonRaceLengths(clampedIntensity, clampedGlow);

  const sparkleCount = Math.round(
    SPARKLE_MIN_MOTES + clampedIntensity * (SPARKLE_MAX_MOTES - SPARKLE_MIN_MOTES)
  );
  const sparkleMotes = useMemo(() => {
    const pool = SPARKLE_MOTE_POOL;
    const n = Math.min(sparkleCount, pool.length);
    if (n >= pool.length) return pool;
    if (n <= 1) return [pool[Math.floor(pool.length / 2)]];
    return Array.from({ length: n }, (_, i) => {
      const idx = Math.round((i / (n - 1)) * (pool.length - 1));
      return pool[idx];
    });
  }, [sparkleCount]);

  const rippleCycleSec = (Number(durationSec) * RIPPLE_CYCLE_MULT).toFixed(2);
  const rippleSlot = Number(rippleCycleSec) / RIPPLE_FOCI.length;

  const styleVars = useMemo(
    () => ({
      ['--ribbon-fx-intensity']: String(clampedIntensity),
      ['--ribbon-fx-duration']: `${durationSec}s`,
      ['--ribbon-fx-glow']: resolvedGlow,
      ['--ribbon-fx-opacity']: String(opacityFloor + clampedIntensity * opacitySpan),
      ['--ribbon-fx-neon-glow']: String(clampedGlow),
      ['--ribbon-fx-neon-duration']: `${neonDurationSec}s`,
      ['--ribbon-fx-hover-opacity']: String(hoverOpacity),
      ['--ribbon-fx-shimmer-period']: `${RIBBON_VIEWBOX_WIDTH}px`,
      ['--ribbon-fx-ripple-cycle']: `${rippleCycleSec}s`,
    }),
    [
      clampedGlow,
      clampedIntensity,
      durationSec,
      hoverOpacity,
      neonDurationSec,
      opacityFloor,
      opacitySpan,
      resolvedGlow,
      rippleCycleSec,
    ]
  );

  const shimmerPeak = glowToRgba(resolvedGlow, 0.14 + clampedIntensity * 0.42);
  const shimmerMid = glowToRgba(resolvedGlow, 0.05 + clampedIntensity * 0.14);
  /* Aurora: saturated curtain cores (green / violet / cyan) — not a faint wash */
  const auroraGreen = glowToRgba('#34d399', 0.55 + clampedIntensity * 0.35 + clampedGlow * 0.12);
  const auroraGreenSoft = glowToRgba('#6ee7b7', 0.22 + clampedIntensity * 0.2);
  const auroraViolet = glowToRgba('#c084fc', 0.5 + clampedIntensity * 0.32 + clampedGlow * 0.14);
  const auroraVioletSoft = glowToRgba('#a78bfa', 0.2 + clampedIntensity * 0.18);
  const auroraCyan = glowToRgba('#22d3ee', 0.48 + clampedIntensity * 0.3 + clampedGlow * 0.16);
  const auroraCyanSoft = glowToRgba('#67e8f9', 0.18 + clampedIntensity * 0.16);
  const auroraGlowCore = glowToRgba(resolvedGlow, 0.42 + clampedIntensity * 0.38 + clampedGlow * 0.15);
  const scanAlpha = (glassSoft ? 0.12 : 0.06) + clampedIntensity * (glassSoft ? 0.28 : 0.16);
  const pulseFillOpacity = (glassSoft ? 0.14 : 0.08) + clampedIntensity * (glassSoft ? 0.32 : 0.22);
  const auroraCurtainOpacity = 0.55 + clampedIntensity * 0.35 + clampedGlow * 0.2;
  const auroraCurtainOpacityB = 0.48 + clampedIntensity * 0.32 + clampedGlow * 0.22;
  const auroraCurtainOpacityC = 0.4 + clampedGlow * 0.4 + clampedIntensity * 0.22;
  const auroraCurtainOpacityD = 0.32 + clampedGlow * 0.45 + clampedIntensity * 0.18;

  if (!active) return null;

  const maskId = `ribbon-fx-mask-${uid}`;
  const shimmerId = `ribbon-fx-shimmer-${uid}`;
  const auroraId1 = `ribbon-fx-aurora-1-${uid}`;
  const auroraId2 = `ribbon-fx-aurora-2-${uid}`;
  const auroraId3 = `ribbon-fx-aurora-3-${uid}`;
  const auroraId4 = `ribbon-fx-aurora-4-${uid}`;
  const auroraSoftId = `ribbon-fx-aurora-soft-${uid}`;
  const glowFilterId = `ribbon-fx-glow-${uid}`;
  const softBlurId = `ribbon-fx-soft-${uid}`;
  const emberGlowId = `ribbon-fx-ember-glow-${uid}`;

  const needsMask = [
    'shimmer',
    'pulse',
    'aurora',
    'ripple',
    'edgeEmber',
    'scanline',
    'spectrum',
    'musicBand',
  ].includes(mode);
  const needsGlowFilter = mode === 'edgeEmber' || mode === 'spectrum';
  const needsSoftBlur = mode === 'ripple';
  const neonCoreWidth = 1.6 + clampedIntensity * 1.2 + clampedGlow * 0.6;
  const neonBloomWidth = neonCoreWidth * (2.2 + clampedGlow * 1.1);
  const neonHeadWidth = Math.max(2.2, neonCoreWidth * 1.35);
  const baselineWidth = 0.9 + clampedIntensity * 0.4;
  const rippleBlur = 1.2 + clampedIntensity * 1.8;
  const rippleStroke = 2.2 + clampedIntensity * 2.4;

  const animClass = animate
    ? 'ribbon-chrome-effects--animate'
    : 'ribbon-chrome-effects--static';

  const renderNeonRaceStroke = (strokeColor, lengths, classExtra = '') => (
    <>
      <path
        className={`ribbon-fx-neon-race ribbon-fx-neon-race--bloom ${classExtra}`.trim()}
        d={RIBBON_FULL_OUTLINE_PATH}
        fill="none"
        stroke={strokeColor}
        strokeWidth={neonBloomWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={100}
        strokeDasharray={`${lengths.bloom} ${Math.max(1, 100 - lengths.bloom)}`}
        opacity={0.22 + clampedGlow * 0.28}
      />
      <path
        className={`ribbon-fx-neon-race ribbon-fx-neon-race--core ${classExtra}`.trim()}
        d={RIBBON_FULL_OUTLINE_PATH}
        fill="none"
        stroke={strokeColor}
        strokeWidth={neonCoreWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={100}
        strokeDasharray={`${lengths.core} ${Math.max(1, 100 - lengths.core)}`}
        opacity={0.72 + clampedIntensity * 0.22}
      />
      <path
        className={`ribbon-fx-neon-race ribbon-fx-neon-race--head ${classExtra}`.trim()}
        d={RIBBON_FULL_OUTLINE_PATH}
        fill="none"
        stroke={glowToRgba('#ffffff', 0.95)}
        strokeWidth={neonHeadWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={100}
        strokeDasharray={`${lengths.head} ${Math.max(1, 100 - lengths.head)}`}
        opacity={0.85 + clampedGlow * 0.15}
      />
    </>
  );

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
          {needsMask ? (
            <mask id={maskId}>
              <rect width="1440" height="240" fill="black" />
              <path d={RIBBON_SILHOUETTE_PATH} fill="white" />
            </mask>
          ) : null}

          {mode === 'shimmer' ? (
            <linearGradient
              id={shimmerId}
              gradientUnits="objectBoundingBox"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              {/* Exact mirror 0–0.5 / 0.5–1 so a half-period translate is seamless */}
              <stop offset="0" stopColor={glowToRgba(resolvedGlow, 0)} />
              <stop offset="0.12" stopColor={shimmerMid} />
              <stop offset="0.18" stopColor={shimmerPeak} />
              <stop offset="0.24" stopColor={shimmerMid} />
              <stop offset="0.36" stopColor={glowToRgba(resolvedGlow, 0)} />
              <stop offset="0.5" stopColor={glowToRgba(resolvedGlow, 0)} />
              <stop offset="0.62" stopColor={shimmerMid} />
              <stop offset="0.68" stopColor={shimmerPeak} />
              <stop offset="0.74" stopColor={shimmerMid} />
              <stop offset="0.86" stopColor={glowToRgba(resolvedGlow, 0)} />
              <stop offset="1" stopColor={glowToRgba(resolvedGlow, 0)} />
            </linearGradient>
          ) : null}

          {mode === 'aurora' ? (
            <>
              {/* Vertical curtain gradients — bright core, soft falloff */}
              <radialGradient id={auroraId1} cx="50%" cy="18%" r="72%" fx="48%" fy="12%">
                <stop offset="0%" stopColor={auroraGreen} />
                <stop offset="45%" stopColor={auroraGreenSoft} />
                <stop offset="100%" stopColor={glowToRgba('#34d399', 0)} />
              </radialGradient>
              <radialGradient id={auroraId2} cx="50%" cy="22%" r="75%" fx="52%" fy="15%">
                <stop offset="0%" stopColor={auroraViolet} />
                <stop offset="48%" stopColor={auroraVioletSoft} />
                <stop offset="100%" stopColor={glowToRgba('#c084fc', 0)} />
              </radialGradient>
              <radialGradient id={auroraId3} cx="50%" cy="20%" r="70%" fx="50%" fy="10%">
                <stop offset="0%" stopColor={auroraCyan} />
                <stop offset="50%" stopColor={auroraCyanSoft} />
                <stop offset="100%" stopColor={glowToRgba('#22d3ee', 0)} />
              </radialGradient>
              <radialGradient id={auroraId4} cx="50%" cy="25%" r="68%" fx="55%" fy="18%">
                <stop offset="0%" stopColor={auroraGlowCore} />
                <stop
                  offset="55%"
                  stopColor={glowToRgba(resolvedGlow, 0.18 + clampedIntensity * 0.2)}
                />
                <stop offset="100%" stopColor={glowToRgba(resolvedGlow, 0)} />
              </radialGradient>
              <filter id={auroraSoftId} x="-30%" y="-20%" width="160%" height="140%">
                <feGaussianBlur stdDeviation={3 + clampedIntensity * 4 + clampedGlow * 2} />
              </filter>
            </>
          ) : null}

          {needsGlowFilter ? (
            <filter id={glowFilterId} x="-20%" y="-30%" width="140%" height="160%">
              <feGaussianBlur stdDeviation={2 + clampedIntensity * 2.5} result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ) : null}

          {mode === 'edgeEmber' ? (
            <filter id={emberGlowId} x="-40%" y="-60%" width="180%" height="220%">
              <feGaussianBlur stdDeviation={2.5 + clampedIntensity * 2} result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ) : null}

          {needsSoftBlur ? (
            <filter id={softBlurId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation={rippleBlur} />
            </filter>
          ) : null}
        </defs>

        {mode === 'shimmer' ? (
          <g mask={`url(#${maskId})`}>
            <rect
              className="ribbon-fx-shimmer-band"
              x="0"
              y="0"
              width={RIBBON_VIEWBOX_WIDTH * 2}
              height="240"
              fill={`url(#${shimmerId})`}
              opacity={0.45 + clampedIntensity * 0.5}
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
            <path
              className="ribbon-fx-neon-baseline"
              d={RIBBON_FULL_OUTLINE_PATH}
              fill="none"
              stroke={resolvedGlow}
              strokeWidth={baselineWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.14 + clampedIntensity * 0.12 + clampedGlow * 0.08}
            />
            {colorMode === 'spectrum' ? (
              <g className="ribbon-fx-neon-hue">
                {renderNeonRaceStroke(resolvedGlow, neonLens)}
              </g>
            ) : null}
            {colorMode === 'mono' ? renderNeonRaceStroke(resolvedGlow, neonLens) : null}
            {colorMode === 'duo' ? (
              <>
                {renderNeonRaceStroke(resolvedGlow, neonLens)}
                {renderNeonRaceStroke(duoGlow, neonLens, 'ribbon-fx-neon-race--duo-b')}
              </>
            ) : null}
          </g>
        ) : null}

        {mode === 'aurora' ? (
          <g mask={`url(#${maskId})`} className="ribbon-fx-aurora-group">
            {/* Tall vertical curtains — reads as aurora sheets, not a tint wash */}
            <ellipse
              className="ribbon-fx-aurora-curtain ribbon-fx-aurora-curtain--a"
              cx="380"
              cy="130"
              rx={95 + clampedIntensity * 30 + clampedGlow * 20}
              ry={175 + clampedIntensity * 20}
              fill={`url(#${auroraId1})`}
              opacity={Math.min(1, auroraCurtainOpacity)}
              filter={`url(#${auroraSoftId})`}
            />
            <ellipse
              className="ribbon-fx-aurora-curtain ribbon-fx-aurora-curtain--b"
              cx="720"
              cy="140"
              rx={110 + clampedIntensity * 35 + clampedGlow * 25}
              ry={185 + clampedIntensity * 25}
              fill={`url(#${auroraId2})`}
              opacity={Math.min(1, auroraCurtainOpacityB)}
              filter={`url(#${auroraSoftId})`}
            />
            <ellipse
              className="ribbon-fx-aurora-curtain ribbon-fx-aurora-curtain--c"
              cx="1040"
              cy="125"
              rx={100 + clampedIntensity * 28 + clampedGlow * 18}
              ry={170 + clampedIntensity * 22}
              fill={`url(#${auroraId3})`}
              opacity={Math.min(1, auroraCurtainOpacityC)}
              filter={`url(#${auroraSoftId})`}
            />
            {clampedGlow > 0.2 ? (
              <ellipse
                className="ribbon-fx-aurora-curtain ribbon-fx-aurora-curtain--d"
                cx="560"
                cy="135"
                rx={80 + clampedGlow * 40}
                ry={160 + clampedGlow * 30}
                fill={`url(#${auroraId4})`}
                opacity={Math.min(1, auroraCurtainOpacityD)}
                filter={`url(#${auroraSoftId})`}
              />
            ) : null}
          </g>
        ) : null}

        {mode === 'ripple' ? (
          <g mask={`url(#${maskId})`} className="ribbon-fx-ripple-group">
            {RIPPLE_FOCI.map((focus, fi) => {
              const delaySec = (fi * rippleSlot).toFixed(2);
              const echoDelay = (fi * rippleSlot + rippleSlot * 0.12).toFixed(2);
              return (
                <React.Fragment key={`ripple-${fi}`}>
                  <ellipse
                    className="ribbon-fx-ripple-ring"
                    cx={focus.cx}
                    cy={focus.cy}
                    rx={focus.rx * (1 + clampedIntensity * 0.35)}
                    ry={focus.ry * (1 + clampedIntensity * 0.3)}
                    fill="none"
                    stroke={glowToRgba(
                      resolvedGlow,
                      (glassSoft ? 0.48 : 0.38) + clampedIntensity * 0.4
                    )}
                    strokeWidth={rippleStroke}
                    filter={`url(#${softBlurId})`}
                    style={{ ['--ribbon-fx-ripple-delay']: `${delaySec}s` }}
                  />
                  <ellipse
                    className="ribbon-fx-ripple-ring"
                    cx={focus.cx}
                    cy={focus.cy}
                    rx={focus.rx * (0.75 + clampedIntensity * 0.25)}
                    ry={focus.ry * (0.7 + clampedIntensity * 0.22)}
                    fill="none"
                    stroke={glowToRgba(
                      '#e8f4ff',
                      (glassSoft ? 0.28 : 0.2) + clampedIntensity * 0.28
                    )}
                    strokeWidth={rippleStroke * 0.65}
                    filter={`url(#${softBlurId})`}
                    style={{ ['--ribbon-fx-ripple-delay']: `${echoDelay}s` }}
                  />
                </React.Fragment>
              );
            })}
          </g>
        ) : null}

        {mode === 'edgeEmber' ? (
          <g mask={`url(#${maskId})`} className="ribbon-fx-ember-group">
            <path
              className="ribbon-fx-ember-edge"
              d={RIBBON_FULL_OUTLINE_PATH}
              fill="none"
              stroke={resolvedGlow}
              strokeWidth={1.4 + clampedIntensity * 2}
              strokeLinecap="round"
              filter={`url(#${glowFilterId})`}
              opacity={0.45 + clampedIntensity * 0.45}
            />
            {EMBER_TRAVELER_POINTS.map((p, i) => (
              <g key={`ember-${i}`} transform={`translate(${p.x} ${p.y})`}>
                <g
                  className="ribbon-fx-ember-mote"
                  style={{
                    ['--ribbon-fx-ember-delay']: `${p.delay.toFixed(2)}s`,
                    ['--ribbon-fx-ember-life']: `${(p.life / clampedSpeed).toFixed(2)}s`,
                    ['--ribbon-fx-ember-drift']: `${p.driftX.toFixed(1)}px`,
                  }}
                >
                  <circle
                    cx={0}
                    cy={4}
                    r={p.size * (2.4 + clampedIntensity * 1.2)}
                    fill={glowToRgba(resolvedGlow, 0.28 + clampedIntensity * 0.35)}
                    filter={`url(#${emberGlowId})`}
                  />
                  <circle
                    cx={0}
                    cy={4}
                    r={p.size * (0.9 + clampedIntensity * 0.4)}
                    fill={glowToRgba('#fff7ed', 0.65 + clampedIntensity * 0.25)}
                  />
                </g>
              </g>
            ))}
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
          <g className="ribbon-fx-sparkle-group" overflow="visible">
            {sparkleMotes.map((p, i) => (
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
                    cx={0}
                    cy={0}
                    r={p.size * (2.2 + clampedIntensity * 0.9)}
                    fill={glowToRgba(resolvedGlow, 0.2 + clampedIntensity * 0.2)}
                  />
                  <circle
                    cx={0}
                    cy={0}
                    r={p.size * (0.8 + clampedIntensity * 0.3)}
                    fill={glowToRgba('#ffffff', 0.75 + clampedIntensity * 0.2)}
                  />
                </g>
              </g>
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
  /** Normalized via `normalizeRibbonChromeEffectId` (legacy ids like frost → none). */
  effect: PropTypes.string,
  intensity: PropTypes.number,
  speed: PropTypes.number,
  glowStrength: PropTypes.number,
  neonColorMode: PropTypes.oneOf(RIBBON_NEON_COLOR_MODES),
  glowColor: PropTypes.string,
  hovered: PropTypes.bool,
  idleOnly: PropTypes.bool,
  glassWiiRibbon: PropTypes.bool,
};

export default React.memo(RibbonChromeEffects);
