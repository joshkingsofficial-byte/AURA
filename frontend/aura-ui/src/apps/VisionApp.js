import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuraSocket } from '../hooks/useAuraSocket';

const WS_URL = 'ws://localhost:8765';
const GOLD = '#c8a96e';
const GOLD_DIM = 'rgba(200,169,110,0.4)';
const GOLD_FAINT = 'rgba(200,169,110,0.12)';

function captureFrame(videoEl) {
  if (!videoEl || videoEl.readyState < 2) return null;
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth || 640;
  canvas.height = videoEl.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.scale(-1, 1);
  ctx.drawImage(videoEl, -canvas.width, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
}

export default function VisionApp({ onBack }) {
  // phase: 'camera' | 'analyzing' | 'conversation'
  const [phase, setPhase] = useState('camera');
  const [messages, setMessages] = useState([]);   // { role: 'user'|'aura', text }
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [listening, setListening] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const sendRef = useRef(null);
  const capturedImageRef = useRef(null);  // stored frame for follow-ups
  const recRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Camera
  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 } })
      .then((stream) => {
        if (!mounted) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => mounted && setCameraReady(true);
        }
      })
      .catch((e) => console.warn('[VisionApp] Camera:', e.message));
    return () => {
      mounted = false;
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleMessage = useCallback((msg) => {
    if (msg.type === 'vision_result') {
      setIsAnalyzing(false);
      setMessages((prev) => [...prev, { role: 'aura', text: msg.text }]);
      if (phase === 'analyzing') setPhase('conversation');
    }
  }, [phase]);

  const { send } = useAuraSocket(WS_URL, handleMessage);
  useEffect(() => { sendRef.current = send; }, [send]);

  const ask = useCallback((question) => {
    if (!question.trim() || isAnalyzing || !capturedImageRef.current) return;
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setIsAnalyzing(true);
    sendRef.current?.({ type: 'vision_query', query: question, image: capturedImageRef.current });
  }, [isAnalyzing]);

  const capture = useCallback((question = 'What is this?') => {
    const image = captureFrame(videoRef.current);
    if (!image) return;
    capturedImageRef.current = image;
    stopCamera();
    setPhase('analyzing');
    setMessages([{ role: 'user', text: question }]);
    setIsAnalyzing(true);
    sendRef.current?.({ type: 'vision_query', query: question, image });
  }, [stopCamera]);

  const reset = useCallback(() => {
    capturedImageRef.current = null;
    setMessages([]);
    setInput('');
    setPhase('camera');
    setIsAnalyzing(false);
    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      })
      .catch(() => {});
  }, []);

  const submitInput = useCallback(() => {
    if (phase === 'camera') {
      capture(input.trim() || 'What is this?');
    } else {
      ask(input.trim());
    }
    setInput('');
  }, [phase, input, capture, ask]);

  const toggleVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }

    const rec = new SR();
    recRef.current = rec;
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript?.trim();
      if (text) {
        setListening(false);
        if (phase === 'camera') {
          capture(text);
        } else {
          ask(text);
        }
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    setListening(true);
  }, [listening, phase, capture, ask]);

  useEffect(() => () => {
    stopCamera();
    recRef.current?.stop();
  }, [stopCamera]);

  const inConversation = phase === 'conversation';

  return (
    <div style={{
      margin: '-32px',
      minHeight: '100vh',
      background: '#000',
      display: 'flex',
      flexDirection: 'column',
      padding: '40px 32px 32px',
      gap: '24px',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '10px', letterSpacing: '0.5em', color: GOLD_DIM, fontWeight: 200 }}>
          VISION
        </div>
        {inConversation && (
          <button
            onClick={reset}
            style={{
              background: 'transparent',
              border: `1px solid ${GOLD_FAINT}`,
              borderRadius: '20px',
              color: GOLD_DIM,
              fontSize: '9px',
              letterSpacing: '0.25em',
              padding: '6px 14px',
              cursor: 'pointer',
            }}
          >
            NEW CAPTURE
          </button>
        )}
      </div>

      {/* Camera or captured indicator */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '640px',
        alignSelf: 'center',
        aspectRatio: '4/3',
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${GOLD_FAINT}`,
        flexShrink: 0,
        ...(inConversation && { maxWidth: '280px', aspectRatio: '4/3' }),
      }}>
        <video
          ref={videoRef}
          autoPlay muted playsInline
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
            display: inConversation ? 'none' : 'block',
          }}
        />

        {/* Captured frame placeholder */}
        {inConversation && (
          <div style={{
            width: '100%', height: '100%',
            background: 'rgba(200,169,110,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.3em', color: GOLD_DIM }}>
              CAPTURED
            </div>
          </div>
        )}

        {/* Analyzing overlay */}
        {isAnalyzing && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '12px',
          }}>
            <div style={{
              width: '60%', height: '1px',
              background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
              animation: 'scanLine 1.8s ease-in-out infinite',
            }} />
            <div style={{
              fontSize: '9px', letterSpacing: '0.45em', color: GOLD, fontWeight: 200,
              animation: 'auraPulse 1.4s ease-in-out infinite',
            }}>
              THINKING
            </div>
          </div>
        )}

        {/* Camera not ready */}
        {!cameraReady && !inConversation && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#050505',
          }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.12)' }}>
              CAMERA INITIALIZING
            </div>
          </div>
        )}

        {/* Corner brackets */}
        {[
          { top: 10, left: 10, borderTop: `1.5px solid ${GOLD}`, borderLeft: `1.5px solid ${GOLD}` },
          { top: 10, right: 10, borderTop: `1.5px solid ${GOLD}`, borderRight: `1.5px solid ${GOLD}` },
          { bottom: 10, left: 10, borderBottom: `1.5px solid ${GOLD}`, borderLeft: `1.5px solid ${GOLD}` },
          { bottom: 10, right: 10, borderBottom: `1.5px solid ${GOLD}`, borderRight: `1.5px solid ${GOLD}` },
        ].map((s, i) => (
          <div key={i} style={{ position: 'absolute', width: '16px', height: '16px', ...s }} />
        ))}
      </div>

      {/* Conversation messages */}
      {inConversation && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          paddingBottom: '8px',
        }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              padding: '12px 18px',
              borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: m.role === 'user'
                ? 'rgba(200,169,110,0.1)'
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${m.role === 'user' ? 'rgba(200,169,110,0.2)' : 'rgba(255,255,255,0.07)'}`,
              fontSize: '13px',
              fontWeight: 200,
              lineHeight: 1.7,
              color: m.role === 'user' ? GOLD : 'rgba(255,255,255,0.88)',
            }}>
              {m.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input area */}
      <div style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitInput()}
          placeholder={phase === 'camera' ? 'Ask something, or tap the mic...' : 'Ask a follow-up...'}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid rgba(255,255,255,0.08)`,
            borderRadius: '12px',
            padding: '14px 18px',
            color: 'rgba(255,255,255,0.85)',
            fontSize: '13px',
            fontWeight: 200,
            outline: 'none',
          }}
        />

        {/* Mic button */}
        <button
          onClick={toggleVoice}
          disabled={isAnalyzing}
          style={{
            width: '46px', height: '46px',
            borderRadius: '50%',
            background: listening ? 'rgba(200,169,110,0.25)' : GOLD_FAINT,
            border: `1px solid ${listening ? GOLD : GOLD_DIM}`,
            color: listening ? GOLD : GOLD_DIM,
            cursor: isAnalyzing ? 'default' : 'pointer',
            fontSize: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            animation: listening ? 'auraPulse 1s ease-in-out infinite' : 'none',
          }}
        >
          ⬤
        </button>

        {/* Capture / Send button */}
        <button
          onClick={submitInput}
          disabled={isAnalyzing}
          style={{
            padding: '0 20px',
            height: '46px',
            borderRadius: '12px',
            background: isAnalyzing ? 'transparent' : GOLD_FAINT,
            border: `1px solid ${isAnalyzing ? 'rgba(200,169,110,0.15)' : GOLD_DIM}`,
            color: isAnalyzing ? 'rgba(200,169,110,0.25)' : GOLD,
            fontSize: '10px',
            letterSpacing: '0.2em',
            fontWeight: 300,
            cursor: isAnalyzing ? 'default' : 'pointer',
            flexShrink: 0,
          }}
        >
          {phase === 'camera' ? 'CAPTURE' : 'ASK'}
        </button>
      </div>

      {/* Camera hint */}
      {phase === 'camera' && (
        <div style={{
          fontSize: '9px', letterSpacing: '0.3em',
          color: 'rgba(255,255,255,0.1)', textAlign: 'center',
        }}>
          HOLD SOMETHING UP · ASK NATURALLY
        </div>
      )}

      <style>{`
        @keyframes scanLine {
          0%, 100% { transform: translateY(-40px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(40px); opacity: 0; }
        }
        input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
