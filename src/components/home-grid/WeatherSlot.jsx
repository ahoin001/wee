/**
 * Home-grid Weather tile — Open-Meteo current + short forecast (shared TTL cache).
 */
import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { CloudSun, MapPin } from 'lucide-react';
import HomeWidgetShell from './HomeWidgetShell';
import { normalizeHomeWidgetSurface } from '../../utils/homeWidgetSurface';
import { matchSizePresetBySpan } from '../../utils/homeSlotSizePresets';
import { useHomeWeather } from '../../hooks/useHomeWeather';

function formatTemp(value) {
  if (!Number.isFinite(value)) return '—';
  return `${Math.round(value)}°`;
}

function WeatherSlot({
  slot,
  channelId,
  arrangeMode = false,
  punchMode = false,
  selected = false,
  onArrangeSelect,
}) {
  const { status, current, daily, error, locationSource, refresh } = useHomeWeather({
    enabled: true,
  });

  const sizePreset = useMemo(
    () => matchSizePresetBySpan(slot?.colSpan ?? 1, slot?.rowSpan ?? 1) || matchSizePresetBySpan(1, 1),
    [slot?.colSpan, slot?.rowSpan]
  );
  const isCompact = sizePreset?.id === 'S';
  const isTall = (sizePreset?.rowSpan ?? 1) > 1;
  const interactionsLocked = arrangeMode || punchMode;
  const surface = normalizeHomeWidgetSurface(slot?.surface);

  const handleActivate = useCallback(
    (event) => {
      if (arrangeMode && !punchMode) {
        event?.stopPropagation?.();
        onArrangeSelect?.(channelId);
        return;
      }
      if (interactionsLocked) return;
      if (status === 'denied' || status === 'error') {
        void refresh({ force: true });
      }
    },
    [arrangeMode, punchMode, interactionsLocked, status, refresh, onArrangeSelect, channelId]
  );

  const emptyMessage =
    status === 'denied'
      ? 'Allow location for local weather'
      : status === 'error'
        ? error || 'Weather unavailable'
        : status === 'loading'
          ? 'Loading weather…'
          : 'Weather';

  return (
    <HomeWidgetShell
      surface={surface}
      selected={selected}
      className="p-2"
      onClick={handleActivate}
      aria-label={current ? `Weather ${formatTemp(current.temperature)} ${current.label}` : 'Weather'}
    >
      {!current ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-center">
          <CloudSun
            size={isCompact ? 22 : 28}
            strokeWidth={2.25}
            className="text-[hsl(var(--primary))]"
            aria-hidden
          />
          <span className="max-w-[12rem] text-[10px] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
            {emptyMessage}
          </span>
          {status === 'denied' && !isCompact ? (
            <span className="flex items-center gap-1 text-[9px] font-bold text-[hsl(var(--text-tertiary))]">
              <MapPin size={10} aria-hidden />
              OS location needed
            </span>
          ) : null}
        </div>
      ) : isCompact ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-0.5">
          <span className="text-2xl leading-none" aria-hidden>
            {current.emoji}
          </span>
          <span className="text-lg font-black tabular-nums text-[hsl(var(--text-primary))]">
            {formatTemp(current.temperature)}
          </span>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between gap-1 px-0.5">
            <span className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-secondary))]">
              Weather
            </span>
            <CloudSun size={12} strokeWidth={2.5} className="shrink-0 text-[hsl(var(--text-tertiary))]" aria-hidden />
          </div>
          <div className={`flex min-h-0 flex-1 items-center gap-2 ${isTall ? 'flex-col' : 'flex-row'}`}>
            <div className={`flex items-center gap-2 ${isTall ? 'w-full justify-center' : 'min-w-0 flex-1'}`}>
              <span className={isTall ? 'text-4xl' : 'text-3xl'} aria-hidden>
                {current.emoji}
              </span>
              <div className="min-w-0 text-left">
                <div className={`font-black tabular-nums text-[hsl(var(--text-primary))] ${isTall ? 'text-4xl' : 'text-2xl'}`}>
                  {formatTemp(current.temperature)}
                </div>
                <div className="truncate text-[10px] font-bold text-[hsl(var(--text-secondary))]">
                  {current.label}
                </div>
                {locationSource === 'fallback' ? (
                  <div className="text-[9px] font-bold text-[hsl(var(--text-tertiary))]">Approx. location</div>
                ) : null}
              </div>
            </div>
            {isTall && Array.isArray(daily) && daily.length > 1 ? (
              <div className="grid w-full grid-cols-2 gap-1.5">
                {daily.slice(1, 3).map((day) => (
                  <div
                    key={day.date}
                    className="flex items-center gap-1.5 rounded-xl border border-[hsl(var(--border-primary)/0.25)] bg-[hsl(var(--surface-elevated)/0.55)] px-2 py-1.5"
                  >
                    <span aria-hidden>{day.emoji}</span>
                    <div className="min-w-0">
                      <div className="truncate text-[9px] font-black uppercase tracking-wider text-[hsl(var(--text-tertiary))]">
                        {new Date(`${day.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="text-[10px] font-bold tabular-nums text-[hsl(var(--text-primary))]">
                        {formatTemp(day.tempMax)} / {formatTemp(day.tempMin)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </HomeWidgetShell>
  );
}

WeatherSlot.propTypes = {
  slot: PropTypes.object,
  channelId: PropTypes.string,
  arrangeMode: PropTypes.bool,
  punchMode: PropTypes.bool,
  selected: PropTypes.bool,
  onArrangeSelect: PropTypes.func,
};

export default React.memo(WeatherSlot);
