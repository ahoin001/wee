/**
 * Home-grid Weather tile — Open-Meteo current + short forecast (shared TTL cache).
 * Temps stored as °C; display unit from `ui.homeWeatherTempUnit` (default °F).
 */
import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { CloudSun, Droplets, MapPin, Wind } from 'lucide-react';
import HomeWidgetShell from './HomeWidgetShell';
import { normalizeHomeWidgetSurface } from '../../utils/homeWidgetSurface';
import { matchSizePresetBySpan } from '../../utils/homeSlotSizePresets';
import { useHomeWeather } from '../../hooks/useHomeWeather';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import {
  formatHomeWeatherTemp,
  formatHomeWeatherWind,
  normalizeHomeWeatherTempUnit,
} from '../../utils/homeWeather';

function WeatherSlot({
  slot,
  channelId,
  arrangeMode = false,
  punchMode = false,
  selected = false,
  onArrangeSelect,
}) {
  const tempUnit = useConsolidatedAppStore((s) =>
    normalizeHomeWeatherTempUnit(s.ui?.homeWeatherTempUnit)
  );
  const { status, current, daily, error, locationSource, refresh } = useHomeWeather({
    enabled: true,
  });

  const sizePreset = useMemo(
    () => matchSizePresetBySpan(slot?.colSpan ?? 1, slot?.rowSpan ?? 1) || matchSizePresetBySpan(1, 1),
    [slot?.colSpan, slot?.rowSpan]
  );
  const isCompact = sizePreset?.id === 'S';
  const isTall = (sizePreset?.rowSpan ?? 1) > 1;
  const showMeta = !isCompact;
  const showForecast = isTall && Array.isArray(daily) && daily.length > 1;
  const interactionsLocked = arrangeMode || punchMode;
  const surface = normalizeHomeWidgetSurface(slot?.surface);

  const formatTemp = useCallback(
    (value, opts) => formatHomeWeatherTemp(value, tempUnit, opts),
    [tempUnit]
  );

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

  const ariaLabel = current
    ? `Weather ${formatTemp(current.temperature)} ${current.label}`
    : 'Weather';

  return (
    <HomeWidgetShell
      surface={surface}
      selected={selected}
      className="relative overflow-hidden p-2"
      onClick={handleActivate}
      aria-label={ariaLabel}
    >
      {/* Soft sky wash — reads on clear + glass without fighting wallpaper */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-90"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 20% 15%, hsl(var(--primary) / 0.22), transparent 55%), radial-gradient(ellipse 80% 60% at 85% 90%, hsl(var(--ambient-secondary) / 0.14), transparent 50%)',
        }}
        aria-hidden
      />

      {!current ? (
        <div className="relative z-[1] flex h-full w-full flex-col items-center justify-center gap-1.5 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-elevated)/0.55)] shadow-[var(--shadow-soft)]">
            <CloudSun
              size={isCompact ? 20 : 24}
              strokeWidth={2.25}
              className="text-[hsl(var(--primary))]"
              aria-hidden
            />
          </div>
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
        <div className="relative z-[1] flex h-full w-full flex-col items-center justify-center gap-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[hsl(var(--border-primary)/0.3)] bg-[hsl(var(--surface-elevated)/0.6)] text-xl leading-none shadow-[var(--shadow-soft)]">
            <span aria-hidden>{current.emoji}</span>
          </div>
          <span className="home-widget-float-type text-base font-black tabular-nums leading-none text-[hsl(var(--text-primary))]">
            {formatTemp(current.temperature)}
          </span>
        </div>
      ) : (
        <div className="relative z-[1] flex min-h-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between gap-1 px-0.5">
            <span className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-secondary))]">
              Weather
            </span>
            <CloudSun size={12} strokeWidth={2.5} className="shrink-0 text-[hsl(var(--text-tertiary))]" aria-hidden />
          </div>

          <div className={`flex min-h-0 flex-1 items-center gap-2.5 ${isTall ? 'flex-col' : 'flex-row'}`}>
            <div className={`flex items-center gap-2.5 ${isTall ? 'w-full justify-center' : 'min-w-0 flex-1'}`}>
              <div
                className={`flex shrink-0 items-center justify-center rounded-2xl border border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-elevated)/0.62)] shadow-[var(--shadow-soft)] ${
                  isTall ? 'h-14 w-14 text-3xl' : 'h-12 w-12 text-2xl'
                }`}
              >
                <span aria-hidden>{current.emoji}</span>
              </div>
              <div className="min-w-0 text-left">
                <div
                  className={`home-widget-float-type font-black tabular-nums leading-none text-[hsl(var(--text-primary))] ${
                    isTall ? 'text-4xl' : 'text-3xl'
                  }`}
                >
                  {formatTemp(current.temperature)}
                </div>
                <div className="mt-0.5 truncate text-[11px] font-bold text-[hsl(var(--text-secondary))]">
                  {current.label}
                </div>
                {locationSource === 'fallback' ? (
                  <div className="mt-0.5 text-[9px] font-bold text-[hsl(var(--text-tertiary))]">
                    Approx. location
                  </div>
                ) : null}
              </div>
            </div>

            {showMeta ? (
              <div
                className={`flex flex-wrap gap-1.5 ${isTall ? 'w-full justify-center' : 'shrink-0 flex-col'}`}
              >
                {Number.isFinite(current.humidity) ? (
                  <div className="home-widget-float-chip inline-flex items-center gap-1 rounded-full border border-[hsl(var(--border-primary)/0.28)] bg-[hsl(var(--surface-elevated)/0.55)] px-2 py-1 text-[9px] font-bold text-[hsl(var(--text-secondary))]">
                    <Droplets size={10} strokeWidth={2.5} className="text-[hsl(var(--primary))]" aria-hidden />
                    {Math.round(current.humidity)}%
                  </div>
                ) : null}
                {Number.isFinite(current.windSpeed) ? (
                  <div className="home-widget-float-chip inline-flex items-center gap-1 rounded-full border border-[hsl(var(--border-primary)/0.28)] bg-[hsl(var(--surface-elevated)/0.55)] px-2 py-1 text-[9px] font-bold text-[hsl(var(--text-secondary))]">
                    <Wind size={10} strokeWidth={2.5} className="text-[hsl(var(--primary))]" aria-hidden />
                    {formatHomeWeatherWind(current.windSpeed, tempUnit)}
                  </div>
                ) : null}
              </div>
            ) : null}

            {showForecast ? (
              <div className="grid w-full grid-cols-2 gap-1.5">
                {daily.slice(1, 3).map((day) => (
                  <div
                    key={day.date}
                    className="home-widget-float-chip flex items-center gap-1.5 rounded-xl border border-[hsl(var(--border-primary)/0.28)] bg-[hsl(var(--surface-elevated)/0.58)] px-2 py-1.5 shadow-[var(--shadow-soft)]"
                  >
                    <span className="text-base leading-none" aria-hidden>
                      {day.emoji}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[9px] font-black uppercase tracking-wider text-[hsl(var(--text-tertiary))]">
                        {new Date(`${day.date}T12:00:00`).toLocaleDateString('en-US', {
                          weekday: 'short',
                        })}
                      </div>
                      <div className="text-[10px] font-bold tabular-nums text-[hsl(var(--text-primary))]">
                        {formatTemp(day.tempMax, { includeUnit: false })}
                        {' / '}
                        {formatTemp(day.tempMin, { includeUnit: false })}
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
