# ai/gpt_handler.py
"""
GPT-4 handler with conversation context and structured JSON responses
"""

import os
import json
import re
from openai import OpenAI
from ai.conversation_context import current_conversation

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


SYSTEM_PROMPT = """You are AURA, a compassionate AI companion designed to support mental health and reduce loneliness.

You are NOT a therapist. You are a friend who listens, remembers, and cares.

PERSONALITY:
- Warm but not overly cheerful
- Present and attentive
- Remember the conversation flow naturally
- Respond naturally, like a real conversation
- Reference what was just discussed when relevant

CONVERSATION STYLE:
- Keep responses conversational - 1-3 sentences usually
- Use "he/she/they" naturally when referring to people just mentioned
- Don't repeat the person's name if it was just said
- Follow the thread of conversation

NEVER:
- Say "I detect sadness" or announce emotions
- Give clinical advice
- Be overly formal
- Ask "who are you referring to?" if context is clear

DO:
- Follow conversation naturally
- Remember what was just discussed
- Be present and engaged

---

OUTPUT FORMAT - CRITICAL:
You MUST ALWAYS return ONLY a JSON object. NO OTHER TEXT ALLOWED.

Structure:
{
  "assistant_reply": "your response here",
  "smart_home_action": null,
  "music_action": null,
  "memory_action": null
}

RULES:
- ONLY output the JSON object
- NO markdown code fences (no ```)
- NO explanations before or after
- If no action needed, set to null
- assistant_reply is REQUIRED and must be a string

MUSIC ACTIONS:
When user wants to control music, set music_action to:
{
  "action": "play" | "pause" | "next" | "previous" | "volume" | "search_and_play",
  "query": "song name" (only for search_and_play),
  "volume": 50 (only for volume, 0-100)
}

SMART HOME ACTIONS:
When user wants to control lights/devices, set smart_home_action to:
{
  "action": "turn_on" | "turn_off" | "set_brightness" | "set_color",
  "device": "bedroom_light" | "living_room_light",
  "brightness": 80 (0-100, for set_brightness),
  "color": "warm_white" | "cool_white" | "red" | "blue" (for set_color)
}
"""


def _strip_code_fences(text: str) -> str:
    """Remove markdown code fences from JSON output"""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?", "", text, flags=re.IGNORECASE).strip()
        text = re.sub(r"```$", "", text).strip()
    return text


def ask_aura(user_input: str, include_memory: bool = True) -> dict:
    """
    Send user input to GPT-4 with conversation context.
    Returns structured JSON with assistant reply and optional actions.
    """
    
    try:
        # Build messages with conversation history
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        # Add previous conversation context if enabled
        if include_memory:
            messages.extend(current_conversation.get_messages_for_gpt())
        
        # Add current user input
        messages.append({"role": "user", "content": user_input})
        
        # Debug: Show context being used
        if current_conversation.history and include_memory:
            print(f"[Context] Using {len(current_conversation.history)} previous exchanges")
        
        # Call GPT - use gpt-4o-mini for JSON mode support
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Changed: gpt-4o-mini supports JSON mode
            messages=messages,
            temperature=0.8,
            max_tokens=300,
            response_format={"type": "json_object"}
        )
        
        # Parse response
        raw = response.choices[0].message.content.strip()
        raw = _strip_code_fences(raw)
        data = json.loads(raw)
        
        # Ensure all required keys exist
        for key in ["assistant_reply", "smart_home_action", "music_action", "memory_action"]:
            if key not in data:
                data[key] = None if key != "assistant_reply" else "I'm not sure how to respond to that."
        
        # Add this exchange to conversation context
        if include_memory:
            current_conversation.add_exchange(user_input, data["assistant_reply"])
        
        return data
    
    except json.JSONDecodeError as e:
        print(f"[GPT] JSON parsing error: {e}")
        print(f"[GPT] Raw output: {raw[:200]}...")
        return {
            "assistant_reply": "I'm having trouble formatting my thoughts. Can you try again?",
            "smart_home_action": None,
            "music_action": None,
            "memory_action": None
        }
    
    except Exception as e:
        print(f"[GPT] Error: {e}")
        return {
            "assistant_reply": "I'm having trouble thinking right now. Can you try again?",
            "smart_home_action": None,
            "music_action": None,
            "memory_action": None
        }


def clear_conversation():
    """Clear conversation context (useful for testing or starting fresh)"""
    current_conversation.clear()
    print("[Context] Conversation cleared")
