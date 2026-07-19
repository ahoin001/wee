import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from './useConsolidatedAppStore';
import { useAppActivity } from '../hooks/useAppActivity';
import { normalizeWallpaperForStore, wallpaperEntryUrlKey } from './wallpaperShape';
import { isWallpaperCyclingEligible } from './theme/resolveEffectiveAccent';
import { resolveActiveBoardCurrentPage } from './channelSpaces';
import { preloadImageUrl } from './mediaWarmCache';
import { registerWallpaperCycleManual } from './wallpaperCyclingBridge';

const useWallpaperCycling = () => {
  const {
    wallpaper,
    setWallpaperState,
    lowPowerMode,
    activeSpaceId,
    sessionPower,
    appearanceBySpace,
    channels,
  } = useConsolidatedAppStore(
    useShallow((state) => ({
      wallpaper: state.wallpaper,
      setWallpaperState: state.actions.setWallpaperState,
      lowPowerMode: state.ui.lowPowerMode,
      activeSpaceId: state.spaces.activeSpaceId,
      sessionPower: state.ui.sessionPower ?? 'normal',
      appearanceBySpace: state.appearanceBySpace,
      channels: state.channels,
    }))
  );
  const { isAppActive } = useAppActivity();
  const isAppActiveRef = useRef(isAppActive);
  const cycleAllowed = isAppActive && sessionPower !== 'away';
  const cycleAllowedRef = useRef(cycleAllowed);
  const displayEligibleRef = useRef(true);
  const prevSpaceIdRef = useRef(activeSpaceId);
  const prevPageRef = useRef(0);
  const intervalRef = useRef(null);
  const isTransitioningRef = useRef(false);
  const cycleRafRef = useRef(null);

  // Use refs to avoid triggering re-renders during transitions
  const currentWallpaperRef = useRef(wallpaper.current);
  const nextWallpaperRef = useRef(null);

  // Local state for transitions to avoid triggering store re-renders
  const [localTransitionState, setLocalTransitionState] = useState({
    isTransitioning: false,
    progress: 0,
    slideDirection: 'right',
    nextWallpaper: null,
  });

  const currentPage = resolveActiveBoardCurrentPage({ activeSpaceId, channels });
  const displayEligible = useMemo(
    () =>
      isWallpaperCyclingEligible({
        activeSpaceId,
        appearanceBySpace,
        currentPage,
      }),
    [activeSpaceId, appearanceBySpace, currentPage]
  );

  useEffect(() => {
    isAppActiveRef.current = isAppActive;
    cycleAllowedRef.current = cycleAllowed;
  }, [isAppActive, cycleAllowed]);

  useEffect(() => {
    displayEligibleRef.current = displayEligible;
  }, [displayEligible]);

  const abortCycleTransition = useCallback(() => {
    if (cycleRafRef.current != null) {
      cancelAnimationFrame(cycleRafRef.current);
      cycleRafRef.current = null;
    }
    if (!isTransitioningRef.current) return;
    isTransitioningRef.current = false;
    nextWallpaperRef.current = null;
    setLocalTransitionState({
      isTransitioning: false,
      progress: 0,
      slideDirection: 'right',
      nextWallpaper: null,
    });
  }, []);

  useEffect(() => {
    if (isAppActive) return undefined;
    abortCycleTransition();
    return undefined;
  }, [isAppActive, abortCycleTransition]);

  // Update refs when store changes — normalize strings so layers always get `.url`
  useEffect(() => {
    const normalized = normalizeWallpaperForStore(wallpaper.current, {
      savedWallpapers: wallpaper.savedWallpapers,
    });
    currentWallpaperRef.current = normalized?.url ? normalized : wallpaper.current ?? null;
  }, [wallpaper.current, wallpaper.savedWallpapers]);

  /** Space / page change: abort in-flight cycle so space/page crossfade owns the frame. */
  useEffect(() => {
    const spaceChanged = prevSpaceIdRef.current !== activeSpaceId;
    const pageChanged = prevPageRef.current !== currentPage;
    prevSpaceIdRef.current = activeSpaceId;
    prevPageRef.current = currentPage;
    if (spaceChanged || pageChanged) {
      abortCycleTransition();
    }
  }, [activeSpaceId, currentPage, abortCycleTransition]);

  useEffect(() => {
    if (!displayEligible) {
      abortCycleTransition();
    }
  }, [displayEligible, abortCycleTransition]);

  const {
    cycleWallpapers,
    cycleInterval,
    cycleAnimation,
    crossfadeDuration,
    crossfadeEasing,
    slideRandomDirection,
    slideDuration,
    slideEasing,
    slideDirection,
    likedWallpapers,
    savedWallpapers,
    current,
  } = wallpaper;
  const effectiveCycleInterval = lowPowerMode ? Math.max(cycleInterval, 60) : cycleInterval;

  // Next wallpaper from liked list (URLs or objects) → always `{ url }` for store + layers
  const getNextWallpaper = useCallback(() => {
    if (!likedWallpapers || likedWallpapers.length === 0) {
      return null;
    }

    const opts = { savedWallpapers };

    if (!current) {
      return normalizeWallpaperForStore(likedWallpapers[0], opts);
    }

    const currentUrl = wallpaperEntryUrlKey(current);
    const currentIndex = likedWallpapers.findIndex((w) => wallpaperEntryUrlKey(w) === currentUrl);

    if (currentIndex === -1) {
      return normalizeWallpaperForStore(likedWallpapers[0], opts);
    }

    const nextIndex = (currentIndex + 1) % likedWallpapers.length;
    return normalizeWallpaperForStore(likedWallpapers[nextIndex], opts);
  }, [likedWallpapers, current, savedWallpapers]);

  const transitionToWallpaper = useCallback(
    async (nextWallpaper) => {
      const normalized = normalizeWallpaperForStore(nextWallpaper, { savedWallpapers });
      if (!normalized?.url || isTransitioningRef.current) {
        return;
      }
      if (!cycleAllowedRef.current || !displayEligibleRef.current) {
        return;
      }

      // Decode before animating so the next layer does not pop in mid-fade.
      try {
        await preloadImageUrl(normalized.url);
      } catch {
        // Continue anyway — missing preload should not stall the interval forever.
      }

      if (!cycleAllowedRef.current || !displayEligibleRef.current || isTransitioningRef.current) {
        return;
      }

      isTransitioningRef.current = true;
      nextWallpaperRef.current = normalized;

      setLocalTransitionState({
        isTransitioning: true,
        progress: 0,
        slideDirection: slideRandomDirection
          ? ['left', 'right', 'up', 'down'][Math.floor(Math.random() * 4)]
          : slideDirection,
        nextWallpaper: normalized,
      });

      let duration;
      let easing;

      switch (cycleAnimation) {
        case 'slide':
          duration = slideDuration;
          easing = slideEasing;
          break;
        case 'zoom':
          duration = crossfadeDuration * 0.8;
          easing = crossfadeEasing;
          break;
        case 'ken-burns':
          duration = crossfadeDuration * 1.4;
          easing = crossfadeEasing;
          break;
        case 'morph':
          duration = crossfadeDuration * 1.2;
          easing = crossfadeEasing;
          break;
        case 'blur':
          duration = crossfadeDuration * 0.7;
          easing = crossfadeEasing;
          break;
        case 'fade':
        default:
          duration = crossfadeDuration;
          easing = crossfadeEasing;
          break;
      }

      const startTime = Date.now();

      const animate = () => {
        if (!isAppActiveRef.current || !displayEligibleRef.current) {
          abortCycleTransition();
          return;
        }

        const elapsed = (Date.now() - startTime) / 1000;
        const progress = Math.min(elapsed / duration, 1);

        let easedProgress = progress;

        switch (easing) {
          case 'ease-out':
            easedProgress = 1 - Math.pow(1 - progress, 3);
            break;
          case 'ease-in':
            easedProgress = Math.pow(progress, 3);
            break;
          case 'ease-in-out':
            easedProgress =
              progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            break;
          case 'cubic-bezier':
            easedProgress = progress * progress * (3 - 2 * progress);
            break;
          case 'linear':
          default:
            easedProgress = progress;
            break;
        }

        setLocalTransitionState((prev) => ({ ...prev, progress: easedProgress }));

        if (progress < 1) {
          cycleRafRef.current = requestAnimationFrame(animate);
        } else {
          cycleRafRef.current = null;
          currentWallpaperRef.current = normalized;
          nextWallpaperRef.current = null;

          setWallpaperState({
            current: normalized,
          });

          setLocalTransitionState({
            isTransitioning: false,
            progress: 0,
            slideDirection: 'right',
            nextWallpaper: null,
          });

          isTransitioningRef.current = false;
        }
      };

      cycleRafRef.current = requestAnimationFrame(animate);
    },
    [
      setWallpaperState,
      cycleAnimation,
      slideRandomDirection,
      slideDirection,
      slideDuration,
      crossfadeDuration,
      slideEasing,
      crossfadeEasing,
      savedWallpapers,
      abortCycleTransition,
    ]
  );

  const cycleToNext = useCallback(() => {
    if (!cycleAllowedRef.current || !displayEligibleRef.current || isTransitioningRef.current) {
      return;
    }

    const nextWallpaper = getNextWallpaper();

    if (nextWallpaper) {
      transitionToWallpaper(nextWallpaper);
    }
  }, [getNextWallpaper, transitionToWallpaper]);

  // Manage cycling lifecycle — one interval, only while display-eligible.
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (
      cycleAllowed &&
      displayEligible &&
      cycleWallpapers &&
      likedWallpapers &&
      likedWallpapers.length > 1
    ) {
      intervalRef.current = setInterval(() => {
        if (!isTransitioningRef.current) {
          cycleToNext();
        }
      }, effectiveCycleInterval * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    cycleWallpapers,
    likedWallpapers?.length,
    effectiveCycleInterval,
    cycleToNext,
    cycleAllowed,
    displayEligible,
  ]);

  const manualCycle = useCallback(() => {
    if (cycleAllowedRef.current && displayEligibleRef.current && !isTransitioningRef.current) {
      cycleToNext();
    }
  }, [cycleToNext]);

  useEffect(() => registerWallpaperCycleManual(manualCycle), [manualCycle]);

  return {
    isCycling:
      Boolean(cycleWallpapers) &&
      Boolean(likedWallpapers && likedWallpapers.length > 1) &&
      displayEligible,
    displayEligible,
    /** Effective interval in seconds (respects low-power minimum). For UI/debug only. */
    cycleIntervalSeconds: effectiveCycleInterval,
    isTransitioning: localTransitionState.isTransitioning,
    currentWallpaper: currentWallpaperRef.current,
    nextWallpaper: localTransitionState.nextWallpaper,
    crossfadeProgress: localTransitionState.progress,
    slideProgress: localTransitionState.progress,
    slideDirection: localTransitionState.slideDirection,
    cycleToNextWallpaper: manualCycle,
    debug: {
      cycleWallpapers,
      lowPowerMode,
      likedWallpapersCount: likedWallpapers?.length,
      savedWallpapersCount: savedWallpapers?.length,
      hasMultipleLiked: likedWallpapers && likedWallpapers.length > 1,
      displayEligible,
    },
  };
};

export default useWallpaperCycling;
