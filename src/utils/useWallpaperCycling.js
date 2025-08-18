import { useEffect, useRef, useCallback } from 'react';
import useConsolidatedAppStore from './useConsolidatedAppStore';

const useWallpaperCycling = () => {
  const { wallpaper } = useConsolidatedAppStore();
  const { setWallpaperState } = useConsolidatedAppStore(state => state.actions);
  const intervalRef = useRef(null);
  const isTransitioningRef = useRef(false);

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
    current
  } = wallpaper;

  // Debug logging for wallpaper state
  console.log('[WallpaperCycling] Wallpaper state:', {
    cycleWallpapers,
    cycleInterval,
    likedWallpapersCount: likedWallpapers?.length,
    currentWallpaper: current,
    likedWallpapers: likedWallpapers
  });

  // Simple function to get next wallpaper
  const getNextWallpaper = useCallback(() => {
    console.log('[WallpaperCycling] getNextWallpaper called');
    console.log('[WallpaperCycling] likedWallpapers:', likedWallpapers);
    console.log('[WallpaperCycling] current wallpaper:', current);
    
    if (!likedWallpapers || likedWallpapers.length === 0) {
      console.log('[WallpaperCycling] No liked wallpapers available');
      return null;
    }

    // If no current wallpaper, start with first
    if (!current) {
      console.log('[WallpaperCycling] No current wallpaper, starting with first:', likedWallpapers[0]);
      return likedWallpapers[0];
    }

    // Check if likedWallpapers contains objects or strings
    const isObjectArray = likedWallpapers.length > 0 && typeof likedWallpapers[0] === 'object';
    console.log('[WallpaperCycling] likedWallpapers is object array:', isObjectArray);

    // Find current index based on data structure
    let currentIndex;
    if (isObjectArray) {
      // likedWallpapers contains objects with url property
      currentIndex = likedWallpapers.findIndex(w => w.url === current.url);
    } else {
      // likedWallpapers contains URL strings
      currentIndex = likedWallpapers.indexOf(current.url);
    }
    
    console.log('[WallpaperCycling] Current wallpaper index:', currentIndex);
    
    // If not found, start with first
    if (currentIndex === -1) {
      console.log('[WallpaperCycling] Current wallpaper not in liked list, starting with first:', likedWallpapers[0]);
      return likedWallpapers[0];
    }

    // Get next (cycle back to first)
    const nextIndex = (currentIndex + 1) % likedWallpapers.length;
    const nextWallpaper = likedWallpapers[nextIndex];
    console.log('[WallpaperCycling] Next wallpaper index:', nextIndex, 'Next wallpaper:', nextWallpaper);
    return nextWallpaper;
  }, [likedWallpapers, current]);

  // Simple transition function
  const transitionToWallpaper = useCallback(async (nextWallpaper) => {
    if (!nextWallpaper || isTransitioningRef.current) {
      return;
    }

    isTransitioningRef.current = true;

    // Set next wallpaper and start transition
    setWallpaperState({
      next: nextWallpaper,
      isTransitioning: true,
      crossfadeProgress: 0,
      slideProgress: 0
    });

    // Set slide direction if needed
    if (cycleAnimation === 'slide') {
      const direction = slideRandomDirection 
        ? ['left', 'right', 'up', 'down'][Math.floor(Math.random() * 4)]
        : slideDirection;
      setWallpaperState({ slideDirection: direction });
    }

    // Calculate duration
    const duration = cycleAnimation === 'slide' ? slideDuration : crossfadeDuration;
    const startTime = Date.now();

    // Animate
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);

      // Apply easing
      let easedProgress = progress;
      const easing = cycleAnimation === 'slide' ? slideEasing : crossfadeEasing;
      
      if (easing === 'ease-out') {
        easedProgress = 1 - Math.pow(1 - progress, 3);
      } else if (easing === 'ease-in') {
        easedProgress = Math.pow(progress, 3);
      } else if (easing === 'ease-in-out') {
        easedProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      }

      // Update progress
      if (cycleAnimation === 'slide') {
        setWallpaperState({ slideProgress: easedProgress });
      } else {
        setWallpaperState({ crossfadeProgress: easedProgress });
      }

      // Continue or complete
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Complete transition
        setWallpaperState({
          current: nextWallpaper,
          next: null,
          isTransitioning: false,
          crossfadeProgress: 0,
          slideProgress: 0
        });
        isTransitioningRef.current = false;
      }
    };

    requestAnimationFrame(animate);
  }, [
    setWallpaperState,
    cycleAnimation,
    slideRandomDirection,
    slideDirection,
    slideDuration,
    crossfadeDuration,
    slideEasing,
    crossfadeEasing
  ]);

  // Simple cycle function
  const cycleToNext = useCallback(() => {
    console.log('[WallpaperCycling] cycleToNext called');
    console.log('[WallpaperCycling] isTransitioningRef.current:', isTransitioningRef.current);
    
    if (isTransitioningRef.current) {
      console.log('[WallpaperCycling] Skipping cycle - already transitioning');
      return; // Don't cycle if already transitioning
    }

    const nextWallpaper = getNextWallpaper();
    console.log('[WallpaperCycling] Next wallpaper selected:', nextWallpaper);
    
    if (nextWallpaper) {
      console.log('[WallpaperCycling] Starting transition to:', nextWallpaper);
      transitionToWallpaper(nextWallpaper);
    } else {
      console.log('[WallpaperCycling] No next wallpaper available');
    }
  }, [getNextWallpaper, transitionToWallpaper]);

  // Start/stop cycling
  const startCycling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (cycleWallpapers && likedWallpapers && likedWallpapers.length > 1) {
      intervalRef.current = setInterval(cycleToNext, cycleInterval * 1000);
    }
  }, [cycleWallpapers, likedWallpapers, cycleInterval, cycleToNext]);

  const stopCycling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Manage cycling lifecycle
  useEffect(() => {
    if (cycleWallpapers && likedWallpapers && likedWallpapers.length > 1) {
      startCycling();
    } else {
      stopCycling();
    }

    return stopCycling;
  }, [cycleWallpapers, likedWallpapers?.length, startCycling, stopCycling]);

  // Restart when interval changes
  useEffect(() => {
    if (cycleWallpapers && intervalRef.current) {
      startCycling();
    }
  }, [cycleInterval, cycleWallpapers, startCycling]);

  // Manual cycle function
  const manualCycle = useCallback(() => {
    if (!isTransitioningRef.current) {
      cycleToNext();
    }
  }, [cycleToNext]);

  return {
    isCycling: cycleWallpapers && likedWallpapers && likedWallpapers.length > 1,
    isTransitioning: wallpaper.isTransitioning,
    currentWallpaper: current,
    nextWallpaper: wallpaper.next,
    crossfadeProgress: wallpaper.crossfadeProgress,
    slideProgress: wallpaper.slideProgress,
    slideDirection: wallpaper.slideDirection,
    cycleToNextWallpaper: manualCycle,
    startCycling,
    stopCycling
  };
};

export default useWallpaperCycling;
