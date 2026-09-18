import { NOW_PLAYING_SOURCE, MOCK_NOW_PLAYING_TRACK } from './constants';

// AURA 001 — now-playing provider (Phase 4).
//
// Music is OBSERVED, not controlled — this never sends playback commands,
// only reads a track. The real exhibition-audio source (Spotify Connect,
// AirPlay metadata, a gallery webhook, or none) is explicitly unresolved
// (see NOW_PLAYING_SOURCE in constants.js, Phase 6 territory). 'mock' is
// the only implemented source. This function is the single call site
// MirrorState uses, so swapping in a real source later only means adding a
// branch here — nothing in MirrorState needs to change.
//
// Returns { title, artist } | null.
export function getNowPlaying() {
  if (NOW_PLAYING_SOURCE !== 'mock') return null; // no other source implemented yet

  // Dev-only override so "no music" can be demonstrated/tested without a
  // real source to turn off: ?aura001=reveal&music=off. Gated on NODE_ENV
  // so it cannot be reached in a production build regardless of URL.
  if (process.env.NODE_ENV === 'development') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('music') === 'off') return null;
  }

  return MOCK_NOW_PLAYING_TRACK;
}
