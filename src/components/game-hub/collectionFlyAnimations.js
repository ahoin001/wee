/**
 * Collection open/close motion for Game Hub / Media Hub shelves.
 * Timing tokens live in design-system.css (--hub-collection-*).
 * Flyers use transform FLIP (translate + scale), not layout thrash.
 */

/** Matches `--hub-collection-expand-duration` (ms). */
export const COLLECTION_EXPANSION_MS = 700;

/** Matches `--hub-collection-fly-duration` (ms). */
export const COLLECTION_FLY_MS = 600;

/** Per-card stagger; total wall-clock stays ≤ shelf duration for typical stacks. */
export const COLLECTION_FLY_STAGGER_MS = 40;

/** Matches `--hub-collection-expand-ease`. */
export const SHELF_PHYSICS_EASE = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

/** Matches `--hub-collection-fly-ease`. */
const FLY_PHYSICS_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

/** Close fly-out duration: matches shelf collapse so vacuum and grid row finish together. */
export const COLLECTION_FLY_OUT_MS = COLLECTION_EXPANSION_MS;
const CLOSE_MS = COLLECTION_FLY_OUT_MS;

const GHOST_HANDSHAKE_MS = 120;
const HANDOFF_CROSSFADE_MS = 120;

/** Matches `.aura-hub-stack__item--1|2|3` filter brightness in GameHubSpace.css */
export function stackBrightnessForFlyIndex(i) {
  if (i === 0) return 0.46;
  if (i === 1) return 0.64;
  if (i === 2) return 0.88;
  return 1;
}

function defaultFlyLayerParent() {
  return (
    document.querySelector('.aura-hub-space') ??
    document.querySelector('.media-hub-space') ??
    document.body
  );
}

function staggerDelayMs(index) {
  return Math.min(index, 8) * COLLECTION_FLY_STAGGER_MS;
}

function flyWallClockMs(count, baseMs) {
  const n = Math.max(1, Math.min(count, 9));
  return baseMs + (n - 1) * COLLECTION_FLY_STAGGER_MS;
}

/**
 * Place flyer at `fromRect` with fixed box; destination reached via translate+scale.
 */
function mountFlyer(imageUrl, mode = 'in', flyIndex = 0, getFlyLayerParent) {
  const el = document.createElement('div');
  el.setAttribute('aria-hidden', 'true');
  el.className = 'aura-hub-flyer';
  const ms = mode === 'in' ? COLLECTION_FLY_MS : CLOSE_MS;
  const delay = staggerDelayMs(flyIndex);
  const b0 = mode === 'in' ? stackBrightnessForFlyIndex(flyIndex) : 1;
  const filterTween = `filter ${ms}ms ${FLY_PHYSICS_EASE} ${delay}ms`;
  const transformTween = `transform ${ms}ms ${FLY_PHYSICS_EASE} ${delay}ms`;
  const transition =
    mode === 'in'
      ? `${transformTween}, ${filterTween}`
      : `${transformTween}, ${filterTween}, opacity ${ms}ms ease ${delay}ms`;

  Object.assign(el.style, {
    position: 'fixed',
    zIndex: '10050',
    pointerEvents: 'none',
    backgroundImage: imageUrl ? `url(${JSON.stringify(String(imageUrl))})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: '1',
    filter: `brightness(${b0})`,
    transformOrigin: 'top left',
    transform: 'translate3d(0,0,0) scale(1,1)',
    willChange: 'transform, filter, opacity',
    transition,
  });
  const parent =
    (typeof getFlyLayerParent === 'function' ? getFlyLayerParent() : null) || defaultFlyLayerParent();
  parent.appendChild(el);
  return el;
}

function setFlyerBaseRect(el, rect) {
  el.style.top = `${rect.top}px`;
  el.style.left = `${rect.left}px`;
  el.style.width = `${rect.width}px`;
  el.style.height = `${rect.height}px`;
  el.style.transform = 'translate3d(0,0,0) scale(1,1)';
}

function setFlyerTransformTo(el, fromRect, toRect) {
  const sx = toRect.width / Math.max(fromRect.width, 1);
  const sy = toRect.height / Math.max(fromRect.height, 1);
  const dx = toRect.left - fromRect.left;
  const dy = toRect.top - fromRect.top;
  el.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`;
}

function waitMs(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * @param {{ games: { imageUrl?: string }[], fromRect: DOMRect, getToRect: (i: number) => DOMRect | null, onHandoffStart?: () => void, prepareHandoff?: () => void | Promise<void>, getFlyLayerParent?: () => HTMLElement | null }} opts
 * @returns {Promise<{ didFly: boolean }>}
 */
export async function runFlyInAnimations({ games, fromRect, getToRect, onHandoffStart, prepareHandoff, getFlyLayerParent }) {
  const moves = [];
  try {
    for (let i = 0; i < games.length; i += 1) {
      const toRect = getToRect(i);
      if (!toRect || toRect.width < 4 || toRect.height < 4) continue;
      const el = mountFlyer(games[i]?.imageUrl, 'in', i, getFlyLayerParent);
      setFlyerBaseRect(el, fromRect);
      moves.push({ el, i, fromRect, toRect });
    }

    if (moves.length === 0) {
      return { didFly: false };
    }

    await new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));

    moves.forEach(({ el, i, fromRect: fr }) => {
      const toRect = getToRect(i);
      if (toRect && toRect.width >= 4 && toRect.height >= 4) {
        setFlyerTransformTo(el, fr, toRect);
        el.style.filter = 'brightness(1)';
      }
    });

    await waitMs(flyWallClockMs(moves.length, COLLECTION_FLY_MS));

    await prepareHandoff?.();

    onHandoffStart?.();

    await waitMs(GHOST_HANDSHAKE_MS);

    moves.forEach(({ el }) => {
      el.style.transition = `opacity ${HANDOFF_CROSSFADE_MS}ms ${FLY_PHYSICS_EASE}, filter ${HANDOFF_CROSSFADE_MS}ms ${FLY_PHYSICS_EASE}`;
      el.style.opacity = '0';
    });

    await waitMs(HANDOFF_CROSSFADE_MS);
    return { didFly: true };
  } finally {
    moves.forEach(({ el }) => el.remove());
  }
}

export async function runFlyOutAnimations({ games, fromRects, toRect, getFlyLayerParent }) {
  const flyers = [];
  try {
    for (let i = 0; i < games.length; i += 1) {
      const fromRect = fromRects[i];
      if (!fromRect || fromRect.width < 4 || fromRect.height < 4) continue;
      const el = mountFlyer(games[i]?.imageUrl, 'out', i, getFlyLayerParent);
      setFlyerBaseRect(el, fromRect);
      flyers.push({ el, fromRect, i });
    }

    if (flyers.length === 0) return;

    await new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));

    flyers.forEach(({ el, fromRect, i }) => {
      setFlyerTransformTo(el, fromRect, toRect);
      el.style.filter = `brightness(${stackBrightnessForFlyIndex(i)})`;
      el.style.opacity = '0';
    });

    await waitMs(flyWallClockMs(flyers.length, CLOSE_MS) + 24);
  } finally {
    flyers.forEach(({ el }) => el.remove());
  }
}

export const COLLECTION_FLY_PHASE_MS = {
  open: COLLECTION_FLY_MS,
  ghostHandshake: GHOST_HANDSHAKE_MS,
  handoffCrossfade: HANDOFF_CROSSFADE_MS,
  close: CLOSE_MS,
  stagger: COLLECTION_FLY_STAGGER_MS,
};

/** Wall-clock time for `runFlyOutAnimations` (rAF + transition + padding). */
export function flyOutBlockingMs(gameCount = 4) {
  return flyWallClockMs(gameCount, COLLECTION_EXPANSION_MS) + 40;
}
