// AURA 001 — state machine scaffolding.
//
// NOT wired to production UI yet (Phase 0). Mirrors the state machine
// approved in the Stage 2 simplification audit.
//
// TRACE_ENTERING/TRACE_LEAVING are split from STILLNESS_IN/OUT because they
// are visually and timing-wise distinct phases that need independent
// constants — this is implementation granularity, not a redesign of the
// Presence concept (ART → Reveal → Stillness → Trace → Mirror → Return → ART).

export const AURA001_STATES = Object.freeze({
  ART: 'ART',
  REVEALING: 'REVEALING',
  STILLNESS_IN: 'STILLNESS_IN',
  TRACE_ENTERING: 'TRACE_ENTERING',
  MIRROR: 'MIRROR',
  TRACE_LEAVING: 'TRACE_LEAVING',
  STILLNESS_OUT: 'STILLNESS_OUT',
  ART_RETURNING: 'ART_RETURNING',
});

// Linear happy-path transitions only — describes what CAN happen next.
// Gating (voice intent + interaction-zone occupancy, absence timers,
// "don't interrupt a transition already in progress") is behavior to be
// implemented in later phases, not encoded in this table.
export const AURA001_TRANSITIONS = Object.freeze({
  [AURA001_STATES.ART]: [AURA001_STATES.REVEALING],
  [AURA001_STATES.REVEALING]: [AURA001_STATES.STILLNESS_IN],
  [AURA001_STATES.STILLNESS_IN]: [AURA001_STATES.TRACE_ENTERING],
  [AURA001_STATES.TRACE_ENTERING]: [AURA001_STATES.MIRROR],
  [AURA001_STATES.MIRROR]: [AURA001_STATES.TRACE_LEAVING],
  [AURA001_STATES.TRACE_LEAVING]: [AURA001_STATES.STILLNESS_OUT],
  [AURA001_STATES.STILLNESS_OUT]: [AURA001_STATES.ART_RETURNING],
  [AURA001_STATES.ART_RETURNING]: [AURA001_STATES.ART],
});

// States during which a state-changing voice intent (mirror/art) must be
// ignored until the in-progress transition completes.
export const AURA001_TRANSITIONAL_STATES = Object.freeze([
  AURA001_STATES.REVEALING,
  AURA001_STATES.STILLNESS_IN,
  AURA001_STATES.TRACE_ENTERING,
  AURA001_STATES.TRACE_LEAVING,
  AURA001_STATES.STILLNESS_OUT,
  AURA001_STATES.ART_RETURNING,
]);

// The two states in which the piece can rest indefinitely (as opposed to the
// transitional states above, which are always mid-choreography).
export const AURA001_STABLE_STATES = Object.freeze([
  AURA001_STATES.ART,
  AURA001_STATES.MIRROR,
]);

export const AURA001_DEFAULT_STATE = AURA001_STATES.ART;
