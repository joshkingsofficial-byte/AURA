import React, { useEffect, useState } from 'react';
import './AuraTrace.css';
import { buildWordmarkGeometry } from './wordmarkGeometry';
import {
  TRACE_LINE_WIDTH,
  TRACE_BASE_OPACITY,
  TRACE_HEAD_OPACITY,
  TRACE_TAIL_LENGTH,
  TRACE_BREATH_MIN_OPACITY,
  TRACE_BREATH_MAX_OPACITY,
  TRACE_BREATH_MS,
  TRACE_EDGE_INSET,
  TRACE_CORNER_RADIUS,
  TRACE_ENTER_MS,
  WORDMARK_GLYPH_SCALE,
  WORDMARK_LETTER_GAP_PX,
  WORDMARK_OPACITY,
  WORDMARK_FADE_MS,
} from './constants';

// AURA 001 — AuraTrace (Phase 3 development prototype; Trace-origin
// corrected per design review).
//
// DEVELOPMENT NOTE: this is a structural/motion prototype — it proves the
// mechanism (perimeter geometry, dual-direction travel, corner continuity,
// entering -> breathing), not a finished look. Every visual value here
// (line width, opacities, tail length, breath timing, wordmark geometry)
// is a starting point, not an artistic decision. Final Trace appearance
// must be visually reviewed on the physical two-way mirror, not judged on
// a development monitor — screen and mirror-glass rendering differ enough
// that tuning here is provisional by nature.
//
// "AURA does not sit in front of the viewer. She surrounds them." The
// wordmark is not text sitting beside the Trace in a gap — the horizontal
// crossbar inside each of the two A's IS the first segment of that side's
// Trace path (see wordmarkGeometry.js). Both letters and paths share one
// SVG coordinate space so the crossbar and the travelling stroke are
// literally the same element, not two things merely aligned. Steps: the
// static (non-crossbar) letter strokes fade in with the wordmark; then the
// SAME dashoffset reveal that draws the crossbar continues, uninterrupted,
// out of the letter, across the top edge, around the corners, and down to
// bottom-centre — one continuous stroke per side, not a separate "connect
// to the letter" animation.
//
// Supports three phases (ENTERING / BREATHING / LEAVING) per the state
// machine, but Phase 3 only visually choreographs ENTERING -> BREATHING.
// LEAVING is architecturally present (so the prop/state shape won't need
// to change in Phase 5) but intentionally renders as a static resting
// perimeter for now. A future Return should be able to reverse the same
// paths built here — travelling inward and terminating back into these
// same two crossbars — without new geometry, only a reversed reveal.
//
// This is explicitly a development prototype proving the mechanism, not
// final visual polish — see the Phase 3/correction reports for an honest
// assessment of where the current look is crude.

function useViewportSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

// Two mirrored paths, each starting INSIDE a letter — at the inner end of
// that A's crossbar — drawing across the crossbar, then continuing out of
// the letter to the nearest top corner, down that side, around the bottom
// corner, and in to bottom-centre. One continuous journey per direction,
// not four disconnected edge animations, so corner movement stays
// continuous and the crossbar-to-perimeter join has no seam.
function buildPerimeterPaths(w, h, wordmark) {
  const inset = TRACE_EDGE_INSET;
  const r = TRACE_CORNER_RADIUS;
  const left = inset;
  const right = w - inset;
  const top = inset;
  const bottom = h - inset;
  const cx = w / 2;

  const { firstCrossbar, lastCrossbar } = wordmark;

  const leftPath =
    `M ${firstCrossbar.innerX} ${firstCrossbar.y} L ${firstCrossbar.outerX} ${firstCrossbar.y} ` +
    `L ${left + r} ${top} A ${r} ${r} 0 0 0 ${left} ${top + r} ` +
    `L ${left} ${bottom - r} A ${r} ${r} 0 0 0 ${left + r} ${bottom} L ${cx} ${bottom}`;

  const rightPath =
    `M ${lastCrossbar.innerX} ${lastCrossbar.y} L ${lastCrossbar.outerX} ${lastCrossbar.y} ` +
    `L ${right - r} ${top} A ${r} ${r} 0 0 1 ${right} ${top + r} ` +
    `L ${right} ${bottom - r} A ${r} ${r} 0 0 1 ${right - r} ${bottom} L ${cx} ${bottom}`;

  return [leftPath, rightPath];
}

export default function AuraTrace({ phase = 'entering' }) {
  const { w, h } = useViewportSize();
  const wordmark = buildWordmarkGeometry({
    cx: w / 2,
    topY: TRACE_EDGE_INSET,
    scale: WORDMARK_GLYPH_SCALE,
    letterGap: WORDMARK_LETTER_GAP_PX,
  });
  const paths = buildPerimeterPaths(w, h, wordmark);

  const isEntering = phase === 'entering';
  const isBreathing = phase === 'breathing';
  // isLeaving (phase === 'leaving') falls through to the same static
  // rendering as a non-breathing resting perimeter — see file header.

  const cssVars = {
    '--wordmark-fade-ms': `${WORDMARK_FADE_MS}ms`,
    '--wordmark-opacity': WORDMARK_OPACITY,
    '--trace-enter-ms': `${TRACE_ENTER_MS}ms`,
    '--tail-length': TRACE_TAIL_LENGTH,
    '--head-opacity': TRACE_HEAD_OPACITY,
    '--breath-ms': `${TRACE_BREATH_MS}ms`,
    '--breath-min-opacity': TRACE_BREATH_MIN_OPACITY,
    '--breath-max-opacity': TRACE_BREATH_MAX_OPACITY,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', ...cssVars }}>
      <svg width={w} height={h} style={{ position: 'absolute', top: 0, left: 0 }}>
        {/* Static letter strokes — everything except the two crossbars,
            which belong to the animated perimeter paths below. */}
        <g className="aura-trace-wordmark">
          {wordmark.staticStrokes.map((s, i) => (
            <line
              key={i}
              x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
              stroke="#c8a96e"
              strokeWidth={TRACE_LINE_WIDTH}
              strokeLinecap="round"
            />
          ))}
        </g>

        {paths.map((d, i) => (
          <React.Fragment key={i}>
            <path
              d={d}
              pathLength="1"
              fill="none"
              stroke="#c8a96e"
              strokeWidth={TRACE_LINE_WIDTH}
              strokeLinecap="round"
              className={isBreathing ? 'aura-trace-breathing' : 'aura-trace-base-path'}
              style={{
                opacity: TRACE_BASE_OPACITY,
                strokeDashoffset: isBreathing ? 0 : undefined,
              }}
            />
            {isEntering && (
              <path
                d={d}
                pathLength="1"
                fill="none"
                stroke="#c8a96e"
                strokeWidth={TRACE_LINE_WIDTH + 1}
                strokeLinecap="round"
                className="aura-trace-head-path"
                style={{ filter: 'drop-shadow(0 0 4px rgba(200,169,110,0.8))' }}
              />
            )}
          </React.Fragment>
        ))}
      </svg>
    </div>
  );
}
