import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuraSocket } from '../hooks/useAuraSocket';

const WS_URL = 'ws://localhost:8765';

function YouTubeApp({ onBack }) {
  const [videoId, setVideoId]             = useState(null);
  const [videoTitle, setVideoTitle]       = useState('');
  const [channelName, setChannelName]     = useState('');
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching]     = useState(false);
  const [searchError, setSearchError]     = useState(null);
  const [isPlaying, setIsPlaying]         = useState(false);
  const [volume, setVolume]               = useState(80);
  const [playerReady, setPlayerReady]     = useState(false);

  const playerRef       = useRef(null);
  const sendRef         = useRef(null);
  const volumeRef       = useRef(80);
  const isPlayingRef    = useRef(false);
  const ytReadyRef      = useRef(false);
  const pendingVideoRef = useRef(null);
  const resultsRef      = useRef(null);

  useEffect(() => { volumeRef.current   = volume;    }, [volume]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // ── YouTube IFrame API: preload script but DON'T create player yet ──────────
  useEffect(() => {
    const onAPIReady = () => {
      ytReadyRef.current = true;
      if (pendingVideoRef.current) {
        createPlayer(pendingVideoRef.current);
        pendingVideoRef.current = null;
      }
    };

    if (window.YT && window.YT.Player) {
      ytReadyRef.current = true;
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); onAPIReady(); };
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
    }

    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
      setPlayerReady(false);
    };
  }, []);

  // ── Create player with a specific videoId (called on first selection) ───────
  const createPlayer = useCallback((vid) => {
    const el = document.getElementById('yt-player');
    if (!el) return;

    if (playerRef.current) {
      playerRef.current.loadVideoById(vid);
      return;
    }

    playerRef.current = new window.YT.Player('yt-player', {
      videoId: vid,
      height: '100%',
      width: '100%',
      playerVars: { autoplay: 1, controls: 1, rel: 0, modestbranding: 1 },
      events: {
        onReady: (e) => {
          e.target.setVolume(volumeRef.current);
          setPlayerReady(true);
        },
        onStateChange: (e) => {
          setIsPlaying(e.data === window.YT.PlayerState.PLAYING);
        },
      },
    });
  }, []);

  // ── Gesture / WS control ───────────────────────────────────────────────────
  const applyControl = useCallback((action, value) => {
    const p = playerRef.current;
    if (!p) return;
    switch (action) {
      case 'play':         p.playVideo();  break;
      case 'pause':        p.pauseVideo(); break;
      case 'toggle':
        isPlayingRef.current ? p.pauseVideo() : p.playVideo();
        break;
      case 'volume': {
        const v = Math.max(0, Math.min(100, parseInt(value)));
        p.setVolume(v);
        setVolume(v);
        break;
      }
      case 'seek_forward':
        p.seekTo(p.getCurrentTime() + (value || 10), true);
        break;
      case 'seek_back':
        p.seekTo(Math.max(0, p.getCurrentTime() - (value || 10)), true);
        break;
      default: break;
    }
  }, []);

  const handleGesture = useCallback((gesture) => {
    switch (gesture) {
      case 'fist':
        isPlayingRef.current
          ? (playerRef.current?.pauseVideo(), console.log('✊ Pause'))
          : (playerRef.current?.playVideo(),  console.log('✊ Play'));
        break;
      case 'point_up': {
        const v = Math.min(100, volumeRef.current + 10);
        playerRef.current?.setVolume(v);
        setVolume(v);
        sendRef.current?.({ type: 'youtube_control', action: 'volume', value: v });
        console.log(`👆 Volume → ${v}%`);
        break;
      }
      case 'point_down': {
        const v = Math.max(0, volumeRef.current - 10);
        playerRef.current?.setVolume(v);
        setVolume(v);
        sendRef.current?.({ type: 'youtube_control', action: 'volume', value: v });
        console.log(`👇 Volume → ${v}%`);
        break;
      }
      case 'swipe_right':
        playerRef.current?.seekTo(playerRef.current.getCurrentTime() + 10, true);
        console.log('👉 +10s');
        break;
      case 'swipe_left':
        playerRef.current?.seekTo(Math.max(0, playerRef.current.getCurrentTime() - 10), true);
        console.log('👈 -10s');
        break;
      default: break;
    }
  }, []);

  const { send } = useAuraSocket(WS_URL, (msg) => {
    switch (msg.type) {
      case 'youtube_search_results':
        console.log(`📺 youtube_search_results received: ${msg.results?.length ?? 0} items, error: ${msg.error ?? 'none'}`);
        setSearchResults(msg.results || []);
        setIsSearching(false);
        setSearchError(msg.error || null);
        if (msg.results?.length > 0) {
          setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        }
        break;
      case 'youtube_control':
        applyControl(msg.action, msg.value);
        break;
      case 'gesture_command':
        handleGesture(msg.gesture);
        break;
      default: break;
    }
  });

  useEffect(() => { sendRef.current = send; }, [send]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e?.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    send({ type: 'youtube_search', query: q });
    console.log(`🔍 Sending youtube_search: "${q}"`);
  };

  const handleVideoSelect = (video) => {
    setVideoId(video.id);
    setVideoTitle(video.title);
    setChannelName(video.channel);
    setSearchResults([]);
    console.log(`▶️ Selected: ${video.title} (${video.id})`);

    if (ytReadyRef.current) {
      createPlayer(video.id);
    } else {
      pendingVideoRef.current = video.id;
    }
  };

  const togglePlayPause = () => {
    if (!playerRef.current || !playerReady) return;
    isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
  };

  const handleVolumeChange = (e) => {
    const v = parseInt(e.target.value);
    setVolume(v);
    playerRef.current?.setVolume(v);
  };

  const handleFullscreen = () => {
    const el = document.querySelector('#yt-player iframe') || document.getElementById('yt-player');
    el?.requestFullscreen?.();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      margin: '-32px',
      padding: '32px',
      background: 'radial-gradient(ellipse at 50% 25%, #0a0a1e 0%, #05050a 55%, #000 100%)',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
        <button onClick={onBack} style={S.backBtn}>← Back</button>
        <span style={S.title}>YOUTUBE</span>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search YouTube..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={S.searchInput}
        />
        <button type="submit" disabled={isSearching} style={S.searchBtn}>
          {isSearching ? '···' : '🔍 Search'}
        </button>
      </form>

      {searchError && (
        <p style={{ color: 'rgba(255,110,110,0.8)', fontSize: '12px', marginBottom: '14px', textAlign: 'center', letterSpacing: '0.03em' }}>
          ⚠ {searchError}
        </p>
      )}

      {/* Player — placeholder until a video is selected */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          position: 'relative',
          paddingTop: '56.25%',
          background: '#000',
          borderRadius: '12px',
          overflow: 'hidden',
          border: videoId ? '1px solid rgba(200,169,110,0.3)' : '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* Player div — always present so IFrame API can target it */}
          <div
            id="yt-player"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              display: videoId ? 'block' : 'none',
            }}
          />
          {/* Placeholder shown until a video is chosen */}
          {!videoId && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '12px', pointerEvents: 'none',
            }}>
              <span style={{ fontSize: '52px', opacity: 0.18 }}>📺</span>
              <span style={{ fontSize: '12px', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.15)', fontWeight: 200 }}>
                SEARCH TO PLAY A VIDEO
              </span>
            </div>
          )}
        </div>

        {videoTitle && (
          <div style={{ marginTop: '10px', paddingLeft: '2px' }}>
            <div style={{ fontSize: '14px', fontWeight: 300, color: 'rgba(255,255,255,0.9)', marginBottom: '3px' }}>
              {videoTitle}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(200,169,110,0.55)', letterSpacing: '0.05em' }}>
              {channelName}
            </div>
          </div>
        )}
      </div>

      {/* Playback controls */}
      {videoId && playerReady && (
        <div style={{ ...S.card, display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', marginBottom: '24px' }}>
          <button onClick={togglePlayPause} style={S.playBtn}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            onClick={() => playerRef.current?.seekTo(Math.max(0, playerRef.current.getCurrentTime() - 10), true)}
            style={S.smallBtn}
          >⏮ 10s</button>
          <button
            onClick={() => playerRef.current?.seekTo(playerRef.current.getCurrentTime() + 10, true)}
            style={S.smallBtn}
          >10s ⏭</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <span style={{ fontSize: '12px' }}>🔊</span>
            <input
              type="range" min="0" max="100" value={volume}
              onChange={handleVolumeChange}
              className="yt-slider"
              style={{ width: '72px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '10px', color: 'rgba(200,169,110,0.5)', width: '28px' }}>{volume}%</span>
          </div>
          <button onClick={handleFullscreen} style={S.smallBtn}>⛶</button>
        </div>
      )}

      {/* Loading spinner */}
      {isSearching && (
        <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(200,169,110,0.5)', letterSpacing: '0.2em', fontSize: '12px' }}>
          SEARCHING···
        </div>
      )}

      {/* Search results */}
      {searchResults.length > 0 && (
        <div ref={resultsRef} style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.22em', color: 'rgba(200,169,110,0.5)', marginBottom: '14px' }}>
            {searchResults.length} RESULTS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {searchResults.map((video) => (
              <div
                key={video.id}
                onClick={() => handleVideoSelect(video)}
                style={S.resultCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(200,169,110,0.4)';
                  e.currentTarget.style.background = 'rgba(200,169,110,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(200,169,110,0.1)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }}
              >
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <img
                    src={video.thumbnail}
                    alt=""
                    style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '6px', display: 'block' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.2s',
                    background: 'rgba(0,0,0,0.4)',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = 0; }}
                  >
                    <span style={{ fontSize: '28px' }}>▶</span>
                  </div>
                </div>
                <p style={{
                  fontSize: '11px', color: 'rgba(255,255,255,0.85)', fontWeight: 300,
                  lineHeight: 1.4, margin: '0 0 4px',
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {video.title}
                </p>
                <p style={{ fontSize: '10px', color: 'rgba(200,169,110,0.5)', margin: 0 }}>
                  {video.channel}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gesture hints */}
      <div style={{ ...S.card, padding: '12px 20px' }}>
        <div style={{ fontSize: '10px', letterSpacing: '0.22em', color: 'rgba(200,169,110,0.5)', marginBottom: '10px', textAlign: 'center' }}>
          GESTURE CONTROLS
        </div>
        <div style={{ display: 'flex', gap: '18px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { g: '✊', label: 'Play/Pause' },
            { g: '👆', label: 'Vol+' },
            { g: '👇', label: 'Vol−' },
            { g: '👉', label: '+10s' },
            { g: '👈', label: '−10s' },
            { g: '🖐️', label: 'Back' },
          ].map(({ g, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px' }}>{g}</div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .yt-slider {
          -webkit-appearance: none; appearance: none;
          height: 3px; background: rgba(200,169,110,0.2); border-radius: 2px; outline: none;
        }
        .yt-slider::-webkit-slider-thumb {
          -webkit-appearance: none; width: 13px; height: 13px;
          border-radius: 50%; background: #c8a96e; cursor: pointer;
          box-shadow: 0 0 6px rgba(200,169,110,0.5);
        }
      `}</style>
    </div>
  );
}

const S = {
  backBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(200,169,110,0.2)',
    color: '#c8a96e', borderRadius: '8px',
    padding: '8px 16px', cursor: 'pointer',
    fontSize: '12px', letterSpacing: '0.05em', fontWeight: 300,
  },
  title: {
    position: 'absolute', left: '50%', transform: 'translateX(-50%)',
    fontSize: '12px', letterSpacing: '0.45em', fontWeight: 200,
    color: '#c8a96e', textShadow: '0 0 20px rgba(200,169,110,0.7)',
  },
  searchInput: {
    flex: 1, background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(200,169,110,0.15)',
    borderRadius: '8px', padding: '10px 14px',
    color: '#fff', fontSize: '13px', outline: 'none',
    fontFamily: 'inherit',
  },
  searchBtn: {
    background: 'rgba(200,169,110,0.12)',
    border: '1px solid rgba(200,169,110,0.3)',
    color: '#c8a96e', borderRadius: '8px',
    padding: '10px 18px', cursor: 'pointer',
    fontSize: '13px', fontWeight: 300, whiteSpace: 'nowrap',
  },
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(200,169,110,0.1)',
    borderRadius: '12px',
  },
  playBtn: {
    width: '38px', height: '38px', borderRadius: '50%',
    background: 'rgba(200,169,110,0.15)',
    border: '1px solid rgba(200,169,110,0.35)',
    color: '#c8a96e', cursor: 'pointer', fontSize: '16px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  smallBtn: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.5)',
    borderRadius: '6px', padding: '5px 10px',
    cursor: 'pointer', fontSize: '11px', whiteSpace: 'nowrap',
  },
  resultCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(200,169,110,0.1)',
    borderRadius: '10px', padding: '10px',
    cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s',
  },
};

export default YouTubeApp;
