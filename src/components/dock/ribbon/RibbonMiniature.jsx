import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useShallow } from 'zustand/react/shallow';
import RibbonChrome from './RibbonChrome';
import RibbonChromeEffects from './RibbonChromeEffects';
import RibbonAccessories from './RibbonAccessories';
import WiiStyleButton from '../WiiStyleButton';
import useConsolidatedAppStore from '../../../utils/useConsolidatedAppStore';
import { hexAlpha } from '../../../utils/colorHex';
import { pickRibbonLook } from '../../../utils/appearance/resolveEffectiveRibbonLook';
import { CSS_WII_BLUE, DEFAULT_TIME_COLOR_HEX } from '../../../design/runtimeColorStrings.js';
import {
  RIBBON_VIEWBOX_WIDTH,
  RIBBON_VIEWBOX_HEIGHT,
} from './ribbonSilhouette';
import '../WiiRibbon.css';

/** Same defaults WiiRibbon seeds before ribbonButtonConfigs load. */
const DEFAULT_BUTTON_CONFIGS = [
  { type: 'text', text: 'Wii' },
  { type: 'text', text: 'Mail' },
];

/** Mirrors WiiRibbon's formatTime. */
function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
}

/** Mirrors WiiRibbon's formatDate. */
function formatDate(date) {
  return date
    .toLocaleDateString('en-US', { weekday: 'short', month: '2-digit', day: '2-digit' })
    .replace(',', '');
}

function useHostWidth() {
  const hostRef = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return undefined;
    // Keep preview buttons out of the tab order (pointer-events alone doesn't block focus).
    el.setAttribute('inert', '');
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (typeof w === 'number') setWidth(w);
    });
    observer.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);
  return [hostRef, width];
}

/** Icon/text content for a primary ribbon button — same branches as WiiRibbon (minus tinting). */
function MiniButtonContent({ config }) {
  if (config?.type === 'text') {
    return (
      <span
        className={`ribbon-btn-label-text${config?.textFont === 'digital' ? ' ribbon-btn-label-text--digital' : ''}`}
        style={{
          ['--ribbon-btn-font']:
            config?.textFont === 'digital'
              ? 'DigitalDisplayRegular-ODEO, monospace'
              : "'Orbitron', sans-serif",
        }}
      >
        {config.text || 'Wii'}
      </span>
    );
  }
  if (config?.icon === 'palette') {
    return (
      <svg className="palette-icon ribbon-primary-action-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={CSS_WII_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r="2.5" />
        <circle cx="17.5" cy="10.5" r="2.5" />
        <circle cx="8.5" cy="7.5" r="2.5" />
        <circle cx="6.5" cy="12.5" r="2.5" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
      </svg>
    );
  }
  if (config?.icon === 'star') {
    return (
      <svg className="star-icon ribbon-primary-action-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={CSS_WII_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    );
  }
  if (config?.icon === 'heart') {
    return (
      <svg className="heart-icon ribbon-primary-action-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={CSS_WII_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    );
  }
  if (config?.icon) {
    return (
      <img
        src={config.icon}
        alt=""
        className="ribbon-icon-img ribbon-icon-img--primary-action"
        style={{
          ['--ribbon-icon-filter']: config?.useWiiGrayFilter
            ? 'grayscale(100%) brightness(0.6) contrast(1.2)'
            : 'none',
        }}
      />
    );
  }
  return <span className="ribbon-btn-label-text">Wii</span>;
}

MiniButtonContent.propTypes = {
  config: PropTypes.object,
};

/**
 * 1:1 non-interactive miniature of the Wii ribbon — renders the real chrome layers
 * (RibbonChrome, RibbonChromeEffects, WiiStyleButton, time pill) at native 1440×240
 * and scales the stage to fit its container. Store-driven so previews stay live.
 * Optional `lookOverride` merges RIBBON_LOOK_KEYS (space/page paint) over live ribbon.
 */
function RibbonMiniature({ className = '', lookOverride = null }) {
  const [hostRef, hostWidth] = useHostWidth();

  const liveRibbon = useConsolidatedAppStore(
    useShallow((state) => ({
      ribbonColor: state.ribbon.ribbonColor,
      ribbonGlowColor: state.ribbon.ribbonGlowColor,
      ribbonGlowStrength: state.ribbon.ribbonGlowStrength,
      ribbonDockOpacity: state.ribbon.ribbonDockOpacity,
      glassWiiRibbon: state.ribbon.glassWiiRibbon,
      glassOpacity: state.ribbon.glassOpacity,
      glassBlur: state.ribbon.glassBlur,
      glassBorderOpacity: state.ribbon.glassBorderOpacity,
      glassShineOpacity: state.ribbon.glassShineOpacity,
      chromeEffect: state.ribbon.chromeEffect ?? 'none',
      chromeEffectIntensity: state.ribbon.chromeEffectIntensity ?? 0.55,
      chromeEffectSpeed: state.ribbon.chromeEffectSpeed ?? 1,
      chromeEffectGlowStrength: state.ribbon.chromeEffectGlowStrength ?? 0.6,
      chromeEffectNeonColorMode: state.ribbon.chromeEffectNeonColorMode ?? 'mono',
      chromeEffectIdleOnly: state.ribbon.chromeEffectIdleOnly ?? false,
      ribbonButtonConfigs: state.ribbon.ribbonButtonConfigs,
    }))
  );
  const ribbon = useMemo(() => {
    const override = pickRibbonLook(lookOverride);
    if (!override || Object.keys(override).length === 0) return liveRibbon;
    return { ...liveRibbon, ...override };
  }, [liveRibbon, lookOverride]);
  const time = useConsolidatedAppStore(
    useShallow((state) => ({
      color: state.time.color,
      font: state.time.font,
      enablePill: state.time.enablePill,
      pillBlur: state.time.pillBlur,
      pillOpacity: state.time.pillOpacity,
    }))
  );
  const wallpaperMatchEnabled = useConsolidatedAppStore(
    (state) => state.ui.wallpaperMatchEnabled !== false
  );

  // Static timestamp per mount — the preview does not need a ticking clock.
  const now = useMemo(() => new Date(), []);

  const ribbonGlowHex = ribbon.ribbonGlowColor || CSS_WII_BLUE;
  const glowPx = ribbon.ribbonGlowStrength ?? 20;
  const ribbonGlowFilter = `drop-shadow(0 0 ${glowPx}px ${ribbonGlowHex}) drop-shadow(0 0 12px ${ribbonGlowHex})`;
  const ribbonFillColor =
    (ribbon.ribbonColor || '') +
    (ribbon.ribbonDockOpacity !== undefined ? hexAlpha(ribbon.ribbonDockOpacity) : '');

  const chromeFxDurationSec = (
    2.4 / Math.min(2, Math.max(0.25, ribbon.chromeEffectSpeed ?? 1))
  ).toFixed(2);
  const pulseChromeActive = ribbon.chromeEffect === 'pulse' && !ribbon.chromeEffectIdleOnly;

  const buttonConfigs =
    Array.isArray(ribbon.ribbonButtonConfigs) && ribbon.ribbonButtonConfigs.length > 0
      ? ribbon.ribbonButtonConfigs
      : DEFAULT_BUTTON_CONFIGS;

  const timeFontStack =
    time.font === 'digital' ? 'DigitalDisplayRegular-ODEO, monospace' : "'Orbitron', sans-serif";
  const timeColor = time.color ?? DEFAULT_TIME_COLOR_HEX;
  const timePillOpacity = time.pillOpacity ?? 0.05;
  const pillBackdropBackground = wallpaperMatchEnabled
    ? `hsl(var(--ambient-secondary) / ${timePillOpacity})`
    : `hsl(var(--color-pure-white) / ${timePillOpacity})`;

  const scale = hostWidth > 0 ? hostWidth / RIBBON_VIEWBOX_WIDTH : 0;

  return (
    <div
      ref={hostRef}
      className={`relative w-full overflow-hidden ${className}`.trim()}
      style={{ height: Math.max(1, RIBBON_VIEWBOX_HEIGHT * scale) }}
      aria-hidden
    >
      {scale > 0 ? (
        <div
          className={`ribbon-miniature-stage${pulseChromeActive ? ' ribbon-fx-pulse-active' : ''}`}
          style={{
            width: RIBBON_VIEWBOX_WIDTH,
            height: RIBBON_VIEWBOX_HEIGHT,
            transform: `scale(${scale})`,
            ['--ribbon-fx-duration']: `${chromeFxDurationSec}s`,
            ['--ribbon-fx-glow']: ribbonGlowHex,
          }}
        >
          <RibbonChrome
            glassWiiRibbon={ribbon.glassWiiRibbon}
            glassBlur={ribbon.glassBlur}
            glassShineOpacity={ribbon.glassShineOpacity}
            glassOpacity={ribbon.glassOpacity}
            glassBorderOpacity={ribbon.glassBorderOpacity}
            fillColor={ribbonFillColor}
            ribbonGlowFilter={ribbonGlowFilter}
            hoverAnimationEnabled={false}
          />
          <RibbonChromeEffects
            effect={ribbon.chromeEffect}
            intensity={ribbon.chromeEffectIntensity}
            speed={ribbon.chromeEffectSpeed}
            glowStrength={ribbon.chromeEffectGlowStrength}
            neonColorMode={ribbon.chromeEffectNeonColorMode}
            glowColor={ribbonGlowHex}
            hovered={false}
            idleOnly={false}
            glassWiiRibbon={ribbon.glassWiiRibbon}
          />

          <RibbonAccessories>
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-[300px] z-20 text-center">
              {(time.enablePill ?? true) ? (
                <div className="liquid-glass liquid-glass-shell">
                  <div className="liquid-glass-inner-shadow" />
                  <div
                    className="liquid-glass-backdrop-layer"
                    style={{
                      ['--pill-blur']: `${time.pillBlur ?? 8}px`,
                      ['--pill-bg']: pillBackdropBackground,
                    }}
                  />
                  <div
                    className="glass-text ribbon-time-display-line relative z-[1] mb-3 text-[32px] font-bold ribbon-time-shadow"
                    style={{ ['--time-color']: timeColor, ['--time-font']: timeFontStack }}
                  >
                    {formatTime(now)}
                  </div>
                  <div
                    className="glass-text ribbon-time-display-line relative z-[1] text-lg font-bold ribbon-time-shadow"
                    style={{ ['--time-color']: timeColor, ['--time-font']: timeFontStack }}
                  >
                    {formatDate(now)}
                  </div>
                </div>
              ) : (
                <div className="ribbon-time-simple-wrap">
                  <div
                    className="ribbon-time-display-line text-4xl font-bold mb-3 ribbon-time-shadow-lg"
                    style={{ ['--time-color']: timeColor, ['--time-font']: timeFontStack }}
                  >
                    {formatTime(now)}
                  </div>
                  <div
                    className="ribbon-time-display-line text-lg font-bold ribbon-time-shadow"
                    style={{ ['--time-color']: timeColor, ['--time-font']: timeFontStack }}
                  >
                    {formatDate(now)}
                  </div>
                </div>
              )}
            </div>

            <div className="button-container left ribbon-btn-col-left">
              <div className="relative">
                <WiiStyleButton
                  useAdaptiveColor={buttonConfigs[0]?.useAdaptiveColor}
                  useGlowEffect={buttonConfigs[0]?.useGlowEffect}
                  glowStrength={buttonConfigs[0]?.glowStrength}
                  useGlassEffect={buttonConfigs[0]?.useGlassEffect}
                  glassOpacity={buttonConfigs[0]?.glassOpacity}
                  glassBlur={buttonConfigs[0]?.glassBlur}
                  glassBorderOpacity={buttonConfigs[0]?.glassBorderOpacity}
                  glassShineOpacity={buttonConfigs[0]?.glassShineOpacity}
                  ribbonGlowColor={ribbonGlowHex}
                  className="ribbon-wii-btn-idle ml-4"
                >
                  <MiniButtonContent config={buttonConfigs[0]} />
                </WiiStyleButton>
              </div>
            </div>

            <div className="ribbon-settings-cog-host">
              <svg width="28" height="28" viewBox="0 0 24 24" className="text-wii-gray-dark">
                <path fill="currentColor" d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
              </svg>
            </div>

            <div className="button-container right ribbon-btn-col-right">
              <div className="relative ml-4">
                <WiiStyleButton
                  useAdaptiveColor={buttonConfigs[1]?.useAdaptiveColor}
                  useGlowEffect={buttonConfigs[1]?.useGlowEffect}
                  glowStrength={buttonConfigs[1]?.glowStrength}
                  useGlassEffect={buttonConfigs[1]?.useGlassEffect}
                  glassOpacity={buttonConfigs[1]?.glassOpacity}
                  glassBlur={buttonConfigs[1]?.glassBlur}
                  glassBorderOpacity={buttonConfigs[1]?.glassBorderOpacity}
                  glassShineOpacity={buttonConfigs[1]?.glassShineOpacity}
                  ribbonGlowColor={ribbonGlowHex}
                  className="ribbon-wii-btn-idle"
                >
                  <MiniButtonContent config={buttonConfigs[1]} />
                </WiiStyleButton>
              </div>
            </div>
          </RibbonAccessories>
        </div>
      ) : null}
    </div>
  );
}

RibbonMiniature.propTypes = {
  className: PropTypes.string,
  lookOverride: PropTypes.object,
};

RibbonMiniature.defaultProps = {
  lookOverride: null,
};

export default React.memo(RibbonMiniature);
