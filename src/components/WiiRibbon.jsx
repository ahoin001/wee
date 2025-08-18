import React, { useState, useEffect, Suspense } from 'react';

// Lazy load modals
const LazyPrimaryActionsModal = React.lazy(() => import('./PrimaryActionsModal'));
const LazyUpdateModal = React.lazy(() => import('./UpdateModal'));
const LazyDockEffectsModal = React.lazy(() => import('./DockEffectsModal'));

import WiiStyleButton from './WiiStyleButton';
import DockParticleSystem from './DockParticleSystem';
import './WiiRibbon.css';
import reactIcon from '../assets/react.svg';
import intervalManager from '../utils/IntervalManager';
import { useUIState } from '../utils/useConsolidatedAppHooks';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
// import more icons as needed

// Add a helper function to convert opacity to hex alpha if needed
function hexAlpha(opacity) {
  // Clamp and convert to 0-255, then to 2-digit hex
  const a = Math.round(Math.max(0, Math.min(1, opacity)) * 255);
  return a === 255 ? '' : a.toString(16).padStart(2, '0');
}

const WiiRibbonComponent = ({ onSettingsClick, onPresetsClick, onSettingsChange, onToggleDarkMode, onToggleCursor, useCustomCursor, glassWiiRibbon, onGlassWiiRibbonChange, animatedOnHover, setAnimatedOnHover, enableTimePill, timePillBlur, timePillOpacity, ribbonColor: propRibbonColor, onRibbonColorChange, recentRibbonColors, onRecentRibbonColorChange, ribbonGlowColor: propRibbonGlowColor, onRibbonGlowColorChange, recentRibbonGlowColors, onRecentRibbonGlowColorChange, ribbonGlowStrength: propRibbonGlowStrength, ribbonGlowStrengthHover: propRibbonGlowStrengthHover, ribbonDockOpacity: propRibbonDockOpacity, onRibbonDockOpacityChange, timeColor, timeFormat24hr, timeFont, presetsButtonConfig, showPresetsButton, glassOpacity: propGlassOpacity, glassBlur: propGlassBlur, glassBorderOpacity: propGlassBorderOpacity, glassShineOpacity: propGlassShineOpacity, particleSettings = {} }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Debug logging for ribbon props
  useEffect(() => {
    console.log('[WiiRibbon] Props received:', {
      ribbonColor: propRibbonColor,
      ribbonGlowColor: propRibbonGlowColor,
      ribbonGlowStrength: propRibbonGlowStrength,
      ribbonGlowStrengthHover: propRibbonGlowStrengthHover,
      glassWiiRibbon,
      glassOpacity: propGlassOpacity,
      glassBlur: propGlassBlur,
      glassBorderOpacity: propGlassBorderOpacity,
      glassShineOpacity: propGlassShineOpacity,
      timeFormat24hr,
      timeColor,
      timeFont
    });
  }, [propRibbonColor, propRibbonGlowColor, propRibbonGlowStrength, propRibbonGlowStrengthHover, glassWiiRibbon, propGlassOpacity, propGlassBlur, propGlassBorderOpacity, propGlassShineOpacity, timeFormat24hr, timeColor, timeFont]);
  
  // Use consolidated store for modal states and UI settings
  const { 
    ui,
    setUIState
  } = useUIState();
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [isFrameless, setIsFrameless] = useState(true);
  const [showGeneralModal, setShowGeneralModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDockEffectsModal, setShowDockEffectsModal] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [immersivePip, setImmersivePip] = useState(() => {
    // Try to load from localStorage or default to false
    try {
      return JSON.parse(localStorage.getItem('immersivePip')) || false;
    } catch {
      return false;
    }
  });
  

  
  const [buttonConfigs, setButtonConfigs] = useState([
    { type: 'text', text: 'Wii', useAdaptiveColor: false, useGlowEffect: false, glowStrength: 20, useGlassEffect: false, glassOpacity: 0.18, glassBlur: 2.5, glassBorderOpacity: 0.5, glassShineOpacity: 0.7 }, 
    { type: 'text', text: 'Mail', useAdaptiveColor: false, useGlowEffect: false, glowStrength: 20, useGlassEffect: false, glassOpacity: 0.18, glassBlur: 2.5, glassBorderOpacity: 0.5, glassShineOpacity: 0.7 }
  ]);
  const [activeButtonIndex, setActiveButtonIndex] = useState(null);
  const [showPrimaryActionsModal, setShowPrimaryActionsModal] = useState(false);
  const [showPresetsButtonModal, setShowPresetsButtonModal] = useState(false);
  const [isRibbonHovered, setIsRibbonHovered] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [tintedImages, setTintedImages] = useState({});
  const [activeButton, setActiveButton] = useState(null);

  // Load configs from settings on mount - TEMPORARILY DISABLED TO PREVENT INFINITE LOOP
  useEffect(() => {
    async function loadButtonConfigs() {
      console.log('[WiiRibbon] Button config loading DISABLED to prevent infinite loop');
      // if (window.api?.settings?.get) {
      //   const settings = await window.api.settings.get();
      //   if (settings && settings.ribbonButtonConfigs) {
          
      //     // Ensure each button config has all required properties
      //     const configsWithAdaptiveColor = settings.ribbonButtonConfigs.map(config => ({
      //       ...config,
      //       useAdaptiveColor: config.useAdaptiveColor ?? false,
      //       useGlowEffect: config.useGlowEffect ?? false,
      //       glowStrength: config.glowStrength ?? 20,
      //       useGlassEffect: config.useGlassEffect ?? false,
      //       glassOpacity: config.glassOpacity ?? 0.18,
      //       glassBlur: config.glassBlur ?? 2.5,
      //       glassBorderOpacity: config.glassBorderOpacity ?? 0.5,
      //       glassShineOpacity: config.glassShineOpacity ?? 0.7
      //     }));
      //     setButtonConfigs(configsWithAdaptiveColor);
      //   }
      // }
    }
    loadButtonConfigs();
  }, []);

  // Save configs to settings
  const saveButtonConfigs = async (configs) => {
    
    setButtonConfigs(configs);
    if (window.api?.settings?.get && window.api?.settings?.set) {
      const settings = await window.api.settings.get();
      await window.api.settings.set({ ...settings, ribbonButtonConfigs: configs });
      
      // Notify parent component of the change
      if (onSettingsChange) {
        onSettingsChange({ ribbonButtonConfigs: configs });
      }
    }
  };

  const handleButtonContextMenu = (index, e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling up to the footer
    setActiveButtonIndex(index);
    setShowPrimaryActionsModal(true);
  };

  const handleTimeContextMenu = (e) => {
    console.log('[WiiRibbon] Time right-click detected!');
    e.preventDefault();
    e.stopPropagation();
    
    console.log('[WiiRibbon] About to call setUIState with:', {
      showSettingsModal: true,
      settingsActiveTab: 'time'
    });
    
    // Open settings modal with time tab active
    setUIState({ 
      showSettingsModal: true, 
      settingsActiveTab: 'time'
    });
    
    console.log('[WiiRibbon] setUIState called successfully');
  };

  const handleRibbonContextMenu = (e) => {
    console.log('[WiiRibbon] Right-click detected!');
    e.preventDefault();
    e.stopPropagation();
    
    console.log('[WiiRibbon] About to call setUIState with:', {
      showSettingsModal: true,
      settingsActiveTab: 'dock',
      dockSubTab: 'wii-ribbon'
    });
    
    setUIState({ 
      showSettingsModal: true, 
      settingsActiveTab: 'dock',
      dockSubTab: 'wii-ribbon' // Specify which sub-tab to open
    });
    
    console.log('[WiiRibbon] setUIState called successfully');
  };

  const handleDockEffectsContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDockEffectsModal(true);
  };

  const handlePrimaryActionsSave = (newConfig) => {
    const newConfigs = [...(buttonConfigs || [])];
    newConfigs[activeButtonIndex] = newConfig;
    
    saveButtonConfigs(newConfigs);
    setShowPrimaryActionsModal(false);
  };

  const handlePrimaryActionsCancel = () => {
    setShowPrimaryActionsModal(false);
  };

  const handlePresetsButtonContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPresetsButtonModal(true);
  };

  const handlePresetsButtonSave = (newConfig) => {
    setShowPresetsButtonModal(false);
    // Save to settings
    if (onSettingsChange) {
      onSettingsChange({ presetsButtonConfig: newConfig });
    }
  };

  const handlePresetsButtonCancel = () => {
    setShowPresetsButtonModal(false);
  };

  // Update time every second
  useEffect(() => {
    const taskId = intervalManager.addTask(() => {
      setCurrentTime(new Date());
    }, 1000, 'time-update');
    
    return () => intervalManager.removeTask(taskId);
  }, []);





  // Generate tinted images for buttons with adaptive color enabled
  useEffect(() => {
    // Only run if we have button configs loaded
    if (!buttonConfigs || buttonConfigs.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[WiiRibbon] Skipping tinted image generation - no button configs loaded yet');
      }
      return;
    }

    const generateTintedImages = async () => {
      // Handle undefined propRibbonGlowColor
      if (!propRibbonGlowColor) {
        console.warn('[WiiRibbon] generateTintedImages: propRibbonGlowColor is undefined, skipping tinted image generation');
        return;
      }
      
      const rgbColor = hexToRgb(propRibbonGlowColor);
      const newTintedImages = {};
      
      // Check all button configs for adaptive color and custom icons
      const allConfigs = [...(buttonConfigs || [])];
      if (presetsButtonConfig) {
        allConfigs.push(presetsButtonConfig);
      }
      
      for (const config of allConfigs) {
        if (config && config.useAdaptiveColor && config.icon && !config.icon.startsWith('data:') && !['palette', 'star', 'heart'].includes(config.icon)) {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = async () => {
              const tintedUrl = await tintImage(img, rgbColor);
              newTintedImages[config.icon] = tintedUrl;
              setTintedImages(prev => ({ ...prev, ...newTintedImages }));
            };
            img.src = config.icon;
          } catch (error) {
            console.error('Error tinting image:', error);
          }
        }
      }
    };

    generateTintedImages();
  }, [propRibbonGlowColor, buttonConfigs, presetsButtonConfig]);
  
  // Listen for update status events
  useEffect(() => {
    const handleUpdateStatus = (data) => {
      if (data.status === 'available') {
        setUpdateAvailable(true);
      } else if (data.status === 'not-available' || data.status === 'downloaded') {
        setUpdateAvailable(false);
      }
    };
    
    if (window.api && window.api.onUpdateStatus) {
      window.api.onUpdateStatus(handleUpdateStatus);
    }
    
    return () => {
      if (window.api && window.api.offUpdateStatus) {
        window.api.offUpdateStatus(handleUpdateStatus);
      }
    };
  }, []);

  // Handle Escape key to close admin menu
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (showAdminMenu) {
          // console.log('Escape key pressed, closing admin menu');
          setShowAdminMenu(false);
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showAdminMenu]);

  const formatTime = (date) => {
    console.log('[WiiRibbon] formatTime called with timeFormat24hr:', timeFormat24hr);
    return date.toLocaleTimeString('en-US', {
      hour12: !timeFormat24hr,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: '2-digit',
      day: '2-digit'
    }).replace(',', '');
  };

  // Helper function to convert hex color to RGB array
  const hexToRgb = (hexColor) => {
    // Handle undefined or null values
    if (!hexColor || typeof hexColor !== 'string') {
      console.warn('[WiiRibbon] hexToRgb: Invalid hex color provided:', hexColor);
      return [0, 153, 255]; // Default blue color
    }
    
    // Remove # if present
    const hex = hexColor.replace('#', '');
    
    // Validate hex format
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
      console.warn('[WiiRibbon] hexToRgb: Invalid hex format:', hexColor);
      return [0, 153, 255]; // Default blue color
    }
    
    // Convert hex to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return [r, g, b];
  };

  // Helper function to tint an image with a specific color
  const tintImage = (imageElement, rgbColor) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size to match image
      canvas.width = imageElement.naturalWidth || imageElement.width;
      canvas.height = imageElement.naturalHeight || imageElement.height;
      
      // Draw the image to get the alpha mask
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Replace all non-transparent pixels with the tint color
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha !== 0) {
          data[i]     = rgbColor[0]; // R
          data[i + 1] = rgbColor[1]; // G
          data[i + 2] = rgbColor[2]; // B
          // Keep original alpha
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Convert canvas to data URL
      const tintedImageUrl = canvas.toDataURL('image/png');
      resolve(tintedImageUrl);
    });
  };

  // Helper function to get the appropriate image source for adaptive color
  const getImageSource = (originalUrl, useAdaptiveColor) => {
    // console.log('[WiiRibbon] getImageSource called:', { originalUrl, useAdaptiveColor, hasTintedImage: !!tintedImages[originalUrl] });
    if (useAdaptiveColor && tintedImages[originalUrl]) {
      // console.log('[WiiRibbon] Using tinted image for:', originalUrl);
      return tintedImages[originalUrl];
    }
    // console.log('[WiiRibbon] Using original image for:', originalUrl);
    return originalUrl;
  };

  // Helper function to get icon filter based on settings
  const getIconFilter = (useWiiGrayFilter) => {
    if (useWiiGrayFilter) {
      return 'grayscale(100%) brightness(0.6) contrast(1.2)';
    }
    return 'none';
  };

  const handleSettingsClick = (event) => {
    // Call the parent handler to open settings action menu
    if (onSettingsClick) {
      onSettingsClick(event);
    }
  };



  // Guard for window.api to prevent errors in browser
  const api = window.api || {
    toggleFullscreen: () => {},
    toggleFrame: () => {},
    minimize: () => {},
    close: () => {},
    onFullscreenState: () => {},
    onFrameState: () => {},
  };

  useEffect(() => {
    if (api.onFullscreenState) {
      api.onFullscreenState((val) => setIsFullscreen(val));
    }
    if (api.onFrameState) {
      api.onFrameState((val) => setIsFrameless(!val));
    }
  }, []);

  // Preavailable icons (add more as needed)
  const preavailableIcons = [
    reactIcon,
    // add more imported icons here
  ];

  const handleButtonClick = (index) => {
    const config = buttonConfigs?.[index];
    
    // Handle admin mode for left button (index 0)
    if (index === 0 && config?.adminMode && config?.powerActions && config.powerActions.length > 0) {
      setShowAdminMenu(true);
      return;
    }
    
    // Handle regular button actions
    if (!config || !config.actionType || !config.action || config.actionType === 'none') {
      return;
    }
    
    if (window.api && window.api.launchApp) {
      // Handle all supported action types
      if (config.actionType === 'exe') {
        window.api.launchApp({ type: 'exe', path: config.action });
      } else if (config.actionType === 'url') {
        window.api.launchApp({ type: 'url', path: config.action });
      } else if (config.actionType === 'steam') {
        window.api.launchApp({ type: 'steam', path: config.action });
      } else if (config.actionType === 'epic') {
        window.api.launchApp({ type: 'epic', path: config.action });
      } else if (config.actionType === 'microsoftstore') {
        window.api.launchApp({ type: 'microsoftstore', path: config.action });
      }
    } else {
      // Fallback: try window.open for URLs
      if (config.actionType === 'url') {
        window.open(config.action, '_blank');
      }
    }
  };

  const handleAdminActionClick = (action) => {
    if (window.api && window.api.executeCommand) {
      window.api.executeCommand(action.command);
    }
    setShowAdminMenu(false);
  };

  return (
    <>
      <footer className="interactive-footer" onContextMenu={handleRibbonContextMenu}>
        {/* Particle System */}
        <DockParticleSystem
          enabled={particleSettings.enabled || false}
          effectType={particleSettings.effectType || 'normal'}
          direction={particleSettings.direction || 'upward'}
          speed={particleSettings.speed || 2}
          particleCount={particleSettings.particleCount || 3}
          spawnRate={particleSettings.spawnRate || 60}
          settings={{
            size: particleSettings.size || 3,
            gravity: particleSettings.gravity || 0.02,
            fadeSpeed: particleSettings.fadeSpeed || 0.008,
            sizeDecay: particleSettings.sizeDecay || 0.02
          }}
        />
          <div
            className="absolute inset-0 z-0 svg-container-glow"
            style={{
              filter: `drop-shadow(0 0 ${isRibbonHovered ? (propRibbonGlowStrengthHover ?? 28) : (propRibbonGlowStrength ?? 20)}px ${propRibbonGlowColor}) drop-shadow(0 0 12px ${propRibbonGlowColor})`,
              transition: 'filter 0.3s',
            }}
            onMouseEnter={() => setIsRibbonHovered(true)}
            onMouseLeave={() => setIsRibbonHovered(false)}
          >
              <svg width="100%" height="100%" viewBox="0 0 1440 240" preserveAspectRatio="none">
                {glassWiiRibbon && (
                  <defs>
                    <filter id="glass-blur" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation={propGlassBlur || 2.5} result="blur" />
                      <feComponentTransfer>
                        <feFuncA type="linear" slope="1.2" />
                      </feComponentTransfer>
                      <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <linearGradient id="glass-shine" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color={`rgba(255,255,255,${propGlassShineOpacity || 0.7})`} />
                      <stop offset="60%" stop-color="rgba(255,255,255,0.05)" />
                      <stop offset="100%" stop-color="rgba(255,255,255,0.0)" />
                    </linearGradient>
                  </defs>
                )}
                <path
                  d="M 0 40 
                     L 250 40 
                     C 450 40, 500 140, 670 140 
                     L 770 140 
                     C 940 140, 990 40, 1190 40 
                     L 1440 40 
                     L 1440 240 
                     L 0 240 Z"
                  fill={glassWiiRibbon ? `rgba(255,255,255,${propGlassOpacity || 0.18})` : propRibbonColor + (propRibbonDockOpacity !== undefined ? hexAlpha(propRibbonDockOpacity) : '')}
                  stroke={`rgba(255,255,255,${propGlassBorderOpacity || 0.5})`}
                  strokeWidth="2"
                  filter={glassWiiRibbon ? "url(#glass-blur)" : undefined}
                  style={glassWiiRibbon ? { transition: 'fill 0.3s' } : { transition: 'fill 0.3s' }}
                />
                {glassWiiRibbon && (
                  <path
                    d="M 0 40 
                       L 250 40 
                       C 450 40, 500 140, 670 140 
                       L 770 140 
                       C 940 140, 990 40, 1190 40 
                       L 1440 40 
                       L 1440 120 
                       L 0 120 Z"
                    fill="url(#glass-shine)"
                    style={{ opacity: propGlassShineOpacity || 0.7, pointerEvents: 'none' }}
                  />
                )}
              </svg>
          </div>

          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-[300px] z-20 text-center pointer-events-auto">
              {/* Apple Liquid Glass Pill Container */}
              {enableTimePill ? (
                <div 
                  className="liquid-glass"
                  style={{
                    width: '280px',
                    height: '120px',
                    borderRadius: '56px',
                    position: 'relative',
                    isolation: 'isolate',
                    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    background: 'none',
                    padding: '0',
                    margin: '0',
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                  onContextMenu={handleTimeContextMenu}
                >
                  {/* ::before pseudo-element equivalent - subtle inner shadow */}
                  <div 
                    style={{
                      content: '',
                      position: 'absolute',
                      inset: '0',
                      zIndex: '0',
                      borderRadius: '56px',
                      boxShadow: 'inset 0 1px 3px rgba(255, 255, 255, 0.3), inset 0 -1px 2px rgba(0, 0, 0, 0.1)',
                      backgroundColor: 'rgba(255, 255, 255, 0)',
                      pointerEvents: 'none'
                    }}
                  />
                  
                  {/* ::after pseudo-element equivalent - very subtle backdrop blur */}
                  <div 
                    style={{
                      content: '',
                      position: 'absolute',
                      inset: '0',
                      zIndex: '-1',
                      borderRadius: '56px',
                      backdropFilter: `blur(${timePillBlur}px)`,
                      WebkitBackdropFilter: `blur(${timePillBlur}px)`,
                      backgroundColor: `rgba(255, 255, 255, ${timePillOpacity})`,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      pointerEvents: 'none'
                    }}
                  />
                  
                  {/* Time Display */}
                  <div 
                    className="glass-text"
                    style={{
                      position: 'relative',
                      color: timeColor,
                      fontSize: '32px',
                      fontWeight: 'bold',
                      textShadow: '0px 1px 3px rgba(0, 0, 0, 0.3)',
                      opacity: '1',
                      transform: 'translate(0px, 0px)',
                      fontFamily: timeFont === 'digital' ? 'DigitalDisplayRegular-ODEO, monospace' : "'Orbitron', sans-serif",
                      zIndex: '1',
                      marginBottom: '12px'
                    }}
                  >
                      {formatTime(currentTime)}
                  </div>
                  {/* Date Display */}
                  <div 
                    className="glass-text"
                    style={{
                      position: 'relative',
                      color: timeColor,
                      fontSize: '18px',
                      fontWeight: 'bold',
                      textShadow: '0px 1px 3px rgba(0, 0, 0, 0.3)',
                      opacity: '1',
                      transform: 'translate(0px, 0px)',
                      fontFamily: timeFont === 'digital' ? 'DigitalDisplayRegular-ODEO, monospace' : "'Orbitron', sans-serif",
                      zIndex: '1'
                    }}
                  >
                      {formatDate(currentTime)}
                  </div>
                </div>
              ) : (
                /* Simple time display without pill when disabled */
                <div 
                  onContextMenu={handleTimeContextMenu}
                  style={{
                    padding: '20px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '120px'
                  }}
                >
                  <div 
                    id="time" 
                    className="text-4xl font-bold" 
                    style={{ 
                      fontFamily: timeFont === 'digital' ? 'DigitalDisplayRegular-ODEO, monospace' : "'Orbitron', sans-serif", 
                      color: timeColor,
                      textShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
                      marginBottom: '12px'
                    }}
                  >
                      {formatTime(currentTime)}
                  </div>
                  <div 
                    id="date" 
                    className="text-lg font-bold" 
                    style={{ 
                      color: timeColor,
                      textShadow: '0px 1px 3px rgba(0, 0, 0, 0.3)',
                      fontFamily: timeFont === 'digital' ? 'DigitalDisplayRegular-ODEO, monospace' : "'Orbitron', sans-serif"
                    }}
                  >
                      {formatDate(currentTime)}
                  </div>
                </div>
              )}
          </div>

          <div className="button-container left" style={{ 
            position: 'absolute',
            left: '10px',
            top: '82px',
            width: '200px',
            zIndex: 10,
            marginLeft: '-30px',
            paddingLeft: '72px',
            paddingTop: '1rem',
            paddingBottom: '1rem',
            display: 'flex',
            alignItems: 'center'
          }}>
              <div className="relative ml-4">
                  <WiiStyleButton
                onContextMenu={e => handleButtonContextMenu(0, e)}
                onClick={() => handleButtonClick(0)}
                onMouseDown={() => setActiveButton('left')}
                onMouseUp={() => setActiveButton(null)}
                onMouseLeave={() => setActiveButton(null)}
                useAdaptiveColor={buttonConfigs[0]?.useAdaptiveColor}
                useGlowEffect={buttonConfigs[0]?.useGlowEffect}
                glowStrength={buttonConfigs[0]?.glowStrength}
                useGlassEffect={buttonConfigs[0]?.useGlassEffect}
                glassOpacity={buttonConfigs[0]?.glassOpacity}
                glassBlur={buttonConfigs[0]?.glassBlur}
                glassBorderOpacity={buttonConfigs[0]?.glassBorderOpacity}
                glassShineOpacity={buttonConfigs[0]?.glassShineOpacity}
                ribbonGlowColor={propRibbonGlowColor}
                style={{ 
                  marginLeft: 16,
                  transform: activeButton === 'left' ? 'scale(0.95)' : 'scale(1)',
                  filter: activeButton === 'left' ? 'brightness(0.9)' : 'brightness(1)',
                  transition: 'transform 0.1s ease, filter 0.1s ease'
                }}
              >
                {buttonConfigs[0] && buttonConfigs[0].type === 'text' ? (
                  <span 
                    className="text-wii-gray-dark font-bold text-sm"
                    style={{
                      fontFamily: buttonConfigs[0].textFont === 'digital' ? 'DigitalDisplayRegular-ODEO, monospace' : "'Orbitron', sans-serif"
                    }}
                  >
                    {buttonConfigs[0].text || 'Wii'}
                  </span>
                ) : buttonConfigs[0] && buttonConfigs[0].icon === 'palette' ? (
                  <svg className="palette-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0099ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="13.5" cy="6.5" r="2.5"/>
                    <circle cx="17.5" cy="10.5" r="2.5"/>
                    <circle cx="8.5" cy="7.5" r="2.5"/>
                    <circle cx="6.5" cy="12.5" r="2.5"/>
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                  </svg>
                ) : buttonConfigs[0] && buttonConfigs[0].icon === 'star' ? (
                  <svg className="star-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0099ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                  </svg>
                ) : buttonConfigs[0] && buttonConfigs[0].icon === 'heart' ? (
                  <svg className="heart-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0099ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                ) : buttonConfigs[0] && buttonConfigs[0].icon ? (
                  <img 
                    src={getImageSource(buttonConfigs[0].icon, buttonConfigs[0].useAdaptiveColor)} 
                    alt="icon" 
                    style={{ 
                      maxHeight: 40, 
                      maxWidth: 40,
                      filter: getIconFilter(buttonConfigs[0].useWiiGrayFilter)
                    }} 
                  />
                ) : (
                  <span className="text-wii-gray-dark font-bold text-sm">Wii</span>
                )}
              </WiiStyleButton>
              </div>
          </div>
          {/* Restore settings button to original absolute position with glass effect */}
          <div 
            className={`sd-card-button absolute z-10 settings-cog-button glass-effect`}
            style={{ left: '220px', top: '158px', backdropFilter: 'blur(12px) saturate(1.5)', background: 'rgba(255,255,255,0.45)', border: '1.5px solid rgba(180,180,200,0.18)', boxShadow: '0 2px 16px 0 rgba(80,80,120,0.07)' }}
            onClick={(e) => handleSettingsClick(e)}
            onContextMenu={handleDockEffectsContextMenu}
            title="Settings (Left-click for Quick Settings, Right-click for Dock Effects)"
          >
              <svg width="28" height="28" viewBox="0 0 24 24" className="text-wii-gray-dark">
                <path fill="currentColor" d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
              </svg>
          </div>
          {/* Presets Button: slightly below and to the right of the time container */}
          {showPresetsButton && (
            <WiiStyleButton
              className="sd-card-button presets-cog-button glass-effect"
              style={{ 
                position: 'absolute',
                left: 'calc(50% + 170px)', 
                top: '170px', 
                backdropFilter: 'blur(12px) saturate(1.5)', 
                background: 'rgba(255,255,255,0.45)', 
                border: '1.5px solid rgba(180,180,200,0.18)', 
                boxShadow: '0 2px 16px 0 rgba(80,80,120,0.07)',
                width: '56px',
                height: '56px',
                minWidth: '56px',
                transform: activeButton === 'presets' ? 'scale(0.95)' : 'scale(1)',
                filter: activeButton === 'presets' ? 'brightness(0.9)' : 'brightness(1)',
                transition: 'transform 0.1s ease, filter 0.1s ease'
              }}
              onClick={onPresetsClick}
              onContextMenu={handlePresetsButtonContextMenu}
              onMouseDown={() => setActiveButton('presets')}
              onMouseUp={() => setActiveButton(null)}
              onMouseLeave={() => setActiveButton(null)}
              title="Customize Looks (Right-click to customize button)"
              useAdaptiveColor={presetsButtonConfig?.useAdaptiveColor}
              useGlowEffect={presetsButtonConfig?.useGlowEffect}
              glowStrength={presetsButtonConfig?.glowStrength}
              useGlassEffect={presetsButtonConfig?.useGlassEffect}
              glassOpacity={presetsButtonConfig?.glassOpacity}
              glassBlur={presetsButtonConfig?.glassBlur}
              glassBorderOpacity={presetsButtonConfig?.glassBorderOpacity}
              glassShineOpacity={presetsButtonConfig?.glassShineOpacity}
              ribbonGlowColor={propRibbonGlowColor}
            >
            {/* Dynamic icon based on configuration */}
            {presetsButtonConfig.type === 'text' ? (
              <span 
                className="text-wii-gray-dark font-bold text-sm"
                style={{
                  fontFamily: presetsButtonConfig.textFont === 'digital' ? 'DigitalDisplayRegular-ODEO, monospace' : "'Orbitron', sans-serif"
                }}
              >
                {presetsButtonConfig.text || '🎨'}
              </span>

            ) : presetsButtonConfig.icon === 'palette' ? (
              <svg className="palette-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0099ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="13.5" cy="6.5" r="2.5"/>
                <circle cx="17.5" cy="10.5" r="2.5"/>
                <circle cx="8.5" cy="7.5" r="2.5"/>
                <circle cx="6.5" cy="12.5" r="2.5"/>
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
              </svg>
            ) : presetsButtonConfig.icon === 'star' ? (
              <svg className="star-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0099ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
              </svg>
            ) : presetsButtonConfig.icon === 'heart' ? (
              <svg className="heart-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0099ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            ) : presetsButtonConfig.icon ? (
              <img 
                src={getImageSource(presetsButtonConfig.icon, presetsButtonConfig.useAdaptiveColor)} 
                alt="icon" 
                style={{ 
                  maxHeight: 28, 
                  maxWidth: 28,
                  filter: getIconFilter(presetsButtonConfig.useWiiGrayFilter)
                }} 
              />
            ) : (
              <span style={{ fontSize: 20, color: '#0099ff' }}>🎨</span>
            )}
            </WiiStyleButton>
          )}

          <div className="button-container right" style={{ 
            position: 'absolute',
            right: '0px',
            top: '82px',
            width: '200px',
            zIndex: 10,
            marginRight: '-30px',
            paddingRight: '120px',
            paddingTop: '1rem',
            paddingBottom: '1rem',
            display: 'flex',
            alignItems: 'center'
          }}>
              <div className="relative ml-4">
                  <WiiStyleButton
                    onContextMenu={e => handleButtonContextMenu(1, e)}
                    onClick={() => handleButtonClick(1)}
                    onMouseDown={() => setActiveButton('right')}
                    onMouseUp={() => setActiveButton(null)}
                    onMouseLeave={() => setActiveButton(null)}
                    useAdaptiveColor={buttonConfigs[1]?.useAdaptiveColor}
                    useGlowEffect={buttonConfigs[1]?.useGlowEffect}
                    glowStrength={buttonConfigs[1]?.glowStrength}
                    useGlassEffect={buttonConfigs[1]?.useGlassEffect}
                    glassOpacity={buttonConfigs[1]?.glassOpacity}
                    glassBlur={buttonConfigs[1]?.glassBlur}
                    glassBorderOpacity={buttonConfigs[1]?.glassBorderOpacity}
                    glassShineOpacity={buttonConfigs[1]?.glassShineOpacity}
                    ribbonGlowColor={propRibbonGlowColor}
                    style={{
                      transform: activeButton === 'right' ? 'scale(0.95)' : 'scale(1)',
                      filter: activeButton === 'right' ? 'brightness(0.9)' : 'brightness(1)',
                      transition: 'transform 0.1s ease, filter 0.1s ease'
                    }}
                  >
                      {buttonConfigs[1] && buttonConfigs[1].type === 'text' ? (
                        <span 
                          className="text-wii-gray-dark font-bold text-sm"
                          style={{
                            fontFamily: buttonConfigs[1].textFont === 'digital' ? 'DigitalDisplayRegular-ODEO, monospace' : "'Orbitron', sans-serif"
                          }}
                        >
                          {buttonConfigs[1].text || ''}
                        </span>
                      ) : buttonConfigs[1] && buttonConfigs[1].icon === 'palette' ? (
                        <svg className="palette-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0099ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="13.5" cy="6.5" r="2.5"/>
                          <circle cx="17.5" cy="10.5" r="2.5"/>
                          <circle cx="8.5" cy="7.5" r="2.5"/>
                          <circle cx="6.5" cy="12.5" r="2.5"/>
                          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                        </svg>
                      ) : buttonConfigs[1] && buttonConfigs[1].icon === 'star' ? (
                        <svg className="star-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0099ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                        </svg>
                      ) : buttonConfigs[1] && buttonConfigs[1].icon === 'heart' ? (
                        <svg className="heart-icon" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0099ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                      ) : buttonConfigs[1] && buttonConfigs[1].icon ? (
                        <img 
                          src={getImageSource(buttonConfigs[1].icon, buttonConfigs[1].useAdaptiveColor)} 
                          alt="icon" 
                          style={{ 
                            maxHeight: 40, 
                            maxWidth: 40,
                            filter: getIconFilter(buttonConfigs[1].useWiiGrayFilter)
                          }} 
                        />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-wii-gray-dark"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      )}
                  </WiiStyleButton>
              </div>
          </div>


              </footer>

        {/* Admin Menu */}
        {showAdminMenu && (
          <div className="admin-menu">
            {process.env.NODE_ENV === 'development' && console.log('Rendering admin menu with actions:', buttonConfigs[0]?.powerActions?.length || 0, buttonConfigs[0]?.powerActions?.map(a => a.name) || [])}
            <div
              className="context-menu-content"
              style={{ 
                position: 'absolute', 
                bottom: '120px', // Position above the button instead of below
                left: '250px', // Position next to the left button (approximately where the first button is)
                zIndex: 1000,
                minWidth: '280px',
                maxWidth: '400px',
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                overflow: 'hidden'
              }}
            >
              <div className="settings-menu-group-label" style={{ 
                padding: '12px 16px 8px 16px',
                background: '#f5f5f5',
                borderBottom: '1px solid #e0e0e0',
                fontWeight: '600',
                color: '#333'
              }}>
                Admin Actions
              </div>
              {buttonConfigs[0]?.powerActions?.map((action, index) => (
                <div
                  key={action.id}
                  className="context-menu-item"
                  onClick={() => handleAdminActionClick(action)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    borderBottom: index < (buttonConfigs[0]?.powerActions?.length || 0) - 1 ? '1px solid #f0f0f0' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{action.icon}</span>
                  <div>
                    <div style={{ fontWeight: '500' }}>{action.name}</div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#666',
                      fontFamily: 'monospace',
                      marginTop: '2px'
                    }}>
                      {action.command}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Click outside to close admin menu */}
        {showAdminMenu && (
          <div 
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              zIndex: 999,
              background: 'transparent'
            }} 
            onClick={() => {
              if (process.env.NODE_ENV === 'development') {
        
              }
              setShowAdminMenu(false);
            }}
          />
        )}


      <Suspense fallback={<div>Loading Update Modal...</div>}>
        <LazyUpdateModal 
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
        />
      </Suspense>


      {showPrimaryActionsModal && (
        <Suspense fallback={<div>Loading Primary Actions Modal...</div>}>
          <LazyPrimaryActionsModal
            isOpen={showPrimaryActionsModal}
            onClose={handlePrimaryActionsCancel}
            onSave={handlePrimaryActionsSave}
            config={buttonConfigs?.[activeButtonIndex]}
            buttonIndex={activeButtonIndex}
            preavailableIcons={preavailableIcons}
            ribbonGlowColor={propRibbonGlowColor}
          />
        </Suspense>
      )}
      {showPresetsButtonModal && (
        <Suspense fallback={<div>Loading Presets Button Modal...</div>}>
          <LazyPrimaryActionsModal
            isOpen={showPresetsButtonModal}
            onClose={handlePresetsButtonCancel}
            onSave={handlePresetsButtonSave}
            config={presetsButtonConfig}
            buttonIndex="presets"
            preavailableIcons={preavailableIcons}
            title="Customize Presets Button"
            ribbonGlowColor={propRibbonGlowColor}
          />
        </Suspense>
      )}


      {/* Dock Effects Modal */}
      {showDockEffectsModal && (
        <Suspense fallback={<div>Loading Dock Effects Modal...</div>}>
          <LazyDockEffectsModal
            isOpen={showDockEffectsModal}
            onClose={() => setShowDockEffectsModal(false)}
            onSettingsChange={onSettingsChange}
            settings={particleSettings}
            ribbonGlowColor={propRibbonGlowColor}
          />
        </Suspense>
      )}


    </>
  );
};

// Custom comparison function for React.memo
const arePropsEqual = (prevProps, nextProps) => {
  return (
    prevProps.useCustomCursor === nextProps.useCustomCursor &&
    prevProps.glassWiiRibbon === nextProps.glassWiiRibbon &&
    prevProps.animatedOnHover === nextProps.animatedOnHover &&
    prevProps.enableTimePill === nextProps.enableTimePill &&
    prevProps.timePillBlur === nextProps.timePillBlur &&
    prevProps.timePillOpacity === nextProps.timePillOpacity &&
    prevProps.startInFullscreen === nextProps.startInFullscreen &&
    prevProps.ribbonColor === nextProps.ribbonColor &&
    prevProps.ribbonGlowColor === nextProps.ribbonGlowColor &&
    prevProps.ribbonGlowStrength === nextProps.ribbonGlowStrength &&
    prevProps.ribbonGlowStrengthHover === nextProps.ribbonGlowStrengthHover &&
    prevProps.ribbonDockOpacity === nextProps.ribbonDockOpacity &&
    prevProps.timeColor === nextProps.timeColor &&
    prevProps.timeFormat24hr === nextProps.timeFormat24hr &&
    prevProps.timeFont === nextProps.timeFont &&
    prevProps.showPresetsButton === nextProps.showPresetsButton &&
    prevProps.glassOpacity === nextProps.glassOpacity &&
    prevProps.glassBlur === nextProps.glassBlur &&
    prevProps.glassBorderOpacity === nextProps.glassBorderOpacity &&
    prevProps.glassShineOpacity === nextProps.glassShineOpacity &&
    JSON.stringify(prevProps.presetsButtonConfig) === JSON.stringify(nextProps.presetsButtonConfig) &&
    JSON.stringify(prevProps.particleSettings) === JSON.stringify(nextProps.particleSettings)
  );
};

const WiiRibbon = React.memo(WiiRibbonComponent, arePropsEqual);

export default WiiRibbon; 