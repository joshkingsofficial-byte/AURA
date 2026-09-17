import React, { useEffect, useState } from 'react';
import './AuraTrace.css';
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
  TRACE_WORDMARK_GAP_PX,
  TRACE_ENTER_MS,
  WORDMARK_LETTER_SPACING,
  WORDMARK_OPACITY,
  WORDMARK_FADE_MS,
} from './constants';

// AURA 001 — AuraTrace (Phase 3 development prototype).
//
// DEVELOPMENT NOTE: this is a structural/motion prototype — it proves the
// mechanism (perimeter geometry, dual-direction travel, corner continuity,
// entering -> breathing), not a finished look. Every visual value here
// (line width, opacities, tail length, breath timing, wordmark spacing) is
// a starting point, not an artistic decision. Final Trace appearance must
// be visually reviewed on the physical two-way mirror, not judged on a
// development monitor — screen and mirror-glass rendering differ enough
// that tuning here is provisional by nature.
//
// "AURA does not sit in front of the viewer. She surrounds them." The
// wordmark sits at top-centre and IS the origin of two mirrored traces
// that travel outward across the top edge, around the top corners, down
// the sides, around the bottom corners, and meet at bottom-centre — one
// continuous perimeter journey split into two directions, not four
// disconnected edge animations, so corner movement stays continuous.
//
// Supports three phases (ENTERING / BREATHING / LEAVING) per the state
// machine, but Phase 3 only visually choreographs ENTERING -> BREATHING.
// LEAVING is architecturally present (so the prop/state shape won't need
// to change in Phase 5) but intentionally renders as a static resting
// perimeter for now — its real choreography belongs to Phase 5.
//
// This is explicitly a development prototype proving the mechanism, not
// final visual polish — see the Phase 3 report for an honest assessment
// of where the current look is crude.

function useViewportSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

// Two mirrored paths, each starting at top-centre (either side of the
// wordmark gap) and ending at bottom-centre — a right-going path (through
// the top-right and bottom-right corners) and a left-going path (through
// the top-left and bottom-left corners). Corner sweep-flags are opposite
// mirrors of each other since the two paths trace the perimeter in
// opposite rotational directions from the same starting line.
function buildPerimeterPaths(w, h) {
  const inset = TRACE_EDGE_INSET;
  const r = TRACE_CORNER_RADIUS;
  const gapHalf = TRACE_WORDMARK_GAP_PX / 2;
  const left = inset;
  const right = w - inset;
  const top = inset;
  const bottom = h - inset;
  const cx = w / 2;

  const rightPath = `M ${cx + gapHalf} ${top} L ${right - r} ${top} A ${r} ${r} 0 0 1 ${right} ${top + r} L ${right} ${bottom - r} A ${r} ${r} 0 0 1 ${right - r} ${bottom} L ${cx} ${bottom}`;
  const leftPath = `M ${cx - gapHalf} ${top} L ${left + r} ${top} A ${r} ${r} 0 0 0 ${left} ${top + r} L ${left} ${bottom - r} A ${r} ${r} 0 0 0 ${left + r} ${bottom} L ${cx} ${bottom}`;

  return [leftPath, rightPath];
}

export default function AuraTrace({ phase = 'entering' }) {
  const { w, h } = useViewportSize();
  const paths = buildPerimeterPaths(w, h);

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
      <div
        className="aura-trace-wordmark"
        style={{
          position: 'absolute',
          top: `${TRACE_EDGE_INSET - 4}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '13px',
          fontWeight: 200,
          letterSpacing: WORDMARK_LETTER_SPACING,
          color: '#c8a96e',
          whiteSpace: 'nowrap',
        }}
      >
        AURA
      </div>

      <svg width={w} height={h} style={{ position: 'absolute', top: 0, left: 0 }}>
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
