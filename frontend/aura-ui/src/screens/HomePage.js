import React from 'react';
import AppGrid from '../components/AppGrid';

function HomePage({ onAppClick }) {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const date = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 50% 60%, #1a0a2e 0%, #0d0515 40%, #080010 100%)'
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
            <AppGrid onAppClick={onAppClick} />
          </div>
        </div>

        {/* Nav dots */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '24px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '4px',
            background: 'rgba(200,169,110,0.2)'
          }} />
          <div style={{
            width: '24px',
            height: '8px',
            borderRadius: '4px',
            background: 'rgba(200,169,110,0.5)'
          }} />
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '4px',
            background: 'rgba(200,169,110,0.2)'
          }} />
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes auraPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default HomePage;
