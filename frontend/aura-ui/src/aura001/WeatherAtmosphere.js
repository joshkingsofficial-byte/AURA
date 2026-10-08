import React from 'react';
import { MOON_PHASES } from './moonPhase';

// AURA 001 — WeatherAtmosphere (Phase 4 development prototype).
//
// "Weather can move. It cannot demand attention." Restrained, abstract
// motifs — not photorealistic, not cartoon — communicating atmosphere
// while the typography next to it communicates fact. Visual values here
// are development starting points, subject to the same later visual
// review as the rest of MIRROR.
//
// Composition, not separate widgets: every icon is one <svg> built from
// two layers — a celestial base (sun by day, the real current moon phase
// by night) and an optional weather motif drawn on top of it. The two
// never swap independently of each other; CLEAR is simply "celestial
// only, no motif," matching the existing pattern rather than introducing
// a new one.

const GOLD = '#c8a96e';
const SIZE = 40;
const CENTER = 20;
const R = 7;

// How visible the celestial base is for each condition, separately by
// day/night — this single table is the whole "NIGHT+RAIN -> dim moon"/
// "DAY+RAIN -> no sun at all" rule from the design spec. 0 = don't render
// the celestial glyph at all.
const CELESTIAL_VISIBILITY = {
  CLEAR: { day: 1, night: 1 },
  CLOUDY: { day: 1, night: 1 },
  WIND: { day: 1, night: 1 },
  RAIN: { day: 0, night: 0.5 },
  SNOW: { day: 0, night: 0.5 },
  FOG: { day: 0.3, night: 0.3 },
};

function SunGlyph() {
  return <circle cx={CENTER} cy={CENTER} r={R} fill="none" stroke={GOLD} strokeWidth="1.2" className="weather-clear" />;
}

// The 8 standard phases, each built from the same small set of primitives:
// a dim full-disc outline (present on every phase, like faint earthshine —
// it's what keeps NEW from reading as "nothing rendered" and anchors every
// other phase as a disc, not a floating sliver) plus a brighter GOLD lit
// portion, shaped per phase. Quarter phases use a straight half-disc clip
// (the conventional way quarter moons are drawn); crescent/gibbous phases
// use a two-circle offset subtraction (the conventional way partial lunar
// illumination is drawn) — both standard, both pure SVG, no new library.
//
// Convention adopted here (stated explicitly, since real moon orientation
// depends on hemisphere and isn't visually "correct" from everywhere on
// Earth at once): waxing phases are drawn lit on the right, waning phases
// lit on the left — consistent within AURA, not claiming universal
// astronomical accuracy of orientation.
function MoonGlyph({ phase }) {
  const dim = <circle cx={CENTER} cy={CENTER} r={R} fill="none" stroke={GOLD} strokeWidth="1" opacity="0.3" />;

  if (phase === 'NEW') {
    return <g>{dim}</g>;
  }

  if (phase === 'FULL') {
    return (
      <g>
        {dim}
        <circle cx={CENTER} cy={CENTER} r={R} fill={GOLD} />
      </g>
    );
  }

  if (phase === 'FIRST_QUARTER' || phase === 'LAST_QUARTER') {
    const clipId = `moon-half-${phase}`;
    const litOnRight = phase === 'FIRST_QUARTER'; // waxing half -> right; waning half -> left
    const clipX = litOnRight ? CENTER : CENTER - R;
    return (
      <g>
        {dim}
        <clipPath id={clipId}>
          <rect x={clipX} y={CENTER - R} width={R} height={R * 2} />
        </clipPath>
        <circle cx={CENTER} cy={CENTER} r={R} fill={GOLD} clipPath={`url(#${clipId})`} />
      </g>
    );
  }

  // Crescent/gibbous: a shadow circle of the same radius, offset
  // horizontally, subtracted via a mask. Small |offset| -> thin crescent
  // (shadow still mostly overlapping the disc); larger |offset| -> fat
  // gibbous (shadow mostly displaced off the disc). Negative offset
  // (shadow shifted left) leaves the lit portion on the right (waxing);
  // positive offset leaves it on the left (waning) — see convention note
  // above.
  const offsets = {
    WAXING_CRESCENT: -4,
    WAXING_GIBBOUS: -10,
    WANING_GIBBOUS: 10,
    WANING_CRESCENT: 4,
  };
  const offset = offsets[phase];
  const maskId = `moon-mask-${phase}`;
  return (
    <g>
      {dim}
      <mask id={maskId}>
        <rect x="0" y="0" width={SIZE} height={SIZE} fill="black" />
        <circle cx={CENTER} cy={CENTER} r={R} fill="white" />
        <circle cx={CENTER + offset} cy={CENTER} r={R} fill="black" />
      </mask>
      <circle cx={CENTER} cy={CENTER} r={R} fill={GOLD} mask={`url(#${maskId})`} />
    </g>
  );
}

// Weather motif drawn on top of the celestial base — unchanged positions/
// animations from the original per-condition icons, just no longer
// mutually exclusive with the sun/moon. CLOUDY/RAIN/SNOW now all include
// the same cloud-ellipse pair (RAIN/SNOW didn't have one before) so
// "cloud + precipitation" reads as one composed shape, per the design
// spec's "cloud/rain"/"cloud/snow" treatment.
function CloudEllipses() {
  return (
    <>
      <ellipse cx="16" cy="20" rx="10" ry="6" fill={GOLD} opacity="0.12" className="weather-cloud-a" />
      <ellipse cx="24" cy="22" rx="8" ry="5" fill={GOLD} opacity="0.1" className="weather-cloud-b" />
    </>
  );
}

function WeatherMotif({ condition }) {
  switch (condition) {
    case 'CLOUDY':
      return <CloudEllipses />;

    case 'RAIN':
      return (
        <>
          <CloudEllipses />
          {[8, 16, 24, 32].map((x, i) => (
            <line
              key={x}
              x1={x} y1="10" x2={x - 3} y2="20"
              stroke={GOLD} strokeWidth="1" strokeLinecap="round"
              className="weather-rain-drop"
              style={{ animationDelay: `${i * 0.25}s` }}
            />
          ))}
        </>
      );

    case 'WIND':
      return (
        <>
          {[14, 20, 26].map((y, i) => (
            <line
              key={y}
              x1="8" y1={y} x2="24" y2={y}
              stroke={GOLD} strokeWidth="1" strokeLinecap="round"
              className="weather-wind-streak"
              style={{ animationDelay: `${i * 0.4}s` }}
            />
          ))}
        </>
      );

    case 'SNOW':
      return (
        <>
          <CloudEllipses />
          {[[10, 8], [18, 6], [26, 10], [14, 14], [30, 16]].map(([x, y], i) => (
            <circle
              key={i}
              cx={x} cy={y} r="1.3" fill={GOLD}
              className="weather-snow-flake"
              style={{ animationDelay: `${i * 0.5}s` }}
            />
          ))}
        </>
      );

    case 'FOG':
      return (
        <>
          <rect x="4" y="16" width="32" height="2.5" rx="1.25" fill={GOLD} opacity="0.15" className="weather-fog-band" />
          <rect x="8" y="22" width="24" height="2.5" rx="1.25" fill={GOLD} opacity="0.12" className="weather-fog-band" style={{ animationDelay: '1s' }} />
        </>
      );

    default: // CLEAR — celestial base only, no motif, matches existing behaviour
      return null;
  }
}

export default function WeatherAtmosphere({ condition, isNight = false, moonPhase = 'FULL' }) {
  const visibility = CELESTIAL_VISIBILITY[condition] || CELESTIAL_VISIBILITY.CLEAR;
  const celestialOpacity = isNight ? visibility.night : visibility.day;
  const resolvedPhase = MOON_PHASES.includes(moonPhase) ? moonPhase : 'FULL';

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      {celestialOpacity > 0 && (
        <g opacity={celestialOpacity}>
          {isNight ? <MoonGlyph phase={resolvedPhase} /> : <SunGlyph />}
        </g>
      )}
      <WeatherMotif condition={condition} />
    </svg>
  );
}
