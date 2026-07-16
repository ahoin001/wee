/**
 * Open-Meteo weather fetch + WMO code labels for the Home weather tile.
 * No API key. Shared TTL cache lives on the consolidated store (`homeWeather`).
 */

export const HOME_WEATHER_TTL_MS = 20 * 60 * 1000;
export const HOME_WEATHER_POLL_MS = 20 * 60 * 1000;

/** Soft empty-state fallback when geolocation is unavailable (approx. continental US center). */
export const HOME_WEATHER_FALLBACK_COORDS = Object.freeze({
  latitude: 39.8283,
  longitude: -98.5795,
  label: 'Central US',
});

/**
 * @param {number} code
 * @returns {{ label: string, emoji: string }}
 */
export function describeWmoWeatherCode(code) {
  const c = Number(code);
  if (c === 0) return { label: 'Clear', emoji: '☀️' };
  if (c === 1 || c === 2) return { label: 'Partly cloudy', emoji: '⛅' };
  if (c === 3) return { label: 'Overcast', emoji: '☁️' };
  if (c === 45 || c === 48) return { label: 'Fog', emoji: '🌫️' };
  if (c >= 51 && c <= 57) return { label: 'Drizzle', emoji: '🌦️' };
  if (c >= 61 && c <= 67) return { label: 'Rain', emoji: '🌧️' };
  if (c >= 71 && c <= 77) return { label: 'Snow', emoji: '🌨️' };
  if (c >= 80 && c <= 82) return { label: 'Showers', emoji: '🌦️' };
  if (c >= 85 && c <= 86) return { label: 'Snow showers', emoji: '🌨️' };
  if (c === 95) return { label: 'Thunderstorm', emoji: '⛈️' };
  if (c === 96 || c === 99) return { label: 'Storm + hail', emoji: '⛈️' };
  return { label: 'Weather', emoji: '🌡️' };
}

/**
 * @param {{ latitude: number, longitude: number }} coords
 */
export async function fetchOpenMeteoForecast(coords) {
  const lat = Number(coords?.latitude);
  const lon = Number(coords?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error('Invalid coordinates');
  }

  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: '3',
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) {
    throw new Error(`Open-Meteo ${res.status}`);
  }
  const data = await res.json();
  const current = data?.current || {};
  const daily = data?.daily || {};
  const code = Number(current.weather_code);
  const desc = describeWmoWeatherCode(code);

  const days = [];
  const times = Array.isArray(daily.time) ? daily.time : [];
  for (let i = 0; i < Math.min(3, times.length); i += 1) {
    const dayCode = Number(daily.weather_code?.[i]);
    const dayDesc = describeWmoWeatherCode(dayCode);
    days.push({
      date: times[i],
      weatherCode: dayCode,
      label: dayDesc.label,
      emoji: dayDesc.emoji,
      tempMax: Number(daily.temperature_2m_max?.[i]),
      tempMin: Number(daily.temperature_2m_min?.[i]),
    });
  }

  return {
    latitude: lat,
    longitude: lon,
    timezone: data?.timezone || null,
    current: {
      temperature: Number(current.temperature_2m),
      weatherCode: code,
      label: desc.label,
      emoji: desc.emoji,
      humidity: Number(current.relative_humidity_2m),
      windSpeed: Number(current.wind_speed_10m),
    },
    daily: days,
    fetchedAt: Date.now(),
  };
}

/**
 * @returns {Promise<{ latitude: number, longitude: number, label?: string, source: string }>}
 */
export function resolveHomeWeatherCoords() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ ...HOME_WEATHER_FALLBACK_COORDS, source: 'fallback' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          source: 'geolocation',
        });
      },
      (err) => {
        // Permission denied / timeout — still try fallback so the tile isn't blank forever.
        if (err?.code === 1) {
          reject(Object.assign(new Error('Location permission denied'), { code: 'denied' }));
          return;
        }
        resolve({ ...HOME_WEATHER_FALLBACK_COORDS, source: 'fallback' });
      },
      { enableHighAccuracy: false, maximumAge: 30 * 60 * 1000, timeout: 8000 }
    );
  });
}
