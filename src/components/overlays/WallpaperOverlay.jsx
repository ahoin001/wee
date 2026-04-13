import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { WALLPAPER_OVERLAY_COLORS } from '../../design/wallpaperAmbientPalettes.js';
import useAnimationActivity from '../../hooks/useAnimationActivity';

const WallpaperOverlay = ({ effect, enabled = false, intensity = 50, speed = 1, wind = 0.02, gravity = 0.1 }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const lastTimeRef = useRef(0);
  const isActiveRef = useRef(false);
  const canvasSizeRef = useRef({ width: 0, height: 0 });
  const { shouldAnimate, isLowPowerMode } = useAnimationActivity({
    activeFps: 60,
    lowPowerFps: 24,
  });

  // Memoize effect configurations to prevent recreation
  const effects = useMemo(() => ({
    snow: {
      particleCount: 80, // Reduced for better performance
      particleSize: { min: 2, max: 6 },
      colors: WALLPAPER_OVERLAY_COLORS.snow,
      shape: 'circle'
    },
    rain: {
      particleCount: 120, // Reduced for better performance
      particleSize: { min: 1, max: 3 },
      colors: WALLPAPER_OVERLAY_COLORS.rain,
      shape: 'line'
    },
    leaves: {
      particleCount: 30, // Reduced for better performance
      particleSize: { min: 8, max: 15 },
      colors: WALLPAPER_OVERLAY_COLORS.leaves,
      shape: 'leaf'
    },
    fireflies: {
      particleCount: 20, // Reduced for better performance
      particleSize: { min: 3, max: 6 },
      colors: WALLPAPER_OVERLAY_COLORS.fireflies,
      shape: 'circle',
      flicker: true
    },
    dust: {
      particleCount: 100, // Reduced for better performance
      particleSize: { min: 1, max: 4 },
      colors: WALLPAPER_OVERLAY_COLORS.dust,
      shape: 'circle'
    },
    fire: {
      particleCount: 50, // Reduced for better performance
      particleSize: { min: 3, max: 12 },
      colors: WALLPAPER_OVERLAY_COLORS.fire,
      shape: 'fire',
      flicker: true,
      upward: true
    }
  }), []);

  // Object pool for particles to reduce garbage collection
  const particlePool = useRef([]);
  const getParticleFromPool = useCallback(() => {
    if (particlePool.current.length > 0) {
      return particlePool.current.pop();
    }
    return {
      x: 0, y: 0, vx: 0, vy: 0, size: 0, color: '', opacity: 0,
      rotation: 0, rotationSpeed: 0, flickerPhase: 0
    };
  }, []);

  const returnParticleToPool = useCallback((particle) => {
    if (particlePool.current.length < 200) { // Limit pool size
      particlePool.current.push(particle);
    }
  }, []);

  // Initialize particles with object pooling
  const initializeParticles = useCallback(() => {
    if (!enabled || !effect || !effects[effect]) {
      // Return existing particles to pool
      particlesRef.current.forEach(returnParticleToPool);
      particlesRef.current = [];
      return;
    }

    const config = effects[effect];
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Return existing particles to pool
    particlesRef.current.forEach(returnParticleToPool);
    particlesRef.current = [];

    const width = canvasSizeRef.current.width || canvas.clientWidth || 0;
    const height = canvasSizeRef.current.height || canvas.clientHeight || 0;
    if (!width || !height) return;
    const newParticles = [];
    const targetParticleCount = isLowPowerMode
      ? Math.max(8, Math.ceil(config.particleCount * 0.6))
      : config.particleCount;

    for (let i = 0; i < targetParticleCount; i++) {
      const particle = getParticleFromPool();
      
      // Reset particle properties
      particle.x = Math.random() * width;
      particle.y = Math.random() * height;
      particle.vx = (Math.random() - 0.5) * 0.5;
      particle.vy = Math.random() * 0.5 + 0.5;
      particle.size = Math.random() * (config.particleSize.max - config.particleSize.min) + config.particleSize.min;
      particle.color = config.colors[Math.floor(Math.random() * config.colors.length)];
      particle.opacity = Math.random() * 0.5 + 0.5;
      particle.rotation = Math.random() * Math.PI * 2;
      particle.rotationSpeed = (Math.random() - 0.5) * 0.02;
      particle.flickerPhase = Math.random() * Math.PI * 2;
      
      newParticles.push(particle);
    }

    particlesRef.current = newParticles;
  }, [enabled, effect, effects, getParticleFromPool, returnParticleToPool, isLowPowerMode]);

  // Optimized animation loop with delta time
  const animate = useCallback((currentTime) => {
    if (!isActiveRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas || !enabled || !effect || !effects[effect]) {
      isActiveRef.current = false;
      return;
    }

    const ctx = canvas.getContext('2d');
    const config = effects[effect];
    const width = canvasSizeRef.current.width || canvas.clientWidth || 0;
    const height = canvasSizeRef.current.height || canvas.clientHeight || 0;
    if (!width || !height) return;

    // Calculate delta time for consistent animation speed
    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;
    
    // Cap delta time to prevent large jumps
    const cappedDeltaTime = Math.min(deltaTime, 50);
    const timeScale = cappedDeltaTime / 16.67; // 60fps = 16.67ms

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Update and draw particles
    const particles = particlesRef.current;
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      
      // Apply physics with delta time scaling
      particle.vy += gravity * timeScale;
      particle.vx += wind * timeScale;
      
      // Cap velocities to prevent infinite acceleration
      particle.vx = Math.max(-2, Math.min(2, particle.vx));
      particle.vy = Math.max(-2, Math.min(2, particle.vy));
      
      // Update position
      particle.x += particle.vx * speed * timeScale;
      particle.y += particle.vy * speed * timeScale;

      // Update rotation
      particle.rotation += particle.rotationSpeed * timeScale;

      // Update flicker
      if (config.flicker) {
        particle.flickerPhase += 0.1 * timeScale;
        particle.opacity = 0.5 + Math.sin(particle.flickerPhase) * 0.3;
      }

      // Wrap around screen
      if (particle.x < -particle.size) particle.x = width + particle.size;
      if (particle.x > width + particle.size) particle.x = -particle.size;
      
      if (config.upward) {
        if (particle.y < -particle.size) {
          particle.y = height + particle.size;
          particle.x = Math.random() * width;
        }
      } else {
        if (particle.y > height + particle.size) {
          particle.y = -particle.size;
          particle.x = Math.random() * width;
        }
      }

      // Draw particle
      ctx.save();
      ctx.globalAlpha = particle.opacity * (intensity / 100);
      ctx.fillStyle = particle.color;
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);

      if (config.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (config.shape === 'line') {
        ctx.fillRect(-particle.size / 2, -particle.size * 2, particle.size, particle.size * 4);
      } else if (config.shape === 'leaf') {
        ctx.beginPath();
        ctx.ellipse(0, 0, particle.size, particle.size / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (config.shape === 'fire') {
        ctx.beginPath();
        ctx.moveTo(0, -particle.size);
        ctx.quadraticCurveTo(particle.size * 0.5, -particle.size * 0.5, particle.size * 0.3, 0);
        ctx.quadraticCurveTo(particle.size * 0.1, particle.size * 0.3, 0, particle.size);
        ctx.quadraticCurveTo(-particle.size * 0.1, particle.size * 0.3, -particle.size * 0.3, 0);
        ctx.quadraticCurveTo(-particle.size * 0.5, -particle.size * 0.5, 0, -particle.size);
        ctx.fill();
      }

      ctx.restore();
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [enabled, effect, effects, intensity, speed, wind, gravity]);

  // Start/stop animation with proper cleanup
  useEffect(() => {
    if (enabled && shouldAnimate && effect && effects[effect]) {
      isActiveRef.current = true;
      lastTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    } else {
      isActiveRef.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }

    return () => {
      isActiveRef.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [enabled, shouldAnimate, effect, animate, effects]);

  // Initialize particles when effect changes
  useEffect(() => {
    initializeParticles();
  }, [initializeParticles]);

  // Optimized canvas resize handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let resizeTimeout;
    const resizeCanvas = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const rect = canvas.getBoundingClientRect();
        const devicePixelRatio = window.devicePixelRatio || 1;
        canvasSizeRef.current = { width: rect.width, height: rect.height };
        
        // Set canvas size accounting for device pixel ratio
        canvas.width = rect.width * devicePixelRatio;
        canvas.height = rect.height * devicePixelRatio;
        
        // Scale context to match device pixel ratio
        const ctx = canvas.getContext('2d');
        ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
        
        // Reinitialize particles after resize
        initializeParticles();
      }, 100); // Debounce resize events
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [initializeParticles]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Clear particle pool
      particlePool.current = [];
    };
  }, []);

  if (!enabled || !effect || !effects[effect]) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000
      }}
    />
  );
};

export default WallpaperOverlay; 