import React from 'react';
import PropTypes from 'prop-types';
import {
  RIBBON_VIEWBOX,
  RIBBON_SILHOUETTE_PATH,
  RIBBON_SHINE_PATH,
} from './ribbonSilhouette';
import { tintedHexFill } from '../../../utils/colorHex';

/**
 * Solid / glass SVG ribbon body + glow container.
 */
function RibbonChrome({
  glassWiiRibbon,
  glassBlur,
  glassShineOpacity,
  glassOpacity,
  glassBorderOpacity,
  fillColor,
  ribbonGlowFilter,
  hoverAnimationEnabled,
  onHoverChange,
}) {
  // Glass used to hard-code white frost, so live match / page colors never showed on
  // the body while the time pill tracked ambient. Tint frost with the painted fill.
  const pathFill = glassWiiRibbon
    ? tintedHexFill(fillColor, glassOpacity ?? 0.18)
    : fillColor;

  return (
    <div
      className="absolute inset-0 z-0 svg-container-glow ribbon-svg-glow-dynamic"
      style={{ ['--ribbon-glow-filter']: ribbonGlowFilter }}
      onMouseEnter={() => hoverAnimationEnabled && onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      <svg width="100%" height="100%" viewBox={RIBBON_VIEWBOX} preserveAspectRatio="none">
        {glassWiiRibbon ? (
          <defs>
            <filter id="glass-blur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation={glassBlur ?? 2.5} result="blur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="1.2" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="glass-shine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={`rgba(255,255,255,${glassShineOpacity ?? 0.7})`} />
              <stop offset="60%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
            </linearGradient>
          </defs>
        ) : null}
        <path
          d={RIBBON_SILHOUETTE_PATH}
          fill={pathFill}
          stroke={`rgba(255,255,255,${glassBorderOpacity ?? 0.5})`}
          strokeWidth="2"
          filter={glassWiiRibbon ? 'url(#glass-blur)' : undefined}
          className="transition-[fill] duration-300"
        />
        {glassWiiRibbon ? (
          <path
            d={RIBBON_SHINE_PATH}
            fill="url(#glass-shine)"
            className="pointer-events-none glass-shine-opacity-path"
            style={{ ['--glass-shine-opacity']: glassShineOpacity ?? 0.7 }}
          />
        ) : null}
      </svg>
    </div>
  );
}

RibbonChrome.propTypes = {
  glassWiiRibbon: PropTypes.bool,
  glassBlur: PropTypes.number,
  glassShineOpacity: PropTypes.number,
  glassOpacity: PropTypes.number,
  glassBorderOpacity: PropTypes.number,
  fillColor: PropTypes.string,
  ribbonGlowFilter: PropTypes.string,
  hoverAnimationEnabled: PropTypes.bool,
  onHoverChange: PropTypes.func,
};

export default React.memo(RibbonChrome);
