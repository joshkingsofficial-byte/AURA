import React, { useState, useEffect, useRef } from 'react';

const GOLD = '#c8a96e';
const GOLD_DIM = 'rgba(200,169,110,0.35)';
const GOLD_FAINT = 'rgba(200,169,110,0.18)';

const CARD = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '20px',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
};

function wmoDesc(code) {
  if (code === 0) return 'CLEAR';
  if (code <= 3) return code === 1 ? 'MOSTLY CLEAR' : code === 2 ? 'PARTLY CLOUDY' : 'OVERCAST';
  if (code <= 49) return 'FOGGY';
  if (code <= 59) return 'DRIZZLE';
  if (code <= 69) return 'RAIN';
  if (code <= 79) return 'SNOW';
  if (code <= 84) return 'SHOWERS';
  return 'STORM';
}

function WeatherGlyph({ code }) {
  const size = 36;
  const stroke = GOLD;
  const dim = GOLD_DIM;

  if (code === 0) {
    // Clear: circle with rays
    return (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="7" stroke={stroke} strokeWidth="1.5" />
        {[0,45,90,135,180,225,270,315].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 18 + 10 * Math.cos(rad);
          const y1 = 18 + 10 * Math.sin(rad);
          const x2 = 18 + 14 * Math.cos(rad);
          const y2 = 18 + 14 * Math.sin(rad);
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />;
        })}
      </svg>
    );
  }
  if (code <= 3) {
    // Cloudy
    return (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <circle cx="15" cy="17" r="5" stroke={dim} strokeWidth="1.5" />
        {[0,45,90].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return <line key={deg} x1={15 + 7*Math.cos(rad)} y1={17 + 7*Math.sin(rad)} x2={15 + 10*Math.cos(rad)} y2={17 + 10*Math.sin(rad)} stroke={dim} strokeWidth="1.2" strokeLinecap="round" />;
        })}
        <path d="M10 20 Q10 26 18 26 Q26 26 26 20 Q26 15 21 15 Q20 11 15 11 Q9 11 9 17 Q9 20 10 20Z" stroke={stroke} strokeWidth="1.5" />
      </svg>
    );
  }
  if (code <= 69 || (code >= 80 && code <= 84)) {
    // Rain
    return (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <path d="M8 16 Q8 10 14 10 Q15 6 20 6 Q26 6 26 12 Q30 12 30 17 Q30 22 24 22 L10 22 Q8 22 8 19Z" stroke={stroke} strokeWidth="1.5" />
        {[[13,26],[18,28],[23,26],[15,30],[21,30]].map(([x,y],i) => (
          <line key={i} x1={x} y1={y} x2={x-2} y2={y+4} stroke={GOLD_DIM} strokeWidth="1.5" strokeLinecap="round" />
        ))}
      </svg>
    );
  }
  if (code <= 79) {
    // Snow
    return (
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
        <path d="M8 16 Q8 10 14 10 Q15 6 20 6 Q26 6 26 12 Q30 12 30 17 Q30 22 24 22 L10 22 Q8 22 8 19Z" stroke={dim} strokeWidth="1.5" />
        {[[13,27],[18,27],[23,27],[15,31],[21,31]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="1.5" fill={stroke} />
        ))}
      </svg>
    );
  }
  // Storm / default
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <path d="M8 14 Q8 8 15 8 Q16 4 22 4 Q28 4 28 11 Q32 11 32 16 Q32 21 26 21 L9 21 Q8 21 8 18Z" stroke={stroke} strokeWidth="1.5" />
      <polyline points="20,21 16,28 20,28 17,34" stroke={GOLD_DIM} strokeWidth="1.5" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function AuraOrb({ orbState, micVolumeRef }) {
  const [volume, setVolume] = useState(0);
  const rafRef = useRef(null);
  const isListening = orbState === 'listening';

  useEffect(() => {
    if (!isListening) { cancelAnimationFrame(rafRef.current); setVolume(0); return; }
    const tick = () => { setVolume(micVolumeRef?.current ?? 0); rafRef.current = requestAnimationFrame(tick); };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isListening, micVolumeRef]);

  const isResting  = orbState === 'resting' || orbState === 'returning';
  const isAware    = orbState === 'aware';
  const isActive   = !isResting && !isAware;

  // Inner ring: volume-reactive when listening, fixed size otherwise
  const innerSize = isListening ? 75 + volume * 35 : 75;
  const innerGlow = isListening
    ? `0 0 ${20 + volume * 40}px rgba(200,169,110,${0.3 + volume * 0.4}), 0 0 60px rgba(200,169,110,0.1)`
    : orbState === 'speaking'
      ? '0 0 28px rgba(200,169,110,0.35), 0 0 60px rgba(200,169,110,0.12)'
      : '0 0 12px rgba(200,169,110,0.15)';

  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', width: 0, height: 0, pointerEvents: 'none' }}>

      {/* ── Resting / Aware ring — always present, changes rhythm ── */}
      <div style={{
        position: 'absolute',
        width: '130px',
        height: '130px',
        marginLeft: '-65px',
        marginTop: '-65px',
        borderRadius: '50%',
        border: `1px solid rgba(200,169,110,${isResting ? 0.22 : isAware ? 0.4 : 0.07})`,
        animation: isResting
          ? `orb-resting ${orbState === 'returning' ? '3s' : '4.5s'} ease-in-out infinite`
          : isAware
            ? 'orb-aware 1.6s ease-in-out infinite'
            : 'none',
        transition: 'border-color 0.8s ease, opacity 0.8s ease',
        transformOrigin: 'center center',
      }} />

      {/* ── Active rings — listening / thinking / speaking ── */}
      {isActive && (<>
        {/* Outermost */}
        <div style={{
          position: 'absolute',
          width: '300px', height: '300px',
          marginLeft: '-150px', marginTop: '-150px',
          borderRadius: '50%',
          border: `1px solid ${GOLD_FAINT}`,
          animation: 'orb-ring-3 3s ease-in-out 0.6s infinite',
          transformOrigin: 'center center',
        }} />
        {/* Mid */}
        <div style={{
          position: 'absolute',
          width: '220px', height: '220px',
          marginLeft: '-110px', marginTop: '-110px',
          borderRadius: '50%',
          border: `1px solid ${GOLD_DIM}`,
          animation: orbState === 'speaking'
            ? 'orb-speaking 1.8s ease-in-out 0.3s infinite'
            : 'orb-ring-2 2.5s ease-in-out 0.3s infinite',
          transformOrigin: 'center center',
        }} />
        {/* Inner — volume reactive */}
        <div style={{
          position: 'absolute',
          width: `${innerSize * 2}px`, height: `${innerSize * 2}px`,
          marginLeft: `-${innerSize}px`, marginTop: `-${innerSize}px`,
          borderRadius: '50%',
          border: `1.5px solid ${isListening ? GOLD : GOLD_DIM}`,
          boxShadow: innerGlow,
          animation: isListening ? 'none'
            : orbState === 'thinking' ? 'orb-ring-1 1.2s ease-in-out infinite'
            : 'orb-ring-1 2s ease-in-out infinite',
          transition: 'width 0.08s ease, height 0.08s ease, margin 0.08s ease, box-shadow 0.08s ease',
          transformOrigin: 'center center',
        }} />
        {/* Expand-fade pulse (listening only) */}
        {isListening && (
          <div style={{
            position: 'absolute',
            width: '150px', height: '150px',
            marginLeft: '-75px', marginTop: '-75px',
            borderRadius: '50%',
            border: `1px solid ${GOLD_DIM}`,
            animation: 'orb-expand-fade 2s ease-out infinite',
            transformOrigin: 'center center',
          }} />
        )}
      </>)}
    </div>
  );
}

export default function WidgetOverlay({ isListening, isThinking, spotifyData, screen, micVolumeRef, orbState = 'resting' }) {
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    let intervalId;
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        const fetchWeather = () => {
          fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
          )
            .then((r) => r.json())
            .then(({ current_weather: cw }) =>
              setWeather({
                temp: Math.round(cw.temperature),
                desc: wmoDesc(cw.weathercode),
                code: cw.weathercode,
                wind: Math.round(cw.windspeed),
              })
            )
            .catch(() => {});
        };
        fetchWeather();
        intervalId = setInterval(fetchWeather, 30 * 60 * 1000);
      },
      () => {}
    );
    return () => clearInterval(intervalId);
  }, []);

  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const [hour, ampm] = time.split(' ');
  const date = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();

  const isActive = isListening || isThinking;
  const nowPlaying = spotifyData && (spotifyData.playing || spotifyData.is_playing);
  const activeOrbStates = ['listening', 'thinking', 'speaking'];
  const showOrb = screen === 'idle' || activeOrbStates.includes(orbState);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        pointerEvents: 'none',
      }}
    >
      {/* ── Info widgets: only on idle screen ── */}
      {/* ── Top-left: Clock ── */}
      {screen === 'idle' && <div
        style={{
          position: 'absolute',
          top: '32px',
          left: '32px',
          ...CARD,
          padding: '20px 26px 18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
          <span
            style={{
              fontSize: '72px',
              fontWeight: 100,
              letterSpacing: '-0.02em',
              color: 'rgba(255,255,255,0.95)',
              lineHeight: 1,
            }}
          >
            {hour}
          </span>
          <span
            style={{
              fontSize: '18px',
              fontWeight: 200,
              color: 'rgba(255,255,255,0.4)',
              marginBottom: '10px',
              letterSpacing: '0.05em',
            }}
          >
            {ampm}
          </span>
        </div>
        <div
          style={{
            fontSize: '10px',
            letterSpacing: '0.25em',
            fontWeight: 300,
            color: GOLD_DIM,
            marginTop: '6px',
          }}
        >
          {date}
        </div>
      </div>}

      {/* ── Top-right: Weather ── */}
      {screen === 'idle' && weather && (
        <div
          style={{
            position: 'absolute',
            top: '32px',
            right: '32px',
            ...CARD,
            padding: '20px 24px 18px',
            minWidth: '160px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
            <WeatherGlyph code={weather.code} />
            <div
              style={{
                fontSize: '48px',
                fontWeight: 100,
                letterSpacing: '-0.02em',
                color: 'rgba(255,255,255,0.93)',
                lineHeight: 1,
              }}
            >
              {weather.temp}&deg;
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.25em', color: GOLD_DIM, fontWeight: 300 }}>
                {weather.desc}
              </div>
              <div style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)', marginTop: '3px' }}>
                {weather.wind} KM/H
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Middle-right: Now Playing ── */}
      {screen === 'idle' && nowPlaying && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: '32px',
            transform: 'translateY(-50%)',
            ...CARD,
            padding: '20px',
            width: '260px',
          }}
        >
          <div
            style={{
              fontSize: '9px',
              letterSpacing: '0.3em',
              color: 'rgba(255,255,255,0.2)',
              marginBottom: '16px',
            }}
          >
            NOW PLAYING
          </div>

          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '12px',
              overflow: 'hidden',
              margin: '0 auto 16px',
              background: 'rgba(200,169,110,0.06)',
              border: '1px solid rgba(200,169,110,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {spotifyData.album_art ? (
              <img src={spotifyData.album_art} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ fontSize: '36px', color: GOLD_DIM, fontWeight: 100, lineHeight: 1, userSelect: 'none' }}>
                &#9834;
              </div>
            )}
          </div>

          <div style={{ fontSize: '13px', fontWeight: 300, color: GOLD, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
            {spotifyData.track}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(200,169,110,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', marginTop: '4px' }}>
            {spotifyData.artist}
          </div>
          <div style={{ fontSize: '9px', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: '10px' }}>
            PLAYING
          </div>
        </div>
      )}

      {/* ── Center: AURA orb — always present on idle, active states on all screens ── */}
      {showOrb && <AuraOrb orbState={orbState} micVolumeRef={micVolumeRef} />}
    </div>
  );
}
