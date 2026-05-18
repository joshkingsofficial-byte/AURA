import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuraSocket } from '../hooks/useAuraSocket';

const WS_URL = 'ws://localhost:8765';
const GOLD = '#c8a96e';
const GOLD_DIM = 'rgba(200,169,110,0.4)';
const GOLD_FAINT = 'rgba(200,169,110,0.12)';

function captureFrameFromVideo(videoEl) {
  if (!videoEl || videoEl.readyState < 2) return null;
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth || 640;
  canvas.height = videoEl.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.scale(-1, 1);
  ctx.drawImage(videoEl, -canvas.width, 0, canvas.width, canvas.height);
  // strip the data:image/jpeg;base64, prefix
  return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
}

export default function VisionApp({ onBack }) {
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const sendRef = useRef(null);

  // Camera preview
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

  const handleMessage = useCallback((msg) => {
    if (msg.type === 'vision_analyzing') {
      setIsAnalyzing(true);
      setResult(null);
    } else if (msg.type === 'vision_result') {
      setIsAnalyzing(false);
      setResult(msg.text);
    } else if (msg.type === 'vision_request') {
      // Voice trigger: backend asked us to capture and send a frame
      const image = captureFrameFromVideo(videoRef.current);
      if (image && sendRef.current) {
        setIsAnalyzing(true);
        setResult(null);
        sendRef.current({ type: 'vision_query', query: msg.query || 'What is this?', image });
      }
    }
  }, []);

  const { send } = useAuraSocket(WS_URL, handleMessage);

  useEffect(() => { sendRef.current = send; }, [send]);

  const scan = (query = 'What is this? Describe what you see in detail.') => {
    if (isAnalyzing) return;
    const image = captureFrameFromVideo(videoRef.current);
    setIsAnalyzing(true);
    setResult(null);
    send({ type: 'vision_query', query, image: image || undefined });
  };

  return (
    <div
      style={{
        margin: '-32px',
        minHeight: '100vh',
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '28px',
        padding: '40px 32px',
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: '10px',
          letterSpacing: '0.5em',
          color: GOLD_DIM,
          fontWeight: 200,
        }}
      >
        VISION AI
      </div>

      {/* Camera viewfinder */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '640px',
          aspectRatio: '4/3',
          borderRadius: '16px',
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${GOLD_FAINT}`,
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
            display: 'block',
          }}
        />

        {/* Corner brackets */}
        {[
          { top: 14, left: 14, borderTop: `2px solid ${GOLD}`, borderLeft: `2px solid ${GOLD}` },
          { top: 14, right: 14, borderTop: `2px solid ${GOLD}`, borderRight: `2px solid ${GOLD}` },
          { bottom: 14, left: 14, borderBottom: `2px solid ${GOLD}`, borderLeft: `2px solid ${GOLD}` },
          { bottom: 14, right: 14, borderBottom: `2px solid ${GOLD}`, borderRight: `2px solid ${GOLD}` },
        ].map((s, i) => (
          <div
            key={i}
            style={{ position: 'absolute', width: '22px', height: '22px', ...s }}
          />
        ))}

        {/* Crosshair */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '44px',
            height: '44px',
            pointerEvents: 'none',
          }}
        >
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: GOLD_DIM }} />
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: GOLD_DIM }} />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              border: `1px solid ${GOLD_DIM}`,
            }}
          />
        </div>

        {/* Analyzing overlay */}
        {isAnalyzing && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.55)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
            }}
          >
            {/* Scanning line animation */}
            <div
              style={{
                width: '60%',
                height: '1px',
                background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
                animation: 'scanLine 1.8s ease-in-out infinite',
              }}
            />
            <div
              style={{
                fontSize: '10px',
                letterSpacing: '0.45em',
                color: GOLD,
                fontWeight: 200,
                animation: 'auraPulse 1.4s ease-in-out infinite',
              }}
            >
              ANALYZING
            </div>
          </div>
        )}

        {/* Camera not ready placeholder */}
        {!cameraReady && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#050505',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                letterSpacing: '0.3em',
                color: 'rgba(255,255,255,0.15)',
              }}
            >
              CAMERA INITIALIZING
            </div>
          </div>
        )}
      </div>

      {/* Scan buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { label: 'WHAT IS THIS?', query: 'What is this? Identify and describe it in detail.' },
          { label: 'READ TEXT', query: 'Read all text you can see in this image.' },
          { label: 'DESCRIBE SCENE', query: 'Describe the entire scene in this image.' },
        ].map(({ label, query }) => (
          <button
            key={label}
            onClick={() => scan(query)}
            disabled={isAnalyzing}
            style={{
              padding: '12px 24px',
              background: isAnalyzing ? 'transparent' : GOLD_FAINT,
              border: `1px solid ${isAnalyzing ? 'rgba(200,169,110,0.15)' : GOLD_DIM}`,
              borderRadius: '32px',
              color: isAnalyzing ? 'rgba(200,169,110,0.25)' : GOLD,
              fontSize: '10px',
              letterSpacing: '0.25em',
              fontWeight: 300,
              cursor: isAnalyzing ? 'default' : 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Result */}
      {result && (
        <div
          style={{
            maxWidth: '640px',
            width: '100%',
            padding: '24px 28px',
            background: 'rgba(200,169,110,0.04)',
            border: `1px solid ${GOLD_FAINT}`,
            borderRadius: '16px',
            fontSize: '14px',
            fontWeight: 200,
            lineHeight: 1.75,
            color: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {result}
        </div>
      )}

      {/* Voice hint */}
      <div
        style={{
          fontSize: '9px',
          letterSpacing: '0.35em',
          color: 'rgba(255,255,255,0.12)',
          textAlign: 'center',
        }}
      >
        SAY &ldquo;WHAT IS THIS?&rdquo; TO SCAN WITH VOICE
      </div>

      <style>{`
        @keyframes scanLine {
          0%, 100% { transform: translateY(-60px); opacity: 0; }
          20%       { opacity: 1; }
          80%       { opacity: 1; }
          100%      { transform: translateY(60px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
