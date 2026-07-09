import sounddevice as sd
import numpy as np
import tempfile
import collections
import scipy.io.wavfile as wav
from openai import OpenAI

client = OpenAI()

SAMPLERATE = 16000
ENERGY_THRESHOLD = 0.015   # minimum RMS to count as speech
SILENCE_TIMEOUT = 0.8      # seconds of silence before stopping
MAX_DURATION = 10          # hard cap in seconds
MIN_SPEECH_DURATION = 0.4  # ignore recordings shorter than this
PRE_BUFFER_SECS = 0.3      # seconds to keep before speech onset


def record_audio(duration=None, samplerate=SAMPLERATE):
    """
    VAD-based recording with pre-buffer: keeps the 300ms before speech onset
    so Whisper gets the full first word, not just the tail of it.
    """
    print("[STT] Listening for speech...")

    chunk_size = int(samplerate * 0.05)  # 50ms chunks
    max_chunks = int(MAX_DURATION / 0.05)
    silence_chunks_needed = int(SILENCE_TIMEOUT / 0.05)
    pre_buffer_chunks = int(PRE_BUFFER_SECS / 0.05)  # 6 chunks = 300ms

    pre_buffer = collections.deque(maxlen=pre_buffer_chunks)
    frames = []
    speech_started = False
    silence_chunks = 0
    total_chunks = 0

    with sd.InputStream(samplerate=samplerate, channels=1, dtype='float32') as stream:
        while total_chunks < max_chunks:
            chunk, _ = stream.read(chunk_size)
            rms = float(np.sqrt(np.mean(chunk ** 2)))

            if not speech_started:
                pre_buffer.append(chunk.copy())
                if rms > ENERGY_THRESHOLD:
                    print("[STT] Speech detected, recording...")
                    speech_started = True
                    # Prepend buffered audio so the first word isn't clipped
                    frames.extend(pre_buffer)
                    silence_chunks = 0
            else:
                frames.append(chunk.copy())
                if rms < ENERGY_THRESHOLD:
                    silence_chunks += 1
                    if silence_chunks >= silence_chunks_needed:
                        print("[STT] Silence detected, stopping.")
                        break
                else:
                    silence_chunks = 0

            total_chunks += 1

    if not speech_started:
        print("[STT] No speech detected.")
        return None

    audio = np.concatenate(frames, axis=0)
    duration_recorded = len(audio) / samplerate

    if duration_recorded < MIN_SPEECH_DURATION:
        print(f"[STT] Too short ({duration_recorded:.2f}s), ignoring.")
        return None

    temp = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    wav.write(temp.name, samplerate, (audio * 32767).astype(np.int16))
    print(f"[STT] Recorded {duration_recorded:.2f}s → {temp.name}")
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
