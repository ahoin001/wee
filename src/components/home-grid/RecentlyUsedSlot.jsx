import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { History } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import HomeWidgetShell from './HomeWidgetShell';
import { normalizeHomeWidgetSurface } from '../../utils/homeWidgetSurface';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { matchSizePresetBySpan } from '../../utils/homeSlotSizePresets';
import { launchWithFeedback } from '../../utils/launchWithFeedback';
import { useLaunchFeedback } from '../../contexts/LaunchFeedbackContext';

const LAUNCH_TYPE_FALLBACK_ICONS = {
  url: '🌐',
  steam: '🎮',
  epic: '🎮',
  exe: '⚡',
  app: '⚡',
};

function RecentLaunchButton({ entry, onLaunch, compact = false }) {
  return (
    <button
      type="button"
      title={entry.label}
      aria-label={`Launch ${entry.label}`}
      onClick={(event) => {
        event.stopPropagation();
        onLaunch(entry);
      }}
      className={`flex items-center justify-center overflow-hidden rounded-2xl border-2 border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-elevated)/0.85)] text-[hsl(var(--text-primary))] shadow-[var(--shadow-sm)] transition-transform hover:scale-105 active:scale-95 ${
        compact ? 'h-9 w-9 text-base' : 'h-11 w-11 text-lg'
      }`}
    >
      {entry.icon ? (
        <img src={entry.icon} alt="" className="h-full w-full object-cover" draggable={false} />
      ) : (
        <span aria-hidden>{LAUNCH_TYPE_FALLBACK_ICONS[entry.launchType] || '⚡'}</span>
      )}
    </button>
  );
}

RecentLaunchButton.propTypes = {
  entry: PropTypes.shape({
    key: PropTypes.string,
    label: PropTypes.string,
    icon: PropTypes.string,
    launchType: PropTypes.string,
  }).isRequired,
  onLaunch: PropTypes.func.isRequired,
  compact: PropTypes.bool,
};

/**
 * Home-grid Recently Used tile — relaunch recent apps from bounded history
 * (`channels.recentLaunches`, recorded by the channel launch path).
 */
function RecentlyUsedSlot({
  slot,
  channelId,
  arrangeMode = false,
  punchMode = false,
  selected = false,
  onArrangeSelect,
}) {
  const recentLaunches = useConsolidatedAppStore(
    useShallow((state) => state.channels.recentLaunches || [])
  );
  const { beginLaunchFeedback, endLaunchFeedback, showLaunchError } = useLaunchFeedback();

  const sizePreset = useMemo(
    () => matchSizePresetBySpan(slot?.colSpan ?? 1, slot?.rowSpan ?? 1) || matchSizePresetBySpan(1, 1),
    [slot?.colSpan, slot?.rowSpan]
  );
  const capacity = sizePreset?.capacity ?? 0;
  const isCompact = capacity === 0;
  const interactionsLocked = arrangeMode || punchMode;

  const visible = useMemo(
    () => recentLaunches.slice(0, isCompact ? 1 : capacity),
    [recentLaunches, isCompact, capacity]
  );

  const handleLaunch = useCallback(
    async (entry) => {
      if (interactionsLocked || !window.api?.launchApp) return;
      const result = await launchWithFeedback({
        launch: () =>
          window.api.launchApp({
            type: entry.launchType,
            path: entry.path,
            asAdmin: false,
          }),
        beginLaunchFeedback,
        endLaunchFeedback,
        showLaunchError,
        label: `Launching ${entry.label || 'app'}`,
        launchType: entry.launchType,
        path: entry.path,
        source: 'recentlyUsed',
      });
      if (!result || result.ok !== false) {
        useConsolidatedAppStore.getState().actions.recordRecentLaunch(entry);
      }
    },
    [interactionsLocked, beginLaunchFeedback, endLaunchFeedback, showLaunchError]
  );

  const handleTileActivate = useCallback(
    (event) => {
      if (arrangeMode && !punchMode) {
        event?.stopPropagation?.();
        onArrangeSelect?.(channelId);
        return;
      }
      if (interactionsLocked) return;
      if (isCompact && visible[0]) {
        void handleLaunch(visible[0]);
      }
    },
    [arrangeMode, punchMode, interactionsLocked, isCompact, visible, handleLaunch, onArrangeSelect, channelId]
  );

  const isEmpty = visible.length === 0;
  const surface = normalizeHomeWidgetSurface(slot?.surface);

  return (
    <HomeWidgetShell
      surface={surface}
      selected={selected}
      className="p-2"
      onClick={handleTileActivate}
      aria-label="Recently Used"
    >
      {isEmpty ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-center">
          <History
            size={isCompact ? 22 : 28}
            strokeWidth={2.25}
            className="text-[hsl(var(--primary))]"
            aria-hidden
          />
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
            {isCompact ? 'Recents' : 'Launch a channel to fill this'}
          </span>
        </div>
      ) : isCompact ? (
        <button
          type="button"
          className="flex h-full w-full flex-col items-center justify-center gap-1 transition-transform hover:scale-[1.03] active:scale-95"
          onClick={handleTileActivate}
          aria-label={`Relaunch ${visible[0].label}`}
          title={visible[0].label}
          disabled={interactionsLocked && !arrangeMode}
        >
          {visible[0].icon ? (
            <img
              src={visible[0].icon}
              alt=""
              className="h-9 w-9 rounded-xl object-cover"
              draggable={false}
            />
          ) : (
            <History size={26} strokeWidth={2.25} className="text-[hsl(var(--primary))]" aria-hidden />
          )}
          <span className="max-w-full truncate text-[9px] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-secondary))]">
            {visible[0].label}
          </span>
        </button>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between gap-1 px-0.5">
            <span className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-secondary))]">
              Recently Used
            </span>
            <History size={12} strokeWidth={2.5} className="shrink-0 text-[hsl(var(--text-tertiary))]" aria-hidden />
          </div>
          <div
            className={`grid min-h-0 flex-1 content-start gap-1.5 ${
              sizePreset?.id === 'XL' ? 'grid-cols-5' : 'grid-cols-3'
            }`}
          >
            {visible.map((entry) => (
              <RecentLaunchButton
                key={entry.key || entry.path}
                entry={entry}
                onLaunch={handleLaunch}
                compact={sizePreset?.id === 'M'}
              />
            ))}
          </div>
        </div>
      )}
    </HomeWidgetShell>
  );
}

RecentlyUsedSlot.propTypes = {
  slot: PropTypes.object,
  channelId: PropTypes.string.isRequired,
  arrangeMode: PropTypes.bool,
  punchMode: PropTypes.bool,
  selected: PropTypes.bool,
  onArrangeSelect: PropTypes.func,
};

export default React.memo(RecentlyUsedSlot);
