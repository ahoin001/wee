/**
 * Viewport footprint of the control a dialog grows out of.
 * @param {Element | null | undefined} element
 * @returns {{ x: number, y: number, width: number, height: number, radius: number } | null}
 */
export function readOriginRect(element) {
  if (!element || typeof element.getBoundingClientRect !== 'function') return null;
  const box = element.getBoundingClientRect();
  if (box.width < 1 || box.height < 1) return null;
  const parsed = Number.parseFloat(window.getComputedStyle(element).borderTopLeftRadius);
  const radius = Number.isFinite(parsed) && parsed > 0
    ? parsed
    : Math.min(box.width, box.height) / 2;
  return {
    x: box.left,
    y: box.top,
    width: box.width,
    height: box.height,
    radius,
    source: element,
  };
}

/**
 * Fill color and plus glyph of the source element, so the shell is in the right
 * color family mid-flight. The real element takes over for the last frames.
 * @param {Element | null | undefined} element
 */
export function readTilePaint(element) {
  if (!element || typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
    return null;
  }
  const cs = window.getComputedStyle(element);
  const after = window.getComputedStyle(element, '::after');
  const plusContent = String(after.content || '').replace(/^['"]|['"]$/g, '');
  const plusSize = Number.parseFloat(after.fontSize);
  const fill = cs.backgroundColor;
  const transparentFill = !fill || fill === 'transparent' || /,\s*0\)$|\/\s*0\)$/.test(fill);
  return {
    backgroundColor: transparentFill ? null : fill,
    plus: plusContent && plusContent !== 'none' ? plusContent : '',
    plusSize: Number.isFinite(plusSize) ? plusSize : 32,
    plusColor: after.color,
  };
}

/** Hide or reveal the element a shell is flying out of. Layout stays for remeasure. */
export function setOriginCovered(element, covered) {
  if (!element || typeof element.setAttribute !== 'function') return;
  if (covered) {
    if (element.getAttribute('data-wee-origin-state') !== 'covered') {
      element.setAttribute('data-wee-origin-state', 'covered');
    }
  } else if (element.hasAttribute('data-wee-origin-state')) {
    element.removeAttribute('data-wee-origin-state');
  }
}

/** Element registered for a transient origin key (e.g. the ribbon clock). */
export function findOriginElement(key) {
  if (!key || typeof document === 'undefined') return null;
  return document.querySelector(`[data-wee-origin-key="${key}"]`);
}

/** @param {{ x: number, y: number, width: number, height: number, radius?: number } | null} rect */
export function isOriginRectOnScreen(rect) {
  if (!rect || typeof window === 'undefined') return false;
  const right = rect.x + rect.width;
  const bottom = rect.y + rect.height;
  return rect.width > 0
    && rect.height > 0
    && right > 0
    && bottom > 0
    && rect.y < window.innerHeight
    && rect.x < window.innerWidth;
}

/**
 * Delta from the dialog's resting box back to the control that opened it.
 * @param {{ x: number, y: number, width: number, height: number, radius?: number }} origin
 * @param {DOMRect} box
 */
export function footprintFromOrigin(origin, box) {
  const destCx = box.left + box.width / 2;
  const destCy = box.top + box.height / 2;
  const originCx = origin.x + origin.width / 2;
  const originCy = origin.y + origin.height / 2;
  return {
    x: originCx - destCx,
    y: originCy - destCy,
    scaleX: Math.max(0.05, origin.width / Math.max(box.width, 1)),
    scaleY: Math.max(0.05, origin.height / Math.max(box.height, 1)),
    radius: origin.radius ?? 24,
  };
}

/** Layout size, ignoring a transform already applied to the shell. */
export function measureUntransformed(element) {
  const previous = element.style.transform;
  element.style.transform = 'none';
  const box = element.getBoundingClientRect();
  element.style.transform = previous;
  return box;
}
