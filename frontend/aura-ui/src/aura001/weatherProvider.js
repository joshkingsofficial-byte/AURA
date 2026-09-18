import { useEffect, useState } from 'react';
import {
  INSTALLATION_LATITUDE,
  INSTALLATION_LONGITUDE,
  WEATHER_REFRESH_MS,
  WIND_CONDITION_THRESHOLD_KMH,
  DEV_WEATHER_OVERRIDE_TEMP,
} from './constants';

// AURA 001 — living local weather (Phase 4).
//
// Maps Open-Meteo's WMO weathercode (plus windspeed) down to the six
// restrained conditions the Phase 4 spec defines: CLEAR, CLOUDY, RAIN,
// WIND, SNOW, FOG. Wind is checked first and can override an otherwise
// calm-looking code, since Open-Meteo's weathercode has no dedicated
// "windy" value of its own.
export const WEATHER_CONDITIONS = ['CLEAR', 'CLOUDY', 'RAIN', 'WIND', 'SNOW', 'FOG'];

function mapCondition(code, windspeedKmh) {
  if (windspeedKmh >= WIND_CONDITION_THRESHOLD_KMH) return 'WIND';
  if (code === 0 || code === 1) return 'CLEAR';
  if (code <= 3) return 'CLOUDY';
  if (code <= 48) return 'FOG';
  if (code <= 67) return 'RAIN';
  if (code <= 77) return 'SNOW';
  if (code <= 82) return 'RAIN'; // rain showers
  if (code <= 86) return 'SNOW'; // snow showers
  return 'RAIN'; // storm/other — folds into RAIN, no dedicated STORM condition this phase
}

// Returns { tempC, condition } | null (null until the first reading loads).
export function useLivingWeather() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    // Dev-only override: ?aura001=reveal&weather=RAIN — lets a specific
    // condition be demonstrated/screenshotted without waiting on real
    // weather or matching installation to it. Gated on NODE_ENV so it
    // cannot be reached in a production build regardless of URL, and it
    // skips the real fetch entirely when active.
    if (process.env.NODE_ENV === 'development') {
      const params = new URLSearchParams(window.location.search);
      const override = (params.get('weather') || '').toUpperCase();
      if (WEATHER_CONDITIONS.includes(override)) {
        setWeather({ tempC: DEV_WEATHER_OVERRIDE_TEMP, condition: override });
        return;
      }
    }

    let intervalId;
    let cancelled = false;

    const fetchAt = (lat, lon) => {
      const run = () => {
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
          .then((r) => r.json())
          .then(({ current_weather: cw }) => {
            if (cancelled) return;
            setWeather({
              tempC: Math.round(cw.temperature),
              condition: mapCondition(cw.weathercode, cw.windspeed),
            });
          })
          .catch(() => {});
      };
      run();
      intervalId = setInterval(run, WEATHER_REFRESH_MS);
    };

    // Installation location takes priority once an install configures it.
    // Until then, browser geolocation is a development-only convenience —
    // not consumer location onboarding.
    if (INSTALLATION_LATITUDE != null && INSTALLATION_LONGITUDE != null) {
      fetchAt(INSTALLATION_LATITUDE, INSTALLATION_LONGITUDE);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => { if (!cancelled) fetchAt(coords.latitude, coords.longitude); },
        () => {}
      );
    }

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  return weather;
}
