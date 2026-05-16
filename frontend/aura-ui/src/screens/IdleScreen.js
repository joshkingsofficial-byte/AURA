import React from 'react';

function IdleScreen({ isListening, isThinking, transcript, reply, spotifyData }) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).toUpperCase();

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
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
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* AURA - with pulsing animation */}
        <div
          className={isListening ? 'aura-text aura-listening' : 'aura-text'}
          style={{
            fontSize: '11px',
            letterSpacing: '0.4em',
            fontWeight: 200,
            color: '#c8a96e',
            textShadow: isListening
              ? '0 0 30px rgba(200,169,110,1), 0 0 60px rgba(200,169,110,0.6), 0 0 100px rgba(200,169,110,0.4)'
              : '0 0 20px rgba(200,169,110,0.8), 0 0 40px rgba(200,169,110,0.4), 0 0 80px rgba(200,169,110,0.2)',
            marginBottom: '80px',
            animation: 'auraPulse 3s ease-in-out infinite'
          }}
        >
          AURA
          {isListening && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              border: '1px solid rgba(200,169,110,0.4)',
              boxShadow: '0 0 20px rgba(200,169,110,0.3)',
              zIndex: -1
            }} />
          )}
        </div>

        {/* Time */}
        <div style={{
          fontSize: 'clamp(80px, 12vw, 140px)',
          fontWeight: 100,
          letterSpacing: '0.05em',
          color: 'rgba(255,255,255,0.92)',
          lineHeight: 1,
          marginBottom: '16px'
        }}>
          {timeStr}
        </div>

        {/* Date */}
        <div style={{
          fontSize: '13px',
          letterSpacing: '0.3em',
          fontWeight: 200,
          color: 'rgba(200,169,110,0.5)',
          marginBottom: '40px'
        }}>
          {dateStr}
        </div>

        {/* Thinking state */}
        {isThinking && (
          <div style={{
            fontSize: '13px',
            letterSpacing: '0.3em',
            fontWeight: 200,
            color: 'rgba(200,169,110,0.5)',
            animation: 'auraPulse 2s ease-in-out infinite',
            marginTop: '20px'
          }}>
            THINKING
          </div>
        )}

        {/* Transcript */}
        {transcript && !isThinking && (
          <div style={{
            fontSize: '12px',
            color: 'rgba(200,169,110,0.7)',
            marginTop: '20px',
            maxWidth: '600px'
          }}>
            "{transcript}"
          </div>
        )}

        {/* Reply */}
        {reply && (
          <div style={{
            fontSize: '14px',
            fontWeight: 200,
            color: 'rgba(255,255,255,0.9)',
            marginTop: '16px',
            maxWidth: '600px',
            lineHeight: 1.6
          }}>
            {reply}
          </div>
        )}

        {/* Mini Spotify */}
        {spotifyData && (spotifyData.playing || spotifyData.is_playing) && !isListening && !transcript && (
          <div style={{
            marginTop: '40px',
            padding: '16px 24px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(200,169,110,0.15)',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '100%'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {spotifyData.album_art && (
                <img
                  src={spotifyData.album_art}
                  alt="Album art"
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '8px',
                    objectFit: 'cover'
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 300,
                  color: '#c8a96e',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {spotifyData.track}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: 'rgba(200,169,110,0.5)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginTop: '4px'
                }}>
                  {spotifyData.artist}
                </div>
              </div>
              <div style={{ fontSize: '16px', color: '#c8a96e' }}>
                {spotifyData.is_playing ? '▶' : '⏸'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom hint */}
      {!isListening && !transcript && (
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '10px',
          letterSpacing: '0.4em',
          color: 'rgba(200,169,110,0.3)'
        }}>
          SAY COMPUTER TO BEGIN
        </div>
      )}

      {/* Screen indicator dots */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px'
      }}>
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
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '4px',
          background: 'rgba(200,169,110,0.2)'
        }} />
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

export default IdleScreen;
