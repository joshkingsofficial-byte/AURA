# backend/services/memory_store.py
import os
import json
import uuid
import datetime as dt

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "..", "data")
os.makedirs(DATA_DIR, exist_ok=True)

def _path(name):
    return os.path.join(DATA_DIR, f"{name}.json")

def _load(name, default):
    try:
        with open(_path(name), "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return default

def _save(name, data):
    with open(_path(name), "w") as f:
        json.dump(data, f, indent=2)

def add_note(text):
    notes = _load("notes", [])
    note = {
        "id": str(uuid.uuid4()),
        "text": text,
        "created_at": dt.datetime.now().isoformat()
    }
    notes.append(note)
    _save("notes", notes)
    return note

def list_notes():
    return _load("notes", [])

def add_reminder(text, time_iso):
    reminders = _load("reminders", [])
    rem = {
        "id": str(uuid.uuid4()),
        "text": text,
        "time": time_iso,
        "status": "scheduled"
    }
    reminders.append(rem)
    _save("reminders", reminders)
    return rem

def list_reminders():
    return _load("reminders", [])

def check_due_reminders():
    reminders = _load("reminders", [])
    now = dt.datetime.now().isoformat()

    due = []
    for r in reminders:
        if r["status"] == "scheduled" and r["time"] <= now:
            r["status"] = "done"
            due.append(r)

    _save("reminders", reminders)
    return due

def add_alarm(label, time_str, repeat="once"):
    alarms = _load("alarms", [])
    alarm = {
        "id": str(uuid.uuid4()),
        "label": label,
        "time": time_str,
        "repeat": repeat,
        "status": "active"
    }
    alarms.append(alarm)
    _save("alarms", alarms)
    return alarm

def list_alarms():
    return _load("alarms", [])

def handle_memory_action(action):
    t = action.get("type")
    if t == "add_note":
        return add_note(action["text"])
    if t == "add_reminder":
        return add_reminder(action["text"], action["time"])
    if t == "add_alarm":
        return add_alarm(action["label"], action["time"], action.get("repeat", "once"))
    print("[Memory] Unknown action:", action)
    return None
