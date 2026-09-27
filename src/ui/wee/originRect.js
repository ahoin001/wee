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
  };
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
