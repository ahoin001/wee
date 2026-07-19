import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { MoreHorizontal, Settings2, Shield } from 'lucide-react';
import {
  createWeeShellRailItemVariants,
  createWeeTransition,
  useWeeMotion,
} from '../../design/weeMotion';
import { WeeFadeScroll, WeeGooeyTileButton } from '../../ui/wee';
import HomeWidgetShell from './HomeWidgetShell';
import { normalizeHomeWidgetSurface } from '../../utils/homeWidgetSurface';
import { resolveHomeWidgetLayout } from '../../utils/homeWidgetLayout';
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

/**
 * Layout cell count for labeled Quick Access grids (icon + label rows).
 * Preset capacity remains the shared data ceiling; visible count uses min(capacity, layoutCells).
 */
function layoutCellsForPreset(presetId) {
  switch (presetId) {
    case 'M':
      return 3; // 2 actions + More
    case 'L':
      return 6; // 2×3 grid
    case 'XL':
      return 9; // 3×3 grid
    default:
      return 0;
  }
}

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
  const pressTransition = createWeeTransition('press', { reducedMotion });
  const { pillOpen } = useWeeMotion();
  const tileVariants = useMemo(
    () => createWeeShellRailItemVariants(pillOpen, reducedMotion),
    [pillOpen, reducedMotion]
  );

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
  const layout = useMemo(
    () => resolveHomeWidgetLayout(slot?.colSpan ?? 1, slot?.rowSpan ?? 1),
    [slot?.colSpan, slot?.rowSpan]
  );
  const capacity = sizePreset?.capacity ?? 0;
  const isCompact = capacity === 0 || layout.isCompact;
  const isSingleRow = (sizePreset?.rowSpan ?? 1) <= 1 || (layout.isWide && layout.rowSpan <= 1);
  const layoutCells = layoutCellsForPreset(sizePreset?.id);
  const visibleCapacity = isCompact
    ? 0
    : Math.min(capacity > 0 ? capacity : layoutCells, layoutCells || capacity);

  const { visible, overflow, showMore } = useMemo(
    () => splitActionsByCapacity(adminConfig.powerActions, visibleCapacity),
    [adminConfig.powerActions, visibleCapacity]
  );

  const moreActions = useMemo(() => {
    if (isCompact) return adminConfig.powerActions;
    return showMore ? overflow : [];
  }, [adminConfig.powerActions, isCompact, overflow, showMore]);

  const gridColsClass = sizePreset?.id === 'XL' ? 'grid-cols-3' : 'grid-cols-2';

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
  const surface = normalizeHomeWidgetSurface(slot?.surface);

  return (
    <>
      <HomeWidgetShell
        surface={surface}
        textColor={slot?.textColor}
        selected={selected}
        className={layout.shellPadClass}
        onClick={handleTileActivate}
        aria-label="Admin Quick Access"
      >
        {actionError ? (
          <div className="mb-1 shrink-0 rounded-lg bg-[hsl(var(--state-error)/0.12)] px-2 py-1 text-[10px] font-semibold text-[hsl(var(--state-error))]">
            {actionError}
          </div>
        ) : null}

        {emptyInvite ? (
          <m.button
            type="button"
            className={`flex h-full w-full flex-col items-center justify-center rounded-[1rem] text-center ${layout.gapClass}`}
            onClick={openConfigure}
            disabled={interactionsLocked}
            whileHover={reducedMotion ? undefined : { scale: 1.03 }}
            whileTap={reducedMotion ? undefined : { scale: 0.95 }}
            transition={pressTransition}
          >
            <Shield
              size={layout.iconPx}
              strokeWidth={2.25}
              className="text-[hsl(var(--primary))]"
              aria-hidden
            />
            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--hw-text-secondary)]">
              Add actions
            </span>
          </m.button>
        ) : isCompact ? (
          <m.button
            type="button"
            className={`flex h-full w-full flex-col items-center justify-center ${layout.gapClass}`}
            onClick={handleTileActivate}
            aria-label="Open Quick Access"
            disabled={interactionsLocked && !arrangeMode}
            whileHover={reducedMotion ? undefined : { scale: 1.03 }}
            whileTap={reducedMotion ? undefined : { scale: 0.95 }}
            transition={pressTransition}
          >
            <Shield
              size={layout.iconPx + 2}
              strokeWidth={2.25}
              className="text-[hsl(var(--primary))]"
              aria-hidden
            />
            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-[var(--hw-text-secondary)]">
              Quick
            </span>
          </m.button>
        ) : (
          <div className={`flex min-h-0 flex-1 flex-col ${layout.gapClass}`}>
            {layout.showHeader ? (
              <div className="flex items-center justify-between gap-1 px-0.5">
                <span className={`truncate ${layout.kickerClass}`}>Quick Access</span>
                <m.button
                  type="button"
                  className="rounded-full p-1 text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-tertiary)/0.6)] hover:text-[hsl(var(--text-primary))]"
                  onClick={openConfigure}
                  disabled={interactionsLocked}
                  aria-label="Configure Quick Access"
                  title="Configure"
                  whileHover={reducedMotion ? undefined : { scale: 1.12, rotate: 12 }}
                  whileTap={reducedMotion ? undefined : { scale: 0.92 }}
                  transition={pressTransition}
                >
                  <Settings2 size={layout.density === 'roomy' ? 16 : 14} strokeWidth={2.5} aria-hidden />
                </m.button>
              </div>
            ) : null}
            {isSingleRow ? (
              <div className={`flex min-h-0 flex-1 flex-col justify-center px-0.5 ${layout.gapClass}`}>
                {visible.map((action, index) => (
                  <MotionDiv
                    key={action.id}
                    className="min-h-0 min-w-0"
                    variants={tileVariants}
                    initial="closed"
                    animate="open"
                    custom={index}
                  >
                    <WeeGooeyTileButton
                      orientation="row"
                      icon={action.icon || '⚡'}
                      label={action.name}
                      title={action.name}
                      reducedMotion={reducedMotion}
                      className="h-full w-full !py-1.5 !px-2.5"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleActionClick(action);
                      }}
                    />
                  </MotionDiv>
                ))}
                {showMore ? (
                  <MotionDiv
                    className="min-h-0 min-w-0"
                    variants={tileVariants}
                    initial="closed"
                    animate="open"
                    custom={visible.length}
                  >
                    <WeeGooeyTileButton
                      orientation="row"
                      dashed
                      icon={
                        <MoreHorizontal
                          size={16}
                          strokeWidth={2.5}
                          className="text-[hsl(var(--text-secondary))]"
                          aria-hidden
                        />
                      }
                      label="More"
                      title="More actions"
                      aria-label="More actions"
                      reducedMotion={reducedMotion}
                      className="h-full w-full !py-1.5 !px-2.5"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (!interactionsLocked) setMoreOpen(true);
                      }}
                    />
                  </MotionDiv>
                ) : null}
              </div>
            ) : (
              <div className={`grid min-h-0 flex-1 auto-rows-fr ${layout.gapClass} ${gridColsClass}`}>
                {visible.map((action, index) => (
                  <MotionDiv
                    key={action.id}
                    className="min-h-0 min-w-0"
                    variants={tileVariants}
                    initial="closed"
                    animate="open"
                    custom={index}
                  >
                    <WeeGooeyTileButton
                      orientation="row"
                      icon={action.icon || '⚡'}
                      label={action.name}
                      title={action.name}
                      reducedMotion={reducedMotion}
                      className="h-full w-full"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleActionClick(action);
                      }}
                    />
                  </MotionDiv>
                ))}
                {showMore ? (
                  <MotionDiv
                    className="min-h-0 min-w-0"
                    variants={tileVariants}
                    initial="closed"
                    animate="open"
                    custom={visible.length}
                  >
                    <WeeGooeyTileButton
                      orientation="row"
                      dashed
                      icon={
                        <MoreHorizontal
                          size={18}
                          strokeWidth={2.5}
                          className="text-[hsl(var(--text-secondary))]"
                          aria-hidden
                        />
                      }
                      label="More"
                      title="More actions"
                      aria-label="More actions"
                      reducedMotion={reducedMotion}
                      className="h-full w-full"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (!interactionsLocked) setMoreOpen(true);
                      }}
                    />
                  </MotionDiv>
                ) : null}
              </div>
            )}
          </div>
        )}

        <AnimatePresence>
          {moreOpen && !interactionsLocked ? (
            <MotionDiv
              key="aqa-more"
              className="home-widget-float-panel absolute inset-1 z-20 flex flex-col overflow-hidden rounded-[1.1rem] border-2 border-[hsl(var(--wee-pill-border))] bg-[hsl(var(--surface-elevated)/0.96)] p-2 shadow-[var(--wee-pill-shadow)] backdrop-blur-xl"
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
              <WeeFadeScroll axis="y" fadePx={28} className="min-h-0 flex-1">
                <div className="space-y-1 pb-2">
                {(isCompact ? adminConfig.powerActions : moreActions).map((action) => (
                  <m.button
                    key={action.id}
                    type="button"
                    className="home-widget-float-chip flex w-full items-center gap-2 rounded-xl border border-[hsl(var(--border-primary)/0.3)] bg-[hsl(var(--surface-primary)/0.65)] px-2.5 py-2 text-left text-xs font-semibold text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface-tertiary)/0.8)]"
                    onClick={() => handleActionClick(action)}
                    whileHover={reducedMotion ? undefined : { scale: 1.02 }}
                    whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                    transition={pressTransition}
                  >
                    <span className="text-base" aria-hidden>
                      {action.icon || '⚡'}
                    </span>
                    <span className="truncate">{action.name}</span>
                  </m.button>
                ))}
                </div>
              </WeeFadeScroll>
            </MotionDiv>
          ) : null}
        </AnimatePresence>
      </HomeWidgetShell>

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
