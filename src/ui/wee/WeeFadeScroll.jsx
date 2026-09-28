import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import WeeGlassPill from './WeeGlassPill';

const DEFAULT_FADE_PX = 36;
const EDGE_EPS = 2;
const DRAG_THRESHOLD_PX = 6;
const EDGE_VEL_MAX = 16;
const EDGE_VEL_ACCEL = 0.55;

/**
 * Scroll container with soft edge fades — content dissolves into the shell
 * instead of hard-clipping.
 *
 * Horizontal pan (Steam shelves): pointer-drag is coalesced to one scroll write
 * per frame, snap is suspended while dragging, and edge chevrons ease-scroll.
 *
 * @param {'y' | 'x'} [axis='y']
 * @param {number} [fadePx]
 * @param {boolean} [hideScrollbar=true]
 * @param {boolean} [panDrag=false]
 * @param {boolean} [edgeHoverScroll=false]
 * @param {boolean} [keyboardStep=false] — Left/Right step one tile while the shelf is hovered
 */
const WeeFadeScroll = forwardRef(function WeeFadeScroll(
  {
    axis = 'y',
    fadePx = DEFAULT_FADE_PX,
    hideScrollbar = true,
    panDrag = false,
    edgeHoverScroll = false,
    keyboardStep = false,
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
  const [hot, setHot] = useState(false);
  const rafRef = useRef(0);
  const dragRafRef = useRef(0);
  const pendingScrollRef = useRef(null);
  const dragRef = useRef({
    pointerId: null,
    startX: 0,
    startScroll: 0,
    moved: false,
    active: false,
    snap: '',
  });
  const edgeRafRef = useRef(0);
  const edgeDirRef = useRef(0);
  const edgeVelRef = useRef(0);
  const suppressClickRef = useRef(false);
  const hotRef = useRef(false);
  const draggingRef = useRef(false);

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
    if (draggingRef.current) return;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      if (draggingRef.current) return;
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
      if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current);
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

  const enablePan = axis === 'x' && panDrag;
  const enableEdge = axis === 'x' && edgeHoverScroll;
  const enableKeys = axis === 'x' && (keyboardStep || panDrag);

  useEffect(() => {
    if (!enableKeys) return undefined;
    const onKey = (event) => {
      if (!hotRef.current) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const target = event.target;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      const el = localRef.current;
      if (!el) return;
      event.preventDefault();
      const tile = el.firstElementChild?.firstElementChild;
      const step = tile
        ? Math.max(48, tile.getBoundingClientRect().width + 10)
        : Math.round(el.clientWidth * 0.72);
      el.scrollBy({
        left: event.key === 'ArrowLeft' ? -step : step,
        behavior: 'smooth',
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enableKeys]);

  const handleScroll = useCallback(
    (event) => {
      if (!draggingRef.current) scheduleMeasure();
      onScroll?.(event);
    },
    [onScroll, scheduleMeasure]
  );

  const stopEdgeScroll = useCallback(() => {
    edgeDirRef.current = 0;
    edgeVelRef.current = 0;
    if (edgeRafRef.current) {
      cancelAnimationFrame(edgeRafRef.current);
      edgeRafRef.current = 0;
    }
    measure();
  }, [measure]);

  const tickEdgeScroll = useCallback(() => {
    const el = localRef.current;
    const dir = edgeDirRef.current;
    if (!el || !dir) {
      edgeRafRef.current = 0;
      edgeVelRef.current = 0;
      return;
    }
    edgeVelRef.current = Math.min(EDGE_VEL_MAX, edgeVelRef.current + EDGE_VEL_ACCEL);
    el.scrollLeft += dir * edgeVelRef.current;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    const atStart = dir < 0 && el.scrollLeft <= EDGE_EPS;
    const atEnd = dir > 0 && el.scrollLeft >= max - EDGE_EPS;
    if (atStart || atEnd) {
      edgeDirRef.current = 0;
      edgeVelRef.current = 0;
      edgeRafRef.current = 0;
      measure();
      return;
    }
    edgeRafRef.current = requestAnimationFrame(tickEdgeScroll);
  }, [measure]);

  const startEdgeScroll = useCallback(
    (dir) => {
      if (axis !== 'x' || !edgeHoverScroll) return;
      if (draggingRef.current) return;
      edgeDirRef.current = dir;
      if (!edgeRafRef.current) {
        edgeVelRef.current = 1.5;
        edgeRafRef.current = requestAnimationFrame(tickEdgeScroll);
      }
    },
    [axis, edgeHoverScroll, tickEdgeScroll]
  );

  const flushDragScroll = useCallback(() => {
    dragRafRef.current = 0;
    const el = localRef.current;
    const next = pendingScrollRef.current;
    if (!el || next == null) return;
    el.scrollLeft = next;
  }, []);

  const handlePointerDown = useCallback(
    (event) => {
      if (axis !== 'x' || !panDrag) return;
      if (event.button !== 0) return;
      if (event.target?.closest?.('[data-shelf-edge]')) return;
      const el = localRef.current;
      if (!el) return;
      stopEdgeScroll();
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startScroll: el.scrollLeft,
        moved: false,
        active: true,
        snap: el.style.scrollSnapType || '',
      };
      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    },
    [axis, panDrag, stopEdgeScroll]
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
        draggingRef.current = true;
        suppressClickRef.current = true;
        el.dataset.panning = '1';
        el.style.scrollSnapType = 'none';
        el.style.cursor = 'grabbing';
      }
      pendingScrollRef.current = drag.startScroll - dx;
      if (!dragRafRef.current) {
        dragRafRef.current = requestAnimationFrame(flushDragScroll);
      }
      event.preventDefault();
    },
    [axis, panDrag, flushDragScroll]
  );

  const endDrag = useCallback(
    (event) => {
      if (axis !== 'x' || !panDrag) return;
      const drag = dragRef.current;
      if (!drag.active) return;
      if (event && drag.pointerId !== event.pointerId) return;
      const el = localRef.current;
      if (dragRafRef.current) {
        cancelAnimationFrame(dragRafRef.current);
        flushDragScroll();
      }
      drag.active = false;
      draggingRef.current = false;
      pendingScrollRef.current = null;
      if (el) {
        el.style.cursor = '';
        delete el.dataset.panning;
        el.style.scrollSnapType = drag.snap;
        try {
          if (drag.pointerId != null) el.releasePointerCapture(drag.pointerId);
        } catch {
          /* ignore */
        }
      }
      if (drag.moved) {
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
        measure();
      }
      drag.moved = false;
      drag.pointerId = null;
    },
    [axis, panDrag, flushDragScroll, measure]
  );

  const handleClickCapture = useCallback((event) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  }, []);

  const setHotState = useCallback((next) => {
    hotRef.current = next;
    setHot(next);
    if (!next) stopEdgeScroll();
  }, [stopEdgeScroll]);

  const fade = Math.max(0, Number(fadePx) || DEFAULT_FADE_PX);
  const startStop = edges.start ? `${fade}px` : '0px';
  const endStop = edges.end ? `${fade}px` : '0px';
  const vertical = axis !== 'x';

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
        enablePan ? 'cursor-grab' : '',
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

  const showChevrons = enableEdge && hot;

  return (
    <div
      className={['relative min-h-0 min-w-0', className].filter(Boolean).join(' ')}
      onPointerEnter={() => setHotState(true)}
      onPointerLeave={() => setHotState(false)}
    >
      {scrollEl}
      {showChevrons && edges.start ? (
        <WeeGlassPill
          as="button"
          data-shelf-edge="start"
          type="button"
          aria-label="Scroll shelf left"
          className="absolute left-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full p-0 text-[hsl(var(--text-primary))]"
          onPointerEnter={() => startEdgeScroll(-1)}
          onPointerLeave={stopEdgeScroll}
          onClick={(event) => event.stopPropagation()}
        >
          <ChevronLeft size={16} strokeWidth={2.5} aria-hidden />
        </WeeGlassPill>
      ) : null}
      {showChevrons && edges.end ? (
        <WeeGlassPill
          as="button"
          data-shelf-edge="end"
          type="button"
          aria-label="Scroll shelf right"
          className="absolute right-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full p-0 text-[hsl(var(--text-primary))]"
          onPointerEnter={() => startEdgeScroll(1)}
          onPointerLeave={stopEdgeScroll}
          onClick={(event) => event.stopPropagation()}
        >
          <ChevronRight size={16} strokeWidth={2.5} aria-hidden />
        </WeeGlassPill>
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
  keyboardStep: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
  children: PropTypes.node,
  onScroll: PropTypes.func,
  onWheel: PropTypes.func,
};

export default WeeFadeScroll;
