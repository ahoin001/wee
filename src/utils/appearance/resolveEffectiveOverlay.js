/** Live particle fields — never store page maps on `state.overlay`. */
export const OVERLAY_LIVE_KEYS = Object.freeze([
  'enabled',
  'effect',
  'intensity',
  'speed',
  'wind',
  'gravity',
]);

const DEFAULT_LIVE_OVERLAY = Object.freeze({
  enabled: false,
  effect: 'snow',
  intensity: 50,
  speed: 1,
  wind: 0.02,
  gravity: 0.1,
});

export function pickLiveOverlay(overlay) {
  const src = overlay && typeof overlay === 'object' ? overlay : {};
  const out = {};
  for (const key of OVERLAY_LIVE_KEYS) {
    if (src[key] !== undefined) out[key] = src[key];
  }
  return out;
}

export function normalizeOverlayScope(scope) {
  return scope === 'perPage' ? 'perPage' : 'space';
}

function overlayAtPage(byPage, pageIndex) {
  if (!byPage || typeof byPage !== 'object') return null;
  const page = Math.max(0, Math.floor(Number(pageIndex) || 0));
  const hit = byPage[page] ?? byPage[String(page)];
  return hit && typeof hit === 'object' ? hit : null;
}

/**
 * Resolved overlay for the page you are on.
 * Live `state.overlay` is the space default; `appearanceBySpace[id].overlay.overlayByPage`
 * wins when scope is per-page.
 */
export function resolveEffectiveOverlay({
  overlayLive,
  appearanceBySpace,
  spaceId,
  pageIndex = 0,
}) {
  const live = { ...DEFAULT_LIVE_OVERLAY, ...pickLiveOverlay(overlayLive) };
  const stored = appearanceBySpace?.[spaceId]?.overlay || {};
  const spaceOverlay = { ...live, ...pickLiveOverlay(stored) };
  if (normalizeOverlayScope(stored.overlayScope) !== 'perPage') {
    return spaceOverlay;
  }
  const pageOverlay = overlayAtPage(stored.overlayByPage, pageIndex);
  if (!pageOverlay) return spaceOverlay;
  return { ...spaceOverlay, ...pickLiveOverlay(pageOverlay) };
}
