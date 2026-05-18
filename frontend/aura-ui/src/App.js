import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import IdleScreen from "./screens/IdleScreen";
import HomePage from "./screens/HomePage";
import AppView from "./screens/AppView";

const WS_URL = "ws://localhost:8765";

function useAuraSocket(onMessage) {
  const [status, setStatus] = useState("disconnected");
  const wsRef = useRef(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    let timer;
    const connect = () => {
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) return;
      setStatus("connecting");
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => setStatus("connected");
      ws.onclose = () => {
        setStatus("disconnected");
        timer = setTimeout(connect, 3000);
      };
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

  return { status, wsRef };
}

export default function App() {
  const [screen, setScreen] = useState("idle");
  const [currentApp, setCurrentApp] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [spotifyData, setSpotifyData] = useState(null);

  const handleNav = (norm) => {
    if (norm === "go back" || norm.includes("go back") || norm.includes("go home") || norm.includes("go to idle") || norm.includes("back to idle")) {
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
    ) { setScreen("home"); return; }

    if (
      norm === "go home" ||
      norm.includes("go home") ||
      norm.includes("go back") ||
      norm.includes("go to idle") ||
      norm.includes("back to idle") ||
      norm.includes("return to home")
    ) { setCurrentApp(null); setScreen("idle"); return; }

    if (norm.includes("open spotify"))  { setCurrentApp("spotify");  setScreen("app"); return; }
    if (norm.includes("open youtube"))  { setCurrentApp("youtube");  setScreen("app"); return; }
    if (norm.includes("open lights") || norm.includes("open light")) { setCurrentApp("lights"); setScreen("app"); return; }
    if (norm.includes("open weather"))  { setCurrentApp("weather");  setScreen("app"); return; }
    if (norm.includes("open notes") || norm.includes("open to do") || norm.includes("open todo")) { setCurrentApp("notes"); setScreen("app"); return; }
    if (norm.includes("open calendar")) { setCurrentApp("calendar"); setScreen("app"); return; }
    if (norm.includes("open timer") || norm.includes("open alarm")) { setCurrentApp("timer"); setScreen("app"); return; }
    if (norm.includes("open photos"))   { setCurrentApp("photos");   setScreen("app"); return; }
    if (norm.includes("open news"))     { setCurrentApp("news");     setScreen("app"); return; }
    if (norm.includes("open recipe") || norm.includes("open recipes")) { setCurrentApp("recipe"); setScreen("app"); return; }
    if (norm.includes("open memory"))   { setCurrentApp("memory");   setScreen("app"); return; }
    if (norm.includes("open email"))    { setCurrentApp("email");    setScreen("app"); return; }
    if (norm.includes("open settings")) { setCurrentApp("settings"); setScreen("app"); return; }
  };

  const { status, wsRef } = useAuraSocket((msg) => {
    switch (msg.type) {
      case "wake_detected":
      case "wake":
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
        if (msg.target === "home") setScreen("home");
        if (msg.target === "idle") { setCurrentApp(null); setScreen("idle"); }
        if (msg.target === "app" && msg.app) { setCurrentApp(msg.app); setScreen("app"); }
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

      case "gesture_command":
        console.log("🖐️ Gesture:", msg.gesture, "→", msg.command);
        handleNav(msg.command);
        break;

      default:
        break;
    }
  });

  // Dev button — only shows in development, invisible in production
  const DevButton = () => {
    if (process.env.NODE_ENV !== "development") return null;
    return (
      <button
        onClick={() => {
          const cmd = window.prompt("Test command:");
          if (!cmd) return;
          const norm = cmd.toLowerCase().trim().replace(/[.!?]$/g, "");

          // Try nav first
          const navResult = handleNav(norm);
          if (navResult) return;

          // Otherwise send to backend via WebSocket
          setTranscript(cmd);
          setIsThinking(true);
          setReply("");

          const ws = wsRef.current;
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "transcript", text: cmd }));
          } else {
            setReply("Backend not connected. Start the backend first.");
            setIsThinking(false);
          }
        }}
        style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
          background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)",
          border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px",
          padding: "8px 14px", cursor: "pointer", fontSize: "11px",
          backdropFilter: "blur(8px)", letterSpacing: "0.05em"
        }}
      >
        ⌨ dev
      </button>
    );
  };

  if (screen === "home") {
    return (
      <div className="min-h-screen bg-black text-white">
        <HomePage onAppClick={(id) => { setCurrentApp(id); setScreen("app"); }} />
        <DevButton />
      </div>
    );
  }

  if (screen === "app") {
    return (
      <div className="min-h-screen bg-black text-white">
        <AppView
          appName={currentApp}
          spotifyData={spotifyData}
          onBack={() => { setCurrentApp(null); setScreen("home"); }}
        />
        <DevButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <IdleScreen
        isListening={isListening}
        isThinking={isThinking}
        transcript={transcript}
        reply={reply}
        spotifyData={spotifyData}
      />
      <DevButton />
    </div>
  );
}