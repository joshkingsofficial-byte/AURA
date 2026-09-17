import React, { useCallback, useEffect, useRef, useState } from 'react';
import ArtState from './ArtState';
import MirrorSurfacePlaceholder from './MirrorSurfacePlaceholder';
import AuraTrace from './AuraTrace';
import { AURA001_STATES } from './states';
import { REVEAL_MS, STILLNESS_IN_MS, TRACE_ENTER_MS, WORDMARK_FADE_MS } from './constants';

// AURA 001 — development sequence controller (Phase 2 + Phase 3).
//
// Drives ART -> REVEALING -> STILLNESS_IN -> TRACE_ENTERING -> MIRROR using
// the Phase 0 state machine and named constants. Dev-only: mounted
// exclusively behind the ?aura001=reveal gate in App.js, the same pattern
// as Phase 1's ?aura001=art.
//
// MIRROR here is Phase 3's verification meaning only: bare reflection
// surface + wordmark + breathing Trace. No functional information
// (time/date/weather/music) — that's Phase 4, not built here.
//
// Layering: MirrorSurfacePlaceholder always sits underneath. ArtState sits
// above it while in ART/REVEALING only (see showArtLayer below), fading
// via CSS opacity over REVEAL_MS. Once STILLNESS_IN is reached, ArtState is
// unmounted entirely. AuraTrace mounts only from TRACE_ENTERING onward and
// owns its own entering choreography and breathing loop internally.
//
// Transition lock: trigger() is a no-op unless the current state is ART,
// so a repeated trigger during any later state cannot restart or corrupt
// the sequence — state progression stays deterministic.

export default function RevealSequence() {
  const [state, setState] = useState(AURA001_STATES.ART);
  const stateRef = useRef(state);
  stateRef.current = state;
  const revealTimerRef = useRef(null);
  const stillnessTimerRef = useRef(null);
  const traceTimerRef = useRef(null);

  const trigger = useCallback(() => {
    if (stateRef.current !== AURA001_STATES.ART) return; // transition lock

    setState(AURA001_STATES.REVEALING);

    revealTimerRef.current = setTimeout(() => {
      setState(AURA001_STATES.STILLNESS_IN);

      stillnessTimerRef.current = setTimeout(() => {
        setState(AURA001_STATES.TRACE_ENTERING);

        // Total entering duration = wordmark fade, then the trace travels —
        // matches AuraTrace's own internal CSS timing (animation-delay of
        // WORDMARK_FADE_MS before the trace-reveal animation of
        // TRACE_ENTER_MS begins), so this timer fires exactly as the
        // visual choreography completes.
        traceTimerRef.current = setTimeout(() => {
          setState(AURA001_STATES.MIRROR);
        }, WORDMARK_FADE_MS + TRACE_ENTER_MS);
      }, STILLNESS_IN_MS);
    }, REVEAL_MS);
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(revealTimerRef.current);
      clearTimeout(stillnessTimerRef.current);
      clearTimeout(traceTimerRef.current);
    };
  }, []);

  const inArt = state === AURA001_STATES.ART;
  const showArtLayer = state === AURA001_STATES.ART || state === AURA001_STATES.REVEALING;
  const showTrace = state === AURA001_STATES.TRACE_ENTERING || state === AURA001_STATES.MIRROR;
  const tracePhase = state === AURA001_STATES.TRACE_ENTERING ? 'entering' : 'breathing';

  return (
    // Click anywhere to invoke trigger() — a development-only convenience
    // for starting the sequence and for testing the transition lock by
    // clicking again mid-transition. Renders no visible affordance, so it
    // introduces no UI/label/control of its own.
    <div onClick={trigger} style={{ position: 'fixed', inset: 0 }}>
      <MirrorSurfacePlaceholder />
      {showArtLayer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            opacity: inArt ? 1 : 0,
            transition: `opacity ${REVEAL_MS}ms ease`,
            pointerEvents: 'none',
          }}
        >
          <ArtState />
        </div>
      )}
      {showTrace && <AuraTrace phase={tracePhase} />}
    </div>
  );
}
