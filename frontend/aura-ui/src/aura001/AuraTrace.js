import React, { useEffect, useRef, useState } from 'react';
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
  TRACE_FINAL_BREATH_MS,
  TRACE_LEAVE_MS,
  WORDMARK_HOLD_MS,
  WORDMARK_GLYPH_SCALE,
  WORDMARK_LETTER_GAP_PX,
  WORDMARK_OPACITY,
  WORDMARK_FADE_MS,
} from './constants';

// AURA 001 — AuraTrace (Phase 3 development prototype; Trace-origin
// corrected per design review; Return withdrawal added in Phase 5).
//
// DEVELOPMENT NOTE: this is a structural/motion prototype — it proves the
// mechanism, not a finished look. Every visual value here is a starting
// point, not an artistic decision. Final Trace appearance must be visually
// reviewed on the physical two-way mirror, not judged on a development
// monitor.
//
// "AURA does not sit in front of the viewer. She surrounds them." The
// wordmark is not text sitting beside the Trace in a gap — the horizontal
// crossbar inside each of the two A's IS the first/last segment of that
// side's Trace path (see wordmarkGeometry.js). Both letters and paths
// share one SVG coordinate space.
//
// Phase 5 — The Return (phase='leaving'): withdrawal is NOT the entering
// choreography played backward as a simple opacity fade. It is its own
// four-step internal sequence, entirely owned by this component so the
// global state machine only needs to know "leaving started" (phase prop)
// and "leaving finished" (onLeavingComplete callback) — see
// RevealSequence.js for why sub-phases stay local rather than expanding
// the global enum:
//   1. final-breath   — one deliberate breath, not part of the infinite loop
//   2. trace-withdraw — the SAME paths built for entry, retracting from
//                        bottom-centre back into the crossbars (dash length
//                        shrinks from the far end inward, anchored at the
//                        crossbar — not a reversed dashoffset sweep, which
//                        would retract from the WRONG end) with a travelling
//                        head moving backward in sync
//   3. wordmark-hold   — perimeter fully gone, AURA alone, unchanged, briefly
//   4. wordmark-fade   — the wordmark itself fades out (mirrors the entry fade-in)
// Only after step 4 completes does this call onLeavingComplete().

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
// corner, and in to bottom-centre. The same two paths are reused unchanged
// for withdrawal — only the reveal mechanism (which portion is visible)
// runs in reverse, not the geometry itself.
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

export default function AuraTrace({ phase = 'entering', onLeavingComplete }) {
  const { w, h } = useViewportSize();
  const wordmark = buildWordmarkGeometry({
    cx: w / 2,
    topY: TRACE_EDGE_INSET,
    scale: WORDMARK_GLYPH_SCALE,
    letterGap: WORDMARK_LETTER_GAP_PX,
  });
  const paths = buildPerimeterPaths(w, h, wordmark);

  // Internal leaving sub-sequence — see file header. Kicks off exactly
  // once per transition into phase='leaving'.
  const [leavingStep, setLeavingStep] = useState(null);
  const wasLeavingRef = useRef(false);
  const leavingTimersRef = useRef([]);

  useEffect(() => {
    if (phase === 'leaving' && !wasLeavingRef.current) {
      wasLeavingRef.current = true;
      setLeavingStep('final-breath');

      const t1 = setTimeout(() => {
        setLeavingStep('trace-withdraw');
        const t2 = setTimeout(() => {
          setLeavingStep('wordmark-hold');
          const t3 = setTimeout(() => {
            setLeavingStep('wordmark-fade');
            const t4 = setTimeout(() => {
              onLeavingComplete && onLeavingComplete();
            }, WORDMARK_FADE_MS);
            leavingTimersRef.current.push(t4);
          }, WORDMARK_HOLD_MS);
          leavingTimersRef.current.push(t3);
        }, TRACE_LEAVE_MS);
        leavingTimersRef.current.push(t2);
      }, TRACE_FINAL_BREATH_MS);
      leavingTimersRef.current.push(t1);
    }
    if (phase !== 'leaving') {
      wasLeavingRef.current = false;
      setLeavingStep(null);
    }
  }, [phase, onLeavingComplete]);

  useEffect(() => () => leavingTimersRef.current.forEach(clearTimeout), []);

  const isEntering = phase === 'entering';
  const isBreathing = phase === 'breathing';

  const showPerimeter =
    isEntering || isBreathing || leavingStep === 'final-breath' || leavingStep === 'trace-withdraw';

  const perimeterClass = isEntering
    ? 'aura-trace-base-path'
    : leavingStep === 'final-breath'
      ? 'aura-trace-final-breath'
      : leavingStep === 'trace-withdraw'
        ? 'aura-trace-withdraw-path'
        : 'aura-trace-breathing'; // isBreathing, or any other resting case

  const fixedDashoffsetZero = isBreathing || leavingStep === 'final-breath'; // trace-withdraw sets its own via CSS

  const wordmarkClass = leavingStep === 'wordmark-fade' ? 'aura-trace-wordmark-fade-out' : 'aura-trace-wordmark';

  const cssVars = {
    '--wordmark-fade-ms': `${WORDMARK_FADE_MS}ms`,
    '--wordmark-opacity': WORDMARK_OPACITY,
    '--trace-enter-ms': `${TRACE_ENTER_MS}ms`,
    '--tail-length': TRACE_TAIL_LENGTH,
    '--head-opacity': TRACE_HEAD_OPACITY,
    '--breath-ms': `${TRACE_BREATH_MS}ms`,
    '--breath-min-opacity': TRACE_BREATH_MIN_OPACITY,
    '--breath-max-opacity': TRACE_BREATH_MAX_OPACITY,
    '--final-breath-ms': `${TRACE_FINAL_BREATH_MS}ms`,
    '--trace-leave-ms': `${TRACE_LEAVE_MS}ms`,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', ...cssVars }}>
      <svg width={w} height={h} style={{ position: 'absolute', top: 0, left: 0 }}>
        {/* Static letter strokes — everything except the two crossbars,
            which belong to the animated perimeter paths below. */}
        <g className={wordmarkClass}>
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

        {showPerimeter && paths.map((d, i) => (
          <React.Fragment key={i}>
            <path
              d={d}
              pathLength="1"
              fill="none"
              stroke="#c8a96e"
              strokeWidth={TRACE_LINE_WIDTH}
              strokeLinecap="round"
              className={perimeterClass}
              style={{
                opacity: TRACE_BASE_OPACITY,
                strokeDashoffset: fixedDashoffsetZero ? 0 : undefined,
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
            {leavingStep === 'trace-withdraw' && (
              <path
                d={d}
                pathLength="1"
                fill="none"
                stroke="#c8a96e"
                strokeWidth={TRACE_LINE_WIDTH + 1}
                strokeLinecap="round"
                className="aura-trace-withdraw-head-path"
                style={{ filter: 'drop-shadow(0 0 4px rgba(200,169,110,0.8))' }}
              />
            )}
          </React.Fragment>
        ))}
      </svg>
    </div>
  );
}
