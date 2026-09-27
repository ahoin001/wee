import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { animate, m, useMotionValue } from 'framer-motion';
import { assignLiquidEdgeSprings, createWeeTransition } from '../../design/weeMotion';

const MotionDiv = m.div;

/** Mark a positioned group so the selection disc can stretch between options. */
export const WEE_LIQUID_ROOT_ATTR = 'data-wee-liquid-root';

const edgeMemory = new WeakMap();

function readMemory(root, layoutId) {
  return edgeMemory.get(root)?.get(layoutId) || null;
}

function writeMemory(root, layoutId, box) {
  let map = edgeMemory.get(root);
  if (!map) {
    map = new Map();
    edgeMemory.set(root, map);
  }
  map.set(layoutId, box);
}

function boxWithinRoot(root, el) {
  const rootRect = root.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  const cs = getComputedStyle(root);
  const borderLeft = parseFloat(cs.borderLeftWidth) || 0;
  const borderTop = parseFloat(cs.borderTopWidth) || 0;
  const left = rect.left - rootRect.left - borderLeft + root.scrollLeft;
  const top = rect.top - rootRect.top - borderTop + root.scrollTop;
  return {
    left,
    top,
    right: left + rect.width,
    bottom: top + rect.height,
  };
}

function stopAll(controls) {
  controls.forEach((control) => {
    try {
      control.stop();
    } catch {
      /* already finished */
    }
  });
  controls.length = 0;
}

/**
 * Shared layoutId selection disc — same chrome as space-rail `pillActive`.
 * Inside a `[data-wee-liquid-root]` group, the leading and trailing edges
 * ride different springs so the disc stretches, then settles.
 * Wrap sibling options in a Framer `LayoutGroup` when no liquid root is present.
 */
function WeeLayoutActiveDisc({
  layoutId = 'weeActiveDisc',
  className = '',
  reducedMotion = false,
  transition,
}) {
  const anchorRef = useRef(null);
  const [rootEl, setRootEl] = useState(null);

  useLayoutEffect(() => {
    if (reducedMotion) {
      setRootEl(null);
      return undefined;
    }
    const anchor = anchorRef.current;
    const root = anchor?.closest?.(`[${WEE_LIQUID_ROOT_ATTR}]`) || null;
    setRootEl(root);
    return undefined;
  }, [reducedMotion, layoutId]);

  const discClass = [
    'pointer-events-none z-0',
    'rounded-full bg-[hsl(var(--surface-elevated))] shadow-[var(--shadow-md)]',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (reducedMotion || !rootEl) {
    return (
      <MotionDiv
        ref={anchorRef}
        layoutId={layoutId}
        className={['absolute inset-0', discClass].join(' ')}
        transition={
          reducedMotion
            ? { duration: 0.12 }
            : (transition ?? createWeeTransition('pillOpen', { reducedMotion: false }))
        }
        aria-hidden
      />
    );
  }

  return (
    <>
      <span ref={anchorRef} className="pointer-events-none absolute inset-0" aria-hidden />
      {createPortal(
        <LiquidEdgeFill
          root={rootEl}
          anchorRef={anchorRef}
          layoutId={layoutId}
          className={discClass}
        />,
        rootEl
      )}
    </>
  );
}

function LiquidEdgeFill({ root, anchorRef, layoutId, className }) {
  const left = useMotionValue(0);
  const right = useMotionValue(0);
  const top = useMotionValue(0);
  const bottom = useMotionValue(0);
  const width = useMotionValue(0);
  const height = useMotionValue(0);

  useLayoutEffect(() => {
    const controls = [];
    let frame = 0;

    const bindSize = () => {
      width.set(Math.max(0, right.get() - left.get()));
      height.set(Math.max(0, bottom.get() - top.get()));
    };

    const unsubLeft = left.on('change', bindSize);
    const unsubRight = right.on('change', bindSize);
    const unsubTop = top.on('change', bindSize);
    const unsubBottom = bottom.on('change', bindSize);

    const jump = (box) => {
      stopAll(controls);
      left.set(box.left);
      right.set(box.right);
      top.set(box.top);
      bottom.set(box.bottom);
      bindSize();
    };

    const syncEdges = (shouldSpring) => {
      const anchor = anchorRef.current;
      if (!anchor || !root.isConnected) return;
      const next = boxWithinRoot(root, anchor);
      const prev = readMemory(root, layoutId);
      writeMemory(root, layoutId, next);
      if (!shouldSpring || !prev) {
        jump(next);
        return;
      }
      const dx = next.left - prev.left;
      const dy = next.top - prev.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
        jump(next);
        return;
      }
      const horizontal = Math.abs(dx) >= Math.abs(dy);
      const edges = assignLiquidEdgeSprings(horizontal ? dx : dy, false);
      const cross = edges.start;
      stopAll(controls);
      left.set(prev.left);
      right.set(prev.right);
      top.set(prev.top);
      bottom.set(prev.bottom);
      bindSize();
      if (horizontal) {
        controls.push(animate(left, next.left, edges.start));
        controls.push(animate(right, next.right, edges.end));
        controls.push(animate(top, next.top, cross));
        controls.push(animate(bottom, next.bottom, cross));
      } else {
        controls.push(animate(left, next.left, cross));
        controls.push(animate(right, next.right, cross));
        controls.push(animate(top, next.top, edges.start));
        controls.push(animate(bottom, next.bottom, edges.end));
      }
    };

    syncEdges(true);
    let skipResize = 1;
    const ro = new ResizeObserver(() => {
      if (skipResize > 0) {
        skipResize -= 1;
        return;
      }
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => syncEdges(false));
    });
    ro.observe(root);

    return () => {
      window.cancelAnimationFrame(frame);
      stopAll(controls);
      unsubLeft();
      unsubRight();
      unsubTop();
      unsubBottom();
      ro.disconnect();
    };
  }, [anchorRef, bottom, height, layoutId, left, right, root, top, width]);

  return (
    <MotionDiv
      className={['absolute', className].filter(Boolean).join(' ')}
      style={{ left, top, width, height }}
      aria-hidden
    />
  );
}

LiquidEdgeFill.propTypes = {
  root: PropTypes.instanceOf(Element).isRequired,
  anchorRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  layoutId: PropTypes.string.isRequired,
  className: PropTypes.string,
};

WeeLayoutActiveDisc.propTypes = {
  layoutId: PropTypes.string,
  className: PropTypes.string,
  reducedMotion: PropTypes.bool,
  transition: PropTypes.object,
};

export default WeeLayoutActiveDisc;
