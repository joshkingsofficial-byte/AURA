import React from 'react';
import { ART_STUDIES, ACTIVE_ART_STUDY } from './constants';

const activeStudy = ART_STUDIES[ACTIVE_ART_STUDY];

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
//
// `studyKey`: optional. When RevealSequence needs a study other than the
// fixed ACTIVE_ART_STUDY default (currently: the Static Art Schedule
// Study — see artSchedule.js), it passes the resolved key here rather
// than duplicating the registry lookup. Bare `<ArtState />` (the
// ?aura001=art dev shortcut) is unaffected — it still resolves from
// ACTIVE_ART_STUDY exactly as before.

export default function ArtState({ studyKey, assetPath, assetType, assetFit }) {
  const resolved = studyKey ? ART_STUDIES[studyKey] : activeStudy;
  const path = assetPath !== undefined ? assetPath : resolved.path;
  const type = assetType !== undefined ? assetType : resolved.type;
  const fit = assetFit !== undefined ? assetFit : (resolved.fit || 'cover');
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        overflow: 'hidden',
      }}
    >
      {type === 'video' && path && (
        <video
          src={path}
          autoPlay
          loop
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: fit }}
        />
      )}
      {type === 'image' && path && (
        <img
          src={path}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: fit }}
        />
      )}
    </div>
  );
}
