import React, { useState, useEffect } from 'react';
import AppGrid from '../components/AppGrid';

function HomePage({ onAppClick, selectedAppIndex, selectionMode, onBack }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const [hovered, setHovered] = useState(false);
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const date = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background: '#000000'
      }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,140,60,0.06) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen px-8 py-6">
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '48px',
          position: 'relative'
        }}>
          {/* Date - left */}
          <div style={{
            fontSize: '13px',
            letterSpacing: '0.3em',
            fontWeight: 200,
            color: 'rgba(200,169,110,0.5)',
            paddingTop: '8px'
          }}>
            {date}
          </div>

          {/* AURA - center */}
          <div style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '11px',
            letterSpacing: '0.4em',
            fontWeight: 200,
            color: '#c8a96e',
            textShadow: '0 0 20px rgba(200,169,110,0.8), 0 0 40px rgba(200,169,110,0.4), 0 0 80px rgba(200,169,110,0.2)',
            animation: 'auraPulse 3s ease-in-out infinite'
          }}>
            AURA
          </div>

          {/* Time - right */}
          <div style={{
            fontSize: '32px',
            fontWeight: 100,
            letterSpacing: '0.05em',
            color: 'rgba(255,255,255,0.92)'
          }}>
            {time}
          </div>
        </div>

        {/* Apps Grid */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '1200px' }}>
            <AppGrid
                onAppClick={onAppClick}
                selectedAppIndex={selectedAppIndex}
                selectionMode={selectionMode}
              />
          </div>
        </div>

        {/* Back hint — tap to return to idle */}
        <div
          onClick={onBack}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '24px',
            paddingBottom: '8px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div style={{
            fontSize: '9px',
            letterSpacing: '0.4em',
            color: hovered ? 'rgba(200,169,110,0.55)' : 'rgba(200,169,110,0.2)',
            transition: 'color 0.3s ease',
            whiteSpace: 'nowrap',
          }}>
            ← GO BACK
          </div>
        </div>
      </div>

    </div>
  );
}

export default HomePage;
