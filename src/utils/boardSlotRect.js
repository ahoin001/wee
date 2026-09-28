import { useLayoutEffect, useState } from 'react';

/** Viewport center of an element. */
export function pointFromElement(el) {
  if (!el || typeof el.getBoundingClientRect !== 'function') return null;
  const rect = el.getBoundingClientRect();
  if (rect.width < 1 && rect.height < 1) return null;
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    bottom: rect.bottom,
    right: rect.right,
  };
}

/** Live board cell marked with `data-wee-board-slot`. */
export function boardSlotPoint(index) {
  if (index == null || typeof document === 'undefined') return null;
  const el = document.querySelector(`[data-wee-board-slot="${Number(index)}"]`);
  return pointFromElement(el);
}

/**
 * Place a pill against a tile: above it, or below when that would leave the
 * viewport or cover the dock.
 */
export function placeAnchoredPill(rect, panelWidth, panelHeight) {
  const margin = 12;
  const dockClearance = 120;
  const dockTop = window.innerHeight - dockClearance;
  const width = Math.max(1, panelWidth || 1);
  let left = rect.x - width / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
  const aboveTop = rect.top - margin - panelHeight;
  const belowBottom = rect.bottom + margin + panelHeight;
  const fitsAbove = aboveTop >= margin;
  const fitsBelow = belowBottom <= dockTop;
  const placeAbove = fitsAbove || !fitsBelow;
  return { left, placeAbove };
}

export function useBoardSlotRect(index, enabled, layoutKey = '') {
  const [rect, setRect] = useState(null);

  useLayoutEffect(() => {
    if (!enabled || index == null) {
      setRect(null);
      return undefined;
    }
    const measure = () => {
      const next = boardSlotPoint(index);
      setRect((prev) => {
        if (!next) return null;
        if (
          prev &&
          Math.abs(prev.x - next.x) < 0.5 &&
          Math.abs(prev.y - next.y) < 0.5 &&
          Math.abs(prev.width - next.width) < 0.5 &&
          Math.abs(prev.height - next.height) < 0.5
        ) {
          return prev;
        }
        return next;
      });
    };
    measure();
    window.addEventListener('resize', measure);
    const settle = window.setTimeout(measure, 480);
    return () => {
      window.removeEventListener('resize', measure);
      window.clearTimeout(settle);
    };
  }, [enabled, index, layoutKey]);

  return rect;
}
