import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import './KenBurnsImage.css';

// Gentle pan directions for smooth wallpaper-style transitions
const PAN_DIRECTIONS = [
  { name: 'gentle-zoom', from: { x: 0, y: 0 }, to: { x: -2, y: -2 } }, // Gentle zoom with slight pan
  { name: 'left-drift', from: { x: 0, y: -1 }, to: { x: -3, y: -1 } }, // Slow left drift
  { name: 'right-drift', from: { x: -3, y: -1 }, to: { x: 0, y: -1 } }, // Slow right drift
  { name: 'top-drift', from: { x: -1, y: 0 }, to: { x: -1, y: -3 } }, // Slow upward drift
  { name: 'bottom-drift', from: { x: -1, y: -3 }, to: { x: -1, y: 0 } }, // Slow downward drift
  { name: 'diagonal-tl', from: { x: 0, y: 0 }, to: { x: -2, y: -2 } }, // Gentle diagonal
  { name: 'diagonal-tr', from: { x: -2, y: 0 }, to: { x: 0, y: -2 } }, // Gentle diagonal
  { name: 'center-zoom', from: { x: -1, y: -1 }, to: { x: -1, y: -1 } }, // Pure gentle zoom
];

const KenBurnsImage = ({
  // Image sources
  src = null,
  images = [],
  alt = "Ken Burns Image",
  
  // Mode configuration
  mode = 'hover', // 'hover', 'autoplay', 'slideshow'
  
  // Timing configuration
  hoverDuration = 8000, // 8s hover animation
  autoplayDuration = 10000, // 10s per autoplay cycle
  slideshowDuration = 8000, // 8s per image in slideshow
  crossfadeDuration = 1500, // 1.5s crossfade between images
  
  // Animation configuration
  hoverScale = 1.1,
  autoplayScale = 1.15,
  slideshowScale = 1.08, // More gentle scale for slideshow
  easing = 'ease-out', // Animation easing function
  
  // Animation type configuration
  animationType = 'both', // 'zoom', 'pan', 'both'
  enableCrossfadeReturn = true, // For single images, crossfade back to original state
  transitionType = 'cross-dissolve', // 'cross-dissolve', 'morph-blur', 'push-zoom', 'swirl-fade', 'slide-dissolve'
  
  // Slideshow configuration
  enableReorder = false,
  onImagesReorder = null,
  
  // Style props
  width = '100%',
  height = '200px',
  borderRadius = '8px',
  objectFit = 'cover',
  
  // Performance
  enableIntersectionObserver = true,
  
  // Callbacks
  onImageChange = null,
  
  ...props
}) => {
  // State management
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [nextImageIndex, setNextImageIndex] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(!enableIntersectionObserver);
  const [currentPanDirection, setCurrentPanDirection] = useState(0);
  const [directionIndex, setDirectionIndex] = useState(0);
  const [imageLoadAttempts, setImageLoadAttempts] = useState(0); // Prevent infinite loops
  const [isTransitioning, setIsTransitioning] = useState(false); // Track transition state
  const [imageErrorCounter, setImageErrorCounter] = useState(0); // Force re-render when images fail
  const [allImagesFailed, setAllImagesFailed] = useState(false); // Track if all images have failed

  // Refs
  const containerRef = useRef(null);
  const animationTimeoutRef = useRef(null);
  const intersectionObserverRef = useRef(null);
  const currentImageRef = useRef(null);
  const nextImageRef = useRef(null);
  const brokenImagesRef = useRef(new Set()); // Track broken image URLs without causing re-renders

  // Get valid image source helper - stable function that checks current broken images
  const getValidImageSrc = useCallback((index) => {
    const brokenImagesSet = brokenImagesRef.current;
    
    // For slideshow mode, use images array
    if (mode === 'slideshow' && images.length > 0) {
      const imageUrl = images[index % images.length];
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() && !brokenImagesSet.has(imageUrl)) {
        return imageUrl;
      }
    }
    
    // For non-slideshow modes, prefer src prop, then fall back to first image
    if (src && typeof src === 'string' && src.trim() && !brokenImagesSet.has(src)) {
      return src;
    } else if (images.length > 0) {
      const imageUrl = images[index % images.length];
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() && !brokenImagesSet.has(imageUrl)) {
        return imageUrl;
      }
    }
    
    return null;
  }, [mode, images, src]); // Stable dependencies

  // Determine current and next image sources
  const currentImageSrc = useMemo(() => {
    return getValidImageSrc(currentImageIndex);
  }, [getValidImageSrc, currentImageIndex, imageErrorCounter]);

  const nextImageSrc = useMemo(() => {
    if (mode === 'slideshow') {
      // For single images, show the same image as "next" for transition effect
      if (images.length === 1) {
        return getValidImageSrc(0);
      }
      // For multiple images, show the actual next image
      else if (images.length > 1) {
        return getValidImageSrc(nextImageIndex);
      }
      // For single src prop, show the same image
      else if (src) {
        return src;
      }
    }
    return null;
  }, [getValidImageSrc, nextImageIndex, mode, images.length, src, imageErrorCounter]);



  // Get animation scale based on mode
  const getCurrentScale = useCallback(() => {
    switch (mode) {
      case 'hover': return hoverScale;
      case 'autoplay': return autoplayScale;
      case 'slideshow': return slideshowScale;
      default: return 1;
    }
  }, [mode, hoverScale, autoplayScale, slideshowScale]);

  // Get animation duration based on mode
  const getCurrentDuration = useCallback(() => {
    switch (mode) {
      case 'hover': return hoverDuration;
      case 'autoplay': return autoplayDuration;
      case 'slideshow': return slideshowDuration;
      default: return 8000;
    }
  }, [mode, hoverDuration, autoplayDuration, slideshowDuration]);

  // Intersection Observer setup
  useEffect(() => {
    if (!enableIntersectionObserver || !containerRef.current) return;

    intersectionObserverRef.current = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    intersectionObserverRef.current.observe(containerRef.current);

    return () => {
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, [enableIntersectionObserver]);

  // Autoplay animation
  const startAutoplayAnimation = useCallback(() => {
    if (!isVisible || mode !== 'autoplay') return;

    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    // Change direction for each cycle
    const nextDir = directionIndex % PAN_DIRECTIONS.length;
    setCurrentPanDirection(nextDir);
    setDirectionIndex(prev => prev + 1);

    animationTimeoutRef.current = setTimeout(() => {
      // Use a new callback to avoid infinite dependency loop
      if (mode === 'autoplay' && isVisible) {
        startAutoplayAnimation();
      }
    }, getCurrentDuration());
  }, [isVisible, mode, directionIndex, getCurrentDuration]);

  // Slideshow progression with smooth transitions
  const progressSlideshow = useCallback(() => {
    if (!isVisible || mode !== 'slideshow') return;

    // For single images, still do transitions for visual effect
    const imageCount = Math.max(images.length, 1);
    
    // Check if all images are broken (for multi-image galleries)
    if (images.length > 1 && brokenImagesRef.current.size >= images.length) {
      console.warn('All images in slideshow are broken, stopping progression');
      return;
    }

    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    // Get next direction for the upcoming image
    const nextDir = directionIndex % PAN_DIRECTIONS.length;
    setCurrentPanDirection(nextDir);
    setDirectionIndex(prev => prev + 1);

    // Start transition
    setIsTransitioning(true);

    // Schedule image change with transition
    animationTimeoutRef.current = setTimeout(() => {
      // For multiple images, move to next image
      if (images.length > 1) {
        setCurrentImageIndex(nextImageIndex);
        setNextImageIndex((nextImageIndex + 1) % images.length);
        
        // Notify parent of image change
        if (onImageChange) {
          onImageChange(nextImageIndex, images[nextImageIndex]);
        }
      }
      // For single images, just reset the pan direction for visual variety

      // End transition after crossfade duration
      setTimeout(() => {
        setIsTransitioning(false);
        
        // Continue slideshow
        setTimeout(() => {
          if (mode === 'slideshow' && isVisible && (images.length >= 1 || src)) {
            progressSlideshow();
          }
        }, 200);
      }, crossfadeDuration);
      
    }, getCurrentDuration() - crossfadeDuration);
  }, [isVisible, mode, images, src, currentImageIndex, nextImageIndex, directionIndex, crossfadeDuration, getCurrentDuration, onImageChange]);

  // Start autoplay or slideshow when component mounts or mode changes
  useEffect(() => {
    if (mode === 'autoplay') {
      startAutoplayAnimation();
    } else if (mode === 'slideshow' && (images.length >= 1 || src)) {
      progressSlideshow();
    }

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [mode, images.length, src]); // Only depend on mode and images.length, not the functions

  // Update image sources when they change
  useEffect(() => {
    if (currentImageRef.current) {
      if (currentImageSrc) {
        currentImageRef.current.src = currentImageSrc;
        currentImageRef.current.style.opacity = '1';
      } else {
        currentImageRef.current.src = '';
        currentImageRef.current.style.opacity = '0';
      }
    }
  }, [currentImageSrc]);

  useEffect(() => {
    if (nextImageRef.current) {
      if (nextImageSrc) {
        nextImageRef.current.src = nextImageSrc;
        // Next image starts hidden for slideshow transitions
        nextImageRef.current.style.opacity = mode === 'slideshow' ? '0' : '1';
      } else {
        nextImageRef.current.src = '';
        nextImageRef.current.style.opacity = '0';
      }
    }
  }, [nextImageSrc, mode]);

  // Reset broken images tracking when images change
  useEffect(() => {
    brokenImagesRef.current = new Set();
    setImageLoadAttempts(0);
    setImageErrorCounter(0);
    setAllImagesFailed(false);
    // Reset indices for slideshow
    setCurrentImageIndex(0);
    setNextImageIndex(1);
    setIsTransitioning(false);
  }, [images, src]);

  // Check if all available images have failed
  useEffect(() => {
    const totalImages = images.length || (src ? 1 : 0);
    const failedImages = brokenImagesRef.current.size;
    
    if (totalImages > 0 && failedImages >= totalImages) {
      console.warn('All KenBurns images have failed to load');
      setAllImagesFailed(true);
    } else {
      setAllImagesFailed(false);
    }
  }, [imageErrorCounter, images.length, src]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, []);

  // Get current pan direction
  const currentPan = PAN_DIRECTIONS[currentPanDirection];

  // Handle mouse events for hover mode
  const handleMouseEnter = () => {
    if (mode === 'hover') {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (mode === 'hover') {
      setIsHovered(false);
    }
  };

  // Convert easing name to CSS timing function
  const getEasingFunction = (easingName) => {
    const easingMap = {
      'linear': 'linear',
      'ease': 'ease',
      'ease-in': 'ease-in',
      'ease-out': 'ease-out',
      'ease-in-out': 'ease-in-out',
      'material': 'cubic-bezier(0.4, 0, 0.2, 1)', // Material Design
    };
    return easingMap[easingName] || 'ease-out';
  };

  // Generate CSS custom properties for animation
  const getCSSVariables = () => {
    const scale = getCurrentScale();
    const duration = getCurrentDuration();
    
    // Adjust pan and scale based on animation type
    let adjustedFromX = currentPan.from.x;
    let adjustedFromY = currentPan.from.y;
    let adjustedToX = currentPan.to.x;
    let adjustedToY = currentPan.to.y;
    let adjustedScale = scale;
    
    if (animationType === 'zoom') {
      // Zoom only - center position, no panning
      adjustedFromX = adjustedFromY = adjustedToX = adjustedToY = 0;
    } else if (animationType === 'pan') {
      // Pan only - no scaling
      adjustedScale = 1;
    }
    // 'both' uses original values
    
    return {
      '--ken-burns-scale': adjustedScale,
      '--ken-burns-duration': `${duration}ms`,
      '--ken-burns-crossfade-duration': `${crossfadeDuration}ms`,
      '--ken-burns-easing': getEasingFunction(easing),
      '--ken-burns-from-x': `${adjustedFromX}%`,
      '--ken-burns-from-y': `${adjustedFromY}%`,
      '--ken-burns-to-x': `${adjustedToX}%`,
      '--ken-burns-to-y': `${adjustedToY}%`,
      '--ken-burns-animation-type': animationType,
      '--ken-burns-crossfade-return': enableCrossfadeReturn ? 'true' : 'false',
      '--ken-burns-transition-type': transitionType,
    };
  };

  // Generate className based on current state
  const getClassName = () => {
    const classes = ['ken-burns-container'];
    
    // Add animation type class
    classes.push(`ken-burns-${animationType}`);
    if (enableCrossfadeReturn && mode !== 'slideshow') {
      classes.push('ken-burns-crossfade-return');
    }
    
    // Add transition type class for slideshows
    if (mode === 'slideshow' && nextImageSrc) {
      classes.push(`ken-burns-transition-${transitionType}`);
      if (isTransitioning) {
        classes.push('ken-burns-transitioning');
      }
    }
    
    if (mode === 'hover') {
      classes.push('ken-burns-hover-mode');
      // Always show the image, add active class when hovered for animation
      classes.push('ken-burns-visible');
      if (isHovered) {
        classes.push('ken-burns-active');
      }
    } else if (mode === 'autoplay') {
      classes.push('ken-burns-autoplay-mode');
      // Always show images in autoplay mode
      classes.push('ken-burns-visible');
      if (isVisible) {
        classes.push('ken-burns-active');
      }
    } else if (mode === 'slideshow') {
      classes.push('ken-burns-slideshow-mode');
      // Always show images in slideshow mode
      classes.push('ken-burns-visible');
      if (isVisible) {
        classes.push('ken-burns-active');
      }
    }
    
    if (!currentImageSrc) {
      const hasImages = (mode === 'slideshow' && images.length > 0) || src;
      const allImagesBroken = hasImages && ((mode === 'slideshow' && brokenImages.size >= images.length) || (src && brokenImages.has(src)));
      
      if (allImagesBroken) {
        classes.push('ken-burns-image-failed');
      } else {
        classes.push('ken-burns-placeholder');
      }
    }
    
    return classes.join(' ');
  };

  // Render placeholder when no image
  if (!currentImageSrc) {
    const hasImages = (mode === 'slideshow' && images.length > 0) || src;
    const allImagesBroken = hasImages && ((mode === 'slideshow' && brokenImages.size >= images.length) || (src && brokenImages.has(src)));
    
    return (
      <div
        ref={containerRef}
        className={getClassName()}
        style={{
          width,
          height,
          borderRadius,
        }}
        {...props}
      >
        <div className="ken-burns-no-image">
          {allImagesBroken ? 'Image Failed to Load' : 'No Image'}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={getClassName()}
      style={{
        width,
        height,
        borderRadius,
        ...getCSSVariables(),
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {/* Fallback display when all images fail */}
      {allImagesFailed && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            color: '#666',
            fontSize: '14px',
            borderRadius,
            zIndex: 10
          }}
        >
          <span>📷 Image unavailable</span>
        </div>
      )}

      {/* Current Image - Never changes key to avoid re-renders */}
        <img
          ref={currentImageRef}
          src={currentImageSrc || ''}
          alt={alt}
          className="ken-burns-image ken-burns-current"
        style={{
          objectFit,
          opacity: currentImageSrc ? 1 : 0,
        }}
        loading="lazy"
        draggable={false}
        onError={(e) => {
          console.warn('KenBurns image failed to load:', currentImageSrc);
          
          // Mark this image as broken
          if (currentImageSrc) {
            brokenImagesRef.current.add(currentImageSrc);
            setImageErrorCounter(prev => prev + 1);
          }
          
          // Prevent infinite loops by limiting attempts
          setImageLoadAttempts(prev => prev + 1);
          
          // If this is a slideshow with multiple images and we haven't exceeded attempts
          if (mode === 'slideshow' && images.length > 1 && imageLoadAttempts < images.length * 2) {
            const nextIndex = (currentImageIndex + 1) % images.length;
            setCurrentImageIndex(nextIndex);
            setNextImageIndex((nextIndex + 1) % images.length);
          } else if (imageLoadAttempts >= images.length * 2) {
            console.warn('Too many failed image load attempts, stopping slideshow progression');
          }
        }}
        onLoad={(e) => {
          // Image loaded successfully, reset attempt counter and ensure visibility
          setImageLoadAttempts(0);
          e.target.style.opacity = '1';
        }}
      />

              {/* Next Image (for slideshow transitions) - Never changes key to avoid re-renders */}
        {mode === 'slideshow' && (
          <img
            ref={nextImageRef}
            src={nextImageSrc || currentImageSrc || ''}
            alt={alt}
            className="ken-burns-image ken-burns-next"
          style={{
            objectFit,
            opacity: nextImageSrc && mode === 'slideshow' ? 0 : (nextImageSrc ? 1 : 0),
          }}
          loading="lazy"
          draggable={false}
          onError={(e) => {
            console.warn('KenBurns next image failed to load:', nextImageSrc);
            // Mark this image as broken and update next index
            if (nextImageSrc && images.length > 1) {
              brokenImagesRef.current.add(nextImageSrc);
              setImageErrorCounter(prev => prev + 1);
              setNextImageIndex((nextImageIndex + 1) % images.length);
            }
          }}
          onLoad={(e) => {
            // Image loaded successfully - for next image in slideshow, keep hidden until transition
            if (mode === 'slideshow') {
              e.target.style.opacity = '0';
            } else {
              e.target.style.opacity = '1';
            }
          }}
        />
      )}
      
      {/* Optional slideshow controls */}
      {mode === 'slideshow' && enableReorder && images.length > 1 && (
        <div className="ken-burns-controls">
          <div className="ken-burns-dots">
            {images.map((_, index) => (
              <button
                key={index}
                className={`ken-burns-dot ${index === currentImageIndex ? 'active' : ''}`}
                onClick={() => setCurrentImageIndex(index)}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

KenBurnsImage.propTypes = {
  // Image sources
  src: PropTypes.string,
  images: PropTypes.arrayOf(PropTypes.string),
  alt: PropTypes.string,
  
  // Mode configuration
  mode: PropTypes.oneOf(['hover', 'autoplay', 'slideshow']),
  
  // Timing configuration
  hoverDuration: PropTypes.number,
  autoplayDuration: PropTypes.number,
  slideshowDuration: PropTypes.number,
  crossfadeDuration: PropTypes.number,
  
  // Animation configuration
  hoverScale: PropTypes.number,
  autoplayScale: PropTypes.number,
  slideshowScale: PropTypes.number,
  easing: PropTypes.oneOf(['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'material']),
  
  // Animation type configuration
  animationType: PropTypes.oneOf(['zoom', 'pan', 'both']),
  enableCrossfadeReturn: PropTypes.bool,
  transitionType: PropTypes.oneOf(['cross-dissolve', 'morph-blur', 'push-zoom', 'swirl-fade', 'slide-dissolve']),
  
  // Slideshow configuration
  enableReorder: PropTypes.bool,
  onImagesReorder: PropTypes.func,
  
  // Style props
  width: PropTypes.string,
  height: PropTypes.string,
  borderRadius: PropTypes.string,
  objectFit: PropTypes.string,
  
  // Performance
  enableIntersectionObserver: PropTypes.bool,
  
  // Callbacks
  onImageChange: PropTypes.func,
};

export default KenBurnsImage; 