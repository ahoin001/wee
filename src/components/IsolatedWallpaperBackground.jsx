import React, { useCallback } from 'react';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import useWallpaperCycling from '../utils/useWallpaperCycling';

const IsolatedWallpaperBackground = React.memo(() => {
  const wallpaper = useConsolidatedAppStore((state) => state.wallpaper);
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
    if (!cyclingTransitioning || !currentWallpaper?.url) {
      return {
        opacity,
        transform: 'none',
        filter: `blur(${blur}px)`,
      };
    }

    const progress = cyclingProgress;

    switch (cycleAnimation) {
      case 'fade':
        return {
          opacity: opacity * (1 - progress),
          transform: 'none',
          filter: `blur(${blur}px)`,
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
          filter: `blur(${blur}px)`,
        };
      }
      case 'zoom': {
        const zoomScale = 1 + (progress * 0.1);
        return {
          opacity: opacity * (1 - progress * 0.5),
          transform: `scale(${zoomScale})`,
          filter: `blur(${blur + (progress * 2)}px)`,
        };
      }
      case 'ken-burns': {
        const kenBurnsScale = 1 + (progress * 0.15);
        const kenBurnsX = progress * 3;
        const kenBurnsY = progress * 1.5;
        return {
          opacity: opacity * (1 - progress * 0.3),
          transform: `scale(${kenBurnsScale}) translateX(${kenBurnsX}%) translateY(${kenBurnsY}%)`,
          filter: `blur(${blur}px)`,
        };
      }
      case 'morph': {
        const morphScale = 1 + (progress * 0.05);
        const morphRotate = progress * 2;
        const morphSkew = progress * 1;
        return {
          opacity: opacity * (1 - progress * 0.7),
          transform: `scale(${morphScale}) rotate(${morphRotate}deg) skew(${morphSkew}deg)`,
          filter: `blur(${blur + progress}px)`,
        };
      }
      case 'blur': {
        const blurIntensity = blur + (progress * 10);
        return {
          opacity: opacity * (1 - progress * 0.8),
          transform: 'none',
          filter: `blur(${blurIntensity}px)`,
        };
      }
      default:
        return {
          opacity,
          transform: 'none',
          filter: `blur(${blur}px)`,
        };
    }
  }, [cyclingTransitioning, currentWallpaper?.url, opacity, blur, cycleAnimation, cyclingProgress, cyclingSlideDirection]);

  const getNextWallpaperStyle = useCallback(() => {
    if (!cyclingTransitioning || !nextWallpaper?.url) {
      return {
        opacity: 0,
        transform: 'none',
        filter: `blur(${blur}px)`,
      };
    }

    const progress = cyclingProgress;

    switch (cycleAnimation) {
      case 'fade':
        return {
          opacity: opacity * progress,
          transform: 'none',
          filter: `blur(${blur}px)`,
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
          filter: `blur(${blur}px)`,
        };
      }
      case 'zoom': {
        const zoomScale = 1.1 - (progress * 0.1);
        return {
          opacity: opacity * progress,
          transform: `scale(${zoomScale})`,
          filter: `blur(${blur + ((1 - progress) * 2)}px)`,
        };
      }
      case 'ken-burns': {
        const kenBurnsScale = 1.15 - (progress * 0.15);
        const kenBurnsX = (1 - progress) * 3;
        const kenBurnsY = (1 - progress) * 1.5;
        return {
          opacity: opacity * progress,
          transform: `scale(${kenBurnsScale}) translateX(-${kenBurnsX}%) translateY(-${kenBurnsY}%)`,
          filter: `blur(${blur}px)`,
        };
      }
      case 'morph': {
        const morphScale = 1.05 - (progress * 0.05);
        const morphRotate = (1 - progress) * 2;
        const morphSkew = (1 - progress) * 1;
        return {
          opacity: opacity * progress,
          transform: `scale(${morphScale}) rotate(-${morphRotate}deg) skew(-${morphSkew}deg)`,
          filter: `blur(${blur + ((1 - progress) * 1)}px)`,
        };
      }
      case 'blur': {
        const blurIntensity = blur + ((1 - progress) * 10);
        return {
          opacity: opacity * progress,
          transform: 'none',
          filter: `blur(${blurIntensity}px)`,
        };
      }
      default:
        return {
          opacity: opacity * progress,
          transform: 'none',
          filter: `blur(${blur}px)`,
        };
    }
  }, [cyclingTransitioning, nextWallpaper?.url, opacity, blur, cycleAnimation, cyclingProgress, cyclingSlideDirection]);

  const transitionKey = `${cyclingTransitioning}-${cyclingProgress}-${cyclingSlideProgress}-${cyclingSlideDirection}-${forceUpdate}`;

  return (
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
            background: `url('${currentWallpaper.url}') center center / cover no-repeat`,
            ...getCurrentWallpaperStyle(),
            transition: cyclingTransitioning ? 'none' : 'opacity 0.3s ease-out, transform 0.3s ease-out, filter 0.3s ease-out',
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
            background: `url('${nextWallpaper.url}') center center / cover no-repeat`,
            ...getNextWallpaperStyle(),
            transition: 'none',
          }}
        />
      )}
    </div>
  );
});

export default IsolatedWallpaperBackground;
