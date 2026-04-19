import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  const wallpaper = useConsolidatedAppStore((state) => state.wallpaper);
  const activeSpaceId = useConsolidatedAppStore((state) => state.spaces.activeSpaceId);
  const spaceOrder = useConsolidatedAppStore((state) => state.spaces.order);
  const displayWallpaperUrl = wallpaper.current
    ? wallpaperEntryUrlKey(wallpaper.current) || null
    : null;

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
    const b = isHubSpace ? gameHubBrightness : workspaceBrightness;
    const s = isHubSpace ? gameHubSaturate : workspaceSaturate;
    const bb = typeof b === 'number' && !Number.isNaN(b) ? b : isHubSpace ? 0.78 : 1;
    const ss = typeof s === 'number' && !Number.isNaN(s) ? s : 1;
    return (filterCss) => `${filterCss} brightness(${bb}) saturate(${ss})`;
  }, [
    activeSpaceId,
    workspaceBrightness,
    workspaceSaturate,
    gameHubBrightness,
    gameHubSaturate,
  ]);
  const {
    isTransitioning: cyclingTransitioning,
    currentWallpaper,
    nextWallpaper,
    crossfadeProgress: cyclingProgress,
    slideProgress: cyclingSlideProgress,
    slideDirection: cyclingSlideDirection,
    forceUpdate,
  } = useWallpaperCycling();

  const spaceFade = useSpaceWallpaperCrossfade({
    displayUrl: displayWallpaperUrl,
    activeSpaceId,
    cyclingTransitioning,
    transitionsEnabled: !reducedMotion,
    transitionMs: shellTransitionMs,
  });

  const { opacity, blur, cycleAnimation } = wallpaper;

  const getCurrentWallpaperStyle = useCallback(() => {
    const dim = applySpaceWallpaperTone;
    if (!cyclingTransitioning || !currentWallpaper?.url) {
      return {
        opacity,
        transform: 'none',
        filter: dim(`blur(${blur}px)`),
      };
    }

    const progress = cyclingProgress;

    switch (cycleAnimation) {
      case 'fade':
        return {
          opacity: opacity * (1 - progress),
          transform: 'none',
          filter: dim(`blur(${blur}px)`),
        };
      case 'slide': {
        const slideOffset = progress * 100;
        let slideTransform = 'none';

        switch (cyclingSlideDirection) {
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
          filter: dim(`blur(${blur}px)`),
        };
      }
      case 'zoom': {
        const zoomScale = 1 + (progress * 0.1);
        return {
          opacity: opacity * (1 - progress * 0.5),
          transform: `scale(${zoomScale})`,
          filter: dim(`blur(${blur + (progress * 2)}px)`),
        };
      }
      case 'ken-burns': {
        const kenBurnsScale = 1 + (progress * 0.15);
        const kenBurnsX = progress * 3;
        const kenBurnsY = progress * 1.5;
        return {
          opacity: opacity * (1 - progress * 0.3),
          transform: `scale(${kenBurnsScale}) translateX(${kenBurnsX}%) translateY(${kenBurnsY}%)`,
          filter: dim(`blur(${blur}px)`),
        };
      }
      case 'morph': {
        const morphScale = 1 + (progress * 0.05);
        const morphRotate = progress * 2;
        const morphSkew = progress * 1;
        return {
          opacity: opacity * (1 - progress * 0.7),
          transform: `scale(${morphScale}) rotate(${morphRotate}deg) skew(${morphSkew}deg)`,
          filter: dim(`blur(${blur + progress}px)`),
        };
      }
      case 'blur': {
        const blurIntensity = blur + (progress * 10);
        return {
          opacity: opacity * (1 - progress * 0.8),
          transform: 'none',
          filter: dim(`blur(${blurIntensity}px)`),
        };
      }
      default:
        return {
          opacity,
          transform: 'none',
          filter: dim(`blur(${blur}px)`),
        };
    }
  }, [
    applySpaceWallpaperTone,
    cyclingTransitioning,
    currentWallpaper?.url,
    opacity,
    blur,
    cycleAnimation,
    cyclingProgress,
    cyclingSlideDirection,
  ]);

  const getNextWallpaperStyle = useCallback(() => {
    const dim = applySpaceWallpaperTone;
    if (!cyclingTransitioning || !nextWallpaper?.url) {
      return {
        opacity: 0,
        transform: 'none',
        filter: dim(`blur(${blur}px)`),
      };
    }

    const progress = cyclingProgress;

    switch (cycleAnimation) {
      case 'fade':
        return {
          opacity: opacity * progress,
          transform: 'none',
          filter: dim(`blur(${blur}px)`),
        };
      case 'slide': {
        const slideOffset = (1 - progress) * 100;
        let slideTransform = 'none';

        switch (cyclingSlideDirection) {
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
          filter: dim(`blur(${blur}px)`),
        };
      }
      case 'zoom': {
        const zoomScale = 1.1 - (progress * 0.1);
        return {
          opacity: opacity * progress,
          transform: `scale(${zoomScale})`,
          filter: dim(`blur(${blur + ((1 - progress) * 2)}px)`),
        };
      }
      case 'ken-burns': {
        const kenBurnsScale = 1.15 - (progress * 0.15);
        const kenBurnsX = (1 - progress) * 3;
        const kenBurnsY = (1 - progress) * 1.5;
        return {
          opacity: opacity * progress,
          transform: `scale(${kenBurnsScale}) translateX(-${kenBurnsX}%) translateY(-${kenBurnsY}%)`,
          filter: dim(`blur(${blur}px)`),
        };
      }
      case 'morph': {
        const morphScale = 1.05 - (progress * 0.05);
        const morphRotate = (1 - progress) * 2;
        const morphSkew = (1 - progress) * 1;
        return {
          opacity: opacity * progress,
          transform: `scale(${morphScale}) rotate(-${morphRotate}deg) skew(-${morphSkew}deg)`,
          filter: dim(`blur(${blur + ((1 - progress) * 1)}px)`),
        };
      }
      case 'blur': {
        const blurIntensity = blur + ((1 - progress) * 10);
        return {
          opacity: opacity * progress,
          transform: 'none',
          filter: dim(`blur(${blurIntensity}px)`),
        };
      }
      default:
        return {
          opacity: opacity * progress,
          transform: 'none',
          filter: dim(`blur(${blur}px)`),
        };
    }
  }, [
    applySpaceWallpaperTone,
    cyclingTransitioning,
    nextWallpaper?.url,
    opacity,
    blur,
    cycleAnimation,
    cyclingProgress,
    cyclingSlideDirection,
  ]);

  const transitionKey = `${cyclingTransitioning}-${cyclingProgress}-${cyclingSlideProgress}-${cyclingSlideDirection}-${forceUpdate}`;

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
      cyclingTransitioning
        ? 'none'
        : `opacity 0.35s ease-out, transform 0.35s ease-out, filter 0.45s ease-out, background-position ${shellTransitionMs}ms ${SPACE_SHELL_EASE_CSS}`,
    [cyclingTransitioning, shellTransitionMs]
  );

  const idleLayerStyle = useMemo(
    () => ({
      opacity,
      transform: 'none',
      filter: applySpaceWallpaperTone(`blur(${blur}px)`),
    }),
    [applySpaceWallpaperTone, opacity, blur]
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
                filter: applySpaceWallpaperTone(`blur(${blur}px)`),
                transition: spaceOverlayTransition,
              }}
              onTransitionEnd={spaceFade.onOverlayTransitionEnd}
            />
          ) : null}
        </>
      ) : (
        <>
          {currentWallpaper && currentWallpaper.url && (
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
                backgroundImage: `url('${currentWallpaper.url}')`,
                backgroundSize: 'cover',
                backgroundPosition: `center ${parallaxBgY}%`,
                backgroundRepeat: 'no-repeat',
                ...currentLayerStyle,
                transition: idleWallpaperTransition,
              }}
            />
          )}

          {cyclingTransitioning && nextWallpaper && nextWallpaper.url && (
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
                backgroundImage: `url('${nextWallpaper.url}')`,
                backgroundSize: 'cover',
                backgroundPosition: `center ${parallaxBgY}%`,
                backgroundRepeat: 'no-repeat',
                ...nextLayerStyle,
                transition: 'none',
              }}
            />
          )}
        </>
      )}
    </div>
    </div>
  );
}

const IsolatedWallpaperBackground = React.memo(IsolatedWallpaperBackgroundInner);

export default IsolatedWallpaperBackground;
