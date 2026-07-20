/**
 * Home-grid Weather tile — Open-Meteo current + daily/hourly forecast (shared TTL cache).
 * Temps stored as °C; display unit from `ui.homeWeatherTempUnit` (default °F).
 */
import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { CloudSun, Droplets, MapPin, Wind } from 'lucide-react';
import HomeWidgetShell from './HomeWidgetShell';
import { normalizeHomeWidgetSurface } from '../../utils/homeWidgetSurface';
import { resolveHomeWidgetLayout } from '../../utils/homeWidgetLayout';
import { useHomeWeather } from '../../hooks/useHomeWeather';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import {
  formatHomeWeatherTemp,
  formatHomeWeatherWind,
  normalizeHomeWeatherTempUnit,
} from '../../utils/homeWeather';

function formatHourLabel(isoTime) {
  const ms = Date.parse(isoTime);
  if (!Number.isFinite(ms)) return '';
  return new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric' });
}

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
  const { status, current, daily, hourly, error, locationSource, refresh } = useHomeWeather({
    enabled: true,
  });

  const layout = useMemo(
    () => resolveHomeWidgetLayout(slot?.colSpan ?? 1, slot?.rowSpan ?? 1),
    [slot?.colSpan, slot?.rowSpan]
  );
  const { isCompact, isTall, isWide, showHeader, shellPadClass, gapClass, kickerClass, density } =
    layout;
  const showMeta = !isCompact;
  const dailyList = Array.isArray(daily) ? daily : [];
  const hourlyList = Array.isArray(hourly) ? hourly : [];
  /** Larger footprints unlock forecast depth (daily always; hourly on tall/wide). */
  const showDailyForecast =
    !isCompact && dailyList.length > 1 && (isTall || isWide || (slot?.colSpan ?? 1) >= 2);
  const showHourlyForecast =
    !isCompact && hourlyList.length > 0 && (isTall || (isWide && (slot?.rowSpan ?? 1) >= 2));
  const dailyVisible = density === 'roomy' || isTall ? 4 : isWide ? 3 : 2;
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
      textColor={slot?.textColor}
      selected={selected}
      className={`relative overflow-hidden ${shellPadClass}`}
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
        <div className={`relative z-[1] flex h-full w-full flex-col items-center justify-center text-center ${gapClass}`}>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-elevated)/0.55)] shadow-[var(--shadow-soft)]">
            <CloudSun
              size={isCompact ? 20 : 24}
              strokeWidth={2.25}
              className="text-[hsl(var(--primary))]"
              aria-hidden
            />
          </div>
          <span className="max-w-[12rem] text-[10px] font-black uppercase tracking-[0.12em] text-[var(--hw-text-secondary)]">
            {emptyMessage}
          </span>
          {status === 'denied' && !isCompact ? (
            <span className="flex items-center gap-1 text-[9px] font-bold text-[var(--hw-text-tertiary)]">
              <MapPin size={10} aria-hidden />
              OS location needed
            </span>
          ) : null}
        </div>
      ) : isCompact ? (
        <div className={`relative z-[1] flex h-full w-full flex-col items-center justify-center ${gapClass}`}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[hsl(var(--border-primary)/0.3)] bg-[hsl(var(--surface-elevated)/0.6)] text-xl leading-none shadow-[var(--shadow-soft)]">
            <span aria-hidden>{current.emoji}</span>
          </div>
          <span className="home-widget-float-type text-base font-black tabular-nums leading-none text-[var(--hw-text-primary)]">
            {formatTemp(current.temperature)}
          </span>
        </div>
      ) : (
        <div className={`relative z-[1] flex min-h-0 flex-1 flex-col ${gapClass}`}>
          {showHeader ? (
            <div className="flex items-center justify-between gap-1 px-0.5">
              <span className={`truncate ${kickerClass}`}>Weather</span>
              <CloudSun size={12} strokeWidth={2.5} className="shrink-0 text-[var(--hw-text-tertiary)]" aria-hidden />
            </div>
          ) : null}

          <div
            className={`flex min-h-0 flex-1 ${gapClass} ${
              isTall ? 'flex-col' : 'flex-row flex-wrap content-start'
            }`}
          >
            <div
              className={`flex items-center ${gapClass} ${
                isTall ? 'w-full justify-center' : 'min-w-0 flex-1'
              }`}
            >
              <div
                className={`flex shrink-0 items-center justify-center rounded-2xl border border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-elevated)/0.62)] shadow-[var(--shadow-soft)] ${
                  isTall || density === 'roomy' ? 'h-14 w-14 text-3xl' : 'h-12 w-12 text-2xl'
                }`}
              >
                <span aria-hidden>{current.emoji}</span>
              </div>
              <div className={`min-w-0 ${isWide && !isTall ? 'text-left' : isTall ? 'text-center' : 'text-left'}`}>
                <div
                  className={`home-widget-float-type font-black tabular-nums leading-none text-[var(--hw-text-primary)] ${
                    isTall || density === 'roomy' ? 'text-4xl' : 'text-3xl'
                  }`}
                >
                  {formatTemp(current.temperature)}
                </div>
                <div className="mt-0.5 truncate text-[11px] font-bold text-[var(--hw-text-secondary)]">
                  {current.label}
                </div>
                {locationSource === 'fallback' ? (
                  <div className="mt-0.5 text-[9px] font-bold text-[var(--hw-text-tertiary)]">
                    Approx. location
                  </div>
                ) : null}
              </div>
            </div>

            {showMeta ? (
              <div
                className={`flex flex-wrap ${gapClass} ${
                  isTall ? 'w-full justify-center' : isWide ? 'shrink-0 flex-row' : 'shrink-0 flex-col'
                }`}
              >
                {Number.isFinite(current.humidity) ? (
                  <div className="home-widget-float-chip inline-flex items-center gap-1 rounded-full border border-[hsl(var(--border-primary)/0.28)] bg-[hsl(var(--surface-elevated)/0.55)] px-2 py-1 text-[9px] font-bold text-[var(--hw-text-secondary)]">
                    <Droplets size={10} strokeWidth={2.5} className="text-[var(--hw-text-accent)]" aria-hidden />
                    {Math.round(current.humidity)}%
                  </div>
                ) : null}
                {Number.isFinite(current.windSpeed) ? (
                  <div className="home-widget-float-chip inline-flex items-center gap-1 rounded-full border border-[hsl(var(--border-primary)/0.28)] bg-[hsl(var(--surface-elevated)/0.55)] px-2 py-1 text-[9px] font-bold text-[var(--hw-text-secondary)]">
                    <Wind size={10} strokeWidth={2.5} className="text-[var(--hw-text-accent)]" aria-hidden />
                    {formatHomeWeatherWind(current.windSpeed, tempUnit)}
                  </div>
                ) : null}
              </div>
            ) : null}

            {showHourlyForecast ? (
              <div className="flex w-full gap-1.5 overflow-hidden">
                {hourlyList.slice(0, isWide ? 6 : 4).map((hour) => (
                  <div
                    key={hour.time}
                    className="home-widget-float-chip flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl border border-[hsl(var(--border-primary)/0.28)] bg-[hsl(var(--surface-elevated)/0.58)] px-1 py-1.5 shadow-[var(--shadow-soft)]"
                  >
                    <span className="text-[8px] font-black uppercase tracking-wider text-[var(--hw-text-tertiary)]">
                      {formatHourLabel(hour.time)}
                    </span>
                    <span className="text-sm leading-none" aria-hidden>
                      {hour.emoji}
                    </span>
                    <span className="text-[10px] font-bold tabular-nums text-[var(--hw-text-primary)]">
                      {formatTemp(hour.temperature, { includeUnit: false })}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {showDailyForecast ? (
              <div
                className={`grid w-full gap-1.5 ${
                  dailyVisible >= 4 ? 'grid-cols-4' : dailyVisible === 3 ? 'grid-cols-3' : 'grid-cols-2'
                }`}
              >
                {dailyList.slice(1, dailyVisible + 1).map((day) => (
                  <div
                    key={day.date}
                    className="home-widget-float-chip flex items-center gap-1.5 rounded-xl border border-[hsl(var(--border-primary)/0.28)] bg-[hsl(var(--surface-elevated)/0.58)] px-2 py-1.5 shadow-[var(--shadow-soft)]"
                  >
                    <span className="text-base leading-none" aria-hidden>
                      {day.emoji}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[9px] font-black uppercase tracking-wider text-[var(--hw-text-tertiary)]">
                        {new Date(`${day.date}T12:00:00`).toLocaleDateString('en-US', {
                          weekday: 'short',
                        })}
                      </div>
                      <div className="text-[10px] font-bold tabular-nums text-[var(--hw-text-primary)]">
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
