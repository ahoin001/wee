import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import './KenBurnsImage.css';

// Predefined pan directions for variety
const PAN_DIRECTIONS = [
  { name: 'topLeft', from: { x: 0, y: 0 }, to: { x: -10, y: -10 } },
  { name: 'topRight', from: { x: -10, y: 0 }, to: { x: 0, y: -10 } },
  { name: 'bottomLeft', from: { x: 0, y: -10 }, to: { x: -10, y: 0 } },
  { name: 'bottomRight', from: { x: -10, y: -10 }, to: { x: 0, y: 0 } },
  { name: 'centerOut', from: { x: -5, y: -5 }, to: { x: -5, y: -5 } }, // Pure zoom
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
  slideshowDuration = 10000, // 10s per image in slideshow
  crossfadeDuration = 1000, // 1s crossfade between images
  
  // Animation configuration
  hoverScale = 1.1,
  autoplayScale = 1.15,
  slideshowScale = 1.2,
  
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
  const containerRef = useRef(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [currentPanDirection, setCurrentPanDirection] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef(null);
  const intersectionObserverRef = useRef(null);

  // Get the current image source
  const currentImageSrc = useMemo(() => {
    if (mode === 'slideshow' && images.length > 0) {
      return images[currentImageIndex];
    }
    return src || (images.length > 0 ? images[0] : null);
  }, [src, images, currentImageIndex, mode]);

  // Get current scale based on mode
  const getCurrentScale = useCallback(() => {
    switch (mode) {
      case 'hover':
        return hoverScale;
      case 'autoplay':
        return autoplayScale;
      case 'slideshow':
        return slideshowScale;
      default:
        return hoverScale;
    }
  }, [mode, hoverScale, autoplayScale, slideshowScale]);

  // Get current duration based on mode
  const getCurrentDuration = useCallback(() => {
    switch (mode) {
      case 'hover':
        return hoverDuration;
      case 'autoplay':
        return autoplayDuration;
      case 'slideshow':
        return slideshowDuration;
      default:
        return hoverDuration;
    }
  }, [mode, hoverDuration, autoplayDuration, slideshowDuration]);

  // Setup intersection observer for performance
  useEffect(() => {
    if (!enableIntersectionObserver || !containerRef.current) return;

    intersectionObserverRef.current = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    intersectionObserverRef.current.observe(containerRef.current);

    return () => {
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, [enableIntersectionObserver]);

  // Handle autoplay animation cycle
  const startAutoplayAnimation = useCallback(() => {
    if (!isVisible || mode !== 'autoplay') return;

    setIsAnimating(true);
    
    // Clear any existing timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    // Start animation
    animationTimeoutRef.current = setTimeout(() => {
      // Animation complete, prepare for next cycle
      setIsAnimating(false);
      
      // Change pan direction for next cycle
      setCurrentPanDirection(prev => (prev + 1) % PAN_DIRECTIONS.length);
      
      // Start next cycle after crossfade
      setTimeout(() => {
        startAutoplayAnimation();
      }, crossfadeDuration);
      
    }, getCurrentDuration());
  }, [isVisible, mode, getCurrentDuration, crossfadeDuration]);

  // Handle slideshow progression
  const progressSlideshow = useCallback(() => {
    if (!isVisible || mode !== 'slideshow' || images.length <= 1) return;

    setIsAnimating(true);

    // Clear any existing timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    // Start animation
    animationTimeoutRef.current = setTimeout(() => {
      // Animation complete, move to next image
      const nextIndex = (currentImageIndex + 1) % images.length;
      setCurrentImageIndex(nextIndex);
      setCurrentPanDirection(Math.floor(Math.random() * PAN_DIRECTIONS.length));
      
      // Notify parent of image change
      if (onImageChange) {
        onImageChange(nextIndex, images[nextIndex]);
      }
      
      // Start next image animation after crossfade
      setTimeout(() => {
        progressSlideshow();
      }, crossfadeDuration);
      
    }, getCurrentDuration());
  }, [isVisible, mode, images, currentImageIndex, getCurrentDuration, crossfadeDuration, onImageChange]);

  // Start autoplay or slideshow when component mounts or mode changes
  useEffect(() => {
    if (mode === 'autoplay') {
      startAutoplayAnimation();
    } else if (mode === 'slideshow' && images.length > 1) {
      progressSlideshow();
    }

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [mode, startAutoplayAnimation, progressSlideshow]);

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

  // Generate CSS custom properties for animation
  const getCSSVariables = () => {
    const scale = getCurrentScale();
    const duration = getCurrentDuration();
    
    return {
      '--ken-burns-scale': scale,
      '--ken-burns-duration': `${duration}ms`,
      '--ken-burns-crossfade-duration': `${crossfadeDuration}ms`,
      '--ken-burns-from-x': `${currentPan.from.x}%`,
      '--ken-burns-from-y': `${currentPan.from.y}%`,
      '--ken-burns-to-x': `${currentPan.to.x}%`,
      '--ken-burns-to-y': `${currentPan.to.y}%`,
    };
  };

  // Generate className based on current state
  const getClassName = () => {
    const classes = ['ken-burns-container'];
    
    if (mode === 'hover') {
      classes.push('ken-burns-hover-mode');
      if (isHovered) classes.push('ken-burns-active');
    } else if (mode === 'autoplay') {
      classes.push('ken-burns-autoplay-mode');
      if (isAnimating) classes.push('ken-burns-active');
    } else if (mode === 'slideshow') {
      classes.push('ken-burns-slideshow-mode');
      if (isAnimating) classes.push('ken-burns-active');
    }
    
    if (!isVisible) classes.push('ken-burns-paused');
    
    return classes.join(' ');
  };

  if (!currentImageSrc) {
    return (
      <div 
        ref={containerRef}
        className="ken-burns-container ken-burns-placeholder"
        style={{ width, height, borderRadius }}
        {...props}
      >
        <div className="ken-burns-no-image">No Image</div>
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
      <img
        src={currentImageSrc}
        alt={alt}
        className="ken-burns-image"
        style={{
          objectFit,
        }}
        loading="lazy"
        draggable={false}
      />
      
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