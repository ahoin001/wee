import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Cross-fades between hero art URLs using stacked layers (opacity).
 * Includes optional min-hold + latest-target coalescing for rapid hover churn.
 * When transitions are disabled, snaps to the latest URL immediately.
 * If transitionend never fires (browser/tab quirks), optional stallRecoveryMs forces a commit.
 */
export function useHeroMediaCrossfade(artUrl, transitionsEnabled, options = {}) {
  const minHoldMs = Number.isFinite(options.minHoldMs) ? Math.max(0, options.minHoldMs) : 260;
  const stallRecoveryMs = Number.isFinite(options.stallRecoveryMs) ? Math.max(200, options.stallRecoveryMs) : 1000;
  const baseRef = useRef(artUrl ?? null);
  const overlayRef = useRef(null);
  const pendingRef = useRef(null);
  const holdTimerRef = useRef(null);
  const stallTimerRef = useRef(null);
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

  const clearStallTimer = useCallback(() => {
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
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

  /** Promote overlay to base and drain pending queue (shared by transitionend + stall recovery). */
  const commitOverlayToBase = useCallback(() => {
    if (!transitionsEnabled) return;
    const ov = overlayRef.current;
    if (!ov) return;

    clearStallTimer();
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
  }, [clearHoldTimer, clearStallTimer, minHoldMs, runTransition, transitionsEnabled]);

  const onOverlayTransitionEnd = useCallback(
    (event) => {
      if (!transitionsEnabled) return;
      if (event.propertyName !== 'opacity') return;
      commitOverlayToBase();
    },
    [commitOverlayToBase, transitionsEnabled]
  );

  useEffect(() => {
    if (!transitionsEnabled) {
      clearHoldTimer();
      clearStallTimer();
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
      clearStallTimer();
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
  }, [artUrl, clearHoldTimer, clearStallTimer, minHoldMs, runTransition, transitionsEnabled]);

  useEffect(() => {
    if (!transitionsEnabled || !overlay) {
      clearStallTimer();
      return undefined;
    }
    clearStallTimer();
    stallTimerRef.current = window.setTimeout(() => {
      stallTimerRef.current = null;
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[useHeroMediaCrossfade] Stall recovery: opacity transition did not complete in time');
      }
      commitOverlayToBase();
    }, stallRecoveryMs);
    return () => {
      clearStallTimer();
    };
  }, [overlay, transitionsEnabled, stallRecoveryMs, commitOverlayToBase, clearStallTimer]);

  useEffect(
    () => () => {
      clearHoldTimer();
      clearStallTimer();
    },
    [clearHoldTimer, clearStallTimer]
  );

  return {
    baseUrl: base,
    overlayUrl: overlay,
    overlayOpacity,
    onOverlayTransitionEnd,
  };
}
