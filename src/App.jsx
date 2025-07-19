import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Channel from './components/Channel';
import ChannelModal from './components/ChannelModal';
import HomeButton from './components/HomeButton';
import SettingsButton from './components/SettingsButton';
import NotificationsButton from './components/NotificationsButton';
import WiiRibbon from './components/WiiRibbon';
import './App.css';
import SplashScreen from './components/SplashScreen';

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
  const [timeFormat24hr, setTimeFormat24hr] = useState(true); // Time format (24hr/12hr)
  const [enableTimePill, setEnableTimePill] = useState(true); // Time pill enabled
  const [timePillBlur, setTimePillBlur] = useState(8); // Time pill backdrop blur
  const [timePillOpacity, setTimePillOpacity] = useState(0.05); // Time pill background opacity
  const [channelAutoFadeTimeout, setChannelAutoFadeTimeout] = useState(5); // Channel auto-fade timeout
  const currentTimeColorRef = useRef('#ffffff');
  const currentTimeFormatRef = useRef(true);
  const [lastChannelHoverTime, setLastChannelHoverTime] = useState(Date.now());
  const [channelOpacity, setChannelOpacity] = useState(1);
  const fadeTimeoutRef = useRef(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [openChannelModal, setOpenChannelModal] = useState(null); // Track which channel modal is open

  const [channels, setChannels] = useState(Array(12).fill({ empty: true }));

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
          const startupAudio = new Audio(enabledStartupSound.url);
          startupAudio.volume = enabledStartupSound.volume ?? 0.6;
          startupAudio.play().catch(error => {
            console.log('Startup sound playback failed:', error);
            // Do not start background music here
          });
          startupAudio.addEventListener('ended', () => {
            console.log('Startup sound ended');
            // Do not start background music here
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
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause();
      backgroundAudioRef.current = null;
      setBackgroundAudio(null);
    }

    const bgMusicArr = soundLibrary?.backgroundMusic;
    console.log('All background music tracks:', bgMusicArr);
    const enabledMusicSound = enabledMusicSoundArg !== undefined ? enabledMusicSoundArg : bgMusicArr?.find(s => s.enabled);
    console.log('Enabled background music sound:', enabledMusicSound);
    if (enabledMusicSound) {
      if (!enabledMusicSound.url) {
        console.error('Enabled background music has no URL:', enabledMusicSound);
        return;
      }
      // Try to fetch the file to check if it exists
      try {
        const testAudio = new Audio(enabledMusicSound.url);
        testAudio.addEventListener('error', (e) => {
          console.error('Audio file could not be loaded:', enabledMusicSound.url, e);
        });
        testAudio.volume = 0;
        await testAudio.play().catch(err => {
          console.error('Test play failed for background music:', err);
      });
        testAudio.pause();
        testAudio.currentTime = 0;
      } catch (err) {
        console.error('Error testing background music file:', enabledMusicSound.url, err);
        return;
      }
      const audio = new Audio(enabledMusicSound.url);
      audio.volume = enabledMusicSound.volume ?? 0.4;
      audio.loop = true;
      audio.play().catch(error => {
        console.log('Background music playback failed:', error);
      });
      backgroundAudioRef.current = audio;
      setBackgroundAudio(audio);
      console.log('Background music started playing');
      } else {
        if (backgroundAudioRef.current) {
          backgroundAudioRef.current.pause();
          backgroundAudioRef.current = null;
          setBackgroundAudio(null);
        console.log('Background music stopped');
      }
      console.warn('No enabled background music sound found. Available:', bgMusicArr);
      }
  };

  // Optimized sound library updates using event-driven approach
  useEffect(() => {
    const handleSoundLibraryUpdate = async () => {
      console.log('Sound library updated, refreshing background music');
      const soundLibrary = await soundsApi?.getLibrary();
      if (soundLibrary) {
        const enabledMusicSound = soundLibrary?.backgroundMusic?.find(s => s.enabled);
        const isEnabled = !!enabledMusicSound;
        
        // Only update if there's an actual change
        const hasChanged = (
          (isEnabled !== lastMusicEnabledRef.current) ||
          (enabledMusicSound &&
            (enabledMusicSound.id !== lastMusicIdRef.current ||
             enabledMusicSound.url !== lastMusicUrlRef.current)
          )
        );
        
        if (hasChanged) {
          lastMusicIdRef.current = enabledMusicSound ? enabledMusicSound.id : null;
          lastMusicUrlRef.current = enabledMusicSound ? enabledMusicSound.url : null;
          lastMusicEnabledRef.current = isEnabled;
          setupBackgroundMusic(soundLibrary, enabledMusicSound);
        }
        
        // Only update state if it actually changed
        if (JSON.stringify(soundSettings) !== JSON.stringify(soundLibrary)) {
          setSoundSettings(soundLibrary);
        }
      }
    };

    // Fallback polling with longer interval (10 seconds instead of 2)
    const interval = setInterval(handleSoundLibraryUpdate, 10000);
    
    // Also listen for manual updates from SoundModal
    const handleManualUpdate = () => {
      handleSoundLibraryUpdate();
    };
    
    // Add event listener for manual updates (if available)
    if (window.api?.onSoundLibraryChanged) {
      window.api.onSoundLibraryChanged(handleManualUpdate);
    }
    
    return () => {
      clearInterval(interval);
      if (window.api?.offSoundLibraryChanged) {
        window.api.offSoundLibraryChanged();
      }
    };
  }, [soundSettings]);

  // Cleanup background audio on unmount
  useEffect(() => {
    return () => {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
        backgroundAudioRef.current = null;
      }
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
        setTimeFormat24hr(settings.timeFormat24hr ?? true); // Load timeFormat24hr
        setEnableTimePill(settings.enableTimePill ?? true); // Load enableTimePill
        setTimePillBlur(settings.timePillBlur ?? 8); // Load timePillBlur
        setTimePillOpacity(settings.timePillOpacity ?? 0.05); // Load timePillOpacity
        setChannelAutoFadeTimeout(settings.channelAutoFadeTimeout ?? 5); // Load channelAutoFadeTimeout
        currentTimeColorRef.current = settings.timeColor || '#ffffff';
        currentTimeFormatRef.current = settings.timeFormat24hr ?? true;
      }
      // Mark as initialized after loading settings
      setHasInitialized(true);
    }
    loadSettings();
  }, []);
  // Optimized settings persistence with debouncing
  useEffect(() => {
    // Only persist settings after initialization to prevent overwriting ribbonButtonConfigs on startup
    if (!hasInitialized) return;
    
    // Debounce the persist function to avoid excessive file I/O
    const timeoutId = setTimeout(async () => {
      let current = await settingsApi?.get();
      if (!current) current = {};
      
      // Ensure we never overwrite ribbonButtonConfigs if they exist
      // This prevents race conditions where button configs get reset
      const preservedButtonConfigs = current.ribbonButtonConfigs;
      
      // Merge new state with current, preserving ribbonButtonConfigs and other existing data
      const merged = {
        ...current, // This preserves ribbonButtonConfigs and any other existing settings
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
        timeFormat24hr, // Persist timeFormat24hr
        enableTimePill, // Persist enableTimePill
        timePillBlur, // Persist timePillBlur
        timePillOpacity, // Persist timePillOpacity
        channelAutoFadeTimeout, // Persist channelAutoFadeTimeout
      };
      
      // Double-check: if we had button configs before, make sure they're still there
      if (preservedButtonConfigs && !merged.ribbonButtonConfigs) {
        merged.ribbonButtonConfigs = preservedButtonConfigs;
        console.log('App: Restored ribbonButtonConfigs that were about to be lost');
      }
      
      console.log('App: Persisting settings:', merged);
      console.log('App: Preserved ribbonButtonConfigs:', merged.ribbonButtonConfigs);
      await settingsApi?.set(merged);
    }, 1000); // Debounce for 1 second
    
    return () => clearTimeout(timeoutId);
  }, [hasInitialized, isDarkMode, useCustomCursor, glassWiiRibbon, glassOpacity, glassBlur, glassBorderOpacity, glassShineOpacity, animatedOnHover, startInFullscreen, wallpaper, wallpaperOpacity, savedWallpapers, likedWallpapers, cycleWallpapers, cycleInterval, cycleAnimation, slideDirection, crossfadeDuration, crossfadeEasing, slideRandomDirection, slideDuration, slideEasing, timeColor, timeFormat24hr, enableTimePill, timePillBlur, timePillOpacity, channelAutoFadeTimeout]);

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
        // Preserve current time settings if they exist, otherwise use saved values
        setTimeColor(wallpaperData?.timeColor || currentTimeColorRef.current || '#ffffff');
        setTimeFormat24hr(wallpaperData?.timeFormat24hr ?? currentTimeFormatRef.current ?? true);
        setEnableTimePill(wallpaperData?.enableTimePill ?? true);
        setTimePillBlur(wallpaperData?.timePillBlur ?? 8);
        setTimePillOpacity(wallpaperData?.timePillOpacity ?? 0.05);
        
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
    if (newSettings.timeColor !== undefined) {
      setTimeColor(newSettings.timeColor);
      currentTimeColorRef.current = newSettings.timeColor;
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

  // Optimized wallpaper cycling using CSS transitions
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
        
        // Start CSS-based transition
        console.log('Starting CSS transition to:', nextWallpaperData);
        
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
          }
        }
        
        // Set up CSS transition
        setIsTransitioning(true);
        setNextWallpaper(nextWallpaperData);
        
        // Use CSS transition duration
        const transitionDuration = getTransitionType() === 'slide' ? slideDuration * 1000 : crossfadeDuration * 1000;
        
        // Let CSS handle the animation, then update state
        setTimeout(() => {
          setWallpaper(nextWallpaperData);
          currentWallpaperRef.current = nextWallpaperData; // Update ref
          setWallpaperOpacity(1);
          setNextWallpaper(null);
          setIsTransitioning(false);
          console.log('CSS transition complete');
          
          // Schedule next cycle
          console.log('Scheduling next cycle in', cycleInterval, 'seconds');
          cycleTimeoutRef.current = setTimeout(cycleToNextWallpaper, cycleInterval * 1000);
        }, transitionDuration);
      })
      .catch((error) => {
        console.error('Failed to preload next wallpaper:', error);
        // Fallback to instant switch if preloading fails
        setWallpaper(nextWallpaperData);
        currentWallpaperRef.current = nextWallpaperData; // Update ref
        setWallpaperOpacity(1);
        setNextWallpaper(null);
        setIsTransitioning(false);
        
        // Schedule next cycle
        console.log('Scheduling next cycle in', cycleInterval, 'seconds');
        cycleTimeoutRef.current = setTimeout(cycleToNextWallpaper, cycleInterval * 1000);
      });
    
  }, [cycleList, cycleInterval, cycleAnimation, isTransitioning, slideDirection, getTransitionType, slideDuration, crossfadeDuration, slideRandomDirection]);
  
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
    const channelData = await channelsApi?.get();
    setChannelConfigs(channelData || {});
  };

  // Optimized channel auto-fade logic using RequestAnimationFrame
  useEffect(() => {
    if (channelAutoFadeTimeout <= 0) {
      setChannelOpacity(1);
      return;
    }

    const checkFadeTimeout = () => {
      const now = Date.now();
      const timeSinceLastHover = now - lastChannelHoverTime;
      const timeoutMs = channelAutoFadeTimeout * 1000;
      
      const shouldFade = timeSinceLastHover >= timeoutMs;
      const newOpacity = shouldFade ? 0.3 : 1;
      
      // Only update if opacity actually changed
      if (channelOpacity !== newOpacity) {
        setChannelOpacity(newOpacity);
      }
      
      // Continue checking only if needed (within 2 seconds of timeout)
      if (timeSinceLastHover < timeoutMs + 2000) {
        requestAnimationFrame(checkFadeTimeout);
      }
    };

    // Start the RAF loop
    requestAnimationFrame(checkFadeTimeout);

    // No cleanup needed as RAF will stop naturally
  }, [channelAutoFadeTimeout, lastChannelHoverTime, channelOpacity]);

  // Pause/resume background music on window blur/focus
  useEffect(() => {
    const handleBlur = () => {
      if (backgroundAudioRef.current && !backgroundAudioRef.current.paused) {
        backgroundAudioRef.current.pause();
      }
    };
    const handleFocus = () => {
      if (backgroundAudioRef.current) {
        const audio = backgroundAudioRef.current;
        const targetVolume = audio.volume;
        audio.volume = 0;
        audio.play().catch(() => {});
        // Fade in over 1.5 seconds
        let v = 0;
        const fade = setInterval(() => {
          v += targetVolume / 15; // 100ms steps
          if (v < targetVolume) {
            audio.volume = Math.min(v, targetVolume);
          } else {
            audio.volume = targetVolume;
            clearInterval(fade);
          }
        }, 100);
      }
    };
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [backgroundAudioRef]);

  // Add a drag region at the top of the window only when not in fullscreen
  const [isFullscreen, setIsFullscreen] = useState(true);
  useEffect(() => {
    if (window.api && window.api.onFullscreenState) {
      window.api.onFullscreenState((val) => setIsFullscreen(val));
    }
  }, []);

  // Toast UI
  return (
    <>
      {/* Always render the main UI, but overlay the splash screen while loading */}
      <div className={`app-container ${useCustomCursor ? 'custom-cursor' : ''}`} style={{ filter: isLoading ? 'blur(2px)' : 'none', pointerEvents: isLoading ? 'none' : 'auto' }}>
        {/* Wii Cursor - rendered outside app container to avoid blur filter */}
        {useCustomCursor && <WiiCursor />}
        {/* Wallpaper background layer - with CSS transitions */}
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
              opacity: wallpaperOpacity,
              transition: isTransitioning ? `opacity ${crossfadeDuration}s ${crossfadeEasing}` : 'none',
              willChange: isTransitioning ? 'opacity' : 'auto',
            }}
          />
        )}
        {/* Next wallpaper layer for CSS transitions */}
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
              opacity: getTransitionType() === 'crossfade' ? 1 : 0,
              transform: getTransitionType() === 'slide' ? getSlideTransform(slideDirection, true) : 'none',
              transition: `opacity ${crossfadeDuration}s ${crossfadeEasing}, transform ${slideDuration}s ${slideEasing}`,
              willChange: 'opacity, transform',
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
          enableTimePill={enableTimePill}
          timePillBlur={timePillBlur}
          timePillOpacity={timePillOpacity}
          startInFullscreen={startInFullscreen}
          setStartInFullscreen={setStartInFullscreen}
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
      </div>
    </>
  );
}

export default App;
