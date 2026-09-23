import React, { useEffect, useState } from 'react';
import './StartupState.css';
import { buildWordmarkGeometry } from './wordmarkGeometry';
import {
  TRACE_LINE_WIDTH,
  TRACE_EDGE_INSET,
  WORDMARK_GLYPH_SCALE,
  WORDMARK_LETTER_GAP_PX,
  WORDMARK_OPACITY,
  STARTUP_WORDMARK_FADE_MS,
  STARTUP_MIN_MS,
  STARTUP_TO_ART_MS,
} from './constants';

// AURA 001 — StartupState (Phase 5.5 cold start).
//
// STARTUP shows only the "A U R A" wordmark over the near-black mirror
// surface (MirrorSurfacePlaceholder, already always-mounted by
// RevealSequence underneath everything) — nothing else. No Trace, no
// perimeter, no spinner/percentage/"loading" text. "Do not use the AURA
// Trace as a loading indicator" (the Trace belongs to the MIRROR
// interaction grammar) — so this component reuses only the wordmark glyph
// geometry from wordmarkGeometry.js, not AuraTrace itself, and draws both
// A crossbars directly (AuraTrace normally owns those as the first segment
// of its animated perimeter paths; here there is no perimeter, so the
// crossbars are drawn as ordinary static strokes to keep the wordmark
// legible on its own).
//
// Internal two-step sequence, owned entirely by this component (same
// local-sub-phase pattern as AuraTrace's leaving sequence — see
// RevealSequence.js for why): fade in over STARTUP_WORDMARK_FADE_MS, hold,
// then fade out over the final STARTUP_TO_ART_MS as ART crossfades in
// underneath (see RevealSequence.js's inStartup branch, which times
// ArtState's own fade-in to land on the same window via CSS animation-delay).

function useViewportSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

export default function StartupState() {
  const { w, h } = useViewportSize();
  const wordmark = buildWordmarkGeometry({
    cx: w / 2,
    topY: TRACE_EDGE_INSET,
    scale: WORDMARK_GLYPH_SCALE,
    letterGap: WORDMARK_LETTER_GAP_PX,
  });

  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const holdUntilMs = STARTUP_MIN_MS - STARTUP_TO_ART_MS;
    const t = setTimeout(() => setLeaving(true), holdUntilMs);
    return () => clearTimeout(t);
  }, []);

  const allStrokes = [
    ...wordmark.staticStrokes,
    { x1: wordmark.firstCrossbar.innerX, y1: wordmark.firstCrossbar.y, x2: wordmark.firstCrossbar.outerX, y2: wordmark.firstCrossbar.y },
    { x1: wordmark.lastCrossbar.innerX, y1: wordmark.lastCrossbar.y, x2: wordmark.lastCrossbar.outerX, y2: wordmark.lastCrossbar.y },
  ];

  const cssVars = {
    '--startup-wordmark-fade-ms': `${STARTUP_WORDMARK_FADE_MS}ms`,
    '--startup-to-art-ms': `${STARTUP_TO_ART_MS}ms`,
    '--wordmark-opacity': WORDMARK_OPACITY,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', ...cssVars }}>
      <svg width={w} height={h} style={{ position: 'absolute', top: 0, left: 0 }}>
        <g className={leaving ? 'startup-wordmark-fade-out' : 'startup-wordmark-fade-in'}>
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
    </div>
  );
}
