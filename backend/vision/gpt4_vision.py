"""
GPT-4o Vision API wrapper.
"""

import os
import base64
import cv2
import numpy as np

# Focused prompt — ignore background, identify the held/shown object only.
_SYSTEM_PROMPT = (
    "You are a vision assistant. "
    "Identify the main object being held up or shown in the CENTER of this image. "
    "Completely ignore the background, room, furniture, walls, and surroundings. "
    "Focus only on the primary subject in the foreground. "
    "Give a direct, concise answer in 2–3 sentences maximum. "
    "Do NOT describe the scene or the environment."
)


def _build_messages(image_content: dict, user_query: str) -> list:
    return [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {
            "role": "user",
            "content": [
                image_content,
                {"type": "text", "text": user_query},
            ],
        },
    ]


def gpt4v_analyze(frame: np.ndarray, query: str) -> str:
    """Send a frame (OpenCV BGR) to GPT-4o Vision and return the text response."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return "OpenAI API key not configured. Add OPENAI_API_KEY to backend/.env."

    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)

        _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        b64 = base64.b64encode(buf).decode("utf-8")

        image_content = {
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{b64}", "detail": "low"},
        }
        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=_build_messages(image_content, query),
            max_tokens=120,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"[GPT4V] API error: {e}")
        return f"Vision analysis failed: {str(e)[:120]}"


def gpt4v_analyze_b64(image_b64: str, query: str) -> str:
    """Same as gpt4v_analyze but accepts a pre-encoded base64 JPEG string."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return "OpenAI API key not configured."

    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)

        image_content = {
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{image_b64}", "detail": "low"},
        }
        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=_build_messages(image_content, query),
            max_tokens=120,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"[GPT4V] API error: {e}")
        return f"Vision analysis failed: {str(e)[:120]}"
