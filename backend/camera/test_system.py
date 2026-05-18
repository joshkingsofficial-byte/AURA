"""
AURA Gesture Test
"""

import time
from camera_manager import CameraManager
from gesture_detector import GestureDetector, Gesture, GESTURE_TO_COMMAND

class AURAGestureTest:
    def __init__(self):
        self.current_screen = "home"
        self.detector = GestureDetector(on_gesture_callback=self._handle_gesture)
        self.camera = CameraManager(on_frame_callback=self._process_frame)

    def _process_frame(self, frame):
        self.detector.process_frame(frame)

    def _handle_gesture(self, gesture: Gesture):
        command = GESTURE_TO_COMMAND.get(gesture)
        if command:
            print(f"\n{'='*60}")
            print(f"🖐️  GESTURE: {gesture.value}")
            print(f"💬 COMMAND: '{command}'")
            print(f"{'='*60}\n")

    def start(self):
        print("\nAURA GESTURE TEST")
        print("="*60)
        print("\n✋ Try gestures:")
        print("  Palm Open → 'go back'")
        print("  Point Up → 'scroll up'")
        print("  Fist → 'select'")
        print("\nPress Ctrl+C to stop...\n")

        if not self.camera.initialize():
            print("❌ Camera failed")
            return
        self.camera.start()
        try:
            while True:
                time.sleep(0.1)
        except KeyboardInterrupt:
            self.camera.stop()
            self.detector.release()

if __name__ == "__main__":
    AURAGestureTest().start()
