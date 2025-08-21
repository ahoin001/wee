import React, { useEffect, useMemo, useRef } from 'react';
import { useSpotifyState } from '../utils/useConsolidatedAppHooks';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';

const SpotifyLiveGradientWallpaper = () => {
  const { spotify } = useSpotifyState();
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const lastWallpaperUrl = useRef(null);
  
  // Extract colors and settings
  const extractedColors = spotify.extractedColors;
  const immersiveMode = spotify.immersiveMode;
  const isPlaying = spotify.isPlaying;
  const progress = spotify.progress || 0;
  const duration = spotify.duration || 1;

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



    // Create gradient overlay as a data URL
  const createGradientOverlay = useMemo(() => {
    if (!immersiveMode.liveGradientWallpaper || !extractedColors) {
      return null;
    }

    const { primary, secondary, accent } = extractedColors;
    const primaryRgb = extractRgbValues(primary);
    const secondaryRgb = extractRgbValues(secondary);
    const accentRgb = extractRgbValues(accent);

    // Get simplified gradient settings from immersive mode
    const {
      intensity = 0.7,
      animationLevel = 2,
      style = 'radial',
      overlayMode = false
    } = immersiveMode;

    // Simplified animation timing (reduce frequency for smoother performance)
    const animationSpeed = animationLevel * 0.3; // Convert level to speed multiplier
    const time = isPlaying ? Date.now() * 0.0005 * animationSpeed : 0; // Slower base speed

    // Create canvas to generate gradient overlay
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match screen resolution
    canvas.width = window.screen.width;
    canvas.height = window.screen.height;
    
    // Apply color enhancement based on intensity setting
    const vibrancy = 0.8 + (intensity * 0.4); // Scale vibrancy with intensity
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
    console.log('[LiveGradientWallpaper] Creating optimized gradient:', { intensity, animationLevel, style, overlayMode });
    
    // Base setup
    if (overlayMode) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {
      // Simple dark background for contrast
      ctx.fillStyle = `rgb(${Math.round(enhancedPrimaryRgb.r * 0.3)}, ${Math.round(enhancedPrimaryRgb.g * 0.3)}, ${Math.round(enhancedPrimaryRgb.b * 0.3)})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
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
    
    // Apply gradient
    ctx.globalCompositeOperation = overlayMode ? 'screen' : 'source-over';
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
    
    // Simplified debug text
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '20px Arial';
    ctx.fillText(`Live Gradient - ${style} | Level: ${animationLevel} | Intensity: ${Math.round(intensity * 100)}%`, 50, 100);
    
    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png');
    console.log('[LiveGradientWallpaper] Created optimized gradient wallpaper:', {
      primary: `rgb(${enhancedPrimaryRgb.r}, ${enhancedPrimaryRgb.g}, ${enhancedPrimaryRgb.b})`,
      secondary: `rgb(${enhancedSecondaryRgb.r}, ${enhancedSecondaryRgb.g}, ${enhancedSecondaryRgb.b})`,
      accent: `rgb(${enhancedAccentRgb.r}, ${enhancedAccentRgb.g}, ${enhancedAccentRgb.b})`,
      style: style,
      intensity: intensity,
      animationLevel: animationLevel,
      dataUrlLength: dataUrl.length,
      canvasSize: `${canvas.width}x${canvas.height}`
    });
    return dataUrl;
  }, [immersiveMode.liveGradientWallpaper, extractedColors, immersiveMode.intensity, immersiveMode.animationLevel, immersiveMode.style, immersiveMode.overlayMode, isPlaying]);

  // Track current gradient file for cleanup
  const currentGradientFile = useRef(null);

  // Set wallpaper overlay when gradient changes
  useEffect(() => {
    if (!immersiveMode.liveGradientWallpaper || !createGradientOverlay) {
      // Clean up any existing gradient and restore original wallpaper
      cleanupCurrentGradient();
      return;
    }

    const setGradientWallpaper = async () => {
      try {
        console.log('[LiveGradientWallpaper] Setting gradient as wallpaper');
        
        // Store current wallpaper URL if we haven't already
        if (!lastWallpaperUrl.current && window.api?.wallpapers?.get) {
          try {
            const wallpaperData = await window.api.wallpapers.get();
            lastWallpaperUrl.current = wallpaperData?.wallpaper?.url || null;
            console.log('[LiveGradientWallpaper] Stored original wallpaper:', lastWallpaperUrl.current);
          } catch (error) {
            console.warn('[LiveGradientWallpaper] Could not get current wallpaper:', error);
          }
        }
        
        if (!createGradientOverlay) {
          console.warn('[LiveGradientWallpaper] No gradient data available');
          return;
        }
        
        // Extract base64 data from data URL
        const base64Data = createGradientOverlay.split(',')[1];
        if (!base64Data) {
          console.error('[LiveGradientWallpaper] Invalid data URL format');
          return;
        }
        
        // Clean up previous gradient file
        await cleanupCurrentGradient();
        
        console.log('[LiveGradientWallpaper] Saving gradient as file...');
        
        // Save the gradient as a temporary file
        const saveResult = await window.api.wallpapers.saveFile({
          filename: `temp-spotify-gradient-${Date.now()}.png`,
          data: base64Data
        });
        
        if (!saveResult.success) {
          console.error('[LiveGradientWallpaper] Failed to save gradient file:', saveResult.error);
          return;
        }
        
        console.log('[LiveGradientWallpaper] Gradient saved as:', saveResult.url);
        currentGradientFile.current = saveResult.url;
        
        if (immersiveMode.overlayMode) {
          // Overlay mode: Use the existing overlay system instead of modifying wallpaper
          console.log('[LiveGradientWallpaper] Overlay mode: Using existing overlay system');
          
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
          console.log('[LiveGradientWallpaper] ✅ Overlay mode: Original wallpaper preserved, gradient ready for overlay');
        } else {
          // Replace mode: Set gradient as the wallpaper
          console.log('[LiveGradientWallpaper] Replace mode: Setting gradient as wallpaper');
          
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
          console.log('[LiveGradientWallpaper] Added temporary gradient to wallpapers list');
          
          // Set it as active
          const setResult = await window.api.wallpapers.setActive({ url: saveResult.url });
          
          if (setResult.success) {
            console.log('[LiveGradientWallpaper] ✅ Gradient wallpaper set successfully!');
            
            // Also update the consolidated store directly to ensure immediate visual update
            const { setWallpaperState } = useConsolidatedAppStore.getState().actions;
            setWallpaperState({
              current: newWallpaper
            });
            console.log('[LiveGradientWallpaper] ✅ Updated consolidated store with gradient wallpaper');
          } else {
            console.error('[LiveGradientWallpaper] Failed to set gradient as active:', setResult.error);
          }
        }
        
      } catch (error) {
        console.error('[LiveGradientWallpaper] Failed to set gradient wallpaper:', error);
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
        console.log('[LiveGradientWallpaper] Cleaning up temporary gradient:', currentGradientFile.current);
        
        // Remove from wallpapers list
        const wallpaperData = await window.api.wallpapers.get();
        const updatedWallpapers = (wallpaperData.savedWallpapers || []).filter(
          wp => wp.url !== currentGradientFile.current
        );
        
        const updatedData = {
          ...wallpaperData,
          savedWallpapers: updatedWallpapers
        };
        
        await window.api.wallpapers.set(updatedData);
        console.log('[LiveGradientWallpaper] Removed temporary gradient from wallpapers list');
        
        // If we're in overlay mode, restore original wallpaper
        if (immersiveMode.overlayMode && lastWallpaperUrl.current) {
          const { setWallpaperState } = useConsolidatedAppStore.getState().actions;
          setWallpaperState({
            current: {
              url: lastWallpaperUrl.current,
              name: 'Original Wallpaper',
              type: 'user'
            }
          });
          console.log('[LiveGradientWallpaper] Restored original wallpaper in overlay mode');
        }
        
        currentGradientFile.current = null;
      } catch (error) {
        console.error('[LiveGradientWallpaper] Failed to cleanup gradient:', error);
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

  // Save current look permanently
  const saveCurrentLook = async () => {
    if (!currentGradientFile.current || !extractedColors) {
      console.warn('[LiveGradientWallpaper] No current look to save');
      return;
    }

    try {
      console.log('[LiveGradientWallpaper] Saving current look permanently...');
      
      // Get current wallpaper data
      const wallpaperData = await window.api.wallpapers.get();
      
      // Create a permanent version of the current gradient
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
          overlayMode: immersiveMode.overlayMode
        }
      };
      
      // Remove the temporary flag and add permanent version
      const updatedWallpapers = (wallpaperData.savedWallpapers || []).map(wp => 
        wp.url === currentGradientFile.current 
          ? { ...wp, isTemporary: false, ...permanentWallpaper }
          : wp
      );
      
      const updatedData = {
        ...wallpaperData,
        savedWallpapers: updatedWallpapers
      };
      
      await window.api.wallpapers.set(updatedData);
      console.log('[LiveGradientWallpaper] ✅ Current look saved permanently!');
      
      // Show success message
      alert('Current Spotify look saved! You can find it in your wallpaper collection.');
      
    } catch (error) {
      console.error('[LiveGradientWallpaper] Failed to save current look:', error);
      alert('Failed to save current look: ' + error.message);
    }
  };

  // Debug function to test live gradient wallpaper
  useEffect(() => {
    window.testLiveGradientWallpaper = () => {
      console.log('[LiveGradientWallpaper] === TESTING LIVE GRADIENT WALLPAPER ===');
      console.log('[LiveGradientWallpaper] Live gradient wallpaper enabled:', immersiveMode.liveGradientWallpaper);
      console.log('[LiveGradientWallpaper] Extracted colors:', extractedColors);
      console.log('[LiveGradientWallpaper] Is playing:', isPlaying);
      console.log('[LiveGradientWallpaper] Progress:', progress);
      console.log('[LiveGradientWallpaper] Duration:', duration);
      console.log('[LiveGradientWallpaper] Gradient overlay created:', !!createGradientOverlay);
      console.log('[LiveGradientWallpaper] Last wallpaper URL:', lastWallpaperUrl.current);
      console.log('[LiveGradientWallpaper] === END LIVE GRADIENT WALLPAPER TEST ===');
    };

         window.enableLiveGradientWallpaper = () => {
       console.log('[LiveGradientWallpaper] Enabling live gradient wallpaper...');
       const { setSpotifyState } = useConsolidatedAppStore.getState().actions;
       const currentImmersiveMode = useConsolidatedAppStore.getState().spotify.immersiveMode || {};
       
       setSpotifyState({
         immersiveMode: {
           ...currentImmersiveMode,
           liveGradientWallpaper: true
         }
       });
       console.log('[LiveGradientWallpaper] ✅ Live gradient wallpaper enabled!');
     };

           window.testGradientVisibility = () => {
        console.log('[LiveGradientWallpaper] === TESTING GRADIENT VISIBILITY ===');
        console.log('[LiveGradientWallpaper] Current gradient overlay:', createGradientOverlay ? 'Created' : 'Not created');
        console.log('[LiveGradientWallpaper] Extracted colors:', extractedColors);
        console.log('[LiveGradientWallpaper] Last wallpaper URL:', lastWallpaperUrl.current);
        
        // Test setting a bright standalone gradient
        if (createGradientOverlay && window.api?.wallpapers?.setActive) {
          console.log('[LiveGradientWallpaper] Testing standalone gradient visibility...');
          window.api.wallpapers.setActive({ url: createGradientOverlay });
          console.log('[LiveGradientWallpaper] ✅ Test gradient applied - check if visible');
        } else {
          console.log('[LiveGradientWallpaper] ❌ Cannot test - missing gradient or API');
        }
        console.log('[LiveGradientWallpaper] === END VISIBILITY TEST ===');
      };

      window.createTestGradient = () => {
        console.log('[LiveGradientWallpaper] === CREATING SUPER BRIGHT TEST GRADIENT ===');
        
        // Test if wallpaper API is available
        if (!window.api?.wallpapers?.setActive) {
          console.error('[LiveGradientWallpaper] ❌ Wallpaper API not available!');
          alert('Wallpaper API not available! Make sure you\'re running in Electron.');
          return;
        }
        
        // Create a test canvas with EXTREMELY bright, solid gradients
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.screen.width;
        canvas.height = window.screen.height;
        
        console.log('[LiveGradientWallpaper] Canvas size:', canvas.width + 'x' + canvas.height);
        
        // Fill with solid bright color first - this should be VERY visible
        ctx.fillStyle = 'rgb(255, 0, 0)'; // Pure red
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add some text to verify it's working
        ctx.fillStyle = 'white';
        ctx.font = '100px Arial';
        ctx.fillText('GRADIENT TEST - ' + new Date().toLocaleTimeString(), 100, 200);
        
        // Create a bright, visible test gradient with NO transparency
        const gradient1 = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient1.addColorStop(0, 'rgb(255, 0, 100)'); // Bright pink
        gradient1.addColorStop(0.5, 'rgb(0, 255, 200)'); // Bright cyan
        gradient1.addColorStop(1, 'rgb(100, 0, 255)'); // Bright purple
        
        // Apply the main gradient
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = gradient1;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const testGradientUrl = canvas.toDataURL('image/png');
        console.log('[LiveGradientWallpaper] Generated test gradient data URL, length:', testGradientUrl.length);
        
        // Save and set the test gradient properly
        const saveTestGradient = async () => {
          try {
            const base64Data = testGradientUrl.split(',')[1];
            console.log('[LiveGradientWallpaper] Saving test gradient as file...');
            
            const saveResult = await window.api.wallpapers.saveFile({
              filename: `test-gradient-${Date.now()}.png`,
              data: base64Data
            });
            
            if (!saveResult.success) {
              console.error('[LiveGradientWallpaper] Failed to save test gradient:', saveResult.error);
              alert('Failed to save test gradient: ' + saveResult.error);
              return;
            }
            
            console.log('[LiveGradientWallpaper] Test gradient saved as:', saveResult.url);
            
            // Add to wallpapers list
            const wallpaperData = await window.api.wallpapers.get();
            const newWallpaper = {
              url: saveResult.url,
              name: 'Test Gradient',
              type: 'user',
              timestamp: new Date().toISOString(),
              isTestGradient: true
            };
            
            const updatedData = {
              ...wallpaperData,
              savedWallpapers: [...(wallpaperData.savedWallpapers || []), newWallpaper]
            };
            
            await window.api.wallpapers.set(updatedData);
            
            // Set as active
            const setResult = await window.api.wallpapers.setActive({ url: saveResult.url });
            
            if (setResult.success) {
              console.log('[LiveGradientWallpaper] ✅ SUPER BRIGHT Test gradient applied successfully!');
              
              // Also update the consolidated store directly to ensure immediate visual update
              const { setWallpaperState } = useConsolidatedAppStore.getState().actions;
              setWallpaperState({
                current: newWallpaper
              });
              console.log('[LiveGradientWallpaper] ✅ Updated consolidated store with test gradient');
              
              alert('Test gradient applied! Check your wallpaper - it should be bright red with gradient overlay and text.');
            } else {
              console.error('[LiveGradientWallpaper] Failed to set test gradient as active:', setResult.error);
              alert('Failed to set test gradient: ' + setResult.error);
            }
            
          } catch (error) {
            console.error('[LiveGradientWallpaper] ❌ Error in test gradient process:', error);
            alert('Failed to set test gradient: ' + error.message);
          }
        };
        
        saveTestGradient();
        
        console.log('[LiveGradientWallpaper] === END SUPER BRIGHT TEST GRADIENT ===');
      };

             window.testWallpaperAPI = () => {
         console.log('[LiveGradientWallpaper] === TESTING WALLPAPER API ===');
         console.log('[LiveGradientWallpaper] window.api available:', !!window.api);
         console.log('[LiveGradientWallpaper] window.api.wallpapers available:', !!window.api?.wallpapers);
         console.log('[LiveGradientWallpaper] window.api.wallpapers.setActive available:', !!window.api?.wallpapers?.setActive);
         console.log('[LiveGradientWallpaper] window.api.wallpapers.get available:', !!window.api?.wallpapers?.get);
         console.log('[LiveGradientWallpaper] window.api.wallpapers.saveFile available:', !!window.api?.wallpapers?.saveFile);
         console.log('[LiveGradientWallpaper] window.api.wallpapers.set available:', !!window.api?.wallpapers?.set);
         
         if (window.api?.wallpapers?.get) {
           window.api.wallpapers.get().then((data) => {
             console.log('[LiveGradientWallpaper] Current wallpaper data:', data);
           }).catch((error) => {
             console.error('[LiveGradientWallpaper] Failed to get wallpaper data:', error);
           });
         }
         console.log('[LiveGradientWallpaper] === END WALLPAPER API TEST ===');
       };

       // Save current look function
       window.saveCurrentSpotifyLook = saveCurrentLook;

      window.forceGradientWallpaper = async () => {
        console.log('[LiveGradientWallpaper] === FORCING CURRENT GRADIENT ===');
        if (!createGradientOverlay) {
          console.log('[LiveGradientWallpaper] ❌ No gradient available to force');
          alert('No gradient available! Make sure Spotify is playing and colors are extracted.');
          return;
        }
        
        try {
          const base64Data = createGradientOverlay.split(',')[1];
          console.log('[LiveGradientWallpaper] Saving forced gradient as file...');
          
          const saveResult = await window.api.wallpapers.saveFile({
            filename: `forced-spotify-gradient-${Date.now()}.png`,
            data: base64Data
          });
          
          if (!saveResult.success) {
            console.error('[LiveGradientWallpaper] Failed to save forced gradient:', saveResult.error);
            alert('Failed to save gradient: ' + saveResult.error);
            return;
          }
          
          console.log('[LiveGradientWallpaper] Forced gradient saved as:', saveResult.url);
          
          // Add to wallpapers list
          const wallpaperData = await window.api.wallpapers.get();
          const newWallpaper = {
            url: saveResult.url,
            name: 'Forced Spotify Gradient',
            type: 'user',
            timestamp: new Date().toISOString(),
            isSpotifyGradient: true
          };
          
          const updatedData = {
            ...wallpaperData,
            savedWallpapers: [...(wallpaperData.savedWallpapers || []), newWallpaper]
          };
          
          await window.api.wallpapers.set(updatedData);
          
          // Set as active
          const setResult = await window.api.wallpapers.setActive({ url: saveResult.url });
          
          if (setResult.success) {
            console.log('[LiveGradientWallpaper] ✅ Current gradient forced as wallpaper successfully!');
            
            // Also update the consolidated store directly to ensure immediate visual update
            const { setWallpaperState } = useConsolidatedAppStore.getState().actions;
            setWallpaperState({
              current: newWallpaper
            });
            console.log('[LiveGradientWallpaper] ✅ Updated consolidated store with forced gradient');
            
            alert('Forced gradient applied! Check your wallpaper.');
          } else {
            console.error('[LiveGradientWallpaper] Failed to set forced gradient as active:', setResult.error);
            alert('Failed to set gradient: ' + setResult.error);
          }
          
        } catch (error) {
          console.error('[LiveGradientWallpaper] ❌ Error forcing gradient:', error);
          alert('Failed to force gradient: ' + error.message);
        }
        
        console.log('[LiveGradientWallpaper] === END FORCE ===');
      };

                                       return () => {
         delete window.testLiveGradientWallpaper;
         delete window.enableLiveGradientWallpaper;
         delete window.testGradientVisibility;
         delete window.createTestGradient;
         delete window.forceGradientWallpaper;
         delete window.testWallpaperAPI;
         delete window.saveCurrentSpotifyLook;
       };
  }, [immersiveMode.liveGradientWallpaper, extractedColors, isPlaying, progress, duration, createGradientOverlay]);

  // Don't render anything - this component only manages wallpaper
  return null;
};

export default SpotifyLiveGradientWallpaper;
