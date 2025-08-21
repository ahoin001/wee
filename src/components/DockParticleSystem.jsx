import React, { useEffect, useRef, useCallback, useMemo } from 'react';

// Particle effect types
const PARTICLE_TYPES = {
  NORMAL: 'normal',
  STARS: 'stars',
  PAWS: 'paws',
  WATER_DROPS: 'waterDrops',
  SPARKLES: 'sparkles',
  MAGIC: 'magic',
  FIREFLIES: 'fireflies',
  DUST: 'dust',
  CLIP_PATH: 'clip-path',
  ENERGY: 'energy',
  MAGIC_SPARKLES: 'magic'
};

// Color palettes for different effects
const COLOR_PALETTES = {
  normal: ['#87cefa', '#ffffff', '#ff0081', '#20c997'],
  stars: ['#ffcc00', '#fffacd', '#ffd700'],
  paws: ['#ff69b4', '#ffffff'],
  waterDrops: ['#e0ffff', '#b0e0e6', '#add8e6'],
  sparkles: ['#ffffff', '#ffd700', '#ff69b4', '#00ff00'],
  magic: ['#ff0081', '#00ffff', '#ff69b4', '#ffff00', '#00ff00'],
  fireflies: ['#ffff00', '#ffd700', '#ffed4e', '#fffacd'],
  dust: ['#f5f5dc', '#d2b48c', '#deb887', '#f4a460'],
  'clip-path': ['#00ffff', '#ff0081', '#ffff00', '#00ff00'],
  energy: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'],
  'magic-sparkles': ['#ff0081', '#00ffff', '#ffff00', '#ff69b4']
};

// Helper function to convert hex color to RGB array
const hexToRgb = (hexColor) => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return [r, g, b];
};

// Helper function to adjust color intensity
const adjustColorIntensity = (color, intensity) => {
  const rgb = hexToRgb(color);
  const adjusted = rgb.map(function(c) {
    return Math.min(255, Math.max(0, Math.round(c * intensity)));
  });
  const hexValues = adjusted.map(function(c) {
    return c.toString(16).padStart(2, '0');
  });
  return `#${hexValues.join('')}`;
};

// Helper function to create color variations
const createColorVariations = (baseColor, variation) => {
  const rgb = hexToRgb(baseColor);
  const variations = [];
  
  for (let i = 0; i < 4; i++) {
    const variationFactor = 1 + (Math.random() - 0.5) * variation * 2;
    const adjusted = rgb.map(function(c) {
      return Math.min(255, Math.max(0, Math.round(c * variationFactor)));
    });
    const hexValues = adjusted.map(function(c) {
      return c.toString(16).padStart(2, '0');
    });
    variations.push(`#${hexValues.join('')}`);
  }
  
  return variations;
};

// Base particle class
class Particle {
  constructor(x, y, speedX, speedY, type = 'normal', settings = {}) {
    this.x = x;
    this.y = y;
    this.speedX = speedX;
    this.speedY = speedY;
    this.type = type;
    this.size = settings.size || (Math.random() * 3 + 2);
    this.opacity = 1;
    this.baseColor = this.getRandomColor(settings);
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * (settings.rotationSpeed || 0.05);
    this.gravity = settings.gravity || 0.02;
    this.fadeSpeed = settings.fadeSpeed || 0.008;
    this.sizeDecay = settings.sizeDecay || 0.02;
    this.settings = settings;
  }

  getRandomColor(settings = {}) {
    let palette;
    
    // Use custom colors if provided
    if (settings.customColors && settings.customColors.length > 0) {
      palette = settings.customColors;
    } else {
      // Use adaptive color if enabled
      if (settings.useAdaptiveColor && settings.ribbonGlowColor) {
        const baseColor = settings.ribbonGlowColor;
        const intensity = settings.colorIntensity || 1.0;
        const variation = settings.colorVariation || 0.3;
        
        // Validate baseColor is a valid hex color
        if (baseColor && typeof baseColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(baseColor)) {
          const adjustedColor = adjustColorIntensity(baseColor, intensity);
          palette = createColorVariations(adjustedColor, variation);
        } else {
          // Fallback to default palette if invalid color
          palette = COLOR_PALETTES[this.type] || COLOR_PALETTES.normal;
        }
      } else {
        // Use default palette for this effect type
        palette = COLOR_PALETTES[this.type] || COLOR_PALETTES.normal;
      }
    }
    
    // Ensure we always return a valid hex color
    const selectedColor = palette[Math.floor(Math.random() * palette.length)];
    return selectedColor && typeof selectedColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(selectedColor) 
      ? selectedColor 
      : '#0099ff'; // Default fallback
  }

  hexToRgbString(hex) {
    // Validate hex color format
    if (!hex || typeof hex !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      // Return default blue color if invalid
      return '0, 153, 255';
    }
    
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    // Check for NaN values and return default if any
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      return '0, 153, 255';
    }
    
    return `${r}, ${g}, ${b}`;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.speedY -= this.gravity; // Apply gravity
    this.size -= this.sizeDecay;
    this.opacity -= this.fadeSpeed;
    this.rotation += this.rotationSpeed;
  }

  draw(ctx) {
    if (this.size <= 0 || this.opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    const rgb = this.hexToRgbString(this.baseColor);
    ctx.fillStyle = `rgba(${rgb}, ${this.opacity})`;

    switch (this.type) {
      case 'stars':
        this.drawStar(ctx);
        break;
      case 'paws':
        this.drawPaw(ctx);
        break;
      case 'waterDrops':
        this.drawWaterDrop(ctx);
        break;
      case 'sparkles':
        this.drawSparkle(ctx);
        break;
      case 'magic':
        this.drawMagic(ctx);
        break;
      case 'fireflies':
        this.drawFirefly(ctx);
        break;
      case 'dust':
        this.drawDust(ctx);
        break;
      case 'clip-path':
        this.drawClipPath(ctx);
        break;
      case 'energy':
        this.drawEnergy(ctx);
        break;
      default:
        this.drawCircle(ctx);
    }

    ctx.restore();
  }

  drawCircle(ctx) {
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  drawStar(ctx) {
    const spikes = 5;
    const outerRadius = this.size * 2;
    const innerRadius = this.size;
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;
    
    ctx.beginPath();
    ctx.moveTo(0, -outerRadius);
    for (let i = 0; i < spikes; i++) {
      const x = Math.cos(rot) * outerRadius;
      const y = Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;
      
      const x2 = Math.cos(rot) * innerRadius;
      const y2 = Math.sin(rot) * innerRadius;
      ctx.lineTo(x2, y2);
      rot += step;
    }
    ctx.closePath();
    ctx.fill();
  }

  drawPaw(ctx) {
    const toeSize = this.size / 2;
    const mainPadSize = this.size;

    // Main pad
    ctx.beginPath();
    ctx.arc(0, 0, mainPadSize, 0, Math.PI * 2);
    ctx.fill();

    // Toes
    ctx.beginPath();
    ctx.arc(-mainPadSize * 0.7, -mainPadSize * 0.7, toeSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, -mainPadSize * 0.9, toeSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(mainPadSize * 0.7, -mainPadSize * 0.7, toeSize, 0, Math.PI * 2);
    ctx.fill();
  }

  drawWaterDrop(ctx) {
    ctx.beginPath();
    ctx.arc(0, this.size / 2, this.size, 0, Math.PI * 2);
    ctx.moveTo(0, this.size / 2);
    ctx.lineTo(this.size, -this.size);
    ctx.lineTo(-this.size, -this.size);
    ctx.closePath();
    ctx.fill();
  }

  drawSparkle(ctx) {
    const lines = 4;
    const length = this.size * 2;
    
    for (let i = 0; i < lines; i++) {
      const angle = (i / lines) * Math.PI * 2;
      const x1 = Math.cos(angle) * this.size;
      const y1 = Math.sin(angle) * this.size;
      const x2 = Math.cos(angle) * length;
      const y2 = Math.sin(angle) * length;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `rgba(${this.hexToRgbString(this.baseColor)}, ${this.opacity})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  drawMagic(ctx) {
    // Draw a magical swirl
    const arms = 3;
    const length = this.size * 3;
    
    for (let i = 0; i < arms; i++) {
      const angle = (i / arms) * Math.PI * 2 + this.rotation;
      const x = Math.cos(angle) * length;
      const y = Math.sin(angle) * length;
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(x, y);
      ctx.strokeStyle = `rgba(${this.hexToRgbString(this.baseColor)}, ${this.opacity})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  drawFirefly(ctx) {
    // Draw a firefly with pulsing glow
    const glowIntensity = (Math.sin(this.rotation * 4) + 1) / 2;
    const glowSize = this.size * (1 + glowIntensity * 0.5);
    
    // Outer glow
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
    gradient.addColorStop(0, `rgba(${this.hexToRgbString(this.baseColor)}, ${this.opacity * 0.8})`);
    gradient.addColorStop(0.5, `rgba(${this.hexToRgbString(this.baseColor)}, ${this.opacity * 0.3})`);
    gradient.addColorStop(1, `rgba(${this.hexToRgbString(this.baseColor)}, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner core
    ctx.fillStyle = `rgba(${this.hexToRgbString(this.baseColor)}, ${this.opacity})`;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  drawDust(ctx) {
    // Draw floating dust particles
    const particleCount = 3;
    const spread = this.size * 2;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + this.rotation;
      const distance = Math.random() * spread;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const particleSize = this.size * 0.3;
      
      ctx.fillStyle = `rgba(${this.hexToRgbString(this.baseColor)}, ${this.opacity * 0.6})`;
      ctx.beginPath();
      ctx.arc(x, y, particleSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawClipPath(ctx) {
    // Draw particles that follow the dock's clip path shape
    const time = Date.now() * 0.001;
    const waveIntensity = Math.sin(time + this.rotation) * 0.3;
    
    // Create a wave-like effect that follows the dock's curved shape
    const segments = 8;
    const amplitude = this.size * (1 + waveIntensity);
    
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2 + this.rotation;
      const radius = this.size + Math.sin(angle * 3 + time) * amplitude * 0.5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    
    // Add inner glow
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
    gradient.addColorStop(0, `rgba(${this.hexToRgbString(this.baseColor)}, ${this.opacity * 0.8})`);
    gradient.addColorStop(1, `rgba(${this.hexToRgbString(this.baseColor)}, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  drawEnergy(ctx) {
    // Draw energy orbs with pulsing effect
    const time = Date.now() * 0.001;
    const pulseIntensity = (Math.sin(time * 3 + this.rotation) + 1) / 2;
    const pulseSize = this.size * (1 + pulseIntensity * 0.5);
    
    // Outer energy field
    const outerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, pulseSize * 2);
    outerGradient.addColorStop(0, `rgba(${this.hexToRgbString(this.baseColor)}, ${this.opacity * 0.3})`);
    outerGradient.addColorStop(0.5, `rgba(${this.hexToRgbString(this.baseColor)}, ${this.opacity * 0.1})`);
    outerGradient.addColorStop(1, `rgba(${this.hexToRgbString(this.baseColor)}, 0)`);
    
    ctx.fillStyle = outerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, pulseSize * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner core
    const innerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, pulseSize);
    innerGradient.addColorStop(0, `rgba(${this.hexToRgbString(this.baseColor)}, ${this.opacity})`);
    innerGradient.addColorStop(0.7, `rgba(${this.hexToRgbString(this.baseColor)}, ${this.opacity * 0.6})`);
    innerGradient.addColorStop(1, `rgba(${this.hexToRgbString(this.baseColor)}, 0)`);
    
    ctx.fillStyle = innerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Energy particles orbiting around
    const orbitCount = 4;
    for (let i = 0; i < orbitCount; i++) {
      const orbitAngle = (i / orbitCount) * Math.PI * 2 + time * 2;
      const orbitRadius = pulseSize * 0.8;
      const orbitX = Math.cos(orbitAngle) * orbitRadius;
      const orbitY = Math.sin(orbitAngle) * orbitRadius;
      const orbitSize = this.size * 0.3;
      
      ctx.fillStyle = `rgba(${this.hexToRgbString(this.baseColor)}, ${this.opacity * 0.8})`;
      ctx.beginPath();
      ctx.arc(orbitX, orbitY, orbitSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  isDead() {
    return this.size <= 0 || this.opacity <= 0;
  }
}

const DockParticleSystem = React.memo(({ 
  enabled = false,
  effectType = 'normal',
  direction = 'upward',
  speed = 2,
  particleCount = 3,
  spawnRate = 60, // particles per second
  settings = {},
  ribbonGlowColor = '#0099ff'
}) => {
  // Performance optimization: Memoize settings to prevent unnecessary re-renders
  const memoizedSettings = useMemo(() => ({
    size: settings.size || 3,
    gravity: settings.gravity || 0.02,
    fadeSpeed: settings.fadeSpeed || 0.008,
    sizeDecay: settings.sizeDecay || 0.02,
    useAdaptiveColor: settings.useAdaptiveColor || false,
    customColors: settings.customColors || [],
    colorIntensity: settings.colorIntensity || 1.0,
    colorVariation: settings.colorVariation || 0.3,
    rotationSpeed: settings.rotationSpeed || 0.05,
    particleLifetime: settings.particleLifetime || 3.0,
    ribbonGlowColor
  }), [settings, ribbonGlowColor]);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const lastSpawnTimeRef = useRef(0);
  const particlePoolRef = useRef([]);



  // Get dock position and dimensions with error handling
  const getDockPosition = useCallback(() => {
    try {
      // Since the particle system is rendered inside the dock container,
      // we can use the canvas dimensions directly
      const canvas = canvasRef.current;
      if (!canvas) return null;
      
      const canvasRect = canvas.getBoundingClientRect();
      
      return {
        x: canvasRect.width / 2, // Center of the canvas
        y: canvasRect.height,    // Bottom of the canvas
        width: canvasRect.width,
        height: canvasRect.height
      };
    } catch (error) {
      return null;
    }
  }, []);

  // Particle pool management for better performance
  const getParticleFromPool = useCallback(() => {
    if (particlePoolRef.current.length > 0) {
      return particlePoolRef.current.pop();
    }
    return null;
  }, []);

  const returnParticleToPool = useCallback((particle) => {
    if (particlePoolRef.current.length < 50) { // Limit pool size
      particlePoolRef.current.push(particle);
    }
  }, []);

  // Create new particles
  const createParticles = useCallback(() => {
    if (!enabled) return;
    
    const dockPos = getDockPosition();
    if (!dockPos) {
      return;
    }

    const now = Date.now();
    const spawnInterval = 1000 / spawnRate;
    
    if (now - lastSpawnTimeRef.current < spawnInterval) return;
    lastSpawnTimeRef.current = now;

    for (let i = 0; i < particleCount; i++) {
      let x, y, speedX, speedY;

      if (direction === 'upward') {
        // Spawn from bottom of dock, move upward
        x = dockPos.x + (Math.random() - 0.5) * dockPos.width * 0.6;
        y = dockPos.y - 10; // Slightly above bottom edge
        const angle = Math.PI + (Math.random() - 0.5) * Math.PI / 3; // Upward with variation
        const particleSpeed = Math.random() * speed + 0.5;
        speedX = Math.cos(angle) * particleSpeed * 0.2; // Less horizontal movement
        speedY = Math.sin(angle) * particleSpeed;
      } else if (direction === 'all') {
        // Spawn from center, move in all directions
        x = dockPos.x + (Math.random() - 0.5) * dockPos.width * 0.4;
        y = dockPos.y + (Math.random() - 0.5) * dockPos.height * 0.4;
        const angle = Math.random() * Math.PI * 2;
        const particleSpeed = Math.random() * speed + 0.5;
        speedX = Math.cos(angle) * particleSpeed;
        speedY = Math.sin(angle) * particleSpeed;
      } else {
        // Default upward
        x = dockPos.x + (Math.random() - 0.5) * dockPos.width * 0.6;
        y = dockPos.y - 10;
        const angle = Math.PI + (Math.random() - 0.5) * Math.PI / 3;
        const particleSpeed = Math.random() * speed + 0.5;
        speedX = Math.cos(angle) * particleSpeed * 0.2;
        speedY = Math.sin(angle) * particleSpeed;
      }

      // Try to get particle from pool, create new one if pool is empty
      let particle = getParticleFromPool();
      if (particle) {
        // Reuse particle from pool
        particle.x = x;
        particle.y = y;
        particle.speedX = speedX;
        particle.speedY = speedY;
        particle.type = effectType;
        particle.size = memoizedSettings.size || (Math.random() * 3 + 2);
        particle.opacity = 1;
        particle.settings = memoizedSettings;
        particle.baseColor = particle.getRandomColor(particle.settings);
        particle.rotation = Math.random() * Math.PI * 2;
        particle.rotationSpeed = (Math.random() - 0.5) * (memoizedSettings.rotationSpeed || 0.05);
        particle.gravity = memoizedSettings.gravity || 0.02;
        particle.fadeSpeed = memoizedSettings.fadeSpeed || 0.008;
        particle.sizeDecay = memoizedSettings.sizeDecay || 0.02;
      } else {
        // Create new particle
        particle = new Particle(x, y, speedX, speedY, effectType, memoizedSettings);
      }
      particlesRef.current.push(particle);
      

    }
    

      }, [enabled, direction, speed, particleCount, spawnRate, effectType, memoizedSettings, getDockPosition, getParticleFromPool]);

  // Animation loop
  const animate = useCallback(() => {
    if (!enabled || !canvasRef.current) {
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    const canvas = canvasRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Debug: Draw a test rectangle to see if canvas is working
    if (process.env.NODE_ENV === 'development' && particlesRef.current.length === 0) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.fillRect(10, 10, 20, 20);
    }

    // Create new particles
    createParticles();

    // Update and draw particles with performance optimization
    const particles = particlesRef.current;
    let drawnParticles = 0;
    
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      particle.update();
      
      if (particle.isDead()) {
        returnParticleToPool(particle);
        particles.splice(i, 1);
      } else {
        particle.draw(ctx);
        drawnParticles++;
      }
    }
    


    // Limit particle count for performance based on device capabilities
    const maxParticles = navigator.hardwareConcurrency ? Math.min(200, navigator.hardwareConcurrency * 10) : 150;
    if (particles.length > maxParticles) {
      particles.splice(0, particles.length - maxParticles);
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [enabled, createParticles, returnParticleToPool]);

  // Handle canvas resize
  const resizeCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const container = canvas.parentElement;
    
    if (container) {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height || 200; // Fallback height if container has no height
      

    }
  }, []);

  // Effect hooks
  useEffect(() => {
    
    if (!enabled) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      particlesRef.current = [];
      return;
    }

    resizeCanvas();
    animate();

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [enabled, animate, resizeCanvas]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="dock-particle-system"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 5
        }}
      />
      {/* Debug info in development */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '5px',
          fontSize: '12px',
          zIndex: 10,
          pointerEvents: 'none'
        }}>
          Particles: {particlesRef.current.length}
        </div>
      )} */}
    </>
  );
});

DockParticleSystem.displayName = 'DockParticleSystem';

export default DockParticleSystem;
export { PARTICLE_TYPES }; 