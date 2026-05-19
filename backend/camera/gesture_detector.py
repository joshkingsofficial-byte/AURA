"""
AURA Gesture Detector
Uses MediaPipe to detect hand gestures for navigation
"""

import cv2
import mediapipe as mp
import numpy as np
from enum import Enum
from typing import Optional, Callable
import time

class Gesture(Enum):
    NONE = "none"
    POINT_UP = "point_up"
    POINT_DOWN = "point_down"
    FIST = "fist"
    PALM_OPEN = "palm_open"
    SWIPE_LEFT = "swipe_left"
    SWIPE_RIGHT = "swipe_right"
    PEACE = "peace"

class GestureDetector:
    def __init__(self, on_gesture_callback: Optional[Callable] = None):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.85,
            min_tracking_confidence=0.75
        )
        self.mp_draw = mp.solutions.drawing_utils
        self.on_gesture_callback = on_gesture_callback
        self.last_gesture = Gesture.NONE
        self.gesture_start_time = 0
        self.gesture_cooldown = 1.5
        self.hand_history = []
        self.history_size = 10

    def process_frame(self, frame):
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)
        detected_gesture = Gesture.NONE

        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                self.mp_draw.draw_landmarks(frame, hand_landmarks, self.mp_hands.HAND_CONNECTIONS)
                detected_gesture = self._classify_gesture(hand_landmarks)
                self._track_hand_position(hand_landmarks)
                swipe = self._detect_swipe()
                if swipe:
                    detected_gesture = swipe

        if detected_gesture != Gesture.NONE:
            current_time = time.time()
            if (detected_gesture != self.last_gesture or
                current_time - self.gesture_start_time > self.gesture_cooldown):
                self.last_gesture = detected_gesture
                self.gesture_start_time = current_time
                if self.on_gesture_callback:
                    self.on_gesture_callback(detected_gesture)

        return frame, detected_gesture

    def _classify_gesture(self, hand_landmarks) -> Gesture:
        landmarks = hand_landmarks.landmark
        thumb = self._is_finger_extended(landmarks, 'thumb')
        index = self._is_finger_extended(landmarks, 'index')
        middle = self._is_finger_extended(landmarks, 'middle')
        ring = self._is_finger_extended(landmarks, 'ring')
        pinky = self._is_finger_extended(landmarks, 'pinky')
        extended_count = sum([thumb, index, middle, ring, pinky])

        if extended_count == 5:
            return Gesture.PALM_OPEN
        if extended_count == 0:
            return Gesture.FIST
        if index and not middle and not ring and not pinky:
            index_tip = landmarks[8]
            index_base = landmarks[5]
            if index_tip.y < index_base.y - 0.1:
                return Gesture.POINT_UP
            elif index_tip.y > index_base.y + 0.1:
                return Gesture.POINT_DOWN
        if index and middle and not ring and not pinky:
            return Gesture.PEACE
        return Gesture.NONE

    def _is_finger_extended(self, landmarks, finger: str) -> bool:
        finger_tips = {'thumb': 4, 'index': 8, 'middle': 12, 'ring': 16, 'pinky': 20}
        finger_bases = {'thumb': 2, 'index': 5, 'middle': 9, 'ring': 13, 'pinky': 17}
        tip = landmarks[finger_tips[finger]]
        base = landmarks[finger_bases[finger]]
        if finger == 'thumb':
            return abs(tip.x - base.x) > 0.05
        return tip.y < base.y - 0.05

    def _track_hand_position(self, hand_landmarks):
        wrist = hand_landmarks.landmark[0]
        self.hand_history.append((wrist.x, wrist.y, time.time()))
        if len(self.hand_history) > self.history_size:
            self.hand_history.pop(0)

    def _detect_swipe(self) -> Optional[Gesture]:
        if len(self.hand_history) < self.history_size:
            return None
        start_x, start_y, start_time = self.hand_history[0]
        end_x, end_y, end_time = self.hand_history[-1]
        dx = end_x - start_x
        dt = end_time - start_time
        if dt < 0.5 and abs(dx) > 0.3:
            self.hand_history.clear()
            return Gesture.SWIPE_RIGHT if dx > 0 else Gesture.SWIPE_LEFT
        return None

    def release(self):
        self.hands.close()

GESTURE_TO_COMMAND = {
    Gesture.PALM_OPEN: "go back",
    Gesture.POINT_UP: "scroll up",
    Gesture.POINT_DOWN: "scroll down",
    Gesture.FIST: "select",
    Gesture.SWIPE_LEFT: "previous",
    Gesture.SWIPE_RIGHT: "next",
    Gesture.PEACE: "settings"
}
