import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Cross-fades between hero art URLs using stacked layers (opacity).
 * Includes optional min-hold + latest-target coalescing for rapid hover churn.
 * When transitions are disabled, snaps to the latest URL immediately.
 */
export function useHeroMediaCrossfade(artUrl, transitionsEnabled, options = {}) {
  const minHoldMs = Number.isFinite(options.minHoldMs) ? Math.max(0, options.minHoldMs) : 260;
  const baseRef = useRef(artUrl ?? null);
  const overlayRef = useRef(null);
  const pendingRef = useRef(null);
  const holdTimerRef = useRef(null);
  const lastCommitAtRef = useRef(0);
  const [base, setBase] = useState(artUrl ?? null);
  const [overlay, setOverlay] = useState(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const rafRef = useRef(null);

  overlayRef.current = overlay;

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const runTransition = useCallback((nextUrl) => {
    if (!nextUrl) return;
    pendingRef.current = null;
    setOverlay(nextUrl);
    setOverlayOpacity(0);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => setOverlayOpacity(1));
    });
  }, []);

  useEffect(() => {
    if (!transitionsEnabled) {
      clearHoldTimer();
      pendingRef.current = null;
      setBase(artUrl ?? null);
      setOverlay(null);
      setOverlayOpacity(0);
      baseRef.current = artUrl ?? null;
      lastCommitAtRef.current = Date.now();
      return;
    }

    if (artUrl == null) {
      clearHoldTimer();
      pendingRef.current = null;
      setBase(null);
      setOverlay(null);
      setOverlayOpacity(0);
      baseRef.current = null;
      lastCommitAtRef.current = Date.now();
      return;
    }
    if (artUrl === baseRef.current || artUrl === overlayRef.current) {
      return;
    }

    pendingRef.current = artUrl;

    // Never restart mid-flight; coalesce to latest and apply after this fade settles.
    if (overlayRef.current) {
      return;
    }

    const elapsed = Date.now() - lastCommitAtRef.current;
    const waitMs = Math.max(0, minHoldMs - elapsed);
    if (waitMs > 0) {
      clearHoldTimer();
      holdTimerRef.current = setTimeout(() => {
        holdTimerRef.current = null;
        const pending = pendingRef.current;
        if (!pending || pending === baseRef.current || pending === overlayRef.current) return;
        runTransition(pending);
      }, waitMs);
      return;
    }

    runTransition(artUrl);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [artUrl, clearHoldTimer, minHoldMs, runTransition, transitionsEnabled]);

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
      lastCommitAtRef.current = Date.now();

      const pending = pendingRef.current;
      if (!pending || pending === ov) return;

      clearHoldTimer();
      holdTimerRef.current = setTimeout(() => {
        holdTimerRef.current = null;
        const latest = pendingRef.current;
        if (!latest || latest === baseRef.current || latest === overlayRef.current) return;
        runTransition(latest);
      }, minHoldMs);
    },
    [clearHoldTimer, minHoldMs, runTransition, transitionsEnabled]
  );

  useEffect(() => () => clearHoldTimer(), [clearHoldTimer]);

  return {
    baseUrl: base,
    overlayUrl: overlay,
    overlayOpacity,
    onOverlayTransitionEnd,
  };
}
