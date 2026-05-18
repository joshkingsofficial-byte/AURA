import React, { useState, useEffect } from 'react';

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

function ListeningOrb({ isListening }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 0,
        height: 0,
        pointerEvents: 'none',
      }}
    >
      {/* Outermost expanding ring */}
      <div
        style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          marginLeft: '-150px',
          marginTop: '-150px',
          borderRadius: '50%',
          border: `1px solid ${GOLD_FAINT}`,
          animation: 'orb-ring-3 3s ease-in-out infinite',
          animationDelay: '0.6s',
          transformOrigin: 'center center',
        }}
      />
      {/* Mid ring */}
      <div
        style={{
          position: 'absolute',
          width: '220px',
          height: '220px',
          marginLeft: '-110px',
          marginTop: '-110px',
          borderRadius: '50%',
          border: `1px solid ${GOLD_DIM}`,
          animation: 'orb-ring-2 2.5s ease-in-out infinite',
          animationDelay: '0.3s',
          transformOrigin: 'center center',
        }}
      />
      {/* Inner ring */}
      <div
        style={{
          position: 'absolute',
          width: '150px',
          height: '150px',
          marginLeft: '-75px',
          marginTop: '-75px',
          borderRadius: '50%',
          border: `1.5px solid ${isListening ? GOLD : GOLD_DIM}`,
          boxShadow: isListening
            ? `0 0 30px rgba(200,169,110,0.4), 0 0 60px rgba(200,169,110,0.15), inset 0 0 20px rgba(200,169,110,0.08)`
            : `0 0 12px rgba(200,169,110,0.15)`,
          animation: 'orb-ring-1 2s ease-in-out infinite',
          transformOrigin: 'center center',
        }}
      />
      {/* Expanding fade ring (for listening only) */}
      {isListening && (
        <div
          style={{
            position: 'absolute',
            width: '150px',
            height: '150px',
            marginLeft: '-75px',
            marginTop: '-75px',
            borderRadius: '50%',
            border: `1px solid ${GOLD_DIM}`,
            animation: 'orb-expand-fade 2s ease-out infinite',
            transformOrigin: 'center center',
          }}
        />
      )}
      {/* Center label */}
      <div
        style={{
          position: 'absolute',
          transform: 'translate(-50%, -50%)',
          fontSize: '9px',
          letterSpacing: '0.45em',
          color: GOLD_DIM,
          fontWeight: 300,
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}
      >
        {isListening ? 'LISTENING' : 'THINKING'}
      </div>
    </div>
  );
}

export default function WidgetOverlay({ isListening, isThinking, spotifyData, screen }) {
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
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
      },
      () => {}
    );
  }, []);

  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const [hour, ampm] = time.split(' ');
  const date = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();

  const isActive = isListening || isThinking;
  const nowPlaying = spotifyData && (spotifyData.playing || spotifyData.is_playing);
  const showPrompt = screen === 'idle' && !isActive;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        pointerEvents: 'none',
      }}
    >
      {/* ── Top-left: Clock ── */}
      <div
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
      </div>

      {/* ── Top-right: Weather ── */}
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
        {weather ? (
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
              <div
                style={{ fontSize: '10px', letterSpacing: '0.25em', color: GOLD_DIM, fontWeight: 300 }}
              >
                {weather.desc}
              </div>
              <div
                style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)', marginTop: '3px' }}
              >
                {weather.wind} KM/H
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.15)', textAlign: 'right' }}
          >
            LOADING...
          </div>
        )}
      </div>

      {/* ── Middle-right: Now Playing ── */}
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

        {/* Album art */}
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
          {nowPlaying && spotifyData.album_art ? (
            <img
              src={spotifyData.album_art}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                fontSize: '36px',
                color: GOLD_DIM,
                fontWeight: 100,
                lineHeight: 1,
                userSelect: 'none',
              }}
            >
              &#9834;
            </div>
          )}
        </div>

        {/* Track info */}
        {nowPlaying ? (
          <>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 300,
                color: GOLD,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
            >
              {spotifyData.track}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'rgba(200,169,110,0.5)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textAlign: 'center',
                marginTop: '4px',
              }}
            >
              {spotifyData.artist}
            </div>
            <div
              style={{
                fontSize: '9px',
                letterSpacing: '0.3em',
                color: 'rgba(255,255,255,0.2)',
                textAlign: 'center',
                marginTop: '10px',
              }}
            >
              PLAYING
            </div>
          </>
        ) : (
          <div
            style={{
              fontSize: '10px',
              letterSpacing: '0.2em',
              color: 'rgba(255,255,255,0.15)',
              textAlign: 'center',
            }}
          >
            NOTHING PLAYING
          </div>
        )}
      </div>

      {/* ── Center: Listening / Thinking orb ── */}
      {isActive && <ListeningOrb isListening={isListening} />}

      {/* ── Bottom-center: Voice prompt + nav dots ── */}
      {showPrompt && (
        <div
          style={{
            position: 'absolute',
            bottom: '36px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              letterSpacing: '0.4em',
              color: 'rgba(200,169,110,0.25)',
              whiteSpace: 'nowrap',
            }}
          >
            SAY COMPUTER TO ACTIVATE
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ width: '24px', height: '6px', borderRadius: '3px', background: 'rgba(200,169,110,0.45)' }} />
            <div style={{ width: '6px',  height: '6px', borderRadius: '3px', background: 'rgba(200,169,110,0.18)' }} />
            <div style={{ width: '6px',  height: '6px', borderRadius: '3px', background: 'rgba(200,169,110,0.18)' }} />
          </div>
        </div>
      )}
    </div>
  );
}
