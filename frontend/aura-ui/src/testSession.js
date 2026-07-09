// Shared test-session identity for the AURA Test Recorder.
// One session spans a single voice session (startSession → endSession);
// vision queries happening within it share the same session_id so a
// whole test session can be replayed chronologically from the JSONL logs.

let sessionId = null;
let interactionCounter = 0;
let sessionStartedAt = null;

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function startTestSession() {
  sessionId = makeId();
  interactionCounter = 0;
  sessionStartedAt = Date.now();
  return sessionId;
}

export function endTestSession() {
  const ended = { sessionId, startedAt: sessionStartedAt };
  sessionId = null;
  sessionStartedAt = null;
  return ended;
}

export function getSessionId() {
  return sessionId;
}

export function nextInteractionId() {
  interactionCounter += 1;
  return interactionCounter;
}
