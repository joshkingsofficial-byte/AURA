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
export const TRACE_WORDMARK_GAP_PX = 160; // px reserved at top-centre where the two traces originate — implementation-required, open question #4/#7

// ── Wordmark (integrated into the Trace's origin, Phase 3) ──────────────────
export const WORDMARK_LETTER_SPACING = '0.5em'; // open question #7
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
