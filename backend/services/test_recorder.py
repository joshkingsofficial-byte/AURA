"""AURA Test Recorder — logs interactions to JSONL for later review.

Invisible to the normal UI and never affects AURA's behavior: every write
is best-effort and swallows its own errors so a logging failure can never
surface as an AURA failure.
"""

import os
import re
import json
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG_DIR = os.path.join(BASE_DIR, "data", "test_logs")

_SECRET_KEY_PATTERN = re.compile(r"key|token|secret|password|authorization", re.IGNORECASE)


def _redact(value):
    if isinstance(value, dict):
        return {
            k: ("[redacted]" if _SECRET_KEY_PATTERN.search(k) else _redact(v))
            for k, v in value.items()
        }
    if isinstance(value, list):
        return [_redact(v) for v in value]
    return value


def _today_log_path():
    date_str = datetime.now().strftime("%Y-%m-%d")
    return os.path.join(LOG_DIR, f"aura_test_{date_str}.jsonl")


def log_interaction(entry: dict):
    """Append one redacted, timestamped JSON line to today's log file."""
    try:
        os.makedirs(LOG_DIR, exist_ok=True)
        safe_entry = _redact(entry)
        safe_entry["timestamp"] = datetime.now(timezone.utc).isoformat()
        with open(_today_log_path(), "a") as f:
            f.write(json.dumps(safe_entry) + "\n")
    except Exception as e:
        print(f"[TestRecorder] Could not write log: {e}")


def _today_entries():
    path = _today_log_path()
    if not os.path.isfile(path):
        return []
    entries = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entries.append(json.loads(line))
            except Exception:
                continue
    return entries


_MUSIC_TOOLS = {"music_control", "music_search"}
_CALENDAR_TOOLS = {"calendar_read", "calendar_create", "calendar_delete"}


def log_session_summary(session_id: str, started_at_ms=None):
    """Tally this session's entries from today's log and append a session_summary."""
    if not session_id:
        return
    try:
        entries = [e for e in _today_entries() if e.get("session_id") == session_id]
        interactions = [e for e in entries if e.get("event_type") in ("tool_call", "response", "vision")]

        duration_seconds = None
        if started_at_ms:
            duration_seconds = round(datetime.now(timezone.utc).timestamp() - (started_at_ms / 1000), 1)

        log_interaction({
            "event_type": "session_summary",
            "session_id": session_id,
            "session_summary": {
                "duration_seconds": duration_seconds,
                "interactions": len(interactions),
                "errors": sum(1 for e in entries if e.get("error")),
                "vision_requests": sum(1 for e in entries if e.get("event_type") == "vision"),
                "music_requests": sum(1 for e in entries if e.get("tool_name") in _MUSIC_TOOLS),
                "calendar_requests": sum(1 for e in entries if e.get("tool_name") in _CALENDAR_TOOLS),
            },
        })
    except Exception as e:
        print(f"[TestRecorder] Could not log session summary: {e}")


def get_latest_log():
    """Return (filename, entries) for the most recent log file, or (None, [])."""
    try:
        if not os.path.isdir(LOG_DIR):
            return None, []
        files = sorted(f for f in os.listdir(LOG_DIR) if f.startswith("aura_test_") and f.endswith(".jsonl"))
        if not files:
            return None, []
        latest = files[-1]
        entries = []
        with open(os.path.join(LOG_DIR, latest)) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entries.append(json.loads(line))
                except Exception:
                    continue
        return latest, entries
    except Exception as e:
        print(f"[TestRecorder] Could not read latest log: {e}")
        return None, []
