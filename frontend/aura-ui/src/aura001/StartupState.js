import React, { useEffect, useState } from 'react';
import './StartupState.css';
import { buildWordmarkGeometry } from './wordmarkGeometry';
import BatReveal from './BatReveal';
import BatarangSpinSpotlight from './BatarangSpinSpotlight';
import {
  TRACE_LINE_WIDTH,
  TRACE_EDGE_INSET,
  WORDMARK_GLYPH_SCALE,
  WORDMARK_LETTER_GAP_PX,
  WORDMARK_OPACITY,
  STARTUP_BAT_DARK_MS,
  STARTUP_BAT_REVEAL_MS,
  STARTUP_BAT_HOLD_MS,
  STARTUP_WORDMARK_FADE_MS,
  STARTUP_SUBTITLE_DELAY_MS,
  STARTUP_SUBTITLE_FADE_MS,
  STARTUP_MIN_MS,
  STARTUP_TO_ART_MS,
  STARTUP_BYLINE_OPACITY,
  STARTUP_BYLINE_GAP_PX,
  STARTUP_BAT_WIDTH_RATIO,
  STARTUP_BAT_GAP_PX,
  STARTUP_SUBTITLE_OPACITY,
  STARTUP_SUBTITLE_GAP_PX,
} from './constants';

// AURA 001 — StartupState (Phase 5.5 cold start).
//
// A single fixed composition on one shared vertical axis, top to bottom:
// the "A U R A" wordmark, "by MINDED", the bat — by default the rotating
// Batarang under its stationary spotlight (BatarangSpinSpotlight.js, the
// approved production visual), or the original Minded bat (BatReveal.js)
// when a technician explicitly selects it as the fallback — "Artwork
// starting". These are not states replacing each other; they accumulate
// into one deliberately-spaced composition, then fade out together at the
// end.
//
// Wordmark/byline/subtitle timing, all owned internally by this one
// component (same local-sub-phase pattern as AuraTrace's leaving sequence
// — see RevealSequence.js for why), is identical regardless of which bat
// is showing: dark hold -> (BatReveal only: a grazing light sweep reveals
// the Minded bat's relief over STARTUP_BAT_REVEAL_MS; BatarangSpinSpotlight
// ignores this phase entirely and is already spinning under its own
// stationary spotlight from mount) -> the wordmark + byline fade in
// (existing mechanism, unchanged timing) -> after a short delay, "Artwork
// starting" fades in below the bat -> everything holds together -> the
// existing shared fade-out (STARTUP_TO_ART_MS) as ART crossfades in
// underneath (see RevealSequence.js's inStartup branch) — the bat fades
// out at this same final moment, not earlier.
//
// STARTUP still shows nothing else — no Trace, no clock/weather/music, no
// loading indicator/spinner/percentage of any kind. Still NOT gated on
// any network/API readiness.
//
// "by MINDED" / "Artwork starting" are plain text, not a second logotype
// — wordmarkGeometry.js remains the sole canonical AURA letterform source,
// untouched by any of this.

function useViewportSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

// Matches the approved reference render's real aspect ratio (bbox X:Z,
// wingspan:depth) -- used only to size the on-screen container before the
// async GLB load resolves; BatReveal frames its own camera from the
// model's actual loaded geometry, not this estimate.
const BAT_ASPECT = 63.7 / 11.35;

// `technicianBatModelUrl` — optional, technician-only (see TechnicianOverview.js
// / RevealSequence.js). null/undefined in every normal/production case —
// which now renders BatarangSpinSpotlight, the approved production startup
// visual (see that file). A technician setting this to a GLB path switches
// to BatReveal showing that model instead (the original Minded bat kept as
// an explicit fallback option, or one of the TestBatarang orientation
// variants) — `key` is tied to the path so React remounts BatReveal fresh
// on every switch rather than BatReveal having to support swapping models
// after mount.
export default function StartupState({ technicianBatModelUrl } = {}) {
  const { w, h } = useViewportSize();
  const wordmark = buildWordmarkGeometry({
    cx: w / 2,
    topY: TRACE_EDGE_INSET,
    scale: WORDMARK_GLYPH_SCALE,
    letterGap: WORDMARK_LETTER_GAP_PX,
  });

  const [batPhase, setBatPhase] = useState('dark');
  const [wordmarkVisible, setWordmarkVisible] = useState(false);
  const [subtitleVisible, setSubtitleVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timers = [];
    const add = (fn, ms) => { timers.push(setTimeout(fn, ms)); };

    add(() => setBatPhase('revealing'), STARTUP_BAT_DARK_MS);
    add(() => setBatPhase('lit'), STARTUP_BAT_DARK_MS + STARTUP_BAT_REVEAL_MS);

    const wordmarkStart = STARTUP_BAT_DARK_MS + STARTUP_BAT_REVEAL_MS + STARTUP_BAT_HOLD_MS;
    add(() => setWordmarkVisible(true), wordmarkStart); // bat stays 'lit' — no phase change here anymore

    const subtitleStart = wordmarkStart + STARTUP_WORDMARK_FADE_MS + STARTUP_SUBTITLE_DELAY_MS;
    add(() => setSubtitleVisible(true), subtitleStart);

    const holdUntilMs = STARTUP_MIN_MS - STARTUP_TO_ART_MS;
    add(() => {
      setLeaving(true);
      setBatPhase('fading'); // bat fades out alongside everything else, at the very end only
    }, holdUntilMs);

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allStrokes = [
    ...wordmark.staticStrokes,
    { x1: wordmark.firstCrossbar.innerX, y1: wordmark.firstCrossbar.y, x2: wordmark.firstCrossbar.outerX, y2: wordmark.firstCrossbar.y },
    { x1: wordmark.lastCrossbar.innerX, y1: wordmark.lastCrossbar.y, x2: wordmark.lastCrossbar.outerX, y2: wordmark.lastCrossbar.y },
  ];

  // Derived from the same stroke data the wordmark itself draws from —
  // not a hardcoded number — so the whole composition below it stays
  // correctly placed if the wordmark's scale/position ever changes.
  const wordmarkBottomY = Math.max(...allStrokes.map((s) => Math.max(s.y1, s.y2)));
  const bylineY = wordmarkBottomY + STARTUP_BYLINE_GAP_PX;

  const batWidth = w * STARTUP_BAT_WIDTH_RATIO;
  const batHeight = batWidth / BAT_ASPECT;
  const batTop = bylineY + STARTUP_BAT_GAP_PX;
  const subtitleY = batTop + batHeight + STARTUP_SUBTITLE_GAP_PX;

  const cssVars = {
    '--startup-wordmark-fade-ms': `${STARTUP_WORDMARK_FADE_MS}ms`,
    '--startup-to-art-ms': `${STARTUP_TO_ART_MS}ms`,
    '--wordmark-opacity': WORDMARK_OPACITY,
  };

  const fadeClass = leaving ? 'startup-wordmark-fade-out' : 'startup-wordmark-fade-in';

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', ...cssVars }}>
      {wordmarkVisible && (
        <>
          <svg width={w} height={h} style={{ position: 'absolute', top: 0, left: 0 }}>
            <g className={fadeClass}>
              {allStrokes.map((s, i) => (
                <line
                  key={i}
                  x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
                  stroke="#c8a96e"
                  strokeWidth={TRACE_LINE_WIDTH}
                  strokeLinecap="round"
                />
              ))}
            </g>
          </svg>
          <div
            className={fadeClass}
            style={{
              position: 'absolute',
              top: bylineY,
              left: w / 2,
              transform: 'translateX(-50%)',
              fontSize: '10px',
              fontWeight: 300,
              letterSpacing: '0.3em',
              // Shares the wordmark's own fade-in/out animation (same class,
              // same timing). That animation drives CSS `opacity` 0 <->
              // WORDMARK_OPACITY on whatever it's applied to, so the
              // byline's own subordinate dimness comes from the colour's
              // alpha channel instead, scaled so the two multiply out to
              // STARTUP_BYLINE_OPACITY at the animation's peak.
              color: `rgba(200, 169, 110, ${STARTUP_BYLINE_OPACITY / WORDMARK_OPACITY})`,
              whiteSpace: 'nowrap',
            }}
          >
            by MINDED
          </div>
        </>
      )}

      <div
        style={{
          position: 'absolute',
          top: batTop,
          left: w / 2,
          transform: 'translateX(-50%)',
          width: batWidth,
          height: batHeight,
          opacity: batPhase === 'fading' ? 0 : 1,
          transition: `opacity ${STARTUP_TO_ART_MS}ms ease`,
        }}
      >
        {technicianBatModelUrl ? (
          <BatReveal
            key={technicianBatModelUrl}
            phase={batPhase}
            width={batWidth}
            height={batHeight}
            modelUrl={technicianBatModelUrl}
          />
        ) : (
          <BatarangSpinSpotlight width={batWidth} height={batHeight} />
        )}
      </div>

      {wordmarkVisible && (
        <div
          style={{
            position: 'absolute',
            top: subtitleY,
            left: w / 2,
            transform: 'translateX(-50%)',
            fontSize: '9px',
            fontWeight: 300,
            letterSpacing: '0.35em',
            color: '#c8a96e',
            whiteSpace: 'nowrap',
            // Independently timed from the wordmark/byline (starts later,
            // own fade duration) so it can't share their CSS class/keyframe
            // — plain inline opacity transition instead, same pattern
            // MirrorState.js already uses for its own info-block fades.
            opacity: leaving ? 0 : (subtitleVisible ? STARTUP_SUBTITLE_OPACITY : 0),
            transition: `opacity ${leaving ? STARTUP_TO_ART_MS : STARTUP_SUBTITLE_FADE_MS}ms ease`,
          }}
        >
          Artwork starting
        </div>
      )}
    </div>
  );
}
