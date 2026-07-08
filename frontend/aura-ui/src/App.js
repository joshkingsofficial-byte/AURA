import React, { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import IdleScreen from "./screens/IdleScreen";
import HomePage from "./screens/HomePage";
import AppView from "./screens/AppView";
import WidgetOverlay from "./components/WidgetOverlay";
import VisionOverlay from "./components/VisionOverlay";
import { APPS } from "./components/AppGrid";
import { useRealtimeVoice } from "./hooks/useRealtimeVoice";

const WS_URL = "ws://localhost:8765";

function useAuraSocket(onMessage) {
  const wsRef = useRef(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    let timer;
    const connect = () => {
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) return;
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => {};
      ws.onclose = () => { timer = setTimeout(connect, 3000); };
      ws.onerror = () => {};
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          onMessageRef.current && onMessageRef.current(msg);
        } catch {}
      };
    };
    connect();
    return () => {
      clearTimeout(timer);
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
        wsRef.current = null;
      }
    };
  }, []);

  return { wsRef };
}

const SLEEP_AFTER_MS = 3 * 60 * 1000; // 3 minutes

// Two soft sine tones — gentle enough not to startle, distinct from the voice-start ding
function auraChime() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    [[440, 0], [554.37, 0.35]].forEach(([freq, delay]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + delay;
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.10, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.9);
    });
  } catch (e) {}
}

export default function App() {
  const [screen, setScreen] = useState("idle");
  const [currentApp, setCurrentApp] = useState(null);
  const [selectedAppIndex, setSelectedAppIndex] = useState(0);
  const [selectionMode, setSelectionMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [spotifyData, setSpotifyData] = useState(null);
  const [sleeping, setSleeping] = useState(false);

  const screenHistory = useRef([]);
  const screenRef = useRef(screen);
  const currentAppRef = useRef(currentApp);
  const sleepTimer = useRef(null);
  const sessionStatusRef = useRef('idle');

  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { currentAppRef.current = currentApp; }, [currentApp]);

  const wake = useCallback(() => {
    setSleeping(false);
    resetSleepTimer();
  }, []); // eslint-disable-line

  const resetSleepTimer = useCallback(() => {
    clearTimeout(sleepTimer.current);
    sleepTimer.current = setTimeout(() => setSleeping(true), SLEEP_AFTER_MS);
  }, []);

  useEffect(() => {
    resetSleepTimer();
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'pointerdown'];
    events.forEach(e => window.addEventListener(e, wake, { passive: true }));
    return () => {
      clearTimeout(sleepTimer.current);
      events.forEach(e => window.removeEventListener(e, wake));
    };
  }, [wake, resetSleepTimer]);

  const navigateTo = (newScreen, newApp = null) => {
    screenHistory.current.push({ screen: screenRef.current, currentApp: currentAppRef.current });
    setScreen(newScreen);
    setCurrentApp(newApp);
  };

  const goBack = () => {
    if (screenHistory.current.length === 0) return;
    const prev = screenHistory.current.pop();
    setScreen(prev.screen);
    setCurrentApp(prev.currentApp);
    setTranscript("");
    setReply("");
  };

  const handleNav = (norm) => {
    if (
      norm.includes("go back") ||
      norm.includes("go backwards") ||
      norm.includes("take me back") ||
      norm.includes("return") ||
      norm === "back"
    ) { goBack(); return true; }

    if (
      norm === "go home" ||
      norm.includes("go home") ||
      norm.includes("go to idle") ||
      norm.includes("back to idle") ||
      norm.includes("return to home")
    ) {
      screenHistory.current = [];
      setCurrentApp(null);
      setScreen("idle");
      setTranscript("");
      setReply("");
      return true;
    }

    if (
      norm.includes("go to home page") ||
      norm.includes("go to the home page") ||
      norm.includes("show home page") ||
      norm.includes("open home") ||
      norm.includes("go to apps") ||
      norm.includes("show apps") ||
      norm.includes("open apps") ||
      norm.includes("show me apps")
    ) { navigateTo("home"); return true; }

    if (norm.includes("open music") || norm.includes("open spotify")) { navigateTo("app", "music"); return true; }
    if (norm.includes("open youtube"))  { navigateTo("app", "youtube");  return true; }
    if (norm.includes("open lights") || norm.includes("open light")) { navigateTo("app", "lights"); return true; }
    if (norm.includes("open weather"))  { navigateTo("app", "weather");  return true; }
    if (norm.includes("open tasks") || norm.includes("open to do") || norm.includes("open todo") || norm.includes("open notes")) { navigateTo("app", "tasks"); return true; }
    if (norm.includes("open calendar")) { navigateTo("app", "calendar"); return true; }
    if (norm.includes("open photos"))   { navigateTo("app", "photos");   return true; }
    if (norm.includes("open news"))     { navigateTo("app", "news");     return true; }
    if (norm.includes("open recipe") || norm.includes("open recipes")) { navigateTo("app", "recipe"); return true; }
    if (norm.includes("open email"))    { navigateTo("app", "email");    return true; }
    if (norm.includes("open settings")) { navigateTo("app", "settings"); return true; }
  };

  // Stable refs so onNavigate useCallback never goes stale
  const navigateToRef = useRef(navigateTo);
  const goBackRef = useRef(goBack);
  navigateToRef.current = navigateTo;
  goBackRef.current = goBack;

  const onNavigate = useCallback(({ target, app }) => {
    if (target === 'back') {
      goBackRef.current();
    } else if (target === 'idle') {
      screenHistory.current = [];
      setCurrentApp(null);
      setScreen('idle');
      setTranscript('');
      setReply('');
    } else if (target === 'home') {
      navigateToRef.current('home');
    } else if (target === 'app' && app) {
      navigateToRef.current('app', app);
    }
  }, []); // eslint-disable-line

  const onWake = useCallback(() => {
    setSleeping(false);
    resetSleepTimer();
    setIsListening(true);
    setIsThinking(false);
    setTranscript('');
    setReply('');
  }, [resetSleepTimer]); // eslint-disable-line

  const { wsRef } = useAuraSocket((msg) => {
    switch (msg.type) {
      case "wake_detected":
      case "wake":
        wake();
        setIsListening(true);
        setIsThinking(false);
        setReply("");
        setTranscript("");
        break;

      case "thinking":
        setIsThinking(true);
        break;

      case "transcript": {
        if (!msg.text) break;
        setTranscript(msg.text);
        const norm = msg.text.toLowerCase().trim().replace(/[.!?]$/g, "");
        handleNav(norm);
        break;
      }

      case "navigate":
        if (msg.target === "back") goBack();
        if (msg.target === "home") navigateTo("home");
        if (msg.target === "idle") { screenHistory.current = []; setCurrentApp(null); setScreen("idle"); }
        if (msg.target === "app" && msg.app) navigateTo("app", msg.app);
        break;

      case "reply":
        if (msg.text) setReply(msg.text);
        setIsListening(false);
        setIsThinking(false);
        break;

      case "done":
        setIsListening(false);
        setIsThinking(false);
        break;

      case "reminder": {
        if (!msg.text) break;
        const priority = msg.priority ?? 2;

        // Priority 0 = silent (shouldn't reach frontend, but guard anyway)
        if (priority < 1) break;

        // Priority 1+ = show on screen
        setReply(msg.text);
        wake();

        // Priority 2 = soft spoken (only when AURA isn't already talking)
        // Priority 3 = urgent (interrupt regardless)
        const voiceIdle = sessionStatusRef.current === 'idle';
        if (priority >= 2 && (voiceIdle || priority >= 3) && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          // Soft two-note chime first, then speak
          auraChime();
          setTimeout(() => {
            const utter = new SpeechSynthesisUtterance(msg.text);
            utter.rate = 0.85;
            utter.pitch = 1.0;
            utter.volume = 0.85;
            window.speechSynthesis.speak(utter);
          }, 900);
        }
        break;
      }

      case "music_update": {
        const t = msg.track;
        if (!t || !t.id) {
          setSpotifyData(null);
        } else {
          setSpotifyData({
            track: t.name || "",
            artist: t.artists || "",
            album: t.album || "",
            album_art: t.album_image || null,
            is_playing: !!t.is_playing,
            playing: !!t.is_playing,
          });
        }
        break;
      }

      case "gesture_command": {
        const { gesture } = msg;
        console.log(`🖐️ Gesture: ${gesture} | screen: ${screen} | selected: ${APPS[selectedAppIndex]?.name}`);

        if (gesture === 'fist') {
          if (screen === 'idle') {
            console.log('👊 Fist on idle → apps grid');
            navigateTo('home');
            setSelectionMode(true);
          } else if (screen === 'home') {
            const app = APPS[selectedAppIndex];
            console.log(`👊 Fist on apps → opening ${app.name}`);
            navigateTo('app', app.id);
            setSelectionMode(false);
          } else if (screen === 'app') {
            console.log('👊 Fist inside app → interact');
          }
        } else if (gesture === 'point_up') {
          if (screen === 'home') {
            setSelectedAppIndex((prev) => {
              const next = (prev - 1 + APPS.length) % APPS.length;
              console.log(`👆 Point up → ${APPS[next].name}`);
              return next;
            });
          }
        } else if (gesture === 'point_down') {
          if (screen === 'home') {
            setSelectedAppIndex((prev) => {
              const next = (prev + 1) % APPS.length;
              console.log(`👇 Point down → ${APPS[next].name}`);
              return next;
            });
          }
        } else if (gesture === 'palm_open') {
          if (screen === 'app') {
            console.log('🖐️ Palm open → back');
            goBack();
            setSelectionMode(true);
          } else if (screen === 'home') {
            console.log('🖐️ Palm open → back');
            setSelectionMode(false);
            goBack();
          }
        }
        break;
      }

      default:
        break;
    }
  });

  // Realtime API voice pipeline — replaces OpenWakeWord + Whisper + GPT + TTS
  const { startSession, endSession, sessionStatus, micVolumeRef } = useRealtimeVoice({
    wsRef,
    onNavigate,
    onWake,
    setIsListening,
    setIsThinking,
    setReply,
  });
  sessionStatusRef.current = sessionStatus;

  // Dev buttons — only show in development
  const DevButton = () => {
    if (process.env.NODE_ENV !== "development") return null;
    return (
      <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999, display: "flex", gap: "8px" }}>
        {/* Tap-to-talk: manually trigger AURA voice session */}
        <button
          onClick={() => {
            if (sessionStatus === 'idle') startSession();
            else endSession();
          }}
          style={{
            background: sessionStatus === 'idle' ? "rgba(255,255,255,0.08)" : "rgba(200,169,110,0.3)",
            color: "rgba(255,255,255,0.8)",
            border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px",
            padding: "8px 14px", cursor: "pointer", fontSize: "11px",
            backdropFilter: "blur(8px)", letterSpacing: "0.05em"
          }}
        >
          {sessionStatus === 'idle' ? '🎙 talk' : '⏹ stop'}
        </button>
        {/* Nav tester */}
        <button
          onClick={() => {
            const cmd = window.prompt("Test nav (e.g. 'open spotify', 'go back'):");
            if (!cmd) return;
            handleNav(cmd.toLowerCase().trim().replace(/[.!?]$/g, ""));
          }}
          style={{
            background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)",
            border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px",
            padding: "8px 14px", cursor: "pointer", fontSize: "11px",
            backdropFilter: "blur(8px)", letterSpacing: "0.05em"
          }}
        >
          ⌨ nav
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white" style={{ position: 'relative' }}>
      {/* Sleep overlay — fades screen to black after inactivity */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'black',
        opacity: sleeping ? 1 : 0,
        pointerEvents: sleeping ? 'auto' : 'none',
        transition: sleeping ? 'opacity 3s ease' : 'opacity 0.8s ease',
      }} onClick={wake} />

      <WidgetOverlay
        isListening={isListening}
        isThinking={isThinking}
        spotifyData={spotifyData}
        screen={screen}
        micVolumeRef={micVolumeRef}
      />
      {/* VisionOverlay handles voice-triggered vision — suppressed when Vision app is open to avoid camera conflict */}
      {!(screen === 'app' && currentApp === 'vision') && <VisionOverlay />}

      {screen === "idle" && (
        <IdleScreen
          isListening={isListening}
          isThinking={isThinking}
          transcript={transcript}
          reply={reply}
        />
      )}

      {screen === "home" && (
        <HomePage
          onAppClick={(id) => { navigateTo("app", id); setSelectionMode(false); }}
          selectedAppIndex={selectedAppIndex}
          selectionMode={selectionMode}
          onBack={goBack}
        />
      )}

      {screen === "app" && (
        <AppView
          appName={currentApp}
          spotifyData={spotifyData}
          onBack={goBack}
        />
      )}

      <DevButton />
    </div>
  );
}