import React, { useState, useEffect } from 'react';

const WEATHER_CODES = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Icy fog', 51: 'Light drizzle', 53: 'Drizzle',
  55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 80: 'Rain showers',
  81: 'Heavy showers', 82: 'Violent showers', 95: 'Thunderstorm',
};

async function resolveLocation() {
  // 1. Try IP-based city detection
  try {
    const geo = await fetch('https://ipapi.co/json/').then(r => r.json());
    if (geo.latitude && geo.longitude) {
      return { lat: geo.latitude, lon: geo.longitude, name: geo.city || geo.region || 'Your Location' };
    }
  } catch {}

  // 2. Fallback: browser geolocation
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 51.5074, lon: -0.1278, name: 'London' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, name: 'Your Location' }),
      () => resolve({ lat: 51.5074, lon: -0.1278, name: 'London' }),
      { timeout: 5000 }
    );
  });
}

export default function WeatherApp() {
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    resolveLocation().then(loc => {
      setLocation(loc);
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=auto&forecast_days=5`;
      return fetch(url).then(r => r.json());
    })
    .then(data => { setWeather(data); setLoading(false); })
    .catch(() => { setError('Could not load weather'); setLoading(false); });
  }, []);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#c8a96e', letterSpacing: '0.3em', fontSize: '12px' }}>
      READING THE SKY
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#c8a96e', letterSpacing: '0.3em', fontSize: '12px' }}>
      {error}
    </div>
  );

  const c = weather.current;
  const d = weather.daily;
  const condition = WEATHER_CODES[c.weather_code] || 'Unknown';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 60%, #1a0a2e 0%, #0d0515 40%, #080010 100%)',
      color: 'white',
      padding: '48px',
      fontFamily: 'inherit',
      display: 'flex',
      flexDirection: 'column',
      gap: '48px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '0.4em', color: '#c8a96e', marginBottom: '8px' }}>WEATHER</div>
          <div style={{ fontSize: '13px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)' }}>{location?.name?.toUpperCase()}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.2em', color: 'rgba(200,169,110,0.5)' }}>FEELS LIKE {Math.round(c.apparent_temperature)}°C</div>
        </div>
      </div>

      {/* Main temperature */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 'clamp(80px, 14vw, 160px)', fontWeight: 100, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.92)', lineHeight: 1 }}>
          {Math.round(c.temperature_2m)}°
        </div>
        <div style={{ fontSize: '14px', letterSpacing: '0.3em', color: '#c8a96e', marginTop: '16px', fontWeight: 200 }}>
          {condition.toUpperCase()}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'rgba(200,169,110,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
        {[
          { label: 'HUMIDITY', value: `${c.relative_humidity_2m}%` },
          { label: 'WIND', value: `${Math.round(c.wind_speed_10m)} km/h` },
          { label: 'RAIN CHANCE', value: `${d.precipitation_probability_max[0]}%` },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.3em', color: 'rgba(200,169,110,0.5)', marginBottom: '8px' }}>{stat.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 200, color: 'rgba(255,255,255,0.8)' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* 5 day forecast */}
      <div>
        <div style={{ fontSize: '9px', letterSpacing: '0.4em', color: 'rgba(200,169,110,0.4)', marginBottom: '20px' }}>5 - DAY FORECAST</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          {d.time.slice(0, 5).map((date, i) => {
            const day = new Date(date);
            return (
              <div key={date} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(200,169,110,0.12)',
                borderRadius: '12px',
                padding: '16px 8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(200,169,110,0.6)', marginBottom: '12px' }}>
                  {i === 0 ? 'TODAY' : days[day.getDay()].toUpperCase()}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 200, color: 'rgba(255,255,255,0.85)' }}>{Math.round(d.temperature_2m_max[i])}°</div>
                <div style={{ fontSize: '12px', fontWeight: 200, color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>{Math.round(d.temperature_2m_min[i])}°</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
