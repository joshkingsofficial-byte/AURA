#!/usr/bin/env python3
"""
AURA Voice Assistant - Main Entry Point
"""

import os
import sys
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Ensure we can import from subfolders
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from server.ws_server import WebSocketServer
from wake.wake_word import WakeWordListener
from stt.whisper_stt import record_audio, transcribe_audio
from tts.tts_handler import synthesize_speech
from ai.gpt_handler import ask_aura
from services.music_spotify import SpotifyMusicClient
from services.smart_home import SmartHomeClient
from services.spotify_poller import SpotifyPoller

# Globals
ws_server: WebSocketServer = None
wake_listener: WakeWordListener = None
spotify_client: SpotifyMusicClient = None
smart_home: SmartHomeClient = None
spotify_poller: SpotifyPoller = None
main_loop: asyncio.AbstractEventLoop = None

# Frontend-only navigation phrases (no GPT/TTS)
NAV_PHRASES = [
    "go to home page", "show home page", "go to homepage", "go to the home page",
    "go home", "go back", "go to idle", "return to home",
    "open spotify", "open youtube", "open weather", "open lights", "open light",
    "open news", "open recipe", "open recipes", "open notes", "open to do",
    "open memory", "open timer", "open alarm", "open photos", "open calendar",
    "open settings",
"go to apps", "show apps", "open apps", "show me apps", "go to the apps"
]


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
    global ws_server, spotify_client, smart_home

    if not text or not text.strip():
        return

    text = text.strip()
    lower = text.lower()
    print(f"[TRANSCRIPT] '{text}'")

    # =========================================================================
    # 0) FAST-PATH: "What's playing?" → Answer immediately with live Spotify
    # =========================================================================
    if is_whats_playing(text) and spotify_client:
        try:
            track = spotify_client.get_current_track()
            if track and track.get("id"):
                name = track.get("name") or "Unknown"
                artists = track.get("artists") or ""
                reply = f"Currently playing: {name}{(' by ' + artists) if artists else ''}."
            else:
                reply = "I don't see an active Spotify track right now."
            
            print(f"[SPOTIFY_FASTPATH] '{reply}'")
            await ws_server.broadcast({"type": "reply", "text": reply})
            synthesize_speech(reply)
            await ws_server.broadcast({"type": "done"})
            return  # IMPORTANT: Exit early, do NOT fall through to GPT
        except Exception as e:
            print(f"[Spotify] Quick answer failed: {e}")
            # Fall through to normal GPT path if fast-path fails

    # =========================================================================
    # 1) NAVIGATION: Frontend-only (no GPT, no TTS)
    # =========================================================================
    if any(phrase in lower for phrase in NAV_PHRASES):
        print(f"[NAV] Frontend handles: '{text}'")
        await ws_server.broadcast({"type": "transcript", "text": text})
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
    # 5) Execute smart home actions
    # =========================================================================
    if smart_action and smart_home:
        try:
            print(f"[SMART_HOME] {smart_action}")
            act = smart_action.get("action", "")
            if act == "activate_hope_mode" and hasattr(smart_home, "activate_hope_mode"):
                smart_home.activate_hope_mode()
            else:
                smart_home.execute(smart_action)
        except Exception as e:
            print(f"[SMART_HOME] Action failed: {e}")

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
    global ws_server, wake_listener, spotify_client, smart_home, spotify_poller, main_loop

    print("\n" + "=" * 50)
    print("AURA Voice Assistant")
    print("=" * 50 + "\n")

    # =========================================================================
    # 1) WebSocket server
    # =========================================================================
    ws_server = WebSocketServer(host="0.0.0.0", port=8765)
    await ws_server.start()
    print("[✓] WebSocket server started on port 8765")

    # =========================================================================
    # 2) Smart home client (offline stub for now)
    # =========================================================================
    try:
        smart_home = SmartHomeClient(config={"system": "unconfigured"})
        print("[✓] Smart home client initialized")
    except Exception as e:
        print(f"[!] Smart home init failed: {e}")
        smart_home = None

    # =========================================================================
    # 3) Spotify client + background poller
    # =========================================================================
    try:
        spotify_client = SpotifyMusicClient()
        print("[✓] Spotify client initialized")
        
        # Pass the main event loop so poller can safely broadcast from background thread
        spotify_poller = SpotifyPoller(
            ws_server, 
            spotify_client, 
            interval=5, 
            loop=main_loop
        )
        spotify_poller.start()
        print("[✓] Spotify poller started (polling every 5 seconds)")
    except Exception as e:
        print(f"[!] Spotify init failed: {e}")
        spotify_client = None
        spotify_poller = None

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
    global spotify_poller, ws_server

    print("\n[SHUTDOWN] Stopping AURA...")

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
