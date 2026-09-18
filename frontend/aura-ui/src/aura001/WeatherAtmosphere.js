import React from 'react';

// AURA 001 — WeatherAtmosphere (Phase 4 development prototype).
//
// "Weather can move. It cannot demand attention." Restrained, abstract
// motifs — not photorealistic, not cartoon — communicating atmosphere
// while the typography next to it communicates fact. Visual values here
// are development starting points, subject to the same later visual
// review as the rest of MIRROR.

const GOLD = '#c8a96e';

export default function WeatherAtmosphere({ condition }) {
  const size = 40;

  switch (condition) {
    case 'CLEAR':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="7" fill="none" stroke={GOLD} strokeWidth="1.2" className="weather-clear" />
        </svg>
      );

    case 'CLOUDY':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40">
          <ellipse cx="16" cy="20" rx="10" ry="6" fill={GOLD} opacity="0.12" className="weather-cloud-a" />
          <ellipse cx="24" cy="22" rx="8" ry="5" fill={GOLD} opacity="0.1" className="weather-cloud-b" />
        </svg>
      );

    case 'RAIN':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40">
          {[8, 16, 24, 32].map((x, i) => (
            <line
              key={x}
              x1={x} y1="10" x2={x - 3} y2="20"
              stroke={GOLD} strokeWidth="1" strokeLinecap="round"
              className="weather-rain-drop"
              style={{ animationDelay: `${i * 0.25}s` }}
            />
          ))}
        </svg>
      );

    case 'WIND':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40">
          {[14, 20, 26].map((y, i) => (
            <line
              key={y}
              x1="8" y1={y} x2="24" y2={y}
              stroke={GOLD} strokeWidth="1" strokeLinecap="round"
              className="weather-wind-streak"
              style={{ animationDelay: `${i * 0.4}s` }}
            />
          ))}
        </svg>
      );

    case 'SNOW':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40">
          {[[10, 8], [18, 6], [26, 10], [14, 14], [30, 16]].map(([x, y], i) => (
            <circle
              key={i}
              cx={x} cy={y} r="1.3" fill={GOLD}
              className="weather-snow-flake"
              style={{ animationDelay: `${i * 0.5}s` }}
            />
          ))}
        </svg>
      );

    case 'FOG':
      return (
        <svg width={size} height={size} viewBox="0 0 40 40">
          <rect x="4" y="16" width="32" height="2.5" rx="1.25" fill={GOLD} opacity="0.15" className="weather-fog-band" />
          <rect x="8" y="22" width="24" height="2.5" rx="1.25" fill={GOLD} opacity="0.12" className="weather-fog-band" style={{ animationDelay: '1s' }} />
        </svg>
      );

    default:
      return null;
  }
}
