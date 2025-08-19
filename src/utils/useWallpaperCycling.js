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
    console.log('[WallpaperCycling] savedWallpapers:', savedWallpapers);
    console.log('[WallpaperCycling] current wallpaper:', current);
    
    if (!likedWallpapers || likedWallpapers.length === 0) {
      console.log('[WallpaperCycling] No liked wallpapers available');
      return null;
    }

    // Helper function to find wallpaper object by URL
    const findWallpaperByUrl = (url) => {
      return savedWallpapers?.find(w => w.url === url) || { url, name: 'Liked Wallpaper' };
    };

    // If no current wallpaper, start with first liked wallpaper
    if (!current) {
      console.log('[WallpaperCycling] No current wallpaper, starting with first liked wallpaper');
      const firstLikedUrl = likedWallpapers[0];
      const firstWallpaper = findWallpaperByUrl(firstLikedUrl);
      console.log('[WallpaperCycling] First wallpaper object:', firstWallpaper);
      return firstWallpaper;
    }

    // likedWallpapers contains URL strings, current is an object with url property
    const currentUrl = current.url;
    const currentIndex = likedWallpapers.indexOf(currentUrl);
    
    console.log('[WallpaperCycling] Current wallpaper URL:', currentUrl);
    console.log('[WallpaperCycling] Current wallpaper index in liked list:', currentIndex);
    
    // If current wallpaper is not in liked list, start with first
    if (currentIndex === -1) {
      console.log('[WallpaperCycling] Current wallpaper not in liked list, starting with first:', likedWallpapers[0]);
      const firstWallpaper = findWallpaperByUrl(likedWallpapers[0]);
      return firstWallpaper;
    }

    // Get next (cycle back to first)
    const nextIndex = (currentIndex + 1) % likedWallpapers.length;
    const nextUrl = likedWallpapers[nextIndex];
    console.log('[WallpaperCycling] Next wallpaper index:', nextIndex, 'Next URL:', nextUrl);
    
    const nextWallpaper = findWallpaperByUrl(nextUrl);
    console.log('[WallpaperCycling] Next wallpaper object:', nextWallpaper);
    return nextWallpaper;
  }, [likedWallpapers, savedWallpapers, current]);

  // Enhanced transition function with animation-specific behavior
  const transitionToWallpaper = useCallback(async (nextWallpaper) => {
    if (!nextWallpaper || isTransitioningRef.current) {
      console.log('[WallpaperCycling] Transition blocked:', { 
        hasNextWallpaper: !!nextWallpaper, 
        isTransitioning: isTransitioningRef.current 
      });
      return;
    }

    console.log('[WallpaperCycling] Starting transition:', {
      animation: cycleAnimation,
      duration: cycleAnimation === 'slide' ? slideDuration : crossfadeDuration,
      easing: cycleAnimation === 'slide' ? slideEasing : crossfadeEasing,
      nextWallpaper: nextWallpaper.url
    });

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

    console.log('[WallpaperCycling] Set transition state to true:', {
      isTransitioning: true,
      progress: 0,
      nextWallpaper: nextWallpaper.url
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

      // Debug progress updates
      if (process.env.NODE_ENV === 'development' && (progress % 0.1 < 0.01 || progress > 0.99)) {
        console.log('[WallpaperCycling] Animation progress:', {
          animation: cycleAnimation,
          progress: progress.toFixed(3),
          easedProgress: easedProgress.toFixed(3),
          elapsed: elapsed.toFixed(3),
          duration: duration.toFixed(3)
        });
      }

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
        
        console.log('[WallpaperCycling] Set transition state to false');
        
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
    console.log('[WallpaperCycling] Cycling conditions:', {
      cycleWallpapers,
      likedWallpapersCount: likedWallpapers?.length,
      hasMultipleLiked: likedWallpapers && likedWallpapers.length > 1,
      currentWallpaper: current?.url
    });
    
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
  }, [getNextWallpaper, transitionToWallpaper, cycleWallpapers, likedWallpapers, current]);

  // Manage cycling lifecycle - simplified to prevent infinite loops
  useEffect(() => {
    console.log('[WallpaperCycling] Cycling lifecycle effect:', {
      cycleWallpapers,
      likedWallpapersCount: likedWallpapers?.length,
      hasMultipleLiked: likedWallpapers && likedWallpapers.length > 1
    });

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Start cycling if conditions are met
    if (cycleWallpapers && likedWallpapers && likedWallpapers.length > 1) {
      console.log('[WallpaperCycling] Starting cycling with interval:', cycleInterval, 'seconds');
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
  }, [cycleWallpapers, likedWallpapers?.length, cycleInterval]); // Only depend on these stable values

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
