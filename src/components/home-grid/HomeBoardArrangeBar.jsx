import React, { useEffect, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { Check, Grip, HelpCircle, MoreHorizontal, PenLine, Plus, Trash2 } from 'lucide-react';
import { createWeeTransition } from '../../design/weeMotion';
import {
  WeeGlassPill,
  WeeButton,
  WeeContentCollapse,
  WeeGooeyTileButton,
  WeeSegmentedControl,
} from '../../ui/wee';
import { isChannelSlotEmpty, isNonChannelSlot } from '../../utils/homeGridSlots';
import { getHomeSlotKind, listPlaceableHomeSlotKinds, matchHomeSlotSizePreset } from './slotKindRegistry';

const MotionDiv = m.div;

/**
 * Edit Home contextual tray — visible only while `homeBoardArrangeMode` is on.
 * Sits above the dock. Primary actions: Add widget (registry picker), size/remove for the
 * selected widget, Done. Wallpaper holes (punch) live behind More.
 */
function HomeBoardArrangeBar({
  arrangeMode,
  punchMode,
  onTogglePunch,
  onDone,
  selectedSlot = null,
  selectedIndex = null,
  canAddWidget = false,
  onAddWidget,
  onRemoveWidget,
  onSetSizePreset,
  blockedPresetIds = [],
  pickerOpen = false,
  onPickerOpenChange,
  onReopenGuide,
}) {
  const reducedMotion = useReducedMotion();
  const transition = createWeeTransition('pillOpen', { reducedMotion });

  const setPickerOpen = useCallback(
    (next) => {
      onPickerOpenChange?.(typeof next === 'function' ? next(pickerOpen) : next);
    },
    [onPickerOpenChange, pickerOpen]
  );
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!arrangeMode) {
      setMoreOpen(false);
    }
  }, [arrangeMode]);

  const placeableKinds = useMemo(() => listPlaceableHomeSlotKinds(), []);

  const selectedIsWidget = isNonChannelSlot(selectedSlot);
  const selectedIsEmptyChannel =
    selectedSlot != null && !selectedIsWidget && isChannelSlotEmpty(selectedSlot);
  const selectedKindMeta = selectedSlot
    ? getHomeSlotKind(selectedSlot.kind ?? 'channel')
    : null;
  const sizePresets = selectedKindMeta?.sizePresets ?? null;
  const activePreset = useMemo(
    () =>
      selectedKindMeta
        ? matchHomeSlotSizePreset(
            selectedSlot?.kind,
            selectedSlot?.colSpan,
            selectedSlot?.rowSpan
          )
        : null,
    [selectedKindMeta, selectedSlot?.kind, selectedSlot?.colSpan, selectedSlot?.rowSpan]
  );

  const handleToggleQuickPicker = useCallback(() => {
    setPickerOpen((prev) => !prev);
    setMoreOpen(false);
  }, [setPickerOpen]);

  const handleToggleMore = useCallback(() => {
    setMoreOpen((prev) => !prev);
    setPickerOpen(false);
  }, [setPickerOpen]);

  const handlePickKind = useCallback(
    (kindId) => {
      onAddWidget?.(kindId);
      setPickerOpen(false);
    },
    [onAddWidget, setPickerOpen]
  );

  const hint = punchMode
    ? 'Tap tiles to punch wallpaper holes · toggle off under More when finished'
    : selectedIsWidget
      ? `Drag the corner to resize · or pick S–XL · remove this ${selectedKindMeta?.label ?? ''} widget`.replace(
          '  ',
          ' '
        )
      : selectedIsEmptyChannel
        ? 'Empty slot — pick a widget below to place it here'
        : selectedKindMeta
          ? 'Drag the corner to resize · or pick S–XL · drag tiles to reorder'
          : 'Tap a tile to select · drag tiles to reorder · Esc to exit';

  return (
    <AnimatePresence>
      {arrangeMode ? (
        <MotionDiv
          key="home-board-arrange-bar"
          className="pointer-events-none fixed inset-x-0 bottom-[max(6.75rem,calc(env(safe-area-inset-bottom)+5.75rem))] z-[var(--z-home-arrange-bar)] flex justify-center px-4"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 }}
          transition={transition}
        >
          <WeeGlassPill className="pointer-events-auto flex max-w-[min(96vw,52rem)] flex-col items-stretch gap-2 rounded-[2rem] px-3 py-2.5 md:gap-2.5 md:px-5 md:py-3">
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
              <span className="flex items-center gap-2 pl-1 pr-1 text-[length:var(--font-size-caption)] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-secondary))] md:pr-2">
                <Grip size={14} strokeWidth={2.5} aria-hidden />
                Edit Home
              </span>

              {canAddWidget && typeof onAddWidget === 'function' ? (
                <WeeButton
                  variant={pickerOpen ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={handleToggleQuickPicker}
                  aria-expanded={pickerOpen}
                  title={
                    selectedIndex != null
                      ? `Add a widget at slot ${selectedIndex + 1}`
                      : 'Add a widget on the first free slot'
                  }
                >
                  <span className="flex items-center gap-1.5">
                    <Plus size={13} strokeWidth={2.5} aria-hidden />
                    Add widget
                  </span>
                </WeeButton>
              ) : null}

              {selectedKindMeta && sizePresets ? (
                <>
                  <WeeSegmentedControl
                    size="sm"
                    ariaLabel="Tile size"
                    layoutId="homeArrangeTileSize"
                    value={activePreset?.id ?? ''}
                    onChange={(presetId) => onSetSizePreset?.(presetId)}
                    options={Object.values(sizePresets).map((preset) => {
                      const blocked = blockedPresetIds.includes(preset.id);
                      return {
                        value: preset.id,
                        label: preset.label,
                        disabled: blocked,
                        title: blocked
                          ? `${preset.label} needs free neighboring slots`
                          : `${preset.label} · ${preset.colSpan}×${preset.rowSpan}`,
                      };
                    })}
                  />
                  {selectedIsWidget ? (
                    <WeeButton variant="danger" size="sm" onClick={onRemoveWidget}>
                      <span className="flex items-center gap-1.5">
                        <Trash2 size={13} strokeWidth={2.5} aria-hidden />
                        Remove
                      </span>
                    </WeeButton>
                  ) : null}
                </>
              ) : null}

              <WeeButton
                variant="secondary"
                size="sm"
                onClick={handleToggleMore}
                aria-expanded={moreOpen}
                aria-label="More editing tools"
              >
                <span className="flex items-center gap-1.5">
                  <MoreHorizontal size={13} strokeWidth={2.5} aria-hidden />
                  More
                </span>
              </WeeButton>

              <WeeButton variant="primary" size="sm" onClick={onDone}>
                <span className="flex items-center gap-1.5">
                  <Check size={13} strokeWidth={3} aria-hidden />
                  Done
                </span>
              </WeeButton>
            </div>

            <WeeContentCollapse open={pickerOpen} keepMounted={false}>
              <div className="flex flex-wrap items-stretch justify-center gap-2 border-t-2 border-[hsl(var(--border-primary)/0.25)] px-1 pb-1 pt-2.5">
                {placeableKinds.map((kind) => (
                  <WeeGooeyTileButton
                    key={kind.id}
                    orientation="row"
                    icon={kind.icon ?? '🧩'}
                    label={kind.label}
                    description={kind.description}
                    reducedMotion={reducedMotion}
                    onClick={() => handlePickKind(kind.id)}
                    className="min-w-[11rem] max-w-[15rem]"
                  />
                ))}
              </div>
            </WeeContentCollapse>

            <WeeContentCollapse open={moreOpen} keepMounted={false}>
              <div className="flex flex-wrap items-center justify-center gap-2 border-t-2 border-[hsl(var(--border-primary)/0.25)] px-1 pb-1 pt-2.5">
                <WeeButton
                  variant={punchMode ? 'primary' : 'secondary'}
                  size="sm"
                  aria-pressed={punchMode}
                  onClick={onTogglePunch}
                >
                  <span className="flex items-center gap-1.5">
                    <PenLine size={13} strokeWidth={2.5} aria-hidden />
                    Wallpaper holes
                  </span>
                </WeeButton>
                <span className="text-[length:var(--font-size-micro)] font-bold uppercase tracking-[0.1em] text-[hsl(var(--text-tertiary))]">
                  Punch see-through holes in the grid to show wallpaper
                </span>
                {typeof onReopenGuide === 'function' ? (
                  <WeeButton
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      onReopenGuide();
                      setMoreOpen(false);
                    }}
                    title="Show the Edit Home tips again"
                  >
                    <span className="flex items-center gap-1.5">
                      <HelpCircle size={13} strokeWidth={2.5} aria-hidden />
                      Show tips
                    </span>
                  </WeeButton>
                ) : null}
              </div>
            </WeeContentCollapse>

            <p className="m-0 px-1 text-center text-[length:var(--font-size-micro)] font-bold uppercase tracking-[0.12em] text-[hsl(var(--text-tertiary))]">
              {hint}
            </p>
          </WeeGlassPill>
        </MotionDiv>
      ) : null}
    </AnimatePresence>
  );
}

HomeBoardArrangeBar.propTypes = {
  arrangeMode: PropTypes.bool.isRequired,
  punchMode: PropTypes.bool.isRequired,
  onTogglePunch: PropTypes.func.isRequired,
  onDone: PropTypes.func.isRequired,
  selectedSlot: PropTypes.object,
  selectedIndex: PropTypes.number,
  canAddWidget: PropTypes.bool,
  onAddWidget: PropTypes.func,
  onRemoveWidget: PropTypes.func,
  onSetSizePreset: PropTypes.func,
  blockedPresetIds: PropTypes.arrayOf(PropTypes.string),
  pickerOpen: PropTypes.bool,
  onPickerOpenChange: PropTypes.func,
  onReopenGuide: PropTypes.func,
};

export default React.memo(HomeBoardArrangeBar);
