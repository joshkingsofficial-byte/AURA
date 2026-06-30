#!/usr/bin/env python3
"""
AURA Voice Assistant - Main Entry Point
"""

import os
import sys
import asyncio
import re
import json
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from server.ws_server import WebSocketServer
from server.http_server import start_http_server
from wake.wake_word import WakeWordListener
from stt.whisper_stt import record_audio, transcribe_audio
from tts.tts_handler import synthesize_speech
from ai.gpt_handler import ask_aura
from services.music_spotify import SpotifyMusicClient
from services.spotify_poller import SpotifyPoller
from services.tapo_light import turn_on as light_on, turn_off as light_off, set_brightness
# from camera.gesture_bridge import GestureBridge  # disabled: camera conflict
from camera.camera_manager import CameraManager

# Globals
ws_server: WebSocketServer = None
wake_listener: WakeWordListener = None
spotify_client: SpotifyMusicClient = None
spotify_poller: SpotifyPoller = None
gesture_bridge = None
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

# ─── Constants ────────────────────────────────────────────────────────────────

NAV_PHRASES = [
    "go to home page", "show home page", "go to homepage", "go to the home page",
    "go home", "go back", "go to idle", "return to home",
    "open spotify", "open youtube", "open weather", "open lights", "open light",
    "open news", "open recipe", "open recipes", "open notes", "open to do",
    "open memory", "open timer", "open alarm", "open photos", "open calendar",
    "open email", "open settings", "open vision", "open music",
    "go to apps", "show apps", "open apps", "show me apps", "go to the apps",
    "whats the weather", "what's the weather", "show me the weather", "check the weather",
    "check my emails", "read my emails", "open my emails", "show my emails",
    "any emails", "any important emails",
    "whats on my calendar", "what's on my calendar", "show my calendar",
    "check my calendar", "open my calendar",
    "whats the news", "what's the news", "show me the news", "latest news",
    "show me the briefing",
]

VISION_FAST_PHRASES = [
    "what is this", "what's this", "whats this",
    "identify this", "identify this object",
    "what do you see", "what can you see",
    "look at this", "analyze this", "scan this",
    "what am i holding", "what am i carrying",
    "what's in my hand", "whats in my hand", "what is in my hand",
    "what's in front of you", "what's in front of me",
    "describe what you see", "tell me about this",
    "can you see this", "do you see this",
    "what am i looking at",
]

WHISPER_HALLUCINATIONS = {
    "thank you so much for watching",
    "thanks for watching",
    "thank you for watching",
    "おやすみなさい",
    "bye bye",
    "von pisa",
    "please subscribe",
    "like and subscribe",
    "see you next time",
    "don't forget to subscribe",
    "smash that like button",
}

# Single-word transcripts that are valid commands (not noise)
_VALID_SINGLE_WORDS = {
    "skip", "next", "pause", "resume", "stop", "play", "continue",
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

# ─── Step 1: Clean transcript ─────────────────────────────────────────────────

def clean_transcript(text: str) -> tuple:
    """Returns (display_text, routing_text). Strips wake word prefix from routing text."""
    display = text.strip()
    routing = display.lower()
    for wake in ("hey computer,", "hey computer.", "hey computer",
                 "computer,", "computer.", "computer"):
        if routing.startswith(wake):
            routing = routing[len(wake):].strip()
            break
    routing = re.sub(r'\s+', ' ', routing).rstrip(".,!?").strip()
    return display, routing


# ─── Step 2: Ignore noise / hallucinations ────────────────────────────────────

def should_ignore(routing: str) -> bool:
    """Return True if transcript is noise or a known Whisper hallucination."""
    if not routing:
        return True
    if routing in ("computer", "hey computer"):
        return True
    if routing in WHISPER_HALLUCINATIONS:
        return True
    words = routing.split()
    if len(words) == 1 and routing not in _VALID_SINGLE_WORDS:
        return True
    return False


# ─── Step 3: Normalize common STT errors ─────────────────────────────────────

def normalize_stt_errors(routing: str) -> tuple:
    """Returns (normalized_routing, clarification_question or None)."""
    original = routing

    # Music ambiguity
    if routing == "plus music":
        routing = "play music"
    elif routing in ("p.o.s.s. music", "poss music", "pos music", "pos. music"):
        return routing, "Did you mean pause music or play music?"

    # Lighting corrections — only apply when light context words are present
    light_ctx = any(w in routing for w in ("activate", "mode", "light", "enable", "set"))
    if light_ctx:
        if "hawk mode" in routing:
            routing = routing.replace("hawk mode", "hope mode")
        if "hop mode" in routing:
            routing = routing.replace("hop mode", "hope mode")

    if routing != original:
        print(f"[ROUTER] normalized: '{original}' -> '{routing}'")

    return routing, None


# ─── Tapo helpers ─────────────────────────────────────────────────────────────

TAPO_TIMEOUT_SECONDS = 5

async def _get_tapo_device():
    from tapo import ApiClient
    client = ApiClient(os.getenv("TAPO_EMAIL"), os.getenv("TAPO_PASSWORD"))
    return await asyncio.wait_for(client.l530(os.getenv("TAPO_IP")), timeout=TAPO_TIMEOUT_SECONDS)


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
        return "Lights are offline."


async def _apply_tapo_params(params: dict) -> str:
    """Apply arbitrary lighting parameters from the intent router."""
    global current_light_state
    try:
        dev = await _get_tapo_device()
        await dev.on()
        current_light_state["on"] = True

        if "brightness" in params:
            bri = max(1, min(100, int(params["brightness"])))
            await dev.set_brightness(bri)
            current_light_state["brightness"] = bri

        if "hue" in params and "sat" in params:
            h = max(0, min(360, int(params["hue"])))
            s = max(0, min(100, int(params["sat"])))
            await dev.set_hue_saturation(h, s)
            current_light_state.update({"hue": h, "sat": s, "color_temp": None})
        elif "color_temp" in params:
            ct = max(2500, min(6500, int(params["color_temp"])))
            await dev.set_color_temperature(ct)
            current_light_state.update({"hue": None, "sat": None, "color_temp": ct})

        if "mood" in params:
            current_light_state["mood"] = params["mood"]

        print(f"[Tapo] Dynamic params applied: {params}")
        return params.get("reply", "Done.")
    except Exception as e:
        print(f"[Tapo] Params error: {e}")
        return "Lights are offline."


# ─── Step 4: Fast-path local commands ────────────────────────────────────────

_AM_PLAY_KEYS = {
    "play music", "play apple music", "resume music", "resume the music",
    "start music", "unpause music", "unpause the music",
    "play the music", "play song", "play it",
    "resume", "continue", "continue playing", "start playing", "keep playing",
}
_AM_PAUSE_KEYS = {
    "pause music", "pause the music", "stop music", "stop the music",
    "pause song", "pause it", "stop playing",
}
_AM_NEXT_KEYS = {
    "skip", "next", "next song", "next track", "skip song", "skip this",
    "play next", "play next song", "next please",
}
_AM_PREV_KEYS = {
    "previous song", "previous track", "last song",
    "play previous", "go back a song", "play last song",
}
_AM_VOLUP_KEYS = {
    "volume up", "louder", "turn it up", "increase volume",
    "turn up the music", "turn up the volume", "make it louder",
}
_AM_VOLDN_KEYS = {
    "volume down", "quieter", "turn it down", "decrease volume",
    "turn down the music", "turn down the volume", "make it quieter",
}
_NOT_QUERY = {
    "music", "song", "songs", "track", "tracks", "it", "that",
    "this", "something", "anything", "apple music", "the music",
    "a song", "a track",
}
_MUSIC_SEARCH_PATTERNS = [
    r"^play\s+(?:some\s+)?(?:music|songs?|tracks?)\s+(?:by|from)\s+(.+)$",
    r"^put\s+on\s+(?:some\s+)?(.+)$",
    r"^play\s+some\s+(.+)$",
    r"^play\s+(.+)$",
]


def _extract_music_search(q: str) -> str:
    for pat in _MUSIC_SEARCH_PATTERNS:
        m = re.match(pat, q.strip())
        if m:
            candidate = m.group(1).strip()
            if candidate and candidate not in _NOT_QUERY:
                return candidate
    return ""


def _is_whats_playing(q: str) -> bool:
    q = q.replace("’", "'").replace("‘", "'").rstrip(".!?")
    keys = [
        "what song is playing", "what's playing", "whats playing",
        "now playing", "what song it's playing", "what song is currently playing",
        "what's currently playing", "whats currently playing", "currently playing",
        "what song's playing", "what song is playing right now",
    ]
    return any(k in q for k in keys)


async def _reply_whats_playing():
    global ws_server
    try:
        from music.apple_music_script import get_current_track as am_track
        track = await asyncio.to_thread(am_track)
        reply = (f"Currently playing: {track['title']} by {track['artist']}."
                 if track else "Nothing is playing right now.")
    except Exception as e:
        print(f"[AppleMusic] What's playing failed: {e}")
        reply = "I couldn't check what's playing."
    await ws_server.broadcast({"type": "reply", "text": reply})
    synthesize_speech(reply)
    await ws_server.broadcast({"type": "done"})


async def fast_path_music(routing: str) -> bool:
    """Handle obvious music commands without GPT. Returns True if handled."""
    global ws_server

    intent = None
    search_query = ""

    if _is_whats_playing(routing):
        print("[ROUTER] fast-path music: whats_playing")
        await _reply_whats_playing()
        return True

    if routing in _AM_PLAY_KEYS or any(k in routing for k in _AM_PLAY_KEYS):
        intent = "play"
    elif routing in _AM_PAUSE_KEYS or any(k in routing for k in _AM_PAUSE_KEYS):
        intent = "pause"
    elif routing in _AM_NEXT_KEYS:
        intent = "next"
    elif routing in _AM_PREV_KEYS or any(k in routing for k in _AM_PREV_KEYS):
        intent = "prev"
    elif routing in _AM_VOLUP_KEYS or any(k in routing for k in _AM_VOLUP_KEYS):
        intent = "volup"
    elif routing in _AM_VOLDN_KEYS or any(k in routing for k in _AM_VOLDN_KEYS):
        intent = "voldn"
    else:
        search_query = _extract_music_search(routing)
        if search_query:
            intent = "search"

    if intent is None:
        return False

    print(f"[ROUTER] fast-path music: {intent} query='{search_query}'")
    replies = {
        "play": "Playing.", "pause": "Paused.", "next": "Next track.",
        "prev": "Previous track.", "volup": "Volume up.", "voldn": "Volume down.",
        "search": f"Playing {search_query}.",
    }
    reply = replies[intent]

    try:
        from music.apple_music_script import (
            play as am_play, pause as am_pause,
            next_track as am_next, previous_track as am_prev,
            set_volume as am_vol, get_volume as am_getvol,
            search_and_play as am_search,
        )
        if intent == "play":
            await asyncio.to_thread(am_play)
        elif intent == "pause":
            await asyncio.to_thread(am_pause)
        elif intent == "next":
            await asyncio.to_thread(am_next)
        elif intent == "prev":
            await asyncio.to_thread(am_prev)
        elif intent == "volup":
            cur = await asyncio.to_thread(am_getvol)
            await asyncio.to_thread(am_vol, min(100, cur + 15))
        elif intent == "voldn":
            cur = await asyncio.to_thread(am_getvol)
            await asyncio.to_thread(am_vol, max(0, cur - 15))
        elif intent == "search":
            result = await asyncio.to_thread(am_search, search_query)
            if result == "no_results":
                reply = f"I couldn't find {search_query} in your library."
            elif result == "error":
                reply = "Couldn't search Apple Music."
    except Exception as e:
        print(f"[AppleMusic] Fast-path error: {e}")

    await ws_server.broadcast({"type": "reply", "text": reply})
    synthesize_speech(reply)
    await ws_server.broadcast({"type": "done"})
    return True


async def fast_path_vision(routing: str, display: str) -> bool:
    """Handle obvious vision commands. Returns True if handled."""
    global ws_server
    if any(p in routing for p in VISION_FAST_PHRASES):
        print("[ROUTER] fast-path vision")
        await ws_server.broadcast({"type": "vision_request", "query": display})
        await ws_server.broadcast({"type": "done"})
        return True
    return False


_LIGHT_ON_KEYS = {
    "turn on the light", "turn on the lights", "turn on lights",
    "lights on", "switch on the light", "light on",
    "turn the light on", "turn the lights on",
}
_LIGHT_OFF_KEYS = {
    "turn off the light", "turn off the lights", "turn off lights",
    "lights off", "switch off the light", "light off",
    "turn the light off", "turn the lights off",
}


async def fast_path_lighting(routing: str) -> bool:
    """Handle named presets and simple on/off. Returns True if handled."""
    global ws_server

    # Named mode: "hope mode", "activate focus mode", etc.
    mode_match = re.search(r'\b(\w+)\s+mode\b', routing)
    if mode_match:
        mode_name = mode_match.group(1)
        if mode_name in LIGHT_MODES:
            print(f"[ROUTER] fast-path lighting: preset '{mode_name}'")
            reply = await _apply_light_preset(mode_name)
            await ws_server.broadcast({"type": "reply", "text": reply})
            synthesize_speech(reply)
            await ws_server.broadcast({"type": "done"})
            return True

    # "activate hope", "bring hope", etc. (mode name mentioned with action word)
    action_words = ("activate", "bring", "set", "enable", "use", "turn on")
    for name in LIGHT_MODES:
        if re.search(rf'\b{re.escape(name)}\b', routing):
            if any(w in routing for w in action_words):
                print(f"[ROUTER] fast-path lighting: preset '{name}' (action word)")
                reply = await _apply_light_preset(name)
                await ws_server.broadcast({"type": "reply", "text": reply})
                synthesize_speech(reply)
                await ws_server.broadcast({"type": "done"})
                return True

    if any(k in routing for k in _LIGHT_ON_KEYS):
        print("[ROUTER] fast-path lighting: turn on")
        try:
            dev = await _get_tapo_device()
            await dev.on()
            current_light_state["on"] = True
            reply = "Lights on."
        except Exception as e:
            print(f"[Tapo] Error: {e}")
            reply = "I couldn't reach the lights."
        await ws_server.broadcast({"type": "reply", "text": reply})
        synthesize_speech(reply)
        await ws_server.broadcast({"type": "done"})
        return True

    if any(k in routing for k in _LIGHT_OFF_KEYS):
        print("[ROUTER] fast-path lighting: turn off")
        try:
            dev = await _get_tapo_device()
            await dev.off()
            current_light_state["on"] = False
            reply = "Lights off."
        except Exception as e:
            print(f"[Tapo] Error: {e}")
            reply = "I couldn't reach the lights."
        await ws_server.broadcast({"type": "reply", "text": reply})
        synthesize_speech(reply)
        await ws_server.broadcast({"type": "done"})
        return True

    return False


async def fast_path_time_date(routing: str) -> bool:
    """Handle time/date queries without GPT. Returns True if handled."""
    global ws_server
    from datetime import datetime as _dt
    now = _dt.now()

    time_keys = [
        "what time", "what's the time", "whats the time",
        "tell me the time", "current time", "what time is it",
    ]
    date_keys = [
        "what date", "what day", "what's today", "whats today", "today's date",
        "what's the date", "whats the date", "what day is it", "what's the day",
    ]

    if any(k in routing for k in time_keys):
        reply = now.strftime("It's %-I:%M %p.")
        print("[ROUTER] fast-path time")
        await ws_server.broadcast({"type": "reply", "text": reply})
        synthesize_speech(reply)
        await ws_server.broadcast({"type": "done"})
        return True

    if any(k in routing for k in date_keys):
        reply = now.strftime("Today is %A, %B %-d.")
        print("[ROUTER] fast-path date")
        await ws_server.broadcast({"type": "reply", "text": reply})
        synthesize_speech(reply)
        await ws_server.broadcast({"type": "done"})
        return True

    return False


async def fast_path_email(routing: str) -> bool:
    """Handle email queries. Returns True if handled."""
    global ws_server
    email_keys = [
        "any emails", "check my emails", "any important emails",
        "do i have any emails", "what emails do i have",
        "any new emails", "read my emails", "check emails",
    ]
    if not any(k in routing for k in email_keys):
        return False
    try:
        from services.gmail_service import get_important_emails, get_unread_emails
        emails = get_important_emails(3) or get_unread_emails(3)
        if not emails:
            reply = "You have no unread emails right now."
        elif len(emails) == 1:
            e = emails[0]
            sender = e["from"].split("<")[0].strip()
            reply = f"You have one unread email. From {sender}: {e['subject']}."
        else:
            parts = [f"From {e['from'].split('<')[0].strip()}: {e['subject']}" for e in emails[:3]]
            reply = f"You have {len(emails)} unread emails. " + ". ".join(parts) + "."
        print("[ROUTER] fast-path email")
        await ws_server.broadcast({"type": "reply", "text": reply})
        await ws_server.broadcast({"type": "navigate", "target": "app", "app": "email"})
        synthesize_speech(reply)
        await ws_server.broadcast({"type": "done"})
        return True
    except Exception as e:
        print(f"[EMAIL] Failed: {e}")
        return False


async def fast_path_nav(routing: str, display: str) -> bool:
    """Handle frontend navigation. Returns True if handled."""
    global ws_server
    if not any(phrase in routing for phrase in NAV_PHRASES):
        return False

    print(f"[ROUTER] fast-path nav: '{routing}'")

    if any(p in routing for p in [
        "go to home page", "show home page", "go to homepage",
        "go to the home page", "go to apps", "show apps",
        "open apps", "show me apps", "go to the apps",
    ]):
        await ws_server.broadcast({"type": "navigate", "target": "home"})
    elif any(p in routing for p in ["go home", "go back", "go to idle", "return to home"]):
        await ws_server.broadcast({"type": "navigate", "target": "idle"})
    elif "open spotify" in routing:
        await ws_server.broadcast({"type": "navigate", "target": "app", "app": "spotify"})
    elif "open youtube" in routing:
        await ws_server.broadcast({"type": "navigate", "target": "app", "app": "youtube"})
    elif any(p in routing for p in [
        "open weather", "whats the weather", "what's the weather",
        "show me the weather", "check the weather",
    ]):
        await ws_server.broadcast({"type": "navigate", "target": "app", "app": "weather"})
    elif any(p in routing for p in ["open lights", "open light"]):
        await ws_server.broadcast({"type": "navigate", "target": "app", "app": "lights"})
    elif any(p in routing for p in ["open notes", "open to do"]):
        await ws_server.broadcast({"type": "navigate", "target": "app", "app": "notes"})
    elif any(p in routing for p in [
        "open calendar", "whats on my calendar", "what's on my calendar",
        "show my calendar", "check my calendar", "open my calendar",
    ]):
        await ws_server.broadcast({"type": "navigate", "target": "app", "app": "calendar"})
    elif any(p in routing for p in ["open timer", "open alarm"]):
        await ws_server.broadcast({"type": "navigate", "target": "app", "app": "timer"})
    elif "open photos" in routing:
        await ws_server.broadcast({"type": "navigate", "target": "app", "app": "photos"})
    elif any(p in routing for p in [
        "open news", "whats the news", "what's the news",
        "show me the news", "latest news",
    ]):
        await ws_server.broadcast({"type": "navigate", "target": "app", "app": "news"})
    elif any(p in routing for p in ["open recipe", "open recipes"]):
        await ws_server.broadcast({"type": "navigate", "target": "app", "app": "recipe"})
    elif "open memory" in routing:
        await ws_server.broadcast({"type": "navigate", "target": "app", "app": "memory"})
    elif any(p in routing for p in [
        "check my emails", "read my emails", "open my emails",
        "show my emails", "any emails", "any important emails", "open email",
    ]):
        await ws_server.broadcast({"type": "navigate", "target": "app", "app": "email"})
    elif "open settings" in routing:
        await ws_server.broadcast({"type": "navigate", "target": "app", "app": "settings"})
    elif "open vision" in routing:
        await ws_server.broadcast({"type": "navigate", "target": "app", "app": "vision"})
    elif "open music" in routing:
        await ws_server.broadcast({"type": "navigate", "target": "app", "app": "music"})
    elif "show me the briefing" in routing:
        await ws_server.broadcast({"type": "navigate", "target": "app", "app": "briefing"})

    await ws_server.broadcast({"type": "done"})
    return True


# ─── Step 5: GPT intent router ────────────────────────────────────────────────

_INTENT_ROUTER_SYSTEM = """\
You are AURA's intent classifier. Return ONLY valid JSON — no prose, no markdown fences.

Classify the user's voice command into one of these domains:
- music      : playback, search, volume, track control
- vision     : needs visual analysis — objects, outfits, style, "what am I holding", "what is this"
- lighting   : room ambiance, color, brightness, mood, on/off
- navigation : open an app or navigate to a screen
- conversation : general questions, advice, chat, anything else
- ignore     : noise, unclear, not a command

Vision intents  : analyze_object | analyze_style | style_advice | describe_scene
Music intents   : play | pause | next | prev | volup | voldn | search | whats_playing
Lighting intents: turn_on | turn_off | set_mood | set_color | set_brightness | named_mode | adjust_current

For lighting always include in parameters:
  brightness (1-100) AND either hue+sat (hue:0-360, sat:0-100) OR color_temp (2500-6500).
  If intent is adjust_current, use the current light state to compute NEW absolute values.
  Include reply: a short 3-8 word spoken confirmation.

Current light state: {light_state}

Return exactly:
{{"domain":"...","intent":"...","confidence":0.0,"parameters":{{}},"reply":"..."}}"""


async def call_intent_router(routing: str) -> dict:
    """Lightweight GPT intent classifier. Returns intent dict, or {} on failure."""
    import openai as _oai
    _client = _oai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    state = json.dumps({k: v for k, v in current_light_state.items() if v is not None}) or "unknown"
    system = _INTENT_ROUTER_SYSTEM.format(light_state=state)
    try:
        resp = _client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system},
                {"role": "user",   "content": routing},
            ],
            temperature=0.0,
            max_tokens=150,
            response_format={"type": "json_object"},
        )
        raw = resp.choices[0].message.content.strip()
        result = json.loads(raw)
        print(f"[ROUTER] intent-router → domain={result.get('domain')} "
              f"intent={result.get('intent')} conf={result.get('confidence')}")
        return result
    except Exception as e:
        print(f"[ROUTER] intent-router error: {e}")
        return {}


# ─── Step 6: Execute intent ───────────────────────────────────────────────────

async def execute_intent(intent: dict, routing: str, display: str) -> bool:
    """Dispatch a classified intent. Returns True if handled (skip GPT fallback)."""
    global ws_server

    domain     = intent.get("domain", "conversation")
    confidence = float(intent.get("confidence", 0.0))
    params     = intent.get("parameters", {})
    reply      = intent.get("reply", "")

    if confidence < 0.65 and domain not in ("ignore", "clarify"):
        print(f"[ROUTER] low confidence ({confidence:.2f}) — falling back to GPT")
        return False

    if domain == "ignore":
        print("[ROUTER] intent-router: ignore")
        await ws_server.broadcast({"type": "done"})
        return True

    if domain == "clarify":
        print("[ROUTER] intent-router: clarify")
        msg = reply or "Could you rephrase that?"
        await ws_server.broadcast({"type": "reply", "text": msg})
        synthesize_speech(msg)
        await ws_server.broadcast({"type": "done"})
        return True

    if domain == "conversation":
        return False

    # ── music ──
    if domain == "music":
        print(f"[ROUTER] intent-router music: {intent.get('intent')}")
        mi = intent.get("intent", "")
        sq = params.get("query", "")
        try:
            from music.apple_music_script import (
                play as am_play, pause as am_pause,
                next_track as am_next, previous_track as am_prev,
                set_volume as am_vol, get_volume as am_getvol,
                search_and_play as am_search,
            )
            if mi == "play":
                await asyncio.to_thread(am_play)
                reply = reply or "Playing."
            elif mi == "pause":
                await asyncio.to_thread(am_pause)
                reply = reply or "Paused."
            elif mi == "next":
                await asyncio.to_thread(am_next)
                reply = reply or "Next track."
            elif mi == "prev":
                await asyncio.to_thread(am_prev)
                reply = reply or "Previous track."
            elif mi == "volup":
                cur = await asyncio.to_thread(am_getvol)
                await asyncio.to_thread(am_vol, min(100, cur + 15))
                reply = reply or "Volume up."
            elif mi == "voldn":
                cur = await asyncio.to_thread(am_getvol)
                await asyncio.to_thread(am_vol, max(0, cur - 15))
                reply = reply or "Volume down."
            elif mi == "search" and sq:
                result = await asyncio.to_thread(am_search, sq)
                if result == "no_results":
                    reply = f"I couldn't find that in your library."
                elif result == "error":
                    reply = "Couldn't search Apple Music."
                else:
                    reply = reply or f"Playing {sq}."
            elif mi == "whats_playing":
                await _reply_whats_playing()
                return True
            else:
                return False
        except Exception as e:
            print(f"[AppleMusic] Intent error: {e}")
            reply = "Couldn't execute music command."
        await ws_server.broadcast({"type": "reply", "text": reply})
        synthesize_speech(reply)
        await ws_server.broadcast({"type": "done"})
        return True

    # ── vision ──
    if domain == "vision":
        print(f"[ROUTER] intent-router vision: {intent.get('intent')}")
        query = params.get("query", display)
        await ws_server.broadcast({"type": "vision_request", "query": query})
        await ws_server.broadcast({"type": "done"})
        return True

    # ── lighting ──
    if domain == "lighting":
        print(f"[ROUTER] intent-router lighting: {intent.get('intent')}")
        li = intent.get("intent", "")
        if li == "turn_on":
            try:
                dev = await _get_tapo_device()
                await dev.on()
                current_light_state["on"] = True
                reply = reply or "Lights on."
            except Exception as e:
                print(f"[Tapo] Error: {e}")
                reply = "Lights are offline."
        elif li == "turn_off":
            try:
                dev = await _get_tapo_device()
                await dev.off()
                current_light_state["on"] = False
                reply = reply or "Lights off."
            except Exception as e:
                print(f"[Tapo] Error: {e}")
                reply = "Lights are offline."
        elif li == "named_mode" and "mode_name" in params:
            reply = await _apply_light_preset(params["mode_name"]) or reply or "Done."
        elif params:
            reply = await _apply_tapo_params(params)
        else:
            return False
        await ws_server.broadcast({"type": "reply", "text": reply})
        synthesize_speech(reply)
        await ws_server.broadcast({"type": "done"})
        return True

    # ── navigation ──
    if domain == "navigation":
        print("[ROUTER] intent-router navigation")
        target = params.get("target", "app")
        app    = params.get("app", "")
        if app or target not in ("app", ""):
            await ws_server.broadcast({"type": "navigate", "target": target, "app": app})
            if reply:
                await ws_server.broadcast({"type": "reply", "text": reply})
                synthesize_speech(reply)
            await ws_server.broadcast({"type": "done"})
            return True

    return False


# ─── Main pipeline ────────────────────────────────────────────────────────────

async def process_transcript_async(text: str):
    """Full routing pipeline: clean → ignore → normalize → fast-path → intent-router → GPT."""
    global ws_server

    # Step 1 — clean
    display, routing = clean_transcript(text)
    if not routing:
        return
    print(f"[ROUTER] cleaned transcript: '{routing}'")

    # Step 2 — ignore noise / hallucinations (never reaches GPT or context memory)
    if should_ignore(routing):
        print(f"[ROUTER] ignored noise: '{routing}'")
        await ws_server.broadcast({"type": "done"})
        return

    # Broadcast transcript to UI (after noise gate)
    await ws_server.broadcast({"type": "transcript", "text": display})

    # Step 3 — normalize common STT errors
    routing, clarification = normalize_stt_errors(routing)
    if clarification:
        await ws_server.broadcast({"type": "reply", "text": clarification})
        synthesize_speech(clarification)
        await ws_server.broadcast({"type": "done"})
        return

    # Step 4 — fast-path local commands (no GPT round-trip, no context memory)
    if await fast_path_time_date(routing):
        return
    if await fast_path_email(routing):
        return
    if await fast_path_music(routing):
        return
    if await fast_path_vision(routing, display):
        return
    if await fast_path_lighting(routing):
        return
    if await fast_path_nav(routing, display):
        return

    # Step 5 — GPT intent classifier (before conversation context)
    await ws_server.broadcast({"type": "thinking"})
    intent = await call_intent_router(routing)
    if intent:
        handled = await execute_intent(intent, routing, display)
        if handled:
            return

    # Step 6 — GPT conversation fallback (only path that writes to context memory)
    print("[ROUTER] fallback to GPT conversation")
    result = ask_aura(display)
    reply  = result.get("assistant_reply", "I'm not sure how to respond.")
    await ws_server.broadcast({"type": "reply", "text": reply})
    synthesize_speech(reply)
    await ws_server.broadcast({"type": "done"})


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
    action = msg.get("action")
    value  = msg.get("value")
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
        await ws_server.broadcast(msg)
        print(f"[YouTube] Control forwarded: {msg.get('action')}")


# ─── Wake word callback ───────────────────────────────────────────────────────

def on_wake():
    """Called from Porcupine listener thread when keyword detected."""
    global ws_server, main_loop

    print("\n[WAKE] Wake word detected! (computer)")

    if not main_loop:
        print("[WAKE] Error: main_loop not set")
        return

    asyncio.run_coroutine_threadsafe(
        ws_server.broadcast({"type": "wake_detected"}),
        main_loop
    )

    audio_path = record_audio(duration=4)
    if not audio_path:
        asyncio.run_coroutine_threadsafe(
            ws_server.broadcast({"type": "done"}),
            main_loop
        )
        return

    transcript = transcribe_audio(audio_path)
    if not transcript:
        asyncio.run_coroutine_threadsafe(
            ws_server.broadcast({"type": "done"}),
            main_loop
        )
        return

    print(f"[STT] Transcript: '{transcript}'")

    asyncio.run_coroutine_threadsafe(
        process_transcript_async(transcript),
        main_loop
    )


# ─── Lifecycle ────────────────────────────────────────────────────────────────

async def initialize():
    """Initialize all services."""
    global ws_server, wake_listener, spotify_client, spotify_poller, gesture_bridge, main_loop

    print("\n" + "=" * 50)
    print("AURA Voice Assistant")
    print("=" * 50 + "\n")

    ws_server = WebSocketServer(host="0.0.0.0", port=8765)
    await ws_server.start()
    ws_server.set_message_handler(process_transcript_async)
    ws_server.set_light_control_handler(handle_light_control)
    ws_server.set_youtube_handler(handle_youtube_message)
    ws_server.set_vision_handler(handle_vision_query)
    ws_server.set_apple_music_handler(handle_apple_music_control)
    print("[✓] WebSocket server started on port 8765")

    await start_http_server()
    print("[✓] HTTP server started on port 8766")

    print("[✓] Tapo light service ready")

    global apple_music_poll_task
    apple_music_poll_task = asyncio.create_task(apple_music_poll_loop())
    print("[✓] Apple Music poller started (polling every 3 seconds)")

    print("[–] Gesture control disabled")

    global camera_manager
    camera_manager = CameraManager()
    print("[✓] Camera manager ready (one-shot capture for Vision AI fallback)")

    # Spotify disabled — pending Premium account setup
    # try:
    #     spotify_client = SpotifyMusicClient()
    #     ...
    # except Exception as e:
    #     ...

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
