#!/usr/bin/env python3
"""
AURA Voice Assistant - Main Entry Point
"""

import os
import sys
import asyncio
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Ensure we can import from subfolders
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from server.ws_server import WebSocketServer
from server.http_server import start_http_server
from wake.wake_word import WakeWordListener
from stt.whisper_stt import record_audio, transcribe_audio
from tts.tts_handler import synthesize_speech
from ai.gpt_handler import ask_aura
from services.music_spotify import SpotifyMusicClient
# from services.smart_home import SmartHomeClient
from services.spotify_poller import SpotifyPoller
from services.tapo_light import turn_on as light_on, turn_off as light_off, set_brightness
# from camera.gesture_bridge import GestureBridge  # disabled: camera conflict
from camera.camera_manager import CameraManager

# Globals
ws_server: WebSocketServer = None
wake_listener: WakeWordListener = None
spotify_client: SpotifyMusicClient = None
# smart_home: SmartHomeClient = None
spotify_poller: SpotifyPoller = None
gesture_bridge = None  # GestureBridge disabled
camera_manager: CameraManager = None
main_loop: asyncio.AbstractEventLoop = None
apple_music_poll_task = None

# Frontend-only navigation phrases (no GPT/TTS)
NAV_PHRASES = [
    "go to home page", "show home page", "go to homepage", "go to the home page",
    "go home", "go back", "go to idle", "return to home",
    "open spotify", "open youtube", "open weather", "open lights", "open light",
    "open news", "open recipe", "open recipes", "open notes", "open to do",
    "open memory", "open timer", "open alarm", "open photos", "open calendar",
    "open email", "open settings", "open vision", "open music",
    "go to apps", "show apps", "open apps", "show me apps", "go to the apps",
    "whats the weather", "what's the weather", "show me the weather", "open weather", "check the weather",
    "check my emails", "read my emails", "open my emails", "show my emails", "any emails", "any important emails",
    "whats on my calendar", "what's on my calendar", "show my calendar", "check my calendar", "open my calendar",
    "whats the news", "what's the news", "show me the news", "open news", "latest news",
    "show me the briefing",
]


# Voice phrases that trigger vision analysis instead of GPT text
VISION_PHRASES = [
    "what is this", "what's this", "whats this",
    "identify this", "identify this object",
    "what do you see", "what can you see",
    "look at this", "analyze this", "scan this",
    "what am i holding", "what am i carrying",
    "what's in my hand", "whats in my hand", "what is in my hand",
    "what's in front of you", "what's in front of me",
    "describe what you see", "tell me about this",
    "can you see this", "do you see this",
]


# Named Tapo light presets. Each entry has brightness (1-100) and either
# color_temp (Kelvin, white tones) or hue/sat (colored light) — never both.
LIGHT_MODES = {
    "hope":    {"brightness": 65,  "hue": 35,   "sat": 75},   # warm golden
    "hawk":    {"brightness": 100, "color_temp": 6000},         # sharp cool white
    "focus":   {"brightness": 85,  "color_temp": 5000},         # clean neutral
    "relax":   {"brightness": 40,  "color_temp": 2700},         # soft warm
    "sleep":   {"brightness": 8,   "hue": 10,   "sat": 60},   # dim red-warm
    "night":   {"brightness": 5,   "color_temp": 2200},         # minimal warm
    "morning": {"brightness": 70,  "color_temp": 4200},         # fresh daylight
    "chill":   {"brightness": 35,  "hue": 220,  "sat": 55},   # soft blue
    "vibe":    {"brightness": 50,  "hue": 280,  "sat": 70},   # purple
    "study":   {"brightness": 90,  "color_temp": 5000},         # bright neutral
    "dim":     {"brightness": 20,  "color_temp": 2700},         # low warm
    "bright":  {"brightness": 100, "color_temp": 5500},         # max bright
    "reading": {"brightness": 80,  "color_temp": 3500},         # warm neutral
    "sunset":  {"brightness": 55,  "hue": 25,   "sat": 85},   # deep amber
    "romance": {"brightness": 30,  "hue": 350,  "sat": 70},   # soft red-pink
}


async def handle_vision_query(msg: dict):
    """Handle vision_query WebSocket messages (image captured by frontend)."""
    global ws_server

    query = msg.get("query", "What is this? Describe what you see in detail.")
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
    synthesize_speech(result)
    await ws_server.broadcast({"type": "done"})


async def handle_apple_music_control(msg: dict):
    """Handle apple_music_control WebSocket messages from the UI."""
    action = msg.get("action")
    value  = msg.get("value")
    print(f"[AppleMusic] action={action} value={value}")
    try:
        from music.apple_music_script import (
            play as am_play, pause as am_pause,
            next_track as am_next, previous_track as am_prev,
            toggle_play_pause, set_volume as am_vol,
            get_current_track as am_track,
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
    except Exception as e:
        print(f"[AppleMusic] Control error: {e}")


async def apple_music_poll_loop():
    """Poll Apple Music every 3 s; broadcast music_update on track/state change."""
    global ws_server
    from music.apple_music_script import get_current_track as am_track, get_album_art_b64

    last_id = None
    last_playing = None
    last_art = None

    while True:
        try:
            track = await asyncio.to_thread(am_track)
            if track:
                tid = f"{track['title']}|{track['artist']}"
                changed = tid != last_id or track["is_playing"] != last_playing
                if changed:
                    if tid != last_id:
                        last_art = await asyncio.to_thread(get_album_art_b64)
                        last_id = tid
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
    action = msg.get("action")
    value = msg.get("value")
    print(f"[LightControl] action={action} value={value}")

    try:
        from tapo import ApiClient
        client = ApiClient(os.getenv("TAPO_EMAIL"), os.getenv("TAPO_PASSWORD"))
        device = await client.l530(os.getenv("TAPO_IP"))

        if action == "toggle":
            if value:
                await device.on()
                print("[Tapo] UI → Light ON")
            else:
                await device.off()
                print("[Tapo] UI → Light OFF")
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
        # Forward control commands (originating from voice) to all clients
        await ws_server.broadcast(msg)
        print(f"[YouTube] Control forwarded: {msg.get('action')}")


def is_whats_playing(q: str) -> bool:
    """Check if user is asking 'what's playing' in various forms."""
    if not q:
        return False
    q = q.lower().strip()
    # Normalize apostrophes and punctuation
    q = q.replace("'", "'").replace("'", "'").rstrip(".!?")
    
    keys = [
        "what song is playing",
        "what's playing",
        "whats playing",
        "now playing",
        "what song it's playing",
        "what song is currently playing",
        "what song is currently playing on spotify",
        "what song is playing on spotify",
        "what song's playing",
        "what song is playing right now",
        "what's currently playing",
        "whats currently playing",
        "currently playing",
    ]
    return any(k in q for k in keys)


async def process_transcript_async(text: str):
    """Process user transcript: nav locally, Spotify fast-path, otherwise GPT + actions."""
    global ws_server, spotify_client

    if not text or not text.strip():
        return

    text = text.strip()
    lower = text.lower()
    print(f"[TRANSCRIPT] '{text}'")

    # =========================================================================
    # 0) FAST-PATH: "What's playing?" → Spotify first, then Apple Music
    # =========================================================================
    if is_whats_playing(text):
        replied = False
        if spotify_client:
            try:
                track = spotify_client.get_current_track()
                if track and track.get("id"):
                    name = track.get("name") or "Unknown"
                    artists = track.get("artists") or ""
                    reply = f"Currently playing: {name}{(' by ' + artists) if artists else ''}."
                    print(f"[SPOTIFY_FASTPATH] '{reply}'")
                    await ws_server.broadcast({"type": "reply", "text": reply})
                    synthesize_speech(reply)
                    await ws_server.broadcast({"type": "done"})
                    return
            except Exception as e:
                print(f"[Spotify] Quick answer failed: {e}")

        if not replied:
            try:
                from music.apple_music_script import get_current_track as am_track
                track = await asyncio.to_thread(am_track)
                if track:
                    reply = f"Currently playing: {track['title']} by {track['artist']}."
                else:
                    reply = "Nothing is playing right now."
                print(f"[APPLEMUSIC_FASTPATH] '{reply}'")
                await ws_server.broadcast({"type": "reply", "text": reply})
                synthesize_speech(reply)
                await ws_server.broadcast({"type": "done"})
                return
            except Exception as e:
                print(f"[AppleMusic] What's playing failed: {e}")

    # =========================================================================
    # TIME / DATE FAST-PATH (no GPT round-trip needed)
    # =========================================================================
    from datetime import datetime as _dt
    _now = _dt.now()

    time_keys = [
        "what time", "what's the time", "whats the time",
        "tell me the time", "current time", "what time is it",
    ]
    date_keys = [
        "what date", "what day", "what's today", "whats today",
        "today's date", "what's the date", "whats the date",
        "what day is it", "what's the day",
    ]

    if any(k in lower for k in time_keys):
        reply = _now.strftime("It's %-I:%M %p.")
        print(f"[TIME_FASTPATH] '{reply}'")
        await ws_server.broadcast({"type": "reply", "text": reply})
        synthesize_speech(reply)
        await ws_server.broadcast({"type": "done"})
        return

    if any(k in lower for k in date_keys):
        reply = _now.strftime("Today is %A, %B %-d.")
        print(f"[DATE_FASTPATH] '{reply}'")
        await ws_server.broadcast({"type": "reply", "text": reply})
        synthesize_speech(reply)
        await ws_server.broadcast({"type": "done"})
        return

    # =========================================================================
    # EMAIL: "any emails?" / "any important emails?" / "check my emails"
    # =========================================================================
    email_keys = [
        "any emails", "check my emails", "any important emails",
        "do i have any emails", "what emails do i have",
        "any new emails", "read my emails", "check emails"
    ]
    if any(k in lower for k in email_keys) and spotify_client is not None or any(k in lower for k in email_keys):
        try:
            from services.gmail_service import get_important_emails, get_unread_emails
            emails = get_important_emails(3)
            if not emails:
                emails = get_unread_emails(3)
            if not emails:
                reply = "You have no unread emails right now."
            elif len(emails) == 1:
                e = emails[0]
                sender = e['from'].split('<')[0].strip()
                reply = f"You have one unread email. From {sender}: {e['subject']}."
            else:
                parts = []
                for e in emails[:3]:
                    sender = e['from'].split('<')[0].strip()
                    parts.append(f"From {sender}: {e['subject']}")
                reply = f"You have {len(emails)} unread emails. " + ". ".join(parts) + "."

            print(f"[EMAIL] '{reply}'")
            await ws_server.broadcast({"type": "reply", "text": reply})
            await ws_server.broadcast({"type": "navigate", "target": "app", "app": "email"})
            synthesize_speech(reply)
            await ws_server.broadcast({"type": "done"})
            return
        except Exception as e:
            print(f"[EMAIL] Failed: {e}")

    # =========================================================================
    # APPLE MUSIC VOICE COMMANDS
    # =========================================================================
    import re as _re

    def _extract_music_search(q: str) -> str:
        """Return artist/song query if this looks like a music search, else ''."""
        # Ordered most-specific → least-specific so "play music by X" beats "play X"
        _patterns = [
            r"^play\s+(?:some\s+)?(?:music|songs?|tracks?)\s+(?:by|from)\s+(.+)$",
            r"^play\s+(?:music|songs?|tracks?)\s+(?:by|from)\s+(.+)$",
            r"^put\s+on\s+(?:some\s+)?(.+)$",
            r"^play\s+some\s+(.+)$",
            r"^play\s+(.+)$",
        ]
        # Words that are NOT search queries — map to control commands above
        _NOT_QUERY = {"music", "song", "songs", "track", "tracks", "it", "that",
                      "this", "something", "anything", "apple music", "the music",
                      "a song", "a track"}
        for pat in _patterns:
            m = _re.match(pat, q.strip())
            if m:
                candidate = m.group(1).strip()
                if candidate and candidate not in _NOT_QUERY:
                    return candidate
        return ""

    # CONTROL: generic play/resume — no artist/song in the command
    _AM_PLAY  = ["play music", "play apple music", "resume music", "resume the music",
                 "start music", "unpause music", "unpause the music",
                 "play the music", "play song", "play it",
                 "resume", "continue", "continue playing", "start playing", "keep playing"]
    _AM_PAUSE = ["pause music", "pause the music", "stop music", "stop the music",
                 "pause song", "pause it", "stop playing"]
    _AM_NEXT  = ["skip", "next song", "next track", "skip song", "skip this",
                 "play next", "play next song", "next please"]
    _AM_PREV  = ["previous song", "previous track", "last song", "go back to previous",
                 "play previous", "go back a song", "play last song"]
    _AM_VOLUP = ["volume up", "louder", "turn it up", "increase volume", "turn up the music",
                 "turn up the volume", "make it louder"]
    _AM_VOLDN = ["volume down", "quieter", "turn it down", "decrease volume", "turn down the music",
                 "turn down the volume", "make it quieter"]

    # Determine intent from patterns before any execution (so exceptions don't break routing)
    _am_intent = None
    _am_search_query = ""
    if any(k in lower for k in _AM_PLAY):
        _am_intent = "play"
    elif any(k in lower for k in _AM_PAUSE):
        _am_intent = "pause"
    elif any(k in lower for k in _AM_NEXT):
        _am_intent = "next"
    elif any(k in lower for k in _AM_PREV):
        _am_intent = "prev"
    elif any(k in lower for k in _AM_VOLUP):
        _am_intent = "volup"
    elif any(k in lower for k in _AM_VOLDN):
        _am_intent = "voldn"
    else:
        _am_search_query = _extract_music_search(lower)
        if _am_search_query:
            _am_intent = "search"

    if _am_intent:
        print(f"[AppleMusic] Voice intent: {_am_intent} query='{_am_search_query}'")
        _am_replies = {
            "play": "Playing.", "pause": "Paused.", "next": "Next track.",
            "prev": "Previous track.", "volup": "Volume up.", "voldn": "Volume down.",
            "search": f"Playing {_am_search_query}.",
        }
        am_reply = _am_replies[_am_intent]
        try:
            from music.apple_music_script import (
                play as am_play, pause as am_pause,
                next_track as am_next, previous_track as am_prev,
                set_volume as am_vol, get_volume as am_getvol,
                search_and_play as am_search,
            )
            if _am_intent == "play":
                await asyncio.to_thread(am_play)
            elif _am_intent == "pause":
                await asyncio.to_thread(am_pause)
            elif _am_intent == "next":
                await asyncio.to_thread(am_next)
            elif _am_intent == "prev":
                await asyncio.to_thread(am_prev)
            elif _am_intent == "volup":
                cur = await asyncio.to_thread(am_getvol)
                await asyncio.to_thread(am_vol, min(100, cur + 15))
            elif _am_intent == "voldn":
                cur = await asyncio.to_thread(am_getvol)
                await asyncio.to_thread(am_vol, max(0, cur - 15))
            elif _am_intent == "search":
                result = await asyncio.to_thread(am_search, _am_search_query)
                if result == "no_results":
                    am_reply = f"I couldn't find {_am_search_query} in your library."
                elif result == "error":
                    am_reply = f"Couldn't search Apple Music."
        except Exception as e:
            print(f"[AppleMusic] Voice command execution error: {e}")
        await ws_server.broadcast({"type": "reply", "text": am_reply})
        synthesize_speech(am_reply)
        await ws_server.broadcast({"type": "done"})
        return

    # =========================================================================
    # VISION: "what is this?" / "identify this" / etc.
    # =========================================================================
    if any(p in lower for p in VISION_PHRASES):
        print(f"[Vision] Voice trigger: '{text}'")
        # Fire overlay directly — no navigation, no sleep.
        # VisionOverlay is always mounted in App.js and handles its own camera.
        await ws_server.broadcast({"type": "vision_request", "query": text})
        await ws_server.broadcast({"type": "done"})
        return

    # =========================================================================
    # LIGHTS
    # =========================================================================
    async def _apply_light_mode(mode_name: str) -> str:
        """Apply a named preset to the Tapo bulb. Returns reply string."""
        preset = LIGHT_MODES.get(mode_name)
        if not preset:
            return ""
        try:
            from tapo import ApiClient as _TapoClient
            _client = _TapoClient(os.getenv("TAPO_EMAIL"), os.getenv("TAPO_PASSWORD"))
            _dev = await _client.l530(os.getenv("TAPO_IP"))
            await _dev.on()
            if "color_temp" in preset:
                await _dev.set_color_temperature(preset["color_temp"])
            else:
                await _dev.set_hue_saturation(preset["hue"], preset["sat"])
            await _dev.set_brightness(preset["brightness"])
            print(f"[Tapo] Mode '{mode_name}' applied: {preset}")
            return f"{mode_name.capitalize()} mode."
        except Exception as e:
            print(f"[Tapo] Mode error: {e}")
            return "Your lights are offline."

    # Named mode: "activate hope mode", "hope mode", "enable focus mode", etc.
    _mode_match = re.search(r'\b(\w+)\s+mode\b', lower)
    if _mode_match:
        _mode_name = _mode_match.group(1)
        if _mode_name in LIGHT_MODES:
            reply = await _apply_light_mode(_mode_name)
            await ws_server.broadcast({"type": "reply", "text": reply})
            synthesize_speech(reply)
            await ws_server.broadcast({"type": "done"})
            return

    light_on_keys  = ["turn on the light", "turn on lights", "lights on", "switch on the light", "light on"]
    light_off_keys = ["turn off the light", "turn off lights", "lights off", "switch off the light", "light off"]

    if any(k in lower for k in light_on_keys):
        try:
            from tapo import ApiClient
            client = ApiClient(os.getenv("TAPO_EMAIL"), os.getenv("TAPO_PASSWORD"))
            device = await client.l530(os.getenv("TAPO_IP"))
            await device.on()
            reply = "Lights on."
            print("[Tapo] Light turned ON")
        except Exception as e:
            print(f"[Tapo] Error: {e}")
            reply = "I couldn't reach the lights."
        await ws_server.broadcast({"type": "reply", "text": reply})
        synthesize_speech(reply)
        await ws_server.broadcast({"type": "done"})
        return

    if any(k in lower for k in light_off_keys):
        try:
            from tapo import ApiClient
            client = ApiClient(os.getenv("TAPO_EMAIL"), os.getenv("TAPO_PASSWORD"))
            device = await client.l530(os.getenv("TAPO_IP"))
            await device.off()
            reply = "Lights off."
            print("[Tapo] Light turned OFF")
        except Exception as e:
            print(f"[Tapo] Error: {e}")
            reply = "I couldn't reach the lights."
        await ws_server.broadcast({"type": "reply", "text": reply})
        synthesize_speech(reply)
        await ws_server.broadcast({"type": "done"})
        return

    # =========================================================================
    # 1) NAVIGATION: Frontend-only (no GPT, no TTS)
    # =========================================================================
    if any(phrase in lower for phrase in NAV_PHRASES):
        print(f"[NAV] Frontend handles: '{text}'")
        await ws_server.broadcast({"type": "transcript", "text": text})

        if any(p in lower for p in ["go to home page", "show home page", "go to homepage", "go to the home page", "go to apps", "show apps", "open apps", "show me apps", "go to the apps"]):
            await ws_server.broadcast({"type": "navigate", "target": "home"})
        elif any(p in lower for p in ["go home", "go back", "go to idle", "return to home"]):
            await ws_server.broadcast({"type": "navigate", "target": "idle"})
        elif "open spotify" in lower:
            await ws_server.broadcast({"type": "navigate", "target": "app", "app": "spotify"})
        elif "open youtube" in lower:
            await ws_server.broadcast({"type": "navigate", "target": "app", "app": "youtube"})
        elif any(p in lower for p in ["open weather", "whats the weather", "what's the weather", "show me the weather", "check the weather"]):
            await ws_server.broadcast({"type": "navigate", "target": "app", "app": "weather"})
        elif any(p in lower for p in ["open lights", "open light"]):
            await ws_server.broadcast({"type": "navigate", "target": "app", "app": "lights"})
        elif any(p in lower for p in ["open notes", "open to do"]):
            await ws_server.broadcast({"type": "navigate", "target": "app", "app": "notes"})
        elif any(p in lower for p in ["open calendar", "whats on my calendar", "what's on my calendar", "show my calendar", "check my calendar", "open my calendar"]):
            await ws_server.broadcast({"type": "navigate", "target": "app", "app": "calendar"})
        elif any(p in lower for p in ["open timer", "open alarm"]):
            await ws_server.broadcast({"type": "navigate", "target": "app", "app": "timer"})
        elif "open photos" in lower:
            await ws_server.broadcast({"type": "navigate", "target": "app", "app": "photos"})
        elif any(p in lower for p in ["open news", "whats the news", "what's the news", "show me the news", "latest news"]):
            await ws_server.broadcast({"type": "navigate", "target": "app", "app": "news"})
        elif any(p in lower for p in ["open recipe", "open recipes"]):
            await ws_server.broadcast({"type": "navigate", "target": "app", "app": "recipe"})
        elif "open memory" in lower:
            await ws_server.broadcast({"type": "navigate", "target": "app", "app": "memory"})
        elif any(p in lower for p in ["check my emails", "read my emails", "open my emails", "show my emails", "any emails", "any important emails", "open email"]):
            await ws_server.broadcast({"type": "navigate", "target": "app", "app": "email"})
        elif "open settings" in lower:
            await ws_server.broadcast({"type": "navigate", "target": "app", "app": "settings"})
        elif "open vision" in lower:
            await ws_server.broadcast({"type": "navigate", "target": "app", "app": "vision"})
        elif "open music" in lower:
            await ws_server.broadcast({"type": "navigate", "target": "app", "app": "music"})
        elif "show me the briefing" in lower:
            await ws_server.broadcast({"type": "navigate", "target": "app", "app": "briefing"})

        await ws_server.broadcast({"type": "done"})
        return

    # =========================================================================
    # 2) Show thinking state
    # =========================================================================
    await ws_server.broadcast({"type": "thinking"})

    # =========================================================================
    # 3) Ask GPT for response + actions
    # =========================================================================
    result = ask_aura(text)
    reply = result.get("assistant_reply", "I'm not sure how to respond.")
    music_action = result.get("music_action")
    smart_action = result.get("smart_home_action")

    # =========================================================================
    # 4) Execute music actions
    # =========================================================================
    if music_action and spotify_client:
        try:
            print(f"[MUSIC] {music_action}")
            action_payload = {"action": music_action.get("action", "")}
            if "query" in music_action:
                action_payload["query"] = music_action["query"]
            if "volume" in music_action:
                action_payload["volume"] = music_action["volume"]
            spotify_client.perform_action(action_payload)
            # Push a fresh music_update after action
            track = spotify_client.get_current_track()
            await ws_server.broadcast({"type": "music_update", "track": track})
        except Exception as e:
            print(f"[MUSIC] Action failed: {e}")

    # =========================================================================
    # 5) Execute smart home actions (disabled - replaced by direct Tapo calls)
    # =========================================================================
    # if smart_action and smart_home:
    #     try:
    #         print(f"[SMART_HOME] {smart_action}")
    #         act = smart_action.get("action", "")
    #         if act == "activate_hope_mode" and hasattr(smart_home, "activate_hope_mode"):
    #             smart_home.activate_hope_mode()
    #         else:
    #             smart_home.execute(smart_action)
    #     except Exception as e:
    #         print(f"[SMART_HOME] Action failed: {e}")

    # =========================================================================
    # 6) Send reply, synthesize TTS, mark done
    # =========================================================================
    await ws_server.broadcast({"type": "reply", "text": reply})
    synthesize_speech(reply)
    await ws_server.broadcast({"type": "done"})


def on_wake():
    """Called from Porcupine listener thread when keyword detected."""
    global ws_server, main_loop

    print("\n[WAKE] Wake word detected! (computer)")

    if not main_loop:
        print("[WAKE] Error: main_loop not set")
        return

    # Schedule async tasks on the main event loop (thread-safe)
    asyncio.run_coroutine_threadsafe(
        ws_server.broadcast({"type": "wake_detected"}),
        main_loop
    )

    # Record audio (sync, blocking)
    audio_path = record_audio(duration=4)
    if not audio_path:
        asyncio.run_coroutine_threadsafe(
            ws_server.broadcast({"type": "done"}),
            main_loop
        )
        return

    # Transcribe audio (sync, blocking)
    transcript = transcribe_audio(audio_path)
    if not transcript:
        asyncio.run_coroutine_threadsafe(
            ws_server.broadcast({"type": "done"}),
            main_loop
        )
        return

    print(f"[STT] Transcript: '{transcript}'")

    # Send transcript to frontend + process it
    asyncio.run_coroutine_threadsafe(
        ws_server.broadcast({"type": "transcript", "text": transcript}),
        main_loop
    )
    asyncio.run_coroutine_threadsafe(
        process_transcript_async(transcript),
        main_loop
    )


async def initialize():
    """Initialize all services."""
    global ws_server, wake_listener, spotify_client, spotify_poller, gesture_bridge, main_loop

    print("\n" + "=" * 50)
    print("AURA Voice Assistant")
    print("=" * 50 + "\n")

    # =========================================================================
    # 1) WebSocket server
    # =========================================================================
    ws_server = WebSocketServer(host="0.0.0.0", port=8765)
    await ws_server.start()
    ws_server.set_message_handler(process_transcript_async)
    ws_server.set_light_control_handler(handle_light_control)
    ws_server.set_youtube_handler(handle_youtube_message)
    ws_server.set_vision_handler(handle_vision_query)
    ws_server.set_apple_music_handler(handle_apple_music_control)
    print("[✓] WebSocket server started on port 8765")

    # =========================================================================
    # 1.5) HTTP server for REST endpoints
    # =========================================================================
    await start_http_server()
    print("[✓] HTTP server started on port 8766")

    # =========================================================================
    # 2) Tapo lights
    # =========================================================================
    # Tapo lights ready
    print("[✓] Tapo light service ready")

    # =========================================================================
    # 2.1) Apple Music poller
    # =========================================================================
    global apple_music_poll_task
    apple_music_poll_task = asyncio.create_task(apple_music_poll_loop())
    print("[✓] Apple Music poller started (polling every 3 seconds)")

    # =========================================================================
    # 2.5) Gesture control — DISABLED (camera conflict with VisionOverlay)
    # =========================================================================
    # gesture_bridge = GestureBridge(websocket_handler=ws_server.broadcast, loop=main_loop)
    print("[–] Gesture control disabled")

    # =========================================================================
    # 2.6) Camera manager — for Vision AI fallback capture
    # =========================================================================
    global camera_manager
    camera_manager = CameraManager()
    print("[✓] Camera manager ready (one-shot capture for Vision AI fallback)")

    # =========================================================================
    # 3) Spotify client + background poller
    # Spotify disabled - pending Premium account setup
    # =========================================================================
    # try:
    #     spotify_client = SpotifyMusicClient()
    #     print("[✓] Spotify client initialized")
    #
    #     # Pass the main event loop so poller can safely broadcast from background thread
    #     spotify_poller = SpotifyPoller(
    #         ws_server,
    #         spotify_client,
    #         interval=5,
    #         loop=main_loop
    #     )
    #     spotify_poller.start()
    #     print("[✓] Spotify poller started (polling every 5 seconds)")
    # except Exception as e:
    #     print(f"[!] Spotify init failed: {e}")
    #     spotify_client = None
    #     spotify_poller = None

    # =========================================================================
    # 4) Wake word listener
    # =========================================================================
    try:
        wake_listener = WakeWordListener(keyword="computer", callback=on_wake)
        wake_listener.start()
        print("[✓] Wake word listener initialized (keyword: 'computer')")
    except Exception as e:
        print(f"[✗] Wake word init failed: {e}")
        raise

    print("\n" + "-" * 50)
    print("AURA is ready. Say 'computer' to wake me.")
    print("-" * 50 + "\n")


async def shutdown():
    """Gracefully stop all services."""
    global spotify_poller, gesture_bridge, ws_server

    print("\n[SHUTDOWN] Stopping AURA...")

    if gesture_bridge:
        gesture_bridge.stop()
        print("[✓] Gesture control stopped")

    if spotify_poller:
        spotify_poller.stop()
        print("[✓] Spotify poller stopped")

    if ws_server:
        await ws_server.stop()

    print("[✓] AURA shutdown complete")


def main():
    """Main entry point: set up event loop and run forever."""
    global main_loop

    # Create and set the main event loop
    main_loop = asyncio.new_event_loop()
    asyncio.set_event_loop(main_loop)

    try:
        # Initialize all services (async)
        main_loop.run_until_complete(initialize())
        # Keep the loop running
        main_loop.run_forever()
    except KeyboardInterrupt:
        # Graceful shutdown on Ctrl+C
        main_loop.run_until_complete(shutdown())
    finally:
        main_loop.close()


if __name__ == "__main__":
    main()
