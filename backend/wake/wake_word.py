import threading
import numpy as np
import pyaudio
import openwakeword
from openwakeword.model import Model

CHUNK = 1280        # 80ms at 16kHz — openwakeword's expected chunk size
SAMPLERATE = 16000
THRESHOLD = 0.65    # detection confidence threshold


class WakeWordListener:
    def __init__(self, callback=None):
        print("[Wake] Loading OpenWakeWord — Hey Jarvis model")
        openwakeword.utils.download_models()

        self.model = Model(
            wakeword_models=["hey_jarvis_v0.1.onnx"],
            inference_framework="onnx"
        )
        self.callback = callback
        self.is_listening = False
        self.thread = None
        self.pa = pyaudio.PyAudio()
        print("[Wake] Say 'Hey Jarvis' to activate AURA.\n")

    def start(self):
        if self.is_listening:
            return
        self.is_listening = True
        self.thread = threading.Thread(target=self._listen, daemon=True)
        self.thread.start()
        print("[Wake] Listener started.")

    def stop(self):
        self.is_listening = False
        if self.thread:
            self.thread.join(timeout=2)
        self.pa.terminate()
        print("[Wake] Listener stopped.")

    def _listen(self):
        stream = self.pa.open(
            rate=SAMPLERATE,
            channels=1,
            format=pyaudio.paInt16,
            input=True,
            frames_per_buffer=CHUNK
        )
        try:
            while self.is_listening:
                raw = stream.read(CHUNK, exception_on_overflow=False)
                audio = np.frombuffer(raw, dtype=np.int16)
                prediction = self.model.predict(audio)

                for name, score in prediction.items():
                    if score >= THRESHOLD:
                        print(f"[Wake] Detected '{name}' (score: {score:.2f})")
                        self.model.reset()
                        if self.callback:
                            self.callback()
                        break
        except Exception as e:
            print(f"[Wake] Error: {e}")
        finally:
            stream.stop_stream()
            stream.close()
