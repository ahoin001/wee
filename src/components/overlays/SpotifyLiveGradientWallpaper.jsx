import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { registerSpotifyGradientSave } from '../../utils/presets/spotifyLookRegistry';
import useAnimationActivity from '../../hooks/useAnimationActivity';
import { logError, logWarn } from '../../utils/logger';

const SpotifyLiveGradientWallpaper = () => {
  const { extractedColors, immersiveMode, isPlaying, spotifyMatchEnabled } = useConsolidatedAppStore(
    useShallow((state) => ({
      extractedColors: state.spotify.extractedColors,
      immersiveMode: state.spotify.immersiveMode,
      isPlaying: Boolean(state.nowPlaying?.isPlaying ?? state.spotify.isPlaying),
      // Album wash rides on Now Playing Color Match — never swap wallpapers while match is off.
      spotifyMatchEnabled: Boolean(state.ui.spotifyMatchEnabled),
    }))
  );
  const lastWallpaperUrl = useRef(null);
  const { shouldAnimate } = useAnimationActivity({
    activeFps: 20,
    lowPowerFps: 10,
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



    // Create gradient overlay as a data URL
  const createGradientOverlay = useMemo(() => {
    if (!spotifyMatchEnabled || !immersiveMode.liveGradientWallpaper || !extractedColors || !shouldAnimate) {
      return null;
    }
    // Overlay wash is painted by SpotifyGradientOverlay — skip huge PNG generation.
    if (immersiveMode.overlayMode) {
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
        overlayMode = false,
      } = immersiveMode;

      const animationSpeed = animationLevel * 0.3;
      const time = isPlaying ? Date.now() * 0.0005 * animationSpeed : 0;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Cap size — full-screen toDataURL caused OOM / ErrorBoundary crashes.
      const maxEdge = 1280;
      const sw = window.screen?.width || 1280;
      const sh = window.screen?.height || 720;
      const scale = Math.min(1, maxEdge / Math.max(sw, sh));
      canvas.width = Math.max(320, Math.round(sw * scale));
      canvas.height = Math.max(180, Math.round(sh * scale));

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

      if (overlayMode) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = `rgb(${Math.round(enhancedPrimaryRgb.r * 0.3)}, ${Math.round(enhancedPrimaryRgb.g * 0.3)}, ${Math.round(enhancedPrimaryRgb.b * 0.3)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

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

      ctx.globalCompositeOperation = overlayMode ? 'screen' : 'source-over';
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (animationLevel >= 2 && isPlaying) {
        const pulseAlpha = Math.max(0.1, 0.2 + Math.sin(time * 6) * 0.15);
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = `rgba(${enhancedAccentRgb.r}, ${enhancedAccentRgb.g}, ${enhancedAccentRgb.b}, ${pulseAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      return canvas.toDataURL('image/jpeg', 0.82);
    } catch (err) {
      logError('LiveGradientWallpaper', 'Failed to build gradient canvas', err);
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
    shouldAnimate,
  ]);

  // Track current gradient file for cleanup
  const currentGradientFile = useRef(null);
  const latestImmersiveModeRef = useRef(immersiveMode);

  useEffect(() => {
    latestImmersiveModeRef.current = immersiveMode;
  }, [immersiveMode]);

  // Set wallpaper overlay when gradient changes
  useEffect(() => {
    if (!immersiveMode.liveGradientWallpaper || !createGradientOverlay) {
      // Clean up any existing gradient and restore original wallpaper
      cleanupCurrentGradient();
      return;
    }

    const setGradientWallpaper = async () => {
      try {
        // Store current wallpaper URL if we haven't already
        if (!lastWallpaperUrl.current && window.api?.wallpapers?.get) {
          try {
            const wallpaperData = await window.api.wallpapers.get();
            lastWallpaperUrl.current = wallpaperData?.wallpaper?.url || null;
          } catch (error) {
            logWarn('LiveGradientWallpaper', 'Could not get current wallpaper', error);
          }
        }
        
        if (!createGradientOverlay) {
          logWarn('LiveGradientWallpaper', 'No gradient data available');
          return;
        }
        
        // Extract base64 data from data URL
        const base64Data = createGradientOverlay.split(',')[1];
        if (!base64Data) {
          logError('LiveGradientWallpaper', 'Invalid data URL format');
          return;
        }
        
        // Clean up previous gradient file
        await cleanupCurrentGradient();

        // Save the gradient as a temporary file
        const saveResult = await window.api.wallpapers.saveFile({
          filename: `temp-spotify-gradient-${Date.now()}.png`,
          data: base64Data
        });
        
        if (!saveResult.success) {
          logError('LiveGradientWallpaper', 'Failed to save gradient file', saveResult.error);
          return;
        }
        currentGradientFile.current = saveResult.url;
        
        if (immersiveMode.overlayMode) {
          // Overlay mode: Use the existing overlay system instead of modifying wallpaper
          // Store the gradient URL for the overlay system to use
          currentGradientFile.current = saveResult.url;
          
          // The overlay will be handled by the existing WallpaperOverlay component
          // We just need to ensure the original wallpaper stays active
          if (lastWallpaperUrl.current) {
            const { setWallpaperState } = useConsolidatedAppStore.getState().actions;
            setWallpaperState({
              current: {
                url: lastWallpaperUrl.current,
                name: 'Original Wallpaper',
                type: 'user'
              }
            });
          }
        } else {
          // Replace mode: Set gradient as the wallpaper
          // Add the saved gradient to wallpapers list temporarily
          const wallpaperData = await window.api.wallpapers.get();
          const newWallpaper = {
            url: saveResult.url,
            name: 'Spotify Live Gradient (Temporary)',
            type: 'user',
            timestamp: new Date().toISOString(),
            isSpotifyGradient: true,
            isTemporary: true
          };
          
          const updatedData = {
            ...wallpaperData,
            savedWallpapers: [...(wallpaperData.savedWallpapers || []), newWallpaper]
          };
          
          await window.api.wallpapers.set(updatedData);

          // Set it as active
          const setResult = await window.api.wallpapers.setActive({ url: saveResult.url });
          
          if (setResult.success) {
            // Also update the consolidated store directly to ensure immediate visual update
            const { setWallpaperState } = useConsolidatedAppStore.getState().actions;
            setWallpaperState({
              current: newWallpaper
            });
          } else {
            logError('LiveGradientWallpaper', 'Failed to set gradient as active', setResult.error);
          }
        }
        
      } catch (error) {
        logError('LiveGradientWallpaper', 'Failed to set gradient wallpaper', error);
      }
    };

    // Debounce wallpaper updates to avoid too frequent changes
    const timeoutId = setTimeout(setGradientWallpaper, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [createGradientOverlay, immersiveMode.liveGradientWallpaper, immersiveMode.overlayMode, immersiveMode.intensity]);

  // Cleanup function to remove temporary gradient files
  const cleanupCurrentGradient = async () => {
    if (currentGradientFile.current) {
      try {
        const currentGradientUrl = currentGradientFile.current;

        // Remove from wallpapers list
        const wallpaperData = await window.api.wallpapers.get();
        const matchedWallpaper = (wallpaperData.savedWallpapers || []).find(
          (wp) => wp.url === currentGradientUrl
        );

        // User saved this gradient permanently; do not delete it as temp cleanup.
        if (matchedWallpaper?.isPermanent) {
          currentGradientFile.current = null;
          return;
        }

        if (window.api?.wallpapers?.delete) {
          await window.api.wallpapers.delete({ url: currentGradientUrl });
        }

        const updatedWallpapers = (wallpaperData.savedWallpapers || []).filter(
          wp => wp.url !== currentGradientUrl
        );
        
        const updatedData = {
          ...wallpaperData,
          savedWallpapers: updatedWallpapers
        };
        
        await window.api.wallpapers.set(updatedData);

        // If we're in overlay mode, restore original wallpaper
        if (latestImmersiveModeRef.current?.overlayMode && lastWallpaperUrl.current) {
          const { setWallpaperState } = useConsolidatedAppStore.getState().actions;
          setWallpaperState({
            current: {
              url: lastWallpaperUrl.current,
              name: 'Original Wallpaper',
              type: 'user'
            }
          });
        }
        
        currentGradientFile.current = null;
      } catch (error) {
        logError('LiveGradientWallpaper', 'Failed to cleanup gradient', error);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up any temporary gradients when component unmounts
      cleanupCurrentGradient();
    };
  }, []);

  // Save current gradient to wallpaper library (registered for Settings UI)
  const saveCurrentLook = useCallback(async () => {
    if (!currentGradientFile.current || !extractedColors) {
      logWarn('LiveGradientWallpaper', 'No current look to save');
      return;
    }

    try {
      const wallpaperData = await window.api.wallpapers.get();

      const permanentWallpaper = {
        url: currentGradientFile.current,
        name: `Spotify Look - ${extractedColors.primary ? 'Custom' : 'Dynamic'}`,
        type: 'user',
        timestamp: new Date().toISOString(),
        isSpotifyGradient: true,
        isPermanent: true,
        spotifyColors: extractedColors,
        immersiveSettings: {
          intensity: immersiveMode.intensity,
          animationLevel: immersiveMode.animationLevel,
          style: immersiveMode.style,
          overlayMode: immersiveMode.overlayMode,
        },
      };

      const updatedWallpapers = (wallpaperData.savedWallpapers || []).map((wp) =>
        wp.url === currentGradientFile.current ? { ...wp, isTemporary: false, ...permanentWallpaper } : wp
      );

      await window.api.wallpapers.set({
        ...wallpaperData,
        savedWallpapers: updatedWallpapers,
      });
      // Mark as retained so live-mode cleanup does not delete it later.
      currentGradientFile.current = null;
      alert('Current Spotify look saved! You can find it in your wallpaper collection.');
    } catch (error) {
      logError('LiveGradientWallpaper', 'Failed to save current look', error);
      alert(`Failed to save current look: ${error.message}`);
    }
  }, [extractedColors, immersiveMode]);

  useEffect(() => registerSpotifyGradientSave(saveCurrentLook), [saveCurrentLook]);

  // Don't render anything - this component only manages wallpaper
  return null;
};

export default SpotifyLiveGradientWallpaper;
