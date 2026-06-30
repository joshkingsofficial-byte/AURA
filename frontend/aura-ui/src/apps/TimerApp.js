import React, { useState, useEffect, useRef } from 'react';
import { useAuraSocket } from '../hooks/useAuraSocket';

const WS_URL = 'ws://localhost:8765';

const QUICK_SET = [
  { label: '1 min', seconds: 60 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '20 min', seconds: 1200 },
];

function formatRemaining(seconds) {
  seconds = Math.max(0, Math.round(seconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function TimerApp() {
  const [timers, setTimers] = useState([]); // [{id, label, duration, endsAt}]
  const [now, setNow] = useState(Date.now());
  const sendRef = useRef(null);

  const { send } = useAuraSocket(WS_URL, (msg) => {
    if (msg.type === 'timer_started') {
      setTimers((prev) => [
        ...prev.filter((t) => t.id !== msg.id),
        { id: msg.id, label: msg.label, duration: msg.duration, endsAt: Date.now() + msg.duration * 1000 },
      ]);
    } else if (msg.type === 'timer_done' || msg.type === 'timer_cancelled') {
      setTimers((prev) => prev.filter((t) => t.id !== msg.id));
    }
  });

  useEffect(() => { sendRef.current = send; }, [send]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickSet = (seconds) => {
    send({ type: 'timer_control', action: 'start', seconds });
  };

  const handleCancel = (id) => {
    send({ type: 'timer_control', action: 'cancel', id });
  };

  return (
    <div style={{
      minHeight: '100vh',
      margin: '-32px',
      padding: '32px',
      background: 'radial-gradient(ellipse at 50% 35%, #1a0a2e 0%, #0d0515 45%, #080010 100%)',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '44px' }}>
        <span style={{
          fontSize: '12px', letterSpacing: '0.45em', fontWeight: 200,
          color: '#c8a96e', textShadow: '0 0 20px rgba(200,169,110,0.7)',
        }}>
          TIMER
        </span>
      </div>

      {/* Active timers */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px', marginBottom: '48px' }}>
        {timers.length === 0 ? (
          <div style={{ fontSize: '12px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)' }}>
            NO TIMERS RUNNING
          </div>
        ) : (
          timers.map((t) => {
            const remaining = Math.max(0, (t.endsAt - now) / 1000);
            const progress = t.duration > 0 ? remaining / t.duration : 0;
            const circumference = 2 * Math.PI * 90;
            return (
              <div key={t.id} style={{ position: 'relative', width: '220px', height: '220px' }}>
                <svg width="220" height="220" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="110" cy="110" r="90" fill="none" stroke="rgba(200,169,110,0.12)" strokeWidth="6" />
                  <circle
                    cx="110" cy="110" r="90" fill="none"
                    stroke="#c8a96e" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress)}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 200, color: '#fff' }}>
                    {formatRemaining(remaining)}
                  </div>
                  <div style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(200,169,110,0.6)' }}>
                    {t.label.toUpperCase()}
                  </div>
                  <button
                    onClick={() => handleCancel(t.id)}
                    style={{
                      marginTop: '6px', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(200,169,110,0.2)', color: '#c8a96e',
                      borderRadius: '8px', padding: '4px 14px', cursor: 'pointer',
                      fontSize: '10px', letterSpacing: '0.1em',
                    }}
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick set */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
        {QUICK_SET.map((q) => (
          <button
            key={q.label}
            onClick={() => handleQuickSet(q.seconds)}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(200,169,110,0.2)',
              color: '#c8a96e',
              borderRadius: '12px',
              padding: '14px 22px',
              cursor: 'pointer',
              fontSize: '13px',
              letterSpacing: '0.05em',
              fontWeight: 300,
            }}
          >
            {q.label}
          </button>
        ))}
      </div>

      <div style={{
        textAlign: 'center', marginTop: '48px', fontSize: '10px',
        letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)',
      }}>
        SAY "COMPUTER, SET A TIMER FOR 5 MINUTES"
      </div>
    </div>
  );
}

export default TimerApp;
