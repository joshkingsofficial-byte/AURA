// AURA 001 — wordmark glyph geometry (Trace-origin correction).
//
// Custom, hand-drawn geometric strokes for "A U R A" — not a font. Every
// letter lives in the same SVG coordinate space as the perimeter Trace
// paths so the two A's horizontal crossbars can be exact, shared geometry:
// the crossbar IS the first segment of each Trace path (see AuraTrace.js),
// not a separate element merely positioned nearby. Deliberately simple and
// geometric — typography is development-only; this exists to make the
// crossbar-origin mechanism exact, not to be a finished typeface.

const UNIT_HEIGHT = 16;

function letterA(scale) {
  const w = 12 * scale;
  const h = UNIT_HEIGHT * scale;
  const crossbarY = h * 0.6;
  return {
    width: w,
    // Non-crossbar strokes only — these fade in as the static wordmark.
    strokes: [
      { x1: 0, y1: h, x2: w / 2, y2: 0 },   // left diagonal
      { x1: w / 2, y1: 0, x2: w, y2: h },   // right diagonal
    ],
    // A's crossbar span, symmetric about the letter's centre — which end
    // is "inner" (toward the word) vs "outer" (away from it) depends on
    // whether this is the first or last letter; the caller assigns that.
    crossbarLeftX: w * 0.22,
    crossbarRightX: w * 0.78,
    crossbarY,
  };
}

function letterU(scale) {
  const w = 10 * scale;
  const h = UNIT_HEIGHT * scale;
  const bottom = h * 0.82;
  return {
    width: w,
    strokes: [
      { x1: 0, y1: 0, x2: 0, y2: bottom },
      { x1: 0, y1: bottom, x2: w, y2: bottom },
      { x1: w, y1: bottom, x2: w, y2: 0 },
    ],
  };
}

function letterR(scale) {
  const w = 10 * scale;
  const h = UNIT_HEIGHT * scale;
  const bowlH = h * 0.44;
  const bowlW = w * 0.7;
  return {
    width: w,
    strokes: [
      { x1: 0, y1: 0, x2: 0, y2: h },             // spine
      { x1: 0, y1: 0, x2: bowlW, y2: 0 },          // bowl top
      { x1: bowlW, y1: 0, x2: bowlW, y2: bowlH },  // bowl right
      { x1: bowlW, y1: bowlH, x2: 0, y2: bowlH },  // bowl bottom
      { x1: bowlW * 0.4, y1: bowlH, x2: w, y2: h }, // leg
    ],
  };
}

function offsetStrokes(strokes, ox, oy) {
  return strokes.map((s) => ({ x1: s.x1 + ox, y1: s.y1 + oy, x2: s.x2 + ox, y2: s.y2 + oy }));
}

// Builds the full "A U R A" layout, horizontally centred at cx, with both
// A crossbars positioned exactly at y = topY so a Trace path can leave the
// crossbar and continue straight along the perimeter's top edge with no
// extra connecting segment.
export function buildWordmarkGeometry({ cx, topY, scale, letterGap }) {
  const a1 = letterA(scale);
  const u = letterU(scale);
  const r = letterR(scale);
  const a2 = letterA(scale);

  const totalWidth = a1.width + u.width + r.width + a2.width + letterGap * 3;
  let x = cx - totalWidth / 2;

  const a1Y = topY - a1.crossbarY;
  const a1X = x; x += a1.width + letterGap;
  const uX = x; x += u.width + letterGap;
  const rX = x; x += r.width + letterGap;
  const a2X = x;

  const staticStrokes = [
    ...offsetStrokes(a1.strokes, a1X, a1Y),
    ...offsetStrokes(u.strokes, uX, a1Y),
    ...offsetStrokes(r.strokes, rX, a1Y),
    ...offsetStrokes(a2.strokes, a2X, a1Y),
  ];

  // First A: inner end (toward U) is the crossbar's right side; outer end
  // (where the trace exits, travelling left) is the left side.
  const firstCrossbar = {
    innerX: a1X + a1.crossbarRightX,
    outerX: a1X + a1.crossbarLeftX,
    y: topY,
  };
  // Last A: mirrored assignment — inner (toward R) is the left side, outer
  // (trace exits travelling right) is the right side.
  const lastCrossbar = {
    innerX: a2X + a2.crossbarLeftX,
    outerX: a2X + a2.crossbarRightX,
    y: topY,
  };

  return { staticStrokes, firstCrossbar, lastCrossbar };
}
