
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Channel from './components/Channel';
import ChannelModal from './components/ChannelModal';
import HomeButton from './components/HomeButton';
import SettingsButton from './components/SettingsButton';
import NotificationsButton from './components/NotificationsButton';
import WiiRibbon from './components/WiiRibbon';
import WallpaperModal from './components/WallpaperModal';
import './App.css';
import SplashScreen from './components/SplashScreen';
import PresetsModal from './components/PresetsModal';
import audioManager from './utils/AudioManager';
import intervalManager from './utils/IntervalManager';
import useAppLibraryStore from './utils/useAppLibraryStore';
import useUIStore from './utils/useUIStore';

// Safe fallback for modular APIs
const soundsApi = window.api?.sounds || {
  get: async () => ({}),
  set: async () => {},
  reset: async () => {},
};
const wallpapersApi = window.api?.wallpapers || {
  get: async () => ({}),
  set: async () => {},
  reset: async () => {},
};
const channelsApi = window.api?.channels || {
  get: async () => ({}),
  set: async () => {},
  reset: async () => {},
};
const resetAllApi = window.api?.resetAll || (async () => {});

// Replace all soundsApi.get/set for general settings with settingsApi.get/set
const settingsApi = window.api?.settings || {
  get: async () => ({}),
  set: async () => {},
};

function WiiCursor() {
  const cursorRef = useRef(null);
  const isHoveringRef = useRef(false);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    let lastX = 0;
    let lastY = 0;
    let isHovering = false;

    // Throttled mouse move handler using requestAnimationFrame
    const handleMouseMove = (e) => {
      if (animationFrameRef.current) return; // Skip if already scheduled
      
      animationFrameRef.current = requestAnimationFrame(() => {
        const x = e.clientX;
        const y = e.clientY;
        
        // Only update if position actually changed (prevents unnecessary DOM updates)
        if (x !== lastX || y !== lastY) {
          cursor.style.transform = `translate(${x}px, ${y}px)`;
          lastX = x;
          lastY = y;
        }
        
        animationFrameRef.current = null;
      });
    };

    // Optimized hover detection using event delegation
    const handleMouseOver = (e) => {
      const target = e.target;
      const shouldHover = target.closest('.channel, .circular-button, .context-menu-item');
      
      if (shouldHover !== isHovering) {
        isHovering = shouldHover;
        isHoveringRef.current = isHovering;
        
        if (isHovering) {
          cursor.classList.add('hover');
      } else {
          cursor.classList.remove('hover');
        }
      }
    };

    // Use passive listeners for better performance
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseover', handleMouseOver, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={cursorRef}
      className="wii-cursor"
    />
  );
}

function App() {
  // UI Store for global keyboard shortcuts and modal management
  const { 
    handleGlobalKeyPress,
    showPresetsModal,
    showWallpaperModal, 
    showSoundModal,
    closePresetsModal,
    closeWallpaperModal,
    closeSoundModal
  } = useUIStore();
  
  const [mediaMap, setMediaMap] = useState({});
  const [appPathMap, setAppPathMap] = useState({});
  const [channelConfigs, setChannelConfigs] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [useCustomCursor, setUseCustomCursor] = useState(true);
  const [soundSettings, setSoundSettings] = useState(null);
  const [backgroundAudio, setBackgroundAudio] = useState(null);
  const backgroundAudioRef = useRef(null);
  const [showDragRegion, setShowDragRegion] = useState(false);
  // Remove barType, defaultBarType, and related state
  const [glassWiiRibbon, setGlassWiiRibbon] = useState(false);
  const [glassOpacity, setGlassOpacity] = useState(0.18);
  const [glassBlur, setGlassBlur] = useState(2.5);
  const [glassBorderOpacity, setGlassBorderOpacity] = useState(0.5);
  const [glassShineOpacity, setGlassShineOpacity] = useState(0.7);
  const [animatedOnHover, setAnimatedOnHover] = useState(false);
  const [startInFullscreen, setStartInFullscreen] = useState(true);
  const [wallpaper, setWallpaper] = useState(null);
  const [wallpaperOpacity, setWallpaperOpacity] = useState(1);
  const [nextWallpaper, setNextWallpaper] = useState(null); // For smooth transitions
  const [isTransitioning, setIsTransitioning] = useState(false); // Track transition state
  const [slideDirection, setSlideDirection] = useState('right'); // 'left', 'right', 'up', 'down'
  const [crossfadeProgress, setCrossfadeProgress] = useState(0); // Separate state for crossfade
  const [slideProgress, setSlideProgress] = useState(0); // Separate state for slide
  const [savedWallpapers, setSavedWallpapers] = useState([]);
  const [likedWallpapers, setLikedWallpapers] = useState([]);
  const [cycleWallpapers, setCycleWallpapers] = useState(false);
  const [cycleInterval, setCycleInterval] = useState(30);
  const [cycleAnimation, setCycleAnimation] = useState('fade');
  const [crossfadeDuration, setCrossfadeDuration] = useState(1.2);
  const [crossfadeEasing, setCrossfadeEasing] = useState('ease-out');
  const [slideRandomDirection, setSlideRandomDirection] = useState(false);
  const [slideDuration, setSlideDuration] = useState(1.5);
  const [slideEasing, setSlideEasing] = useState('ease-out');
  // showWallpaperModal now managed by useUIStore
  const cycleTimeoutRef = useRef();
  const lastMusicIdRef = useRef(null);
  const lastMusicUrlRef = useRef(null);
  const lastMusicEnabledRef = useRef(false);
  const lastBgmEnabledRef = useRef(true);
  const lastPlaylistModeRef = useRef(false);
  const currentWallpaperRef = useRef(null); // Track current wallpaper to prevent re-creation
  // Remove toast state and logic
  // const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [timeColor, setTimeColor] = useState('#ffffff'); // Time display color
  const [recentTimeColors, setRecentTimeColors] = useState([]); // Time color history
  const [timeFormat24hr, setTimeFormat24hr] = useState(true); // Time format (24hr/12hr)
  const [enableTimePill, setEnableTimePill] = useState(true); // Time pill enabled
  const [timePillBlur, setTimePillBlur] = useState(8); // Time pill backdrop blur
  const [timePillOpacity, setTimePillOpacity] = useState(0.05); // Time pill background opacity
  const [channelAutoFadeTimeout, setChannelAutoFadeTimeout] = useState(5); // Channel auto-fade timeout
  const [ribbonButtonConfigs, setRibbonButtonConfigs] = useState(null); // Track ribbon button configs
  const [presetsButtonConfig, setPresetsButtonConfig] = useState({ type: 'icon', icon: 'star', useAdaptiveColor: false, useGlowEffect: false, glowStrength: 20, useGlassEffect: false, glassOpacity: 0.18, glassBlur: 2.5, glassBorderOpacity: 0.5, glassShineOpacity: 0.7 }); // Track presets button config
  const [showPresetsButton, setShowPresetsButton] = useState(false); // Show/hide presets button, disabled by default
  const currentTimeColorRef = useRef('#ffffff');
  const currentTimeFormatRef = useRef(true);
  const [lastChannelHoverTime, setLastChannelHoverTime] = useState(Date.now());
  const [channelOpacity, setChannelOpacity] = useState(1);
  const fadeTimeoutRef = useRef(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [openChannelModal, setOpenChannelModal] = useState(null); // Track which channel modal is open
  // Add ribbonColor state
  const [ribbonColor, setRibbonColor] = useState('#e0e6ef');
  // Add recentRibbonColors state
  const [recentRibbonColors, setRecentRibbonColors] = useState([]);
  // Add ribbonGlowColor and recentRibbonGlowColors state
  const [ribbonGlowColor, setRibbonGlowColor] = useState('#0099ff');
  const [recentRibbonGlowColors, setRecentRibbonGlowColors] = useState([]);
  // Add ribbonGlowStrength and ribbonGlowStrengthHover state
  const [ribbonGlowStrength, setRibbonGlowStrength] = useState(20);
  const [ribbonGlowStrengthHover, setRibbonGlowStrengthHover] = useState(28);
  const [ribbonDockOpacity, setRibbonDockOpacity] = useState(1);
  const [wallpaperBlur, setWallpaperBlur] = useState(0);
  const [timeFont, setTimeFont] = useState('default'); // Add this to state
  const [channelAnimation, setChannelAnimation] = useState(null); // Add to app state
  
  // Ken Burns settings
  const [kenBurnsEnabled, setKenBurnsEnabled] = useState(false);
  const [kenBurnsMode, setKenBurnsMode] = useState('hover');
  
  // Advanced Ken Burns settings
  const [kenBurnsHoverScale, setKenBurnsHoverScale] = useState(1.1);
  const [kenBurnsAutoplayScale, setKenBurnsAutoplayScale] = useState(1.15);
  const [kenBurnsSlideshowScale, setKenBurnsSlideshowScale] = useState(1.2);
  const [kenBurnsHoverDuration, setKenBurnsHoverDuration] = useState(8000);
  const [kenBurnsAutoplayDuration, setKenBurnsAutoplayDuration] = useState(12000);
  const [kenBurnsSlideshowDuration, setKenBurnsSlideshowDuration] = useState(10000);
  const [kenBurnsCrossfadeDuration, setKenBurnsCrossfadeDuration] = useState(1000);

  const [channels, setChannels] = useState(Array(12).fill({ empty: true }));
  // showPresetsModal now managed by useUIStore
  const [presets, setPresets] = useState([]);
  const [cachedSteamGames, setCachedSteamGames] = useState([]);
  const [cachedInstalledApps, setCachedInstalledApps] = useState([]);
  const [steamGamesLoading, setSteamGamesLoading] = useState(false);
  const [installedAppsLoading, setInstalledAppsLoading] = useState(false);
  const [steamGamesError, setSteamGamesError] = useState('');
  const [installedAppsError, setInstalledAppsError] = useState('');

  // Rescan Steam games
  const rescanSteamGames = async (customSteamPath) => {
    setSteamGamesLoading(true);
    setSteamGamesError('');
    try {
      const api = window.api?.steam;
      const args = customSteamPath ? { customPath: customSteamPath } : undefined;
      const result = await api.getInstalledGames(args);
      if (result.error) {
        setCachedSteamGames([]);
        setSteamGamesError(result.error);
      } else {
        setCachedSteamGames(result.games || []);
      }
    } catch (err) {
      setCachedSteamGames([]);
      setSteamGamesError(err.message || 'Failed to scan games.');
    } finally {
      setSteamGamesLoading(false);
    }
  };

  // Rescan installed apps
  const rescanInstalledApps = async () => {
    setInstalledAppsLoading(true);
    setInstalledAppsError('');
    try {
      const api = window.api?.apps;
      const apps = await api.getInstalled();
      setCachedInstalledApps(apps || []);
    } catch (err) {
      setCachedInstalledApps([]);
      setInstalledAppsError(err.message || 'Failed to scan apps.');
    } finally {
      setInstalledAppsLoading(false);
    }
  };

  // Preset handlers (must be inside App)
  const handleSavePreset = async (name, includeChannels = false, includeSounds = false, importedData = null) => {
    if (presets.length >= 6) return;
    const data = importedData || {
      // WiiRibbon & Glow
      ribbonColor, ribbonGlowColor, ribbonGlowStrength, ribbonGlowStrengthHover, glassWiiRibbon, glassOpacity, glassBlur, glassBorderOpacity, glassShineOpacity, recentRibbonColors, recentRibbonGlowColors,
      // Time & Pill
      timeColor, timeFormat24hr, enableTimePill, timePillBlur, timePillOpacity, timeFont, // always include timeFont
      // Wallpaper & Effects
      wallpaper, wallpaperOpacity, savedWallpapers, likedWallpapers, cycleWallpapers, cycleInterval, cycleAnimation, slideDirection, crossfadeDuration, crossfadeEasing, slideRandomDirection, slideDuration, slideEasing, wallpaperBlur,
      // Primary Action Buttons
      ribbonButtonConfigs, // This now includes textFont for each button
      // Presets Button
      presetsButtonConfig, // Track presets button configuration
    };
    
    // Include channel data if requested and not importing
    if (!importedData && includeChannels) {
      data.channels = channels;
      data.mediaMap = mediaMap;
      data.appPathMap = appPathMap;
    }
    
    // Include sound settings if requested and not importing
    if (!importedData && includeSounds) {
      // Get the complete sound library to save all sound configurations
      const soundLibrary = await soundsApi?.getLibrary();
      data.soundLibrary = soundLibrary;
    }
    
    console.log('Saving preset:', name, 'with timeFont:', timeFont, 'includeChannels:', includeChannels, 'includeSounds:', includeSounds, 'data:', data);
    setPresets(prev => [...prev, { name, data }].slice(0, 6));
  };
  const handleDeletePreset = (name) => {
    setPresets(prev => prev.filter(p => p.name !== name));
  };
  const handleImportPresets = (newPresets) => {
    setPresets(newPresets);
  };

  const handleReorderPresets = (reorderedPresets) => {
    setPresets(reorderedPresets);
  };
  const handleApplyPreset = async (preset) => {
    const d = preset.data;
    // WiiRibbon & Glow
    setRibbonColor(d.ribbonColor);
    setRibbonGlowColor(d.ribbonGlowColor);
    setRibbonGlowStrength(d.ribbonGlowStrength);
    setRibbonGlowStrengthHover(d.ribbonGlowStrengthHover);
    setGlassWiiRibbon(d.glassWiiRibbon);
    setGlassOpacity(d.glassOpacity);
    setGlassBlur(d.glassBlur);
    setGlassBorderOpacity(d.glassBorderOpacity);
    setGlassShineOpacity(d.glassShineOpacity);
    setRecentRibbonColors(d.recentRibbonColors || []);
    setRecentRibbonGlowColors(d.recentRibbonGlowColors || []);
    // Time & Pill
    setTimeColor(d.timeColor);
    setTimeFormat24hr(d.timeFormat24hr);
    setEnableTimePill(d.enableTimePill);
    setTimePillBlur(d.timePillBlur);
    setTimePillOpacity(d.timePillOpacity);
    setTimeFont(d.timeFont !== undefined ? d.timeFont : timeFont); // fallback to current if missing
    // Wallpaper & Effects
    setWallpaper(d.wallpaper);
    setWallpaperOpacity(d.wallpaperOpacity);
    setSavedWallpapers(d.savedWallpapers || []);
    setLikedWallpapers(d.likedWallpapers || []);
    setCycleWallpapers(d.cycleWallpapers);
    setCycleInterval(d.cycleInterval);
    setCycleAnimation(d.cycleAnimation);
    setSlideDirection(d.slideDirection);
    setCrossfadeDuration(d.crossfadeDuration);
    setCrossfadeEasing(d.crossfadeEasing);
    setSlideRandomDirection(d.slideRandomDirection);
    setSlideDuration(d.slideDuration);
    setSlideEasing(d.slideEasing);
    setWallpaperBlur(d.wallpaperBlur !== undefined ? d.wallpaperBlur : 0);
    // Handle wallpaper setting with proper persistence
    if (d.wallpaper && d.wallpaper.url && window.api?.wallpapers?.setActive) {
      try {
        await window.api.wallpapers.setActive({ url: d.wallpaper.url });
        console.log('Successfully set wallpaper from preset:', d.wallpaper.url);
      } catch (error) {
        console.warn('Failed to set wallpaper from preset:', error);
        // If setting the wallpaper fails, set to null to avoid UI inconsistency
        setWallpaper(null);
      }
    } else if (!d.wallpaper) {
      // If preset has no wallpaper, clear current wallpaper
      try {
        await window.api.wallpapers.setActive({ url: null });
        console.log('Cleared wallpaper as preset has none');
      } catch (error) {
        console.warn('Failed to clear wallpaper:', error);
      }
    }
    setRibbonButtonConfigs(d.ribbonButtonConfigs || []); // This now includes textFont for each button
    setPresetsButtonConfig(d.presetsButtonConfig || { type: 'icon', icon: 'star' }); // Apply presets button config
    
    // Apply channel data if present
    if (d.channels && d.mediaMap && d.appPathMap) {
      console.log('Applying preset with channel data:', { channels: d.channels, mediaMap: d.mediaMap, appPathMap: d.appPathMap });
      
      // Update the channels state
      setChannels(d.channels);
      setMediaMap(d.mediaMap);
      setAppPathMap(d.appPathMap);
      
      // Save channel data to persistent storage in the correct format
      const channelData = {};
      d.channels.forEach(channel => {
        if (!channel.empty && (d.mediaMap[channel.id] || d.appPathMap[channel.id])) {
          channelData[channel.id] = {
            media: d.mediaMap[channel.id] || null,
            path: d.appPathMap[channel.id] || null,
            type: d.mediaMap[channel.id]?.type || (d.appPathMap[channel.id]?.endsWith('.exe') ? 'exe' : 'url'),
            title: d.mediaMap[channel.id]?.name || null
          };
        }
      });
      
      console.log('Saving channel data to persistent storage:', channelData);
      channelsApi?.set(channelData);
    } else {
      console.log('No channel data in preset or channel data incomplete');
    }
    
    // Apply sound settings if present
    if (d.soundLibrary) {
      console.log('Applying preset with sound library:', d.soundLibrary);
      setSoundSettings(d.soundLibrary);
      soundsApi?.set(d.soundLibrary);
      
      // Update background music using the proper setup function
      await setupBackgroundMusic(d.soundLibrary);
    } else {
      console.log('No sound library in preset');
    }
    
            closePresetsModal();
  };

  // On mount, load all modular data
  useEffect(() => {
    async function loadAll() {
      // Load sounds
      const soundData = await soundsApi.get();
      setSoundSettings(soundData || {});
      // Load wallpapers
      const wallpaperData = await wallpapersApi.get();
      // setWallpaper(wallpaperData?.wallpaper || null); // Remove - wallpaper now loaded from general settings
      setWallpaperOpacity(wallpaperData?.wallpaperOpacity ?? 1);
      setSavedWallpapers(wallpaperData?.savedWallpapers || []);
      setLikedWallpapers(wallpaperData?.likedWallpapers || []);
      setCycleWallpapers(wallpaperData?.cyclingSettings?.enabled ?? false);
      setCycleInterval(wallpaperData?.cyclingSettings?.interval ?? 30);
      setCycleAnimation(wallpaperData?.cyclingSettings?.animation || 'fade');
      setSlideDirection(wallpaperData?.cyclingSettings?.slideDirection || 'right');
      setCrossfadeDuration(wallpaperData?.cyclingSettings?.crossfadeDuration ?? 1.2);
      setCrossfadeEasing(wallpaperData?.cyclingSettings?.crossfadeEasing ?? 'ease-out');
      setSlideRandomDirection(wallpaperData?.cyclingSettings?.slideRandomDirection ?? false);
      setSlideDuration(wallpaperData?.cyclingSettings?.slideDuration ?? 1.5);
      setSlideEasing(wallpaperData?.cyclingSettings?.slideEasing ?? 'ease-out');
      // Note: Time-related settings are now loaded from general settings API in loadSettings()
      // to avoid conflicts with ribbon button configs and other general settings
      // Load channels
      const channelData = await channelsApi.get();
      // Always show 12 channels
      const gridChannels = [];
      for (let i = 0; i < 12; i++) {
        const id = `channel-${i}`;
        if (channelData && channelData[id]) {
          let config = { ...channelData[id] };
          // Ensure type is present
          if (!config.type) {
            config.type = inferChannelType(config.path);
          }
          gridChannels.push({ id, ...config, empty: !(config.media || config.path) });
        } else {
          gridChannels.push({ id, empty: true });
        }
      }
      setChannels(gridChannels);
      
      // Set channelConfigs to the processed channel data
      const processedConfigs = {};
      Object.entries(channelData || {}).forEach(([channelId, config]) => {
        let processedConfig = { ...config };
        // Ensure type is present
        if (!processedConfig.type) {
          processedConfig.type = inferChannelType(processedConfig.path);
        }
        processedConfigs[channelId] = processedConfig;
      });
      setChannelConfigs(processedConfigs);
      
      // Update mediaMap and appPathMap from saved configs
      const newMediaMap = {};
      const newAppPathMap = {};
      Object.entries(channelData || {}).forEach(([channelId, config]) => {
        if (config.media) newMediaMap[channelId] = config.media;
        if (config.path) newAppPathMap[channelId] = config.path;
      });
      setMediaMap(newMediaMap);
      setAppPathMap(newAppPathMap);
      // --- SplashScreen logic ---
      setSplashFading(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 800); // match fade-out duration
    }
    loadAll();
  }, []);

  // Helper function to infer channel type from path
  const inferChannelType = (path) => {
    if (!path || typeof path !== 'string') {
      return 'exe';
    }
    
    const trimmedPath = path.trim();
    
    // Check for URLs
    if (/^https?:\/\//i.test(trimmedPath)) {
      return 'url';
    }
    
    // Check for Steam URIs/paths (various formats)
    if (/^steam:\/\//i.test(trimmedPath) || 
        /^steam:\/\/rungameid\//i.test(trimmedPath) ||
        /^steam:\/\/launch\//i.test(trimmedPath) ||
        // Also handle just numeric AppIDs that might be Steam games
        (/^\d+$/.test(trimmedPath) && parseInt(trimmedPath) > 0)) {
      return 'steam';
    }
    
    // Check for Epic Games URIs
    if (/^com\.epicgames\.launcher:\/\//i.test(trimmedPath)) {
      return 'epic';
    }
    
    // Check for Microsoft Store AppIDs (contain exclamation marks and follow the pattern)
    if (trimmedPath.includes('!') && 
        /^[A-Za-z0-9._-]+\.[A-Za-z0-9._-]+_[A-Za-z0-9._-]+![A-Za-z0-9._-]+$/i.test(trimmedPath)) {
      return 'microsoftstore';
    }
    
    // Default to exe for executable paths and everything else
    return 'exe';
  };

  // Load sound settings and play startup sound
  useEffect(() => {
    async function loadSettings() {
      let settings = await settingsApi?.get();
      console.log('App: Loading general settings:', settings);
      if (settings) {
        setIsDarkMode(settings.isDarkMode ?? false);
        setUseCustomCursor(settings.useCustomCursor ?? true);
        setGlassWiiRibbon(settings.glassWiiRibbon ?? false);
        setGlassOpacity(settings.glassOpacity ?? 0.18);
        setGlassBlur(settings.glassBlur ?? 2.5);
        setGlassBorderOpacity(settings.glassBorderOpacity ?? 0.5);
        setGlassShineOpacity(settings.glassShineOpacity ?? 0.7);
        setAnimatedOnHover(settings.animatedOnHover ?? false);
        setStartInFullscreen(settings.startInFullscreen ?? true);
        // Remove wallpaper settings - these are loaded from wallpaper backend in loadAll
        // setWallpaper(settings.wallpaper || null);
        // setWallpaperOpacity(settings.wallpaperOpacity ?? 1);
        // setSavedWallpapers(settings.savedWallpapers || []);
        // setLikedWallpapers(settings.likedWallpapers || []);
        // setCycleWallpapers(settings.cycleWallpapers ?? false);
        // setCycleInterval(settings.cycleInterval ?? 30);
        // setCycleAnimation(settings.cycleAnimation || 'fade');
        // setSlideDirection(settings.slideDirection || 'right');
        setWallpaper(settings.wallpaper || null); // Add wallpaper back to match ribbon settings persistence
        setTimeColor(settings.timeColor || '#ffffff'); // Load timeColor
        setRecentTimeColors(settings.recentTimeColors || []); // Load recentTimeColors
        setTimeFormat24hr(settings.timeFormat24hr ?? true); // Load timeFormat24hr
        setEnableTimePill(settings.enableTimePill ?? true); // Load enableTimePill
        setTimePillBlur(settings.timePillBlur ?? 8); // Load timePillBlur
        setTimePillOpacity(settings.timePillOpacity ?? 0.05); // Load timePillOpacity
        setChannelAutoFadeTimeout(settings.channelAutoFadeTimeout ?? 5); // Load channelAutoFadeTimeout
        currentTimeColorRef.current = settings.timeColor || '#ffffff';
        currentTimeFormatRef.current = settings.timeFormat24hr ?? true;
        setTimeFont(settings.timeFont || 'default');
        setChannelAnimation(settings.channelAnimation || 'none'); // Load channelAnimation
        
        // Load Ken Burns settings
            setKenBurnsEnabled(settings.kenBurnsEnabled ?? false);
    setKenBurnsMode(settings.kenBurnsMode || 'hover');
    
    // Load advanced Ken Burns settings
    setKenBurnsHoverScale(settings.kenBurnsHoverScale ?? 1.1);
    setKenBurnsAutoplayScale(settings.kenBurnsAutoplayScale ?? 1.15);
    setKenBurnsSlideshowScale(settings.kenBurnsSlideshowScale ?? 1.2);
    setKenBurnsHoverDuration(settings.kenBurnsHoverDuration ?? 8000);
    setKenBurnsAutoplayDuration(settings.kenBurnsAutoplayDuration ?? 12000);
    setKenBurnsSlideshowDuration(settings.kenBurnsSlideshowDuration ?? 10000);
    setKenBurnsCrossfadeDuration(settings.kenBurnsCrossfadeDuration ?? 1000);
        
        // Load ribbonButtonConfigs to ensure they're preserved during persistence
        if (settings.ribbonButtonConfigs) {
          console.log('App: Loaded ribbonButtonConfigs:', settings.ribbonButtonConfigs);
          setRibbonButtonConfigs(settings.ribbonButtonConfigs);
        }
        // Load ribbonColor from settings
        setRibbonColor(settings.ribbonColor || '#e0e6ef');
        // Load recentRibbonColors from settings
        setRecentRibbonColors(settings.recentRibbonColors || []);
        // Load ribbonGlowColor and recentRibbonGlowColors from settings
        setRibbonGlowColor(settings.ribbonGlowColor || '#0099ff');
        setRecentRibbonGlowColors(settings.recentRibbonGlowColors || []);
        // Load ribbonGlowStrength and ribbonGlowStrengthHover from settings
        setRibbonGlowStrength(settings.ribbonGlowStrength || ribbonGlowStrength);
        setRibbonGlowStrengthHover(settings.ribbonGlowStrengthHover || ribbonGlowStrengthHover);
        setRibbonDockOpacity(settings.ribbonDockOpacity ?? 1);
        // Load presets from settings
        setPresets(settings.presets || []);
        setPresetsButtonConfig({
          ...(settings.presetsButtonConfig || { type: 'icon', icon: 'star' }),
          useAdaptiveColor: settings.presetsButtonConfig?.useAdaptiveColor ?? false,
          useGlowEffect: settings.presetsButtonConfig?.useGlowEffect ?? false,
          glowStrength: settings.presetsButtonConfig?.glowStrength ?? 20,
          useGlassEffect: settings.presetsButtonConfig?.useGlassEffect ?? false,
          glassOpacity: settings.presetsButtonConfig?.glassOpacity ?? 0.18,
          glassBlur: settings.presetsButtonConfig?.glassBlur ?? 2.5,
          glassBorderOpacity: settings.presetsButtonConfig?.glassBorderOpacity ?? 0.5,
          glassShineOpacity: settings.presetsButtonConfig?.glassShineOpacity ?? 0.7
        });
        setShowPresetsButton(settings.showPresetsButton ?? false);
        setWallpaperBlur(settings.wallpaperBlur ?? 0);
      }
      // Mark as initialized after loading settings
      setHasInitialized(true);
    }
    loadSettings();
  }, []);

  // After soundSettings is loaded, initialize audio manager
  useEffect(() => {
    if (!soundSettings) return;
    async function initSounds() {
      try {
        console.log('[App] Initializing audio manager: updateVolumesFromLibrary (after soundSettings loaded)');
        await audioManager.updateVolumesFromLibrary();
        console.log('[App] updateVolumesFromLibrary complete');
        console.log('[App] Initializing audio manager: updateBackgroundMusicFromSettings (after soundSettings loaded)');
        await audioManager.updateBackgroundMusicFromSettings();
        console.log('[App] updateBackgroundMusicFromSettings complete');
      } catch (err) {
        console.warn('Failed to initialize audio manager:', err);
      }
    }
    initSounds();
  }, [soundSettings]);
  // Persist barType and other settings when changed
  useEffect(() => {
    // Only persist settings after initialization to prevent overwriting ribbonButtonConfigs on startup
    if (!hasInitialized) return;
    
    async function persistSettings() {
      let current = await settingsApi?.get();
      if (!current) current = {};
      
      // Use the loaded ribbonButtonConfigs from state, or preserve from current settings if not loaded
      const preservedButtonConfigs = ribbonButtonConfigs || current.ribbonButtonConfigs;
      
      // Merge new state with current, preserving ribbonButtonConfigs and other existing data
      const merged = {
        ...current, // This preserves any other existing settings not in our state
        isDarkMode,
        useCustomCursor,
        glassWiiRibbon,
        glassOpacity,
        glassBlur,
        glassBorderOpacity,
        glassShineOpacity,
        animatedOnHover,
        startInFullscreen,
        // Remove wallpaper settings - these are loaded from wallpaper backend in loadAll
        // wallpaper, wallpaperOpacity, savedWallpapers, likedWallpapers, cycleWallpapers, cycleInterval, cycleAnimation, slideDirection, crossfadeDuration, crossfadeEasing, slideRandomDirection, slideDuration, slideEasing,
        wallpaper, // Add wallpaper back to ensure persistence like ribbon settings
        timeColor, // Persist timeColor
        recentTimeColors, // Persist recentTimeColors
        timeFormat24hr, // Persist timeFormat24hr
        enableTimePill, // Persist enableTimePill
        timePillBlur, // Persist timePillBlur
        timePillOpacity, // Persist timePillOpacity
        channelAutoFadeTimeout, // Persist channelAutoFadeTimeout
        ribbonColor, // Persist ribbonColor
        recentRibbonColors, // Persist recentRibbonColors
        ribbonGlowColor, // Persist ribbonGlowColor
        recentRibbonGlowColors, // Persist recentRibbonGlowColors
        ribbonGlowStrength, // Persist ribbonGlowStrength
        ribbonGlowStrengthHover, // Persist ribbonGlowStrengthHover
        ribbonDockOpacity, // Persist ribbonDockOpacity
        presets, // Persist presets
        presetsButtonConfig, // Persist presets button configuration
        showPresetsButton, // Persist show presets button setting
        timeFont, // Persist timeFont
        channelAnimation, // Persist channelAnimation
        kenBurnsEnabled, // Persist Ken Burns enabled setting
        kenBurnsMode, // Persist Ken Burns mode setting
        kenBurnsHoverScale, // Persist Ken Burns hover scale
        kenBurnsAutoplayScale, // Persist Ken Burns autoplay scale
        kenBurnsSlideshowScale, // Persist Ken Burns slideshow scale
        kenBurnsHoverDuration, // Persist Ken Burns hover duration
        kenBurnsAutoplayDuration, // Persist Ken Burns autoplay duration
        kenBurnsSlideshowDuration, // Persist Ken Burns slideshow duration
        kenBurnsCrossfadeDuration, // Persist Ken Burns crossfade duration
      };
      
      // Double-check: if we had button configs before, make sure they're still there
      if (preservedButtonConfigs && !merged.ribbonButtonConfigs) {
        merged.ribbonButtonConfigs = preservedButtonConfigs;
        console.log('App: Restored ribbonButtonConfigs that were about to be lost');
      }
      
      console.log('App: Persisting settings with timeFont:', timeFont);
      console.log('App: Persisting settings:', merged);
      console.log('App: Preserved ribbonButtonConfigs:', merged.ribbonButtonConfigs);
      await settingsApi?.set(merged);
    }
    persistSettings();
  }, [hasInitialized, isDarkMode, useCustomCursor, glassWiiRibbon, glassOpacity, glassBlur, glassBorderOpacity, glassShineOpacity, animatedOnHover, startInFullscreen, wallpaper, timeColor, recentTimeColors, timeFormat24hr, enableTimePill, timePillBlur, timePillOpacity, channelAutoFadeTimeout, ribbonButtonConfigs, ribbonColor, recentRibbonColors, ribbonGlowColor, recentRibbonGlowColors, ribbonGlowStrength, ribbonGlowStrengthHover, ribbonDockOpacity, presets, presetsButtonConfig, showPresetsButton, timeFont, channelAnimation, kenBurnsEnabled, kenBurnsMode, kenBurnsHoverScale, kenBurnsAutoplayScale, kenBurnsSlideshowScale, kenBurnsHoverDuration, kenBurnsAutoplayDuration, kenBurnsSlideshowDuration, kenBurnsCrossfadeDuration]);

  // Update refs when time settings change
  useEffect(() => {
    currentTimeColorRef.current = timeColor;
  }, [timeColor]);

  useEffect(() => {
    currentTimeFormatRef.current = timeFormat24hr;
  }, [timeFormat24hr]);

  // Apply dark mode class to body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't handle shortcuts if user is typing in an input field
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable) {
        return;
      }
      
      handleGlobalKeyPress(event);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleGlobalKeyPress]);

  // Apply cursor mode
  useEffect(() => {
    if (useCustomCursor) {
      document.body.classList.add('custom-cursor');
    } else {
      document.body.classList.remove('custom-cursor');
    }
  }, [useCustomCursor]);

  useEffect(() => {
    if (window.api && window.api.onUpdateDragRegion) {
      window.api.onUpdateDragRegion((shouldShow) => {
        setShowDragRegion(shouldShow);
      });
    } else if (window.require) {
      // Fallback for Electron context
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.on('update-drag-region', (event, shouldShow) => {
        setShowDragRegion(shouldShow);
      });
    }
  }, []);

  // Listen for wallpaper updates from backend (IPC event)
  useEffect(() => {
    if (window.api && window.api.onWallpapersUpdated) {
      const reloadWallpapers = async () => {
        const wallpaperData = await wallpapersApi.get();
        setWallpaper(wallpaperData?.wallpaper || null);
        setWallpaperOpacity(wallpaperData?.wallpaperOpacity ?? 1);
        setSavedWallpapers(wallpaperData?.savedWallpapers || []);
        setLikedWallpapers(wallpaperData?.likedWallpapers || []);
        setCycleWallpapers(wallpaperData?.cyclingSettings?.enabled ?? false);
        setCycleInterval(wallpaperData?.cyclingSettings?.interval ?? 30);
        setCycleAnimation(wallpaperData?.cyclingSettings?.animation || 'fade');
        setSlideDirection(wallpaperData?.cyclingSettings?.slideDirection || 'right');
        // Time settings should come from the main settings file, not wallpaper data
        // These are preserved by the main settings persistence system
        
        // Also update window.settings to keep it in sync
        if (window.settings) {
          window.settings.cycleWallpapers = wallpaperData?.cyclingSettings?.enabled ?? false;
          window.settings.cycleInterval = wallpaperData?.cyclingSettings?.interval ?? 30;
          window.settings.cycleAnimation = wallpaperData?.cyclingSettings?.animation || 'fade';
          window.settings.slideDirection = wallpaperData?.cyclingSettings?.slideDirection || 'right';
        }
      };
      window.api.onWallpapersUpdated(reloadWallpapers);
      return () => window.api.offWallpapersUpdated(reloadWallpapers);
    }
  }, []);

  // Prefetch app/game/UWP lists on app launch
  useEffect(() => {
    const {
      installedApps, fetchInstalledApps,
      steamGames, fetchSteamGames,
      epicGames, fetchEpicGames,
      uwpApps, fetchUwpApps
    } = useAppLibraryStore.getState();

    if (installedApps.length === 0) fetchInstalledApps();
    if (steamGames.length === 0) fetchSteamGames();
    if (epicGames.length === 0) fetchEpicGames();
    if (uwpApps.length === 0) fetchUwpApps();
  }, []);

  const handleMediaChange = (id, file) => {
    const url = URL.createObjectURL(file);
    setMediaMap((prev) => ({
      ...prev,
      [id]: { url, type: file.type },
    }));
  };

  const handleAppPathChange = (id, path) => {
    setAppPathMap((prev) => ({
      ...prev,
      [id]: path,
    }));
  };

  const handleChannelSave = (channelId, channelData) => {
    // If channelData is null, clear the channel completely
    if (channelData === null) {
      setChannelConfigs(prev => {
        const updated = { ...prev };
        delete updated[channelId];
        // Save the updated configs
        channelsApi?.set(updated);
        return updated;
      });
      // Clear media and path maps for this channel
      setMediaMap(prev => {
        const updated = { ...prev };
        delete updated[channelId];
        return updated;
      });
      setAppPathMap(prev => {
        const updated = { ...prev };
        delete updated[channelId];
        return updated;
      });
      return;
    }
    // Update channel configurations
    setChannelConfigs(prev => {
      let updatedChannelData = { ...channelData, ...prev };
      let updated = { ...prev };
      if (channelData === null) {
        // ... existing code for clearing ...
        return updated;
      }
      // Ensure type is present
      let channelType = channelData.type;
      if (!channelType) {
        channelType = inferChannelType(channelData.path);
      }
      updated[channelId] = { ...channelData, type: channelType };
      channelsApi?.set(updated);
      return updated;
    });
    // Update media and path maps
    if (channelData.media) {
      setMediaMap(prev => ({
        ...prev,
        [channelId]: channelData.media
      }));
    }
    if (channelData.path) {
      setAppPathMap(prev => ({
        ...prev,
        [channelId]: channelData.path
      }));
    }
  };

  const handleSettingsClick = () => {
    setIsEditMode(!isEditMode);
  };

  const handleToggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleToggleCursor = () => {
    setUseCustomCursor(!useCustomCursor);
  };

  // Handler for settings changes from WallpaperModal or SoundModal
  const handleSettingsChange = async (newSettings) => {
    // Update state directly with the new settings passed from the modal
    if (newSettings.channelAutoFadeTimeout !== undefined) {
      setChannelAutoFadeTimeout(newSettings.channelAutoFadeTimeout);
      // Reset the last hover time when the timeout changes to prevent immediate fade
      setLastChannelHoverTime(Date.now());
    }
    if (newSettings.wallpaperOpacity !== undefined) {
      setWallpaperOpacity(newSettings.wallpaperOpacity);
    }
    if (newSettings.ribbonButtonConfigs !== undefined) {
      setRibbonButtonConfigs(newSettings.ribbonButtonConfigs);
    }
    if (newSettings.presetsButtonConfig !== undefined) {
              if (newSettings.presetsButtonConfig) {
          setPresetsButtonConfig({
            ...newSettings.presetsButtonConfig,
            useAdaptiveColor: newSettings.presetsButtonConfig.useAdaptiveColor ?? false,
            useGlowEffect: newSettings.presetsButtonConfig.useGlowEffect ?? false,
            glowStrength: newSettings.presetsButtonConfig.glowStrength ?? 20,
            useGlassEffect: newSettings.presetsButtonConfig.useGlassEffect ?? false,
            glassOpacity: newSettings.presetsButtonConfig.glassOpacity ?? 0.18,
            glassBlur: newSettings.presetsButtonConfig.glassBlur ?? 2.5,
            glassBorderOpacity: newSettings.presetsButtonConfig.glassBorderOpacity ?? 0.5,
            glassShineOpacity: newSettings.presetsButtonConfig.glassShineOpacity ?? 0.7
          });
        }
    }
    if (newSettings.showPresetsButton !== undefined) {
      setShowPresetsButton(newSettings.showPresetsButton);
    }
    if (newSettings.timeColor !== undefined) {
      setTimeColor(newSettings.timeColor);
      currentTimeColorRef.current = newSettings.timeColor;
    }
    if (newSettings.recentTimeColors !== undefined) {
      setRecentTimeColors(newSettings.recentTimeColors);
    }
    if (newSettings.timeFormat24hr !== undefined) {
      setTimeFormat24hr(newSettings.timeFormat24hr);
      currentTimeFormatRef.current = newSettings.timeFormat24hr;
    }
    if (newSettings.enableTimePill !== undefined) {
      setEnableTimePill(newSettings.enableTimePill);
    }
    if (newSettings.timePillBlur !== undefined) {
      setTimePillBlur(newSettings.timePillBlur);
    }
    if (newSettings.timePillOpacity !== undefined) {
      setTimePillOpacity(newSettings.timePillOpacity);
    }
    if (newSettings.timeFont !== undefined) {
      setTimeFont(newSettings.timeFont);
    }
    if (newSettings.glassWiiRibbon !== undefined) {
      setGlassWiiRibbon(newSettings.glassWiiRibbon);
    }
    if (newSettings.glassOpacity !== undefined) {
      setGlassOpacity(newSettings.glassOpacity);
    }
    if (newSettings.glassBlur !== undefined) {
      setGlassBlur(newSettings.glassBlur);
    }
    if (newSettings.glassBorderOpacity !== undefined) {
      setGlassBorderOpacity(newSettings.glassBorderOpacity);
    }
    if (newSettings.glassShineOpacity !== undefined) {
      setGlassShineOpacity(newSettings.glassShineOpacity);
    }
    if (newSettings.startInFullscreen !== undefined) {
      setStartInFullscreen(newSettings.startInFullscreen);
    }
    if (newSettings.ribbonColor !== undefined) {
      setRibbonColor(newSettings.ribbonColor);
    }
    if (newSettings.recentRibbonColors !== undefined) {
      setRecentRibbonColors(newSettings.recentRibbonColors);
    }
    if (newSettings.ribbonGlowColor !== undefined) {
      setRibbonGlowColor(newSettings.ribbonGlowColor);
    }
    if (newSettings.recentRibbonGlowColors !== undefined) {
      setRecentRibbonGlowColors(newSettings.recentRibbonGlowColors);
    }
    if (newSettings.ribbonGlowStrength !== undefined) {
      setRibbonGlowStrength(newSettings.ribbonGlowStrength);
    }
    if (newSettings.ribbonGlowStrengthHover !== undefined) {
      setRibbonGlowStrengthHover(newSettings.ribbonGlowStrengthHover);
    }
    if (newSettings.ribbonDockOpacity !== undefined) {
      setRibbonDockOpacity(newSettings.ribbonDockOpacity);
    }
    if (newSettings.presets !== undefined) {
      setPresets(newSettings.presets);
    }
    if (newSettings.wallpaperBlur !== undefined) {
      setWallpaperBlur(newSettings.wallpaperBlur);
    }
    if (newSettings.channelAnimation !== undefined) {
      setChannelAnimation(newSettings.channelAnimation);
    }
    if (newSettings.kenBurnsEnabled !== undefined) {
      setKenBurnsEnabled(newSettings.kenBurnsEnabled);
    }
    if (newSettings.kenBurnsMode !== undefined) {
      setKenBurnsMode(newSettings.kenBurnsMode);
    }
    
    // Advanced Ken Burns settings
    if (newSettings.kenBurnsHoverScale !== undefined) {
      setKenBurnsHoverScale(newSettings.kenBurnsHoverScale);
    }
    if (newSettings.kenBurnsAutoplayScale !== undefined) {
      setKenBurnsAutoplayScale(newSettings.kenBurnsAutoplayScale);
    }
    if (newSettings.kenBurnsSlideshowScale !== undefined) {
      setKenBurnsSlideshowScale(newSettings.kenBurnsSlideshowScale);
    }
    if (newSettings.kenBurnsHoverDuration !== undefined) {
      setKenBurnsHoverDuration(newSettings.kenBurnsHoverDuration);
    }
    if (newSettings.kenBurnsAutoplayDuration !== undefined) {
      setKenBurnsAutoplayDuration(newSettings.kenBurnsAutoplayDuration);
    }
    if (newSettings.kenBurnsSlideshowDuration !== undefined) {
      setKenBurnsSlideshowDuration(newSettings.kenBurnsSlideshowDuration);
    }
    if (newSettings.kenBurnsCrossfadeDuration !== undefined) {
      setKenBurnsCrossfadeDuration(newSettings.kenBurnsCrossfadeDuration);
    }
    
    // Note: Settings are automatically persisted by the main persistSettings useEffect
    // which runs whenever any of the state variables change. This ensures ribbonButtonConfigs
    // are preserved and not overwritten by direct settings saves.
  };

  // Pass settings to SettingsButton via window.settings for now (could use context for better solution)
  window.settings = {
    wallpaper,
    wallpaperOpacity,
    savedWallpapers,
    likedWallpapers,
    cycleWallpapers,
    cycleInterval,
    cycleAnimation,
    slideDirection,
    crossfadeDuration,
    crossfadeEasing,
    slideRandomDirection,
    slideDuration,
    slideEasing,
    timeColor,
    recentTimeColors,
    timeFormat24hr,
    enableTimePill,
    timePillBlur,
    timePillOpacity,
    channelAutoFadeTimeout,
    glassWiiRibbon,
    glassOpacity,
    glassBlur,
    glassBorderOpacity,
    glassShineOpacity,
    startInFullscreen,
    ribbonColor,
    recentRibbonColors,
    ribbonGlowColor,
    recentRibbonGlowColors,
    ribbonGlowStrength,
    ribbonGlowStrengthHover,
    ribbonDockOpacity,
    wallpaperBlur,
    timeFont,
    channelAnimation,
    kenBurnsEnabled,
    kenBurnsMode,
    kenBurnsHoverScale,
    kenBurnsAutoplayScale,
    kenBurnsSlideshowScale,
    kenBurnsHoverDuration,
    kenBurnsAutoplayDuration,
    kenBurnsSlideshowDuration,
    kenBurnsCrossfadeDuration,
  };

  // Memoize expensive calculations
  const getTransitionType = useCallback(() => {
    if (cycleAnimation === 'crossfade') return 'crossfade';
    if (cycleAnimation === 'slide') return 'slide';
    return 'fade';
  }, [cycleAnimation]);

  const applyEasing = useCallback((progress, easing) => {
    switch (easing) {
      case 'ease-in': return progress * progress;
      case 'ease-out': return 1 - (1 - progress) * (1 - progress);
      case 'ease-in-out': return progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      default: return progress;
    }
  }, []);

  // Function to calculate slide transform based on direction and progress
  const getSlideTransform = (direction, progress) => {
    const slideDistance = '100%';
    const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
    
    switch (direction) {
      case 'left':
        return `translateX(${(1 - easeProgress) * 100}%)`;
      case 'right':
        return `translateX(${-(1 - easeProgress) * 100}%)`;
      case 'up':
        return `translateY(${(1 - easeProgress) * 100}%)`;
      case 'down':
        return `translateY(${-(1 - easeProgress) * 100}%)`;
      default:
        return 'none';
    }
  };

  // Function to get infinite scroll slide transform
  const getInfiniteScrollTransform = (direction, progress, isNextWallpaper = false) => {
    // Use a smoother easing for infinite scroll
    const easeProgress = 1 - Math.pow(1 - progress, 2); // Quadratic ease-out
    
    switch (direction) {
      case 'left':
        if (isNextWallpaper) {
          // Next wallpaper slides in from the right (starts at 100% right, moves to 0%)
          return `translateX(${(1 - easeProgress) * 100}%)`;
        } else {
          // Current wallpaper slides out to the left (starts at 0%, moves to -100%)
          return `translateX(${-easeProgress * 100}%)`;
        }
      case 'right':
        if (isNextWallpaper) {
          // Next wallpaper slides in from the left (starts at -100% left, moves to 0%)
          return `translateX(${-(1 - easeProgress) * 100}%)`;
        } else {
          // Current wallpaper slides out to the right (starts at 0%, moves to 100%)
          return `translateX(${easeProgress * 100}%)`;
        }
      case 'up':
        if (isNextWallpaper) {
          // Next wallpaper slides in from below (starts at 100% down, moves to 0%)
          return `translateY(${(1 - easeProgress) * 100}%)`;
        } else {
          // Current wallpaper slides out upward (starts at 0%, moves to -100%)
          return `translateY(${-easeProgress * 100}%)`;
        }
      case 'down':
        if (isNextWallpaper) {
          // Next wallpaper slides in from above (starts at -100% up, moves to 0%)
          return `translateY(${-(1 - easeProgress) * 100}%)`;
        } else {
          // Current wallpaper slides out downward (starts at 0%, moves to 100%)
          return `translateY(${easeProgress * 100}%)`;
        }
      default:
        return 'none';
    }
  };

  // Memoize cycleList to prevent unnecessary recalculations
  const cycleList = useMemo(() => {
    return savedWallpapers.filter(w => w.url && w.url.trim());
  }, [savedWallpapers]);

  // Function to cycle to next wallpaper - memoized to prevent unnecessary re-creation
  const cycleToNextWallpaper = useCallback(() => {
    if (cycleList.length < 2 || isTransitioning) return;
    
    const currentIndex = cycleList.findIndex(w => w.url === wallpaper?.url);
    const nextIndex = (currentIndex + 1) % cycleList.length;
    const nextWallpaperItem = cycleList[nextIndex];
    
    setNextWallpaper(nextWallpaperItem);
    setIsTransitioning(true);
    
    // Start transition animation
    if (getTransitionType() === 'crossfade') {
      setCrossfadeProgress(0);
      const startTime = Date.now();
      const duration = crossfadeDuration * 1000;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = applyEasing(progress, crossfadeEasing);
        
        setCrossfadeProgress(easedProgress);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
              } else {
          setWallpaper(nextWallpaperItem);
          setNextWallpaper(null);
          setIsTransitioning(false);
          setCrossfadeProgress(0);
        }
      };
      
      requestAnimationFrame(animate);
            } else if (getTransitionType() === 'slide') {
      setSlideProgress(0);
      const startTime = Date.now();
      const duration = slideDuration * 1000;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = applyEasing(progress, slideEasing);
        
        setSlideProgress(easedProgress);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setWallpaper(nextWallpaperItem);
                setNextWallpaper(null);
                setIsTransitioning(false);
        setSlideProgress(0);
        }
      };
      
      requestAnimationFrame(animate);
    } else {
      // Simple fade
      setWallpaper(nextWallpaperItem);
        setIsTransitioning(false);
    }
  }, [cycleList, wallpaper?.url, isTransitioning, getTransitionType, crossfadeDuration, crossfadeEasing, slideDuration, slideEasing, applyEasing]);
  
  // Keep currentWallpaperRef in sync with wallpaper state
  useEffect(() => {
    currentWallpaperRef.current = wallpaper;
  }, [wallpaper]);

  // Simplified wallpaper cycling logic - no animations for now
  useEffect(() => {
    console.log('Wallpaper cycling effect triggered:', {
      cycleWallpapers,
      cycleListLength: cycleList.length,
      cycleInterval,
      showWallpaperModal,
      isTransitioning
    });
    
    // Don't re-run if currently transitioning
    if (isTransitioning) {
      console.log('Currently transitioning, skipping effect re-run');
      return;
    }
    
    // Clear any existing timeout
    if (cycleTimeoutRef.current) {
      console.log('Clearing existing timeout');
      clearTimeout(cycleTimeoutRef.current);
      cycleTimeoutRef.current = null;
    }

    // Don't cycle if disabled, not enough wallpapers, or modal is open
    if (!cycleWallpapers || cycleList.length < 2 || showWallpaperModal) {
      console.log('Wallpaper cycling stopped:', {
        reason: !cycleWallpapers ? 'disabled' : cycleList.length < 2 ? 'not enough wallpapers' : 'modal open'
      });
      return;
    }

    console.log('Starting wallpaper cycling with interval:', cycleInterval, 'seconds');

    // Test if timeout works at all
    console.log('Setting up initial timeout for', cycleInterval, 'seconds');
    cycleTimeoutRef.current = setTimeout(() => {
      console.log('Initial timeout fired!');
      cycleToNextWallpaper();
    }, cycleInterval * 1000);

    // Cleanup function
    return () => {
      if (cycleTimeoutRef.current) {
        console.log('Cleanup: clearing timeout');
        clearTimeout(cycleTimeoutRef.current);
        cycleTimeoutRef.current = null;
      }
      // Reset transition states on cleanup
      if (isTransitioning) {
        setIsTransitioning(false);
        setNextWallpaper(null);
        setCrossfadeProgress(0);
        setSlideProgress(0);
        setWallpaperOpacity(1);
      }
    };
  }, [cycleWallpapers, cycleList, cycleInterval, showWallpaperModal, cycleToNextWallpaper]); // Removed isTransitioning from dependencies

  // On save for sounds
  const handleSaveSounds = async (newSounds) => {
    await soundsApi?.set(newSounds);
    const soundData = await soundsApi?.get();
    setSoundSettings(soundData || {});
    
    // Update audio manager volumes to reflect new settings
    await audioManager.updateVolumesFromLibrary();
  };

  // On save for wallpapers
  const handleSaveWallpapers = async (newWallpapers) => {
    await wallpapersApi?.set(newWallpapers);
    const wallpaperData = await wallpapersApi?.get();
    setWallpaper(wallpaperData?.wallpaper || null);
    setWallpaperOpacity(wallpaperData?.wallpaperOpacity ?? 1);
    setSavedWallpapers(wallpaperData?.savedWallpapers || []);
    setLikedWallpapers(wallpaperData?.likedWallpapers || []);
    setCycleWallpapers(wallpaperData?.cyclingSettings?.enabled ?? false);
    setCycleInterval(wallpaperData?.cyclingSettings?.interval ?? 30);
    setCycleAnimation(wallpaperData?.cyclingSettings?.animation || 'fade');
    // setTransitionType(wallpaperData?.cyclingSettings?.transitionType || 'crossfade'); // This line was removed as per the edit hint
    setSlideDirection(wallpaperData?.cyclingSettings?.slideDirection || 'right');
    setTimeColor(wallpaperData?.timeColor || '#ffffff'); // Update timeColor
    setTimeFormat24hr(wallpaperData?.timeFormat24hr ?? true); // Update timeFormat24hr
    setEnableTimePill(wallpaperData?.enableTimePill ?? true); // Update enableTimePill
    setTimePillBlur(wallpaperData?.timePillBlur ?? 8); // Update timePillBlur
    setTimePillOpacity(wallpaperData?.timePillOpacity ?? 0.05); // Update timePillOpacity
    setChannelAutoFadeTimeout(wallpaperData?.channelAutoFadeTimeout ?? 5); // Update channelAutoFadeTimeout
    setTimeFont(wallpaperData?.timeFont || 'default'); // Update timeFont
    // Reset the last hover time when the timeout changes to prevent immediate fade
    setLastChannelHoverTime(Date.now());
  };

  // On save for channels
  const handleSaveChannels = async (newChannels) => {
    await channelsApi?.set(newChannels);
    const channelData = await channelsApi?.get();
    setChannelConfigs(channelData || {});
  };

  // Handle channel hover for auto-fade
  const handleChannelHover = () => {
    setLastChannelHoverTime(Date.now());
  };

  // On reset all
  const handleResetAll = async () => {
    await resetAllApi?.();
    // Reload all state
    const soundData = await soundsApi?.get();
    setSoundSettings(soundData || {});
    
    // Set default Nintendo Wii white screen wallpaper
    const defaultWiiWallpaper = {
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRkZGRkZGIi8+Cjwvc3ZnPgo=',
      name: 'Nintendo Wii White Screen',
      type: 'default'
    };
    
    setWallpaper(defaultWiiWallpaper);
    setWallpaperOpacity(1);
    setSavedWallpapers([]);
    setLikedWallpapers([]);
    setCycleWallpapers(false);
    setCycleInterval(30);
    setCycleAnimation('fade');
    setSlideDirection('right');
    setTimeColor('#ffffff'); // Update timeColor
    setTimeFormat24hr(true); // Update timeFormat24hr
    setEnableTimePill(true); // Update enableTimePill
    setTimePillBlur(8); // Update timePillBlur
    setTimePillOpacity(0.05); // Update timePillOpacity
    setChannelAutoFadeTimeout(5); // Update channelAutoFadeTimeout
    setTimeFont('default'); // Update timeFont
    
    // Save the default wallpaper to persistent storage
    if (wallpapersApi?.set) {
      await wallpapersApi.set({
        wallpaper: defaultWiiWallpaper,
        wallpaperOpacity: 1,
        savedWallpapers: [],
        likedWallpapers: [],
        cyclingSettings: {
          enabled: false,
          interval: 30,
          animation: 'fade',
          slideDirection: 'right'
        }
      });
    }
    
    const channelData = await channelsApi?.get();
    console.log('channelData', channelData);
    setChannelConfigs(channelData || {});
  };

  // Channel auto-fade logic
  useEffect(() => {
    if (channelAutoFadeTimeout <= 0) {
      setChannelOpacity(1);
      return;
    }

    const checkFadeTimeout = () => {
      const now = Date.now();
      const timeSinceLastHover = now - lastChannelHoverTime;
      const timeoutMs = channelAutoFadeTimeout * 1000;
      
      if (timeSinceLastHover >= timeoutMs) {
        setChannelOpacity(0.3); // Fade to 30% opacity
      } else {
        setChannelOpacity(1);
      }
    };

    // Check immediately
    checkFadeTimeout();

    // Set up interval to check fade timeout
    const taskId = intervalManager.addTask(checkFadeTimeout, 1000, 'channel-fade-check');

    return () => intervalManager.removeTask(taskId);
  }, [channelAutoFadeTimeout, lastChannelHoverTime]);

  // Pause/resume background music on window blur/focus
  useEffect(() => {
    const handleBlur = () => {
      audioManager.pauseBackgroundMusic();
    };
    const handleFocus = async () => {
      await audioManager.resumeBackgroundMusic();
    };
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Cleanup on app unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cleanup audio manager
      audioManager.cleanup();
      
      // Cleanup interval manager
      intervalManager.cleanup();
      
      // Clear any remaining timeouts
      if (cycleTimeoutRef.current) {
        clearTimeout(cycleTimeoutRef.current);
      }
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, []);

  // Add a drag region at the top of the window only when not in fullscreen
  const [isFullscreen, setIsFullscreen] = useState(true);
  useEffect(() => {
    if (window.api && window.api.onFullscreenState) {
      window.api.onFullscreenState((val) => setIsFullscreen(val));
    }
  }, []);

  // Toast UI
  const handleUpdatePreset = async (name) => {
    console.log('Updating preset:', name, 'with current timeFont:', timeFont);
    
    // Get current sound library
    const currentSoundLibrary = await soundsApi?.getLibrary();
    
    setPresets(prev => prev.map(p => p.name === name ? {
      name,
      data: {
        // WiiRibbon & Glow
        ribbonColor, ribbonGlowColor, ribbonGlowStrength, ribbonGlowStrengthHover, glassWiiRibbon, glassOpacity, glassBlur, glassBorderOpacity, glassShineOpacity, recentRibbonColors, recentRibbonGlowColors,
        // Time & Pill
        timeColor, timeFormat24hr, enableTimePill, timePillBlur, timePillOpacity, timeFont, // always include timeFont
        // Wallpaper & Effects
        wallpaper, wallpaperOpacity, savedWallpapers, likedWallpapers, cycleWallpapers, cycleInterval, cycleAnimation, slideDirection, crossfadeDuration, crossfadeEasing, slideRandomDirection, slideDuration, slideEasing, wallpaperBlur,
        // Primary Action Buttons
        ribbonButtonConfigs, // This now includes textFont for each button
        // Presets Button
        presetsButtonConfig, // Track presets button configuration
        // Always include current channel data when updating a preset
        channels,
        mediaMap,
        appPathMap,
        // Always include current sound library when updating a preset
        soundLibrary: currentSoundLibrary,
      }
    } : p));
  };

  const handleRenamePreset = (oldName, newName) => {
    console.log('Renaming preset:', oldName, 'to:', newName);
    setPresets(prev => prev.map(p => p.name === oldName ? { ...p, name: newName } : p));
  };
  // Handle right-click on empty space to open wallpaper modal
  const handleAppRightClick = (e) => {
    // Check if the click target is not a channel, ribbon, or other interactive element
    const target = e.target;
    const isInteractiveElement = target.closest('.channel, .circular-button, .context-menu-item, .wee-card, .modal, .interactive-footer, .time-pill, .wii-style-button, .sd-card-button, .button-container, .liquid-glass');
    
    if (!isInteractiveElement) {
      e.preventDefault();
              // wallpaper modal opening now handled by keyboard shortcut or ribbon
    }
  };

  return (
    <>
      {/* Always render the main UI, but overlay the splash screen while loading */}
      <div 
        className={`app-container ${useCustomCursor ? 'custom-cursor' : ''}`} 
        style={{ filter: isLoading ? 'blur(2px)' : 'none', pointerEvents: isLoading ? 'none' : 'auto' }}
        onContextMenu={handleAppRightClick}
      >
        {/* Wii Cursor - rendered outside app container to avoid blur filter */}
        {useCustomCursor && <WiiCursor />}
        {/* Wallpaper background layer - with smooth transitions */}
        {wallpaper && wallpaper.url && (
          <div
            className="wallpaper-bg"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 0,
              pointerEvents: 'none',
              background: `url('${wallpaper.url}') center center / cover no-repeat`,
              opacity: getTransitionType() === 'crossfade' ? 1 - crossfadeProgress : wallpaperOpacity,
              transform: getTransitionType() === 'slide' ? getInfiniteScrollTransform(slideDirection, slideProgress, false) : 'none',
              transition: 'none', // Remove CSS transitions to prevent conflicts
              filter: `blur(${wallpaperBlur}px)`,
            }}
          />
        )}
        {/* Next wallpaper layer for smooth transitions */}
        {isTransitioning && nextWallpaper && nextWallpaper.url && (
          <div
            className="wallpaper-bg-next"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 1,
              pointerEvents: 'none',
              background: `url('${nextWallpaper.url}') center center / cover no-repeat`,
              opacity: getTransitionType() === 'crossfade' ? crossfadeProgress : 1,
              transform: getTransitionType() === 'slide' ? getInfiniteScrollTransform(slideDirection, slideProgress, true) : 'none',
              transition: 'none', // Remove CSS transitions to prevent conflicts
            }}
          />
        )}
        {/* Drag region for windowed mode only */}
        {!isFullscreen && (
          <div style={{ width: '100%', height: 32, WebkitAppRegion: 'drag', position: 'fixed', top: 0, left: 0, zIndex: 10000 }} />
        )}
        {showDragRegion && (
          <div style={{ width: '100%', height: 32, WebkitAppRegion: 'drag', position: 'fixed', top: 0, left: 0, zIndex: 10000 }} />
        )}
        <div className="channels-grid" style={{ opacity: channelOpacity, transition: 'opacity 0.5s ease-in-out', position: 'relative', zIndex: 100, pointerEvents: 'auto' }}>
          {channels.map((channel) => {
            const config = channelConfigs[channel.id];
            if (config && !config.type) {
              console.warn('[WARNING] Channel config missing type:', channel.id, config);
            }
            const isConfigured = config && (config.media || config.path);
            return (
              <Channel
                key={channel.id}
                {...channel}
                empty={!isConfigured}
                media={mediaMap[channel.id]}
                path={appPathMap[channel.id]}
                type={config?.type}
                title={config?.title}
                hoverSound={config?.hoverSound}
                asAdmin={config?.asAdmin}
                onMediaChange={handleMediaChange}
                onAppPathChange={handleAppPathChange}
                onChannelSave={handleChannelSave}
                animatedOnHover={animatedOnHover}
                channelConfig={config}
                onHover={handleChannelHover}
                onOpenModal={() => setOpenChannelModal(channel.id)}
                animationStyle={channelAnimation}
                kenBurnsEnabled={kenBurnsEnabled}
                kenBurnsMode={kenBurnsMode}
              />
            );
          })}
        </div>
        <WiiRibbon
          onSettingsClick={handleSettingsClick}
          onSettingsChange={handleSettingsChange}
          onToggleDarkMode={handleToggleDarkMode}
          onToggleCursor={handleToggleCursor}
          useCustomCursor={useCustomCursor}
          glassWiiRibbon={glassWiiRibbon}
          onGlassWiiRibbonChange={setGlassWiiRibbon}
          animatedOnHover={animatedOnHover}
          setAnimatedOnHover={setAnimatedOnHover}
          startInFullscreen={startInFullscreen}
          setStartInFullscreen={setStartInFullscreen}
          ribbonColor={ribbonColor}
          onRibbonColorChange={setRibbonColor}
          recentRibbonColors={recentRibbonColors}
          onRecentRibbonColorChange={setRecentRibbonColors}
          ribbonGlowColor={ribbonGlowColor}
          onRibbonGlowColorChange={setRibbonGlowColor}
          recentRibbonGlowColors={recentRibbonGlowColors}
          onRecentRibbonGlowColorChange={setRecentRibbonGlowColors}
          ribbonGlowStrength={ribbonGlowStrength}
          ribbonGlowStrengthHover={ribbonGlowStrengthHover}
          setShowPresetsModal={useUIStore.getState().openPresetsModal}
          ribbonDockOpacity={ribbonDockOpacity}
          onRibbonDockOpacityChange={setRibbonDockOpacity}
          timeColor={timeColor}
          timeFormat24hr={timeFormat24hr}
          enableTimePill={enableTimePill}
          timePillBlur={timePillBlur}
          timePillOpacity={timePillOpacity}
          timeFont={timeFont}
          presetsButtonConfig={presetsButtonConfig}
          showPresetsButton={showPresetsButton}
        />
        {/* Channel Modal - rendered at top level for proper z-index */}
        {openChannelModal && (
          (() => {
            return (
              <ChannelModal
                channelId={openChannelModal}
                onClose={() => setOpenChannelModal(null)}
                onSave={handleChannelSave}
                currentMedia={mediaMap[openChannelModal]}
                currentPath={appPathMap[openChannelModal]}
                currentType={channelConfigs[openChannelModal]?.type}
                currentAsAdmin={channelConfigs[openChannelModal]?.asAdmin}
                currentAnimatedOnHover={channelConfigs[openChannelModal]?.animatedOnHover}
                currentHoverSound={channelConfigs[openChannelModal]?.hoverSound}
                currentKenBurnsEnabled={channelConfigs[openChannelModal]?.kenBurnsEnabled}
                currentKenBurnsMode={channelConfigs[openChannelModal]?.kenBurnsMode}
              />
            );
          })()
        )}
        {isLoading && <SplashScreen fadingOut={splashFading} />}
        <PresetsModal
          isOpen={showPresetsModal}
          onClose={closePresetsModal}
          presets={presets}
          onSavePreset={handleSavePreset}
          onDeletePreset={handleDeletePreset}
          onApplyPreset={handleApplyPreset}
          onUpdatePreset={handleUpdatePreset}
          onRenamePreset={handleRenamePreset}
          onImportPresets={handleImportPresets}
          onReorderPresets={handleReorderPresets}
        />
        <WallpaperModal
          isOpen={showWallpaperModal}
          onClose={closeWallpaperModal}
          onSettingsChange={handleSettingsChange}
        />
      </div>
    </>
  );
}

export default App;
