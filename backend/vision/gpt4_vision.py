"""
GPT-4o Vision API wrapper.
"""

import os
import base64
import cv2
import numpy as np

# Focused prompt — ignore background, identify the held/shown object only.
_SYSTEM_PROMPT = (
    "You are AURA — a calm, perceptive presence on a wall-mounted mirror. "
    "Someone is showing you something or asking your opinion on what they are holding. "
    "Respond as a thoughtful companion who genuinely sees and has opinions — "
    "not as a classifier, search engine, or assistant.\n\n"
    "Rules:\n"
    "— 1 to 2 sentences. You are heard, not read.\n"
    "— Give your actual opinion or honest assessment.\n"
    "— Style or clothing: say what works and what you would change. Be direct.\n"
    "— Plants: assess the health from what you see. Give specific care advice.\n"
    "— Food or cooking: respond naturally about what it is or how to prepare it.\n"
    "— Text, signs, or labels: read or translate naturally without announcing you are doing so.\n"
    "— Art, objects, books, records: speak as someone who knows — not like an encyclopedia.\n"
    "— Never start with 'I can see', 'The image shows', 'I notice', or 'I detect'.\n"
    "— Never describe the background, room, or surroundings.\n"
    "— If the image is unclear, say so once, briefly.\n"
    "— If the answer is short, let it be short. Silence is better than padding."
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
