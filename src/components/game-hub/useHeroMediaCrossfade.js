import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Cross-fades between hero art URLs using stacked layers (opacity).
 * When transitions are disabled, snaps to the latest URL immediately.
 */
export function useHeroMediaCrossfade(artUrl, transitionsEnabled) {
  const baseRef = useRef(artUrl ?? null);
  const overlayRef = useRef(null);
  const [base, setBase] = useState(artUrl ?? null);
  const [overlay, setOverlay] = useState(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const rafRef = useRef(null);

  overlayRef.current = overlay;

  useEffect(() => {
    if (!transitionsEnabled) {
      setBase(artUrl ?? null);
      setOverlay(null);
      setOverlayOpacity(0);
      baseRef.current = artUrl ?? null;
      return;
    }
    if (artUrl == null) {
      setBase(null);
      setOverlay(null);
      setOverlayOpacity(0);
      baseRef.current = null;
      return;
    }
    if (artUrl === baseRef.current) {
      return;
    }

    setOverlay(artUrl);
    setOverlayOpacity(0);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => setOverlayOpacity(1));
    });
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [artUrl, transitionsEnabled]);

  const onOverlayTransitionEnd = useCallback(
    (event) => {
      if (!transitionsEnabled) return;
      if (event.propertyName !== 'opacity') return;
      const ov = overlayRef.current;
      if (!ov) return;
      baseRef.current = ov;
      setBase(ov);
      setOverlay(null);
      setOverlayOpacity(0);
    },
    [transitionsEnabled]
  );

  return {
    baseUrl: base,
    overlayUrl: overlay,
    overlayOpacity,
    onOverlayTransitionEnd,
  };
}
