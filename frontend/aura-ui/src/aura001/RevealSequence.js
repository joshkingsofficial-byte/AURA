import React, { useCallback, useEffect, useRef, useState } from 'react';
import './RevealSequence.css';
import ArtState from './ArtState';
import MirrorSurfacePlaceholder from './MirrorSurfacePlaceholder';
import AuraTrace from './AuraTrace';
import MirrorState from './MirrorState';
import StartupState from './StartupState';
import { AURA001_STATES, AURA001_DEFAULT_STATE } from './states';
import {
  STARTUP_MIN_MS,
  STARTUP_TO_ART_MS,
  REVEAL_MS,
  STILLNESS_IN_MS,
  TRACE_ENTER_MS,
  WORDMARK_FADE_MS,
  INFO_RECEDE_MS,
  INFO_CASCADE_OFFSET_MS,
  STILLNESS_OUT_MS,
  ART_RETURN_MS,
} from './constants';

// AURA 001 — sequence controller (Phase 2 + 3 + 4 + 5 + 5.5).
//
// Drives the complete cycle:
//   STARTUP -> ART -> REVEALING -> STILLNESS_IN -> TRACE_ENTERING -> MIRROR
//   -> TRACE_LEAVING -> STILLNESS_OUT -> ART_RETURNING -> ART
// using the Phase 0 state machine and named constants. Phase 5.5 revision:
// this is now the DEFAULT runtime mounted unconditionally by App.js — no
// query parameter, no sessionStorage, no NODE_ENV check — in every
// environment including production. (?aura001=art remains a dev-only
// shortcut straight to a bare ArtState preview, bypassing this component
// entirely; that's unrelated to this file mounting.)
//
// Phase 5.5 — Cold Start: STARTUP is the true initial state (see
// AURA001_DEFAULT_STATE in states.js), matching the real boot sequence
// POWER/APPLICATION START -> STARTUP -> ART. It advances to ART
// automatically after STARTUP_MIN_MS — no click, no visitor interaction,
// no network/API dependency of any kind (see StartupState.js). Opening the
// app root now plays the complete cold start on its own: STARTUP -> ART ->
// Reveal -> Stillness -> Trace -> Mirror -> Return -> ART, all from one
// page load, with no dev trigger needed at all.
//
// Interaction (Phase 5): the SAME click-anywhere affordance drives both
// directions — clicking while ART starts the entry sequence, clicking
// while MIRROR starts The Return. Any other state (mid-transition) is a
// no-op. This is deliberately the smallest possible trigger for Return: no
// new control, no visible affordance, reusing the exact convention already
// established for entry. Click is a development-era stand-in for the real
// installation's eventual sensor/gesture/voice trigger — not itself part
// of the approved interaction design.
//
// State machine choice, as asked to explain: TRACE_LEAVING is used as ONE
// global state for the entire Return withdrawal. Final breath, Trace
// retraction, wordmark hold, and wordmark fade are NOT separate global
// states — they're internal to AuraTrace itself (see its file header),
// which only calls handleTraceLeavingComplete() once all four finish.
// This keeps the Phase 0 global enum exactly as already defined (no
// expansion needed) while each internal step still gets its own timing
// and CSS treatment where it actually lives. Information recession (this
// file's own responsibility, driving MirrorState) happens BEFORE
// AuraTrace is told to start its internal sequence at all — tracePhase
// stays 'breathing' (not 'leaving') until the info cascade finishes, so
// the two never run concurrently, matching the spec's sequential steps.
//
// Layering, ownership pattern: MirrorSurfacePlaceholder always sits
// underneath everything. ArtState sits above it during ART/REVEALING
// (fading out) and again during ART_RETURNING/ART (fading in) — see
// showArtLayer/artOpacity below — and is genuinely unmounted the rest of
// the time, including STILLNESS_OUT (same DOM-purity approach already
// used for STILLNESS_IN, not relaxed for the second stillness). AuraTrace
// mounts across TRACE_ENTERING/MIRROR/TRACE_LEAVING and owns its entering
// and leaving choreography internally. MirrorState mounts from MIRROR
// through the information-recession portion of TRACE_LEAVING only.
//
// Transition lock: entry and Return each guard on the CURRENT state (ART
// for entry, MIRROR for Return) before doing anything, so a repeated
// trigger during any transitional state is a no-op — one movement always
// completes before another state-changing intention can occur.

export default function RevealSequence() {
  const [state, setState] = useState(AURA001_DEFAULT_STATE);
  const stateRef = useRef(state);
  stateRef.current = state;

  const [showMirrorInfo, setShowMirrorInfo] = useState(false);
  const [infoReceding, setInfoReceding] = useState(false);
  const [traceLeavingActive, setTraceLeavingActive] = useState(false);

  const timersRef = useRef([]);
  const addTimer = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  // Cold Start: STARTUP -> ART happens automatically, once, on mount — not
  // in response to a click. Runs unconditionally since STARTUP is only ever
  // the initial state (see AURA001_DEFAULT_STATE).
  useEffect(() => {
    addTimer(() => setState(AURA001_STATES.ART), STARTUP_MIN_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerEnter = useCallback(() => {
    if (stateRef.current !== AURA001_STATES.ART) return; // transition lock

    setState(AURA001_STATES.REVEALING);

    addTimer(() => {
      setState(AURA001_STATES.STILLNESS_IN);

      addTimer(() => {
        setState(AURA001_STATES.TRACE_ENTERING);

        // Total entering duration = wordmark fade, then the trace travels —
        // matches AuraTrace's own internal CSS timing.
        addTimer(() => {
          setState(AURA001_STATES.MIRROR);
          setShowMirrorInfo(true);
        }, WORDMARK_FADE_MS + TRACE_ENTER_MS);
      }, STILLNESS_IN_MS);
    }, REVEAL_MS);
  }, [addTimer]);

  // The Return, Step 1: information recedes with a slight cascade before
  // anything else happens. traceLeavingActive stays false (AuraTrace keeps
  // breathing normally) until this finishes.
  const triggerReturn = useCallback(() => {
    if (stateRef.current !== AURA001_STATES.MIRROR) return; // transition lock

    setState(AURA001_STATES.TRACE_LEAVING);
    setInfoReceding(true);

    // Last block to fade is delayed by 2 cascade steps; total duration is
    // that delay plus its own fade time.
    const totalInfoRecedeMs = INFO_RECEDE_MS + 2 * INFO_CASCADE_OFFSET_MS;
    addTimer(() => {
      setShowMirrorInfo(false);
      setInfoReceding(false);
      setTraceLeavingActive(true); // now AuraTrace starts final-breath -> withdrawal -> wordmark fade
    }, totalInfoRecedeMs);
  }, [addTimer]);

  // Called by AuraTrace once its own 4-step leaving sequence (final
  // breath -> trace withdrawal -> wordmark hold -> wordmark fade)
  // finishes — see AuraTrace.js file header.
  const handleTraceLeavingComplete = useCallback(() => {
    setTraceLeavingActive(false); // reset so a future cycle waits for info-recede again
    setState(AURA001_STATES.STILLNESS_OUT);

    addTimer(() => {
      setState(AURA001_STATES.ART_RETURNING);

      addTimer(() => {
        setState(AURA001_STATES.ART);
      }, ART_RETURN_MS);
    }, STILLNESS_OUT_MS);
  }, [addTimer]);

  const handleClick = useCallback(() => {
    if (stateRef.current === AURA001_STATES.ART) triggerEnter();
    else if (stateRef.current === AURA001_STATES.MIRROR) triggerReturn();
    // Any other state: a transition is already in progress — no-op.
  }, [triggerEnter, triggerReturn]);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  const inStartup = state === AURA001_STATES.STARTUP;
  const inArt = state === AURA001_STATES.ART;
  const inArtReturning = state === AURA001_STATES.ART_RETURNING;
  const showArtLayer = inStartup || inArt || state === AURA001_STATES.REVEALING || inArtReturning;
  const artOpacity = inArt || inArtReturning ? 1 : 0;

  const showTrace =
    state === AURA001_STATES.TRACE_ENTERING ||
    state === AURA001_STATES.MIRROR ||
    state === AURA001_STATES.TRACE_LEAVING;
  const tracePhase =
    state === AURA001_STATES.TRACE_ENTERING ? 'entering' :
    (state === AURA001_STATES.TRACE_LEAVING && traceLeavingActive) ? 'leaving' :
    'breathing';

  return (
    // Click anywhere to invoke handleClick() — development-only, drives
    // both entry and Return depending on current state. Renders no
    // visible affordance, so it introduces no UI/label/control of its own.
    <div onClick={handleClick} style={{ position: 'fixed', inset: 0 }}>
      <MirrorSurfacePlaceholder />

      {/* ART / REVEALING: existing opacity-transition fade-out, unchanged
          from Phase 2. ART_RETURNING and STARTUP: a fresh mount using the
          same CSS keyframe (RevealSequence.css) rather than a transition,
          since ArtState is genuinely absent beforehand in both cases — a
          transition can't animate a property change on an element that
          doesn't exist yet. STARTUP additionally delays that fade-in via
          --art-return-delay-ms so it lands on STARTUP's final crossfade
          window, in sync with StartupState's own wordmark fade-out below. */}
      {showArtLayer && (
        inArtReturning ? (
          <div
            className="art-return-fade-in"
            style={{ position: 'fixed', inset: 0, pointerEvents: 'none', '--art-return-ms': `${ART_RETURN_MS}ms` }}
          >
            <ArtState />
          </div>
        ) : inStartup ? (
          <div
            className="art-return-fade-in"
            style={{
              position: 'fixed', inset: 0, pointerEvents: 'none',
              '--art-return-ms': `${STARTUP_TO_ART_MS}ms`,
              '--art-return-delay-ms': `${STARTUP_MIN_MS - STARTUP_TO_ART_MS}ms`,
            }}
          >
            <ArtState />
          </div>
        ) : (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              opacity: artOpacity,
              transition: `opacity ${REVEAL_MS}ms ease`,
              pointerEvents: 'none',
            }}
          >
            <ArtState />
          </div>
        )
      )}

      {inStartup && <StartupState />}

      {showTrace && <AuraTrace phase={tracePhase} onLeavingComplete={handleTraceLeavingComplete} />}
      {showMirrorInfo && <MirrorState receding={infoReceding} />}
    </div>
  );
}
