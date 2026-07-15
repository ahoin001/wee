import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useShallow } from 'zustand/react/shallow';
import SettingsLivePreviewFrame from '../SettingsLivePreviewFrame';
import useConsolidatedAppStore from '../../../utils/useConsolidatedAppStore';
import {
  DEFAULT_RIBBON_GLOW_HEX,
  DEFAULT_RIBBON_SURFACE_HEX,
} from '../../../design/runtimeColorStrings.js';

/**
 * Schematic Home scene for wallpaper tune controls — opacity / blur / brightness /
 * saturate on the current (or library-selected) image, plus sample channel tiles + ribbon bar.
 */
function WallpaperScenePreview({
  wallpaperUrl,
  opacity = 1,
  blur = 0,
  brightness = 1,
  saturate = 1,
  sticky = true,
}) {
  const ribbon = useConsolidatedAppStore(
    useShallow((state) => ({
      ribbonColor: state.ribbon?.ribbonColor,
      ribbonGlowColor: state.ribbon?.ribbonGlowColor,
    }))
  );

  const surface = ribbon.ribbonColor || DEFAULT_RIBBON_SURFACE_HEX;
  const glow = ribbon.ribbonGlowColor || DEFAULT_RIBBON_GLOW_HEX;

  const layerStyle = useMemo(() => {
    const op = Math.min(1, Math.max(0, Number(opacity) || 0));
    const bl = Math.max(0, Number(blur) || 0);
    const br = Math.max(0.2, Number(brightness) || 1);
    const sat = Math.max(0, Number(saturate) || 1);
    return {
      opacity: op,
      filter: `blur(${bl}px) brightness(${br}) saturate(${sat})`,
    };
  }, [opacity, blur, brightness, saturate]);

  return (
    <SettingsLivePreviewFrame
      eyebrow="Live scene"
      caption="Opacity, blur, brightness, and saturation update this Home mock as you tune."
      sticky={sticky}
      minHeightClassName="min-h-[10rem]"
      canvasClassName="!p-0"
      className="mb-5"
    >
      <div className="pointer-events-none relative h-40 w-full overflow-hidden md:h-44" aria-hidden>
        <div className="absolute inset-0 bg-[hsl(var(--surface-secondary))]" />
        {wallpaperUrl ? (
          <img
            src={wallpaperUrl}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover will-change-[filter,opacity]"
            style={layerStyle}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[hsl(var(--surface-tertiary)/0.8)]">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-tertiary))]">
              No wallpaper set
            </span>
          </div>
        )}

        <div className="absolute inset-x-3 top-3 bottom-10 grid grid-cols-4 gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl border-2 border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-primary)/0.88)] shadow-[var(--shadow-sm)] backdrop-blur-[2px]"
            />
          ))}
          <div className="rounded-xl border-2 border-dashed border-[hsl(var(--border-secondary)/0.55)] bg-transparent" />
        </div>

        <div
          className="absolute inset-x-4 bottom-2 h-7 rounded-full border-2 shadow-[var(--shadow-sm)]"
          style={{
            background: surface,
            borderColor: glow,
            boxShadow: `0 0 10px ${glow}66, var(--shadow-sm)`,
          }}
        />
      </div>
    </SettingsLivePreviewFrame>
  );
}

WallpaperScenePreview.propTypes = {
  wallpaperUrl: PropTypes.string,
  opacity: PropTypes.number,
  blur: PropTypes.number,
  brightness: PropTypes.number,
  saturate: PropTypes.number,
  sticky: PropTypes.bool,
};

export default React.memo(WallpaperScenePreview);
