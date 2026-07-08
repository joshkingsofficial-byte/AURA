#!/usr/bin/env python3
"""
AURA Backend Services - WebSocket relay for music, lights, YouTube, and vision.
Voice pipeline handled entirely by the frontend via OpenAI Realtime API (WebRTC).
"""

import os
import sys
import asyncio
import json
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from server.ws_server import WebSocketServer
from server.http_server import start_http_server, stop_http_server
from services.music_spotify import SpotifyMusicClient
from services.spotify_poller import SpotifyPoller
from services.tapo_light import turn_on as light_on, turn_off as light_off, set_brightness
from camera.camera_manager import CameraManager

# Globals
ws_server: WebSocketServer = None
reminder_task = None
_announced_event_ids: set = set()  # prevents re-announcing the same event
spotify_client: SpotifyMusicClient = None
spotify_poller: SpotifyPoller = None
camera_manager: CameraManager = None
main_loop: asyncio.AbstractEventLoop = None
apple_music_poll_task = None

# Lightweight in-memory light state for relative adjustments
current_light_state: dict = {
    "on": None,
    "hue": None,
    "sat": None,
    "color_temp": None,
    "brightness": None,
    "mood": None,
}

LIGHT_MODES = {
    "hope":    {"brightness": 65,  "hue": 35,   "sat": 75},
    "hawk":    {"brightness": 100, "color_temp": 6000},
    "focus":   {"brightness": 85,  "color_temp": 5000},
    "relax":   {"brightness": 40,  "color_temp": 2700},
    "sleep":   {"brightness": 8,   "hue": 10,   "sat": 60},
    "night":   {"brightness": 5,   "color_temp": 2200},
    "morning": {"brightness": 70,  "color_temp": 4200},
    "chill":   {"brightness": 35,  "hue": 220,  "sat": 55},
    "vibe":    {"brightness": 50,  "hue": 280,  "sat": 70},
    "study":   {"brightness": 90,  "color_temp": 5000},
    "dim":     {"brightness": 20,  "color_temp": 2700},
    "bright":  {"brightness": 100, "color_temp": 5500},
    "reading": {"brightness": 80,  "color_temp": 3500},
    "sunset":  {"brightness": 55,  "hue": 25,   "sat": 85},
    "romance": {"brightness": 30,  "hue": 350,  "sat": 70},
}

# ─── Tapo helpers ─────────────────────────────────────────────────────────────

_tapo_device_cache = None
_tapo_device_lock = None

async def _get_tapo_device():
    """Return a cached Tapo device connection, reconnecting only when needed."""
    global _tapo_device_cache, _tapo_device_lock
    from tapo import ApiClient
    if _tapo_device_lock is None:
        _tapo_device_lock = asyncio.Lock()
    async with _tapo_device_lock:
        if _tapo_device_cache is not None:
            return _tapo_device_cache
        client = ApiClient(os.getenv("TAPO_EMAIL"), os.getenv("TAPO_PASSWORD"))
        _tapo_device_cache = await client.l530(os.getenv("TAPO_IP"))
        return _tapo_device_cache


def _invalidate_tapo_cache():
    global _tapo_device_cache
    _tapo_device_cache = None


# Debounce state for brightness/temp slider commands
_last_light_cmd_time: float = 0.0
_light_cmd_lock = None


async def _apply_light_preset(mode_name: str) -> str:
    """Apply a named preset to the Tapo bulb. Returns spoken reply."""
    global current_light_state
    preset = LIGHT_MODES.get(mode_name)
    if not preset:
        return ""
    try:
        dev = await _get_tapo_device()
        await dev.on()
        if "color_temp" in preset:
            await dev.set_color_temperature(preset["color_temp"])
            current_light_state.update({"hue": None, "sat": None, "color_temp": preset["color_temp"]})
        else:
            await dev.set_hue_saturation(preset["hue"], preset["sat"])
            current_light_state.update({"hue": preset["hue"], "sat": preset["sat"], "color_temp": None})
        await dev.set_brightness(preset["brightness"])
        current_light_state.update({"on": True, "brightness": preset["brightness"], "mood": mode_name})
        print(f"[Tapo] Preset '{mode_name}' applied: {preset}")
        return f"{mode_name.capitalize()} mode."
    except Exception as e:
        print(f"[Tapo] Preset error: {e}")
        _invalidate_tapo_cache()
        return "Lights are offline."




# ─── WebSocket message handlers ───────────────────────────────────────────────

async def handle_vision_query(msg: dict):
    """Handle vision_query WebSocket messages (image captured by frontend)."""
    global ws_server

    query    = msg.get("query", "What is this? Describe what you see in detail.")
    image_b64 = msg.get("image")

    print(f"[Vision] Query: '{query}' | image={'yes' if image_b64 else 'no'}")
    await ws_server.broadcast({"type": "vision_analyzing"})

    try:
        from vision.vision_engine import analyze_b64, analyze

        if image_b64:
            result = await analyze_b64(image_b64, query)
        else:
            frame = await asyncio.to_thread(camera_manager.capture_frame)
            if frame is None:
                result = "I couldn't access the camera. Make sure the camera is connected."
            else:
                result = await analyze(frame, query)

        print(f"[Vision] Result: {result[:80]}...")
    except Exception as e:
        print(f"[Vision] Error: {e}")
        result = f"Vision analysis error: {e}"

    await ws_server.broadcast({"type": "vision_result", "text": result, "query": query})
    await ws_server.broadcast({"type": "done"})


async def handle_apple_music_control(msg: dict):
    """Handle apple_music_control WebSocket messages from the UI and voice tools."""
    action = msg.get("action")
    value  = msg.get("value")
    print(f"[AppleMusic] action={action} value={value}")
    try:
        from music.apple_music_script import (
            play as am_play, pause as am_pause,
            next_track as am_next, previous_track as am_prev,
            toggle_play_pause, set_volume as am_vol, get_volume as am_getvol,
            search_and_play as am_search,
        )
        if action == "play":
            await asyncio.to_thread(am_play)
        elif action == "pause":
            await asyncio.to_thread(am_pause)
        elif action == "toggle":
            await asyncio.to_thread(toggle_play_pause)
        elif action == "next":
            await asyncio.to_thread(am_next)
        elif action == "previous":
            await asyncio.to_thread(am_prev)
        elif action == "volume" and value is not None:
            await asyncio.to_thread(am_vol, int(value))
        elif action == "volup":
            cur = await asyncio.to_thread(am_getvol)
            await asyncio.to_thread(am_vol, min(100, cur + 15))
        elif action == "voldn":
            cur = await asyncio.to_thread(am_getvol)
            await asyncio.to_thread(am_vol, max(0, cur - 15))
        elif action == "search" and value:
            await asyncio.to_thread(am_search, value)
    except Exception as e:
        print(f"[AppleMusic] Control error: {e}")


async def apple_music_poll_loop():
    """Poll Apple Music every 3 s; broadcast music_update on track/state change."""
    global ws_server
    from music.apple_music_script import get_current_track as am_track, get_album_art_b64

    last_id      = None
    last_playing = None
    last_art     = None

    while True:
        try:
            track = await asyncio.to_thread(am_track)
            if track:
                tid     = f"{track['title']}|{track['artist']}"
                changed = tid != last_id or track["is_playing"] != last_playing
                if changed:
                    if tid != last_id:
                        last_art = await asyncio.to_thread(get_album_art_b64)
                        last_id  = tid
                    last_playing = track["is_playing"]
                    await ws_server.broadcast({
                        "type": "music_update",
                        "track": {
                            "id":          last_id,
                            "name":        track["title"],
                            "artists":     track["artist"],
                            "album":       track["album"],
                            "album_image": f"data:image/jpeg;base64,{last_art}" if last_art else None,
                            "is_playing":  track["is_playing"],
                        },
                    })
            elif last_id is not None:
                last_id = last_playing = last_art = None
                await ws_server.broadcast({"type": "music_update", "track": None})
        except Exception as e:
            print(f"[AppleMusic] Poll error: {e}")
        await asyncio.sleep(3)


async def handle_light_control(msg: dict):
    """Handle light_control WebSocket messages from the UI."""
    import time
    global _last_light_cmd_time, _light_cmd_lock
    if _light_cmd_lock is None:
        _light_cmd_lock = asyncio.Lock()

    action = msg.get("action")
    value  = msg.get("value")

    # Debounce continuous slider events (brightness, color_temp) to max 5/s
    if action in ("brightness", "color_temp"):
        now = time.monotonic()
        if now - _last_light_cmd_time < 0.18:
            return
        _last_light_cmd_time = now

    print(f"[LightControl] action={action} value={value}")

    async with _light_cmd_lock:
        try:
            device = await _get_tapo_device()
            if action == "toggle":
                if value:
                    await device.on()
                    print("[Tapo] UI → Light ON")
                else:
                    await device.off()
                    print("[Tapo] UI → Light OFF")
            elif action == "preset" and value:
                await _apply_light_preset(value)
            elif action == "brightness":
                await device.set_brightness(int(value))
                print(f"[Tapo] UI → Brightness {value}%")
            elif action == "color_temp":
                await device.set_color_temperature(int(value))
                print(f"[Tapo] UI → Color temp {value}K")
            elif action == "color":
                hue = int(value.get("hue", 0))
                sat = int(value.get("saturation", 100))
                await device.set_hue_saturation(hue, sat)
                print(f"[Tapo] UI → Color hue:{hue} sat:{sat}")
            else:
                print(f"[LightControl] Unknown action: {action}")
        except Exception as e:
            print(f"[Tapo] Light control error: {e}")
            _invalidate_tapo_cache()  # force reconnect on next command


async def handle_youtube_message(msg: dict):
    """Handle youtube_search and youtube_control WebSocket messages."""
    global ws_server
    msg_type = msg.get("type")

    if msg_type == "youtube_search":
        query = msg.get("query", "").strip()
        if not query:
            return
        print(f"[YouTube] Search: '{query}'")

        api_key = os.getenv("YOUTUBE_API_KEY")
        if not api_key:
            await ws_server.broadcast({
                "type": "youtube_search_results",
                "results": [],
                "error": "YouTube API key not configured — add YOUTUBE_API_KEY to .env",
            })
            return

        try:
            import urllib.request
            import urllib.parse
            import urllib.error
            import json as _json

            params = urllib.parse.urlencode({
                "part": "snippet",
                "q": query,
                "maxResults": 9,
                "type": "video",
                "key": api_key,
            })
            url = f"https://www.googleapis.com/youtube/v3/search?{params}"

            def _fetch():
                try:
                    with urllib.request.urlopen(url, timeout=10) as r:
                        return _json.loads(r.read())
                except urllib.error.HTTPError as e:
                    body = e.read().decode("utf-8", errors="replace")
                    try:
                        detail = _json.loads(body)["error"]["message"]
                    except Exception:
                        detail = body[:300]
                    raise Exception(f"HTTP {e.code}: {detail}")

            data = await asyncio.to_thread(_fetch)

            results = [
                {
                    "id":        item["id"]["videoId"],
                    "title":     item["snippet"]["title"],
                    "channel":   item["snippet"]["channelTitle"],
                    "thumbnail": item["snippet"]["thumbnails"]["medium"]["url"],
                }
                for item in data.get("items", [])
                if item.get("id", {}).get("videoId")
            ]

            await ws_server.broadcast({"type": "youtube_search_results", "results": results})
            print(f"[YouTube] Returned {len(results)} results for '{query}'")

        except Exception as e:
            print(f"[YouTube] Search error: {e}")
            await ws_server.broadcast({
                "type": "youtube_search_results",
                "results": [],
                "error": f"Search failed: {e}",
            })

    elif msg_type == "youtube_control":
        await ws_server.broadcast(msg)
        print(f"[YouTube] Control forwarded: {msg.get('action')}")


# ─── AURA Awareness ───────────────────────────────────────────────────────────
#
# One background heartbeat that notices the world and decides whether to speak.
# Priority levels:
#   0 = silent (log only)
#   1 = visual only — text appears on screen, no speech
#   2 = soft spoken — chime + voice, only when AURA is not already talking
#   3 = urgent — interrupts regardless (reserved for genuine emergencies)

_NUMBER_WORDS = {
    1: "one", 2: "two", 3: "three", 4: "four", 5: "five",
    6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten",
    11: "eleven", 12: "twelve", 13: "thirteen", 14: "fourteen", 15: "fifteen",
    16: "sixteen", 17: "seventeen", 18: "eighteen", 19: "nineteen", 20: "twenty",
}

def _num_words(n: int) -> str:
    return _NUMBER_WORDS.get(n, str(n))


def _fetch_upcoming_sync():
    try:
        from services.outlook_service import get_upcoming_events
        return get_upcoming_events(20)
    except Exception:
        return []


async def awareness_loop():
    """
    AURA's awareness heartbeat — checks the world every 2 minutes
    and speaks only when something genuinely matters.
    """
    global ws_server, _announced_event_ids
    await asyncio.sleep(30)  # let backend fully start before first check

    while True:
        try:
            now_local = datetime.now()

            # Stay silent between 23:00 and 07:00
            if 7 <= now_local.hour < 23:
                await _check_calendar()

            # Future awareness checks slot in here:
            # await _check_tasks()
            # await _check_email_priority()
            # await _check_home_state()

        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"[Awareness] Loop error: {e}")

        await asyncio.sleep(120)  # heartbeat: every 2 minutes


async def _check_calendar():
    """Announce events starting in ~15 minutes — once per event, priority 2."""
    global ws_server, _announced_event_ids

    events = await asyncio.to_thread(_fetch_upcoming_sync)
    now_utc = datetime.now(timezone.utc)

    for event in events:
        eid = event.get("id", "")
        if not eid or eid in _announced_event_ids:
            continue
        start_str = event.get("start", "")
        if not start_str or "T" not in start_str:
            continue
        try:
            # Graph returns UTC datetimes without 'Z' — treat first 19 chars as UTC
            start_dt = datetime.strptime(
                start_str[:19], "%Y-%m-%dT%H:%M:%S"
            ).replace(tzinfo=timezone.utc)
            minutes_until = (start_dt - now_utc).total_seconds() / 60

            # 10–17 min window ensures a 2-min poll always catches it exactly once
            if 10 <= minutes_until <= 17:
                title = event.get("title", "a meeting")
                mins = round(minutes_until)
                _announced_event_ids.add(eid)

                text = f"Your {title} begins in {_num_words(mins)} minutes."
                print(f"[Awareness] {text}")
                await ws_server.broadcast({
                    "type": "reminder",
                    "text": text,
                    "priority": 2,
                })
        except Exception:
            pass


# ─── Lifecycle ────────────────────────────────────────────────────────────────

async def initialize():
    """Initialize all services."""
    global ws_server, spotify_client, spotify_poller, main_loop

    print("\n" + "=" * 50)
    print("AURA Backend Services")
    print("=" * 50 + "\n")

    ws_server = WebSocketServer(host="0.0.0.0", port=8765)
    await ws_server.start()
    ws_server.set_light_control_handler(handle_light_control)
    ws_server.set_youtube_handler(handle_youtube_message)
    ws_server.set_vision_handler(handle_vision_query)
    ws_server.set_apple_music_handler(handle_apple_music_control)
    print("[✓] WebSocket server started on port 8765")

    await start_http_server()
    print("[✓] HTTP server started on port 8766 (includes /realtime-token)")

    print("[✓] Tapo light service ready")

    global apple_music_poll_task, reminder_task
    apple_music_poll_task = asyncio.create_task(apple_music_poll_loop())
    print("[✓] Apple Music poller started")

    reminder_task = asyncio.create_task(awareness_loop())
    print("[✓] AURA Awareness loop started")

    global camera_manager
    camera_manager = CameraManager()
    print("[✓] Camera manager ready")

    print("\n" + "-" * 50)
    print("AURA backend ready. Voice handled by frontend Realtime API.")
    print("-" * 50 + "\n")


async def shutdown():
    """Gracefully stop all services."""
    global spotify_poller, ws_server, apple_music_poll_task, reminder_task

    print("\n[SHUTDOWN] Stopping AURA...")

    for task in [apple_music_poll_task, reminder_task]:
        if task and not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass

    if spotify_poller:
        spotify_poller.stop()
        print("[✓] Spotify poller stopped")

    await stop_http_server()

    if ws_server:
        await ws_server.stop()
        print("[WS] Server stopped")

    print("[✓] AURA shutdown complete")


def main():
    """Main entry point: set up event loop and run forever."""
    global main_loop

    main_loop = asyncio.new_event_loop()
    asyncio.set_event_loop(main_loop)

    try:
        main_loop.run_until_complete(initialize())
        main_loop.run_forever()
    except KeyboardInterrupt:
        main_loop.run_until_complete(shutdown())
    finally:
        main_loop.close()


if __name__ == "__main__":
    main()
