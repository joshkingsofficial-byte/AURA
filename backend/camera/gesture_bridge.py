"""
AURA Gesture WebSocket Bridge
"""

import asyncio
import json
from typing import Optional
from camera.camera_manager import CameraManager
from camera.gesture_detector import GestureDetector, Gesture, GESTURE_TO_COMMAND

class GestureBridge:
    def __init__(self, websocket_handler=None, loop=None):
        self.websocket_handler = websocket_handler
        self.loop = loop
        self.camera = None
        self.detector = None
        self.is_active = False

    def initialize(self) -> bool:
        print("🎥 Initializing gesture control...")
        self.detector = GestureDetector(on_gesture_callback=self._on_gesture_detected)
        self.camera = CameraManager(on_frame_callback=self._process_frame)
        if not self.camera.initialize():
            return False
        print("✅ Gesture control ready")
        return True

    def start(self):
        if not self.camera or not self.detector:
            return
        self.is_active = True
        self.camera.start()
        print("▶️  Gesture detection active")

    def stop(self):
        self.is_active = False
        if self.camera:
            self.camera.stop()
        if self.detector:
            self.detector.release()

    def _process_frame(self, frame):
        if self.is_active:
            self.detector.process_frame(frame)

    def _on_gesture_detected(self, gesture: Gesture):
        command = GESTURE_TO_COMMAND.get(gesture)
        if command:
            print(f"🖐️  {gesture.value} → '{command}'")
            self._send_gesture_event(gesture, command)

    def _send_gesture_event(self, gesture: Gesture, command: str):
        event_data = {
            "type": "gesture_command",
            "gesture": gesture.value,
            "command": command
        }
        if self.websocket_handler and self.loop:
            asyncio.run_coroutine_threadsafe(
                self.websocket_handler(event_data),
                self.loop
            )
