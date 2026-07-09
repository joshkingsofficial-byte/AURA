# AURA — Capability Bible

Each capability is defined before it is built.
This document is the contract between intention and implementation.

**Format for each capability:**

- **Purpose** — why it exists
- **Inputs** — what triggers it
- **Outputs** — what it produces
- **Memory** — what it retains between turns
- **Future Extensions** — where it could grow
- **Definition of Done** — the experience that proves it works

---

---

# Capability 1 — Contextual Vision

**Status:** Building — Phase A

---

## Purpose

To help the user understand, evaluate, and think about the physical world
they are sharing with the mirror — naturally, conversationally, without
opening an app or changing modes.

AURA does not identify objects.
She joins the conversation you are already having about them.

---

## Inputs

- Camera (still capture — not always-on)
- Voice (the question that triggers the capture and every follow-up)
- Images held up or placed in front of the mirror

---

## Outputs

- Conversational response — opinion, identification, advice, translation
- One to two sentences unless more is specifically asked for
- No labels. No lists. No technical output.

**Examples of correct output:**

> "The leaves look a little dry — I'd water it in the next day or two."

> "That jacket works. I'd go with darker shoes to ground it."

> "That's Starry Night — Van Gogh painted it in 1889 while he was at the asylum in Saint-Rémy. One of the most recognised paintings in the world."

> "That says 'cryptography' in Japanese — the study of securing information."

**Examples of incorrect output:**

> "I can see a plant with green leaves."

> "Object detected: Jacket (blue). Confidence: 94%."

> "Here is a step-by-step recipe I found online..."

---

## Memory

- The current image is retained in context for the full conversation turn.
- Follow-up questions ("would black shoes work better?", "what about this one?") refer to the same image unless a new one is presented.
- Context resets when the conversation ends or AURA returns to resting state.

---

## Boundaries

- AURA does not volunteer vision. She only looks when asked.
- She does not describe everything she sees — only what the question is about.
- She does not display web pages, search results, or external content.
- If she cannot see clearly, she says so once, briefly.

---

## Future Extensions

- Outfit comparison ("which of these?")
- Nutrition — reading food labels or meals
- Handwriting / document reading
- Plant health over time ("I remember this plant looked better last week")
- Museum mode — recognising and speaking about artworks as a curator, not a database
- Physical awareness — detecting that someone has walked up holding something, before they speak

---

## Definition of Done

A visitor picks up an object — a plant, a jacket, a book, a painting.

They ask AURA about it naturally.

She responds in a way that feels like asking another person's opinion.

The visitor does not think about cameras, models, or object detection.

They simply feel understood.

---

---

# Capability 2 — Living Cards

**Status:** Planned — Phase B

---

## Purpose

To surface information at the moment it becomes relevant —
and remove it the moment it no longer is.

AURA does not show data. She curates it.

A living card is not a widget. It is AURA's editorial decision
that something is worth your peripheral attention right now.

---

## Inputs

- Music state (playing / stopped)
- Calendar events (timing relative to now)
- Email — importance, sender, subject
- Reminders
- Time of day

---

## Outputs

- A single card. One idea. No counts. No lists.
- Fades in over 800ms. Never pops.
- Fades out when no longer relevant. Never dismissed by the user.

---

## Memory

- Cards track their own relevance window.
- Music card: exists while music plays.
- Meeting card: appears 20 minutes before, disappears after it starts.
- Email card: appears for one important email, not a count.

---

## Definition of Done

Someone walks past AURA while music plays.

They glance at the mirror.

The music card is there — artist, track, a small thumbnail.

They don't notice it appeared. They don't need to dismiss it.

When the music stops, it is gone.

They do not remember seeing a widget. They remember the moment.

---

---

# Capability 3 — Conversation Memory

**Status:** Planned — Phase C

---

## Purpose

To make multi-turn conversations feel continuous and human.

Not because AURA stores facts.
Because she holds context long enough that
you never have to repeat yourself within a conversation.

---

## Inputs

- Everything said in the current session
- The current visual context (if Vision is active)
- User profile (persisted facts from previous sessions)

---

## Outputs

- Responses that reference earlier parts of the conversation naturally
- No need to re-state what was just shown or said

---

## Definition of Done

You show AURA a jacket.

Thirty seconds later you ask: "Would black shoes work better?"

She answers without asking "better than what?"

She already knows.

---

---

*This document is updated before each new capability is built.*
*A capability that cannot be defined here is not ready to be built.*
