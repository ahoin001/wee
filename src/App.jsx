
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
  const [showWallpaperModal, setShowWallpaperModal] = useState(false); // track modal open
  const cycleTimeoutRef = useRef();
  const lastMusicIdRef = useRef(null);
  const lastMusicUrlRef = useRef(null);
  const lastMusicEnabledRef = useRef(false);
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

  const [channels, setChannels] = useState(Array(12).fill({ empty: true }));
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [presets, setPresets] = useState([]);

  // Preset handlers (must be inside App)
  const handleSavePreset = (name, includeChannels = false) => {
    if (presets.length >= 6) return;
    const data = {
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
    
    // Include channel data if requested
    if (includeChannels) {
      data.channels = channels;
      data.mediaMap = mediaMap;
      data.appPathMap = appPathMap;
    }
    
    console.log('Saving preset:', name, 'with timeFont:', timeFont, 'includeChannels:', includeChannels, 'data:', data);
    setPresets(prev => [...prev, { name, data }].slice(0, 6));
  };
  const handleDeletePreset = (name) => {
    setPresets(prev => prev.filter(p => p.name !== name));
  };
  const handleApplyPreset = (preset) => {
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
    if (d.wallpaper && d.wallpaper.url && window.api?.wallpapers?.setActive) {
      window.api.wallpapers.setActive({ url: d.wallpaper.url });
    }
    setRibbonButtonConfigs(d.ribbonButtonConfigs || []); // This now includes textFont for each button
    setPresetsButtonConfig(d.presetsButtonConfig || { type: 'icon', icon: 'star' }); // Apply presets button config
    
    // Apply channel data if present
    if (d.channels && d.mediaMap && d.appPathMap) {
      setChannels(d.channels);
      setMediaMap(d.mediaMap);
      setAppPathMap(d.appPathMap);
      
      // Save channel data to persistent storage
      const channelData = {};
      d.channels.forEach(channel => {
        if (!channel.empty) {
          channelData[channel.id] = {
            media: d.mediaMap[channel.id] || null,
            path: d.appPathMap[channel.id] || null
          };
        }
      });
      channelsApi?.set(channelData);
    }
    
    setShowPresetsModal(false);
  };

  // On mount, load all modular data
  useEffect(() => {
    async function loadAll() {
      // Load sounds
      const soundData = await soundsApi.get();
      setSoundSettings(soundData || {});
      // Load wallpapers
      const wallpaperData = await wallpapersApi.get();
      setWallpaper(wallpaperData?.wallpaper || null);
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
          gridChannels.push({ id, ...channelData[id], empty: !(channelData[id].media || channelData[id].path) });
        } else {
          gridChannels.push({ id, empty: true });
        }
      }
      setChannels(gridChannels);
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

  // Load sound settings and play startup sound
  useEffect(() => {
    async function loadSettings() {
      let soundLibrary = await soundsApi?.getLibrary();
      console.log('Loading sound library:', soundLibrary);
      
      if (soundLibrary) {
        // Play startup sound if enabled
        let playedStartup = false;
        const enabledStartupSound = soundLibrary.startup?.find(s => s.enabled);
        console.log('Enabled startup sound:', enabledStartupSound);
        if (enabledStartupSound) {
          playedStartup = true;
          audioManager.playSound(enabledStartupSound.url, enabledStartupSound.volume ?? 0.6).catch(error => {
            console.log('Startup sound playback failed:', error);
          });
        }
        // If no startup sound, do not start background music here
      }
    }
    loadSettings();
  }, []);

  // Persist sound settings whenever they change
  useEffect(() => {
    if (soundSettings) {
      // Save sound settings as part of the main settings object
      soundsApi?.set({ sounds: soundSettings });
    }
  }, [soundSettings]);

  // In setupBackgroundMusic, stop playback if no enabled track, and show toast on change
  const setupBackgroundMusic = async (soundLibrary, enabledMusicSoundArg) => {
    console.log('Setting up background music with library:', soundLibrary);
    
    const bgMusicArr = soundLibrary?.backgroundMusic;
    console.log('All background music tracks:', bgMusicArr);
    const enabledMusicSound = enabledMusicSoundArg !== undefined ? enabledMusicSoundArg : bgMusicArr?.find(s => s.enabled);
    console.log('Enabled background music sound:', enabledMusicSound);
    
    if (enabledMusicSound) {
      if (!enabledMusicSound.url) {
        console.error('Enabled background music has no URL:', enabledMusicSound);
        return;
      }
      
      // Use AudioManager to set background music
      audioManager.setBackgroundMusic(enabledMusicSound.url, enabledMusicSound.volume ?? 0.4);
      setBackgroundAudio(audioManager.backgroundAudio);
      console.log('Background music started playing');
    } else {
      // Stop background music
      audioManager.setBackgroundMusic(null);
      setBackgroundAudio(null);
      console.log('Background music stopped');
      console.warn('No enabled background music sound found. Available:', bgMusicArr);
    }
  };

  // Listen for sound library updates from SoundModal (polling mechanism)
  useEffect(() => {
    const handleSoundLibraryUpdate = async () => {
      console.log('Sound library updated, refreshing background music');
      const soundLibrary = await soundsApi?.getLibrary();
      if (soundLibrary) {
        const enabledMusicSound = soundLibrary?.backgroundMusic?.find(s => s.enabled);
        const isEnabled = !!enabledMusicSound;
        if (
          (isEnabled !== lastMusicEnabledRef.current) ||
          (enabledMusicSound &&
            (enabledMusicSound.id !== lastMusicIdRef.current ||
             enabledMusicSound.url !== lastMusicUrlRef.current)
          )
        ) {
          lastMusicIdRef.current = enabledMusicSound ? enabledMusicSound.id : null;
          lastMusicUrlRef.current = enabledMusicSound ? enabledMusicSound.url : null;
          lastMusicEnabledRef.current = isEnabled;
          setupBackgroundMusic(soundLibrary, enabledMusicSound);
        }
        setSoundSettings(soundLibrary); // ensure state is in sync
      }
    };
    const taskId = intervalManager.addTask(handleSoundLibraryUpdate, 5000, 'sound-library-update'); // Check every 5 seconds
    return () => intervalManager.removeTask(taskId);
  }, []);

  // Cleanup background audio and intervals on unmount
  useEffect(() => {
    return () => {
      audioManager.cleanup();
      intervalManager.cleanup();
    };
  }, []);

  // Load channel configurations from persistent storage
  useEffect(() => {
    async function loadChannelConfigs() {
      let configs = await channelsApi?.get();
      if (!configs) configs = {};
        setChannelConfigs(configs);
        // Update mediaMap and appPathMap from saved configs
        const newMediaMap = {};
        const newAppPathMap = {};
        Object.entries(configs).forEach(([channelId, config]) => {
          if (config.media) newMediaMap[channelId] = config.media;
          if (config.path) newAppPathMap[channelId] = config.path;
        });
        setMediaMap(newMediaMap);
        setAppPathMap(newAppPathMap);
    }
    loadChannelConfigs();
  }, []);

  // Note: Channel configs are saved directly in handleChannelSave, not here
  // to avoid overwriting data on app startup

  // Load settings (including barType) from persistent storage
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
        setWallpaper(settings.wallpaper || null);
        setWallpaperOpacity(settings.wallpaperOpacity ?? 1);
        setSavedWallpapers(settings.savedWallpapers || []);
        setLikedWallpapers(settings.likedWallpapers || []);
        setCycleWallpapers(settings.cycleWallpapers ?? false);
        setCycleInterval(settings.cycleInterval ?? 30);
        setCycleAnimation(settings.cycleAnimation || 'fade');
        setSlideDirection(settings.slideDirection || 'right');
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
        wallpaperBlur,
        timeFont, // Persist timeFont
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
  }, [hasInitialized, isDarkMode, useCustomCursor, glassWiiRibbon, glassOpacity, glassBlur, glassBorderOpacity, glassShineOpacity, animatedOnHover, startInFullscreen, wallpaper, wallpaperOpacity, savedWallpapers, likedWallpapers, cycleWallpapers, cycleInterval, cycleAnimation, slideDirection, crossfadeDuration, crossfadeEasing, slideRandomDirection, slideDuration, slideEasing, timeColor, recentTimeColors, timeFormat24hr, enableTimePill, timePillBlur, timePillOpacity, channelAutoFadeTimeout, ribbonButtonConfigs, ribbonColor, recentRibbonColors, ribbonGlowColor, recentRibbonGlowColors, ribbonGlowStrength, ribbonGlowStrengthHover, ribbonDockOpacity, presets, presetsButtonConfig, showPresetsButton, wallpaperBlur, timeFont]);

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
      const updated = {
        ...prev,
        [channelId]: channelData
      };
      // Save the updated configs
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
  };

  // Compute the list of wallpapers to cycle through
  const cycleList = useMemo(() => {
    const list = savedWallpapers.filter(w => likedWallpapers.includes(w.url));
    console.log('Cycle list debug:', {
      savedWallpapersCount: savedWallpapers.length,
      likedWallpapersCount: likedWallpapers.length,
      cycleListCount: list.length,
      savedWallpapers: savedWallpapers.map(w => ({ url: w.url, name: w.name })),
      likedWallpapers: likedWallpapers,
      cycleList: list.map(w => ({ url: w.url, name: w.name }))
    });
    return list;
  }, [savedWallpapers, likedWallpapers]);
  
  // Function to preload an image with enhanced optimization
  const preloadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // Set crossOrigin for better caching
      img.crossOrigin = 'anonymous';
      
      // Add loading optimization
      img.onload = () => {
        // Force a small delay to ensure image is fully decoded
        setTimeout(() => resolve(img), 10);
      };
      
      img.onerror = (error) => {
        console.error('Failed to preload image:', url, error);
        reject(error);
      };
      
      // Start loading
      img.src = url;
    });
  };

  // Map cycleAnimation to transitionType
  const getTransitionType = useCallback(() => {
    switch (cycleAnimation) {
      case 'slide':
        return 'slide';
      case 'fade':
        return 'crossfade';
      default:
        return 'crossfade';
    }
  }, [cycleAnimation]);

  // Apply easing function based on user selection
  const applyEasing = useCallback((progress, easingType) => {
    switch (easingType) {
      case 'ease-out':
        return 1 - Math.pow(1 - progress, 3); // Ease-out cubic
      case 'ease-in':
        return Math.pow(progress, 3); // Ease-in cubic
      case 'ease-in-out':
        return progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2; // Ease-in-out cubic
      case 'linear':
        return progress; // Linear
      default:
        return 1 - Math.pow(1 - progress, 3); // Default to ease-out
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

  // Function to cycle to next wallpaper - memoized to prevent unnecessary re-creation
  const cycleToNextWallpaper = useCallback(() => {
    console.log('cycleToNextWallpaper called!');
    
    // Prevent starting a new transition if one is already in progress
    if (isTransitioning) {
      console.log('Transition already in progress, skipping');
      return;
    }
    
    if (cycleList.length === 0) {
      console.log('cycleList is empty, returning');
      return;
    }
    
    // Find current wallpaper index in cycle list using ref
    let currentIndex = cycleList.findIndex(w => w.url === currentWallpaperRef.current?.url);
    console.log('Current wallpaper:', currentWallpaperRef.current?.url);
    console.log('Cycle list:', cycleList.map(w => w.url));
    console.log('Current index found:', currentIndex);
    
    // If current wallpaper is not in the cycle list, start from the beginning
    if (currentIndex === -1) {
      console.log('Current wallpaper not in cycle list, starting from beginning');
      currentIndex = -1; // This will make nextIndex = 0
    }
    
    // Calculate next index
    const nextIndex = (currentIndex + 1) % cycleList.length;
    const nextWallpaperData = cycleList[nextIndex];
    
    console.log('Wallpaper cycling:', {
      currentWallpaper: currentWallpaperRef.current?.url,
      currentIndex,
      nextIndex,
      nextWallpaper: nextWallpaperData?.url,
      cycleListLength: cycleList.length,
      cycleInterval,
      cycleAnimation,
      transitionType: getTransitionType()
    });
    
    // Preload the next wallpaper before starting transition
    console.log('Preloading next wallpaper:', nextWallpaperData?.url);
    preloadImage(nextWallpaperData.url)
      .then(() => {
        console.log('Next wallpaper preloaded successfully');
        
        // Start smooth transition
        console.log('Starting smooth transition to:', nextWallpaperData);
        
        // Small delay to ensure smooth state updates
        requestAnimationFrame(() => {
          setIsTransitioning(true);
          setNextWallpaper(nextWallpaperData);
          setCrossfadeProgress(0); // Reset crossfade progress
          setSlideProgress(0); // Reset slide progress
          
          // Choose slide direction based on saved setting (only for slide transitions)
          if (getTransitionType() === 'slide') {
            if (slideRandomDirection) {
              // Use random direction selection with preference for horizontal
              const horizontalDirections = ['left', 'right'];
              const verticalDirections = ['up', 'down'];
              
              let selectedDirection;
              if (Math.random() < 0.7) {
                // Prefer horizontal scrolling
                selectedDirection = horizontalDirections[Math.floor(Math.random() * horizontalDirections.length)];
              } else {
                // Occasionally use vertical scrolling
                selectedDirection = verticalDirections[Math.floor(Math.random() * verticalDirections.length)];
              }
              
              setSlideDirection(selectedDirection);
            } else {
              // Use the saved slideDirection
              setSlideDirection(slideDirection);
            }
          }
          
          // Transition duration and steps based on animation type
          const transitionDuration = getTransitionType() === 'slide' ? slideDuration * 1000 : crossfadeDuration * 1000;
          const fadeSteps = getTransitionType() === 'slide' ? 90 : 120; // Fewer steps for slide but still smooth
          const stepDuration = transitionDuration / fadeSteps;
          
          let currentStep = 0;
          const fadeInterval = setInterval(() => {
            currentStep++;
            const rawProgress = currentStep / fadeSteps;
            
            // Apply easing function for smoother animation
            let progress = applyEasing(rawProgress, getTransitionType() === 'slide' ? slideEasing : crossfadeEasing);
            
            // Apply additional smoothing for crossfade
            let finalProgress = progress;
            if (getTransitionType() === 'crossfade') {
              // Use the easing function result directly for crossfade
              finalProgress = progress;
            } else if (getTransitionType() === 'slide') {
              // Use the easing function result directly for slide
              finalProgress = progress;
            }
            
            if (getTransitionType() === 'crossfade') {
              // Crossfade transition - use separate state with easing
              // Batch updates for better performance
              requestAnimationFrame(() => {
                setCrossfadeProgress(finalProgress);
              });
            } else if (getTransitionType() === 'slide') {
              // Slide transition - animate the slide progress
              requestAnimationFrame(() => {
                setSlideProgress(finalProgress);
              });
            }
            
            if (currentStep >= fadeSteps) {
              // Transition complete - use requestAnimationFrame for smooth final update
              clearInterval(fadeInterval);
              requestAnimationFrame(() => {
                setWallpaper(nextWallpaperData);
                currentWallpaperRef.current = nextWallpaperData; // Update ref
                setWallpaperOpacity(1);
                setCrossfadeProgress(0);
                setSlideProgress(0);
                setNextWallpaper(null);
                setIsTransitioning(false);
                console.log('Transition complete');
                
                // Schedule next cycle
                console.log('Scheduling next cycle in', cycleInterval, 'seconds');
                cycleTimeoutRef.current = setTimeout(cycleToNextWallpaper, cycleInterval * 1000);
              });
            }
          }, stepDuration);
        });
      })
      .catch((error) => {
        console.error('Failed to preload next wallpaper:', error);
        // Fallback to instant switch if preloading fails
        setWallpaper(nextWallpaperData);
        currentWallpaperRef.current = nextWallpaperData; // Update ref
        setWallpaperOpacity(1);
        setCrossfadeProgress(0);
        setSlideProgress(0);
        setNextWallpaper(null);
        setIsTransitioning(false);
        
        // Schedule next cycle
        console.log('Scheduling next cycle in', cycleInterval, 'seconds');
        cycleTimeoutRef.current = setTimeout(cycleToNextWallpaper, cycleInterval * 1000);
      });
    
  }, [cycleList, cycleInterval, cycleAnimation, isTransitioning, slideDirection, getTransitionType, slideDuration, crossfadeDuration, slideRandomDirection, slideEasing, crossfadeEasing, applyEasing]); // Removed wallpaper from dependencies
  
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
    const handleFocus = () => {
      audioManager.resumeBackgroundMusic();
    };
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
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
  const handleUpdatePreset = (name) => {
    console.log('Updating preset:', name, 'with current timeFont:', timeFont);
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
        // Preserve existing channel data if present
        ...(p.data.channels && { channels: p.data.channels }),
        ...(p.data.mediaMap && { mediaMap: p.data.mediaMap }),
        ...(p.data.appPathMap && { appPathMap: p.data.appPathMap }),
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
      setShowWallpaperModal(true);
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
          setShowPresetsModal={setShowPresetsModal}
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
          <ChannelModal
            channelId={openChannelModal}
            onClose={() => setOpenChannelModal(null)}
            onSave={handleChannelSave}
            currentMedia={mediaMap[openChannelModal]}
            currentPath={appPathMap[openChannelModal]}
            currentType={channelConfigs[openChannelModal]?.type}
            currentAsAdmin={channelConfigs[openChannelModal]?.asAdmin}
            currentAnimatedOnHover={channelConfigs[openChannelModal]?.animatedOnHover}
          />
        )}
        {isLoading && <SplashScreen fadingOut={splashFading} />}
        <PresetsModal
          isOpen={showPresetsModal}
          onClose={() => setShowPresetsModal(false)}
          presets={presets}
          onSavePreset={handleSavePreset}
          onDeletePreset={handleDeletePreset}
          onApplyPreset={handleApplyPreset}
          onUpdatePreset={handleUpdatePreset}
          onRenamePreset={handleRenamePreset}
        />
        <WallpaperModal
          isOpen={showWallpaperModal}
          onClose={() => setShowWallpaperModal(false)}
          onSettingsChange={handleSettingsChange}
        />
      </div>
    </>
  );
}

export default App;
