# AURA — QA Tracker

A living history of quality, not a static backlog.

Every issue moves through a lifecycle:

```text
Reported → Verified → Fixed → Re-tested → Closed
```

An issue that is no longer valid (assumptions changed, API understanding
evolved) is **Closed**, not silently deleted and not left open forever.

---

## v0.5

| ID | Status | Notes |
|----|--------|-------|
| H1 | ✅ Fixed | Broken Spotify/Timer tiles removed from app grid |
| H2 | ✅ Fixed | False success messages in executeTool catch blocks now report actual error |
| H3 | 🟡 Open | No back button on 8/14 apps — needs a Presence session to design a consistent, non-floating way out before implementing |
| M1 | ✅ Fixed | ListeningOrb double mic stream — now reads shared micVolumeRef instead of re-calling getUserMedia |
| M2 | ✅ Fixed | Tapo connection cached; 180ms debounce on brightness/color_temp slider events |
| M3 | ✅ Fixed | Weather app now refreshes every 30 min instead of only on mount (WeatherApp.js) |
| M4 | ✅ Fixed | _announced_event_ids persisted to disk across restarts (backend/main.py) |
| M5 | ✅ Fixed | Email sender shows display name, not raw address (outlook_service.py) |
| M6 | ✅ Fixed | Calendar events with no subject fall back to "Untitled" instead of empty string |
| M7 | ✅ Closed — QA assumption outdated | `type: 'realtime'` in the session.update body is required by gpt-realtime-mini, not a bug. The original note predated confirming which 4 fields (type/instructions/tools/tool_choice) the API actually accepts. No fix needed. |

---

## Design decisions currently blocking QA items

- **H3** — back navigation needs a Presence session (visual language for a
  consistent, always-there way out) before any Capability work implements it.

---

*Closed items stay in this table with their resolution reasoning — history matters more than a clean list.*
