import React from 'react';

function IdleScreen({ isListening, isThinking, transcript, reply }) {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: '#000000' }}
    >
      {/* Subtle ambient glow — only when active */}
      {(isListening || isThinking) && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,169,110,0.06) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Content — sits below the overlay orb (zIndex < 50) */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '0 24px',
        }}
      >
        {/* AURA wordmark */}
        <div
          style={{
            fontSize: '11px',
            letterSpacing: '0.5em',
            fontWeight: 200,
            color: '#c8a96e',
            textShadow: isListening
              ? '0 0 30px rgba(200,169,110,0.9), 0 0 70px rgba(200,169,110,0.5)'
              : '0 0 16px rgba(200,169,110,0.6), 0 0 40px rgba(200,169,110,0.25)',
            animation: 'auraPulse 3s ease-in-out infinite',
            marginBottom: '24px',
          }}
        >
          AURA
        </div>

        {/* Thinking */}
        {isThinking && (
          <div
            style={{
              fontSize: '10px',
              letterSpacing: '0.4em',
              fontWeight: 200,
              color: 'rgba(200,169,110,0.45)',
              animation: 'auraPulse 1.6s ease-in-out infinite',
            }}
          >
            THINKING
          </div>
        )}

        {/* Transcript */}
        {transcript && !isThinking && (
          <div
            style={{
              fontSize: '13px',
              color: 'rgba(200,169,110,0.6)',
              maxWidth: '520px',
              lineHeight: 1.7,
              fontWeight: 200,
            }}
          >
            &ldquo;{transcript}&rdquo;
          </div>
        )}

        {/* Reply */}
        {reply && (
          <div
            style={{
              fontSize: '15px',
              fontWeight: 200,
              color: 'rgba(255,255,255,0.85)',
              marginTop: '20px',
              maxWidth: '520px',
              lineHeight: 1.75,
            }}
          >
            {reply}
          </div>
        )}
      </div>
    </div>
  );
}

export default IdleScreen;
