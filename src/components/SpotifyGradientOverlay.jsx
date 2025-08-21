import React, { useEffect, useRef, useMemo } from 'react';
import { useSpotifyState } from '../utils/useConsolidatedAppHooks';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';

const SpotifyGradientOverlay = () => {
  const { spotify } = useSpotifyState();
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  
  // Extract colors and settings
  const extractedColors = spotify.extractedColors;
  const immersiveMode = spotify.immersiveMode;
  const isPlaying = spotify.isPlaying;

  // Helper function to extract RGB values from color strings
  const extractRgbValues = (colorStr) => {
    if (!colorStr) return { r: 0, g: 153, b: 255 }; // Default blue
    
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
    }
    
    if (colorStr.startsWith('#')) {
      const r = parseInt(colorStr.slice(1, 3), 16);
      const g = parseInt(colorStr.slice(3, 5), 16);
      const b = parseInt(colorStr.slice(5, 7), 16);
      return { r, g, b };
    }
    
    return { r: 0, g: 153, b: 255 }; // Default blue
  };

  // Create gradient overlay
  const createGradientOverlay = useMemo(() => {
    if (!immersiveMode.liveGradientWallpaper || !immersiveMode.overlayMode || !extractedColors) {
      return null;
    }

    const { primary, secondary, accent } = extractedColors;
    const primaryRgb = extractRgbValues(primary);
    const secondaryRgb = extractRgbValues(secondary);
    const accentRgb = extractRgbValues(accent);

    // Get simplified gradient settings
    const {
      intensity = 0.7,
      animationLevel = 2,
      style = 'radial'
    } = immersiveMode;

    // Simplified animation timing
    const animationSpeed = animationLevel * 0.3;
    const time = isPlaying ? Date.now() * 0.0005 * animationSpeed : 0;

    // Create canvas for gradient generation
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.screen.width;
    canvas.height = window.screen.height;

    // Apply color enhancement based on intensity setting
    const vibrancy = 0.8 + (intensity * 0.4);
    const enhancedPrimaryRgb = {
      r: Math.min(255, Math.round(primaryRgb.r * vibrancy)),
      g: Math.min(255, Math.round(primaryRgb.g * vibrancy)),
      b: Math.min(255, Math.round(primaryRgb.b * vibrancy))
    };
    
    const enhancedSecondaryRgb = {
      r: Math.min(255, Math.round(secondaryRgb.r * vibrancy)),
      g: Math.min(255, Math.round(secondaryRgb.g * vibrancy)),
      b: Math.min(255, Math.round(secondaryRgb.b * vibrancy))
    };
    
    const enhancedAccentRgb = {
      r: Math.min(255, Math.round(accentRgb.r * vibrancy)),
      g: Math.min(255, Math.round(accentRgb.g * vibrancy)),
      b: Math.min(255, Math.round(accentRgb.b * vibrancy))
    };

    // Generate optimized gradient based on simplified settings
    console.log('[SpotifyGradientOverlay] Creating overlay gradient:', { intensity, animationLevel, style });
    
    // Start with transparent background for overlay
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create gradient based on style
    let gradient;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    if (style === 'radial') {
      // Animated radial gradient
      const offsetX = animationLevel > 0 ? Math.sin(time) * 100 : 0;
      const offsetY = animationLevel > 0 ? Math.cos(time * 0.7) * 80 : 0;
      const radius = Math.max(canvas.width, canvas.height) * 0.8;
      
      gradient = ctx.createRadialGradient(
        centerX + offsetX, centerY + offsetY, 0,
        centerX + offsetX, centerY + offsetY, radius
      );
    } else if (style === 'linear') {
      // Animated linear gradient
      const angle = animationLevel > 0 ? time * 20 : 45;
      const rad = (angle * Math.PI) / 180;
      const x1 = centerX + Math.cos(rad) * canvas.width * 0.5;
      const y1 = centerY + Math.sin(rad) * canvas.height * 0.5;
      const x2 = centerX - Math.cos(rad) * canvas.width * 0.5;
      const y2 = centerY - Math.sin(rad) * canvas.height * 0.5;
      
      gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    } else if (style === 'waves') {
      // Create wave-like gradient with animated positioning
      const waveOffset = animationLevel > 0 ? Math.sin(time * 2) * 200 : 0;
      gradient = ctx.createLinearGradient(0, centerY + waveOffset, canvas.width, centerY - waveOffset);
    }
    
    // Apply gradient colors with intensity
    const alpha = intensity;
    gradient.addColorStop(0, `rgba(${enhancedPrimaryRgb.r}, ${enhancedPrimaryRgb.g}, ${enhancedPrimaryRgb.b}, ${alpha})`);
    gradient.addColorStop(0.5, `rgba(${enhancedSecondaryRgb.r}, ${enhancedSecondaryRgb.g}, ${enhancedSecondaryRgb.b}, ${alpha * 0.8})`);
    gradient.addColorStop(1, `rgba(${enhancedAccentRgb.r}, ${enhancedAccentRgb.g}, ${enhancedAccentRgb.b}, ${alpha * 0.6})`);
    
    // Apply gradient with screen blend mode for overlay effect
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle animation effects based on level
    if (animationLevel >= 2 && isPlaying) {
      // Add pulse effect
      const pulseAlpha = Math.max(0.1, 0.2 + Math.sin(time * 6) * 0.15);
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(${enhancedAccentRgb.r}, ${enhancedAccentRgb.g}, ${enhancedAccentRgb.b}, ${pulseAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    if (animationLevel >= 3) {
      // Add floating particles (reduced number for performance)
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 20; i++) {
        const particleTime = time + i * 0.2;
        const x = centerX + Math.sin(particleTime * 0.5 + i) * canvas.width * 0.3;
        const y = centerY + Math.cos(particleTime * 0.3 + i) * canvas.height * 0.3;
        const size = Math.max(1, 3 + Math.sin(particleTime + i) * 2);
        const alpha = Math.max(0.2, 0.4 + Math.sin(particleTime * 2 + i) * 0.3);
        
        const particleColor = i % 3 === 0 ? enhancedPrimaryRgb : i % 3 === 1 ? enhancedSecondaryRgb : enhancedAccentRgb;
        
        if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${particleColor.r}, ${particleColor.g}, ${particleColor.b}, ${alpha})`;
          ctx.fill();
        }
      }
    }
    
    return canvas;
  }, [immersiveMode.liveGradientWallpaper, immersiveMode.overlayMode, extractedColors, immersiveMode.intensity, immersiveMode.animationLevel, immersiveMode.style, isPlaying]);

  // Animation loop for overlay
  useEffect(() => {
    if (!immersiveMode.liveGradientWallpaper || !immersiveMode.overlayMode || !createGradientOverlay) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.screen.width;
    canvas.height = window.screen.height;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw the gradient overlay
      if (createGradientOverlay) {
        ctx.drawImage(createGradientOverlay, 0, 0);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [createGradientOverlay, immersiveMode.liveGradientWallpaper, immersiveMode.overlayMode]);

  // Don't render if not enabled
  if (!immersiveMode.liveGradientWallpaper || !immersiveMode.overlayMode) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[100]"
      style={{
        mixBlendMode: 'screen',
        opacity: immersiveMode.intensity || 0.7
      }}
    />
  );
};

export default SpotifyGradientOverlay;
