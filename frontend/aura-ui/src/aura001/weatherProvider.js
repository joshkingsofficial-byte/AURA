import { useEffect, useState } from 'react';
import {
  INSTALLATION_LATITUDE,
  INSTALLATION_LONGITUDE,
  WEATHER_REFRESH_MS,
  WIND_CONDITION_THRESHOLD_KMH,
  DEV_WEATHER_OVERRIDE_TEMP,
} from './constants';
import { getMoonPhase } from './moonPhase';

// AURA 001 — living local weather (Phase 4).
//
// Maps Open-Meteo's WMO weathercode (plus windspeed) down to the six
// restrained conditions the Phase 4 spec defines: CLEAR, CLOUDY, RAIN,
// WIND, SNOW, FOG. Wind is checked first and can override an otherwise
// calm-looking code, since Open-Meteo's weathercode has no dedicated
// "windy" value of its own.
export const WEATHER_CONDITIONS = ['CLEAR', 'CLOUDY', 'RAIN', 'WIND', 'SNOW', 'FOG'];

// Restrained, development-only diagnostics — never visitor-facing, never
// shown as UI. Exists because the Pi root cause (geolocation silently
// failing on kiosk Chromium) was previously invisible: every failure path
// swallowed its error with an empty catch. Gated the same way the
// ?weather= dev override already is.
const devLog = (...args) => {
  if (process.env.NODE_ENV === 'development') console.info('[AURA weather]', ...args);
};

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

// Pure — exported so day/night logic can be checked directly with
// controlled inputs, independent of the network/hook. Real sunrise/sunset
// is the normal path; the hour-based fallback only fires if Open-Meteo's
// daily block is missing or unparseable, so MIRROR can never crash or
// freeze on this.
export function computeIsNight(now, sunriseIso, sunsetIso) {
  const sunrise = sunriseIso ? new Date(sunriseIso) : null;
  const sunset = sunsetIso ? new Date(sunsetIso) : null;
  if (!sunrise || !sunset || isNaN(sunrise.getTime()) || isNaN(sunset.getTime())) {
    const hour = now.getHours();
    return hour < 6 || hour >= 20; // fallback only — see function header
  }
  return now < sunrise || now >= sunset;
}

// Returns { tempC, condition } | null (null until the first reading loads).
export function useLivingWeather() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    // Dev-only override: ?aura001=reveal&weather=RAIN[&night=1] — lets a
    // specific condition (and optionally night) be demonstrated/
    // screenshotted without waiting on real weather, real sunset, or
    // matching installation to it. Gated on NODE_ENV exactly like the
    // existing ?technicianArt=/?weather= dev mechanisms elsewhere in
    // aura001/ — cannot be reached in a production build regardless of
    // URL, and it skips the real fetch entirely when active.
    if (process.env.NODE_ENV === 'development') {
      const params = new URLSearchParams(window.location.search);
      const override = (params.get('weather') || '').toUpperCase();
      if (WEATHER_CONDITIONS.includes(override)) {
        const isNight = params.get('night') === '1';
        setWeather({
          tempC: DEV_WEATHER_OVERRIDE_TEMP,
          condition: override,
          isNight,
          moonPhase: getMoonPhase(),
        });
        return;
      }
    }

    let intervalId;
    let cancelled = false;

    const fetchAt = (lat, lon) => {
      const run = () => {
        // Same single Open-Meteo request as before, now also asking for
        // today's sunrise/sunset (timezone=auto so they correspond to the
        // installation's local time, not UTC) — no second service, no
        // second fetch.
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=sunrise,sunset&timezone=auto`)
          .then((r) => r.json())
          .then(({ current_weather: cw, daily }) => {
            if (cancelled) return;
            setWeather({
              tempC: Math.round(cw.temperature),
              condition: mapCondition(cw.weathercode, cw.windspeed),
              isNight: computeIsNight(new Date(), daily?.sunrise?.[0], daily?.sunset?.[0]),
              moonPhase: getMoonPhase(),
            });
          })
          .catch((err) => devLog('Open-Meteo fetch failed', err));
      };
      run();
      intervalId = setInterval(run, WEATHER_REFRESH_MS);
    };

    // Installation location takes priority once an install configures it —
    // normal AURA runtime always has one configured and never depends on
    // browser geolocation (see constants.js). Geolocation remains only as
    // a fallback for a developer running without any installation
    // configured; it's given a finite timeout so a stalled/denied fix can
    // never block anything else in MIRROR.
    if (INSTALLATION_LATITUDE != null && INSTALLATION_LONGITUDE != null) {
      devLog('using installation coordinates', INSTALLATION_LATITUDE, INSTALLATION_LONGITUDE);
      fetchAt(INSTALLATION_LATITUDE, INSTALLATION_LONGITUDE);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => { if (!cancelled) fetchAt(coords.latitude, coords.longitude); },
        (err) => devLog('geolocation fallback failed', err),
        { timeout: 8000, maximumAge: 300000 }
      );
    }

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  return weather;
}
