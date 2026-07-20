import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const DEFAULT_FADE_PX = 36;
const EDGE_EPS = 2;
const DRAG_THRESHOLD_PX = 6;
const EDGE_SCROLL_PX = 10;
const EDGE_ZONE_CLASS =
  'absolute top-0 z-10 h-full w-9 border-0 bg-transparent p-0 opacity-0 transition-opacity duration-200 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none';

/**
 * Scroll container with soft edge fades — content dissolves into the shell
 * instead of hard-clipping. Classic “infinite shelf” treatment (Apple Music,
 * Linear, etc.): mask only the clipped edge(s), and clear fades when flush.
 *
 * Optional horizontal pan: click-drag + edge hover auto-scroll (Steam shelves).
 *
 * @param {'y' | 'x'} [axis='y']
 * @param {number} [fadePx] — feather depth in CSS pixels
 * @param {boolean} [hideScrollbar=true]
 * @param {boolean} [panDrag=false] — pointer-drag pans the shelf (x only)
 * @param {boolean} [edgeHoverScroll=false] — hover near ends to scroll (x only)
 */
const WeeFadeScroll = forwardRef(function WeeFadeScroll(
  {
    axis = 'y',
    fadePx = DEFAULT_FADE_PX,
    hideScrollbar = true,
    panDrag = false,
    edgeHoverScroll = false,
    className = '',
    style,
    children,
    onScroll,
    onWheel,
    ...rest
  },
  forwardedRef
) {
  const localRef = useRef(null);
  const setRefs = useCallback(
    (node) => {
      localRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef]
  );

  const [edges, setEdges] = useState({ start: false, end: false });
  const rafRef = useRef(0);
  const dragRef = useRef({
    pointerId: null,
    startX: 0,
    startScroll: 0,
    moved: false,
    active: false,
  });
  const edgeRafRef = useRef(0);
  const edgeDirRef = useRef(0);
  const suppressClickRef = useRef(false);

  const measure = useCallback(() => {
    const el = localRef.current;
    if (!el) return;
    const vertical = axis !== 'x';
    const scrollPos = vertical ? el.scrollTop : el.scrollLeft;
    const client = vertical ? el.clientHeight : el.clientWidth;
    const scroll = vertical ? el.scrollHeight : el.scrollWidth;
    const max = Math.max(0, scroll - client);
    const start = scrollPos > EDGE_EPS;
    const end = max > EDGE_EPS && scrollPos < max - EDGE_EPS;
    setEdges((prev) =>
      prev.start === start && prev.end === end ? prev : { start, end }
    );
  }, [axis]);

  const scheduleMeasure = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      measure();
    });
  }, [measure]);

  useEffect(() => {
    const el = localRef.current;
    if (!el) return undefined;
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(scheduleMeasure) : null;
    ro?.observe(el);
    if (el.firstElementChild) ro?.observe(el.firstElementChild);
    window.addEventListener('resize', scheduleMeasure);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [measure, scheduleMeasure]);

  useEffect(() => {
    scheduleMeasure();
  }, [children, scheduleMeasure]);

  useEffect(
    () => () => {
      if (edgeRafRef.current) cancelAnimationFrame(edgeRafRef.current);
    },
    []
  );

  const handleScroll = useCallback(
    (event) => {
      scheduleMeasure();
      onScroll?.(event);
    },
    [onScroll, scheduleMeasure]
  );

  const stopEdgeScroll = useCallback(() => {
    edgeDirRef.current = 0;
    if (edgeRafRef.current) {
      cancelAnimationFrame(edgeRafRef.current);
      edgeRafRef.current = 0;
    }
  }, []);

  const tickEdgeScroll = useCallback(() => {
    const el = localRef.current;
    const dir = edgeDirRef.current;
    if (!el || !dir) {
      edgeRafRef.current = 0;
      return;
    }
    el.scrollLeft += dir * EDGE_SCROLL_PX;
    scheduleMeasure();
    edgeRafRef.current = requestAnimationFrame(tickEdgeScroll);
  }, [scheduleMeasure]);

  const startEdgeScroll = useCallback(
    (dir) => {
      if (axis !== 'x' || !edgeHoverScroll) return;
      edgeDirRef.current = dir;
      if (!edgeRafRef.current) {
        edgeRafRef.current = requestAnimationFrame(tickEdgeScroll);
      }
    },
    [axis, edgeHoverScroll, tickEdgeScroll]
  );

  const handlePointerDown = useCallback(
    (event) => {
      if (axis !== 'x' || !panDrag) return;
      if (event.button !== 0) return;
      const el = localRef.current;
      if (!el) return;
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startScroll: el.scrollLeft,
        moved: false,
        active: true,
      };
      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    },
    [axis, panDrag]
  );

  const handlePointerMove = useCallback(
    (event) => {
      if (axis !== 'x' || !panDrag) return;
      const drag = dragRef.current;
      if (!drag.active || drag.pointerId !== event.pointerId) return;
      const el = localRef.current;
      if (!el) return;
      const dx = event.clientX - drag.startX;
      if (!drag.moved && Math.abs(dx) < DRAG_THRESHOLD_PX) return;
      if (!drag.moved) {
        drag.moved = true;
        suppressClickRef.current = true;
        el.style.cursor = 'grabbing';
      }
      el.scrollLeft = drag.startScroll - dx;
      scheduleMeasure();
      event.preventDefault();
    },
    [axis, panDrag, scheduleMeasure]
  );

  const endDrag = useCallback(
    (event) => {
      if (axis !== 'x' || !panDrag) return;
      const drag = dragRef.current;
      if (!drag.active) return;
      if (event && drag.pointerId !== event.pointerId) return;
      const el = localRef.current;
      drag.active = false;
      if (el) {
        el.style.cursor = '';
        try {
          if (drag.pointerId != null) el.releasePointerCapture(drag.pointerId);
        } catch {
          /* ignore */
        }
      }
      if (drag.moved) {
        // Suppress the synthetic click that follows a drag so cover tiles don't launch.
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
      }
      drag.moved = false;
      drag.pointerId = null;
    },
    [axis, panDrag]
  );

  const handleClickCapture = useCallback((event) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  }, []);

  const fade = Math.max(0, Number(fadePx) || DEFAULT_FADE_PX);
  const startStop = edges.start ? `${fade}px` : '0px';
  const endStop = edges.end ? `${fade}px` : '0px';
  const vertical = axis !== 'x';
  const enablePan = axis === 'x' && panDrag;
  const enableEdge = axis === 'x' && edgeHoverScroll;

  const maskImage = vertical
    ? `linear-gradient(to bottom, transparent 0, #000 ${startStop}, #000 calc(100% - ${endStop}), transparent 100%)`
    : `linear-gradient(to right, transparent 0, #000 ${startStop}, #000 calc(100% - ${endStop}), transparent 100%)`;

  const overflowClass = vertical
    ? 'overflow-y-auto overflow-x-hidden'
    : 'overflow-x-auto overflow-y-hidden';

  const scrollEl = (
    <div
      ref={setRefs}
      className={[
        'wee-fade-scroll min-h-0 min-w-0',
        overflowClass,
        hideScrollbar ? 'scrollbar-hidden' : '[scrollbar-gutter:stable] [scrollbar-width:thin]',
        enablePan ? 'cursor-grab active:cursor-grabbing' : '',
        enableEdge || enablePan ? 'h-full w-full' : className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...style,
        WebkitMaskImage: maskImage,
        maskImage,
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        touchAction: enablePan ? 'pan-y' : undefined,
      }}
      data-axis={axis}
      data-fade-start={edges.start ? '1' : '0'}
      data-fade-end={edges.end ? '1' : '0'}
      onScroll={handleScroll}
      onWheel={onWheel}
      onPointerDown={enablePan ? handlePointerDown : undefined}
      onPointerMove={enablePan ? handlePointerMove : undefined}
      onPointerUp={enablePan ? endDrag : undefined}
      onPointerCancel={enablePan ? endDrag : undefined}
      onClickCapture={enablePan ? handleClickCapture : undefined}
      {...rest}
    >
      {children}
    </div>
  );

  if (!enableEdge && !enablePan) {
    return scrollEl;
  }

  return (
    <div
      className={['relative min-h-0 min-w-0', className].filter(Boolean).join(' ')}
    >
      {scrollEl}
      {enableEdge && edges.start ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Scroll shelf left"
          className={`${EDGE_ZONE_CLASS} left-0 bg-gradient-to-r from-[hsl(var(--surface-elevated)/0.55)] to-transparent`}
          onPointerEnter={() => startEdgeScroll(-1)}
          onPointerLeave={stopEdgeScroll}
        />
      ) : null}
      {enableEdge && edges.end ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Scroll shelf right"
          className={`${EDGE_ZONE_CLASS} right-0 bg-gradient-to-l from-[hsl(var(--surface-elevated)/0.55)] to-transparent`}
          onPointerEnter={() => startEdgeScroll(1)}
          onPointerLeave={stopEdgeScroll}
        />
      ) : null}
    </div>
  );
});

WeeFadeScroll.propTypes = {
  axis: PropTypes.oneOf(['y', 'x']),
  fadePx: PropTypes.number,
  hideScrollbar: PropTypes.bool,
  panDrag: PropTypes.bool,
  edgeHoverScroll: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
  children: PropTypes.node,
  onScroll: PropTypes.func,
  onWheel: PropTypes.func,
};

export default WeeFadeScroll;
