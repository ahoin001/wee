import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { MoreHorizontal, Settings2, Shield } from 'lucide-react';
import { createWeeTransition } from '../../design/weeMotion';
import { WeeGlassPill } from '../../ui/wee';
import {
  applyAdminPanelPowerActions,
  executeAdminCommand,
  isDestructiveAdminAction,
  normalizeAdminPanelConfig,
} from '../../utils/adminPanelCommands';
import { matchSizePresetBySpan } from '../../utils/homeSlotSizePresets';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { useFloatingWidgetsState, useUIState } from '../../utils/useConsolidatedAppHooks';
import AdminPanel from '../admin/AdminPanel';

const MotionDiv = m.div;

/**
 * @param {Array<{ id: string }>} actions
 * @param {number} capacity
 */
function splitActionsByCapacity(actions, capacity) {
  const list = Array.isArray(actions) ? actions : [];
  const cap = Math.max(0, capacity | 0);
  if (cap <= 0) {
    return { visible: [], overflow: list, showMore: list.length > 0 };
  }
  if (list.length <= cap) {
    return { visible: list, overflow: [], showMore: false };
  }
  const visibleCount = Math.max(0, cap - 1);
  return {
    visible: list.slice(0, visibleCount),
    overflow: list.slice(visibleCount),
    showMore: true,
  };
}

function ActionIconButton({ action, onClick, compact = false }) {
  return (
    <button
      type="button"
      title={action.name}
      aria-label={action.name}
      onClick={(event) => {
        event.stopPropagation();
        onClick(action);
      }}
      className={`flex items-center justify-center rounded-2xl border-2 border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-elevated)/0.85)] text-[hsl(var(--text-primary))] shadow-[var(--shadow-sm)] transition-transform hover:scale-105 active:scale-95 ${
        compact ? 'h-9 w-9 text-base' : 'h-11 w-11 text-lg'
      }`}
    >
      <span aria-hidden>{action.icon || '⚡'}</span>
    </button>
  );
}

ActionIconButton.propTypes = {
  action: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    icon: PropTypes.string,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
  compact: PropTypes.bool,
};

/**
 * Home-grid Admin Quick Access — WeeGlassPill action pad.
 * Actions SSOT: floatingWidgets.adminPanel.config.
 */
function AdminQuickAccessSlot({
  slot,
  channelId,
  arrangeMode = false,
  punchMode = false,
  selected = false,
  onArrangeSelect,
}) {
  const reducedMotion = useReducedMotion();
  const pillTransition = createWeeTransition('pillOpen', { reducedMotion });

  const { floatingWidgets, setFloatingWidgetsState } = useFloatingWidgetsState();
  const { confirmAction } = useUIState();
  const [moreOpen, setMoreOpen] = useState(false);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [actionError, setActionError] = useState('');

  const adminConfig = useMemo(
    () => normalizeAdminPanelConfig(floatingWidgets?.adminPanel?.config),
    [floatingWidgets?.adminPanel?.config]
  );

  const sizePreset = useMemo(
    () => matchSizePresetBySpan(slot?.colSpan ?? 1, slot?.rowSpan ?? 1) || matchSizePresetBySpan(1, 1),
    [slot?.colSpan, slot?.rowSpan]
  );
  const capacity = sizePreset?.capacity ?? 0;
  const isCompact = capacity === 0;

  const { visible, overflow, showMore } = useMemo(
    () => splitActionsByCapacity(adminConfig.powerActions, capacity),
    [adminConfig.powerActions, capacity]
  );

  const moreActions = useMemo(() => {
    if (isCompact) return adminConfig.powerActions;
    return showMore ? overflow : [];
  }, [adminConfig.powerActions, isCompact, overflow, showMore]);

  const interactionsLocked = arrangeMode || punchMode;

  const runAction = useCallback(async (action) => {
    setActionError('');
    const result = await executeAdminCommand(action.command);
    if (!result.success) {
      setActionError(result.error || `Could not run “${action.name}”`);
      return;
    }
    setMoreOpen(false);
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

  const handleConfigureSave = useCallback(
    (powerActionsOrConfig) => {
      const store = useConsolidatedAppStore.getState();
      const currentAdminPanel = store.floatingWidgets.adminPanel;
      setFloatingWidgetsState({
        adminPanel: applyAdminPanelPowerActions(currentAdminPanel, powerActionsOrConfig),
      });
      setConfigureOpen(false);
    },
    [setFloatingWidgetsState]
  );

  const openConfigure = useCallback(
    (event) => {
      event?.stopPropagation?.();
      if (interactionsLocked) return;
      setMoreOpen(false);
      setConfigureOpen(true);
    },
    [interactionsLocked]
  );

  const handleTileActivate = useCallback(
    (event) => {
      if (arrangeMode && !punchMode) {
        event?.stopPropagation?.();
        onArrangeSelect?.(channelId);
        return;
      }
      if (interactionsLocked) return;
      if (isCompact) {
        if (adminConfig.powerActions.length === 0) {
          setConfigureOpen(true);
        } else {
          setMoreOpen((open) => !open);
        }
      }
    },
    [
      arrangeMode,
      punchMode,
      interactionsLocked,
      isCompact,
      adminConfig.powerActions.length,
      onArrangeSelect,
      channelId,
    ]
  );

  const emptyInvite = adminConfig.powerActions.length === 0;

  return (
    <>
      <WeeGlassPill
        as="div"
        className={`relative flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[1.35rem] p-2 ${
          selected
            ? 'ring-2 ring-[hsl(var(--primary))] ring-offset-2 ring-offset-[hsl(var(--surface-primary)/0)]'
            : ''
        }`}
        onClick={handleTileActivate}
        role="group"
        aria-label="Admin Quick Access"
      >
        {actionError ? (
          <div className="mb-1 shrink-0 rounded-lg bg-[hsl(var(--state-error)/0.12)] px-2 py-1 text-[10px] font-semibold text-[hsl(var(--state-error))]">
            {actionError}
          </div>
        ) : null}

        {emptyInvite ? (
          <button
            type="button"
            className="flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-[1rem] text-center"
            onClick={openConfigure}
            disabled={interactionsLocked}
          >
            <Shield
              size={isCompact ? 22 : 28}
              strokeWidth={2.25}
              className="text-[hsl(var(--primary))]"
              aria-hidden
            />
            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
              Add actions
            </span>
          </button>
        ) : isCompact ? (
          <button
            type="button"
            className="flex h-full w-full flex-col items-center justify-center gap-1 transition-transform hover:scale-[1.03] active:scale-95"
            onClick={handleTileActivate}
            aria-label="Open Quick Access"
            disabled={interactionsLocked && !arrangeMode}
          >
            <Shield size={26} strokeWidth={2.25} className="text-[hsl(var(--primary))]" aria-hidden />
            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-secondary))]">
              Quick
            </span>
          </button>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-1.5">
            <div className="flex items-center justify-between gap-1 px-0.5">
              <span className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-secondary))]">
                Quick Access
              </span>
              <button
                type="button"
                className="rounded-full p-1 text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-tertiary)/0.6)] hover:text-[hsl(var(--text-primary))]"
                onClick={openConfigure}
                disabled={interactionsLocked}
                aria-label="Configure Quick Access"
                title="Configure"
              >
                <Settings2 size={14} strokeWidth={2.5} aria-hidden />
              </button>
            </div>
            <div
              className={`grid min-h-0 flex-1 content-start gap-1.5 ${
                sizePreset?.id === 'XL' ? 'grid-cols-5' : 'grid-cols-3'
              }`}
            >
              {visible.map((action) => (
                <ActionIconButton
                  key={action.id}
                  action={action}
                  onClick={handleActionClick}
                  compact={sizePreset?.id === 'M'}
                />
              ))}
              {showMore ? (
                <button
                  type="button"
                  className={`flex items-center justify-center rounded-2xl border-2 border-dashed border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-tertiary)/0.55)] text-[hsl(var(--text-secondary))] transition-transform hover:scale-105 active:scale-95 ${
                    sizePreset?.id === 'M' ? 'h-9 w-9' : 'h-11 w-11'
                  }`}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!interactionsLocked) setMoreOpen(true);
                  }}
                  aria-label="More actions"
                  title="More"
                >
                  <MoreHorizontal size={16} strokeWidth={2.5} aria-hidden />
                </button>
              ) : null}
            </div>
          </div>
        )}

        <AnimatePresence>
          {moreOpen && !interactionsLocked ? (
            <MotionDiv
              key="aqa-more"
              className="absolute inset-1 z-20 flex flex-col overflow-hidden rounded-[1.1rem] border-2 border-[hsl(var(--wee-pill-border))] bg-[hsl(var(--surface-elevated)/0.96)] p-2 shadow-[var(--wee-pill-shadow)] backdrop-blur-xl"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
              transition={pillTransition}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
                  Actions
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="rounded-full px-2 py-1 text-[10px] font-bold text-[hsl(var(--primary))]"
                    onClick={openConfigure}
                  >
                    Configure
                  </button>
                  <button
                    type="button"
                    className="rounded-full px-2 py-1 text-[10px] font-bold text-[hsl(var(--text-secondary))]"
                    onClick={() => setMoreOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
                {(isCompact ? adminConfig.powerActions : moreActions).map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-xl border border-[hsl(var(--border-primary)/0.3)] bg-[hsl(var(--surface-primary)/0.65)] px-2.5 py-2 text-left text-xs font-semibold text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface-tertiary)/0.8)]"
                    onClick={() => handleActionClick(action)}
                  >
                    <span className="text-base" aria-hidden>
                      {action.icon || '⚡'}
                    </span>
                    <span className="truncate">{action.name}</span>
                  </button>
                ))}
              </div>
            </MotionDiv>
          ) : null}
        </AnimatePresence>
      </WeeGlassPill>

      <AdminPanel
        isOpen={configureOpen}
        onClose={() => setConfigureOpen(false)}
        onSave={handleConfigureSave}
        config={adminConfig}
      />
    </>
  );
}

AdminQuickAccessSlot.propTypes = {
  slot: PropTypes.object,
  channelId: PropTypes.string.isRequired,
  arrangeMode: PropTypes.bool,
  punchMode: PropTypes.bool,
  selected: PropTypes.bool,
  onArrangeSelect: PropTypes.func,
};

export default React.memo(AdminQuickAccessSlot);
