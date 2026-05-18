"""
AURA Vision Engine — frame capture and GPT-4o Vision orchestration.
"""

import asyncio
import base64
import os
from typing import Optional

import cv2
import numpy as np


def capture_frame() -> Optional[np.ndarray]:
    """Open camera, grab a single frame, release immediately."""
    try:
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("[Vision] Camera not available")
            return None

        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

        # Discard first few frames (camera warm-up)
        for _ in range(6):
            cap.read()

        ret, frame = cap.read()
        cap.release()

        if not ret or frame is None:
            print("[Vision] Failed to read frame")
            return None

        return cv2.flip(frame, 1)
    except Exception as e:
        print(f"[Vision] Camera error: {e}")
        return None


def b64_to_frame(image_b64: str) -> Optional[np.ndarray]:
    """Decode a base64 JPEG string into an OpenCV frame."""
    try:
        buf = base64.b64decode(image_b64)
        arr = np.frombuffer(buf, dtype=np.uint8)
        return cv2.imdecode(arr, cv2.IMREAD_COLOR)
    except Exception as e:
        print(f"[Vision] b64 decode error: {e}")
        return None


async def analyze(frame: np.ndarray, query: str) -> str:
    """Run GPT-4o Vision analysis on an OpenCV frame (runs in thread)."""
    from vision.gpt4_vision import gpt4v_analyze
    return await asyncio.to_thread(gpt4v_analyze, frame, query)


async def analyze_b64(image_b64: str, query: str) -> str:
    """Run GPT-4o Vision analysis on a base64-encoded JPEG (runs in thread)."""
    from vision.gpt4_vision import gpt4v_analyze_b64
    return await asyncio.to_thread(gpt4v_analyze_b64, image_b64, query)
