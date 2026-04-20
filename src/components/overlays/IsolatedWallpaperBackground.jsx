import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import useWallpaperCycling from '../../utils/useWallpaperCycling';
import { useSpaceWallpaperCrossfade } from '../../hooks/useSpaceWallpaperCrossfade';
import { DEFAULT_SHELL_SPACE_ORDER, normalizeShellSpaceOrder } from '../../utils/channelSpaces';
import {
  SPACE_SHELL_EASE_CSS,
  SPACE_SHELL_TRANSITION_MS_DEFAULT,
} from '../../design/spaceShellMotion';
import { wallpaperEntryUrlKey } from '../../utils/wallpaperShape';

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
  const { wallpaper, activeSpaceId, spaceOrder, appearanceBySpace } = useConsolidatedAppStore(
    useShallow((state) => ({
      wallpaper: state.wallpaper,
      activeSpaceId: state.spaces.activeSpaceId,
      spaceOrder: state.spaces.order,
      appearanceBySpace: state.appearanceBySpace,
    }))
  );
  const activeSpaceAppearance = appearanceBySpace?.[activeSpaceId]?.wallpaper || null;
  const useGlobalWallpaper = activeSpaceAppearance?.useGlobalWallpaper !== false;
  /** Home always uses the global active wallpaper (`wallpaper.current`); ignore stale per-space override rows. */
  const isHomeShellSpace = activeSpaceId === 'home';
  const spaceWallpaperUrl =
    isHomeShellSpace
      ? null
      : !useGlobalWallpaper && typeof activeSpaceAppearance?.spaceWallpaperUrl === 'string'
        ? activeSpaceAppearance.spaceWallpaperUrl
        : null;
  const globalWallpaperUrl = wallpaper.current ? wallpaperEntryUrlKey(wallpaper.current) || null : null;
  const displayWallpaperUrl = spaceWallpaperUrl || globalWallpaperUrl;

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
    slideProgress: cyclingSlideProgress,
    slideDirection: cyclingSlideDirection,
    forceUpdate,
  } = useWallpaperCycling();
  const hasSpaceWallpaperOverride = Boolean(spaceWallpaperUrl);
  const { opacity, blur, cycleAnimation } = wallpaper;
  const effectiveSpaceBlur =
    typeof activeSpaceAppearance?.spaceBlur === 'number'
      ? activeSpaceAppearance.spaceBlur
      : blur;
  const canCycleCurrentSpace = !hasSpaceWallpaperOverride;
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

  const spaceFade = useSpaceWallpaperCrossfade({
    displayUrl: displayWallpaperUrl,
    activeSpaceId,
    cyclingTransitioning: effectiveCyclingTransitioning,
    transitionsEnabled: !reducedMotion,
    transitionMs: shellTransitionMs,
  });

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

  const transitionKey = `${effectiveCyclingTransitioning}-${effectiveCyclingProgress}-${cyclingSlideProgress}-${effectiveCyclingSlideDirection}-${forceUpdate}`;

  const resolvedSpaceOrder = useMemo(
    () =>
      normalizeShellSpaceOrder(
        Array.isArray(spaceOrder) && spaceOrder.length > 0 ? spaceOrder : DEFAULT_SHELL_SPACE_ORDER
      ),
    [spaceOrder]
  );
  const rawIndex = resolvedSpaceOrder.indexOf(activeSpaceId);
  const spaceIndex = rawIndex >= 0 ? rawIndex : 0;
  const parallaxBgY = spaceParallaxBackgroundYPercent(spaceIndex);

  const currentLayerStyle = getCurrentWallpaperStyle();
  const nextLayerStyle = getNextWallpaperStyle();

  const idleWallpaperTransition = useMemo(
    () =>
      effectiveCyclingTransitioning
        ? 'none'
        : `opacity 0.35s ease-out, transform 0.35s ease-out, filter 0.45s ease-out, background-position ${shellTransitionMs}ms ${SPACE_SHELL_EASE_CSS}`,
    [effectiveCyclingTransitioning, shellTransitionMs]
  );

  const idleLayerStyle = useMemo(
    () => ({
      opacity,
      transform: 'none',
      filter: toneBlurPx(effectiveSpaceBlur),
    }),
    [toneBlurPx, opacity, effectiveSpaceBlur]
  );

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
    <div key={transitionKey}>
      {spaceFade.spaceCrossfadeActive && spaceFade.baseUrl ? (
        <>
          <div
            className="wallpaper-bg wallpaper-bg--space-base"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 0,
              pointerEvents: 'none',
              backgroundImage: `url('${spaceFade.baseUrl}')`,
              backgroundSize: 'cover',
              backgroundPosition: `center ${parallaxBgY}%`,
              backgroundRepeat: 'no-repeat',
              ...idleLayerStyle,
              transition: idleWallpaperTransition,
            }}
          />
          {spaceFade.overlayUrl ? (
            <div
              className="wallpaper-bg wallpaper-bg--space-overlay"
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
                filter: toneBlurPx(effectiveSpaceBlur),
                transition: spaceOverlayTransition,
              }}
              onTransitionEnd={spaceFade.onOverlayTransitionEnd}
            />
          ) : null}
        </>
      ) : (
        <>
          {effectiveCurrentWallpaperUrl ? (
            <div
              className="wallpaper-bg"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 0,
                pointerEvents: 'none',
                backgroundImage: `url('${effectiveCurrentWallpaperUrl}')`,
                backgroundSize: 'cover',
                backgroundPosition: `center ${parallaxBgY}%`,
                backgroundRepeat: 'no-repeat',
                ...currentLayerStyle,
                transition: idleWallpaperTransition,
              }}
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
        </>
      )}
    </div>
    </div>
  );
}

const IsolatedWallpaperBackground = React.memo(IsolatedWallpaperBackgroundInner);

export default IsolatedWallpaperBackground;
