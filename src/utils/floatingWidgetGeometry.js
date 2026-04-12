/**
 * Shared layout helpers for viewport-clamped floating widgets.
 * Widgets keep their own visuals; geometry stays consistent app-wide.
 */

export function getViewportSize() {
  if (typeof window === 'undefined') {
    return { width: 1920, height: 1080 };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * Clamp top-left position so a widget of `size` stays fully inside the viewport.
 */
export function clampFloatingWidgetPosition(position, size, viewport = getViewportSize()) {
  const { width: vw, height: vh } = viewport;
  const w = Math.max(1, size.width);
  const h = Math.max(1, size.height);
  return {
    x: Math.max(0, Math.min(vw - w, position.x)),
    y: Math.max(0, Math.min(vh - h, position.y)),
  };
}
