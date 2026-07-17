import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { m, useReducedMotion } from 'framer-motion';
import { EyeOff } from 'lucide-react';
import SettingsLivePreviewFrame from './SettingsLivePreviewFrame';
import { isSlotHidden } from '../../utils/channelLayoutSystem';
import { SLOT_KIND_CHANNEL } from '../../utils/homeGridSlots';
import { getHomeSlotKind } from '../home-grid/slotKindRegistry';
import { createWeeTransition } from '../../design/weeMotion';

/**
 * Resolve a short label for a preview cell from slots SSOT + legacy maps.
 * @param {object|null|undefined} slot
 * @param {Record<string, unknown>} [configuredChannels]
 * @param {number} slotIndex
 */
export function resolvePreviewSlotLabel(slot, configuredChannels, slotIndex) {
  if (slot && slot.kind && slot.kind !== SLOT_KIND_CHANNEL) {
    const kind = getHomeSlotKind(slot.kind);
    return kind?.label || String(slot.kind);
  }
  const id = String(slotIndex);
  const cfg =
    configuredChannels?.[id] ||
    configuredChannels?.[slotIndex] ||
    slot?.channel ||
    null;
  if (cfg && typeof cfg === 'object') {
    const name = cfg.name || cfg.title || cfg.label;
    if (typeof name === 'string' && name.trim()) {
      return name.trim().length > 14 ? `${name.trim().slice(0, 13)}…` : name.trim();
    }
  }
  return null;
}

/**
 * Live grid canvas for Channels & layout — schematic cells with real slot labels.
 * Punch mode toggles wallpaper holes; size edits update the grid live.
 * Page / dimension controls live in the parent toolbox above this canvas.
 */
function ChannelBoardLivePreview({
  layout,
  slotMeta,
  slots,
  configuredChannels,
  pageSlotIndices,
  punchHoleMode,
  onToggleSlot,
  safePreviewPage,
  currentPage,
  wallpaperUrl,
}) {
  const reduceMotion = useReducedMotion();
  const press = createWeeTransition('press', { reducedMotion: reduceMotion });
  const hiddenCount = pageSlotIndices.filter((i) => isSlotHidden(slotMeta, i)).length;

  const canvasStyle = wallpaperUrl
    ? {
        backgroundImage: [
          'linear-gradient(hsl(var(--surface-tertiary) / 0.72), hsl(var(--surface-tertiary) / 0.72))',
          `url("${String(wallpaperUrl).replace(/\\/g, '/').replace(/"/g, '')}")`,
        ].join(', '),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined;

  const labelsByIndex = useMemo(() => {
    const map = {};
    const list = Array.isArray(slots) ? slots : [];
    const configs = configuredChannels && typeof configuredChannels === 'object' ? configuredChannels : {};
    for (const slotIndex of pageSlotIndices) {
      map[slotIndex] = resolvePreviewSlotLabel(list[slotIndex], configs, slotIndex);
    }
    return map;
  }, [configuredChannels, pageSlotIndices, slots]);

  const headerAside = (
    <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wide text-[hsl(var(--text-tertiary))]">
      <span className="rounded-lg bg-[hsl(var(--surface-secondary))] px-3 py-1">
        Page {String(safePreviewPage + 1).padStart(2, '0')}
        {currentPage === safePreviewPage ? ' · live' : ''}
      </span>
      {hiddenCount > 0 ? (
        <span className="inline-flex items-center gap-1 rounded-lg bg-[hsl(var(--surface-wii-tint))] px-3 py-1 text-[hsl(var(--primary))]">
          <EyeOff size={12} aria-hidden /> {hiddenCount} hole{hiddenCount === 1 ? '' : 's'}
        </span>
      ) : null}
    </div>
  );

  return (
    <SettingsLivePreviewFrame
      eyebrow="Board canvas"
      caption={
        punchHoleMode
          ? 'Tap a tile to punch a wallpaper hole.'
          : 'Canvas updates as you change size above.'
      }
      headerAside={headerAside}
      sticky={false}
      minHeightClassName="min-h-[16rem] md:min-h-[20rem] lg:min-h-[22rem]"
      canvasClassName="!p-4 md:!p-5"
      canvasStyle={canvasStyle}
    >
      <div
        className="relative z-[1] mx-auto grid h-full w-full max-w-2xl gap-2.5 md:gap-3"
        style={{
          gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${layout.rows}, minmax(3rem, 1fr))`,
        }}
        role="group"
        aria-label="Channel board preview"
      >
        {pageSlotIndices.map((slotIndex) => {
          const hidden = isSlotHidden(slotMeta, slotIndex);
          const label = labelsByIndex[slotIndex];
          return (
            <m.button
              key={`preview-slot-${slotIndex}`}
              type="button"
              disabled={!punchHoleMode}
              onClick={() => onToggleSlot(slotIndex)}
              whileHover={
                reduceMotion || !punchHoleMode ? undefined : { scale: 1.05, y: -1 }
              }
              whileTap={reduceMotion || !punchHoleMode ? undefined : { scale: 0.92 }}
              transition={press}
              title={
                punchHoleMode
                  ? hidden
                    ? 'Show this slot'
                    : 'Hide this slot'
                  : label || `Slot ${slotIndex + 1}`
              }
              className={`relative flex min-h-[3rem] items-center justify-center overflow-hidden rounded-xl border-2 px-1 text-[9px] font-bold uppercase leading-tight tracking-wide md:min-h-[3.25rem] md:text-[10px] ${
                hidden
                  ? 'border-dashed border-[hsl(var(--border-secondary))] bg-transparent text-[hsl(var(--text-tertiary))]'
                  : 'border-[hsl(var(--border-primary)/0.55)] bg-[hsl(var(--surface-primary))] text-[hsl(var(--text-secondary))] shadow-[var(--shadow-sm)]'
              } ${punchHoleMode ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {hidden ? (
                <EyeOff size={14} aria-hidden />
              ) : (
                <span className="line-clamp-2 text-center">{label || slotIndex + 1}</span>
              )}
            </m.button>
          );
        })}
      </div>
    </SettingsLivePreviewFrame>
  );
}

ChannelBoardLivePreview.propTypes = {
  layout: PropTypes.shape({
    columns: PropTypes.number.isRequired,
    rows: PropTypes.number.isRequired,
  }).isRequired,
  slotMeta: PropTypes.object,
  slots: PropTypes.array,
  configuredChannels: PropTypes.object,
  pageSlotIndices: PropTypes.arrayOf(PropTypes.number).isRequired,
  punchHoleMode: PropTypes.bool,
  onToggleSlot: PropTypes.func.isRequired,
  safePreviewPage: PropTypes.number.isRequired,
  currentPage: PropTypes.number.isRequired,
  wallpaperUrl: PropTypes.string,
};

ChannelBoardLivePreview.defaultProps = {
  slotMeta: {},
  slots: [],
  configuredChannels: {},
  punchHoleMode: false,
  wallpaperUrl: null,
};

export default React.memo(ChannelBoardLivePreview);
