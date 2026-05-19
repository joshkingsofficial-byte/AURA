"""
Apple Music control via AppleScript (macOS only).
All functions are synchronous — wrap with asyncio.to_thread() from async callers.
"""

import subprocess
import tempfile
import base64
import os
from typing import Optional, Dict, Any


def _run(script: str) -> str:
    """Run a single-line AppleScript snippet via -e; return stdout stripped."""
    try:
        r = subprocess.run(
            ["osascript", "-e", script],
            capture_output=True, text=True, timeout=5
        )
        if r.returncode != 0 and r.stderr.strip():
            print(f"[AppleMusic] osascript stderr: {r.stderr.strip()}")
        return r.stdout.strip()
    except Exception as e:
        print(f"[AppleMusic] osascript error: {e}")
        return ""


def _run_file(script: str) -> str:
    """Write script to a temp file and run with osascript — avoids -e parsing issues."""
    tmp = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".applescript", delete=False
        ) as f:
            f.write(script)
            tmp = f.name
        r = subprocess.run(
            ["osascript", tmp],
            capture_output=True, text=True, timeout=10
        )
        if r.returncode != 0 and r.stderr.strip():
            print(f"[AppleMusic] osascript stderr: {r.stderr.strip()}")
        return r.stdout.strip()
    except Exception as e:
        print(f"[AppleMusic] osascript error: {e}")
        return ""
    finally:
        if tmp and os.path.exists(tmp):
            try:
                os.unlink(tmp)
            except Exception:
                pass


# ── Playback controls ────────────────────────────────────────────────────────

def play():
    _run('tell application "Music" to play')

def pause():
    _run('tell application "Music" to pause')

def next_track():
    _run('tell application "Music" to next track')

def previous_track():
    _run('tell application "Music" to previous track')

def toggle_play_pause():
    _run('tell application "Music" to playpause')

def set_volume(level: int):
    """Set playback volume 0–100."""
    level = max(0, min(100, int(level)))
    _run(f'tell application "Music" to set sound volume to {level}')

def get_volume() -> int:
    raw = _run('tell application "Music" to get sound volume')
    try:
        return int(float(raw))
    except ValueError:
        return 50


# ── Track info ────────────────────────────────────────────────────────────────

def get_current_track() -> Optional[Dict[str, Any]]:
    """Return dict with title/artist/album/is_playing/volume, or None if stopped."""
    script = """\
tell application "Music"
    try
        set ps to player state
        if ps is playing or ps is paused then
            set t to name of current track
            set a to artist of current track
            set al to album of current track
            set vol to sound volume
            if ps is playing then
                return t & "|||" & a & "|||" & al & "|||" & (vol as string) & "|||playing"
            end if
            return t & "|||" & a & "|||" & al & "|||" & (vol as string) & "|||paused"
        end if
        return ""
    on error
        return ""
    end try
end tell
"""
    raw = _run_file(script)
    if not raw:
        return None
    parts = raw.split("|||")
    if len(parts) < 5:
        return None
    return {
        "title":      parts[0],
        "artist":     parts[1],
        "album":      parts[2],
        "volume":     int(float(parts[3])) if parts[3] else 50,
        "is_playing": parts[4].strip().lower() == "playing",
    }


def get_album_art_b64() -> Optional[str]:
    """
    Extract current track artwork as a base64 JPEG string.
    Writes to a temp file via AppleScript, reads back in Python.
    Returns None if artwork is unavailable or extraction fails.
    """
    art_tmp = "/tmp/aura_music_art.jpg"
    script = f"""\
tell application "Music"
    try
        set ps to player state
        if ps is playing or ps is paused then
            set artData to raw data of artwork 1 of current track
            set f to open for access POSIX file "{art_tmp}" with write permission
            set eof of f to 0
            write artData to f
            close access f
            return "ok"
        end if
        return ""
    on error
        return ""
    end try
end tell
"""
    result = _run_file(script)
    if result == "ok" and os.path.exists(art_tmp):
        try:
            with open(art_tmp, "rb") as fh:
                data = fh.read()
            os.unlink(art_tmp)
            if data:
                return base64.b64encode(data).decode("utf-8")
        except Exception as e:
            print(f"[AppleMusic] Art read error: {e}")
    return None
