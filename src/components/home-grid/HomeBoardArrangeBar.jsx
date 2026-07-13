import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { Check, Grip, PenLine, ShieldPlus, Trash2 } from 'lucide-react';
import { createWeeTransition } from '../../design/weeMotion';
import { WeeGlassPill, WeeButton } from '../../ui/wee';
import { HOME_SLOT_SIZE_PRESETS } from '../../utils/homeSlotSizePresets';
import { SLOT_KIND_ADMIN_QUICK_ACCESS } from '../../utils/homeGridSlots';
import { matchHomeSlotSizePreset } from './slotKindRegistry';

const MotionDiv = m.div;

/**
 * Live Board Studio bottom toolbar — visible only while `homeBoardArrangeMode` is on.
 * Punch mode toggles wallpaper holes; widget tools appear when an Admin Quick Access
 * slot is selected (or Add when a free empty cell is selected / first free cell).
 */
function HomeBoardArrangeBar({
  arrangeMode,
  punchMode,
  onTogglePunch,
  onDone,
  selectedSlot = null,
  selectedIndex = null,
  canAddQuickAccess = false,
  onAddQuickAccess,
  onRemoveWidget,
  onSetSizePreset,
  sizeBlockedPresetId = null,
}) {
  const reducedMotion = useReducedMotion();
  const transition = createWeeTransition('pillOpen', { reducedMotion });
  const press = createWeeTransition('press', { reducedMotion });

  const isAdminWidget = selectedSlot?.kind === SLOT_KIND_ADMIN_QUICK_ACCESS;
  const activePreset = useMemo(
    () =>
      isAdminWidget
        ? matchHomeSlotSizePreset(
            SLOT_KIND_ADMIN_QUICK_ACCESS,
            selectedSlot?.colSpan,
            selectedSlot?.rowSpan
          )
        : null,
    [isAdminWidget, selectedSlot?.colSpan, selectedSlot?.rowSpan]
  );

  return (
    <AnimatePresence>
      {arrangeMode ? (
        <MotionDiv
          key="home-board-arrange-bar"
          className="pointer-events-none fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-[2350] flex justify-center px-4"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 }}
          transition={transition}
        >
          <WeeGlassPill className="pointer-events-auto flex max-w-[min(96vw,52rem)] flex-wrap items-center justify-center gap-2 rounded-full px-3 py-2.5 md:gap-3 md:px-5">
            <span className="flex items-center gap-2 pl-1 pr-1 text-[11px] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-secondary))] md:pr-2">
              <Grip size={14} strokeWidth={2.5} aria-hidden />
              Arranging Home
            </span>

            <m.button
              type="button"
              aria-pressed={punchMode}
              onClick={onTogglePunch}
              whileHover={reducedMotion ? undefined : { scale: 1.04 }}
              whileTap={reducedMotion ? undefined : { scale: 0.95 }}
              transition={press}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[10px] font-black uppercase tracking-wide ${
                punchMode
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--text-on-accent))] shadow-[var(--shadow-sm)]'
                  : 'border-2 border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-elevated))] text-[hsl(var(--text-secondary))]'
              }`}
            >
              <PenLine size={13} strokeWidth={2.5} aria-hidden />
              Punch holes
            </m.button>

            {canAddQuickAccess && typeof onAddQuickAccess === 'function' ? (
              <m.button
                type="button"
                onClick={onAddQuickAccess}
                whileHover={reducedMotion ? undefined : { scale: 1.04 }}
                whileTap={reducedMotion ? undefined : { scale: 0.95 }}
                transition={press}
                className="flex items-center gap-1.5 rounded-full border-2 border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-elevated))] px-3.5 py-2 text-[10px] font-black uppercase tracking-wide text-[hsl(var(--text-secondary))]"
                title={
                  selectedIndex != null
                    ? `Add Quick Access at slot ${selectedIndex + 1}`
                    : 'Add Quick Access on first free slot'
                }
              >
                <ShieldPlus size={13} strokeWidth={2.5} aria-hidden />
                Add Quick Access
              </m.button>
            ) : null}

            {isAdminWidget ? (
              <>
                <div
                  className="flex items-center gap-1 rounded-full border-2 border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-elevated)/0.9)] p-1"
                  role="group"
                  aria-label="Widget size"
                >
                  {Object.values(HOME_SLOT_SIZE_PRESETS).map((preset) => {
                    const active = activePreset?.id === preset.id;
                    const blocked = sizeBlockedPresetId === preset.id;
                    return (
                      <m.button
                        key={preset.id}
                        type="button"
                        onClick={() => onSetSizePreset?.(preset.id)}
                        whileHover={reducedMotion ? undefined : { scale: 1.06 }}
                        whileTap={reducedMotion ? undefined : { scale: 0.94 }}
                        transition={press}
                        aria-pressed={active}
                        title={
                          blocked
                            ? `${preset.label} needs free neighboring slots`
                            : `${preset.label} · ${preset.colSpan}×${preset.rowSpan}`
                        }
                        className={`min-w-[2rem] rounded-full px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide ${
                          active
                            ? 'bg-[hsl(var(--primary))] text-[hsl(var(--text-on-accent))]'
                            : blocked
                              ? 'text-[hsl(var(--text-tertiary))] opacity-60'
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
                  className="flex items-center gap-1.5 rounded-full border-2 border-[hsl(var(--state-error)/0.4)] bg-[hsl(var(--state-error)/0.12)] px-3.5 py-2 text-[10px] font-black uppercase tracking-wide text-[hsl(var(--state-error))]"
                >
                  <Trash2 size={13} strokeWidth={2.5} aria-hidden />
                  Remove
                </m.button>
              </>
            ) : null}

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
  canAddQuickAccess: PropTypes.bool,
  onAddQuickAccess: PropTypes.func,
  onRemoveWidget: PropTypes.func,
  onSetSizePreset: PropTypes.func,
  sizeBlockedPresetId: PropTypes.string,
};

export default React.memo(HomeBoardArrangeBar);
