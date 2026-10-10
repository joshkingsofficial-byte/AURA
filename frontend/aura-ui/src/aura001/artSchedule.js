import { ACTIVE_ART_STUDY, DEV_ART_STUDY_OVERRIDE, ART_STUDIES } from './constants';

// AURA 001 — Static Art Schedule Study (experimental, not final curatorial
// programming — see MASTER_WORK_FILE.md "Static Art Schedule Study").
//
// Deterministic, local-device-time-only, no network dependency. A pure
// function of the current time and a fixed table — nothing persisted,
// nothing randomized, so a fresh page load always recomputes the correct
// study from scratch (this is what "survives reload" means here: there is
// no state to lose).
//
// Where this is actually applied — and why a scheduled change can never
// interrupt REVEAL/STILLNESS/TRACE/MIRROR/RETURN — is in RevealSequence.js,
// not here. This module only answers "what should be showing right now."

// Each hour 0–23 must fall in EXACTLY one block below — verified by
// inspection, not enforced in code, same as the rest of this file's
// "simple table, no framework" approach (see header comment). Listed in
// chronological order for that reason: 00–08 RUBY, 08–12 VENICE, 12–16
// SEA, 16–20 GARDEN, 20–24 VENICE. RUBY previously shared this exact
// 00:00–08:00 slot with a second VENICE block (two entries, same range,
// VENICE only winning because .find() returns the first match) — that
// ambiguity is gone now: VENICE's two appearances are 08–12 and 20–24
// only, RUBY owns 00–08 outright, so there is exactly one owner per hour
// and no entry's outcome depends on array order.
const SCHEDULE = [
  { startHour: 0, endHour: 8, study: 'RUBY' },              // 00:00–08:00 — Ruby's own slot, no longer shared with VENICE
  { startHour: 8, endHour: 12, study: 'PAINTING_VENICE' },
  { startHour: 12, endHour: 16, study: 'PAINTING_SEA' },
  { startHour: 16, endHour: 20, study: 'PAINTING_GARDEN' },
  { startHour: 20, endHour: 24, study: 'PAINTING_VENICE' }, // 20:00–24:00
];

// Technician Art Preview, physical review mode (see MASTER_WORK_FILE.md
// "Technician Art Preview Override") — a URL query parameter, read fresh
// every call, never written anywhere. There is no state to persist: close
// the tab, or load the bare URL again, and this disappears on its own —
// that's the whole mechanism, not an omission. Not gated to development,
// since physical framing review happens on the Pi's production build.
function getTechnicianArtOverride() {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get('technicianArt');
  // Must match an existing ART_STUDIES key exactly — anything else (typo,
  // old/removed key, absent) is ignored and falls through to the schedule,
  // never throws.
  return value && Object.prototype.hasOwnProperty.call(ART_STUDIES, value) ? value : null;
}

export function getScheduledStudyKey(date = new Date()) {
  // Precedence: DEV_ART_STUDY_OVERRIDE (source-level) > ?technicianArt=
  // (URL, session-only) > normal local-time schedule.
  if (DEV_ART_STUDY_OVERRIDE) return DEV_ART_STUDY_OVERRIDE; // dev/testing only — see constants.js
  const technicianOverride = getTechnicianArtOverride();
  if (technicianOverride) return technicianOverride;
  const hour = date.getHours();
  const period = SCHEDULE.find((p) => hour >= p.startHour && hour < p.endHour);
  return period ? period.study : ACTIVE_ART_STUDY; // defensive fallback; SCHEDULE covers all 24 hours
}
