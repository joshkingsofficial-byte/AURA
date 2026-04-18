import sounddevice as sd
import numpy as np
import tempfile
from openai import OpenAI
import scipy.io.wavfile as wav

client = OpenAI()

def record_audio(duration=4, samplerate=16000):
    print("[STT] Recording...")
    audio = sd.rec(int(duration * samplerate),
                   samplerate=samplerate,
                   channels=1,
                   dtype='float32')
    sd.wait()

    temp = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    wav.write(temp.name, samplerate, (audio * 32767).astype(np.int16))
    print("[STT] Saved recording:", temp.name)
    return temp.name

def transcribe_audio(path):
    print("[STT] Sending audio to Whisper...")
    with open(path, "rb") as f:
        resp = client.audio.transcriptions.create(
            model="whisper-1",
            file=f
        )
    print("[STT] Whisper text:", resp.text)
    return resp.text
