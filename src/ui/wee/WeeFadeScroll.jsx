import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const DEFAULT_FADE_PX = 36;
const EDGE_EPS = 2;

/**
 * Scroll container with soft edge fades — content dissolves into the shell
 * instead of hard-clipping. Classic “infinite shelf” treatment (Apple Music,
 * Linear, etc.): mask only the clipped edge(s), and clear fades when flush.
 *
 * Scrollbars are hidden by default — fade edges are the scroll affordance.
 *
 * @param {'y' | 'x'} [axis='y']
 * @param {number} [fadePx] — feather depth in CSS pixels
 * @param {boolean} [hideScrollbar=true]
 */
const WeeFadeScroll = forwardRef(function WeeFadeScroll(
  {
    axis = 'y',
    fadePx = DEFAULT_FADE_PX,
    hideScrollbar = true,
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

  // Measure on mount/axis change; ResizeObserver covers content/size churn.
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

  // Re-measure after children paint (images loading into Steam shelves, etc.).
  useEffect(() => {
    scheduleMeasure();
  }, [children, scheduleMeasure]);

  const handleScroll = useCallback(
    (event) => {
      scheduleMeasure();
      onScroll?.(event);
    },
    [onScroll, scheduleMeasure]
  );

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

  return (
    <div
      ref={setRefs}
      className={[
        'wee-fade-scroll min-h-0 min-w-0',
        overflowClass,
        hideScrollbar ? 'scrollbar-hidden' : '[scrollbar-gutter:stable] [scrollbar-width:thin]',
        className,
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
      }}
      data-axis={axis}
      data-fade-start={edges.start ? '1' : '0'}
      data-fade-end={edges.end ? '1' : '0'}
      onScroll={handleScroll}
      onWheel={onWheel}
      {...rest}
    >
      {children}
    </div>
  );
});

WeeFadeScroll.propTypes = {
  axis: PropTypes.oneOf(['y', 'x']),
  fadePx: PropTypes.number,
  hideScrollbar: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
  children: PropTypes.node,
  onScroll: PropTypes.func,
  onWheel: PropTypes.func,
};

export default WeeFadeScroll;
