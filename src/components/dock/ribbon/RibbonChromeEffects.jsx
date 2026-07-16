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
  isRibbonChromeEffectId,
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

/**
 * Continuous sparkle field — staggered so ≥2–3 motes are always mid-life.
 * Delays spread across full cycle; no shared downbeat.
 */
const SPARKLE_MOTE_POINTS = sampleRibbonTopEdgePoints(40)
  .filter((_, i) => i % 5 === 0)
  .slice(0, 8)
  .map((p, i) => ({
    ...p,
    driftX: ((i * 19) % 13) - 6,
    rise: 20 + ((i * 11) % 16),
    size: 1.5 + (i % 3) * 0.4,
    delay: (i / 8) * 4.2 + (i % 3) * 0.17,
    life: 4.0 + (i % 4) * 0.55,
  }));

const FROST_CRYSTAL_POINTS = sampleRibbonTopEdgePoints(18).filter((_, i) => i % 2 === 0);

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

  const mode = isRibbonChromeEffectId(effect) ? effect : 'none';
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

  const styleVars = useMemo(
    () => ({
      ['--ribbon-fx-intensity']: String(clampedIntensity),
      ['--ribbon-fx-duration']: `${durationSec}s`,
      ['--ribbon-fx-glow']: resolvedGlow,
      ['--ribbon-fx-opacity']: String(opacityFloor + clampedIntensity * opacitySpan),
      ['--ribbon-fx-neon-glow']: String(clampedGlow),
      ['--ribbon-fx-neon-duration']: `${neonDurationSec}s`,
      ['--ribbon-fx-hover-opacity']: String(hoverOpacity),
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
  const glowFilterId = `ribbon-fx-glow-${uid}`;
  const softBlurId = `ribbon-fx-soft-${uid}`;
  const emberGradId = `ribbon-fx-ember-${uid}`;

  const needsMask = [
    'shimmer',
    'pulse',
    'aurora',
    'ripple',
    'edgeEmber',
    'scanline',
    'frost',
    'spectrum',
    'musicBand',
  ].includes(mode);
  const needsGlowFilter = mode === 'edgeEmber' || mode === 'spectrum';
  const needsSoftBlur = mode === 'ripple';
  const neonCoreWidth = 1.6 + clampedIntensity * 1.2 + clampedGlow * 0.6;
  const neonBloomWidth = neonCoreWidth * (2.2 + clampedGlow * 1.1);
  const neonHeadWidth = Math.max(2.2, neonCoreWidth * 1.35);
  const baselineWidth = 0.9 + clampedIntensity * 0.4;

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
            <linearGradient id={shimmerId} x1="0%" y1="10%" x2="100%" y2="24%">
              {/* Two identical lobes so translate -50% is seamless */}
              <stop offset="0%" stopColor={glowToRgba(resolvedGlow, 0)} />
              <stop offset="12%" stopColor={shimmerMid} />
              <stop offset="18%" stopColor={shimmerPeak} />
              <stop offset="24%" stopColor={shimmerMid} />
              <stop offset="36%" stopColor={glowToRgba(resolvedGlow, 0)} />
              <stop offset="50%" stopColor={glowToRgba(resolvedGlow, 0)} />
              <stop offset="62%" stopColor={shimmerMid} />
              <stop offset="68%" stopColor={shimmerPeak} />
              <stop offset="74%" stopColor={shimmerMid} />
              <stop offset="86%" stopColor={glowToRgba(resolvedGlow, 0)} />
              <stop offset="100%" stopColor={glowToRgba(resolvedGlow, 0)} />
            </linearGradient>
          ) : null}

          {mode === 'aurora' ? (
            <>
              <linearGradient id={auroraId1} x1="0%" y1="0%" x2="100%" y2="40%">
                <stop offset="0%" stopColor={glowToRgba(resolvedGlow, 0)} />
                <stop offset="35%" stopColor={auroraA} />
                <stop offset="55%" stopColor={auroraB} />
                <stop offset="100%" stopColor={glowToRgba(resolvedGlow, 0)} />
              </linearGradient>
              <linearGradient id={auroraId2} x1="100%" y1="20%" x2="0%" y2="80%">
                <stop offset="0%" stopColor={glowToRgba('#a78bfa', 0)} />
                <stop
                  offset="40%"
                  stopColor={glowToRgba('#a78bfa', 0.2 + clampedIntensity * 0.28)}
                />
                <stop
                  offset="70%"
                  stopColor={glowToRgba(resolvedGlow, 0.12 + clampedIntensity * 0.1)}
                />
                <stop offset="100%" stopColor={glowToRgba('#a78bfa', 0)} />
              </linearGradient>
            </>
          ) : null}

          {mode === 'edgeEmber' ? (
            <radialGradient id={emberGradId} cx="50%" cy="58%" r="42%">
              <stop offset="0%" stopColor={emberCore} />
              <stop
                offset="45%"
                stopColor={glowToRgba(resolvedGlow, 0.08 + clampedIntensity * 0.12)}
              />
              <stop offset="100%" stopColor={glowToRgba(resolvedGlow, 0)} />
            </radialGradient>
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

          {needsSoftBlur ? (
            <filter id={softBlurId} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation={softBlurStd} />
            </filter>
          ) : null}
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
            {/* Dim always-on baseline (webcam neon frame) */}
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
            <rect
              className="ribbon-fx-aurora-band ribbon-fx-aurora-band--a"
              x="-360"
              y="0"
              width="2160"
              height="240"
              fill={`url(#${auroraId1})`}
              opacity={0.65 + clampedIntensity * 0.3}
            />
            <rect
              className="ribbon-fx-aurora-band ribbon-fx-aurora-band--b"
              x="-360"
              y="0"
              width="2160"
              height="240"
              fill={`url(#${auroraId2})`}
              opacity={0.5 + clampedIntensity * 0.3}
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
              fill={glowToRgba(
                resolvedGlow,
                (glassSoft ? 0.22 : 0.14) + clampedIntensity * 0.28
              )}
              filter={`url(#${softBlurId})`}
            />
            <ellipse
              className="ribbon-fx-ripple ribbon-fx-ripple--2"
              cx="780"
              cy="150"
              rx={160 + clampedIntensity * 50}
              ry={55 + clampedIntensity * 20}
              fill={glowToRgba(
                resolvedGlow,
                (glassSoft ? 0.18 : 0.1) + clampedIntensity * 0.22
              )}
              filter={`url(#${softBlurId})`}
            />
            <ellipse
              className="ribbon-fx-ripple ribbon-fx-ripple--3"
              cx="1100"
              cy="120"
              rx={120 + clampedIntensity * 40}
              ry={45 + clampedIntensity * 18}
              fill={glowToRgba(
                '#e8f4ff',
                (glassSoft ? 0.12 : 0.06) + clampedIntensity * 0.14
              )}
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
          <g className="ribbon-fx-sparkle-group" overflow="visible">
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
  neonColorMode: PropTypes.oneOf(RIBBON_NEON_COLOR_MODES),
  glowColor: PropTypes.string,
  hovered: PropTypes.bool,
  idleOnly: PropTypes.bool,
  glassWiiRibbon: PropTypes.bool,
};

export default React.memo(RibbonChromeEffects);
