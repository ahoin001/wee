/**
 * Home-grid System Pad — power status + a few allowlisted admin actions.
 * Lighter than full Quick Access; actions are fixed (not user-pinned).
 */
import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Battery, BatteryCharging, Shield } from 'lucide-react';
import HomeWidgetShell from './HomeWidgetShell';
import { WeeGooeyTileButton } from '../../ui/wee';
import { normalizeHomeWidgetSurface } from '../../utils/homeWidgetSurface';
import { resolveHomeWidgetLayout } from '../../utils/homeWidgetLayout';
import { matchSizePresetBySpan } from '../../utils/homeSlotSizePresets';
import {
  ADMIN_POWER_ACTIONS_CATALOG,
  executeAdminCommand,
  isDestructiveAdminAction,
} from '../../utils/adminPanelCommands';
import { useUIState } from '../../utils/useConsolidatedAppHooks';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { useReducedMotion } from 'framer-motion';

const SYSTEM_PAD_ACTION_IDS = Object.freeze(['lock', 'taskmgr', 'explorer']);

function SystemPadSlot({
  slot,
  channelId,
  arrangeMode = false,
  punchMode = false,
  selected = false,
  onArrangeSelect,
}) {
  const reducedMotion = useReducedMotion();
  const { confirmAction } = useUIState();
  const onBattery = useConsolidatedAppStore((s) => Boolean(s.ui?.systemPower?.onBattery));

  const actions = useMemo(
    () =>
      SYSTEM_PAD_ACTION_IDS.map((id) =>
        ADMIN_POWER_ACTIONS_CATALOG.find((action) => action.id === id)
      ).filter(Boolean),
    []
  );

  const layout = useMemo(
    () => resolveHomeWidgetLayout(slot?.colSpan ?? 1, slot?.rowSpan ?? 1),
    [slot?.colSpan, slot?.rowSpan]
  );
  const sizePreset = useMemo(
    () => matchSizePresetBySpan(slot?.colSpan ?? 1, slot?.rowSpan ?? 1) || matchSizePresetBySpan(1, 1),
    [slot?.colSpan, slot?.rowSpan]
  );
  const isCompact = layout.isCompact || (sizePreset?.capacity ?? 0) === 0;
  const interactionsLocked = arrangeMode || punchMode;
  const surface = normalizeHomeWidgetSurface(slot?.surface);

  const runAction = useCallback(async (action) => {
    await executeAdminCommand(action.command);
  }, []);

  const handleActionClick = useCallback(
    (action) => {
      if (interactionsLocked) return;
      if (isDestructiveAdminAction(action)) {
        confirmAction(
          `Run ${action.name}?`,
          `This will run <strong>${action.name}</strong> on your PC. Continue?`,
          () => {
            void runAction(action);
          },
          null,
          'Run',
          'danger-primary'
        );
        return;
      }
      void runAction(action);
    },
    [confirmAction, interactionsLocked, runAction]
  );

  const handleActivate = useCallback(
    (event) => {
      if (arrangeMode && !punchMode) {
        event?.stopPropagation?.();
        onArrangeSelect?.(channelId);
      }
    },
    [arrangeMode, punchMode, onArrangeSelect, channelId]
  );

  const PowerIcon = onBattery ? Battery : BatteryCharging;
  const powerLabel = onBattery ? 'On battery' : 'Plugged in';

  return (
    <HomeWidgetShell
      surface={surface}
      textColor={slot?.textColor}
      selected={selected}
      className={layout.shellPadClass}
      onClick={handleActivate}
      aria-label="System Pad"
    >
      <div className={`flex min-h-0 flex-1 flex-col ${layout.gapClass}`}>
        {layout.showHeader || !isCompact ? (
          <div className="flex items-center justify-between gap-1 px-0.5">
            <span className={`truncate ${layout.kickerClass}`}>System</span>
            <span
              className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--border-primary)/0.3)] bg-[hsl(var(--surface-elevated)/0.65)] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] text-[var(--hw-text-secondary)]"
              title={powerLabel}
            >
              <PowerIcon
                size={10}
                strokeWidth={2.5}
                className={
                  onBattery
                    ? 'text-[hsl(var(--state-warning))]'
                    : 'text-[hsl(var(--state-success))]'
                }
                aria-hidden
              />
              {isCompact ? null : powerLabel}
            </span>
          </div>
        ) : null}

        {isCompact ? (
          <button
            type="button"
            className="flex h-full w-full flex-col items-center justify-center gap-1 transition-transform hover:scale-[1.03] active:scale-95"
            onClick={(event) => {
              event.stopPropagation();
              if (arrangeMode && !punchMode) {
                onArrangeSelect?.(channelId);
                return;
              }
              const lock = actions[0];
              if (lock) handleActionClick(lock);
            }}
            disabled={interactionsLocked && !arrangeMode}
            aria-label={powerLabel}
          >
            <PowerIcon
              size={26}
              strokeWidth={2.25}
              className={
                onBattery
                  ? 'text-[hsl(var(--state-warning))]'
                  : 'text-[hsl(var(--primary))]'
              }
              aria-hidden
            />
            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-[var(--hw-text-secondary)]">
              {onBattery ? 'Battery' : 'AC'}
            </span>
          </button>
        ) : (
          <div
            className="grid min-h-0 flex-1 content-start gap-1.5"
            style={{
              gridTemplateColumns: `repeat(${Math.min(3, actions.length)}, minmax(0, 1fr))`,
            }}
          >
            {actions.map((action) => (
              <WeeGooeyTileButton
                key={action.id}
                orientation="stack"
                icon={action.icon || '⚙️'}
                label={action.name}
                title={action.name}
                reducedMotion={Boolean(reducedMotion)}
                disabled={interactionsLocked}
                onClick={(event) => {
                  event?.stopPropagation?.();
                  handleActionClick(action);
                }}
                className="min-h-[3.25rem]"
              />
            ))}
          </div>
        )}

        {!isCompact && layout.density === 'roomy' ? (
          <p className="m-0 flex items-center justify-center gap-1 px-0.5 text-[8px] font-bold text-[var(--hw-text-tertiary)]">
            <Shield size={9} strokeWidth={2.5} aria-hidden />
            Allowlisted actions
          </p>
        ) : null}
      </div>
    </HomeWidgetShell>
  );
}

SystemPadSlot.propTypes = {
  slot: PropTypes.object,
  channelId: PropTypes.string,
  arrangeMode: PropTypes.bool,
  punchMode: PropTypes.bool,
  selected: PropTypes.bool,
  onArrangeSelect: PropTypes.func,
};

export default React.memo(SystemPadSlot);
