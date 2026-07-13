import { useCallback, useLayoutEffect, useEffect, useRef, useState } from 'react';
import { SPACE_SHELL_TRANSITION_MS_DEFAULT } from '../design/spaceShellMotion';
import { preloadImageUrl } from '../utils/mediaWarmCache';

/**
 * Cross-fades wallpaper URL for space switches and same-space URL changes
 * (preset apply, settings pick). Same pattern as useHeroMediaCrossfade:
 * base + overlay opacity, then promote on transitionend.
 *
 * When transitions are off (reduced motion) or cycling owns the transition, snaps.
 * `transitionMs` should match App’s space-world / dock duration for a unified feel.
 *
 * `committedUrl` updates only after the visual settles — consumers (ambient) should
 * key off that instead of the store display URL mid-fade.
 */
export function useSpaceWallpaperCrossfade({
  displayUrl,
  activeSpaceId,
  cyclingTransitioning,
  transitionsEnabled,
  transitionMs = SPACE_SHELL_TRANSITION_MS_DEFAULT,
}) {
  const [base, setBase] = useState(displayUrl ?? null);
  const [overlay, setOverlay] = useState(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [committedUrl, setCommittedUrl] = useState(displayUrl ?? null);
  const baseRef = useRef(displayUrl ?? null);
  const overlayRef = useRef(null);
  const prevCommittedUrlRef = useRef(displayUrl ?? null);
  const lastSpaceRef = useRef(activeSpaceId);
  const prevCyclingRef = useRef(Boolean(cyclingTransitioning));
  const rafRef = useRef(null);
  const stallTimerRef = useRef(null);
  const preloadGenRef = useRef(0);
  const pendingTargetRef = useRef(null);

  overlayRef.current = overlay;

  const clearStallTimer = useCallback(() => {
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  }, []);

  const snapTo = useCallback(
    (url) => {
      clearStallTimer();
      preloadGenRef.current += 1;
      pendingTargetRef.current = null;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setBase(url);
      setOverlay(null);
      setOverlayOpacity(0);
      baseRef.current = url;
      prevCommittedUrlRef.current = url;
      setCommittedUrl(url);
    },
    [clearStallTimer]
  );

  const commitOverlayToBase = useCallback(() => {
    const ov = overlayRef.current;
    if (!ov) return;
    clearStallTimer();
    baseRef.current = ov;
    prevCommittedUrlRef.current = ov;
    setBase(ov);
    setCommittedUrl(ov);
    setOverlay(null);
    setOverlayOpacity(0);

    const pending = pendingTargetRef.current;
    if (pending && pending !== ov) {
      pendingTargetRef.current = null;
      // Drain coalesced target after commit (rapid preset/settings churn).
      startCrossfadeRef.current?.(ov, pending);
    }
  }, [clearStallTimer]);

  const armStallRecovery = useCallback(
    (ms) => {
      clearStallTimer();
      stallTimerRef.current = setTimeout(() => {
        stallTimerRef.current = null;
        if (overlayRef.current) commitOverlayToBase();
      }, Math.max(200, ms));
    },
    [clearStallTimer, commitOverlayToBase]
  );

  const beginOverlayFade = useCallback(
    (fromUrl, toUrl) => {
      setBase(fromUrl);
      baseRef.current = fromUrl;
      setOverlay(toUrl);
      setOverlayOpacity(0);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          setOverlayOpacity(1);
          armStallRecovery(transitionMs + 320);
        });
      });
    },
    [armStallRecovery, transitionMs]
  );

  const startCrossfade = useCallback(
    (fromUrl, toUrl) => {
      if (!fromUrl || !toUrl || fromUrl === toUrl) {
        snapTo(toUrl ?? fromUrl ?? null);
        return;
      }

      const gen = ++preloadGenRef.current;
      pendingTargetRef.current = null;

      preloadImageUrl(toUrl).then(() => {
        if (gen !== preloadGenRef.current) return;
        // Latest target may have changed while decoding.
        const latest = pendingTargetRef.current || toUrl;
        pendingTargetRef.current = null;
        const stillFrom = prevCommittedUrlRef.current;
        if (!stillFrom || stillFrom === latest) {
          snapTo(latest);
          return;
        }
        beginOverlayFade(stillFrom, latest);
      });
    },
    [beginOverlayFade, snapTo]
  );

  const startCrossfadeRef = useRef(startCrossfade);
  startCrossfadeRef.current = startCrossfade;

  useLayoutEffect(() => {
    if (!transitionsEnabled) {
      snapTo(displayUrl ?? null);
      lastSpaceRef.current = activeSpaceId;
      prevCyclingRef.current = Boolean(cyclingTransitioning);
      return;
    }

    const toUrl = displayUrl ?? null;
    const wasCycling = prevCyclingRef.current;
    const nowCycling = Boolean(cyclingTransitioning);
    prevCyclingRef.current = nowCycling;

    // Cycling owns the visual transition — sync without a second crossfade when it ends.
    if (wasCycling && !nowCycling) {
      snapTo(toUrl);
      lastSpaceRef.current = activeSpaceId;
      return;
    }
    if (nowCycling) {
      lastSpaceRef.current = activeSpaceId;
      return;
    }

    const spaceChanged = lastSpaceRef.current !== activeSpaceId;
    if (spaceChanged) {
      lastSpaceRef.current = activeSpaceId;
    }

    const fromUrl = prevCommittedUrlRef.current;

    if (toUrl === fromUrl && !overlayRef.current) {
      return;
    }
    if (toUrl === overlayRef.current) {
      return;
    }

    // Mid-crossfade: coalesce to latest target (keep base, retarget overlay after preload).
    if (overlayRef.current != null) {
      pendingTargetRef.current = toUrl;
      const gen = ++preloadGenRef.current;
      preloadImageUrl(toUrl).then(() => {
        if (gen !== preloadGenRef.current) return;
        const latest = pendingTargetRef.current || toUrl;
        if (!latest || latest === prevCommittedUrlRef.current) {
          snapTo(latest);
          return;
        }
        if (latest === overlayRef.current) return;
        beginOverlayFade(prevCommittedUrlRef.current, latest);
      });
      return;
    }

    if (!fromUrl || !toUrl) {
      snapTo(toUrl);
      return;
    }

    startCrossfade(fromUrl, toUrl);
  }, [
    displayUrl,
    activeSpaceId,
    transitionsEnabled,
    cyclingTransitioning,
    snapTo,
    startCrossfade,
    beginOverlayFade,
  ]);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearStallTimer();
      preloadGenRef.current += 1;
    },
    [clearStallTimer]
  );

  const onOverlayTransitionEnd = useCallback(
    (event) => {
      if (!transitionsEnabled) return;
      if (event.propertyName !== 'opacity') return;
      commitOverlayToBase();
    },
    [commitOverlayToBase, transitionsEnabled]
  );

  return {
    baseUrl: base,
    overlayUrl: overlay,
    overlayOpacity,
    onOverlayTransitionEnd,
    spaceCrossfadeActive: Boolean(overlay),
    spaceCrossfadeMs: transitionMs,
    /** Settled wallpaper URL after snap/crossfade/cycle — for ambient + scene waiters. */
    committedUrl,
  };
}
