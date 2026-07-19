import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import useWallpaperCycling from '../../utils/useWallpaperCycling';
import { useSpaceWallpaperCrossfade } from '../../hooks/useSpaceWallpaperCrossfade';
import {
  DEFAULT_SHELL_SPACE_ORDER,
  getSecondaryChannelSpaceData,
  normalizeShellSpaceOrder,
  resolveActiveBoardCurrentPage,
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
  const { wallpaper, activeSpaceId, spaceOrder, mediaHubEnabled, appearanceBySpace, channels } =
    useConsolidatedAppStore(
      useShallow((state) => ({
        wallpaper: state.wallpaper,
        activeSpaceId: state.spaces.activeSpaceId,
        spaceOrder: state.spaces.order,
        mediaHubEnabled: state.spaces.mediaHubEnabled === true,
        appearanceBySpace: state.appearanceBySpace,
        channels: state.channels,
      }))
    );
  const currentPage = resolveActiveBoardCurrentPage({ activeSpaceId, channels });
  const boardNav =
    activeSpaceId === 'workspaces'
      ? getSecondaryChannelSpaceData(channels)?.navigation
      : channels?.dataBySpace?.home?.navigation;
  const pageDirection =
    boardNav?.animationDirection === 'left'
      ? -1
      : boardNav?.animationDirection === 'right'
        ? 1
        : 0;

  const activeSpaceAppearance = appearanceBySpace?.[activeSpaceId]?.wallpaper || null;
  const displayWallpaperUrl = resolveDisplayWallpaperUrl({
    activeSpaceId,
    wallpaperCurrent: wallpaper.current,
    appearanceBySpace,
    wallpaperEntryUrlKey,
    currentPage,
  });
  const wallpaperCurrent = wallpaper.current;
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

  const {
    workspaceBrightness,
    workspaceSaturate,
    gameHubBrightness,
    gameHubSaturate,
  } = wallpaper;

  const applySpaceWallpaperTone = useMemo(() => {
    const isHubSpace = activeSpaceId === 'gamehub' || activeSpaceId === 'mediahub';
    const legacyB = isHubSpace ? gameHubBrightness : workspaceBrightness;
    const legacyS = isHubSpace ? gameHubSaturate : workspaceSaturate;
    const spaceB = activeSpaceAppearance?.spaceBrightness;
    const spaceS = activeSpaceAppearance?.spaceSaturate;
    const b = typeof spaceB === 'number' && Number.isFinite(spaceB) ? spaceB : legacyB;
    const s = typeof spaceS === 'number' && Number.isFinite(spaceS) ? spaceS : legacyS;
    const bb = typeof b === 'number' && !Number.isNaN(b) ? b : isHubSpace ? 0.78 : 1;
    const ss = typeof s === 'number' && !Number.isNaN(s) ? s : 1;
    return (filterCss = '') => {
      const base = typeof filterCss === 'string' ? filterCss.trim() : '';
      const tone = `brightness(${bb}) saturate(${ss})`;
      return base ? `${base} ${tone}` : tone;
    };
  }, [
    activeSpaceId,
    activeSpaceAppearance,
    workspaceBrightness,
    workspaceSaturate,
    gameHubBrightness,
    gameHubSaturate,
  ]);

  /** Skip `blur(0px)` so the compositor can avoid unnecessary full-layer blur passes when blur is off. */
  const toneBlurPx = useCallback(
    (px) => {
      const n = typeof px === 'number' && Number.isFinite(px) ? px : 0;
      return applySpaceWallpaperTone(n > 0 ? `blur(${n}px)` : '');
    },
    [applySpaceWallpaperTone]
  );
  const {
    isTransitioning: cyclingTransitioning,
    currentWallpaper,
    nextWallpaper,
    crossfadeProgress: cyclingProgress,
    slideDirection: cyclingSlideDirection,
  } = useWallpaperCycling();
  const setWallpaperState = useConsolidatedAppStore((state) => state.actions.setWallpaperState);
  const { opacity, blur, cycleAnimation } = wallpaper;
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
    setWallpaperState({ visualCommittedUrl: spaceFade.committedUrl ?? null });
  }, [spaceFade.committedUrl, setWallpaperState]);

  // Warm neighbor page wallpapers so the next flip can fade without a decode stall.
  useEffect(() => {
    if (!(activeSpaceId === 'home' || activeSpaceId === 'workspaces')) return undefined;
    if (activeSpaceAppearance?.wallpaperScope !== 'perPage') return undefined;

    const boardSpaceData =
      activeSpaceId === 'workspaces'
        ? getSecondaryChannelSpaceData(channels)
        : channels?.dataBySpace?.home;
    const totalPages = Math.max(1, Number(resolveLayout(boardSpaceData || {})?.totalPages) || 1);
    const neighbors = [currentPage - 1, currentPage + 1].filter(
      (p) => p >= 0 && p < totalPages && p !== currentPage
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
    channels,
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
          filter: toneBlurPx(effectiveSpaceBlur + progress * 2),
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
          filter: toneBlurPx(effectiveSpaceBlur + progress),
        };
      }
      case 'blur': {
        const blurIntensity = effectiveSpaceBlur + (progress * 10);
        return {
          opacity: opacity * (1 - progress * 0.8),
          transform: 'none',
          filter: toneBlurPx(blurIntensity),
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
          filter: toneBlurPx(effectiveSpaceBlur + (1 - progress) * 2),
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
          filter: toneBlurPx(effectiveSpaceBlur + (1 - progress) * 1),
        };
      }
      case 'blur': {
        const blurIntensity = effectiveSpaceBlur + (1 - progress) * 10;
        return {
          opacity: opacity * progress,
          transform: 'none',
          filter: toneBlurPx(blurIntensity),
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
    if (effectiveCyclingTransitioning || crossfadeActive) return 'none';
    return `opacity 0.35s ease-out, filter 0.45s ease-out, background-position ${shellTransitionMs}ms ${SPACE_SHELL_EASE_CSS}`;
  }, [effectiveCyclingTransitioning, crossfadeActive, shellTransitionMs]);

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
            transition: 'none',
          }}
        />
      ) : null}
    </div>
  );
}

const IsolatedWallpaperBackground = React.memo(IsolatedWallpaperBackgroundInner);

export default IsolatedWallpaperBackground;
