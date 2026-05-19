import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuraSocket } from '../hooks/useAuraSocket';

const WS_URL = 'ws://localhost:8765';
const GOLD = '#c8a96e';
const GOLD_DIM = 'rgba(200,169,110,0.5)';
const GOLD_FAINT = 'rgba(200,169,110,0.12)';

const ICON = {
  prev:  '⏮',
  play:  '▶',
  pause: '⏸',
  next:  '⏭',
};

export default function MusicApp() {
  const [track, setTrack]   = useState(null);
  const [volume, setVolume] = useState(50);
  const sendRef = useRef(null);

  const handleMessage = useCallback((msg) => {
    if (msg.type === 'music_update') {
      const t = msg.track;
      if (t) {
        setTrack({
          title:     t.name     || '',
          artist:    t.artists  || '',
          album:     t.album    || '',
          albumArt:  t.album_image || null,
          isPlaying: !!t.is_playing,
        });
        // Sync volume slider if backend sends it (future enhancement)
      } else {
        setTrack(null);
      }
    }
  }, []);

  const { send } = useAuraSocket(WS_URL, handleMessage);
  useEffect(() => { sendRef.current = send; }, [send]);

  const ctrl = (action, value) => {
    sendRef.current?.({
      type: 'apple_music_control',
      action,
      ...(value !== undefined ? { value } : {}),
    });
  };

  const handleVolume = (e) => {
    const val = Number(e.target.value);
    setVolume(val);
    ctrl('volume', val);
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
      <div style={{ fontSize: '10px', letterSpacing: '0.5em', color: GOLD_DIM, fontWeight: 200 }}>
        APPLE MUSIC
      </div>

      {/* Album art */}
      <div
        style={{
          width: 220,
          height: 220,
          borderRadius: 22,
          overflow: 'hidden',
          background: GOLD_FAINT,
          border: `1px solid rgba(200,169,110,0.18)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: track?.albumArt
            ? '0 20px 60px rgba(0,0,0,0.6)'
            : '0 8px 30px rgba(0,0,0,0.4)',
        }}
      >
        {track?.albumArt ? (
          <img
            src={track.albumArt}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ fontSize: 64, color: GOLD_DIM, lineHeight: 1, userSelect: 'none' }}>
            &#9834;
          </div>
        )}
      </div>

      {/* Track info */}
      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <div
          style={{
            fontSize: 20,
            fontWeight: 300,
            color: 'rgba(255,255,255,0.92)',
            letterSpacing: '0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {track?.title || 'Nothing playing'}
        </div>
        <div
          style={{
            fontSize: 13,
            color: GOLD_DIM,
            marginTop: 6,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {track?.artist || ''}
        </div>
        {track?.album && (
          <div
            style={{
              fontSize: 11,
              color: 'rgba(200,169,110,0.28)',
              marginTop: 3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {track.album}
          </div>
        )}
      </div>

      {/* Playback controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Previous */}
        <button onClick={() => ctrl('previous')} style={btnSmall}>
          {ICON.prev}
        </button>

        {/* Play / Pause */}
        <button
          onClick={() => ctrl(track?.isPlaying ? 'pause' : 'play')}
          style={{
            ...btnSmall,
            width: 64,
            height: 64,
            fontSize: 24,
            border: `1.5px solid ${GOLD}`,
            color: GOLD,
            boxShadow: '0 0 20px rgba(200,169,110,0.2)',
          }}
        >
          {track?.isPlaying ? ICON.pause : ICON.play}
        </button>

        {/* Next */}
        <button onClick={() => ctrl('next')} style={btnSmall}>
          {ICON.next}
        </button>
      </div>

      {/* Volume */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          maxWidth: 300,
        }}
      >
        <span style={{ fontSize: 11, color: 'rgba(200,169,110,0.35)', letterSpacing: '0.15em' }}>
          VOL
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={handleVolume}
          style={{ flex: 1, accentColor: GOLD, cursor: 'pointer' }}
        />
        <span
          style={{
            fontSize: 11,
            color: 'rgba(200,169,110,0.35)',
            width: 26,
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {volume}
        </span>
      </div>

      {/* Voice hint */}
      <div
        style={{
          fontSize: '9px',
          letterSpacing: '0.35em',
          color: 'rgba(255,255,255,0.1)',
          textAlign: 'center',
        }}
      >
        SAY &ldquo;PLAY&rdquo;, &ldquo;PAUSE&rdquo;, &ldquo;SKIP&rdquo;, &ldquo;NEXT SONG&rdquo;
      </div>
    </div>
  );
}

const btnSmall = {
  background: 'transparent',
  border: '1px solid rgba(200,169,110,0.22)',
  borderRadius: '50%',
  width: 48,
  height: 48,
  fontSize: 18,
  color: GOLD_DIM,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'border-color 0.15s, color 0.15s',
};
