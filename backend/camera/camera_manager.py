"""
AURA Camera Manager
Platform-agnostic camera handling (Mac webcam → Pi camera later)
"""

import cv2
import platform
import threading
import time
from typing import Optional, Callable

class CameraManager:
    def __init__(self, on_frame_callback: Optional[Callable] = None):
        self.platform = platform.system()
        self.camera = None
        self.is_running = False
        self.thread = None
        self.on_frame_callback = on_frame_callback
        self.fps = 30

    def initialize(self) -> bool:
        try:
            if self.platform == "Darwin":
                print("🎥 Initializing Mac webcam...")
                self.camera = cv2.VideoCapture(0)
                self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                self.camera.set(cv2.CAP_PROP_FPS, self.fps)
            elif self.platform == "Linux":
                print("🎥 Initializing Pi camera...")
                try:
                    from picamera2 import Picamera2
                    self.camera = Picamera2()
                    config = self.camera.create_preview_configuration(main={"size": (640, 480)})
                    self.camera.configure(config)
                except ImportError:
                    self.camera = cv2.VideoCapture(0)
            else:
                print(f"⚠️  Unsupported platform: {self.platform}")
                return False

            if self.platform == "Darwin" or (self.platform == "Linux" and isinstance(self.camera, cv2.VideoCapture)):
                ret, frame = self.camera.read()
                if not ret:
                    print("❌ Camera test failed")
                    return False

            print("✅ Camera initialized")
            return True
        except Exception as e:
            print(f"❌ Camera initialization failed: {e}")
            return False

    def start(self):
        if self.is_running:
            return
        self.is_running = True
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()
        print("▶️  Camera stream started")

    def _capture_loop(self):
        frame_delay = 1.0 / self.fps
        while self.is_running:
            try:
                if self.platform == "Darwin" or (self.platform == "Linux" and isinstance(self.camera, cv2.VideoCapture)):
                    ret, frame = self.camera.read()
                    if not ret:
                        time.sleep(frame_delay)
                        continue
                else:
                    frame = self.camera.capture_array()

                frame = cv2.flip(frame, 1)
                if self.on_frame_callback:
                    self.on_frame_callback(frame)
                time.sleep(frame_delay)
            except Exception as e:
                print(f"❌ Capture error: {e}")
                time.sleep(1)

    def stop(self):
        self.is_running = False
        if self.thread:
            self.thread.join(timeout=2)
        if self.camera:
            if isinstance(self.camera, cv2.VideoCapture):
                self.camera.release()
            else:
                self.camera.stop()
        print("✅ Camera stopped")
