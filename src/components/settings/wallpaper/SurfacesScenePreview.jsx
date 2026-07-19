import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import SettingsLivePreviewFrame from '../SettingsLivePreviewFrame';
import RibbonMiniature from '../../dock/ribbon/RibbonMiniature';

/**
 * Composed Surfaces studio canvas — wallpaper + sample channels + live ribbon.
 * Active segment dims non-focused layers so the user knows what they are editing.
 */
function SurfacesScenePreview({
  wallpaperUrl,
  opacity = 1,
  blur = 0,
  brightness = 1,
  saturate = 1,
  activeSegment = 'wallpaper',
  caption,
}) {
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

  const focusWallpaper = activeSegment === 'wallpaper' || activeSegment === 'effects';
  const focusRibbon = activeSegment === 'ribbon';
  const wallpaperDim = focusRibbon ? 'opacity-55' : 'opacity-100';
  const channelsDim = focusRibbon ? 'opacity-40' : 'opacity-100';
  const ribbonDim = focusWallpaper && !focusRibbon ? 'opacity-70' : 'opacity-100';
  const ribbonRing = focusRibbon
    ? 'ring-2 ring-[hsl(var(--primary)/0.55)] ring-offset-2 ring-offset-[hsl(var(--surface-tertiary)/0.55)]'
    : '';

  return (
    <SettingsLivePreviewFrame
      eyebrow="Live scene"
      caption={caption}
      sticky={false}
      minHeightClassName="min-h-[11rem]"
      canvasClassName="!p-0"
      className="!mb-0"
    >
      <div
        className="pointer-events-none relative h-44 w-full overflow-hidden md:h-52"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[hsl(var(--surface-secondary))]" />
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${wallpaperDim}`}
        >
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
        </div>

        <div
          className={`absolute inset-x-3 top-3 bottom-14 grid grid-cols-4 gap-2 transition-opacity duration-300 ${channelsDim}`}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl border-2 border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-primary)/0.88)] shadow-[var(--shadow-sm)] backdrop-blur-[2px]"
            />
          ))}
          <div className="rounded-xl border-2 border-dashed border-[hsl(var(--border-secondary)/0.55)] bg-transparent" />
        </div>

        <div
          className={`absolute inset-x-0 bottom-0 transition-opacity duration-300 ${ribbonDim}`}
        >
          <div className={`rounded-b-[1.5rem] ${ribbonRing}`.trim()}>
            <RibbonMiniature />
          </div>
        </div>
      </div>
    </SettingsLivePreviewFrame>
  );
}

SurfacesScenePreview.propTypes = {
  wallpaperUrl: PropTypes.string,
  opacity: PropTypes.number,
  blur: PropTypes.number,
  brightness: PropTypes.number,
  saturate: PropTypes.number,
  activeSegment: PropTypes.oneOf(['wallpaper', 'ribbon', 'effects']),
  caption: PropTypes.node,
};

export default React.memo(SurfacesScenePreview);
