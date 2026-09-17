import React from 'react';

// AURA 001 — MirrorSurfacePlaceholder (Phase 2 development aid only).
//
// This is NOT a simulated reflection, camera feed, simulated person, stock
// human image, or any attempt at the final physical effect. The real
// reflection comes from two-way mirror hardware and gallery lighting that
// simply don't exist on a development monitor. This component exists
// solely so Phase 2's opacity/layering choreography can be verified as a
// distinct layer from the artwork — nothing more, nothing simulated.
//
// The color is deliberately near-black but NOT pure black (#000000), so
// that "artwork fully transparent, reflection surface exposed" is visually
// distinguishable from "screen went black" during development testing.
//
// DEVELOPMENT REPRESENTATION ONLY. This is NOT a simulated reflection. In
// the physical AURA installation, the viewer's reflection comes from the
// two-way mirror/display material and environmental lighting — not from
// software. The software's responsibility during Stillness is to remove
// visual obstruction, not to generate a reflection.
const MIRROR_PLACEHOLDER_COLOR = '#0e0d0a';

export default function MirrorSurfacePlaceholder() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: MIRROR_PLACEHOLDER_COLOR,
      }}
    />
  );
}
