import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { History } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import HomeWidgetShell from './HomeWidgetShell';
import { normalizeHomeWidgetSurface } from '../../utils/homeWidgetSurface';
import { resolveHomeWidgetLayout } from '../../utils/homeWidgetLayout';
import { matchSizePresetBySpan } from '../../utils/homeSlotSizePresets';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { launchWithFeedback } from '../../utils/launchWithFeedback';
import { useLaunchFeedback } from '../../contexts/LaunchFeedbackContext';

const EMPTY_RECENT_LAUNCHES = Object.freeze([]);

const LAUNCH_TYPE_FALLBACK_ICONS = {
  url: '🌐',
  steam: '🎮',
  epic: '🎮',
  exe: '⚡',
  app: '⚡',
};

function RecentLaunchButton({ entry, onLaunch, size = 'md', showLabel = false }) {
  const box =
    size === 'sm'
      ? 'h-9 w-9 text-base rounded-xl'
      : size === 'lg'
        ? 'h-12 w-12 text-xl rounded-2xl'
        : 'h-11 w-11 text-lg rounded-2xl';

  return (
    <button
      type="button"
      title={entry.label}
      aria-label={`Launch ${entry.label}`}
      onClick={(event) => {
        event.stopPropagation();
        onLaunch(entry);
      }}
      className={`home-widget-float-tile flex min-w-0 flex-col items-center justify-center gap-1 overflow-hidden border-2 border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-elevated)/0.85)] text-[var(--hw-text-primary)] shadow-[var(--shadow-sm)] transition-transform hover:scale-105 active:scale-95 ${
        showLabel ? 'w-full p-1.5' : ''
      }`}
    >
      <span className={`flex shrink-0 items-center justify-center overflow-hidden ${box}`}>
        {entry.icon ? (
          <img src={entry.icon} alt="" className="h-full w-full object-cover" draggable={false} />
        ) : (
          <span aria-hidden>{LAUNCH_TYPE_FALLBACK_ICONS[entry.launchType] || '⚡'}</span>
        )}
      </span>
      {showLabel ? (
        <span className="w-full truncate text-center text-[8px] font-black uppercase tracking-[0.06em] text-[var(--hw-text-secondary)]">
          {entry.label}
        </span>
      ) : null}
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
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showLabel: PropTypes.bool,
};

/**
 * Home-grid Recently Used tile — relaunch recent apps from bounded history.
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
    useShallow((state) =>
      Array.isArray(state.channels.recentLaunches)
        ? state.channels.recentLaunches
        : EMPTY_RECENT_LAUNCHES
    )
  );
  const { beginLaunchFeedback, endLaunchFeedback, showLaunchError } = useLaunchFeedback();

  const layout = useMemo(
    () => resolveHomeWidgetLayout(slot?.colSpan ?? 1, slot?.rowSpan ?? 1),
    [slot?.colSpan, slot?.rowSpan]
  );
  const sizePreset = useMemo(
    () => matchSizePresetBySpan(slot?.colSpan ?? 1, slot?.rowSpan ?? 1) || matchSizePresetBySpan(1, 1),
    [slot?.colSpan, slot?.rowSpan]
  );
  const capacity = sizePreset?.capacity ?? 0;
  const isCompact = layout.isCompact || capacity === 0;
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
  const iconSize = layout.density === 'roomy' ? 'lg' : layout.density === 'compact' || layout.isWide ? 'sm' : 'md';
  const gridCols = layout.iconGridCols;

  return (
    <HomeWidgetShell
      surface={surface}
      textColor={slot?.textColor}
      selected={selected}
      className={layout.shellPadClass}
      onClick={handleTileActivate}
      aria-label="Recently Used"
    >
      {isEmpty ? (
        <div className={`flex h-full w-full flex-col items-center justify-center text-center ${layout.gapClass}`}>
          <History
            size={layout.iconPx}
            strokeWidth={2.25}
            className="text-[hsl(var(--primary))]"
            aria-hidden
          />
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--hw-text-secondary)]">
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
          <span className="max-w-full truncate text-[9px] font-black uppercase tracking-[0.14em] text-[var(--hw-text-secondary)]">
            {visible[0].label}
          </span>
        </button>
      ) : layout.isWide && !layout.isTall ? (
        <div className={`flex min-h-0 flex-1 flex-col ${layout.gapClass}`}>
          {layout.showHeader ? (
            <div className="flex items-center justify-between gap-1 px-0.5">
              <span className={`truncate ${layout.kickerClass}`}>Recently Used</span>
              <History size={12} strokeWidth={2.5} className="shrink-0 text-[var(--hw-text-tertiary)]" aria-hidden />
            </div>
          ) : null}
          <div className="flex min-h-0 flex-1 items-center justify-start gap-1.5 overflow-hidden">
            {visible.map((entry) => (
              <RecentLaunchButton
                key={entry.key || entry.path}
                entry={entry}
                onLaunch={handleLaunch}
                size={iconSize}
                showLabel={false}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className={`flex min-h-0 flex-1 flex-col ${layout.gapClass}`}>
          {layout.showHeader ? (
            <div className="flex items-center justify-between gap-1 px-0.5">
              <span className={`truncate ${layout.kickerClass}`}>Recently Used</span>
              <History size={12} strokeWidth={2.5} className="shrink-0 text-[var(--hw-text-tertiary)]" aria-hidden />
            </div>
          ) : null}
          <div
            className="grid min-h-0 flex-1 content-start gap-1.5"
            style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
          >
            {visible.map((entry) => (
              <RecentLaunchButton
                key={entry.key || entry.path}
                entry={entry}
                onLaunch={handleLaunch}
                size={iconSize}
                showLabel={layout.showIconLabels}
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
