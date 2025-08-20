import { useEffect, useRef, useCallback, useState } from 'react';
import useConsolidatedAppStore from './useConsolidatedAppStore';

const useWallpaperCycling = () => {
  const { wallpaper } = useConsolidatedAppStore();
  const { setWallpaperState } = useConsolidatedAppStore(state => state.actions);
  const intervalRef = useRef(null);
  const isTransitioningRef = useRef(false);
  
  // Use refs to avoid triggering re-renders during transitions
  const currentWallpaperRef = useRef(wallpaper.current);
  const nextWallpaperRef = useRef(null);
  
  // Local state for transitions to avoid triggering store re-renders
  const [localTransitionState, setLocalTransitionState] = useState({
    isTransitioning: false,
    progress: 0, // Unified progress for all animations
    slideDirection: 'right',
    nextWallpaper: null
  });

  // Force update counter to ensure isolated component re-renders
  const [forceUpdate, setForceUpdate] = useState(0);

  // Update refs when store changes (but don't trigger re-renders)
  useEffect(() => {
    currentWallpaperRef.current = wallpaper.current;
  }, [wallpaper.current]);

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
    current
  } = wallpaper;

  // Simple function to get next wallpaper
  const getNextWallpaper = useCallback(() => {
    if (!likedWallpapers || likedWallpapers.length === 0) {
      return null;
    }

    if (!current) {
      return likedWallpapers[0];
    }

    const currentUrl = current.url || current;
    const currentIndex = likedWallpapers.findIndex(w => 
      (w.url || w) === currentUrl
    );

    if (currentIndex === -1) {
      return likedWallpapers[0];
    }

    const nextIndex = (currentIndex + 1) % likedWallpapers.length;
    const nextWallpaper = likedWallpapers[nextIndex];
    
    return nextWallpaper;
  }, [likedWallpapers, current]);

  // Enhanced transition function with animation-specific behavior
  const transitionToWallpaper = useCallback(async (nextWallpaper) => {
    if (!nextWallpaper || isTransitioningRef.current) {
      return;
    }

    isTransitioningRef.current = true;
    nextWallpaperRef.current = nextWallpaper;

    // Use local state for transition properties to avoid triggering other components
    setLocalTransitionState({
      isTransitioning: true,
      progress: 0, // Reset progress for new transition
      slideDirection: slideRandomDirection 
        ? ['left', 'right', 'up', 'down'][Math.floor(Math.random() * 4)]
        : slideDirection,
      nextWallpaper: nextWallpaper
    });

    // Animation-specific duration and easing
    let duration;
    let easing;
    
    switch (cycleAnimation) {
      case 'slide':
        duration = slideDuration;
        easing = slideEasing;
        break;
      case 'zoom':
        duration = crossfadeDuration * 0.8; // Faster for zoom effect
        easing = crossfadeEasing;
        break;
      case 'ken-burns':
        duration = crossfadeDuration * 1.4; // Slower for cinematic effect
        easing = crossfadeEasing;
        break;
      case 'morph':
        duration = crossfadeDuration * 1.2; // Medium for morphing
        easing = crossfadeEasing;
        break;
      case 'blur':
        duration = crossfadeDuration * 0.7; // Quick blur transition
        easing = crossfadeEasing;
        break;
      case 'fade':
      default:
        duration = crossfadeDuration;
        easing = crossfadeEasing;
        break;
    }

    const startTime = Date.now();

    // Enhanced animation with improved easing functions
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);

      // Apply enhanced easing functions
      let easedProgress = progress;
      
      switch (easing) {
        case 'ease-out':
          // Smooth deceleration - most natural for wallpaper transitions
          easedProgress = 1 - Math.pow(1 - progress, 3);
          break;
        case 'ease-in':
          // Gradual acceleration
          easedProgress = Math.pow(progress, 3);
          break;
        case 'ease-in-out':
          // Smooth acceleration and deceleration
          easedProgress = progress < 0.5 
            ? 4 * progress * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          break;
        case 'cubic-bezier':
          // Custom cubic-bezier curve for professional feel
          easedProgress = progress * progress * (3 - 2 * progress);
          break;
        case 'linear':
        default:
          easedProgress = progress;
          break;
      }

      // Update progress with local state only
      setLocalTransitionState(prev => ({ ...prev, progress: easedProgress }));
      setForceUpdate(prev => prev + 1); // Force isolated component to re-render

      // Continue or complete
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Complete transition - update refs and store
        currentWallpaperRef.current = nextWallpaper;
        nextWallpaperRef.current = null;
        
        // Only update the store ONCE at the very end
        setWallpaperState({
          current: nextWallpaper,
        });
        
        // Reset local transition state
        setLocalTransitionState({
          isTransitioning: false,
          progress: 0,
          slideDirection: 'right',
          nextWallpaper: null
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
    if (isTransitioningRef.current) {
      return; // Don't cycle if already transitioning
    }

    const nextWallpaper = getNextWallpaper();
    
    if (nextWallpaper) {
      transitionToWallpaper(nextWallpaper);
    }
  }, [getNextWallpaper, transitionToWallpaper]);

  // Manage cycling lifecycle - simplified to prevent infinite loops
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Start cycling if conditions are met
    if (cycleWallpapers && likedWallpapers && likedWallpapers.length > 1) {
      intervalRef.current = setInterval(() => {
        if (!isTransitioningRef.current) {
          cycleToNext();
        }
      }, cycleInterval * 1000);
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [cycleWallpapers, likedWallpapers?.length, cycleInterval, cycleToNext]); // Only depend on these stable values

  // Manual cycle function
  const manualCycle = useCallback(() => {
    if (!isTransitioningRef.current) {
      cycleToNext();
    }
  }, [cycleToNext]);

  return {
    isCycling: cycleWallpapers && likedWallpapers && likedWallpapers.length > 1,
    isTransitioning: localTransitionState.isTransitioning,
    currentWallpaper: currentWallpaperRef.current,
    nextWallpaper: localTransitionState.nextWallpaper,
    crossfadeProgress: localTransitionState.progress, // Changed from crossfadeProgress to progress
    slideProgress: localTransitionState.progress, // Changed from slideProgress to progress
    slideDirection: localTransitionState.slideDirection,
    cycleToNextWallpaper: manualCycle,
    forceUpdate, // Add force update counter
    // Debug info
    debug: {
      cycleWallpapers,
      likedWallpapersCount: likedWallpapers?.length,
      savedWallpapersCount: savedWallpapers?.length,
      hasMultipleLiked: likedWallpapers && likedWallpapers.length > 1
    }
  };
};

export default useWallpaperCycling;
