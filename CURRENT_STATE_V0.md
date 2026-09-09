# AURA — Current State Snapshot (V0, "Full-Featured Prototype")

**Date:** 2026-09-10
**Purpose of this document:** A frozen record of what AURA was before the pivot to a simplified, gallery-first Version 1 hardware product. This is the baseline the V1 simplification branches off from — if V1 strips something out, it lived here first.

---

## What AURA is, as of this snapshot

A desktop software prototype (Python backend + React frontend) of a wall-mounted, voice-and-gesture-controlled smart mirror/display assistant. Runs today on a Mac; the intended hardware target is a Raspberry Pi 5 driving a Dell S2425HSM monitor (no built-in webcam — vision/camera hardware still to be sourced).

Wake word: "computer" (Porcupine model `Hey-Aura_en_mac_v3_0_0`). Voice is real-time, two-way (OpenAI Realtime API, model `gpt-realtime-mini`), relayed through the Python backend so the API key never reaches the browser.

Three foundational design documents govern behavior and are **not** duplicated here — refer to them directly:
- `PRESENCE_BIBLE.md` — behavioral/philosophical design (orb states, idle screen, living cards)
- `CAPABILITY_BIBLE.md` — per-capability contracts (Vision, Living Cards, Conversation Memory)
- `QA_TRACKER.md` — issue lifecycle and current open items

---

## Architecture

- **Backend** (`backend/`, Python, `main.py` entrypoint):
  - `server/http_server.py` — REST endpoints + `/realtime-ws` WebSocket relay to OpenAI Realtime API
  - `server/ws_server.py` — general WebSocket server for frontend/backend messaging
  - `wake/wake_word.py` — Porcupine wake-word detection
  - `stt/whisper_stt.py`, `tts/tts_handler.py` — speech in/out (secondary to Realtime voice path)
  - `vision/vision_engine.py`, `vision/gpt4_vision.py` — Contextual Vision capability (GPT-4 Vision)
  - `camera/camera_manager.py`, `camera/gesture_detector.py`, `camera/gesture_bridge.py` — camera + gesture input
  - `ai/gpt_handler.py`, `ai/conversation_context.py` — text/chat completion path, conversation context
  - `services/` — `memory_store.py`, `user_profile.py` (persistent memory/profile), `music_spotify.py`, `spotify_poller.py`, `smart_home.py` + `tapo_light.py` (Tapo smart bulbs), `outlook_service.py` (calendar/email), `test_recorder.py` (session transcript recorder)
  - `music/apple_music_script.py` — AppleScript-driven Apple Music control

- **Frontend** (`frontend/aura-ui/`, React):
  - `hooks/useRealtimeVoice.js` — owns the Realtime WebSocket connection, tool-calling, and all function-call handling (calendar, tasks, email, memory, etc.)
  - `hooks/useAuraSocket.js` — general backend socket
  - `screens/IdleScreen.js` — resting/ambient state; `screens/HomePage.js`, `screens/AppView.js` — app grid + individual app views
  - `apps/` — 16 self-contained app modules: Calendar, Email, Lights, Memory, Music, News, Notes, Photos, Recipe, Settings, Spotify, Tasks, Timer, Vision, Weather, YouTube

## Integrations currently wired up

Spotify, Apple Music, YouTube, Tapo smart lights, Outlook (calendar + email), OpenAI (Realtime voice + GPT-4 Vision + chat), Porcupine wake word.

## Known open issues (see `QA_TRACKER.md` for full detail)

- **H3 (open):** No consistent back button on 8 of 14 apps — needs a Presence design pass before implementation.
- Two files with uncommitted local changes at time of this snapshot: `backend/services/test_recorder.py`, `frontend/aura-ui/src/hooks/useRealtimeVoice.js`.

## Auth/config notes

- `OPENAI_API_KEY` lives in `backend/.env` (single source of truth — do not export it in shell profiles; `load_dotenv()` will not override an existing shell-level value).
- Other secrets in `backend/.env`: Spotify client ID/secret, YouTube API key, Tapo credentials, Microsoft client ID (Outlook).

---

## Why this snapshot exists

The full feature set above (vision, gesture, multi-app grid, smart home, email/calendar) is being deliberately **not** carried into Version 1. V1 is a hardware-first pivot toward a simple gallery-style art display (inspiration: Samsung Frame TV, LG gallery mode) — showing curated/famous art plus commissioned work from digital artist collaborators, with only the simplest supporting functions (music, date/time). Vision AI, gesture control, smart home, and the full app grid are deferred to later versions (V2+) once the simpler concept is validated with gallery audiences.

This file marks the line: everything above shipped before that decision. `AURA_v0_full_backup/` (sibling folder) and the git tag `v0-full-featured` both point back to this exact state.
