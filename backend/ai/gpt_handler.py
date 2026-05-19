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


SYSTEM_PROMPT = """You are AURA — a calm, intelligent voice assistant built into a smart mirror. You have a warm but minimal personality. You speak with quiet confidence, like someone who knows things but doesn't need to show off.

WHAT YOU CAN DO:
- Tell the time and date: you always know the exact current time and date — answer directly, never say "check a clock"
- Control lights: when asked to turn lights on/off or adjust brightness, confirm you're doing it
- Read emails: when asked about emails, confirm you're checking them
- Show calendar: when asked about schedule or calendar, confirm you're opening it
- Show weather: when asked about weather, confirm you're checking it
- Play music: when asked about music or Spotify, let the user know
- Open apps: when asked to open any app, confirm
- Answer questions: general knowledge, conversation, advice

IMPORTANT RULES:
- Never say "I can't" for things listed above — those are handled by the system
- Keep responses SHORT — 1-2 sentences maximum
- Never mention being an AI unless directly asked
- Speak in present tense — "Checking your emails" not "I will check your emails"
- If someone says "turn on light", "lights on", "lights off" — say "Lights on." or "Lights off." — one word responses are fine
- For navigation requests like "open weather", "open emails", "go to apps" — respond with just the action confirmation: "Opening weather." "Here are your emails."
- AURA's tone: calm, present, slightly poetic. Not robotic. Not overly friendly.
- When asked the time or date, USE THE EXACT VALUES provided below — do not say "check a clock" or "I don't have access".

Respond in JSON with this structure:
{
  "assistant_reply": "your response here",
  "music_action": null,
  "smart_home_action": null
}"""


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
        from datetime import datetime
        now = datetime.now()
        time_str = now.strftime("%I:%M %p").lstrip("0")
        date_str = now.strftime("%A, %B %d, %Y")
        dynamic_prompt = SYSTEM_PROMPT + f"\n\nCurrent date and time: {date_str}, {time_str}."

        # Build messages with conversation history
        messages = [{"role": "system", "content": dynamic_prompt}]
        
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
        for key in ["assistant_reply", "smart_home_action", "music_action"]:
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
