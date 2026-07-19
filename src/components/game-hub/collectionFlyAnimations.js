/**
 * Collection open/close motion for Game Hub / Media Hub shelves.
 * Timing tokens live in design-system.css (--hub-collection-*).
 * Flyers use transform FLIP (translate + scale), not layout thrash.
 *
 * Premium choreography notes:
 * - One shared fly duration for open and close (shelf expand can run slightly longer).
 * - Cap flyer count for GPU; remaining tiles reveal via handoff opacity only.
 * - Abortable waits so rapid open/close does not leave overlapping flyer layers.
 * - Animate transform (+ late opacity on close); snap brightness (no filter tween).
 */

/** Matches `--hub-collection-expand-duration` (ms). */
export const COLLECTION_EXPANSION_MS = 640;

/** Matches `--hub-collection-fly-duration` (ms) — open and close share this clock. */
export const COLLECTION_FLY_MS = 560;

/** Close fly-out uses the same duration as open for symmetrical feel. */
export const COLLECTION_FLY_OUT_MS = COLLECTION_FLY_MS;

/** Per-card stagger; wall-clock capped via MAX flyers. */
export const COLLECTION_FLY_STAGGER_MS = 36;

/** Hard cap — more cards fade in at handoff instead of each spawning a flyer. */
export const COLLECTION_FLY_MAX_CARDS = 8;

/** Matches `--hub-collection-expand-ease` (soft spring — less overshoot than prior 1.56). */
export const SHELF_PHYSICS_EASE = 'cubic-bezier(0.22, 1.18, 0.36, 1)';

/** Matches `--hub-collection-fly-ease`. */
const FLY_PHYSICS_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

const CLOSE_MS = COLLECTION_FLY_OUT_MS;
const GHOST_HANDSHAKE_MS = 90;
const HANDOFF_CROSSFADE_MS = 140;
/** Close: stay solid while traveling, then short fade into the stack. */
const CLOSE_FADE_TAIL_MS = 120;
/** Bound decode wait so settle never hitch after motion finishes. */
const HANDOFF_DECODE_BUDGET_MS = 80;

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
  return Math.min(index, COLLECTION_FLY_MAX_CARDS - 1) * COLLECTION_FLY_STAGGER_MS;
}

function flyWallClockMs(count, baseMs) {
  const n = Math.max(1, Math.min(count, COLLECTION_FLY_MAX_CARDS));
  return baseMs + (n - 1) * COLLECTION_FLY_STAGGER_MS;
}

function selectFlySlice(games, fromRects) {
  const list = Array.isArray(games) ? games : [];
  const capped = list.slice(0, COLLECTION_FLY_MAX_CARDS);
  if (!fromRects) return { games: capped, fromRects: null };
  return {
    games: capped,
    fromRects: Array.isArray(fromRects) ? fromRects.slice(0, COLLECTION_FLY_MAX_CARDS) : fromRects,
  };
}

function waitMs(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const id = window.setTimeout(() => {
      signal?.removeEventListener?.('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      window.clearTimeout(id);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener?.('abort', onAbort, { once: true });
  });
}

function doubleRaf(signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const onAbort = () => {
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener?.('abort', onAbort, { once: true });
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        signal?.removeEventListener?.('abort', onAbort);
        if (signal?.aborted) {
          reject(new DOMException('Aborted', 'AbortError'));
          return;
        }
        resolve();
      });
    });
  });
}

function isAbortError(err) {
  return err?.name === 'AbortError';
}

/**
 * Place flyer at `fromRect` with fixed box; destination reached via translate+scale.
 * Brightness is snapped (not tweened) to keep the compositor on transform/opacity.
 */
function mountFlyer(imageUrl, mode = 'in', flyIndex = 0, getFlyLayerParent) {
  const el = document.createElement('div');
  el.setAttribute('aria-hidden', 'true');
  el.className = 'aura-hub-flyer';
  const ms = mode === 'in' ? COLLECTION_FLY_MS : CLOSE_MS;
  const delay = staggerDelayMs(flyIndex);
  const b0 = mode === 'in' ? stackBrightnessForFlyIndex(flyIndex) : 1;
  const transformTween = `transform ${ms}ms ${FLY_PHYSICS_EASE} ${delay}ms`;
  const transition =
    mode === 'in'
      ? transformTween
      : `${transformTween}, opacity ${CLOSE_FADE_TAIL_MS}ms ${FLY_PHYSICS_EASE} ${Math.max(0, delay + ms - CLOSE_FADE_TAIL_MS)}ms`;

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
    willChange: 'transform, opacity',
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

function removeFlyers(moves) {
  moves.forEach(({ el }) => {
    try {
      el.remove();
    } catch {
      /* already detached */
    }
  });
}

/**
 * @param {{
 *   games: { imageUrl?: string }[],
 *   fromRect: DOMRect,
 *   getToRect: (i: number) => DOMRect | null,
 *   onHandoffStart?: () => void,
 *   prepareHandoff?: () => void | Promise<void>,
 *   getFlyLayerParent?: () => HTMLElement | null,
 *   signal?: AbortSignal,
 * }} opts
 * @returns {Promise<{ didFly: boolean, aborted?: boolean }>}
 */
export async function runFlyInAnimations({
  games,
  fromRect,
  getToRect,
  onHandoffStart,
  prepareHandoff,
  getFlyLayerParent,
  signal,
}) {
  const { games: flyGames } = selectFlySlice(games);
  const moves = [];
  try {
    if (signal?.aborted) return { didFly: false, aborted: true };

    // Kick decode early so handoff rarely waits after motion.
    const handoffPrep = Promise.resolve(prepareHandoff?.()).catch(() => {});

    for (let i = 0; i < flyGames.length; i += 1) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const toRect = getToRect(i);
      if (!toRect || toRect.width < 4 || toRect.height < 4) continue;
      const el = mountFlyer(flyGames[i]?.imageUrl, 'in', i, getFlyLayerParent);
      setFlyerBaseRect(el, fromRect);
      moves.push({ el, i, fromRect, toRect });
    }

    if (moves.length === 0) {
      return { didFly: false };
    }

    await doubleRaf(signal);

    // Remeasure once after layout has a chance to settle — corrects mid-expand destinations.
    moves.forEach(({ el, i, fromRect: fr }) => {
      const toRect = getToRect(i);
      if (toRect && toRect.width >= 4 && toRect.height >= 4) {
        setFlyerTransformTo(el, fr, toRect);
      }
    });

    await waitMs(flyWallClockMs(moves.length, COLLECTION_FLY_MS), signal);

    // Snap bright before crossfade (no filter tween during flight).
    moves.forEach(({ el }) => {
      el.style.filter = 'brightness(1)';
    });

    await Promise.race([handoffPrep, waitMs(HANDOFF_DECODE_BUDGET_MS, signal)]);

    onHandoffStart?.();

    await waitMs(GHOST_HANDSHAKE_MS, signal);

    moves.forEach(({ el }) => {
      el.style.transition = `opacity ${HANDOFF_CROSSFADE_MS}ms ${FLY_PHYSICS_EASE}`;
      el.style.opacity = '0';
    });

    await waitMs(HANDOFF_CROSSFADE_MS, signal);
    return { didFly: true };
  } catch (err) {
    if (isAbortError(err)) return { didFly: false, aborted: true };
    throw err;
  } finally {
    removeFlyers(moves);
  }
}

/**
 * @param {{
 *   games: { imageUrl?: string }[],
 *   fromRects: (DOMRect | null)[],
 *   toRect: DOMRect,
 *   getFlyLayerParent?: () => HTMLElement | null,
 *   signal?: AbortSignal,
 * }} opts
 */
export async function runFlyOutAnimations({ games, fromRects, toRect, getFlyLayerParent, signal }) {
  const { games: flyGames, fromRects: flyFromRects } = selectFlySlice(games, fromRects);
  const flyers = [];
  try {
    if (signal?.aborted) return;

    for (let i = 0; i < flyGames.length; i += 1) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const fromRect = flyFromRects?.[i];
      if (!fromRect || fromRect.width < 4 || fromRect.height < 4) continue;
      const el = mountFlyer(flyGames[i]?.imageUrl, 'out', i, getFlyLayerParent);
      setFlyerBaseRect(el, fromRect);
      flyers.push({ el, fromRect, i });
    }

    if (flyers.length === 0) return;

    await doubleRaf(signal);

    flyers.forEach(({ el, fromRect, i }) => {
      setFlyerTransformTo(el, fromRect, toRect);
      el.style.filter = `brightness(${stackBrightnessForFlyIndex(i)})`;
      // Opacity fades via delayed transition (solid vacuum, then short dissolve).
      el.style.opacity = '0';
    });

    await waitMs(flyWallClockMs(flyers.length, CLOSE_MS) + 16, signal);
  } catch (err) {
    if (isAbortError(err)) return;
    throw err;
  } finally {
    removeFlyers(flyers);
  }
}

export const COLLECTION_FLY_PHASE_MS = {
  open: COLLECTION_FLY_MS,
  ghostHandshake: GHOST_HANDSHAKE_MS,
  handoffCrossfade: HANDOFF_CROSSFADE_MS,
  close: CLOSE_MS,
  stagger: COLLECTION_FLY_STAGGER_MS,
  maxCards: COLLECTION_FLY_MAX_CARDS,
};

/** Wall-clock time for `runFlyOutAnimations` (rAF + transition + padding). */
export function flyOutBlockingMs(gameCount = 4) {
  const n = Math.min(Math.max(1, gameCount), COLLECTION_FLY_MAX_CARDS);
  return flyWallClockMs(n, COLLECTION_FLY_OUT_MS) + 40;
}
