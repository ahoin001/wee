import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useReducedMotion } from 'framer-motion';
import SettingsLivePreviewFrame from '../SettingsLivePreviewFrame';
import RibbonChromeEffects from '../../dock/ribbon/RibbonChromeEffects';
import {
  DEFAULT_RIBBON_GLOW_HEX,
  DEFAULT_RIBBON_SURFACE_HEX,
} from '../../../design/runtimeColorStrings.js';
import { hexAlpha } from '../../../utils/colorHex';

/** Append alpha channel to a #rrggbb (or #rgb) color for CSS fills/shadows. */
function withHexAlpha(hex, opacity) {
  const raw = String(hex || '').trim();
  const base = raw.startsWith('#') ? raw : `#${raw}`;
  const short = /^#[0-9A-Fa-f]{3}$/.test(base);
  const full = /^#[0-9A-Fa-f]{6}$/.test(base);
  if (!short && !full) return base || DEFAULT_RIBBON_SURFACE_HEX;
  const six = short
    ? `#${base[1]}${base[1]}${base[2]}${base[2]}${base[3]}${base[3]}`
    : base.slice(0, 7);
  const suffix = hexAlpha(opacity);
  return suffix ? `${six}${suffix}` : six;
}

/**
 * Schematic Wii ribbon strip for settings — same store fields as the real dock,
 * without mounting interactive WiiRibbon (Electron cost + click leakage).
 */
function RibbonLivePreview({ ribbon, sticky = true, compact = false }) {
  const reduceMotion = useReducedMotion();
  const surface = ribbon?.ribbonColor || DEFAULT_RIBBON_SURFACE_HEX;
  const glow = ribbon?.ribbonGlowColor || DEFAULT_RIBBON_GLOW_HEX;
  const glowPx = Number(ribbon?.ribbonGlowStrength ?? 20);
  const glassOn = Boolean(ribbon?.glassWiiRibbon);
  const dockOp = Number(ribbon?.ribbonDockOpacity ?? 1);
  const gOp = Number(ribbon?.glassOpacity ?? 0.18);
  const gBlur = Number(ribbon?.glassBlur ?? 2.5);
  const gBorder = Number(ribbon?.glassBorderOpacity ?? 0.5);
  const gShine = Number(ribbon?.glassShineOpacity ?? 0.7);
  const chromeEffect = ribbon?.chromeEffect ?? 'none';
  const chromeIntensity = ribbon?.chromeEffectIntensity ?? 0.55;
  const chromeSpeed = ribbon?.chromeEffectSpeed ?? 1;
  const chromeGlow = ribbon?.chromeEffectGlowStrength ?? 0.7;
  const chromeIdleOnly = ribbon?.chromeEffectIdleOnly ?? false;

  const stripStyle = useMemo(() => {
    return {
      opacity: Math.min(1, Math.max(0.35, dockOp)),
      background: glassOn
        ? `linear-gradient(180deg, ${withHexAlpha(surface, Math.min(0.85, gOp + 0.35))} 0%, ${withHexAlpha(surface, Math.min(0.55, gOp))} 100%)`
        : surface,
      boxShadow: `0 0 ${Math.max(4, glowPx * 0.55)}px ${withHexAlpha(glow, 0.55)}, 0 6px 18px hsl(var(--color-pure-black) / 0.18)`,
      borderColor: glassOn ? withHexAlpha(glow, Math.min(0.85, gBorder)) : withHexAlpha(glow, 0.35),
      backdropFilter: glassOn ? `blur(${Math.max(2, gBlur * 4)}px)` : undefined,
      WebkitBackdropFilter: glassOn ? `blur(${Math.max(2, gBlur * 4)}px)` : undefined,
    };
  }, [dockOp, glassOn, surface, gOp, glowPx, glow, gBorder, gBlur]);

  const shineStyle = glassOn
    ? {
        opacity: Math.min(1, Math.max(0.15, gShine)),
        background:
          'linear-gradient(105deg, hsl(var(--color-pure-white) / 0.55) 0%, transparent 42%, transparent 100%)',
      }
    : null;

  return (
    <SettingsLivePreviewFrame
      eyebrow="Live ribbon"
      caption="Surface, glow, glass, and chrome update here as you tweak — no need to close Settings."
      sticky={sticky}
      minHeightClassName={compact ? 'min-h-[5.5rem]' : 'min-h-[7rem]'}
      canvasClassName="flex items-end justify-center pb-2"
    >
      <div
        className="settings-ribbon-live-preview pointer-events-none relative w-full max-w-lg"
        aria-hidden
      >
        <div
          className="settings-ribbon-live-preview__strip relative mx-auto flex h-14 w-full items-center justify-between overflow-hidden rounded-[999px] border-2 px-4 md:h-16"
          style={stripStyle}
        >
          {shineStyle ? (
            <div className="pointer-events-none absolute inset-0 rounded-[999px]" style={shineStyle} />
          ) : null}
          {chromeEffect && chromeEffect !== 'none' && !reduceMotion ? (
            <div className="settings-ribbon-live-preview__chrome absolute inset-0 overflow-hidden rounded-[999px]">
              <RibbonChromeEffects
                effect={chromeEffect}
                intensity={chromeIntensity}
                speed={chromeSpeed}
                glowStrength={chromeGlow}
                glowColor={glow}
                hovered={false}
                idleOnly={chromeIdleOnly}
                glassWiiRibbon={glassOn}
              />
            </div>
          ) : null}
          <div className="relative z-[1] flex gap-2">
            <span
              className="h-8 w-8 rounded-full border border-[hsl(var(--color-pure-white)/0.45)] shadow-[var(--shadow-sm)]"
              style={{ background: withHexAlpha(glow, 0.35) }}
            />
            <span
              className="h-8 w-8 rounded-full border border-[hsl(var(--color-pure-white)/0.45)] shadow-[var(--shadow-sm)]"
              style={{ background: withHexAlpha(glow, 0.22) }}
            />
          </div>
          <div className="relative z-[1] h-2 w-16 rounded-full bg-[hsl(var(--color-pure-white)/0.35)]" />
          <div className="relative z-[1] flex gap-2">
            <span
              className="h-8 w-8 rounded-full border border-[hsl(var(--color-pure-white)/0.45)] shadow-[var(--shadow-sm)]"
              style={{ background: withHexAlpha(glow, 0.22) }}
            />
            <span
              className="h-8 w-8 rounded-full border border-[hsl(var(--color-pure-white)/0.45)] shadow-[var(--shadow-sm)]"
              style={{ background: withHexAlpha(glow, 0.35) }}
            />
          </div>
        </div>
      </div>
    </SettingsLivePreviewFrame>
  );
}

RibbonLivePreview.propTypes = {
  ribbon: PropTypes.object,
  sticky: PropTypes.bool,
  compact: PropTypes.bool,
};

export default React.memo(RibbonLivePreview);
