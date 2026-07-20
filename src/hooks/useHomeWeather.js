import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import {
  HOME_WEATHER_POLL_MS,
  HOME_WEATHER_TTL_MS,
  fetchOpenMeteoForecast,
  resolveHomeWeatherCoords,
} from '../utils/homeWeather';
import { useActivityInterval } from './useActivityInterval';

/**
 * Shared Home weather tile data — one Open-Meteo path, store TTL cache, activity-gated poll.
 */
export function useHomeWeather({ enabled = true } = {}) {
  const { status, current, daily, hourly, coords, fetchedAt, error, locationSource } =
    useConsolidatedAppStore(
      useShallow((state) => {
        const w = state.homeWeather || {};
        return {
          status: w.status || 'idle',
          current: w.current || null,
          daily: w.daily || null,
          hourly: w.hourly || null,
          coords: w.coords || null,
          fetchedAt: w.fetchedAt || 0,
          error: w.error || null,
          locationSource: w.locationSource || null,
        };
      })
    );
  const setHomeWeatherState = useConsolidatedAppStore((s) => s.actions.setHomeWeatherState);

  const refresh = useCallback(
    async ({ force = false } = {}) => {
      if (!enabled) return;
      const prev = useConsolidatedAppStore.getState().homeWeather || {};
      const age = Date.now() - (prev.fetchedAt || 0);
      if (!force && prev.current && age < HOME_WEATHER_TTL_MS) return;

      setHomeWeatherState({
        status: prev.current ? 'refreshing' : 'loading',
        error: null,
      });

      try {
        let nextCoords = prev.coords;
        let locationSource = prev.locationSource;
        if (!nextCoords?.latitude || !nextCoords?.longitude) {
          const resolved = await resolveHomeWeatherCoords();
          nextCoords = { latitude: resolved.latitude, longitude: resolved.longitude };
          locationSource = resolved.source;
        }

        const forecast = await fetchOpenMeteoForecast(nextCoords);
        setHomeWeatherState({
          status: 'ready',
          current: forecast.current,
          daily: forecast.daily,
          hourly: forecast.hourly,
          coords: nextCoords,
          locationSource,
          fetchedAt: forecast.fetchedAt,
          error: null,
        });
      } catch (err) {
        const denied = err?.code === 'denied';
        setHomeWeatherState({
          status: denied ? 'denied' : 'error',
          error: denied
            ? 'Allow location to show local weather'
            : err?.message || 'Weather unavailable',
        });
      }
    },
    [enabled, setHomeWeatherState]
  );

  useEffect(() => {
    if (!enabled) return undefined;
    void refresh({ force: false });
    return undefined;
  }, [enabled, refresh]);

  useActivityInterval(() => {
    void refresh({ force: true });
  }, HOME_WEATHER_POLL_MS, {
    enabled,
    fireOnResume: true,
    lowPowerMultiplier: 2,
  });

  return {
    status,
    current,
    daily,
    hourly,
    coords,
    fetchedAt,
    error,
    locationSource,
    refresh,
  };
}

export default useHomeWeather;
