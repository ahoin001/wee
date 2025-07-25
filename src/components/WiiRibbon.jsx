import React, { useState, useEffect } from 'react';
import SoundModal from './SoundModal';
import WallpaperModal from './WallpaperModal';
import GeneralSettingsModal from './GeneralSettingsModal';
import PrimaryActionsModal from './PrimaryActionsModal';
import TimeSettingsModal from './TimeSettingsModal';
import RibbonSettingsModal from './RibbonSettingsModal';
import UpdateModal from './UpdateModal';
import WiiStyleButton from './WiiStyleButton';
import './WiiRibbon.css';
import reactIcon from '../assets/react.svg';
import intervalManager from '../utils/IntervalManager';
import useUIStore from '../utils/useUIStore';
// import more icons as needed

// Add a helper function to convert opacity to hex alpha if needed
function hexAlpha(opacity) {
  // Clamp and convert to 0-255, then to 2-digit hex
  const a = Math.round(Math.max(0, Math.min(1, opacity)) * 255);
  return a === 255 ? '' : a.toString(16).padStart(2, '0');
}

const WiiRibbon = ({ onSettingsClick, onSettingsChange, onToggleDarkMode, onToggleCursor, useCustomCursor, glassWiiRibbon, onGlassWiiRibbonChange, animatedOnHover, setAnimatedOnHover, enableTimePill, timePillBlur, timePillOpacity, startInFullscreen, setStartInFullscreen, ribbonColor: propRibbonColor, onRibbonColorChange, recentRibbonColors, onRecentRibbonColorChange, ribbonGlowColor: propRibbonGlowColor, onRibbonGlowColorChange, recentRibbonGlowColors, onRecentRibbonGlowColorChange, ribbonGlowStrength: propRibbonGlowStrength, ribbonGlowStrengthHover: propRibbonGlowStrengthHover, setShowPresetsModal, ribbonDockOpacity: propRibbonDockOpacity, onRibbonDockOpacityChange, timeColor, timeFormat24hr, timeFont, presetsButtonConfig, showPresetsButton }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Use Zustand store for settings menu and modal states
  const { 
    showSettingsMenu, 
    settingsMenuFadeIn, 
    openSettingsMenu, 
    closeSettingsMenu,
    showSoundModal,
    showWallpaperModal,
    showPresetsModal,
    openSoundModal,
    closeSoundModal,
    openWallpaperModal,
    closeWallpaperModal,
    openPresetsModal,
    closePresetsModal
  } = useUIStore();
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [isFrameless, setIsFrameless] = useState(true);
  const [showGeneralModal, setShowGeneralModal] = useState(false);
  const [showTimeSettingsModal, setShowTimeSettingsModal] = useState(false);
  const [showRibbonSettingsModal, setShowRibbonSettingsModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
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

  // Load configs from settings on mount
  useEffect(() => {
    async function loadButtonConfigs() {
      if (window.api?.settings?.get) {
        const settings = await window.api.settings.get();
        console.log('WiiRibbon: Loading settings:', settings);
        if (settings && settings.ribbonButtonConfigs) {
          console.log('WiiRibbon: Found ribbonButtonConfigs:', settings.ribbonButtonConfigs);
          // Ensure each button config has all required properties
          const configsWithAdaptiveColor = settings.ribbonButtonConfigs.map(config => ({
            ...config,
            useAdaptiveColor: config.useAdaptiveColor ?? false,
            useGlowEffect: config.useGlowEffect ?? false,
            glowStrength: config.glowStrength ?? 20,
            useGlassEffect: config.useGlassEffect ?? false,
            glassOpacity: config.glassOpacity ?? 0.18,
            glassBlur: config.glassBlur ?? 2.5,
            glassBorderOpacity: config.glassBorderOpacity ?? 0.5,
            glassShineOpacity: config.glassShineOpacity ?? 0.7
          }));
          setButtonConfigs(configsWithAdaptiveColor);
        } else {
          console.log('WiiRibbon: No ribbonButtonConfigs found in settings, keeping defaults');
        }
      }
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
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling up to the footer
    setShowTimeSettingsModal(true);
  };

  const handleRibbonContextMenu = (e) => {
    e.preventDefault();
    setShowRibbonSettingsModal(true);
  };

  const handlePrimaryActionsSave = (newConfig) => {
    const newConfigs = [...buttonConfigs];
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

  // Watch for time color changes
  useEffect(() => {
    const checkTimeColor = () => {
      const newTimeColor = window.settings?.timeColor || '#ffffff';
      if (newTimeColor !== timeColor) {
        // setTimeColor(newTimeColor); // This line is removed as per the edit hint
      }
    };
    
    // Check immediately
    checkTimeColor();
    
    // Set up an interval to check for changes
    const taskId = intervalManager.addTask(checkTimeColor, 1000, 'time-color-check');
    
    return () => intervalManager.removeTask(taskId);
  }, [timeColor]);

  // Watch for time format changes
  useEffect(() => {
    const checkTimeFormat = () => {
      const newTimeFormat = window.settings?.timeFormat24hr ?? true;
      if (newTimeFormat !== timeFormat24hr) {
        // setTimeFormat24hr(newTimeFormat); // This line is removed as per the edit hint
      }
    };
    
    // Check immediately
    checkTimeFormat();
    
    // Set up an interval to check for changes
    const taskId = intervalManager.addTask(checkTimeFormat, 1000, 'time-format-check');
    
    return () => intervalManager.removeTask(taskId);
  }, [timeFormat24hr]);

  // Watch for ribbon color changes
  useEffect(() => {
    const checkRibbonColor = () => {
      const newRibbonColor = window.settings?.ribbonColor || '#e0e6ef';
      if (newRibbonColor !== propRibbonColor) {
        // setRibbonColor(newRibbonColor); // This line is removed as per the edit hint
      }
      const newRibbonGlowColor = window.settings?.ribbonGlowColor || '#0099ff';
      if (newRibbonGlowColor !== propRibbonGlowColor) {
        // setRibbonGlowColor(newRibbonGlowColor); // This line is removed as per the edit hint
      }
    };
    checkRibbonColor();
    const taskId = intervalManager.addTask(checkRibbonColor, 1000, 'ribbon-color-check');
    return () => intervalManager.removeTask(taskId);
  }, [propRibbonColor, propRibbonGlowColor]);
  
  // Listen for update status events
  useEffect(() => {
    const handleUpdateStatus = (data) => {
      console.log('[WiiRibbon] Update status received:', data);
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

  const formatTime = (date) => {
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

  const handleSettingsClick = () => {
    openSettingsMenu();
  };

  const handleMenuClose = () => {
    closeSettingsMenu();
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
    const config = buttonConfigs[index];
    if (!config || !config.actionType || !config.action || config.actionType === 'none') return;
    if (window.api && window.api.launchApp) {
      if (config.actionType === 'exe') {
        window.api.launchApp({ type: 'exe', path: config.action });
      } else if (config.actionType === 'url') {
        window.api.launchApp({ type: 'url', path: config.action });
      }
    } else {
      // Fallback: try window.open for URLs
      if (config.actionType === 'url') {
        window.open(config.action, '_blank');
      }
    }
  };

  return (
    <>
      <footer className="interactive-footer" onContextMenu={handleRibbonContextMenu}>
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
                      <feGaussianBlur stdDeviation={window.settings?.glassBlur || 2.5} result="blur" />
                      <feComponentTransfer>
                        <feFuncA type="linear" slope="1.2" />
                      </feComponentTransfer>
                      <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <linearGradient id="glass-shine" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color={`rgba(255,255,255,${window.settings?.glassShineOpacity || 0.7})`} />
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
                  fill={glassWiiRibbon ? `rgba(255,255,255,${window.settings?.glassOpacity || 0.18})` : propRibbonColor + (propRibbonDockOpacity !== undefined ? hexAlpha(propRibbonDockOpacity) : '')}
                  stroke={`rgba(255,255,255,${window.settings?.glassBorderOpacity || 0.5})`}
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
                    style={{ opacity: window.settings?.glassShineOpacity || 0.7, pointerEvents: 'none' }}
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
                      marginBottom: '8px'
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
                <div onContextMenu={handleTimeContextMenu}>
                  <div 
                    id="time" 
                    className="text-4xl font-bold" 
                    style={{ 
                      fontFamily: timeFont === 'digital' ? 'DigitalDisplayRegular-ODEO, monospace' : "'Orbitron', sans-serif", 
                      color: timeColor,
                      textShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                      {formatTime(currentTime)}
                  </div>
                  <div 
                    id="date" 
                    className="text-lg font-bold mt-8" 
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

          <div className="button-container left absolute w-[120px] left-0 z-10 ml-[-30px] pl-[120px] py-4 bg-white/20 rounded-r-[6rem] flex items-center shadow-lg" style={{ top: '82px' }}>
              <WiiStyleButton
                onContextMenu={e => handleButtonContextMenu(0, e)}
                onClick={() => handleButtonClick(0)}
                useAdaptiveColor={buttonConfigs[0]?.useAdaptiveColor}
                useGlowEffect={buttonConfigs[0]?.useGlowEffect}
                glowStrength={buttonConfigs[0]?.glowStrength}
                useGlassEffect={buttonConfigs[0]?.useGlassEffect}
                glassOpacity={buttonConfigs[0]?.glassOpacity}
                glassBlur={buttonConfigs[0]?.glassBlur}
                glassBorderOpacity={buttonConfigs[0]?.glassBorderOpacity}
                glassShineOpacity={buttonConfigs[0]?.glassShineOpacity}
                ribbonGlowColor={propRibbonGlowColor}
                style={{ marginLeft: 16 }}
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
                    src={buttonConfigs[0].icon} 
                    alt="icon" 
                    style={{ 
                      maxHeight: 40, 
                      maxWidth: 40,
                      filter: buttonConfigs[0].useWiiGrayFilter ? 'grayscale(100%) brightness(0.6) contrast(1.2)' : 'none'
                    }} 
                  />
                ) : (
                  <span className="text-wii-gray-dark font-bold text-sm">Wii</span>
                )}
              </WiiStyleButton>
          </div>
          {/* Restore settings button to original absolute position with glass effect */}
          <div 
            className={`sd-card-button absolute z-10 settings-cog-button glass-effect`}
            style={{ left: '220px', top: '158px', backdropFilter: 'blur(12px) saturate(1.5)', background: 'rgba(255,255,255,0.45)', border: '1.5px solid rgba(180,180,200,0.18)', boxShadow: '0 2px 16px 0 rgba(80,80,120,0.07)' }}
            onClick={handleSettingsClick}
            title="Settings"
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
                minWidth: '56px'
              }}
              onClick={openPresetsModal}
              onContextMenu={handlePresetsButtonContextMenu}
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
                src={presetsButtonConfig.icon} 
                alt="icon" 
                style={{ 
                  maxHeight: 28, 
                  maxWidth: 28,
                  filter: presetsButtonConfig.useWiiGrayFilter ? 'grayscale(100%) brightness(0.6) contrast(1.2)' : 'none'
                }} 
              />
            ) : (
              <span style={{ fontSize: 20, color: '#0099ff' }}>🎨</span>
            )}
            </WiiStyleButton>
          )}

          <div className="button-container right absolute w-[120px] right-0 z-10 mr-[-30px] pr-[120px] py-4 bg-white/20 rounded-l-[6rem] flex items-center shadow-lg" style={{ top: '82px' }}>
              <div className="relative ml-4">
                  <WiiStyleButton
                    onContextMenu={e => handleButtonContextMenu(1, e)}
                    onClick={() => handleButtonClick(1)}
                    useAdaptiveColor={buttonConfigs[1]?.useAdaptiveColor}
                    useGlowEffect={buttonConfigs[1]?.useGlowEffect}
                    glowStrength={buttonConfigs[1]?.glowStrength}
                    useGlassEffect={buttonConfigs[1]?.useGlassEffect}
                    glassOpacity={buttonConfigs[1]?.glassOpacity}
                    glassBlur={buttonConfigs[1]?.glassBlur}
                    glassBorderOpacity={buttonConfigs[1]?.glassBorderOpacity}
                    glassShineOpacity={buttonConfigs[1]?.glassShineOpacity}
                    ribbonGlowColor={propRibbonGlowColor}
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
                          src={buttonConfigs[1].icon} 
                          alt="icon" 
                          style={{ 
                            maxHeight: 40, 
                            maxWidth: 40,
                            filter: buttonConfigs[1].useWiiGrayFilter ? 'grayscale(100%) brightness(0.6) contrast(1.2)' : 'none'
                          }} 
                        />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-wii-gray-dark"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      )}
                  </WiiStyleButton>
              </div>
          </div>

          {/* Settings Menu */}
          {showSettingsMenu && (
            <div className="settings-menu">
              <div
                className={`context-menu-content settings-menu-fade${settingsMenuFadeIn ? ' in' : ''}`}
                style={{ position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}
              >
                {/* Appearance Group */}
                <div className="settings-menu-group-label">Appearance</div>
                <div className="context-menu-item" onClick={() => { openWallpaperModal(); handleMenuClose(); }}>
                  Change Wallpaper
                </div>
                <div className="context-menu-item" onClick={() => { setShowTimeSettingsModal(true); handleMenuClose(); }}>
                  Customize Time
                </div>
                <div className="context-menu-item" onClick={() => { setShowRibbonSettingsModal(true); handleMenuClose(); }}>
                  Customize Ribbon
                </div>
                <div className="context-menu-item" onClick={() => { onToggleDarkMode(); handleMenuClose(); }}>
                  Toggle Dark Mode
                </div>
                <div className="context-menu-item" onClick={() => { onToggleCursor(); handleMenuClose(); }}>
                  {useCustomCursor ? 'Use Default Cursor' : 'Use Wii Cursor'}
                </div>
                {/* <div className="context-menu-item" onClick={() => { 
                  if (barType === 'flat') {
                    onBarTypeChange('wii-ribbon');
                  } else if (barType === 'wii-ribbon') {
                    onBarTypeChange('wii');
                  } else {
                    onBarTypeChange('flat');
                  }
                  handleMenuClose(); 
                }}>
                  {barType === 'flat' ? 'Switch to Wii Ribbon' : 
                   barType === 'wii-ribbon' ? 'Switch to Wii Bar' : 
                   'Switch to Flat Bar'}
                </div> */}
                <div className="context-menu-item" onClick={() => { openPresetsModal(); handleMenuClose(); }}>
                  🎨 Presets
                </div>
                <div className="settings-menu-separator" />
                {/* Window Group */}
                <div className="settings-menu-group-label">Window</div>
                <div className="context-menu-item" onClick={() => { api.toggleFullscreen(); handleMenuClose(); }}>
                  {isFullscreen ? 'Window Mode' : 'Fullscreen Mode'}
                </div>
                <div className="context-menu-item" onClick={() => { api.minimize(); handleMenuClose(); }}>
                  Minimize Window
                </div>
                <div className="settings-menu-separator" />
                {/* System Group */}
                <div className="settings-menu-group-label">System</div>
                
                <div className="context-menu-item" onClick={() => { setShowGeneralModal(true); handleMenuClose(); }}>
                  General Settings
                </div>
                <div className="context-menu-item" onClick={() => { openSoundModal(); handleMenuClose(); }}>
                  Change Sounds
                </div>
                <div className="context-menu-item" onClick={() => { setShowUpdateModal(true); handleMenuClose(); }}>
                  🔄 Check for Updates
                  {updateAvailable && (
                    <span style={{
                      backgroundColor: '#ff4444',
                      color: 'white',
                      borderRadius: '50%',
                      width: '8px',
                      height: '8px',
                      display: 'inline-block',
                      marginLeft: '8px',
                      animation: 'pulse 2s infinite'
                    }} />
                  )}
                </div>
                <div className="context-menu-item" onClick={() => { api.close(); handleMenuClose(); }}>
                  Close App
                </div>
                <div className="settings-menu-separator" />
                {/* General Group */}
                {/* <div className="settings-menu-group-label">General</div> */}
                <div className="context-menu-item" style={{ color: '#dc3545', fontWeight: 600 }}
                  onClick={async () => {
                    handleMenuClose();
                    if (window.confirm('Are you sure you want to reset all appearance settings to default? This will not affect your saved presets.')) {
                      // Reset all visual/cosmetic settings to their original first-time user defaults
                      if (typeof onSettingsChange === 'function') {
                        onSettingsChange({
                          // Ribbon & Glow
                          ribbonColor: '#e0e6ef',
                          ribbonGlowColor: '#0099ff',
                          ribbonGlowStrength: 20,
                          ribbonGlowStrengthHover: 28,
                          ribbonDockOpacity: 1,
                          glassWiiRibbon: false,
                          glassOpacity: 0.18,
                          glassBlur: 2.5,
                          glassBorderOpacity: 0.5,
                          glassShineOpacity: 0.7,
                          recentRibbonColors: [],
                          recentRibbonGlowColors: [],
                          // Time & Pill
                          timeColor: '#ffffff',
                          timeFormat24hr: true,
                          enableTimePill: true,
                          timePillBlur: 8,
                          timePillOpacity: 0.05,
                          timeFont: 'default',
                          // Wallpaper & Effects
                          wallpaper: null,
                          wallpaperOpacity: 1,
                          wallpaperBlur: 0,
                          savedWallpapers: [],
                          likedWallpapers: [],
                          cycleWallpapers: false,
                          cycleInterval: 30,
                          cycleAnimation: 'fade',
                          slideDirection: 'right',
                          crossfadeDuration: 1.2,
                          crossfadeEasing: 'ease-out',
                          slideRandomDirection: false,
                          slideDuration: 1.5,
                          slideEasing: 'ease-out',
                          channelAutoFadeTimeout: 5,
                          ribbonButtonConfigs: [{ type: 'text', text: 'Wii' }, { type: 'text', text: 'Mail' }]
                        });
                      }
                      // Do NOT reset presets
                    }
                  }}
                >
                  Reset Appearance
                </div>
              </div>
            </div>
          )}
          
          {/* Click outside to close */}
          {showSettingsMenu && (
            <div 
              style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                zIndex: 999 
              }} 
              onClick={handleMenuClose}
            />
          )}
      </footer>

      <SoundModal 
        isOpen={showSoundModal}
        onClose={closeSoundModal}
        onSettingsChange={onSettingsChange}
      />
      <UpdateModal 
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
      />
      {/* Wallpaper Modal */}
      {showWallpaperModal && (
        <WallpaperModal
          isOpen={showWallpaperModal}
          onClose={closeWallpaperModal}
          onSettingsChange={onSettingsChange}
          currentWallpaper={window.settings?.wallpaper}
          currentOpacity={window.settings?.wallpaperOpacity}
          savedWallpapers={window.settings?.savedWallpapers || []}
          likedWallpapers={window.settings?.likedWallpapers || []}
          cycleWallpapers={window.settings?.cycleWallpapers}
          cycleInterval={window.settings?.cycleInterval}
          cycleAnimation={window.settings?.cycleAnimation}
        />
      )}
      {/* General Settings Modal */}
      {showGeneralModal && (
        <GeneralSettingsModal 
          isOpen={showGeneralModal} 
          onClose={() => setShowGeneralModal(false)} 
          immersivePip={immersivePip} 
          setImmersivePip={val => {
            setImmersivePip(val);
            localStorage.setItem('immersivePip', JSON.stringify(val));
          }}
          glassWiiRibbon={glassWiiRibbon}
          setGlassWiiRibbon={onGlassWiiRibbonChange}
          animatedOnHover={!!animatedOnHover}
          setAnimatedOnHover={setAnimatedOnHover}
          startInFullscreen={startInFullscreen}
          setStartInFullscreen={setStartInFullscreen}
          showPresetsButton={showPresetsButton}
          setShowPresetsButton={val => onSettingsChange({ showPresetsButton: val })}
          channelAnimation={window.settings?.channelAnimation}
          kenBurnsEnabled={window.settings?.kenBurnsEnabled}
          kenBurnsMode={window.settings?.kenBurnsMode}
          kenBurnsHoverScale={window.settings?.kenBurnsHoverScale}
          kenBurnsAutoplayScale={window.settings?.kenBurnsAutoplayScale}
          kenBurnsSlideshowScale={window.settings?.kenBurnsSlideshowScale}
          kenBurnsHoverDuration={window.settings?.kenBurnsHoverDuration}
          kenBurnsAutoplayDuration={window.settings?.kenBurnsAutoplayDuration}
          kenBurnsSlideshowDuration={window.settings?.kenBurnsSlideshowDuration}
          kenBurnsCrossfadeDuration={window.settings?.kenBurnsCrossfadeDuration}
          kenBurnsForGifs={window.settings?.kenBurnsForGifs}
          kenBurnsForVideos={window.settings?.kenBurnsForVideos}
          kenBurnsEasing={window.settings?.kenBurnsEasing}
          kenBurnsAnimationType={window.settings?.kenBurnsAnimationType}
          kenBurnsCrossfadeReturn={window.settings?.kenBurnsCrossfadeReturn}
          kenBurnsTransitionType={window.settings?.kenBurnsTransitionType}
          onSettingsChange={onSettingsChange}
        />
      )}
      {showPrimaryActionsModal && (
        <PrimaryActionsModal
          isOpen={showPrimaryActionsModal}
          onClose={handlePrimaryActionsCancel}
          onSave={handlePrimaryActionsSave}
          config={buttonConfigs[activeButtonIndex]}
          buttonIndex={activeButtonIndex}
          preavailableIcons={preavailableIcons}
          ribbonGlowColor={propRibbonGlowColor}
        />
      )}
      {showPresetsButtonModal && (
        <PrimaryActionsModal
          isOpen={showPresetsButtonModal}
          onClose={handlePresetsButtonCancel}
          onSave={handlePresetsButtonSave}
          config={presetsButtonConfig}
          buttonIndex="presets"
          preavailableIcons={preavailableIcons}
          title="Customize Presets Button"
          ribbonGlowColor={propRibbonGlowColor}
        />
      )}
      {/* Time Settings Modal */}
      {showTimeSettingsModal && (
        <TimeSettingsModal
          isOpen={showTimeSettingsModal}
          onClose={() => setShowTimeSettingsModal(false)}
          onSettingsChange={onSettingsChange}
        />
      )}
      {/* Ribbon Settings Modal */}
      {showRibbonSettingsModal && (
        <RibbonSettingsModal
          isOpen={showRibbonSettingsModal}
          onClose={() => setShowRibbonSettingsModal(false)}
          onSettingsChange={onSettingsChange}
          glassWiiRibbon={glassWiiRibbon}
          setGlassWiiRibbon={onGlassWiiRibbonChange}
        />
      )}
    </>
  );
};

export default WiiRibbon; 