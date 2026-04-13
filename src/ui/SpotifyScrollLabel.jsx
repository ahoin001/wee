import React, { useLayoutEffect, useRef, useState, useCallback } from 'react';

const GAP_PX = 32;

/**
 * Spotify-style horizontal scroll when text overflows (seamless loop via duplicated line).
 * Styling lives in FloatingSpotifyWidget.css (`.spotify-scroll-label*`). Reduced motion: ellipsis.
 */
function SpotifyScrollLabel({ text, className = '', as: Comp = 'div', ...rest }) {
  const clipRef = useRef(null);
  const firstLineRef = useRef(null);
  const [overflow, setOverflow] = useState(false);

  const display = text == null ? '' : String(text);

  const measure = useCallback(() => {
    const clip = clipRef.current;
    const line = firstLineRef.current;
    if (!clip || !line) return;
    const needs = line.scrollWidth > clip.clientWidth + 1;
    setOverflow(needs);
    if (needs) {
      const shift = -(line.offsetWidth + GAP_PX);
      clip.style.setProperty('--spotify-marquee-shift', `${shift}px`);
      const extra = line.scrollWidth - clip.clientWidth;
      const duration = Math.max(10, Math.min(48, 8 + extra / 28));
      clip.style.setProperty('--spotify-marquee-duration', `${duration}s`);
    }
  }, [display]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useLayoutEffect(() => {
    const clip = clipRef.current;
    if (!clip) return undefined;
    const ro = new ResizeObserver(() => measure());
    ro.observe(clip);
    return () => ro.disconnect();
  }, [measure]);

  return (
    <Comp
      className={`spotify-scroll-label ${overflow ? 'spotify-scroll-label--overflow' : ''} ${className}`.trim()}
      title={display}
      {...rest}
    >
      <div ref={clipRef} className="spotify-scroll-label__clip">
        <div
          className={`spotify-scroll-label__track ${overflow ? 'spotify-scroll-label__track--animate' : ''}`}
        >
          <span ref={firstLineRef} className="spotify-scroll-label__line">
            {display}
          </span>
          {overflow ? (
            <span className="spotify-scroll-label__line spotify-scroll-label__line--ghost" aria-hidden="true">
              {display}
            </span>
          ) : null}
        </div>
      </div>
    </Comp>
  );
}

export default React.memo(SpotifyScrollLabel);
