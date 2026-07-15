import React, { useEffect, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { Check, Grip, MoreHorizontal, PenLine, Plus, Trash2 } from 'lucide-react';
import { createWeeTransition } from '../../design/weeMotion';
import { WeeGlassPill, WeeButton, WeeContentCollapse } from '../../ui/wee';
import { isNonChannelSlot } from '../../utils/homeGridSlots';
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
}) {
  const reducedMotion = useReducedMotion();
  const transition = createWeeTransition('pillOpen', { reducedMotion });
  const press = createWeeTransition('press', { reducedMotion });

  const [pickerOpen, setPickerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!arrangeMode) {
      setPickerOpen(false);
      setMoreOpen(false);
    }
  }, [arrangeMode]);

  const placeableKinds = useMemo(() => listPlaceableHomeSlotKinds(), []);

  const selectedKindMeta = isNonChannelSlot(selectedSlot)
    ? getHomeSlotKind(selectedSlot.kind)
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
  }, []);

  const handleToggleMore = useCallback(() => {
    setMoreOpen((prev) => !prev);
    setPickerOpen(false);
  }, []);

  const handlePickKind = useCallback(
    (kindId) => {
      onAddWidget?.(kindId);
      setPickerOpen(false);
    },
    [onAddWidget]
  );

  const hint = punchMode
    ? 'Tap tiles to punch wallpaper holes · toggle off under More when finished'
    : selectedKindMeta
      ? `Resize or remove this ${selectedKindMeta.label} widget`
      : selectedIndex != null
        ? 'Empty slot selected — Add widget places it here'
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
                <m.button
                  type="button"
                  onClick={handleToggleQuickPicker}
                  aria-expanded={pickerOpen}
                  whileHover={reducedMotion ? undefined : { scale: 1.04 }}
                  whileTap={reducedMotion ? undefined : { scale: 0.95 }}
                  transition={press}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[length:var(--font-size-micro)] font-black uppercase tracking-wide ${
                    pickerOpen
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--text-on-accent))] shadow-[var(--shadow-sm)]'
                      : 'border-2 border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-elevated))] text-[hsl(var(--text-secondary))]'
                  }`}
                  title={
                    selectedIndex != null
                      ? `Add a widget at slot ${selectedIndex + 1}`
                      : 'Add a widget on the first free slot'
                  }
                >
                  <Plus size={13} strokeWidth={2.5} aria-hidden />
                  Add widget
                </m.button>
              ) : null}

              {selectedKindMeta && sizePresets ? (
                <>
                  <div
                    className="flex items-center gap-1 rounded-full border-2 border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-elevated)/0.9)] p-1"
                    role="group"
                    aria-label="Widget size"
                  >
                    {Object.values(sizePresets).map((preset) => {
                      const active = activePreset?.id === preset.id;
                      const blocked = blockedPresetIds.includes(preset.id);
                      return (
                        <m.button
                          key={preset.id}
                          type="button"
                          onClick={() => onSetSizePreset?.(preset.id)}
                          whileHover={reducedMotion || blocked ? undefined : { scale: 1.06 }}
                          whileTap={reducedMotion || blocked ? undefined : { scale: 0.94 }}
                          transition={press}
                          aria-pressed={active}
                          aria-disabled={blocked || undefined}
                          title={
                            blocked
                              ? `${preset.label} needs free neighboring slots`
                              : `${preset.label} · ${preset.colSpan}×${preset.rowSpan}`
                          }
                          className={`min-w-[2rem] rounded-full px-2.5 py-1.5 text-[length:var(--font-size-micro)] font-black uppercase tracking-wide ${
                            active
                              ? 'bg-[hsl(var(--primary))] text-[hsl(var(--text-on-accent))]'
                              : blocked
                                ? 'cursor-not-allowed text-[hsl(var(--text-tertiary))] opacity-45'
                                : 'text-[hsl(var(--text-secondary))]'
                          }`}
                        >
                          {preset.label}
                        </m.button>
                      );
                    })}
                  </div>
                  <m.button
                    type="button"
                    onClick={onRemoveWidget}
                    whileHover={reducedMotion ? undefined : { scale: 1.04 }}
                    whileTap={reducedMotion ? undefined : { scale: 0.95 }}
                    transition={press}
                    className="flex items-center gap-1.5 rounded-full border-2 border-[hsl(var(--state-error)/0.4)] bg-[hsl(var(--state-error)/0.12)] px-3.5 py-2 text-[length:var(--font-size-micro)] font-black uppercase tracking-wide text-[hsl(var(--state-error))]"
                  >
                    <Trash2 size={13} strokeWidth={2.5} aria-hidden />
                    Remove
                  </m.button>
                </>
              ) : null}

              <m.button
                type="button"
                onClick={handleToggleMore}
                aria-expanded={moreOpen}
                aria-label="More editing tools"
                whileHover={reducedMotion ? undefined : { scale: 1.04 }}
                whileTap={reducedMotion ? undefined : { scale: 0.95 }}
                transition={press}
                className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[length:var(--font-size-micro)] font-black uppercase tracking-wide ${
                  moreOpen || punchMode
                    ? 'bg-[hsl(var(--surface-elevated))] text-[hsl(var(--text-primary))] border-2 border-[hsl(var(--border-primary)/0.6)]'
                    : 'border-2 border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-elevated))] text-[hsl(var(--text-secondary))]'
                }`}
              >
                <MoreHorizontal size={13} strokeWidth={2.5} aria-hidden />
                More
              </m.button>

              <WeeButton
                variant="primary"
                className="!rounded-full !px-4 !py-2"
                onClick={onDone}
              >
                <span className="flex items-center gap-1.5">
                  <Check size={13} strokeWidth={3} aria-hidden />
                  Done
                </span>
              </WeeButton>
            </div>

            <WeeContentCollapse open={pickerOpen} keepMounted={false}>
              <div className="flex flex-wrap items-stretch justify-center gap-2 border-t-2 border-[hsl(var(--border-primary)/0.25)] px-1 pb-1 pt-2.5">
                {placeableKinds.map((kind) => (
                  <m.button
                    key={kind.id}
                    type="button"
                    onClick={() => handlePickKind(kind.id)}
                    whileHover={reducedMotion ? undefined : { scale: 1.03 }}
                    whileTap={reducedMotion ? undefined : { scale: 0.96 }}
                    transition={press}
                    className="flex min-w-[11rem] max-w-[15rem] items-center gap-2.5 rounded-2xl border-2 border-[hsl(var(--border-primary)/0.4)] bg-[hsl(var(--surface-elevated))] px-3 py-2.5 text-left"
                  >
                    <span className="text-lg leading-none" aria-hidden>
                      {kind.icon ?? '🧩'}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[length:var(--font-size-micro)] font-black uppercase tracking-wide text-[hsl(var(--text-primary))]">
                        {kind.label}
                      </span>
                      {kind.description ? (
                        <span className="block truncate text-[length:var(--font-size-micro)] font-bold text-[hsl(var(--text-tertiary))]">
                          {kind.description}
                        </span>
                      ) : null}
                    </span>
                  </m.button>
                ))}
              </div>
            </WeeContentCollapse>

            <WeeContentCollapse open={moreOpen} keepMounted={false}>
              <div className="flex flex-wrap items-center justify-center gap-2 border-t-2 border-[hsl(var(--border-primary)/0.25)] px-1 pb-1 pt-2.5">
                <m.button
                  type="button"
                  aria-pressed={punchMode}
                  onClick={onTogglePunch}
                  whileHover={reducedMotion ? undefined : { scale: 1.04 }}
                  whileTap={reducedMotion ? undefined : { scale: 0.95 }}
                  transition={press}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[length:var(--font-size-micro)] font-black uppercase tracking-wide ${
                    punchMode
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--text-on-accent))] shadow-[var(--shadow-sm)]'
                      : 'border-2 border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-elevated))] text-[hsl(var(--text-secondary))]'
                  }`}
                >
                  <PenLine size={13} strokeWidth={2.5} aria-hidden />
                  Wallpaper holes
                </m.button>
                <span className="text-[length:var(--font-size-micro)] font-bold uppercase tracking-[0.1em] text-[hsl(var(--text-tertiary))]">
                  Punch see-through holes in the grid to show wallpaper
                </span>
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
};

export default React.memo(HomeBoardArrangeBar);
