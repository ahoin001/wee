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
  const parallaxRafRef = useRef(null);
  const stallTimerRef = useRef(null);
  const preloadGenRef = useRef(0);
  const pendingTargetRef = useRef(null);
  const fadeInIntentRef = useRef(false);
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
      fadeInIntentRef.current = false;
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
    fadeInIntentRef.current = false;
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
      // Drain coalesced target after commit (rapid page flips / preset churn).
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

  /**
   * Offset the plaza opposite strip travel, then let it glide home on the flip clock.
   * Fires on every page flip, not only when the wallpaper itself changes — pages that
   * share a wallpaper still have to feel tied to the shelf.
   */
  const pulsePageParallax = useCallback(() => {
    if (!parallaxEnabledRef.current) return;
    const dir = pageDirectionRef.current || 0;
    if (!dir) return;
    setParallaxXPercent(dir < 0 ? PAGE_PARALLAX_NUDGE_PERCENT : -PAGE_PARALLAX_NUDGE_PERCENT);
    if (parallaxRafRef.current) cancelAnimationFrame(parallaxRafRef.current);
    // Offset snaps, settle eases — consumers drop the transition while the value is non-zero.
    parallaxRafRef.current = requestAnimationFrame(() => {
      parallaxRafRef.current = null;
      setParallaxXPercent(0);
    });
  }, []);

  const beginOverlayFade = useCallback(
    (fromUrl, toUrl) => {
      setBase(fromUrl);
      baseRef.current = fromUrl;
      setOverlay(toUrl);
      setOverlayOpacity(0);
      fadeInIntentRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // Single rAF is enough for CSS to register opacity:0 before fading in.
      // Double-rAF added a visible stall vs the channel page strip.
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        fadeInIntentRef.current = true;
        setOverlayOpacity(1);
        armStallRecovery(transitionMsRef.current + 320);
      });
    },
    [armStallRecovery]
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
      // Before any crossfade early-return: the shelf moved, so the plaza reacts either way.
      if (!spaceChanged) pulsePageParallax();
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

    // Mid-crossfade: coalesce to latest target only — do not reset opacity mid-fade
    // (that fires a spurious transitionend and commits early). Drain after commit.
    if (overlayRef.current != null) {
      pendingTargetRef.current = toUrl;
      const gen = ++preloadGenRef.current;
      preloadImageUrl(toUrl).then(() => {
        if (gen !== preloadGenRef.current) return;
        // Keep pending as the latest request; commitOverlayToBase drains it.
        if (pendingTargetRef.current == null) {
          pendingTargetRef.current = toUrl;
        }
      });
      return;
    }

    if (!fromUrl || !toUrl) {
      snapTo(toUrl);
      return;
    }

    // Opacity-only fade (no page parallax) — keeps flips compositor-cheap with blur.
    startCrossfade(fromUrl, toUrl);
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
    pulsePageParallax,
  ]);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (parallaxRafRef.current) cancelAnimationFrame(parallaxRafRef.current);
      clearStallTimer();
      preloadGenRef.current += 1;
    },
    [clearStallTimer]
  );

  const onOverlayTransitionEnd = useCallback(
    (event) => {
      if (!transitionsEnabled) return;
      if (event.propertyName !== 'opacity') return;
      // Only commit fade-in completion — ignore opacity resets to 0 mid-retarget.
      if (!fadeInIntentRef.current) return;
      fadeInIntentRef.current = false;
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
    /**
     * Subtle page-flip X nudge (percent); 0 when idle / reduced motion.
     * Non-zero means "just offset" — render it without a transition, and let the
     * return to 0 ease on the flip clock.
     */
    parallaxXPercent,
  };
}
