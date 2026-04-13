import React, { useEffect, useRef, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import useAnimationActivity from '../../hooks/useAnimationActivity';

const SpotifyImmersiveOverlay = () => {
  const { extractedColors, immersiveMode, isPlaying, progress, duration } = useConsolidatedAppStore(
    useShallow((state) => ({
      extractedColors: state.spotify.extractedColors,
      immersiveMode: state.spotify.immersiveMode,
      isPlaying: state.spotify.isPlaying,
      progress: state.spotify.progress,
      duration: state.spotify.duration,
    }))
  );
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const { shouldAnimate, isLowPowerMode } = useAnimationActivity({
    activeFps: 60,
    lowPowerFps: 24,
  });
  
  // Extract colors and settings
  const safeProgress = progress || 0;
  const safeDuration = duration || 1;

  // Helper function to extract RGB values from color strings
  const extractRgbValues = (colorStr) => {
    if (!colorStr) return { r: 0, g: 153, b: 255 }; // Default blue
    
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return { r: parseInt(match[1], 10), g: parseInt(match[2], 10), b: parseInt(match[3], 10) };
    }
    
    if (colorStr.startsWith('#')) {
      const r = parseInt(colorStr.slice(1, 3), 16);
      const g = parseInt(colorStr.slice(3, 5), 16);
      const b = parseInt(colorStr.slice(5, 7), 16);
      return { r, g, b };
    }
    
    return { r: 0, g: 153, b: 255 }; // Default blue
  };
  
  // Calculate beat timing for pulse effects
  const beatProgress = useMemo(() => {
    if (!isPlaying || !safeDuration) return 0;
    const trackProgress = safeProgress / safeDuration;
    // Create pulsing effect based on track progress
    return Math.sin(trackProgress * Math.PI * 8) * 0.5 + 0.5;
  }, [isPlaying, safeProgress, safeDuration]);

  // Generate immersive overlay styles
  const overlayStyles = useMemo(() => {
    if (!immersiveMode.enabled || !extractedColors) {
      return {
        wallpaperOverlay: null,
        ambientLighting: null,
        pulseEffect: null
      };
    }

    const { primary, secondary, accent } = extractedColors;
    const { overlayIntensity, ambientIntensity, pulseIntensity } = immersiveMode;

    // Wallpaper overlay gradient
    const wallpaperOverlay = immersiveMode.wallpaperOverlay ? (() => {
      const primaryRgb = extractRgbValues(primary);
      const secondaryRgb = extractRgbValues(secondary);
      const accentRgb = extractRgbValues(accent);
      
      return {
        background: `linear-gradient(135deg, 
          rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, ${overlayIntensity}) 0%, 
          rgba(${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}, ${overlayIntensity * 0.7}) 50%, 
          rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${overlayIntensity * 0.3}) 100%)`,
        mixBlendMode: 'overlay'
      };
    })() : null;

    // Ambient lighting filter
    const ambientLighting = immersiveMode.ambientLighting ? {
      filter: `hue-rotate(${Math.sin(Date.now() * 0.001) * 10}deg) saturate(${1 + ambientIntensity}) brightness(${1 + ambientIntensity * 0.1})`
    } : null;

    // Pulse effect
    const pulseEffect = immersiveMode.pulseEffects ? (() => {
      const accentRgb = extractRgbValues(accent);
      return {
        boxShadow: `0 0 ${20 + beatProgress * 30}px rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${pulseIntensity * beatProgress})`,
        transform: `scale(${1 + beatProgress * 0.02})`
      };
    })() : null;

    return {
      wallpaperOverlay,
      ambientLighting,
      pulseEffect
    };
  }, [immersiveMode, extractedColors, beatProgress]);

  // Particle system for ambient effects
  useEffect(() => {
    if (!immersiveMode.enabled || !extractedColors || !canvasRef.current || !shouldAnimate) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle class for ambient effects
    class AmbientParticle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 3 + 1;
        this.opacity = Math.random() * 0.3 + 0.1;
        this.color = (() => {
          const accentRgb = extractRgbValues(extractedColors.accent);
          return `rgb(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b})`;
        })();
        this.life = Math.random() * 100 + 50;
        this.maxLife = this.life;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        
        // Wrap around screen
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
        
        // React to music
        if (isPlaying) {
          this.size += Math.sin(Date.now() * 0.01) * 0.1;
          this.opacity += Math.sin(Date.now() * 0.005) * 0.05;
        }
        
        this.opacity = Math.max(0.05, Math.min(0.4, this.opacity));
        this.size = Math.max(0.5, Math.min(4, this.size));
      }

      draw() {
        if (this.life <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.opacity * (this.life / this.maxLife);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Initialize particles
    if (particlesRef.current.length === 0) {
      const particleCount = isLowPowerMode ? 24 : 50;
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push(new AmbientParticle());
      }
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particlesRef.current.forEach(particle => {
        particle.update();
        particle.draw();
      });
      
      // Remove dead particles and add new ones
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      const targetParticleCount = isLowPowerMode ? 24 : 50;
      while (particlesRef.current.length < targetParticleCount) {
        particlesRef.current.push(new AmbientParticle());
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [immersiveMode.enabled, extractedColors, isPlaying, shouldAnimate, isLowPowerMode]);

  // Don't render if immersive mode is disabled
  if (!immersiveMode.enabled || !extractedColors) {
    return null;
  }

  return (
    <>
      {/* Wallpaper Overlay */}
      {overlayStyles.wallpaperOverlay && (
        <div
          className="spotify-wallpaper-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 2,
            ...overlayStyles.wallpaperOverlay
          }}
        />
      )}
      
      {/* Ambient Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="spotify-ambient-particles"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 3,
          ...overlayStyles.ambientLighting
        }}
      />
      
      {/* Pulse Effect Overlay */}
      {overlayStyles.pulseEffect && (
        <div
          className="spotify-pulse-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 2,
            transition: 'all 0.1s ease-out',
            ...overlayStyles.pulseEffect
          }}
        />
      )}
    </>
  );
};

export default SpotifyImmersiveOverlay;
