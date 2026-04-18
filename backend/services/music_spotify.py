# services/music_spotify.py
"""
Spotify music client for playback control and track info
"""

import os
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from typing import Dict, Any


class SpotifyMusicClient:
    """
    Wrapper for Spotify API using spotipy library
    """

    def __init__(self):
        """Initialize Spotify client with OAuth"""
        self.sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
            client_id=os.getenv("SPOTIFY_CLIENT_ID"),
            client_secret=os.getenv("SPOTIFY_CLIENT_SECRET"),
            redirect_uri=os.getenv("SPOTIFY_REDIRECT_URI", "http://localhost:8888/callback"),
            scope="user-read-playback-state user-modify-playback-state user-read-currently-playing"
        ))
        print("[Spotify] Client initialized")

    def get_current_track(self) -> Dict[str, Any]:
        """
        Get currently playing track info

        Returns:
            dict with keys: id, name, artists, album, album_image, is_playing, progress_ms
            Note: artists is a comma-separated string for simplicity.
        """
        try:
            data = self.sp.currently_playing()
        except Exception as e:
            print(f"[Spotify] currently_playing failed: {e}")
            data = None

        if not data or not data.get("item"):
            return {
                "id": None,
                "name": None,
                "artists": None,
                "album": None,
                "album_image": None,
                "is_playing": False,
                "progress_ms": 0,
            }

        item = data["item"]
        artists = ", ".join([a["name"] for a in item.get("artists", [])]) if item else None
        images = item.get("album", {}).get("images", []) if item else []
        track_id = item.get("id")
        progress_ms = data.get("progress_ms", 0)
        is_playing = data.get("is_playing", False)

        return {
            "id": track_id,
            "name": item.get("name"),
            "artists": artists,
            "album": item.get("album", {}).get("name"),
            "album_image": images[0]["url"] if images else None,
            "is_playing": is_playing,
            "progress_ms": progress_ms,
        }

    def perform_action(self, action: Dict[str, Any]) -> bool:
        """
        Perform a music action (play, pause, skip, etc.)

        Args:
            action: dict with 'action' key and optional parameters

        Returns:
            bool: True if successful
        """
        action_type = action.get("action", "").lower()

        try:
            if action_type == "play":
                self.sp.start_playback()
                print("[Spotify] Playback started")
                return True

            elif action_type == "pause":
                self.sp.pause_playback()
                print("[Spotify] Playback paused")
                return True

            elif action_type == "next" or action_type == "skip":
                self.sp.next_track()
                print("[Spotify] Skipped to next track")
                return True

            elif action_type == "previous":
                self.sp.previous_track()
                print("[Spotify] Skipped to previous track")
                return True

            elif action_type == "volume":
                volume = action.get("volume", 50)
                self.sp.volume(volume)
                print(f"[Spotify] Volume set to {volume}%")
                return True

            elif action_type == "search_and_play":
                query = action.get("query", "")
                if not query:
                    print("[Spotify] No search query provided")
                    return False

                results = self.sp.search(q=query, type="track", limit=1)
                tracks = results.get("tracks", {}).get("items", [])

                if not tracks:
                    print(f"[Spotify] No tracks found for query: {query}")
                    return False

                track_uri = tracks[0]["uri"]
                self.sp.start_playback(uris=[track_uri])
                print(f"[Spotify] Playing: {tracks[0]['name']} by {tracks[0]['artists'][0]['name']}")
                return True

            else:
                print(f"[Spotify] Unknown action: {action_type}")
                return False

        except Exception as e:
            print(f"[Spotify] Action failed: {e}")
            return False
