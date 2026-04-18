# services/spotify_poller.py
"""
Background poller that checks Spotify playback state and broadcasts updates
"""

import time
import threading
import asyncio
from typing import Optional
from services.music_spotify import SpotifyMusicClient
from server.ws_server import WebSocketServer


class SpotifyPoller:
    """
    Polls Spotify API every N seconds and broadcasts track changes via WebSocket
    """

    def __init__(self, ws_server: WebSocketServer, music_client: SpotifyMusicClient, interval: int = 5, loop: Optional[asyncio.AbstractEventLoop] = None):
        """
        Args:
            ws_server: WebSocket server instance to broadcast updates
            music_client: Spotify client instance
            interval: Polling interval in seconds (default: 5)
            loop: main asyncio loop to schedule broadcasts
        """
        self.ws = ws_server
        self.music_client = music_client
        self.interval = interval
        self.running = False
        self.thread: Optional[threading.Thread] = None
        self.last_track_id: Optional[str] = None
        self.last_is_playing: Optional[bool] = None
        self.loop = loop

    def set_loop(self, loop: asyncio.AbstractEventLoop):
        self.loop = loop

    def start(self):
        """Start the polling thread"""
        if self.running:
            print("[SpotifyPoller] Already running")
            return

        if not self.loop:
            # Not strictly required, but helps avoid surprises
            print("[SpotifyPoller] Warning: no loop set; broadcasts may fail")

        self.running = True
        self.thread = threading.Thread(target=self._poll_loop, daemon=True)
        self.thread.start()
        print(f"[SpotifyPoller] Started (interval: {self.interval}s)")

    def stop(self):
        """Stop the polling thread"""
        if not self.running:
            return

        self.running = False
        if self.thread:
            self.thread.join(timeout=2)
        print("[SpotifyPoller] Stopped")

    def _poll_loop(self):
        """Main polling loop - runs in background thread"""
        while self.running:
            try:
                self._check_and_broadcast()
            except Exception as e:
                print(f"[SpotifyPoller] Error: {e}")

            # Sleep in small chunks so we can exit quickly
            for _ in range(self.interval * 2):
                if not self.running:
                    break
                time.sleep(0.5)

    def _safe_broadcast(self, payload: dict):
        """Thread-safe broadcast scheduler."""
        if not self.loop:
            # Fallback (not recommended) - drop the message to avoid 'never awaited'
            print("[SpotifyPoller] Warning: no loop to broadcast on")
            return
        try:
            asyncio.run_coroutine_threadsafe(self.ws.broadcast(payload), self.loop)
        except Exception as e:
            print(f"[SpotifyPoller] Broadcast scheduling failed: {e}")

    def _check_and_broadcast(self):
        """Check current track and broadcast if changed"""
        try:
            track = self.music_client.get_current_track()

            if not track or not track.get("id"):
                # No active playback
                if self.last_track_id is not None or self.last_is_playing is not None:
                    self._safe_broadcast({"type": "music_update", "track": None})
                    print("[SpotifyPoller] No active Spotify session")
                self.last_track_id = None
                self.last_is_playing = None
                return

            current_id = track.get("id")
            is_playing = track.get("is_playing", False)
            changed = (current_id != self.last_track_id) or (is_playing != self.last_is_playing)

            if changed:
                self.last_track_id = current_id
                self.last_is_playing = is_playing

                payload = {
                    "type": "music_update",
                    "track": {
                        "id": current_id,
                        "name": track.get("name", "Unknown"),
                        "artists": track.get("artists", "Unknown"),
                        "album": track.get("album", ""),
                        "album_image": track.get("album_image", ""),
                        "is_playing": is_playing,
                        "progress_ms": track.get("progress_ms", 0)
                    }
                }
                self._safe_broadcast(payload)

                status = "playing" if is_playing else "paused"
                print(f"[SpotifyPoller] Track: {track.get('name')} by {track.get('artists')} ({status})")

        except Exception as e:
            print(f"[SpotifyPoller] Failed to check track: {e}")
