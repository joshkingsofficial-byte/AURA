// AURA 001 — configurable constants scaffolding.
//
// Every value below is a development starting point, not a final artistic
// or technical decision. Per the Stage 2 audit's open questions list, exact
// timing, geometry, luminosity, sensor distances, and absence thresholds
// remain TBD through physical/visual/gallery testing. Nothing here should be
// treated as final without that testing.

// ── Cold Start (Phase 5.5) ───────────────────────────────────────────────────
// POWER/APPLICATION START -> STARTUP -> ART. STARTUP is a single fixed
// composition on one shared vertical axis — AURA wordmark, "by MINDED",
// the physical Minded bat (BatReveal.js), "Artwork starting", top to
// bottom — not a sequence of elements replacing each other. The bat is
// the primary visual: it begins embedded in near-darkness, a grazing
// light reveals its relief, then it stays put, dim and settled, for the
// rest of STARTUP while the wordmark/byline/subtitle resolve above and
// below it. Everything fades out together at the end. Still no Trace, no
// clock/weather/music, no spinner — and still NOT gated on any network/
// API readiness; these constants are a fixed dev-prototype stand-in for
// "local resources ready."
//
// STARTUP_WORDMARK_FADE_MS and STARTUP_TO_ART_MS are unchanged in value
// from before the bat was added. STARTUP_MIN_MS is the sum of every phase
// in order: dark hold -> light reveal -> bat hold (bat settles, dim, and
// simply stays — it does not fade out here) -> wordmark+byline fade in
// (STARTUP_WORDMARK_FADE_MS) -> subtitle delay -> subtitle fade-in ->
// final hold (everything visible together) -> STARTUP_TO_ART_MS (shared
// fade-out of all four elements, including the bat, as ART crossfades in).
export const STARTUP_BAT_DARK_MS = 500;
export const STARTUP_BAT_REVEAL_MS = 2200;
export const STARTUP_BAT_HOLD_MS = 1100;
export const STARTUP_WORDMARK_FADE_MS = 800;
export const STARTUP_SUBTITLE_DELAY_MS = 500;
export const STARTUP_SUBTITLE_FADE_MS = 600;
export const STARTUP_FINAL_HOLD_MS = 5300; // extended so the complete composition (AURA/by MINDED/Batarang/Artwork starting) holds together longer before the shared fade-out -- the only value changed to reach ~12s total, see STARTUP_MIN_MS below
export const STARTUP_TO_ART_MS = 1000;
export const STARTUP_MIN_MS =
  STARTUP_BAT_DARK_MS +
  STARTUP_BAT_REVEAL_MS +
  STARTUP_BAT_HOLD_MS +
  STARTUP_WORDMARK_FADE_MS +
  STARTUP_SUBTITLE_DELAY_MS +
  STARTUP_SUBTITLE_FADE_MS +
  STARTUP_FINAL_HOLD_MS +
  STARTUP_TO_ART_MS; // computed, not hand-picked — see phase breakdown above
export const STARTUP_BYLINE_OPACITY = 0.4; // "by MINDED" — deliberately below WORDMARK_OPACITY so it reads as subordinate, not a second wordmark — open question #7
export const STARTUP_BYLINE_GAP_PX = 14; // px between the wordmark's lowest stroke and the byline — open question #7
// Explicit presentation scale, not derived from the model's bounding box —
// BatReveal.js's camera fits the bat to fill WHATEVER box this ratio
// allocates (that's a framing-correctness fix, not a size decision). This
// constant is the actual size decision. It was pushed to 0.78 while a
// camera-framing bug was independently rendering the bat at only ~15% of
// its own container, which made even that container size read as small;
// once the framing bug was fixed the same 0.78 filled most of the
// viewport. 0.28 targets the originally-intended ~25-30% of viewport
// width now that the container is actually filled correctly.
export const STARTUP_BAT_WIDTH_RATIO = 0.28;
export const STARTUP_BAT_GAP_PX = 40; // px between the byline and the bat's top edge — restored toward the original breathing room now that the bat is small again — open question #7
export const STARTUP_SUBTITLE_OPACITY = 0.3; // "Artwork starting" — the smallest/subtlest element in the composition — open question #7
export const STARTUP_SUBTITLE_GAP_PX = 28; // px between the bat's bottom edge and "Artwork starting" — restored toward the original breathing room now that the bat is small again — open question #7

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

// ── MIRROR → ART (The Return, Phase 5) ───────────────────────────────────────
// The Return is withdrawal, not Reveal reversed — see RevealSequence.js.
// Governing constraint: "The transition has rhythm, but never obstructs
// intention." Exact timing remains open; this proves ONE configurable
// development choreography, not separate automatic-absence vs
// explicit-request timing profiles (that split is future work).
export const INFO_RECEDE_MS = 400; // each info block's own fade-out duration — open question #2
export const INFO_CASCADE_OFFSET_MS = 150; // stagger between info blocks so they don't vanish on one frame — open question #2
export const TRACE_FINAL_BREATH_MS = 900; // one deliberate breath before withdrawal begins — open question #2/#4
export const TRACE_LEAVE_MS = 1500; // Trace withdrawal travel time — open question #2 (mirrored direction)
export const WORDMARK_HOLD_MS = 600; // AURA alone, after Trace is gone, before it fades — open question #2/#7
export const STILLNESS_OUT_MS = 1000; // open question #3 (mirrored direction)
export const ART_RETURN_MS = 1200; // ART gradually emerges through reflection — open question #2

// ── Interaction-zone / absence (Phase 7 stub territory) ─────────────────────
export const ABSENCE_TIMEOUT_MS = 8000; // continuous absence before auto-Return — open question #5

// ── Now-playing metadata (Phase 6 in the revised plan) ──────────────────────
// Final source depends on exhibition audio hardware — explicitly unresolved
// per the audit's risk analysis. 'mock' is the only implemented mode until
// that hardware decision is made; this constant exists so later phases can
// swap providers without touching call sites.
export const NOW_PLAYING_SOURCE = 'mock'; // 'mock' | future: 'spotify-connect' | 'airplay' | 'webhook' | 'none'

// ── ART (Phase 1; ART_STUDIES registry added for Physical Study 01) ─────────
// Hosted Programme rotation is explicitly out of scope (open question #1) —
// ArtState only ever shows exactly one study, chosen here in source. No
// runtime picker, no rotation, no visitor-facing control of any kind.
// ACTIVE_ART_STUDY is the single line that decides which one — every
// ArtState call site already resolves its default from this same registry,
// so they can never drift out of sync with each other.
export const ART_STUDIES = {
  EMANATION: {
    path: '/aura001-dev/dev-test-artwork.svg',
    type: 'image', // 'image' | 'video'
    fit: 'cover',
    label: 'ART STUDY 001 — EMANATION',
  },
  LONELY: {
    path: '/aura001-dev/lonely.jpg',
    type: 'image',
    fit: 'contain',
    label: 'ART STUDY 002 — LONELY',
    artist: 'Minded',
    location: 'Montenegro',
    year: 2025,
    medium: 'Photograph',
  },
  CAR_LIVE: {
    path: '/aura001-dev/car-live-study.mp4',
    type: 'video',
    fit: 'contain', // native landscape framing, no display-level crop beyond the approved derivative
    label: 'ART STUDY 003B — CAR / LIVE',
    artist: 'Minded',
    location: 'Haywards Heath / Ardingly',
    year: 2023,
    medium: 'Live Photograph / Moving-image study',
  },
  // Static Art Physical Study — temporary candidates, isolating static-artwork
  // behaviour from moving-image behaviour. No artist/title metadata supplied
  // yet beyond what's already embedded in the source files (see
  // MASTER_WORK_FILE.md) — not inventing any here.
  PAINTING_VENICE: {
    path: '/aura001-dev/painting-venice-study.jpg',
    type: 'image',
    fit: 'cover', // full-surface test — native 16:9 asset on a 16:9-ish display
    label: 'ART STUDY 004A — VENICE',
  },
  PAINTING_SEA: {
    path: '/aura001-dev/painting-sea-study.jpg',
    type: 'image',
    fit: 'cover',
    label: 'ART STUDY 004B — SEA',
  },
  PAINTING_GARDEN: {
    path: '/aura001-dev/painting-garden-study.jpg',
    type: 'image',
    fit: 'cover',
    label: 'ART STUDY 004C — GARDEN',
  },
  RUBY: {
    path: '/aura001-dev/ruby-study.jpg',
    type: 'image',
    fit: 'cover',
    label: 'ART STUDY 005 — RUBY',
    artist: 'Ruby',
    title: 'To be high is to be fly',
  },
};
export const ACTIVE_ART_STUDY = 'PAINTING_VENICE'; // change this one line to switch studies — temporarily PAINTING_VENICE for testing

// ── Static Art Schedule Study (experimental) ─────────────────────────────────
// Set to an ART_STUDIES key (e.g. 'PAINTING_SEA') to force that study
// regardless of the local-time schedule — development/testing only, not
// part of the study's actual behaviour. null = normal scheduled behaviour.
// See artSchedule.js and MASTER_WORK_FILE.md "Static Art Schedule Study".
//
// Also doubles as the technician ART preview override for physical
// framing review on reference hardware (Dell study) — same mechanism,
// no second override system. Valid keys (must match ART_STUDIES above
// exactly): 'EMANATION' | 'LONELY' | 'CAR_LIVE' | 'PAINTING_VENICE' |
// 'PAINTING_SEA' | 'PAINTING_GARDEN' | 'RUBY'. Always restore to null
// before normal scheduled operation — see MASTER_WORK_FILE.md
// "Technician Art Preview Override". (The in-page Technician Overview
// panel — see TechnicianOverview.js — is a separate, session-only
// preview layer in RevealSequence.js; it never reads or writes this
// constant or the URL param below.)
export const DEV_ART_STUDY_OVERRIDE = null;

// ── MIRROR composition (Phase 4) ─────────────────────────────────────────────
// Breathing room for time/music/weather beyond the Trace's own edge inset,
// so functional information sits clearly inside the frame, not crowding it.
export const MIRROR_CONTENT_INSET = 56; // px from screen edge — open question #7/#8

// Music is observed, not controlled. Real exhibition-audio integration is
// explicitly unresolved (see NOW_PLAYING_SOURCE above, Phase 6 territory).
// This is the mock track shown when NOW_PLAYING_SOURCE === 'mock'.
export const MOCK_NOW_PLAYING_TRACK = { title: 'NIGHTS', artist: 'Frank Ocean' };

// Installation location is separate from any visitor-facing setup. AURA is
// currently installed in Chelmsford, Essex, UK — these are town-level
// coordinates (not an exact address), explicit and configured here rather
// than left to the browser. Normal installation runtime must not depend on
// browser geolocation: the Pi's kiosk Chromium cannot reliably obtain a
// geolocation fix at all (see MASTER_WORK_FILE.md "Living Atmosphere — Pi
// Root Cause Resolved"), which is why weather silently never appeared on
// the Pi despite working on Mac. Browser geolocation remains only as a
// fallback in weatherProvider.js for a developer running without any
// installation configured — not part of normal AURA runtime.
export const INSTALLATION_LATITUDE = 51.7356;
export const INSTALLATION_LONGITUDE = 0.4798;
export const WEATHER_REFRESH_MS = 30 * 60 * 1000; // 30 min, matches V0's existing refresh cadence
export const WIND_CONDITION_THRESHOLD_KMH = 30; // above this, condition becomes WIND regardless of weathercode — open question #8
export const DEV_WEATHER_OVERRIDE_TEMP = 12; // shown temp when a dev-only ?weather= override is active
