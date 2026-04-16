import { useCallback, useEffect, useRef, useState } from 'react';

const SPACE_CROSSFADE_MS = 520;

/**
 * Cross-fades wallpaper URL when shell space changes (Home / Work / Games).
 * Same pattern as useHeroMediaCrossfade: base + overlay opacity, then promote on transitionend.
 * When transitions are off (reduced motion) or cycling is mid-transition, snaps to the new URL.
 */
export function useSpaceWallpaperCrossfade({
  displayUrl,
  activeSpaceId,
  cyclingTransitioning,
  transitionsEnabled,
}) {
  const [base, setBase] = useState(displayUrl ?? null);
  const [overlay, setOverlay] = useState(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const baseRef = useRef(displayUrl ?? null);
  const overlayRef = useRef(null);
  const prevCommittedUrlRef = useRef(displayUrl ?? null);
  const lastSpaceRef = useRef(activeSpaceId);
  const rafRef = useRef(null);

  overlayRef.current = overlay;

  useEffect(() => {
    if (!transitionsEnabled) {
      const u = displayUrl ?? null;
      setBase(u);
      setOverlay(null);
      setOverlayOpacity(0);
      baseRef.current = u;
      prevCommittedUrlRef.current = u;
      lastSpaceRef.current = activeSpaceId;
      return;
    }

    const spaceChanged = lastSpaceRef.current !== activeSpaceId;
    const toUrl = displayUrl ?? null;

    if (spaceChanged) {
      const fromUrl = prevCommittedUrlRef.current;
      lastSpaceRef.current = activeSpaceId;

      if (cyclingTransitioning) {
        setBase(toUrl);
        setOverlay(null);
        setOverlayOpacity(0);
        baseRef.current = toUrl;
        prevCommittedUrlRef.current = toUrl;
        return;
      }

      if (overlayRef.current != null) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setBase(toUrl);
        setOverlay(null);
        setOverlayOpacity(0);
        baseRef.current = toUrl;
        prevCommittedUrlRef.current = toUrl;
        return;
      }

      if (!fromUrl || !toUrl || fromUrl === toUrl) {
        setBase(toUrl);
        setOverlay(null);
        setOverlayOpacity(0);
        baseRef.current = toUrl;
        prevCommittedUrlRef.current = toUrl;
        return;
      }

      setBase(fromUrl);
      baseRef.current = fromUrl;
      setOverlay(toUrl);
      setOverlayOpacity(0);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => setOverlayOpacity(1));
      });
      return;
    }

    // Same space: wallpaper URL changed (e.g. settings) — snap base when not mid space-crossfade
    if (!overlay && toUrl !== prevCommittedUrlRef.current) {
      setBase(toUrl);
      baseRef.current = toUrl;
      prevCommittedUrlRef.current = toUrl;
    }
  }, [displayUrl, activeSpaceId, transitionsEnabled, cyclingTransitioning, overlay]);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  const onOverlayTransitionEnd = useCallback(
    (event) => {
      if (!transitionsEnabled) return;
      if (event.propertyName !== 'opacity') return;
      const ov = overlayRef.current;
      if (!ov) return;
      baseRef.current = ov;
      prevCommittedUrlRef.current = ov;
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
    spaceCrossfadeActive: Boolean(overlay),
    spaceCrossfadeMs: SPACE_CROSSFADE_MS,
  };
}
