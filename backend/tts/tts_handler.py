from openai import OpenAI
import tempfile
import os
import platform

client = OpenAI()

# Injected by main.py to mute wake listener while speaking
_set_speaking = None

VOICE_INSTRUCTIONS = """Speak as a calm, warm presence in someone's home.
Natural pacing — not rushed, not slow. Confident and clear.
Short pauses between sentences. No dramatic emphasis.
Sound like a person, not an announcement."""

def generate_tts_file(text, voice="nova"):
    """Generate TTS audio and return the temp file path. Does not play."""
    try:
        response = client.audio.speech.create(
            model="gpt-4o-mini-tts",
            voice=voice,
            input=text,
            instructions=VOICE_INSTRUCTIONS
        )
        temp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
        temp.write(response.read())
        temp.close()
        return temp.name
    except Exception as e:
        print("[TTS] Generate error:", e)
        return None


def play_audio_file(path):
    """Play a pre-generated audio file and delete it after."""
    if not path:
        return
    if _set_speaking:
        _set_speaking(True)
    try:
        if platform.system() == "Darwin":
            os.system(f"afplay '{path}'")
        else:
            os.system(f"mpg123 '{path}'")
    finally:
        if _set_speaking:
            _set_speaking(False)
        try:
            os.unlink(path)
        except Exception:
            pass


def synthesize_speech(text, voice="nova"):
    """Generate and play TTS in one blocking call."""
    print("[TTS] Generating audio...")
    path = generate_tts_file(text, voice)
    print("[TTS] Playing:", path)
    play_audio_file(path)
