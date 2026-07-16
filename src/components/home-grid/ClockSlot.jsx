/**
 * Home-grid Clock tile — local time/date using ribbon time font + color prefs.
 */
import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Clock } from 'lucide-react';
import HomeWidgetShell from './HomeWidgetShell';
import { normalizeHomeWidgetSurface } from '../../utils/homeWidgetSurface';
import { matchSizePresetBySpan } from '../../utils/homeSlotSizePresets';
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

  const sizePreset = useMemo(
    () => matchSizePresetBySpan(slot?.colSpan ?? 1, slot?.rowSpan ?? 1) || matchSizePresetBySpan(1, 1),
    [slot?.colSpan, slot?.rowSpan]
  );
  const isCompact = sizePreset?.id === 'S';
  const showDate = sizePreset?.id === 'M' || sizePreset?.id === 'L' || sizePreset?.id === 'XL';
  const isTall = (sizePreset?.rowSpan ?? 1) > 1;
  const surface = normalizeHomeWidgetSurface(slot?.surface);

  const fontStack =
    timeFont === 'digital'
      ? 'DigitalDisplayRegular-ODEO, monospace'
      : "'Orbitron', sans-serif";
  const color = timeColor || DEFAULT_TIME_COLOR_HEX;

  const handleActivate = useCallback(
    (event) => {
      if (arrangeMode && !punchMode) {
        event?.stopPropagation?.();
        onArrangeSelect?.(channelId);
      }
    },
    [arrangeMode, punchMode, onArrangeSelect, channelId]
  );

  return (
    <HomeWidgetShell
      surface={surface}
      selected={selected}
      className="p-2"
      onClick={handleActivate}
      aria-label={`Clock ${formatClockTime(now)}`}
    >
      <div
        className={`flex h-full w-full min-h-0 flex-col items-center justify-center text-center ${
          isCompact ? 'gap-0.5' : 'gap-1'
        }`}
      >
        {!isCompact ? (
          <div className="flex w-full items-center justify-between gap-1 px-0.5">
            <span className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-secondary))]">
              Clock
            </span>
            <Clock size={12} strokeWidth={2.5} className="shrink-0 text-[hsl(var(--text-tertiary))]" aria-hidden />
          </div>
        ) : null}
        <div
          className={`home-widget-float-type leading-none tabular-nums ${
            isCompact ? 'text-2xl' : isTall ? 'text-5xl' : 'text-3xl'
          }`}
          style={{ fontFamily: fontStack, color }}
        >
          {formatClockTime(now)}
        </div>
        {showDate ? (
          <div
            className={`home-widget-float-type font-black uppercase tracking-[0.08em] text-[hsl(var(--text-secondary))] ${
              isTall ? 'text-xs' : 'text-[10px]'
            }`}
          >
            {formatClockDate(now, { includeWeekday: !isCompact })}
          </div>
        ) : null}
      </div>
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
