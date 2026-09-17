import React from 'react';
import { ART_TEST_ASSET_PATH, ART_TEST_ASSET_TYPE } from './constants';

// AURA 001 — ArtState (Phase 1).
//
// ART IS HOME. When rendered, this component must be the only thing on
// screen: no wordmark, no Trace, no clock/date, no weather, no music
// metadata, no controls, no labels, no navigation. Callers are responsible
// for ensuring nothing else mounts alongside it (see App.js Phase 1
// dev-only integration) — this component does not defend against that
// itself, it simply never renders anything beyond the media.
//
// Media architecture: `assetType` is an explicit prop rather than sniffed
// from the file extension, so still-image and moving-image support share
// one code path without guessing from a URL. Only what one development
// asset needs is implemented here — no rotation, no next/previous, no
// artist metadata (Decision #8 — Hosted Programme mechanics — remains open).

export default function ArtState({
  assetPath = ART_TEST_ASSET_PATH,
  assetType = ART_TEST_ASSET_TYPE,
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        overflow: 'hidden',
      }}
    >
      {assetType === 'video' && assetPath && (
        <video
          src={assetPath}
          autoPlay
          loop
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      {assetType === 'image' && assetPath && (
        <img
          src={assetPath}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </div>
  );
}
