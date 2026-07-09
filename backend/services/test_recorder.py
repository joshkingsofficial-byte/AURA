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
