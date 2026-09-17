// AURA 001 — configurable constants scaffolding.
//
// Every value below is a development starting point, not a final artistic
// or technical decision. Per the Stage 2 audit's open questions list, exact
// timing, geometry, luminosity, sensor distances, and absence thresholds
// remain TBD through physical/visual/gallery testing. Nothing here should be
// treated as final without that testing.

// ── Reveal / Stillness / Trace-in (ART → MIRROR) ────────────────────────────
export const REVEAL_MS = 1200; // ART recedes, reflection emerges — open question #2
export const STILLNESS_IN_MS = 1000; // pure reflection pause — open question #3 (spec's ~1s starting value)
export const TRACE_ENTER_MS = 1500; // wordmark + traces travel to perimeter — open question #4

// ── AURA Trace (perimeter geometry, while settled in MIRROR) ────────────────
export const TRACE_BREATH_CYCLE_MS = 4000; // subtle breathing period once settled — open question #4
export const TRACE_LINE_THICKNESS_PX = 2; // open question #4
export const TRACE_LUMINOSITY = 0.6; // 0–1 — open question #4

// ── MIRROR → ART (Trace-out / Stillness / Return) ───────────────────────────
export const TRACE_LEAVE_MS = 1500; // open question #2 (mirrored direction)
export const STILLNESS_OUT_MS = 1000; // open question #3 (mirrored direction)
export const RETURN_MS = 1200; // ART gradually emerges through reflection — open question #2

// ── Interaction-zone / absence (Phase 7 stub territory) ─────────────────────
export const ABSENCE_TIMEOUT_MS = 8000; // continuous absence before auto-Return — open question #5

// ── Now-playing metadata (Phase 6 in the revised plan) ──────────────────────
// Final source depends on exhibition audio hardware — explicitly unresolved
// per the audit's risk analysis. 'mock' is the only implemented mode until
// that hardware decision is made; this constant exists so later phases can
// swap providers without touching call sites.
export const NOW_PLAYING_SOURCE = 'mock'; // 'mock' | future: 'spotify-connect' | 'airplay' | 'webhook' | 'none'

// ── ART (Phase 1) ────────────────────────────────────────────────────────────
// Hosted Programme rotation is explicitly out of scope (open question #1) —
// one local test asset only, for now. The asset itself is an original,
// abstract placeholder created for development — not real/final artwork.
export const ART_TEST_ASSET_PATH = '/aura001-dev/dev-test-artwork.svg';
export const ART_TEST_ASSET_TYPE = 'image'; // 'image' | 'video'
