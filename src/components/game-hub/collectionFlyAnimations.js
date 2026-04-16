/**
 * Collection open/close motion aligned with hub-design.html:
 * - Shelf: grid-template-rows ~0.7s + --physics-ease (slight spring)
 * - Flyers: ~0.6s + smooth deceleration to slot
 * - Settle: crossfade real tiles vs flyers (no hard pop — removes flicker)
 */

/** Matches `.expansion-wrapper` in hub-design.html (0.7s). */
export const COLLECTION_EXPANSION_MS = 700;

/** Matches flyer `transition: all 0.6s` in hub-design.html. */
export const COLLECTION_FLY_MS = 600;

/** hub-design `--physics-ease` on shelf / stacks. */
export const SHELF_PHYSICS_EASE = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

/** hub-design flyer path (settle tween). */
const FLY_PHYSICS_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

/** Close fly-out duration: matches shelf collapse so vacuum and grid row finish together. */
export const COLLECTION_FLY_OUT_MS = COLLECTION_EXPANSION_MS;
const CLOSE_MS = COLLECTION_FLY_OUT_MS;

/**
 * Ghost handshake: after flyers land, keep clones fully opaque on top of the real slot for this window so
 * underlying `<img>` decode/load does not flash through — then crossfade the flyer out.
 */
const GHOST_HANDSHAKE_MS = 100;

/** Crossfade flyer opacity after the ghost hold. */
const HANDOFF_CROSSFADE_MS = 100;

/** Matches `.aura-hub-stack__item--1|2|3` filter brightness in GameHubSpace.css */
export function stackBrightnessForFlyIndex(i) {
  if (i === 0) return 0.46;
  if (i === 1) return 0.64;
  if (i === 2) return 0.88;
  return 1;
}

/**
 * @param {string | undefined} imageUrl
 * @param {'in' | 'out'} mode
 * @param {number} flyIndex stack slot index for brightness matching
 */
function mountFlyer(imageUrl, mode = 'in', flyIndex = 0) {
  const el = document.createElement('div');
  el.setAttribute('aria-hidden', 'true');
  el.className = 'aura-hub-flyer';
  const ms = mode === 'in' ? COLLECTION_FLY_MS : CLOSE_MS;
  const b0 = mode === 'in' ? stackBrightnessForFlyIndex(flyIndex) : 1;
  const filterTween = `filter ${ms}ms ${FLY_PHYSICS_EASE}`;
  const geomTween = `top ${ms}ms ${FLY_PHYSICS_EASE}, left ${ms}ms ${FLY_PHYSICS_EASE}, width ${ms}ms ${FLY_PHYSICS_EASE}, height ${ms}ms ${FLY_PHYSICS_EASE}`;
  const transition =
    mode === 'in'
      ? `${geomTween}, ${filterTween}`
      : `${geomTween}, ${filterTween}, opacity ${ms}ms ease`;

  Object.assign(el.style, {
    position: 'fixed',
    zIndex: '10050',
    pointerEvents: 'none',
    borderRadius: '0.85rem',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    border: '1px solid rgba(255,255,255,0.14)',
    boxShadow: '0 18px 48px rgba(0,0,0,0.42)',
    backgroundImage: imageUrl ? `url(${JSON.stringify(String(imageUrl))})` : 'none',
    opacity: '1',
    filter: `brightness(${b0})`,
    transition,
  });
  document.body.appendChild(el);
  return el;
}

function setFlyerRect(el, rect) {
  el.style.top = `${rect.top}px`;
  el.style.left = `${rect.left}px`;
  el.style.width = `${rect.width}px`;
  el.style.height = `${rect.height}px`;
}

function waitMs(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * @param {{ games: { imageUrl?: string }[], fromRect: DOMRect, getToRect: (i: number) => DOMRect | null, onHandoffStart?: () => void, prepareHandoff?: () => void | Promise<void> }} opts
 * @returns {Promise<{ didFly: boolean }>}
 */
export async function runFlyInAnimations({ games, fromRect, getToRect, onHandoffStart, prepareHandoff }) {
  const moves = [];
  try {
    for (let i = 0; i < games.length; i += 1) {
      const toRect = getToRect(i);
      if (!toRect || toRect.width < 4 || toRect.height < 4) continue;
      const el = mountFlyer(games[i]?.imageUrl, 'in', i);
      setFlyerRect(el, fromRect);
      moves.push({ el, i });
    }

    if (moves.length === 0) {
      return { didFly: false };
    }

    await new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));

    moves.forEach(({ el, i }) => {
      const toRect = getToRect(i);
      if (toRect && toRect.width >= 4 && toRect.height >= 4) {
        setFlyerRect(el, toRect);
        el.style.filter = 'brightness(1)';
      }
    });

    await waitMs(COLLECTION_FLY_MS);

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

export async function runFlyOutAnimations({ games, fromRects, toRect }) {
  const flyers = [];
  try {
    for (let i = 0; i < games.length; i += 1) {
      const fromRect = fromRects[i];
      if (!fromRect || fromRect.width < 4 || fromRect.height < 4) continue;
      const el = mountFlyer(games[i]?.imageUrl, 'out', i);
      setFlyerRect(el, fromRect);
      flyers.push(el);
    }

    if (flyers.length === 0) return;

    await new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));

    flyers.forEach((el, i) => {
      setFlyerRect(el, toRect);
      el.style.filter = `brightness(${stackBrightnessForFlyIndex(i)})`;
      el.style.opacity = '0';
    });

    await waitMs(CLOSE_MS + 24);
  } finally {
    flyers.forEach((el) => el.remove());
  }
}

export const COLLECTION_FLY_PHASE_MS = {
  open: COLLECTION_FLY_MS,
  ghostHandshake: GHOST_HANDSHAKE_MS,
  handoffCrossfade: HANDOFF_CROSSFADE_MS,
  close: CLOSE_MS,
};

/** Wall-clock time for `runFlyOutAnimations` (rAF + transition + padding). */
export function flyOutBlockingMs() {
  return COLLECTION_EXPANSION_MS + 40;
}
