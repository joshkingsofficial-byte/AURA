from openai import OpenAI
import tempfile
import os
import platform

client = OpenAI()

def synthesize_speech(text, voice="alloy"):
    try:
        print("[TTS] Generating audio...")
        response = client.audio.speech.create(
            model="gpt-4o-mini-tts",
            voice=voice,
            input=text
        )

        temp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
        temp.write(response.read())
        temp.close()

        print("[TTS] Playing:", temp.name)
        if platform.system() == "Darwin":
            os.system(f"afplay '{temp.name}'")
        else:
            os.system(f"mpg123 '{temp.name}'")

    except Exception as e:
        print("[TTS] Error:", e)
