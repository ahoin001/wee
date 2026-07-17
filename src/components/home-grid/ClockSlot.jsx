/**
 * Home-grid Clock widget — stacked local time + date.
 * Looks (align / date stack / color) live on `ui.homeClockWidget`.
 */
import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import HomeWidgetShell from './HomeWidgetShell';
import { normalizeHomeWidgetSurface } from '../../utils/homeWidgetSurface';
import { resolveHomeWidgetLayout } from '../../utils/homeWidgetLayout';
import { useTimeColor, useTimeFont } from '../../utils/useConsolidatedAppHooks';
import { DEFAULT_TIME_COLOR_HEX } from '../../design/runtimeColorStrings';
import { useActivityInterval } from '../../hooks/useActivityInterval';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import {
  HOME_CLOCK_ALIGN,
  HOME_CLOCK_DATE_STACK,
  normalizeHomeClockWidget,
} from '../../utils/homeClockWidgetPrefs';

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

function alignItemsClass(align) {
  if (align === HOME_CLOCK_ALIGN.left) return 'items-start text-left';
  if (align === HOME_CLOCK_ALIGN.right) return 'items-end text-right';
  return 'items-center text-center';
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
  const clockPrefsRaw = useConsolidatedAppStore((s) => s.ui?.homeClockWidget);
  const looks = useMemo(() => normalizeHomeClockWidget(clockPrefsRaw), [clockPrefsRaw]);
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
  const color = looks.color || timeColor || DEFAULT_TIME_COLOR_HEX;

  const timeSizeClass = layout.isCompact
    ? 'text-xl'
    : layout.isTall
      ? 'text-5xl'
      : layout.density === 'roomy'
        ? 'text-4xl'
        : layout.isWide
          ? 'text-4xl'
          : 'text-3xl';

  // Medium (cozy / wide 2×1 or 2×2) needs a pronounced date — compact stays readable but smaller.
  const dateSizeClass = layout.isCompact
    ? 'text-[10px] tracking-[0.1em]'
    : layout.density === 'roomy' || layout.isTall
      ? 'text-sm tracking-[0.12em]'
      : 'text-xs tracking-[0.11em]';

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

  const dateBlock = (
    <div
      className={`home-widget-float-type font-black uppercase leading-tight ${dateSizeClass}`}
      style={{
        fontFamily: fontStack,
        color,
        opacity: layout.isCompact ? 0.72 : 0.82,
      }}
    >
      {formatClockDate(now, { includeWeekday: !layout.isCompact })}
    </div>
  );

  const stackAbove = looks.dateStack === HOME_CLOCK_DATE_STACK.above;
  const alignClass = alignItemsClass(looks.align);
  const stackGap = layout.isCompact ? 'gap-0.5' : layout.density === 'roomy' ? 'gap-2' : 'gap-1.5';

  return (
    <HomeWidgetShell
      surface={surface}
      selected={selected}
      className={layout.shellPadClass}
      onClick={handleActivate}
      aria-label={`Clock ${formatClockTime(now)}, ${formatClockDate(now)}`}
    >
      <div
        className={`flex h-full w-full min-h-0 flex-col justify-center ${alignClass} ${stackGap}`}
      >
        {stackAbove ? dateBlock : null}
        {timeBlock}
        {!stackAbove ? dateBlock : null}
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
