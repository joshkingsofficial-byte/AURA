import React from 'react';
import { ART_STUDIES } from './constants';

// AURA 001 — Technician Overview (production-floor diagnostic panel, not
// part of the installation's visitor-facing presence).
//
// Deliberately styled as an obvious technical overlay (monospace, flat
// panel, no gold/AURA visual language) so it can never be mistaken for
// part of the piece — unlike every other screen in aura001/, this one is
// NOT trying to be invisible or restrained; it's trying to be unambiguous.
//
// Gated on `?technician=1`, same pattern as the existing `?technicianArt=`
// override in artSchedule.js and not isDev-gated, for the same reason:
// physical review happens on the Pi/Dell's production build, not a dev
// server. This panel does NOT read or write that URL param, and does NOT
// touch artSchedule.js or DEV_ART_STUDY_OVERRIDE — it is a second,
// independent, purely in-memory preview layer. RevealSequence.js holds the
// actual override state (`technicianPreviewKey`) and merges it with the
// real scheduled key only at render time, so the schedule itself
// (`lockedStudyKey`) is never read from or written to by anything here.
// Reload the page, or press "Reset to scheduled" below, and the override
// is gone — there is nothing to persist.

// Approved production default (see StartupState.js): `technicianBatOverride
// === null` renders BatarangSpinSpotlight. Everything else in this list is
// an explicit GLB path that switches StartupState to BatReveal showing that
// model instead — including the original Minded bat, kept as a deliberate,
// always-available fallback, not deleted or replaced. TestBatarang_A/B/C
// are the earlier static orientation comparisons (see
// import_batarang_orientations.py), kept for reference even though C's
// orientation is now what BatarangSpinSpotlight itself rotates from.
const MINDED_BAT_URL = '/aura001-dev/Minded_Bat_AURA_001.glb';
const BAT_VARIANTS = [
  { key: null, label: 'BATARANG — SPIN + SPOTLIGHT (production)' },
  { key: MINDED_BAT_URL, label: 'ORIGINAL MINDED BAT (fallback)' },
  { key: '/aura001-dev/TestBatarang_A_Normal.glb', label: 'A — NORMAL' },
  { key: '/aura001-dev/TestBatarang_B_UpsideDown.glb', label: 'B — UPSIDE DOWN' },
  { key: '/aura001-dev/TestBatarang_C_FaceRotated.glb', label: 'C — 180° FACE ROTATION' },
];

export default function TechnicianOverview({
  lockedStudyKey,
  technicianPreviewKey,
  onPreview,
  onReset,
  technicianBatOverride,
  onSelectBat,
}) {
  const studyEntries = Object.entries(ART_STUDIES);
  const effectiveKey = technicianPreviewKey || lockedStudyKey;
  const activeBatVariant = BAT_VARIANTS.find((v) => v.key === technicianBatOverride) || BAT_VARIANTS[0];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        zIndex: 10000,
        width: 280,
        fontFamily: 'Menlo, Consolas, monospace',
        fontSize: 11,
        color: '#e8e8e8',
        background: 'rgba(20, 20, 24, 0.92)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        borderRadius: 4,
        padding: 12,
        pointerEvents: 'auto',
      }}
      // Stop the installation's own click-anywhere enter/return trigger
      // (RevealSequence.js's onClick) from firing when operating this panel.
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8 }}>
        TECHNICIAN OVERVIEW
      </div>

      <div style={{ marginBottom: 8, lineHeight: 1.5 }}>
        <div>Scheduled: {lockedStudyKey}</div>
        <div>
          Previewing:{' '}
          {technicianPreviewKey ? (
            <span style={{ color: '#ffd27a' }}>{technicianPreviewKey} (override active)</span>
          ) : (
            <span style={{ color: '#8a8a8a' }}>— following schedule</span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onPreview('RUBY')}
        disabled={technicianPreviewKey === 'RUBY'}
        style={{
          width: '100%',
          marginBottom: 8,
          padding: '6px 8px',
          fontFamily: 'inherit',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.04em',
          background: technicianPreviewKey === 'RUBY' ? '#ffd27a' : '#3a2f1a',
          color: technicianPreviewKey === 'RUBY' ? '#1a1a1a' : '#ffd27a',
          border: '1px solid #ffd27a',
          borderRadius: 3,
          cursor: technicianPreviewKey === 'RUBY' ? 'default' : 'pointer',
        }}
      >
        [ Preview Ruby ]
      </button>

      <div style={{ marginBottom: 8, borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 8 }}>
        {studyEntries.map(([key, study]) => (
          <button
            key={key}
            type="button"
            onClick={() => onPreview(key)}
            disabled={effectiveKey === key}
            title={study.label}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              marginBottom: 4,
              padding: '4px 6px',
              fontFamily: 'inherit',
              fontSize: 10.5,
              background: effectiveKey === key ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: key === 'RUBY' ? '#ffd27a' : '#cfcfcf',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 3,
              cursor: effectiveKey === key ? 'default' : 'pointer',
            }}
          >
            {key === 'RUBY' ? `★ ${study.label}` : study.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onReset}
        disabled={!technicianPreviewKey}
        style={{
          width: '100%',
          marginBottom: 8,
          padding: '6px 8px',
          fontFamily: 'inherit',
          fontSize: 11,
          background: 'transparent',
          color: technicianPreviewKey ? '#e8e8e8' : '#555',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 3,
          cursor: technicianPreviewKey ? 'pointer' : 'default',
        }}
      >
        Reset to scheduled
      </button>

      {/* STARTUP bat — production BatarangSpinSpotlight vs. the Minded bat
          fallback vs. the static TestBatarang orientation references.
          Entirely separate override from the ART preview above
          (technicianBatOverride, not technicianPreviewKey): switching this
          only affects StartupState's bat slot, never the ART schedule.
          Session-only, same as everything else in this panel — reload and
          it's back to the production default (null = BatarangSpinSpotlight). */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 8 }}>
        <div style={{ marginBottom: 6, color: '#8a8a8a' }}>
          Startup bat:{' '}
          <span style={{ color: activeBatVariant.key ? '#ffd27a' : '#cfcfcf' }}>
            {activeBatVariant.label}
          </span>
        </div>
        {BAT_VARIANTS.map((variant) => {
          const isActive = activeBatVariant.key === variant.key;
          return (
            <button
              key={variant.label}
              type="button"
              onClick={() => onSelectBat(variant.key)}
              disabled={isActive}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                marginBottom: 4,
                padding: '4px 6px',
                fontFamily: 'inherit',
                fontSize: 10.5,
                background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: variant.key ? '#ffd27a' : '#cfcfcf',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 3,
                cursor: isActive ? 'default' : 'pointer',
              }}
            >
              {variant.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
