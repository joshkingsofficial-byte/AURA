// AURA 001 — local moon-phase calculation (Living Atmosphere).
//
// Pure, offline, no external API, no new dependency: a synodic-month
// approximation against a known reference new moon (2000-01-06 18:14 UTC —
// a widely published reference epoch), bucketed into the 8 standard named
// phases. Isolated on purpose so it can be called directly with any Date
// and checked without touching the UI or the network at all.

export const MOON_PHASES = [
  'NEW',
  'WAXING_CRESCENT',
  'FIRST_QUARTER',
  'WAXING_GIBBOUS',
  'FULL',
  'WANING_GIBBOUS',
  'LAST_QUARTER',
  'WANING_CRESCENT',
];

const SYNODIC_MONTH_MS = 29.530588853 * 24 * 60 * 60 * 1000;
const KNOWN_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0);

// Returns one of MOON_PHASES for the given date (defaults to now).
export function getMoonPhase(date = new Date()) {
  const elapsed = date.getTime() - KNOWN_NEW_MOON_MS;
  // Normalize to [0, 1) — JS `%` can return negative for dates before the
  // reference epoch, so add a full cycle before the second modulo.
  const fraction = (((elapsed % SYNODIC_MONTH_MS) + SYNODIC_MONTH_MS) % SYNODIC_MONTH_MS) / SYNODIC_MONTH_MS;
  // +1/16 centers each named phase on its exact fraction point (0, 1/8,
  // 2/8, ...) rather than starting each bucket there — so a date exactly
  // at the reference epoch reads as NEW, not on the NEW/WANING_CRESCENT
  // boundary.
  const index = Math.floor(((fraction + 1 / 16) % 1) * 8);
  return MOON_PHASES[index];
}
