import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuraSocket } from '../hooks/useAuraSocket';

const WS_URL = 'ws://localhost:8765';
const GOLD = '#c8a96e';
const GOLD_DIM = 'rgba(200,169,110,0.5)';
const GOLD_FAINT = 'rgba(200,169,110,0.18)';

const CORNERS = [
  { top: 14, left: 14,  borderTop: `2px solid ${GOLD}`, borderLeft:  `2px solid ${GOLD}` },
  { top: 14, right: 14, borderTop: `2px solid ${GOLD}`, borderRight: `2px solid ${GOLD}` },
  { bottom: 14, left: 14,  borderBottom: `2px solid ${GOLD}`, borderLeft:  `2px solid ${GOLD}` },
  { bottom: 14, right: 14, borderBottom: `2px solid ${GOLD}`, borderRight: `2px solid ${GOLD}` },
];

export default function VisionOverlay() {
  // phase: 'hidden' | 'camera' | 'analyzing' | 'result'
  const [phase, setPhase] = useState('hidden');
  const [result, setResult] = useState(null);

  const videoRef   = useRef(null);
  const streamRef  = useRef(null);
  const sendRef    = useRef(null);
  const queryRef   = useRef('What is this?');
  const timerRef   = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearTimeout(timerRef.current);
    stopCamera();
    setPhase('hidden');
    setResult(null);
  }, [stopCamera]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const w = video?.videoWidth  || 640;
    const h = video?.videoHeight || 480;
    const canvas = document.createElement('canvas');
    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (video && video.readyState >= 2) {
      // mirror to match what the user saw
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, w, h);
    }
    const image = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
    stopCamera();
    setPhase('analyzing');
    sendRef.current?.({ type: 'vision_query', query: queryRef.current, image });
  }, [stopCamera]);

  const handleMessage = useCallback(
    (msg) => {
      if (msg.type === 'vision_request') {
        clearTimeout(timerRef.current);
        queryRef.current = msg.query || 'What is this?';
        setResult(null);
        setPhase('camera');

        navigator.mediaDevices
          .getUserMedia({ video: { width: 640, height: 480 } })
          .then((stream) => {
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
            // Capture after 1.2 s — camera warm-up + user sees the preview briefly
            timerRef.current = setTimeout(capture, 1200);
          })
          .catch(() => {
            // No browser camera: send query without image; backend will try cv2
            setPhase('analyzing');
            sendRef.current?.({ type: 'vision_query', query: queryRef.current });
          });
      } else if (msg.type === 'vision_result') {
        clearTimeout(timerRef.current);
        stopCamera();
        setResult(msg.text);
        setPhase('result');
        // Auto-dismiss after 8 s
        timerRef.current = setTimeout(dismiss, 8000);
      }
    },
    [capture, dismiss, stopCamera]
  );

  const { send } = useAuraSocket(WS_URL, handleMessage);
  useEffect(() => { sendRef.current = send; }, [send]);

  // Cleanup on unmount
  useEffect(() => () => { stopCamera(); clearTimeout(timerRef.current); }, [stopCamera]);

  if (phase === 'hidden') return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(0,0,0,0.93)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '28px',
      }}
      onClick={phase === 'result' ? dismiss : undefined}
    >
      {/* Close */}
      <button
        onClick={(e) => { e.stopPropagation(); dismiss(); }}
        style={{
          position: 'absolute',
          top: 24,
          right: 28,
          background: 'transparent',
          border: `1px solid ${GOLD_FAINT}`,
          borderRadius: 8,
          color: GOLD_DIM,
          fontSize: 18,
          width: 36,
          height: 36,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
        }}
        aria-label="Close"
      >
        &times;
      </button>

      {/* Status label */}
      <div
        style={{
          fontSize: '10px',
          letterSpacing: '0.5em',
          color: GOLD_DIM,
          fontWeight: 200,
          animation: phase === 'analyzing' ? 'auraPulse 1.3s ease-in-out infinite' : 'none',
        }}
      >
        {phase === 'camera' ? 'SCANNING' : phase === 'analyzing' ? 'ANALYZING' : 'VISION AI'}
      </div>

      {/* Viewfinder */}
      {(phase === 'camera' || phase === 'analyzing') && (
        <div
          style={{
            position: 'relative',
            width: 480,
            maxWidth: '88vw',
            aspectRatio: '4 / 3',
            borderRadius: 16,
            overflow: 'hidden',
            border: `1px solid ${GOLD_FAINT}`,
            background: '#050505',
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
          {CORNERS.map((s, i) => (
            <div key={i} style={{ position: 'absolute', width: 22, height: 22, ...s }} />
          ))}

          {/* Scan line (camera phase — sweeps down over 1.2 s) */}
          {phase === 'camera' && (
            <div
              style={{
                position: 'absolute',
                left: '8%',
                right: '8%',
                height: 2,
                background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
                top: 0,
                animation: 'visionScanDown 1.2s ease-in-out forwards',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Analyzing overlay */}
          {phase === 'analyzing' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.45em',
                  color: GOLD,
                  fontWeight: 200,
                  animation: 'auraPulse 1.2s ease-in-out infinite',
                }}
              >
                ANALYZING
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result card */}
      {phase === 'result' && result && (
        <div
          style={{
            maxWidth: 580,
            width: '88vw',
            padding: '28px 32px',
            background: GOLD_FAINT,
            border: `1px solid rgba(200,169,110,0.2)`,
            borderRadius: 20,
            fontSize: 15,
            fontWeight: 200,
            lineHeight: 1.8,
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
          }}
        >
          {result}
        </div>
      )}

      {/* Dismiss hint */}
      {phase === 'result' && (
        <div
          style={{
            fontSize: '9px',
            letterSpacing: '0.4em',
            color: 'rgba(255,255,255,0.12)',
          }}
        >
          TAP ANYWHERE TO DISMISS
        </div>
      )}

      <style>{`
        @keyframes visionScanDown {
          0%   { top: 0%;            opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { top: calc(100% - 2px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
