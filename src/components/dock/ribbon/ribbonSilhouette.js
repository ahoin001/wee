/**
 * Shared Wii ribbon silhouette (viewBox 0 0 1440 240).
 * Used by RibbonChrome, RibbonChromeEffects mask, and particle border sampling.
 */

export const RIBBON_VIEWBOX = '0 0 1440 240';
export const RIBBON_VIEWBOX_WIDTH = 1440;
export const RIBBON_VIEWBOX_HEIGHT = 240;

/** Full ribbon body (fill). */
export const RIBBON_SILHOUETTE_PATH =
  'M 0 40 L 250 40 C 450 40, 500 140, 670 140 L 770 140 C 940 140, 990 40, 1190 40 L 1440 40 L 1440 240 L 0 240 Z';

/** Upper band used for glass shine overlay. */
export const RIBBON_SHINE_PATH =
  'M 0 40 L 250 40 C 450 40, 500 140, 670 140 L 770 140 C 940 140, 990 40, 1190 40 L 1440 40 L 1440 120 L 0 120 Z';

/** Top edge only (open path) for neon stroke / sparkle sampling. */
export const RIBBON_TOP_EDGE_PATH =
  'M 0 40 L 250 40 C 450 40, 500 140, 670 140 L 770 140 C 940 140, 990 40, 1190 40 L 1440 40';

/**
 * Closed silhouette outline (top edge + bottom) for neon / ember stroke FX.
 * Walks the top bow left→right, then returns along the bottom edge.
 */
export const RIBBON_FULL_OUTLINE_PATH =
  'M 0 40 L 250 40 C 450 40, 500 140, 670 140 L 770 140 C 940 140, 990 40, 1190 40 L 1440 40 L 1440 240 L 0 240 Z';

function cubicPoint(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return (
    u * u * u * p0 +
    3 * u * u * t * p1 +
    3 * u * t * t * p2 +
    t * t * t * p3
  );
}

/**
 * Top-edge samples in viewBox coords for particle border spawn.
 * @param {number} [sampleCount=100]
 * @returns {{ x: number, y: number }[]}
 */
export function sampleRibbonTopEdgePoints(sampleCount = 100) {
  const n = Math.max(16, sampleCount);
  const points = [];

  // Segment lengths in x (approximate for uniform-ish sampling by arc param)
  const segments = [
    { type: 'line', x0: 0, y0: 40, x1: 250, y1: 40, weight: 250 },
    {
      type: 'cubic',
      x0: 250,
      y0: 40,
      cx1: 450,
      cy1: 40,
      cx2: 500,
      cy2: 140,
      x1: 670,
      y1: 140,
      weight: 420,
    },
    { type: 'line', x0: 670, y0: 140, x1: 770, y1: 140, weight: 100 },
    {
      type: 'cubic',
      x0: 770,
      y0: 140,
      cx1: 940,
      cy1: 140,
      cx2: 990,
      cy2: 40,
      x1: 1190,
      y1: 40,
      weight: 420,
    },
    { type: 'line', x0: 1190, y0: 40, x1: 1440, y1: 40, weight: 250 },
  ];
  const totalWeight = segments.reduce((s, seg) => s + seg.weight, 0);

  for (let i = 0; i <= n; i += 1) {
    let target = (i / n) * totalWeight;
    let x = 0;
    let y = 40;
    for (const seg of segments) {
      if (target <= seg.weight || seg === segments[segments.length - 1]) {
        const t = seg.weight === 0 ? 0 : Math.min(1, Math.max(0, target / seg.weight));
        if (seg.type === 'line') {
          x = seg.x0 + (seg.x1 - seg.x0) * t;
          y = seg.y0 + (seg.y1 - seg.y0) * t;
        } else {
          x = cubicPoint(seg.x0, seg.cx1, seg.cx2, seg.x1, t);
          y = cubicPoint(seg.y0, seg.cy1, seg.cy2, seg.y1, t);
        }
        break;
      }
      target -= seg.weight;
    }
    points.push({ x, y });
  }
  return points;
}

/**
 * Map viewBox edge samples onto a canvas sized to the dock footer.
 * @param {number} width
 * @param {number} height
 * @param {number} [sampleCount]
 */
export function sampleRibbonTopEdgeForCanvas(width, height, sampleCount = 100) {
  const sx = width / RIBBON_VIEWBOX_WIDTH;
  const sy = height / RIBBON_VIEWBOX_HEIGHT;
  return sampleRibbonTopEdgePoints(sampleCount).map((p) => ({
    x: p.x * sx,
    y: p.y * sy,
  }));
}
