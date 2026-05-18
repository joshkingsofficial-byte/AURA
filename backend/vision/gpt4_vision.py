"""
GPT-4o Vision API wrapper.
"""

import os
import base64
import cv2
import numpy as np


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

        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{b64}",
                                "detail": "low",
                            },
                        },
                        {"type": "text", "text": query},
                    ],
                }
            ],
            max_tokens=350,
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

        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_b64}",
                                "detail": "low",
                            },
                        },
                        {"type": "text", "text": query},
                    ],
                }
            ],
            max_tokens=350,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"[GPT4V] API error: {e}")
        return f"Vision analysis failed: {str(e)[:120]}"
