import React, { useEffect, useState } from 'react';
import './MirrorState.css';
import { getNowPlaying } from './nowPlayingProvider';
import { useLivingWeather } from './weatherProvider';
import WeatherAtmosphere from './WeatherAtmosphere';
import { MIRROR_CONTENT_INSET } from './constants';

// AURA 001 — MirrorState (Phase 4 development prototype).
//
// REFLECTION HAS ABSOLUTE PRIORITY. This component adds ONLY the
// functional information territories: time/date (top-left), now-playing
// when present (top-right), living local weather (lower-right). It does
// NOT render the reflection surface or the Trace — those are owned
// continuously by RevealSequence (see its file header for the ownership
// explanation) so nothing here causes a remount of either. Lower-left and
// centre are intentionally left with nothing.
//
// DEVELOPMENT NOTE: typography, sizing, and spacing below are starting
// points for judging spatial hierarchy against the full Trace + reflection
// — not final Presence/typography decisions.

const GOLD = '#c8a96e';
const GOLD_DIM = 'rgba(200,169,110,0.55)';

export default function MirrorState() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const [track] = useState(getNowPlaying); // provider is static per session; re-reading each tick isn't needed
  const weather = useLivingWeather();

  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  const date = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }).toUpperCase();

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
      {/* Top-left: time / date */}
      <div style={{ position: 'absolute', top: MIRROR_CONTENT_INSET, left: MIRROR_CONTENT_INSET }}>
        <div style={{ fontSize: '56px', fontWeight: 100, letterSpacing: '0.01em', color: 'rgba(255,255,255,0.92)', lineHeight: 1 }}>
          {time}
        </div>
        <div style={{ fontSize: '12px', fontWeight: 300, letterSpacing: '0.3em', color: GOLD_DIM, marginTop: '10px' }}>
          {date}
        </div>
      </div>

      {/* Top-right: now-playing, only while a track is present */}
      {track && (
        <div style={{ position: 'absolute', top: MIRROR_CONTENT_INSET, right: MIRROR_CONTENT_INSET, textAlign: 'right', maxWidth: '320px' }}>
          <div style={{ fontSize: '15px', fontWeight: 300, letterSpacing: '0.35em', color: GOLD }}>
            {track.title.toUpperCase()}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 300, letterSpacing: '0.15em', color: GOLD_DIM, marginTop: '8px' }}>
            {track.artist}
          </div>
        </div>
      )}

      {/* Lower-right: living local weather */}
      {weather && (
        <div style={{ position: 'absolute', bottom: MIRROR_CONTENT_INSET, right: MIRROR_CONTENT_INSET, textAlign: 'right' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <WeatherAtmosphere condition={weather.condition} />
          </div>
          <div style={{ fontSize: '40px', fontWeight: 100, color: 'rgba(255,255,255,0.9)', lineHeight: 1, marginTop: '6px' }}>
            {weather.tempC}&deg;
          </div>
          <div style={{ fontSize: '11px', fontWeight: 300, letterSpacing: '0.25em', color: GOLD_DIM, marginTop: '6px' }}>
            {weather.condition}
          </div>
        </div>
      )}

      {/* Lower-left: intentionally empty — negative space is deliberate */}
    </div>
  );
}
