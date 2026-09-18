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

// ── AURA Trace (perimeter geometry + motion, Phase 3) ────────────────────────
// Superseded the Phase 0 placeholder trio (TRACE_BREATH_CYCLE_MS,
// TRACE_LINE_THICKNESS_PX, TRACE_LUMINOSITY) now that Phase 3's actual
// design calls for more granular, independently tunable values.
export const TRACE_LINE_WIDTH = 2; // px — open question #4
export const TRACE_BASE_OPACITY = 0.35; // resting/revealed line opacity — open question #4
export const TRACE_HEAD_OPACITY = 0.9; // brighter leading point while travelling — open question #4
export const TRACE_TAIL_LENGTH = 0.12; // fraction (0–1) of path length for the travelling head — open question #4
export const TRACE_BREATH_MIN_OPACITY = 0.18; // open question #4
export const TRACE_BREATH_MAX_OPACITY = 0.45; // open question #4
export const TRACE_BREATH_MS = 4000; // one full breath cycle — open question #4
export const TRACE_EDGE_INSET = 24; // px from true screen edge — open question #4
export const TRACE_CORNER_RADIUS = 32; // px — open question #4

// ── Wordmark (custom-drawn glyphs; each A's crossbar IS the Trace's first
// segment — see wordmarkGeometry.js) ─────────────────────────────────────
export const WORDMARK_GLYPH_SCALE = 1.15; // scales the hand-drawn A/U/R/A strokes — open question #7
export const WORDMARK_LETTER_GAP_PX = 6; // px between letters — open question #7
export const WORDMARK_OPACITY = 0.85; // open question #7
export const WORDMARK_FADE_MS = 500; // open question #7

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

// ── MIRROR composition (Phase 4) ─────────────────────────────────────────────
// Breathing room for time/music/weather beyond the Trace's own edge inset,
// so functional information sits clearly inside the frame, not crowding it.
export const MIRROR_CONTENT_INSET = 56; // px from screen edge — open question #7/#8

// Music is observed, not controlled. Real exhibition-audio integration is
// explicitly unresolved (see NOW_PLAYING_SOURCE above, Phase 6 territory).
// This is the mock track shown when NOW_PLAYING_SOURCE === 'mock'.
export const MOCK_NOW_PLAYING_TRACK = { title: 'NIGHTS', artist: 'Frank Ocean' };

// Installation location is separate from any visitor-facing setup — these
// stay null until a real installation configures them. null falls back to
// browser geolocation, which is a DEVELOPMENT convenience only (no consumer
// location onboarding is being built here).
export const INSTALLATION_LATITUDE = null;
export const INSTALLATION_LONGITUDE = null;
export const WEATHER_REFRESH_MS = 30 * 60 * 1000; // 30 min, matches V0's existing refresh cadence
export const WIND_CONDITION_THRESHOLD_KMH = 30; // above this, condition becomes WIND regardless of weathercode — open question #8
export const DEV_WEATHER_OVERRIDE_TEMP = 12; // shown temp when a dev-only ?weather= override is active
