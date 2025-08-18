// Animation optimization utilities for smooth 60fps animations

// Animation frame manager for smooth animations
class AnimationFrameManager {
  constructor() {
    this.animations = new Map();
    this.isRunning = false;
    this.lastTime = 0;
  }

  // Add animation to the manager
  add(id, animation) {
    this.animations.set(id, animation);
    if (!this.isRunning) {
      this.start();
    }
  }

  // Remove animation from the manager
  remove(id) {
    this.animations.delete(id);
    if (this.animations.size === 0) {
      this.stop();
    }
  }

  // Start the animation loop
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate();
  }

  // Stop the animation loop
  stop() {
    this.isRunning = false;
  }

  // Main animation loop
  animate(currentTime = performance.now()) {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Update all animations
    this.animations.forEach((animation, id) => {
      const result = animation(deltaTime, currentTime);
      if (result === false) {
        this.remove(id);
      }
    });

    // Continue animation loop
    if (this.isRunning) {
      requestAnimationFrame((time) => this.animate(time));
    }
  }
}

// Global animation manager
const animationManager = new AnimationFrameManager();

// Easing functions for smooth animations
export const easing = {
  linear: t => t,
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: t => t * t * t,
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInElastic: t => t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * ((2 * Math.PI) / 3)),
  easeOutElastic: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
  easeInOutElastic: t => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) {
      return -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * ((2 * Math.PI) / 4.5))) / 2;
    }
    return (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * ((2 * Math.PI) / 4.5))) / 2 + 1;
  }
};

// Create smooth animation
export const createAnimation = (options = {}) => {
  const {
    duration = 1000,
    easing: easingFn = easing.easeOutCubic,
    onUpdate = () => {},
    onComplete = () => {},
    onCancel = () => {}
  } = options;

  let startTime = null;
  let animationId = null;

  const animate = (deltaTime, currentTime) => {
    if (startTime === null) {
      startTime = currentTime;
    }

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easingFn(progress);

    onUpdate(easedProgress, progress);

    if (progress >= 1) {
      onComplete();
      return false; // Stop animation
    }

    return true; // Continue animation
  };

  const start = () => {
    animationId = `anim_${Date.now()}_${Math.random()}`;
    animationManager.add(animationId, animate);
  };

  const cancel = () => {
    if (animationId) {
      animationManager.remove(animationId);
      onCancel();
    }
  };

  return { start, cancel };
};

// CSS transform animation helper
export const animateTransform = (element, transforms, options = {}) => {
  if (!element) return null;

  const {
    duration = 1000,
    easing: easingFn = easing.easeOutCubic,
    onComplete = () => {}
  } = options;

  const initialTransforms = {};
  const targetTransforms = {};

  // Parse initial and target transforms
  Object.keys(transforms).forEach(key => {
    const currentValue = getComputedStyle(element)[key];
    initialTransforms[key] = parseFloat(currentValue) || 0;
    targetTransforms[key] = transforms[key];
  });

  return createAnimation({
    duration,
    easing: easingFn,
    onUpdate: (easedProgress) => {
      Object.keys(transforms).forEach(key => {
        const initial = initialTransforms[key];
        const target = targetTransforms[key];
        const current = initial + (target - initial) * easedProgress;
        
        element.style[key] = `${current}px`;
      });
    },
    onComplete
  });
};

// Smooth scroll animation
export const smoothScroll = (element, target, options = {}) => {
  const {
    duration = 1000,
    easing: easingFn = easing.easeOutCubic,
    axis = 'both' // 'x', 'y', or 'both'
  } = options;

  const startX = element.scrollLeft;
  const startY = element.scrollTop;
  const targetX = axis === 'y' ? startX : target.x || startX;
  const targetY = axis === 'x' ? startY : target.y || startY;

  return createAnimation({
    duration,
    easing: easingFn,
    onUpdate: (easedProgress) => {
      element.scrollLeft = startX + (targetX - startX) * easedProgress;
      element.scrollTop = startY + (targetY - startY) * easedProgress;
    }
  });
};

// Fade animation
export const fadeAnimation = (element, targetOpacity, options = {}) => {
  const {
    duration = 500,
    easing: easingFn = easing.easeOutCubic,
    onComplete = () => {}
  } = options;

  const startOpacity = parseFloat(getComputedStyle(element).opacity) || 0;

  return createAnimation({
    duration,
    easing: easingFn,
    onUpdate: (easedProgress) => {
      const currentOpacity = startOpacity + (targetOpacity - startOpacity) * easedProgress;
      element.style.opacity = currentOpacity;
    },
    onComplete
  });
};

// Scale animation
export const scaleAnimation = (element, targetScale, options = {}) => {
  const {
    duration = 500,
    easing: easingFn = easing.easeOutCubic,
    onComplete = () => {}
  } = options;

  const startScale = 1; // Assuming starting scale is 1

  return createAnimation({
    duration,
    easing: easingFn,
    onUpdate: (easedProgress) => {
      const currentScale = startScale + (targetScale - startScale) * easedProgress;
      element.style.transform = `scale(${currentScale})`;
    },
    onComplete
  });
};

// Parallax scroll effect
export const createParallaxEffect = (element, speed = 0.5) => {
  let ticking = false;

  const updateParallax = () => {
    const scrolled = window.pageYOffset;
    const rate = scrolled * -speed;
    element.style.transform = `translateY(${rate}px)`;
    ticking = false;
  };

  const requestTick = () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  };

  window.addEventListener('scroll', requestTick, { passive: true });

  // Return cleanup function
  return () => {
    window.removeEventListener('scroll', requestTick);
  };
};

// Stagger animation for multiple elements
export const staggerAnimation = (elements, animationFn, options = {}) => {
  const {
    staggerDelay = 100,
    onComplete = () => {}
  } = options;

  let completedCount = 0;
  const totalElements = elements.length;

  elements.forEach((element, index) => {
    setTimeout(() => {
      const animation = animationFn(element);
      if (animation && animation.onComplete) {
        const originalOnComplete = animation.onComplete;
        animation.onComplete = () => {
          originalOnComplete();
          completedCount++;
          if (completedCount === totalElements) {
            onComplete();
          }
        };
      } else {
        completedCount++;
        if (completedCount === totalElements) {
          onComplete();
        }
      }
    }, index * staggerDelay);
  });
};

// Performance monitoring for animations
export const monitorAnimationPerformance = (animationId, callback) => {
  let frameCount = 0;
  let lastTime = performance.now();
  let fps = 0;

  const monitor = (deltaTime) => {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime >= 1000) {
      fps = frameCount;
      frameCount = 0;
      lastTime = currentTime;
      
      if (callback) {
        callback({ fps, animationId });
      }
    }
  };

  return monitor;
};

// Animation presets
export const animationPresets = {
  fadeIn: (element) => fadeAnimation(element, 1, { duration: 300 }),
  fadeOut: (element) => fadeAnimation(element, 0, { duration: 300 }),
  slideIn: (element, direction = 'left') => {
    const transforms = direction === 'left' ? { transform: 'translateX(0)' } :
                      direction === 'right' ? { transform: 'translateX(0)' } :
                      direction === 'up' ? { transform: 'translateY(0)' } :
                      { transform: 'translateY(0)' };
    
    element.style.transform = direction === 'left' ? 'translateX(-100%)' :
                             direction === 'right' ? 'translateX(100%)' :
                             direction === 'up' ? 'translateY(-100%)' :
                             'translateY(100%)';
    
    return animateTransform(element, transforms, { duration: 400 });
  },
  bounce: (element) => scaleAnimation(element, 1.1, { duration: 200 })
    .then(() => scaleAnimation(element, 1, { duration: 200 }))
};

// Cleanup function
export const cleanupAnimations = () => {
  animationManager.stop();
};

// Default export
export default {
  animationManager,
  easing,
  createAnimation,
  animateTransform,
  smoothScroll,
  fadeAnimation,
  scaleAnimation,
  createParallaxEffect,
  staggerAnimation,
  monitorAnimationPerformance,
  animationPresets,
  cleanupAnimations
};




