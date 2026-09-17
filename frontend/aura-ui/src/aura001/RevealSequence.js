import React, { useCallback, useEffect, useRef, useState } from 'react';
import ArtState from './ArtState';
import MirrorSurfacePlaceholder from './MirrorSurfacePlaceholder';
import { AURA001_STATES } from './states';
import { REVEAL_MS, STILLNESS_IN_MS } from './constants';

// AURA 001 — Phase 2 development sequence controller.
//
// Drives ART -> REVEALING -> STILLNESS_IN using the Phase 0 state machine
// and named constants. Dev-only: mounted exclusively behind the
// ?aura001=reveal gate in App.js, the same pattern as Phase 1's
// ?aura001=art. Does not implement TRACE_ENTERING or anything beyond
// STILLNESS_IN — Phase 3 (AURA Trace) doesn't exist yet, so the sequence
// deliberately stops and remains in STILLNESS_IN.
//
// Layering: MirrorSurfacePlaceholder always sits underneath. ArtState sits
// above it inside a wrapper whose opacity is CSS-transitioned from 1 to 0
// over REVEAL_MS when REVEALING begins. Because the placeholder color is
// not black and the art wrapper's own black backing is always fully
// covered by the opaque art image, the cross-fade never passes through an
// actual black frame. Once STILLNESS_IN is reached, ArtState is unmounted
// entirely (not just opacity 0) so the artwork is truly, not just visually,
// absent.
//
// Transition lock: trigger() is a no-op unless the current state is ART,
// so a repeated trigger during REVEALING/STILLNESS_IN cannot restart or
// corrupt the sequence — state progression stays deterministic.

export default function RevealSequence() {
  const [state, setState] = useState(AURA001_STATES.ART);
  const stateRef = useRef(state);
  stateRef.current = state;
  const revealTimerRef = useRef(null);
  const stillnessTimerRef = useRef(null);

  const trigger = useCallback(() => {
    if (stateRef.current !== AURA001_STATES.ART) return; // transition lock

    setState(AURA001_STATES.REVEALING);

    revealTimerRef.current = setTimeout(() => {
      setState(AURA001_STATES.STILLNESS_IN);

      // STILLNESS_IN_MS marks the intended duration of this phase before
      // Trace would begin (Phase 3). Phase 3 doesn't exist yet, so nothing
      // happens when it elapses beyond this log — per the phase spec, the
      // state simply remains in STILLNESS_IN rather than inventing
      // somewhere for it to go.
      stillnessTimerRef.current = setTimeout(() => {
        console.log('[AURA001] Stillness duration elapsed — remaining in STILLNESS_IN (Phase 3 not yet implemented)');
      }, STILLNESS_IN_MS);
    }, REVEAL_MS);
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(revealTimerRef.current);
      clearTimeout(stillnessTimerRef.current);
    };
  }, []);

  const inArt = state === AURA001_STATES.ART;
  const showArtLayer = state !== AURA001_STATES.STILLNESS_IN; // fully unmounted at Stillness, not just opacity 0

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
    </div>
  );
}
