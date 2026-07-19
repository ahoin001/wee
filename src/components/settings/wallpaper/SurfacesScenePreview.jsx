import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { EyeOff } from 'lucide-react';
import SettingsLivePreviewFrame from '../SettingsLivePreviewFrame';
import RibbonMiniature from '../../dock/ribbon/RibbonMiniature';
import WallpaperOverlay from '../../overlays/WallpaperOverlay';
import { resolvePreviewSlotLabel } from '../ChannelBoardLivePreview';
import { isSlotHidden } from '../../../utils/channelLayoutSystem';
import { createWeeTransition } from '../../../design/weeMotion';

/**
 * Composed Surfaces studio canvas — page-resolved wallpaper, real board schematic,
 * live ribbon, and (when enabled) particle overlay inside the frame.
 * Active tab dims non-focused layers so the user knows what they are editing.
 */
function SurfacesScenePreview({
  wallpaperUrl,
  opacity = 1,
  blur = 0,
  brightness = 1,
  saturate = 1,
  activeSegment = 'library',
  caption,
  layout = null,
  pageSlotIndices = null,
  slots = null,
  configuredChannels = null,
  slotMeta = null,
  ribbonLook = null,
  previewingLibrary = false,
  overlayEnabled = false,
  overlayEffect = 'snow',
  overlayIntensity = 50,
  overlaySpeed = 1,
  overlayWind = 0.02,
  overlayGravity = 0.1,
  applyPulse = false,
}) {
  const reduceMotion = useReducedMotion();
  const crossfade = createWeeTransition('tab', { reducedMotion: reduceMotion });

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

  const focusWallpaper =
    activeSegment === 'library' || activeSegment === 'look' || activeSegment === 'atmosphere';
  const focusRibbon = activeSegment === 'ribbon' || activeSegment === 'chrome';
  const focusAtmosphere = activeSegment === 'atmosphere';
  const wallpaperDim = focusRibbon ? 'opacity-55' : 'opacity-100';
  const channelsDim = focusRibbon ? 'opacity-40' : focusAtmosphere ? 'opacity-50' : 'opacity-100';
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

  const showOverlay =
    Boolean(overlayEnabled) &&
    (activeSegment === 'atmosphere' || activeSegment === 'library' || activeSegment === 'look');

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
      minHeightClassName="min-h-[18rem]"
      canvasClassName="!p-0"
      className={[
        '!mb-0',
        applyPulse
          ? 'ring-2 ring-[hsl(var(--primary)/0.65)] shadow-[var(--shadow-hover-glow)] transition-[box-shadow,ring] duration-500'
          : 'transition-[box-shadow,ring] duration-500',
      ].join(' ')}
    >
      <div
        className="pointer-events-none relative h-64 w-full overflow-hidden md:h-72 lg:h-80"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[hsl(var(--surface-secondary))]" />
        <div className={`absolute inset-0 transition-opacity duration-300 ${wallpaperDim}`}>
          <AnimatePresence mode="sync" initial={false}>
            {wallpaperUrl ? (
              <m.img
                key={wallpaperUrl}
                src={wallpaperUrl}
                alt=""
                draggable={false}
                initial={reduceMotion ? false : { opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 1.02 }}
                transition={crossfade}
                className="absolute inset-0 h-full w-full object-cover will-change-[filter,opacity,transform]"
                style={layerStyle}
              />
            ) : (
              <m.div
                key="empty-wallpaper"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-[hsl(var(--surface-tertiary)/0.8)]"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-tertiary))]">
                  No wallpaper set
                </span>
              </m.div>
            )}
          </AnimatePresence>
        </div>

        {showOverlay ? (
          <div className="absolute inset-0 z-[4] overflow-hidden">
            <WallpaperOverlay
              mode="embedded"
              enabled={overlayEnabled}
              effect={overlayEffect}
              intensity={overlayIntensity}
              speed={overlaySpeed}
              wind={overlayWind}
              gravity={overlayGravity}
            />
          </div>
        ) : null}

        {showBoard ? (
          <div
            className={`absolute inset-x-3 top-3 bottom-[4.75rem] z-[2] transition-opacity duration-300 md:inset-x-4 md:top-4 ${channelsDim}`}
          >
            <div
              className="mx-auto grid h-full w-full max-w-2xl gap-1.5 md:gap-2"
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

        <div
          className={`absolute inset-x-0 bottom-0 z-[5] transition-opacity duration-300 ${ribbonDim}`}
        >
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
  activeSegment: PropTypes.oneOf(['library', 'look', 'atmosphere', 'chrome', 'wallpaper', 'ribbon', 'effects']),
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
  overlayEnabled: PropTypes.bool,
  overlayEffect: PropTypes.string,
  overlayIntensity: PropTypes.number,
  overlaySpeed: PropTypes.number,
  overlayWind: PropTypes.number,
  overlayGravity: PropTypes.number,
  applyPulse: PropTypes.bool,
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
  overlayEnabled: false,
  applyPulse: false,
};

export default React.memo(SurfacesScenePreview);
