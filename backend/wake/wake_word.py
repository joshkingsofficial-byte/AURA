# wake/wake_word.py — Porcupine wake-word listener with callback support
import pvporcupine
import pyaudio
import struct
import threading


class WakeWordListener:
    def __init__(self, keyword="computer", callback=None):
        """
        Initialize Porcupine wake word listener.
        
        Args:
            keyword: Built-in keyword to detect (e.g., "computer")
            callback: Function to call when wake word is detected
        """
        print("[Wake] Using Porcupine keyword:", keyword)

        # Porcupine access key
        ACCESS_KEY = "C/GbgEgHE9y+nXGU1NdM0Ictqf72eE3JzGDxLyxcEdfm65eDPR7vVw=="

        # Create Porcupine instance with built-in keyword
        self.porcupine = pvporcupine.create(
            access_key=ACCESS_KEY,
            keywords=[keyword]
        )

        self.callback = callback
        self.is_listening = False
        self.thread = None

        # Initialize PyAudio
        self.pa = pyaudio.PyAudio()
        self.stream = self.pa.open(
            rate=self.porcupine.sample_rate,
            channels=1,
            format=pyaudio.paInt16,
            input=True,
            frames_per_buffer=self.porcupine.frame_length
        )

        print(f"[Wake] Say '{keyword}' to activate AURA.\n")

    def start(self):
        """Start the wake word listener in a separate thread."""
        if self.is_listening:
            print("[Wake] Listener is already running.")
            return

        self.is_listening = True
        self.thread = threading.Thread(target=self._listen, daemon=True)
        self.thread.start()
        print("[Wake] Listener started.")

    def stop(self):
        """Stop the wake word listener and clean up resources."""
        if not self.is_listening:
            print("[Wake] Listener is not running.")
            return

        self.is_listening = False
        if self.thread and self.thread is not threading.current_thread():
            self.thread.join()
        self._cleanup()
        print("[Wake] Listener stopped and resources cleaned up.")

    def _cleanup(self):
        self.stream.stop_stream()
        self.stream.close()
        self.porcupine.delete()
        self.pa.terminate()

    def _listen(self):
        """Internal method to listen for the wake word."""
        try:
            while self.is_listening:
                pcm = self.stream.read(
                    self.porcupine.frame_length,
                    exception_on_overflow=False
                )
                pcm = struct.unpack_from("h" * self.porcupine.frame_length, pcm)
                result = self.porcupine.process(pcm)
                if result >= 0:
                    print("[Wake] Wake word detected!")
                    if self.callback:
                        try:
                            self.callback()
                        except Exception as e:
                            print(f"[Wake] Error handling wake callback: {e}")
        except Exception as e:
            print(f"[Wake] Error in listener: {e}")
        finally:
            if self.is_listening:
                self.is_listening = False
                self._cleanup()