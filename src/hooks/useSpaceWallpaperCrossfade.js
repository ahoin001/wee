import { useCallback, useLayoutEffect, useEffect, useRef, useState } from 'react';
import { SPACE_SHELL_TRANSITION_MS_DEFAULT } from '../design/spaceShellMotion';
import { CHANNEL_PAGE_FLIP_MS } from '../utils/channelLayoutSystem';
import { preloadImageUrl } from '../utils/mediaWarmCache';

/** Subtle X parallax nudge (percent of viewport) opposite page-flip direction. */
const PAGE_PARALLAX_NUDGE_PERCENT = 1.6;

/**
 * Cross-fades wallpaper URL for space switches, page flips, and same-space URL changes
 * (preset apply, settings pick). Same pattern as useHeroMediaCrossfade:
 * base + overlay opacity, then promote on transitionend.
 *
 * When transitions are off (reduced motion) or cycling owns the transition, snaps.
 * Space changes use `spaceTransitionMs` (shell); page / same-space URL changes use
 * `pageTransitionMs` (CHANNEL_PAGE_FLIP_MS) — one wallpaper layer, two duration sources.
 *
 * `committedUrl` updates only after the visual settles — consumers (ambient) should
 * key off that instead of the store display URL mid-fade.
 */
export function useSpaceWallpaperCrossfade({
  displayUrl,
  activeSpaceId,
  pageIndex = 0,
  pageDirection = 0,
  cyclingTransitioning,
  transitionsEnabled,
  spaceTransitionMs = SPACE_SHELL_TRANSITION_MS_DEFAULT,
  pageTransitionMs = CHANNEL_PAGE_FLIP_MS,
  pageParallaxEnabled = false,
}) {
  const [base, setBase] = useState(displayUrl ?? null);
  const [overlay, setOverlay] = useState(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [committedUrl, setCommittedUrl] = useState(displayUrl ?? null);
  const [activeTransitionMs, setActiveTransitionMs] = useState(spaceTransitionMs);
  const [parallaxXPercent, setParallaxXPercent] = useState(0);
  const baseRef = useRef(displayUrl ?? null);
  const overlayRef = useRef(null);
  const prevCommittedUrlRef = useRef(displayUrl ?? null);
  const lastSpaceRef = useRef(activeSpaceId);
  const lastPageRef = useRef(pageIndex);
  const prevCyclingRef = useRef(Boolean(cyclingTransitioning));
  const rafRef = useRef(null);
  const stallTimerRef = useRef(null);
  const preloadGenRef = useRef(0);
  const pendingTargetRef = useRef(null);
  const transitionMsRef = useRef(spaceTransitionMs);
  const parallaxEnabledRef = useRef(pageParallaxEnabled);
  const pageDirectionRef = useRef(pageDirection);

  overlayRef.current = overlay;
  transitionMsRef.current = activeTransitionMs;
  parallaxEnabledRef.current = pageParallaxEnabled;
  pageDirectionRef.current = pageDirection;

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
      setParallaxXPercent(0);
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
    setParallaxXPercent(0);

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
    (fromUrl, toUrl, { usePageParallax = false } = {}) => {
      setBase(fromUrl);
      baseRef.current = fromUrl;
      setOverlay(toUrl);
      setOverlayOpacity(0);
      if (usePageParallax && parallaxEnabledRef.current) {
        const dir = pageDirectionRef.current || 0;
        // Nudge opposite strip travel so wallpaper feels tied to the page flip.
        const nudge = dir < 0 ? PAGE_PARALLAX_NUDGE_PERCENT : dir > 0 ? -PAGE_PARALLAX_NUDGE_PERCENT : 0;
        setParallaxXPercent(nudge);
      } else {
        setParallaxXPercent(0);
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => {
          setOverlayOpacity(1);
          setParallaxXPercent(0);
          armStallRecovery(transitionMsRef.current + 320);
        });
      });
    },
    [armStallRecovery]
  );

  const startCrossfade = useCallback(
    (fromUrl, toUrl, opts = {}) => {
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
        beginOverlayFade(stillFrom, latest, opts);
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
      lastPageRef.current = pageIndex;
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
      lastPageRef.current = pageIndex;
      return;
    }
    if (nowCycling) {
      lastSpaceRef.current = activeSpaceId;
      lastPageRef.current = pageIndex;
      return;
    }

    const spaceChanged = lastSpaceRef.current !== activeSpaceId;
    const pageChanged = lastPageRef.current !== pageIndex;
    if (spaceChanged) {
      lastSpaceRef.current = activeSpaceId;
    }
    if (pageChanged) {
      lastPageRef.current = pageIndex;
    }

    const nextMs = spaceChanged ? spaceTransitionMs : pageTransitionMs;
    setActiveTransitionMs(nextMs);
    transitionMsRef.current = nextMs;

    const fromUrl = prevCommittedUrlRef.current;

    if (toUrl === fromUrl && !overlayRef.current) {
      return;
    }
    if (toUrl === overlayRef.current) {
      return;
    }

    const usePageParallax = !spaceChanged && pageChanged;

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
        beginOverlayFade(prevCommittedUrlRef.current, latest, { usePageParallax });
      });
      return;
    }

    if (!fromUrl || !toUrl) {
      snapTo(toUrl);
      return;
    }

    startCrossfade(fromUrl, toUrl, { usePageParallax });
  }, [
    displayUrl,
    activeSpaceId,
    pageIndex,
    transitionsEnabled,
    cyclingTransitioning,
    spaceTransitionMs,
    pageTransitionMs,
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
    spaceCrossfadeMs: activeTransitionMs,
    /** Settled wallpaper URL after snap/crossfade/cycle — for ambient + scene waiters. */
    committedUrl,
    /** Subtle page-flip X nudge (percent); 0 when idle / reduced motion. */
    parallaxXPercent,
  };
}
