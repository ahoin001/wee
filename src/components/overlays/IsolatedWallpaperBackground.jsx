import React, { useCallback, useMemo } from 'react';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import useWallpaperCycling from '../../utils/useWallpaperCycling';

const DEFAULT_SPACE_ORDER = ['home', 'workspaces', 'gamehub'];

/**
 * Space-switch depth cue via background-position (cover stays full viewport).
 * translateY() on the layer shifted the painted image down and uncovered a strip at the top (worst on Game Hub = highest index).
 */
function spaceParallaxBackgroundYPercent(spaceIndex) {
  const i = Math.min(Math.max(spaceIndex, 0), 8);
  return 50 + i * 4;
}

const IsolatedWallpaperBackground = React.memo(() => {
  const wallpaper = useConsolidatedAppStore((state) => state.wallpaper);
  const activeSpaceId = useConsolidatedAppStore((state) => state.spaces.activeSpaceId);
  const spaceOrder = useConsolidatedAppStore((state) => state.spaces.order);

  const {
    workspaceBrightness,
    workspaceSaturate,
    gameHubBrightness,
    gameHubSaturate,
  } = wallpaper;

  const applySpaceWallpaperTone = useMemo(() => {
    const isGameHub = activeSpaceId === 'gamehub';
    const b = isGameHub ? gameHubBrightness : workspaceBrightness;
    const s = isGameHub ? gameHubSaturate : workspaceSaturate;
    const bb = typeof b === 'number' && !Number.isNaN(b) ? b : isGameHub ? 0.78 : 1;
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

  const resolvedSpaceOrder = Array.isArray(spaceOrder) && spaceOrder.length > 0 ? spaceOrder : DEFAULT_SPACE_ORDER;
  const rawIndex = resolvedSpaceOrder.indexOf(activeSpaceId);
  const spaceIndex = rawIndex >= 0 ? rawIndex : 0;
  const parallaxBgY = spaceParallaxBackgroundYPercent(spaceIndex);

  const currentLayerStyle = getCurrentWallpaperStyle();
  const nextLayerStyle = getNextWallpaperStyle();

  const idleWallpaperTransition = cyclingTransitioning
    ? 'none'
    : 'opacity 0.35s ease-out, transform 0.35s ease-out, filter 0.45s ease-out, background-position 0.78s cubic-bezier(0.16, 1, 0.3, 1)';

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
    </div>
    </div>
  );
});

export default IsolatedWallpaperBackground;
