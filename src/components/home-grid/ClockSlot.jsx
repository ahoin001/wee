/**
 * Home-grid Clock tile — local time/date using ribbon time font + color prefs.
 * Layout adapts to compact / wide / tall footprints.
 */
import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Clock } from 'lucide-react';
import HomeWidgetShell from './HomeWidgetShell';
import { normalizeHomeWidgetSurface } from '../../utils/homeWidgetSurface';
import { resolveHomeWidgetLayout } from '../../utils/homeWidgetLayout';
import { useTimeColor, useTimeFont } from '../../utils/useConsolidatedAppHooks';
import { DEFAULT_TIME_COLOR_HEX } from '../../design/runtimeColorStrings';
import { useActivityInterval } from '../../hooks/useActivityInterval';

function formatClockTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatClockDate(date, { includeWeekday = true } = {}) {
  return date.toLocaleDateString('en-US', {
    weekday: includeWeekday ? 'short' : undefined,
    month: 'short',
    day: 'numeric',
  });
}

function ClockSlot({
  slot,
  channelId,
  arrangeMode = false,
  punchMode = false,
  selected = false,
  onArrangeSelect,
}) {
  const timeFont = useTimeFont();
  const timeColor = useTimeColor();
  const [now, setNow] = useState(() => new Date());

  useActivityInterval(() => setNow(new Date()), 1000, {
    enabled: true,
    fireOnResume: true,
  });

  const layout = useMemo(
    () => resolveHomeWidgetLayout(slot?.colSpan ?? 1, slot?.rowSpan ?? 1),
    [slot?.colSpan, slot?.rowSpan]
  );
  const surface = normalizeHomeWidgetSurface(slot?.surface);

  const fontStack =
    timeFont === 'digital'
      ? 'DigitalDisplayRegular-ODEO, monospace'
      : "'Orbitron', sans-serif";
  const color = timeColor || DEFAULT_TIME_COLOR_HEX;

  const timeSizeClass = layout.isCompact
    ? 'text-2xl'
    : layout.isTall
      ? 'text-5xl'
      : layout.isWide
        ? 'text-4xl'
        : layout.density === 'roomy'
          ? 'text-4xl'
          : 'text-3xl';

  const handleActivate = useCallback(
    (event) => {
      if (arrangeMode && !punchMode) {
        event?.stopPropagation?.();
        onArrangeSelect?.(channelId);
      }
    },
    [arrangeMode, punchMode, onArrangeSelect, channelId]
  );

  const timeBlock = (
    <div
      className={`home-widget-float-type leading-none tabular-nums ${timeSizeClass}`}
      style={{ fontFamily: fontStack, color }}
    >
      {formatClockTime(now)}
    </div>
  );

  const dateBlock =
    !layout.isCompact ? (
      <div
        className={`home-widget-float-type font-black uppercase tracking-[0.08em] text-[hsl(var(--text-secondary))] ${
          layout.isTall || layout.density === 'roomy' ? 'text-xs' : 'text-[10px]'
        }`}
      >
        {formatClockDate(now, { includeWeekday: true })}
      </div>
    ) : null;

  return (
    <HomeWidgetShell
      surface={surface}
      selected={selected}
      className={layout.shellPadClass}
      onClick={handleActivate}
      aria-label={`Clock ${formatClockTime(now)}`}
    >
      {layout.isWide && !layout.isCompact ? (
        <div className={`flex h-full w-full min-h-0 items-center justify-between ${layout.gapClass}`}>
          <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-1">
            {layout.showHeader ? (
              <span className={layout.kickerClass}>Clock</span>
            ) : null}
            {timeBlock}
          </div>
          <div className="flex shrink-0 flex-col items-end justify-center gap-1 text-right">
            <Clock
              size={layout.iconPx - 8}
              strokeWidth={2.5}
              className="text-[hsl(var(--text-tertiary))]"
              aria-hidden
            />
            {dateBlock}
          </div>
        </div>
      ) : (
        <div
          className={`flex h-full w-full min-h-0 flex-col items-center justify-center text-center ${layout.gapClass}`}
        >
          {layout.showHeader ? (
            <div className="flex w-full items-center justify-between gap-1 px-0.5">
              <span className={`truncate ${layout.kickerClass}`}>Clock</span>
              <Clock
                size={12}
                strokeWidth={2.5}
                className="shrink-0 text-[hsl(var(--text-tertiary))]"
                aria-hidden
              />
            </div>
          ) : null}
          {timeBlock}
          {dateBlock}
        </div>
      )}
    </HomeWidgetShell>
  );
}

ClockSlot.propTypes = {
  slot: PropTypes.object,
  channelId: PropTypes.string,
  arrangeMode: PropTypes.bool,
  punchMode: PropTypes.bool,
  selected: PropTypes.bool,
  onArrangeSelect: PropTypes.func,
};

export default React.memo(ClockSlot);
