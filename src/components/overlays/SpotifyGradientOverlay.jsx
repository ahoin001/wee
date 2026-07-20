import React, { useEffect, useRef, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useAnimationActivity from '../../hooks/useAnimationActivity';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';

const SpotifyGradientOverlay = () => {
  const { extractedColors, immersiveMode, isPlaying, spotifyMatchEnabled } = useConsolidatedAppStore(
    useShallow((state) => ({
      extractedColors: state.spotify.extractedColors,
      immersiveMode: state.spotify.immersiveMode,
      isPlaying: Boolean(state.nowPlaying?.isPlaying),
      // Album wash rides on Now Playing Color Match — never paint while match is off.
      spotifyMatchEnabled: Boolean(state.ui.spotifyMatchEnabled),
    }))
  );
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const { shouldAnimate, frameIntervalMs } = useAnimationActivity({
    activeFps: 30,
    lowPowerFps: 15,
  });
  
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

  // Create gradient overlay canvas (capped — full-screen PNGs OOM / throw in Electron).
  const createGradientOverlay = useMemo(() => {
    if (
      !spotifyMatchEnabled ||
      !immersiveMode.liveGradientWallpaper ||
      !immersiveMode.overlayMode ||
      !extractedColors
    ) {
      return null;
    }

    try {
      const { primary, secondary, accent } = extractedColors;
      const primaryRgb = extractRgbValues(primary);
      const secondaryRgb = extractRgbValues(secondary);
      const accentRgb = extractRgbValues(accent);

      const {
        intensity = 0.7,
        animationLevel = 2,
        style = 'radial',
      } = immersiveMode;

      const animationSpeed = animationLevel * 0.3;
      const time = isPlaying ? Date.now() * 0.0005 * animationSpeed : 0;

      const canvas = document.createElement('canvas');
      const maxEdge = 1280;
      const sw = window.screen?.width || 1280;
      const sh = window.screen?.height || 720;
      const scale = Math.min(1, maxEdge / Math.max(sw, sh));
      canvas.width = Math.max(320, Math.round(sw * scale));
      canvas.height = Math.max(180, Math.round(sh * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const vibrancy = 0.8 + intensity * 0.4;
      const enhancedPrimaryRgb = {
        r: Math.min(255, Math.round(primaryRgb.r * vibrancy)),
        g: Math.min(255, Math.round(primaryRgb.g * vibrancy)),
        b: Math.min(255, Math.round(primaryRgb.b * vibrancy)),
      };
      const enhancedSecondaryRgb = {
        r: Math.min(255, Math.round(secondaryRgb.r * vibrancy)),
        g: Math.min(255, Math.round(secondaryRgb.g * vibrancy)),
        b: Math.min(255, Math.round(secondaryRgb.b * vibrancy)),
      };
      const enhancedAccentRgb = {
        r: Math.min(255, Math.round(accentRgb.r * vibrancy)),
        g: Math.min(255, Math.round(accentRgb.g * vibrancy)),
        b: Math.min(255, Math.round(accentRgb.b * vibrancy)),
      };

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let gradient;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      if (style === 'linear') {
        const angle = animationLevel > 0 ? time * 20 : 45;
        const rad = (angle * Math.PI) / 180;
        const x1 = centerX + Math.cos(rad) * canvas.width * 0.5;
        const y1 = centerY + Math.sin(rad) * canvas.height * 0.5;
        const x2 = centerX - Math.cos(rad) * canvas.width * 0.5;
        const y2 = centerY - Math.sin(rad) * canvas.height * 0.5;
        gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      } else if (style === 'waves') {
        const waveOffset = animationLevel > 0 ? Math.sin(time * 2) * 200 : 0;
        gradient = ctx.createLinearGradient(0, centerY + waveOffset, canvas.width, centerY - waveOffset);
      } else {
        const offsetX = animationLevel > 0 ? Math.sin(time) * 100 : 0;
        const offsetY = animationLevel > 0 ? Math.cos(time * 0.7) * 80 : 0;
        const radius = Math.max(canvas.width, canvas.height) * 0.8;
        gradient = ctx.createRadialGradient(
          centerX + offsetX,
          centerY + offsetY,
          0,
          centerX + offsetX,
          centerY + offsetY,
          radius
        );
      }

      const alpha = intensity;
      gradient.addColorStop(
        0,
        `rgba(${enhancedPrimaryRgb.r}, ${enhancedPrimaryRgb.g}, ${enhancedPrimaryRgb.b}, ${alpha})`
      );
      gradient.addColorStop(
        0.5,
        `rgba(${enhancedSecondaryRgb.r}, ${enhancedSecondaryRgb.g}, ${enhancedSecondaryRgb.b}, ${alpha * 0.8})`
      );
      gradient.addColorStop(
        1,
        `rgba(${enhancedAccentRgb.r}, ${enhancedAccentRgb.g}, ${enhancedAccentRgb.b}, ${alpha * 0.6})`
      );

      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (animationLevel >= 2 && isPlaying) {
        const pulseAlpha = Math.max(0.1, 0.2 + Math.sin(time * 6) * 0.15);
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = `rgba(${enhancedAccentRgb.r}, ${enhancedAccentRgb.g}, ${enhancedAccentRgb.b}, ${pulseAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      return canvas;
    } catch (err) {
      console.warn('[SpotifyGradientOverlay] gradient build failed', err);
      return null;
    }
  }, [
    spotifyMatchEnabled,
    immersiveMode.liveGradientWallpaper,
    immersiveMode.overlayMode,
    extractedColors,
    immersiveMode.intensity,
    immersiveMode.animationLevel,
    immersiveMode.style,
    isPlaying,
  ]);

  // Paint capped offscreen gradient onto the display canvas (CSS stretches to viewport).
  useEffect(() => {
    if (!immersiveMode.liveGradientWallpaper || !immersiveMode.overlayMode || !createGradientOverlay || !shouldAnimate) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = createGradientOverlay.width;
    canvas.height = createGradientOverlay.height;

    let lastFrameTs = 0;
    const animate = (ts = performance.now()) => {
      if (ts - lastFrameTs < frameIntervalMs) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameTs = ts;
      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(createGradientOverlay, 0, 0, canvas.width, canvas.height);
      } catch (err) {
        console.warn('[SpotifyGradientOverlay] paint failed', err);
        // Keep RAF alive — a transient paint failure must not kill the loop.
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [createGradientOverlay, immersiveMode.liveGradientWallpaper, immersiveMode.overlayMode, shouldAnimate, frameIntervalMs]);

  if (!spotifyMatchEnabled || !immersiveMode.liveGradientWallpaper || !immersiveMode.overlayMode) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 h-full w-full pointer-events-none z-[2]"
      style={{
        mixBlendMode: 'screen',
        opacity: immersiveMode.intensity || 0.7,
        objectFit: 'cover',
      }}
    />
  );
};

export default SpotifyGradientOverlay;
