import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import useWallpaperCycling from '../../utils/useWallpaperCycling';
import { useSpaceWallpaperCrossfade } from '../../hooks/useSpaceWallpaperCrossfade';
import {
  DEFAULT_SHELL_SPACE_ORDER,
  normalizeShellSpaceOrder,
  resolveActiveBoardCurrentPage,
  resolveActiveChannelSpaceKey,
} from '../../utils/channelSpaces';
import {
  SPACE_SHELL_EASE_CSS,
  SPACE_SHELL_TRANSITION_MS_DEFAULT,
} from '../../design/spaceShellMotion';
import { CHANNEL_PAGE_FLIP_MS, resolveLayout } from '../../utils/channelLayoutSystem';
import { wallpaperEntryUrlKey } from '../../utils/wallpaperShape';
import {
  isWallpaperCyclingEligible,
  resolveDisplayWallpaperUrl,
} from '../../utils/theme/resolveEffectiveAccent';
import { preloadImageUrl } from '../../utils/mediaWarmCache';

/**
 * Space-switch depth cue via background-position (cover stays full viewport).
 * translateY() on the layer shifted the painted image down and uncovered a strip at the top (worst on Game Hub = highest index).
 */
function spaceParallaxBackgroundYPercent(spaceIndex) {
  const i = Math.min(Math.max(spaceIndex, 0), 8);
  return 50 + i * 4;
}

function IsolatedWallpaperBackgroundInner({
  shellTransitionMs = SPACE_SHELL_TRANSITION_MS_DEFAULT,
}) {
  const {
    wallpaperCurrent,
    opacity,
    blur,
    cycleAnimation,
    workspaceBrightness,
    workspaceSaturate,
    gameHubBrightness,
    gameHubSaturate,
    activeSpaceId,
    spaceOrder,
    mediaHubEnabled,
    activeSpaceAppearance,
    currentPage,
    boardAnimationDirection,
    boardTotalPages,
    wallpaperPeekUrl,
  } = useConsolidatedAppStore(
    useShallow((state) => {
      const spaceId = state.spaces.activeSpaceId;
      const boardKey = resolveActiveChannelSpaceKey(spaceId);
      const boardRaw = state.channels?.dataBySpace?.[boardKey];
      const wp = state.wallpaper || {};
      return {
        wallpaperCurrent: wp.current,
        opacity: wp.opacity,
        blur: wp.blur,
        cycleAnimation: wp.cycleAnimation,
        workspaceBrightness: wp.workspaceBrightness,
        workspaceSaturate: wp.workspaceSaturate,
        gameHubBrightness: wp.gameHubBrightness,
        gameHubSaturate: wp.gameHubSaturate,
        activeSpaceId: spaceId,
        spaceOrder: state.spaces.order,
        mediaHubEnabled: state.spaces.mediaHubEnabled === true,
        activeSpaceAppearance: state.appearanceBySpace?.[spaceId]?.wallpaper || null,
        currentPage: resolveActiveBoardCurrentPage({ activeSpaceId: spaceId, channels: state.channels }),
        boardAnimationDirection: boardRaw?.navigation?.animationDirection ?? 'none',
        boardTotalPages: Math.max(1, Number(resolveLayout(boardRaw || {})?.totalPages) || 1),
        wallpaperPeekUrl: state.ui?.homeBoardWallpaperPeek?.url || null,
      };
    })
  );
  // Resolvers only read the active space's wallpaper appearance.
  const appearanceBySpace = useMemo(
    () => ({ [activeSpaceId]: { wallpaper: activeSpaceAppearance } }),
    [activeSpaceId, activeSpaceAppearance]
  );
  const pageDirection =
    boardAnimationDirection === 'left'
      ? -1
      : boardAnimationDirection === 'right'
        ? 1
        : 0;
  const settledWallpaperUrl = resolveDisplayWallpaperUrl({
    activeSpaceId,
    wallpaperCurrent,
    appearanceBySpace,
    wallpaperEntryUrlKey,
    currentPage,
  });
  const displayWallpaperUrl =
    typeof wallpaperPeekUrl === 'string' && wallpaperPeekUrl.length > 0
      ? wallpaperPeekUrl
      : settledWallpaperUrl;
  // Cycle only when this page/space falls through to global wallpaper.current.
  const canCycleCurrentSpace = isWallpaperCyclingEligible({
    activeSpaceId,
    appearanceBySpace,
    currentPage,
  });

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const fn = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  /**
   * Dimming (brightness < 1) is painted by a black overlay so the full-viewport
   * plate carries no filter at all in the common case. Only blur, brightening,
   * or saturation keep a filter.
   */
  const { toneFilter, toneDarken } = useMemo(() => {
    const isHubSpace = activeSpaceId === 'gamehub' || activeSpaceId === 'mediahub';
    const legacyB = isHubSpace ? gameHubBrightness : workspaceBrightness;
    const legacyS = isHubSpace ? gameHubSaturate : workspaceSaturate;
    const spaceB = activeSpaceAppearance?.spaceBrightness;
    const spaceS = activeSpaceAppearance?.spaceSaturate;
    const b = typeof spaceB === 'number' && Number.isFinite(spaceB) ? spaceB : legacyB;
    const s = typeof spaceS === 'number' && Number.isFinite(spaceS) ? spaceS : legacyS;
    const bb = typeof b === 'number' && !Number.isNaN(b) ? b : isHubSpace ? 0.78 : 1;
    const ss = typeof s === 'number' && !Number.isNaN(s) ? s : 1;
    const parts = [];
    if (bb > 1) parts.push(`brightness(${bb})`);
    if (ss !== 1) parts.push(`saturate(${ss})`);
    return {
      toneFilter: parts.join(' '),
      toneDarken: bb < 1 ? Math.min(1, Math.max(0, 1 - bb)) : 0,
    };
  }, [
    activeSpaceId,
    activeSpaceAppearance,
    workspaceBrightness,
    workspaceSaturate,
    gameHubBrightness,
    gameHubSaturate,
  ]);

  /** Skip `blur(0px)` and neutral tone so the plate composites without a filter pass. */
  const toneBlurPx = useCallback(
    (px) => {
      const n = typeof px === 'number' && Number.isFinite(px) ? px : 0;
      const filter = [n > 0 ? `blur(${n}px)` : '', toneFilter].filter(Boolean).join(' ');
      return filter || 'none';
    },
    [toneFilter]
  );
  const {
    isTransitioning: cyclingTransitioning,
    currentWallpaper,
    nextWallpaper,
    crossfadeProgress: cyclingProgress,
    slideDirection: cyclingSlideDirection,
    cycleLayerTransition,
    isCycleSettling,
  } = useWallpaperCycling();
  const setWallpaperState = useConsolidatedAppStore((state) => state.actions.setWallpaperState);
  const effectiveSpaceBlur =
    typeof activeSpaceAppearance?.spaceBlur === 'number'
      ? activeSpaceAppearance.spaceBlur
      : blur;
  const effectiveCyclingTransitioning = canCycleCurrentSpace && cyclingTransitioning;
  const transitionCurrentWallpaperUrl = canCycleCurrentSpace
    ? wallpaperEntryUrlKey(currentWallpaper) || null
    : null;
  const effectiveCurrentWallpaperUrl = effectiveCyclingTransitioning
    ? transitionCurrentWallpaperUrl || displayWallpaperUrl
    : displayWallpaperUrl;
  const effectiveNextWallpaperUrl = canCycleCurrentSpace
    ? wallpaperEntryUrlKey(nextWallpaper) || null
    : null;
  const effectiveCyclingProgress = canCycleCurrentSpace ? cyclingProgress : 0;
  const effectiveCyclingSlideDirection = canCycleCurrentSpace ? cyclingSlideDirection : 'right';
  const effectiveCycleAnimation = canCycleCurrentSpace ? cycleAnimation : 'fade';

  const pageParallaxEnabled = false;

  const spaceFade = useSpaceWallpaperCrossfade({
    displayUrl: displayWallpaperUrl,
    activeSpaceId,
    pageIndex: currentPage,
    pageDirection,
    cyclingTransitioning: effectiveCyclingTransitioning,
    transitionsEnabled: !reducedMotion,
    spaceTransitionMs: shellTransitionMs,
    pageTransitionMs: CHANNEL_PAGE_FLIP_MS,
    pageParallaxEnabled,
  });

  // Publish settled URL for ambient + scene transition waiters (not the mid-fade store URL).
  useEffect(() => {
    if (wallpaperPeekUrl) return undefined;
    setWallpaperState({ visualCommittedUrl: spaceFade.committedUrl ?? null });
    return undefined;
  }, [wallpaperPeekUrl, spaceFade.committedUrl, setWallpaperState]);

  // Warm neighbor page wallpapers so the next flip can fade without a decode stall.
  useEffect(() => {
    if (!(activeSpaceId === 'home' || activeSpaceId === 'workspaces')) return undefined;
    if (activeSpaceAppearance?.wallpaperScope !== 'perPage') return undefined;

    const neighbors = [currentPage - 1, currentPage + 1].filter(
      (p) => p >= 0 && p < boardTotalPages && p !== currentPage
    );

    const timer = window.setTimeout(() => {
      for (const pageIndex of neighbors) {
        const url = resolveDisplayWallpaperUrl({
          activeSpaceId,
          wallpaperCurrent,
          appearanceBySpace,
          wallpaperEntryUrlKey,
          currentPage: pageIndex,
        });
        if (url && url !== displayWallpaperUrl) preloadImageUrl(url);
      }
    }, 120);

    return () => window.clearTimeout(timer);
  }, [
    activeSpaceId,
    activeSpaceAppearance?.wallpaperScope,
    boardTotalPages,
    currentPage,
    wallpaperCurrent,
    appearanceBySpace,
    displayWallpaperUrl,
  ]);

  const getCurrentWallpaperStyle = useCallback(() => {
    if (!effectiveCyclingTransitioning || !transitionCurrentWallpaperUrl) {
      return {
        opacity,
        transform: 'none',
        filter: toneBlurPx(effectiveSpaceBlur),
      };
    }

    const progress = effectiveCyclingProgress;

    switch (effectiveCycleAnimation) {
      case 'fade':
        return {
          opacity: opacity * (1 - progress),
          transform: 'none',
          filter: toneBlurPx(effectiveSpaceBlur),
        };
      case 'slide': {
        const slideOffset = progress * 100;
        let slideTransform = 'none';

        switch (effectiveCyclingSlideDirection) {
          case 'left':
            slideTransform = `translateX(-${slideOffset}%)`;
            break;
          case 'right':
            slideTransform = `translateX(${slideOffset}%)`;
            break;
          case 'up':
            slideTransform = `translateY(-${slideOffset}%)`;
            break;
          case 'down':
            slideTransform = `translateY(${slideOffset}%)`;
            break;
          default:
            break;
        }

        return {
          opacity,
          transform: slideTransform,
          filter: toneBlurPx(effectiveSpaceBlur),
        };
      }
      case 'zoom': {
        const zoomScale = 1 + (progress * 0.1);
        return {
          opacity: opacity * (1 - progress * 0.5),
          transform: `scale(${zoomScale})`,
          filter: toneBlurPx(effectiveSpaceBlur),
        };
      }
      case 'ken-burns': {
        const kenBurnsScale = 1 + (progress * 0.15);
        const kenBurnsX = progress * 3;
        const kenBurnsY = progress * 1.5;
        return {
          opacity: opacity * (1 - progress * 0.3),
          transform: `scale(${kenBurnsScale}) translateX(${kenBurnsX}%) translateY(${kenBurnsY}%)`,
          filter: toneBlurPx(effectiveSpaceBlur),
        };
      }
      case 'morph': {
        const morphScale = 1 + (progress * 0.05);
        const morphRotate = progress * 2;
        const morphSkew = progress * 1;
        return {
          opacity: opacity * (1 - progress * 0.7),
          transform: `scale(${morphScale}) rotate(${morphRotate}deg) skew(${morphSkew}deg)`,
          filter: toneBlurPx(effectiveSpaceBlur),
        };
      }
      case 'blur': {
        return {
          opacity: opacity * (1 - progress * 0.8),
          transform: 'none',
          filter: toneBlurPx(effectiveSpaceBlur),
        };
      }
      default:
        return {
          opacity,
          transform: 'none',
          filter: toneBlurPx(effectiveSpaceBlur),
        };
    }
  }, [
    toneBlurPx,
    effectiveCyclingTransitioning,
    transitionCurrentWallpaperUrl,
    opacity,
    effectiveSpaceBlur,
    effectiveCycleAnimation,
    effectiveCyclingProgress,
    effectiveCyclingSlideDirection,
  ]);

  const getNextWallpaperStyle = useCallback(() => {
    if (!effectiveCyclingTransitioning || !effectiveNextWallpaperUrl) {
      return {
        opacity: 0,
        transform: 'none',
        filter: toneBlurPx(effectiveSpaceBlur),
      };
    }

    const progress = effectiveCyclingProgress;

    switch (effectiveCycleAnimation) {
      case 'fade':
        return {
          opacity: opacity * progress,
          transform: 'none',
          filter: toneBlurPx(effectiveSpaceBlur),
        };
      case 'slide': {
        const slideOffset = (1 - progress) * 100;
        let slideTransform = 'none';

        switch (effectiveCyclingSlideDirection) {
          case 'left':
            slideTransform = `translateX(${slideOffset}%)`;
            break;
          case 'right':
            slideTransform = `translateX(-${slideOffset}%)`;
            break;
          case 'up':
            slideTransform = `translateY(${slideOffset}%)`;
            break;
          case 'down':
            slideTransform = `translateY(-${slideOffset}%)`;
            break;
          default:
            break;
        }

        return {
          opacity,
          transform: slideTransform,
          filter: toneBlurPx(effectiveSpaceBlur),
        };
      }
      case 'zoom': {
        const zoomScale = 1.1 - (progress * 0.1);
        return {
          opacity: opacity * progress,
          transform: `scale(${zoomScale})`,
          filter: toneBlurPx(effectiveSpaceBlur),
        };
      }
      case 'ken-burns': {
        const kenBurnsScale = 1.15 - (progress * 0.15);
        const kenBurnsX = (1 - progress) * 3;
        const kenBurnsY = (1 - progress) * 1.5;
        return {
          opacity: opacity * progress,
          transform: `scale(${kenBurnsScale}) translateX(-${kenBurnsX}%) translateY(-${kenBurnsY}%)`,
          filter: toneBlurPx(effectiveSpaceBlur),
        };
      }
      case 'morph': {
        const morphScale = 1.05 - (progress * 0.05);
        const morphRotate = (1 - progress) * 2;
        const morphSkew = (1 - progress) * 1;
        return {
          opacity: opacity * progress,
          transform: `scale(${morphScale}) rotate(-${morphRotate}deg) skew(-${morphSkew}deg)`,
          filter: toneBlurPx(effectiveSpaceBlur),
        };
      }
      case 'blur': {
        return {
          opacity: opacity * progress,
          transform: 'none',
          filter: toneBlurPx(effectiveSpaceBlur),
        };
      }
      default:
        return {
          opacity: opacity * progress,
          transform: 'none',
          filter: toneBlurPx(effectiveSpaceBlur),
        };
    }
  }, [
    toneBlurPx,
    effectiveCyclingTransitioning,
    effectiveNextWallpaperUrl,
    opacity,
    effectiveSpaceBlur,
    effectiveCycleAnimation,
    effectiveCyclingProgress,
    effectiveCyclingSlideDirection,
  ]);

  const resolvedSpaceOrder = useMemo(
    () =>
      normalizeShellSpaceOrder(
        Array.isArray(spaceOrder) && spaceOrder.length > 0 ? spaceOrder : DEFAULT_SHELL_SPACE_ORDER,
        { mediaHubEnabled }
      ),
    [spaceOrder, mediaHubEnabled]
  );
  const rawIndex = resolvedSpaceOrder.indexOf(activeSpaceId);
  const spaceIndex = rawIndex >= 0 ? rawIndex : 0;
  const parallaxBgY = spaceParallaxBackgroundYPercent(spaceIndex);

  const crossfadeActive = Boolean(spaceFade.spaceCrossfadeActive && spaceFade.overlayUrl);
  const currentLayerStyle = getCurrentWallpaperStyle();
  const nextLayerStyle = getNextWallpaperStyle();

  // Stable base layer URL — never remount when entering/leaving crossfade.
  const baseWallpaperUrl = crossfadeActive
    ? spaceFade.baseUrl
    : effectiveCyclingTransitioning
      ? effectiveCurrentWallpaperUrl
      : spaceFade.baseUrl || effectiveCurrentWallpaperUrl;

  const baseLayerStyle = crossfadeActive
    ? {
        // Freeze paint cost mid-fade: opacity + static filter only (no transform/filter tween).
        opacity,
        transform: 'none',
        filter: toneBlurPx(effectiveSpaceBlur),
      }
    : currentLayerStyle;

  const baseLayerTransition = useMemo(() => {
    if (crossfadeActive) return 'none';
    if (effectiveCyclingTransitioning) return cycleLayerTransition;
    if (isCycleSettling) return 'none';
    return `opacity 0.35s ease-out, filter 0.45s ease-out, background-position ${shellTransitionMs}ms ${SPACE_SHELL_EASE_CSS}`;
  }, [
    effectiveCyclingTransitioning,
    crossfadeActive,
    cycleLayerTransition,
    isCycleSettling,
    shellTransitionMs,
  ]);

  // Opacity-only overlay — keeps page flips on the compositor without blur thrashing.
  const spaceOverlayTransition = `opacity ${spaceFade.spaceCrossfadeMs}ms ${SPACE_SHELL_EASE_CSS}`;

  return (
    <div
      className="wallpaper-space-parallax"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        /* Optional Scene FX Beta parallax — identity defaults when unset / feature removed */
        transform:
          'translate3d(var(--wee-scene-fx-px, 0px), var(--wee-scene-fx-py, 0px), 0) scale(var(--wee-scene-fx-ps, 1))',
      }}
    >
      {baseWallpaperUrl ? (
        <div
          className={`wallpaper-bg${crossfadeActive ? ' wallpaper-bg--crossfading' : ''}`}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 0,
            pointerEvents: 'none',
            backgroundImage: `url('${baseWallpaperUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: `center ${parallaxBgY}%`,
            backgroundRepeat: 'no-repeat',
            ...baseLayerStyle,
            transition: baseLayerTransition,
          }}
        />
      ) : null}

      {crossfadeActive ? (
        <div
          className="wallpaper-bg wallpaper-bg--space-overlay wallpaper-bg--crossfading"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 2,
            pointerEvents: 'none',
            backgroundImage: `url('${spaceFade.overlayUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: `center ${parallaxBgY}%`,
            backgroundRepeat: 'no-repeat',
            opacity: opacity * spaceFade.overlayOpacity,
            transform: 'none',
            filter: toneBlurPx(effectiveSpaceBlur),
            transition: spaceOverlayTransition,
          }}
          onTransitionEnd={spaceFade.onOverlayTransitionEnd}
        />
      ) : null}

      {effectiveCyclingTransitioning && effectiveNextWallpaperUrl ? (
        <div
          className="wallpaper-bg-next"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 1,
            pointerEvents: 'none',
            backgroundImage: `url('${effectiveNextWallpaperUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: `center ${parallaxBgY}%`,
            backgroundRepeat: 'no-repeat',
            ...nextLayerStyle,
            transition: cycleLayerTransition,
          }}
        />
      ) : null}

      {toneDarken > 0 && baseWallpaperUrl ? (
        <div
          className="pointer-events-none fixed inset-0 z-[3] bg-[hsl(var(--color-pure-black))] transition-opacity duration-[450ms] ease-out"
          style={{ opacity: toneDarken }}
          aria-hidden
        />
      ) : null}
    </div>
  );
}

const IsolatedWallpaperBackground = React.memo(IsolatedWallpaperBackgroundInner);

export default IsolatedWallpaperBackground;
