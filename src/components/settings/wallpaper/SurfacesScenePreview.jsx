import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { EyeOff } from 'lucide-react';
import SettingsLivePreviewFrame from '../SettingsLivePreviewFrame';
import RibbonMiniature from '../../dock/ribbon/RibbonMiniature';
import { resolvePreviewSlotLabel } from '../ChannelBoardLivePreview';
import { isSlotHidden } from '../../../utils/channelLayoutSystem';

/**
 * Composed Surfaces studio canvas — page-resolved wallpaper, real board schematic,
 * and live ribbon (with optional space/page look override).
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
  layout = null,
  pageSlotIndices = null,
  slots = null,
  configuredChannels = null,
  slotMeta = null,
  ribbonLook = null,
  previewingLibrary = false,
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

  const cols = Math.max(1, Number(layout?.columns) || 0);
  const rows = Math.max(1, Number(layout?.rows) || 0);
  const indices = Array.isArray(pageSlotIndices) ? pageSlotIndices : [];
  const showBoard = cols > 0 && rows > 0 && indices.length > 0;

  const labelsByIndex = useMemo(() => {
    const map = {};
    const list = Array.isArray(slots) ? slots : [];
    const configs =
      configuredChannels && typeof configuredChannels === 'object' ? configuredChannels : {};
    const slotIndices = Array.isArray(pageSlotIndices) ? pageSlotIndices : [];
    for (const slotIndex of slotIndices) {
      map[slotIndex] = resolvePreviewSlotLabel(list[slotIndex], configs, slotIndex);
    }
    return map;
  }, [configuredChannels, pageSlotIndices, slots]);

  const frameCaption = previewingLibrary ? (
    <span>
      Previewing library selection — Apply to pin.
      {caption ? (
        <>
          {' '}
          <span className="text-[hsl(var(--text-tertiary))]">· {caption}</span>
        </>
      ) : null}
    </span>
  ) : (
    caption
  );

  return (
    <SettingsLivePreviewFrame
      eyebrow="Live scene"
      caption={frameCaption}
      sticky={false}
      minHeightClassName="min-h-[16rem]"
      canvasClassName="!p-0"
      className="!mb-0"
    >
      <div
        className="pointer-events-none relative h-56 w-full overflow-hidden md:h-64"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[hsl(var(--surface-secondary))]" />
        <div className={`absolute inset-0 transition-opacity duration-300 ${wallpaperDim}`}>
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

        {showBoard ? (
          <div
            className={`absolute inset-x-3 top-3 bottom-[4.75rem] transition-opacity duration-300 md:inset-x-4 md:top-4 ${channelsDim}`}
          >
            <div
              className="mx-auto grid h-full w-full max-w-xl gap-1.5 md:gap-2"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
              }}
            >
              {indices.map((slotIndex) => {
                const hidden = isSlotHidden(slotMeta, slotIndex);
                const label = labelsByIndex[slotIndex];
                return (
                  <div
                    key={`scene-slot-${slotIndex}`}
                    className={`relative flex min-h-0 items-center justify-center overflow-hidden rounded-lg border-2 px-0.5 text-[8px] font-bold uppercase leading-tight tracking-wide md:rounded-xl md:text-[9px] ${
                      hidden
                        ? 'border-dashed border-[hsl(var(--border-secondary)/0.7)] bg-transparent text-[hsl(var(--text-tertiary))]'
                        : 'border-[hsl(var(--border-primary)/0.5)] bg-[hsl(var(--surface-primary)/0.9)] text-[hsl(var(--text-secondary))] shadow-[var(--shadow-sm)] backdrop-blur-[2px]'
                    }`}
                  >
                    {hidden ? (
                      <EyeOff size={12} aria-hidden />
                    ) : (
                      <span className="line-clamp-2 text-center">{label || slotIndex + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className={`absolute inset-x-0 bottom-0 transition-opacity duration-300 ${ribbonDim}`}>
          <div className={`rounded-b-[1.5rem] ${ribbonRing}`.trim()}>
            <RibbonMiniature lookOverride={ribbonLook} />
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
  layout: PropTypes.shape({
    columns: PropTypes.number,
    rows: PropTypes.number,
  }),
  pageSlotIndices: PropTypes.arrayOf(PropTypes.number),
  slots: PropTypes.array,
  configuredChannels: PropTypes.object,
  slotMeta: PropTypes.object,
  ribbonLook: PropTypes.object,
  previewingLibrary: PropTypes.bool,
};

SurfacesScenePreview.defaultProps = {
  wallpaperUrl: null,
  layout: null,
  pageSlotIndices: null,
  slots: null,
  configuredChannels: null,
  slotMeta: null,
  ribbonLook: null,
  previewingLibrary: false,
};

export default React.memo(SurfacesScenePreview);
