import { ACTIVE_ART_STUDY, DEV_ART_STUDY_OVERRIDE } from './constants';

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

const SCHEDULE = [
  { startHour: 8, endHour: 12, study: 'PAINTING_VENICE' },
  { startHour: 12, endHour: 16, study: 'PAINTING_SEA' },
  { startHour: 16, endHour: 20, study: 'PAINTING_GARDEN' },
  { startHour: 20, endHour: 24, study: 'PAINTING_VENICE' }, // 20:00–24:00
  { startHour: 0, endHour: 8, study: 'PAINTING_VENICE' },   // 00:00–08:00 (same period, split around midnight)
];

export function getScheduledStudyKey(date = new Date()) {
  if (DEV_ART_STUDY_OVERRIDE) return DEV_ART_STUDY_OVERRIDE; // dev/testing only — see constants.js
  const hour = date.getHours();
  const period = SCHEDULE.find((p) => hour >= p.startHour && hour < p.endHour);
  return period ? period.study : ACTIVE_ART_STUDY; // defensive fallback; SCHEDULE covers all 24 hours
}
