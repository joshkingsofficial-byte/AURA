import os
import json
import datetime as dt

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "..", "data")
PROFILE_PATH = os.path.join(DATA_DIR, "user_profile.json")


def _load():
    os.makedirs(DATA_DIR, exist_ok=True)
    try:
        with open(PROFILE_PATH) as f:
            return json.load(f)
    except FileNotFoundError:
        return {"facts": []}


def _save(profile):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(PROFILE_PATH, "w") as f:
        json.dump(profile, f, indent=2)


def add_fact(text: str) -> dict:
    profile = _load()
    entry = {"text": text, "saved_at": dt.datetime.now().isoformat()}
    profile["facts"].append(entry)
    _save(profile)
    return entry


def get_context_summary() -> str:
    profile = _load()
    facts = profile.get("facts", [])
    if not facts:
        return ""
    lines = ["Things you know and remember about the user:"]
    for f in facts[-30:]:
        lines.append(f"- {f['text']}")
    return "\n".join(lines)
