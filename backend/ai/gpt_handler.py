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

SENTENCE_END = re.compile(r'(?<=[.!?])\s+')


SYSTEM_PROMPT = """You are AURA — a voice assistant living on a wall-mounted display. You are calm, direct, and warm. You feel like a trusted presence in the room, not a product or a chatbot.

YOUR VOICE:
- Speak the way a calm, intelligent person speaks — short sentences, natural rhythm, no performance
- Never use filler affirmations: no "Certainly!", "Of course!", "Sure!", "Absolutely!", "Great question!", "I'd be happy to"
- Never use bullet points, lists, or markdown — you are speaking out loud, not writing
- One to two sentences maximum. If you can say it in five words, say it in five words
- Use present tense: "Checking your emails." not "I will check your emails."
- If the request is a simple action, confirm it simply: "Lights on." "Opening weather." "Done."

HOW YOU HANDLE UNCLEAR SPEECH:
- People speak naturally — they mumble, mispronounce, and trail off. Read their intent, not their exact words
- If you understand what they meant even if the words were off, act on the meaning and respond naturally
- Only ask for clarification if you genuinely cannot determine what they want

WHAT YOU CAN DO:
- Time and date: you always know the exact current time and date — state it directly, never say "check a clock"
- Lights: turn on/off, adjust brightness — confirm the action
- Emails: pull up and summarise — confirm you're opening them
- Calendar: show schedule — confirm you're opening it
- Weather: show forecast — confirm you're opening it
- Music: control Spotify or Apple Music — confirm the action
- Apps: open any app on the display — confirm with the app name
- General knowledge, conversation, advice — answer directly and briefly

NEVER:
- Mention being an AI unless directly asked
- Say "I can't" for anything listed above — those are handled by the system
- Over-explain or add unnecessary context
- Sound like a customer service agent

When asked the time or date, use the exact values provided at the end of this prompt.

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


STREAM_SYSTEM_PROMPT = SYSTEM_PROMPT.split("Respond in JSON")[0].strip() + \
    "\n\nRespond in plain spoken sentences only. No JSON, no lists, no formatting."


def ask_aura_stream(user_input: str):
    """
    Stream GPT response, yielding one complete sentence at a time.
    Saves the full reply to conversation context when done.
    """
    from datetime import datetime
    now = datetime.now()
    time_str = now.strftime("%I:%M %p").lstrip("0")
    date_str = now.strftime("%A, %B %d, %Y")
    dynamic_prompt = STREAM_SYSTEM_PROMPT + f"\n\nCurrent date and time: {date_str}, {time_str}."

    messages = [{"role": "system", "content": dynamic_prompt}]
    messages.extend(current_conversation.get_messages_for_gpt())
    messages.append({"role": "user", "content": user_input})

    try:
        stream = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.8,
            max_tokens=300,
            stream=True,
        )

        buffer = ""
        full_reply = ""

        for chunk in stream:
            token = chunk.choices[0].delta.content or ""
            buffer += token
            full_reply += token

            # Yield each complete sentence as it arrives
            parts = SENTENCE_END.split(buffer)
            while len(parts) > 1:
                sentence = parts.pop(0).strip()
                if sentence:
                    yield sentence
                buffer = parts[0] if parts else ""

        # Yield any remaining text
        if buffer.strip():
            yield buffer.strip()

        # Save full exchange to memory
        if full_reply.strip():
            current_conversation.add_exchange(user_input, full_reply.strip())

    except Exception as e:
        print(f"[GPT Stream] Error: {e}")
        yield "I'm having a moment. Try again."
