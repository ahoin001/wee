import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ChannelModal from './components/ChannelModal';
import PaginatedChannels from './components/PaginatedChannels';
import PageNavigation from './components/PageNavigation';
import usePageNavigationStore from './utils/usePageNavigationStore';
import WiiSideNavigation from './components/WiiSideNavigation';
import HomeButton from './components/HomeButton';
import NotificationsButton from './components/NotificationsButton';
import WiiRibbon from './components/WiiRibbon';
import ClassicWiiDock from './components/ClassicWiiDock';
import ClassicDockSettingsModal from './components/ClassicDockSettingsModal';
import PrimaryActionsModal from './components/PrimaryActionsModal';
import WallpaperModal from './components/WallpaperModal';
import WallpaperOverlay from './components/WallpaperOverlay';
import NavigationCustomizationModal from './components/NavigationCustomizationModal';
import GeneralSettingsModal from './components/GeneralSettingsModal';
import TimeSettingsModal from './components/TimeSettingsModal';
import RibbonSettingsModal from './components/RibbonSettingsModal';
import UpdateModal from './components/UpdateModal';
import ChannelSettingsModal from './components/ChannelSettingsModal';
import LayoutManagerModal from './components/LayoutManagerModal';
import AppShortcutsModal from './components/AppShortcutsModal';
import './App.css';
import SplashScreen from './components/SplashScreen';
import PresetsModal from './components/PresetsModal';
import audioManager from './utils/AudioManager';
import intervalManager from './utils/IntervalManager';
import useAppLibraryStore from './utils/useAppLibraryStore';
import useUIStore from './utils/useUIStore';
import Text from './ui/Text';


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
    showChannelSettingsModal,
    showLayoutManagerModal,
    showAppShortcutsModal,
    showGeneralSettingsModal,
    showTimeSettingsModal,
    showRibbonSettingsModal,
    showUpdateModal,
    showPrimaryActionsModal,
    pendingPrimaryActionSave,
    closePresetsModal,
    closeWallpaperModal,
    closeSoundModal,
    closeChannelSettingsModal,
    closeLayoutManagerModal,
    closeAppShortcutsModal,
    closeGeneralSettingsModal,
    closeTimeSettingsModal,
    closeRibbonSettingsModal,
    closeUpdateModal,
    closePrimaryActionsModal,
    openPrimaryActionsModal,
    loadKeyboardShortcuts
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
  const [gridSettings, setGridSettings] = useState({
    rowGap: 16,
    columnGap: 16,
    gridPosition: 'center',
    responsiveRows: 3, // Original default: 3 rows
    responsiveColumns: 4, // Original default: 4 columns
    hiddenChannels: [],
    gridAlignment: 'start',
    gridJustification: 'center'
  });
  const [ribbonButtonConfigs, setRibbonButtonConfigs] = useState(null); // Track ribbon button configs
  const [accessoryButtonConfig, setAccessoryButtonConfig] = useState({}); // Track accessory button config
  const [presetsButtonConfig, setPresetsButtonConfig] = useState({ type: 'icon', icon: 'star', useAdaptiveColor: false, useGlowEffect: false, glowStrength: 20, useGlassEffect: false, glassOpacity: 0.18, glassBlur: 2.5, glassBorderOpacity: 0.5, glassShineOpacity: 0.7 }); // Track presets button config
  const [showPresetsButton, setShowPresetsButton] = useState(false); // Show/hide presets button, disabled by default
  const [showDock, setShowDock] = useState(true); // Show/hide the Wii Ribbon dock
  const [classicMode, setClassicMode] = useState(false); // Classic Mode toggle
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [activeButtonIndex, setActiveButtonIndex] = useState(0); // Track which button is being configured
  
  // Classic Dock Settings
  const [dockSettings, setDockSettings] = useState({
    dockBaseGradientStart: '#BDBEC2',
    dockBaseGradientEnd: '#DADDE6',
    dockAccentColor: '#33BEED',
    sdCardBodyColor: '#B9E1F2',
    sdCardBorderColor: '#33BEED',
    sdCardLabelColor: 'white',
    sdCardLabelBorderColor: '#F4F0EE',
    sdCardBottomColor: '#31BEED',
    leftPodBaseColor: '#D2D3DA',
    leftPodAccentColor: '#B6B6BB',
    leftPodDetailColor: '#D7D8DA',
    rightPodBaseColor: '#DCDCDF',
    rightPodAccentColor: '#E4E4E4',
    rightPodDetailColor: '#B6B6BB',
    buttonBorderColor: '#22BEF3',
    buttonGradientStart: '#E0DCDC',
    buttonGradientEnd: '#CBCBCB',
    buttonIconColor: '#979796',
    rightButtonIconColor: '#A4A4A4',
    glassEnabled: false,
    glassOpacity: 0.18,
    glassBlur: 2.5,
    glassBorderOpacity: 0.5,
    glassShineOpacity: 0.7,
    recentDockColors: [],
    recentAccentColors: [],
  });
  const [showClassicDockSettingsModal, setShowClassicDockSettingsModal] = useState(false);
  
  // Modal states for when dock is hidden
  // These modals are now managed by Zustand store
  // const [showGeneralModal, setShowGeneralModal] = useState(false);
  // const [showTimeSettingsModal, setShowTimeSettingsModal] = useState(false);
  // const [showRibbonSettingsModal, setShowRibbonSettingsModal] = useState(false);
  // const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  
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
  
  // Overlay effect settings
  const [overlayEnabled, setOverlayEnabled] = useState(false);
  const [overlayEffect, setOverlayEffect] = useState('snow');
  const [overlayIntensity, setOverlayIntensity] = useState(50);
  const [overlaySpeed, setOverlaySpeed] = useState(1);
  const [overlayWind, setOverlayWind] = useState(0.02);
  const [overlayGravity, setOverlayGravity] = useState(0.1);
  
  const [timeFont, setTimeFont] = useState('default'); // Add this to state
  const [channelAnimation, setChannelAnimation] = useState(null); // Add to app state
  const [adaptiveEmptyChannels, setAdaptiveEmptyChannels] = useState(true);
  
  // Idle channel animation settings
  const [idleAnimationEnabled, setIdleAnimationEnabled] = useState(false);
  const [idleAnimationTypes, setIdleAnimationTypes] = useState(['pulse', 'bounce', 'glow']);
  const [idleAnimationInterval, setIdleAnimationInterval] = useState(8);
  
  // Ken Burns settings
  const [kenBurnsEnabled, setKenBurnsEnabled] = useState(false);
  const [kenBurnsMode, setKenBurnsMode] = useState('hover');
  
  // Advanced Ken Burns settings
  const [kenBurnsHoverScale, setKenBurnsHoverScale] = useState(1.1);
  const [kenBurnsAutoplayScale, setKenBurnsAutoplayScale] = useState(1.15);
  const [kenBurnsSlideshowScale, setKenBurnsSlideshowScale] = useState(1.08);
  const [kenBurnsHoverDuration, setKenBurnsHoverDuration] = useState(8000);
  const [kenBurnsAutoplayDuration, setKenBurnsAutoplayDuration] = useState(12000);
  const [kenBurnsSlideshowDuration, setKenBurnsSlideshowDuration] = useState(10000);
  const [kenBurnsCrossfadeDuration, setKenBurnsCrossfadeDuration] = useState(1000);
  
  // Ken Burns media type support
  const [kenBurnsForGifs, setKenBurnsForGifs] = useState(false);
  const [kenBurnsForVideos, setKenBurnsForVideos] = useState(false);
  
  // Ken Burns animation easing
  const [kenBurnsEasing, setKenBurnsEasing] = useState('ease-out');
  const [kenBurnsAnimationType, setKenBurnsAnimationType] = useState('both');
  const [kenBurnsCrossfadeReturn, setKenBurnsCrossfadeReturn] = useState(true);
  const [kenBurnsTransitionType, setKenBurnsTransitionType] = useState('cross-dissolve');

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
      
      // Load overlay settings
      setOverlayEnabled(wallpaperData?.overlayEnabled ?? false);
      setOverlayEffect(wallpaperData?.overlayEffect ?? 'snow');
      setOverlayIntensity(wallpaperData?.overlayIntensity ?? 50);
      setOverlaySpeed(wallpaperData?.overlaySpeed ?? 1);
      setOverlayWind(wallpaperData?.overlayWind ?? 0.02);
      setOverlayGravity(wallpaperData?.overlayGravity ?? 0.1);
      
      // Note: showDock is now loaded from general settings API in loadSettings()
      // to avoid conflicts with ribbon button configs and other general settings
      
      // Utility function to validate media URLs
      const validateMediaUrl = (media) => {
        if (!media || !media.url) return null;
        
        // Check for invalid blob URLs (should not persist after restart)
        if (media.url.startsWith('blob:')) {
          console.warn('Found invalid blob URL in saved channel data:', media.url);
          return null;
        }
        
        // Validate userdata URLs format
        if (media.url.startsWith('userdata://')) {
          const validPrefixes = ['userdata://wallpapers/', 'userdata://sounds/', 'userdata://icons/'];
          const isValidPrefix = validPrefixes.some(prefix => media.url.startsWith(prefix));
          if (!isValidPrefix) {
            console.warn('Found invalid userdata URL format:', media.url);
            return null;
          }
        }
        
        return media;
      };
      
      // Load channels - no hardcoded limit, let PaginatedChannels handle dynamic generation
      const channelData = await channelsApi.get();
      
      // Create a minimal channels array for backward compatibility (not used by PaginatedChannels)
      const gridChannels = [];
      for (let i = 0; i < 12; i++) {
        const id = `channel-${i}`;
        gridChannels.push({ id, empty: true });
      }
      setChannels(gridChannels);
      
      // Set channelConfigs to the processed channel data
      const processedConfigs = {};
      Object.entries(channelData || {}).forEach(([channelId, config]) => {
        let processedConfig = { ...config };
        
        // Validate and clean media URLs
        if (processedConfig.media) {
          const validatedMedia = validateMediaUrl(processedConfig.media);
          if (!validatedMedia) {
            console.warn(`Removing invalid media URL from channel config ${channelId}:`, processedConfig.media?.url);
            processedConfig.media = null;
          } else {
            processedConfig.media = validatedMedia;
          }
        }
        
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

  // Initialize global mouse navigation
  useEffect(() => {
   
    const cleanup = usePageNavigationStore.getState().initializeGlobalNavigation();
    
    return cleanup; // This will clean up the event listeners when component unmounts
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
        setClassicMode(settings.classicMode ?? false);
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
        setGridSettings(settings.gridSettings ?? {
          rowGap: 16,
          columnGap: 16,
          gridPosition: 'center',
          responsiveRows: 3, // Original default: 3 rows
          responsiveColumns: 4, // Original default: 4 columns
          hiddenChannels: [],
          gridAlignment: 'start',
          gridJustification: 'center'
        }); // Load gridSettings
        currentTimeColorRef.current = settings.timeColor || '#ffffff';
        currentTimeFormatRef.current = settings.timeFormat24hr ?? true;
        setTimeFont(settings.timeFont || 'default');
              setChannelAnimation(settings.channelAnimation || 'none'); // Load channelAnimation
      setAdaptiveEmptyChannels(settings.adaptiveEmptyChannels ?? true);
      
      // Load idle animation settings
      setIdleAnimationEnabled(settings.idleAnimationEnabled ?? false);
      setIdleAnimationTypes(settings.idleAnimationTypes || ['pulse', 'bounce', 'glow']);
      setIdleAnimationInterval(settings.idleAnimationInterval ?? 8);
        
        // Load Ken Burns settings
            setKenBurnsEnabled(settings.kenBurnsEnabled ?? false);
    setKenBurnsMode(settings.kenBurnsMode || 'hover');
    
    // Load advanced Ken Burns settings
    setKenBurnsHoverScale(settings.kenBurnsHoverScale ?? 1.1);
    setKenBurnsAutoplayScale(settings.kenBurnsAutoplayScale ?? 1.15);
          setKenBurnsSlideshowScale(settings.kenBurnsSlideshowScale ?? 1.08);
    setKenBurnsHoverDuration(settings.kenBurnsHoverDuration ?? 8000);
    setKenBurnsAutoplayDuration(settings.kenBurnsAutoplayDuration ?? 12000);
    setKenBurnsSlideshowDuration(settings.kenBurnsSlideshowDuration ?? 10000);
    setKenBurnsCrossfadeDuration(settings.kenBurnsCrossfadeDuration ?? 1000);
    setKenBurnsForGifs(settings.kenBurnsForGifs ?? false);
    setKenBurnsForVideos(settings.kenBurnsForVideos ?? false);
    setKenBurnsEasing(settings.kenBurnsEasing || 'ease-out');
    setKenBurnsAnimationType(settings.kenBurnsAnimationType || 'both');
    setKenBurnsCrossfadeReturn(settings.kenBurnsCrossfadeReturn !== false);
    setKenBurnsTransitionType(settings.kenBurnsTransitionType || 'cross-dissolve');
        
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
        setAccessoryButtonConfig(settings.accessoryButtonConfig || {});
        setShowDock(settings.showDock ?? true);
        setWallpaperBlur(settings.wallpaperBlur ?? 0);
        
        // Load keyboard shortcuts
        if (settings.keyboardShortcuts) {
          loadKeyboardShortcuts(settings.keyboardShortcuts);
        }
        
        // Load dock settings
        if (settings.dockSettings) {
          console.log('App: Loaded dockSettings:', settings.dockSettings);
          setDockSettings(settings.dockSettings);
        }
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
        classicMode,
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
        gridSettings, // Persist gridSettings
        ribbonButtonConfigs, // Persist ribbonButtonConfigs
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
        accessoryButtonConfig, // Persist accessory button configuration
        timeFont, // Persist timeFont
        channelAnimation, // Persist channelAnimation
        adaptiveEmptyChannels,
        idleAnimationEnabled,
        idleAnimationTypes,
        idleAnimationInterval, // Persist adaptive empty channels setting
        kenBurnsEnabled, // Persist Ken Burns enabled setting
        kenBurnsMode, // Persist Ken Burns mode setting
        kenBurnsHoverScale, // Persist Ken Burns hover scale
        kenBurnsAutoplayScale, // Persist Ken Burns autoplay scale
        kenBurnsSlideshowScale, // Persist Ken Burns slideshow scale
        kenBurnsHoverDuration, // Persist Ken Burns hover duration
        kenBurnsAutoplayDuration, // Persist Ken Burns autoplay duration
        kenBurnsSlideshowDuration, // Persist Ken Burns slideshow duration
        kenBurnsCrossfadeDuration, // Persist Ken Burns crossfade duration
        kenBurnsForGifs, // Persist Ken Burns for GIFs setting
        kenBurnsForVideos, // Persist Ken Burns for videos setting
        kenBurnsEasing, // Persist Ken Burns animation easing
        kenBurnsAnimationType, // Persist Ken Burns animation type
        kenBurnsCrossfadeReturn, // Persist Ken Burns crossfade return
        kenBurnsTransitionType, // Persist Ken Burns transition type
        showDock, // Persist showDock setting
        dockSettings, // Persist dock settings
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
  }, [hasInitialized, isDarkMode, useCustomCursor, glassWiiRibbon, glassOpacity, glassBlur, glassBorderOpacity, glassShineOpacity, animatedOnHover, startInFullscreen, wallpaper, timeColor, recentTimeColors, timeFormat24hr, enableTimePill, timePillBlur, timePillOpacity, channelAutoFadeTimeout, gridSettings, ribbonButtonConfigs, ribbonColor, recentRibbonColors, ribbonGlowColor, recentRibbonGlowColors, ribbonGlowStrength, ribbonGlowStrengthHover, ribbonDockOpacity, presets, presetsButtonConfig, showPresetsButton, accessoryButtonConfig, timeFont, channelAnimation, adaptiveEmptyChannels, kenBurnsEnabled, kenBurnsMode, kenBurnsHoverScale, kenBurnsAutoplayScale, kenBurnsSlideshowScale, kenBurnsHoverDuration, kenBurnsAutoplayDuration, kenBurnsSlideshowDuration, kenBurnsCrossfadeDuration, kenBurnsForGifs, kenBurnsForVideos, kenBurnsEasing, kenBurnsAnimationType, kenBurnsCrossfadeReturn, kenBurnsTransitionType, showDock, dockSettings]);

  // Persist keyboard shortcuts when they change
  useEffect(() => {
    if (hasInitialized) {
      const unsubscribe = useUIStore.subscribe(
        (state) => state.keyboardShortcuts,
        async (keyboardShortcuts) => {
          const persistKeyboardShortcuts = async () => {
            let current = await settingsApi?.get();
            if (!current) current = {};
            
            const updated = {
              ...current,
              keyboardShortcuts
            };
            
            await settingsApi?.set(updated);
          };
          
          persistKeyboardShortcuts();
        }
      );
      
      return unsubscribe;
    }
  }, [hasInitialized]);

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

  // Load cached data and prefetch app/game/UWP lists on app launch
  useEffect(() => {
    const {
      fetchInstalledApps,
      fetchSteamGames,
      fetchEpicGames,
      fetchUwpApps
    } = useAppLibraryStore.getState();

    // Fetch data only if cache is expired or missing
    // The fetch functions now check cache validity internally and only fetch when needed
    fetchInstalledApps();
    fetchSteamGames();
    fetchEpicGames();
    fetchUwpApps();
  }, []);

  // Handle pending PrimaryActionsModal save
  useEffect(() => {
    if (pendingPrimaryActionSave) {
      const { newConfig, buttonIndex } = pendingPrimaryActionSave;
      console.log('Handling pending PrimaryActionsModal save:', buttonIndex, newConfig);
      
      if (buttonIndex === "accessory") {
        // Update accessory button config
        setAccessoryButtonConfig(newConfig);
        // Save to settings
        handleSettingsChange({ accessoryButtonConfig: newConfig });
      } else {
        // Update the ribbon button configs
        const newConfigs = [...ribbonButtonConfigs];
        newConfigs[buttonIndex] = newConfig;
        setRibbonButtonConfigs(newConfigs);
        
        // Save to settings
        handleSettingsChange({ ribbonButtonConfigs: newConfigs });
      }
      
      // Clear the pending save
      useUIStore.getState().setPendingPrimaryActionSave(null);
    }
  }, [pendingPrimaryActionSave, ribbonButtonConfigs]);

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
    
    // Navigate to the appropriate page for this channel
    if (channelId) {
      const match = channelId.match(/channel-(\d+)/);
      if (match) {
        const channelIndex = parseInt(match[1]);
        // Import the store dynamically to avoid circular dependencies
        import('./utils/usePageNavigationStore').then(({ default: usePageNavigationStore }) => {
          const { goToPage, getPageForChannelIndex, ensurePageExists } = usePageNavigationStore.getState();
          ensurePageExists(channelIndex);
          const targetPage = getPageForChannelIndex(channelIndex);
          goToPage(targetPage);
        });
      }
    }
  };

  const handleSettingsClick = () => {
    useUIStore.getState().openSettingsMenu();
  };
  
  // Modal handlers for when dock is hidden
    const handleOpenGeneralModal = () => {
    useUIStore.getState().openGeneralSettingsModal();
  };

  const handleOpenTimeSettingsModal = () => {
    useUIStore.getState().openTimeSettingsModal();
  };

  const handleOpenRibbonSettingsModal = () => {
    useUIStore.getState().openRibbonSettingsModal();
  };

  const handleOpenUpdateModal = () => {
    useUIStore.getState().openUpdateModal();
  };

  const handleToggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleToggleCursor = () => {
    setUseCustomCursor(!useCustomCursor);
  };

  // Button handlers for ClassicWiiDock
  const handleClassicButtonContextMenu = (index, e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveButtonIndex(index);
    openPrimaryActionsModal();
  };

  const handleClassicButtonClick = (index) => {
    const config = ribbonButtonConfigs[index];
    console.log('Classic button clicked:', index, 'Config:', config);
    
    // Handle admin mode for left button (index 0)
    if (index === 0 && config?.adminMode && config?.powerActions && config.powerActions.length > 0) {
      console.log('Opening admin menu with actions:', config.powerActions.length, config.powerActions.map(a => a.name));
      setShowAdminMenu(true);
      return;
    }
    
    // Handle regular button actions
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

  // Classic Dock context menu handler
  const handleDockContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowClassicDockSettingsModal(true);
  };

  const handleAccessoryButtonContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Open PrimaryActionsModal for accessory button configuration
    setActiveButtonIndex("accessory");
    useUIStore.getState().openPrimaryActionsModal();
  };

  const handleAccessoryButtonClick = () => {
    console.log('Accessory button clicked! Config:', accessoryButtonConfig);
    
    // Handle regular button actions
    if (!accessoryButtonConfig || !accessoryButtonConfig.actionType || !accessoryButtonConfig.action || accessoryButtonConfig.actionType === 'none') return;
    
    if (window.api && window.api.launchApp) {
      if (accessoryButtonConfig.actionType === 'exe') {
        window.api.launchApp({ type: 'exe', path: accessoryButtonConfig.action });
      } else if (accessoryButtonConfig.actionType === 'url') {
        window.api.launchApp({ type: 'url', path: accessoryButtonConfig.action });
      } else if (accessoryButtonConfig.actionType === 'steam') {
        window.api.launchApp({ type: 'steam', path: accessoryButtonConfig.action });
      } else if (accessoryButtonConfig.actionType === 'epic') {
        window.api.launchApp({ type: 'epic', path: accessoryButtonConfig.action });
      } else if (accessoryButtonConfig.actionType === 'microsoftstore') {
        window.api.launchApp({ type: 'microsoftstore', path: accessoryButtonConfig.action });
      }
    } else {
      // Fallback: try window.open for URLs
      if (accessoryButtonConfig.actionType === 'url') {
        window.open(accessoryButtonConfig.action, '_blank');
      }
    }
  };

  // Classic Dock settings change handler
  const handleDockSettingsChange = async (newDockSettings) => {
    setDockSettings(newDockSettings);
    
    try {
      const settings = await window.api.settings.get();
      await window.api.settings.set({ ...settings, dockSettings: newDockSettings });
    } catch (error) {
      console.error('Error saving dock settings:', error);
    }
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
    
    // Handle overlay settings
    if (newSettings.overlayEnabled !== undefined) {
      setOverlayEnabled(newSettings.overlayEnabled);
    }
    if (newSettings.overlayEffect !== undefined) {
      setOverlayEffect(newSettings.overlayEffect);
    }
    if (newSettings.overlayIntensity !== undefined) {
      setOverlayIntensity(newSettings.overlayIntensity);
    }
    if (newSettings.overlaySpeed !== undefined) {
      setOverlaySpeed(newSettings.overlaySpeed);
    }
    if (newSettings.overlayWind !== undefined) {
      setOverlayWind(newSettings.overlayWind);
    }
    if (newSettings.overlayGravity !== undefined) {
      setOverlayGravity(newSettings.overlayGravity);
    }
              if (newSettings.showDock !== undefined) {
      setShowDock(newSettings.showDock);
    }
    if (newSettings.classicMode !== undefined) {
      setClassicMode(newSettings.classicMode);
    }
    if (newSettings.channelAnimation !== undefined) {
      setChannelAnimation(newSettings.channelAnimation);
    }
    if (newSettings.adaptiveEmptyChannels !== undefined) {
      setAdaptiveEmptyChannels(newSettings.adaptiveEmptyChannels);
    }
    
    // Handle idle animation settings
    if (newSettings.idleAnimationEnabled !== undefined) {
      setIdleAnimationEnabled(newSettings.idleAnimationEnabled);
    }
    if (newSettings.idleAnimationTypes !== undefined) {
      setIdleAnimationTypes(newSettings.idleAnimationTypes);
    }
    if (newSettings.idleAnimationInterval !== undefined) {
      setIdleAnimationInterval(newSettings.idleAnimationInterval);
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
    if (newSettings.kenBurnsForGifs !== undefined) {
      setKenBurnsForGifs(newSettings.kenBurnsForGifs);
    }
    if (newSettings.kenBurnsForVideos !== undefined) {
      setKenBurnsForVideos(newSettings.kenBurnsForVideos);
    }
    if (newSettings.kenBurnsEasing !== undefined) {
      setKenBurnsEasing(newSettings.kenBurnsEasing);
    }
    if (newSettings.kenBurnsAnimationType !== undefined) {
      setKenBurnsAnimationType(newSettings.kenBurnsAnimationType);
    }
    if (newSettings.kenBurnsCrossfadeReturn !== undefined) {
      setKenBurnsCrossfadeReturn(newSettings.kenBurnsCrossfadeReturn);
    }
    if (newSettings.kenBurnsTransitionType !== undefined) {
      setKenBurnsTransitionType(newSettings.kenBurnsTransitionType);
    }
    
    // Handle keyboard shortcuts
    if (newSettings.keyboardShortcuts !== undefined) {
      loadKeyboardShortcuts(newSettings.keyboardShortcuts);
    }
    
    // Note: Settings are automatically persisted by the main persistSettings useEffect
    // which runs whenever any of the state variables change. This ensures ribbonButtonConfigs
    // are preserved and not overwritten by direct settings saves.
    if (newSettings.channelAutoFadeTimeout !== undefined) {
      setChannelAutoFadeTimeout(newSettings.channelAutoFadeTimeout);
    }
    if (newSettings.gridSettings !== undefined) {
      setGridSettings(newSettings.gridSettings);
    }
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
    
    // Overlay settings
    overlayEnabled,
    overlayEffect,
    overlayIntensity,
    overlaySpeed,
    overlayWind,
    overlayGravity,
    
    // Dock visibility
    showDock,
    
    timeFont,
    channelAnimation,
      adaptiveEmptyChannels,
      idleAnimationEnabled,
      idleAnimationTypes,
      idleAnimationInterval,
    kenBurnsEnabled,
    kenBurnsMode,
    kenBurnsHoverScale,
    kenBurnsAutoplayScale,
    kenBurnsSlideshowScale,
    kenBurnsHoverDuration,
    kenBurnsAutoplayDuration,
    kenBurnsSlideshowDuration,
    kenBurnsCrossfadeDuration,
    kenBurnsForGifs,
    kenBurnsForVideos,
    kenBurnsEasing,
    kenBurnsAnimationType,
    kenBurnsCrossfadeReturn,
    kenBurnsTransitionType,
  };

  // Memoize expensive calculations
  const getTransitionType = useCallback(() => {
    if (cycleAnimation === 'fade') return 'crossfade';
    if (cycleAnimation === 'slide') return 'slide';
    if (cycleAnimation === 'zoom') return 'zoom';
    if (cycleAnimation === 'ken-burns') return 'ken-burns';
    if (cycleAnimation === 'dissolve') return 'dissolve';
    if (cycleAnimation === 'wipe') return 'wipe';
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
    } else if (getTransitionType() === 'zoom') {
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
    } else if (getTransitionType() === 'ken-burns') {
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
    } else if (getTransitionType() === 'dissolve') {
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
    } else if (getTransitionType() === 'wipe') {
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

  // Wallpaper cycling logic with smooth transitions
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

    // Set up the cycling timeout
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
      e.stopPropagation();
      // Open wallpaper modal on right-click
      useUIStore.getState().openWallpaperModal();
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
              opacity: getTransitionType() === 'crossfade' || getTransitionType() === 'zoom' || getTransitionType() === 'ken-burns' || getTransitionType() === 'dissolve' ? 1 - crossfadeProgress : wallpaperOpacity,
              transform: getTransitionType() === 'slide' ? getInfiniteScrollTransform(slideDirection, slideProgress, false) : 
                        getTransitionType() === 'zoom' ? `scale(${1 + crossfadeProgress * 0.1})` :
                        getTransitionType() === 'ken-burns' ? `scale(${1 + crossfadeProgress * 0.05}) translate(${crossfadeProgress * 2}%, ${crossfadeProgress * 1}%)` :
                        getTransitionType() === 'wipe' ? getInfiniteScrollTransform(slideDirection, slideProgress, false) : 'none',
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
              opacity: getTransitionType() === 'crossfade' || getTransitionType() === 'zoom' || getTransitionType() === 'ken-burns' || getTransitionType() === 'dissolve' ? crossfadeProgress : 1,
              transform: getTransitionType() === 'slide' ? getInfiniteScrollTransform(slideDirection, slideProgress, true) : 
                        getTransitionType() === 'zoom' ? `scale(${1.1 - crossfadeProgress * 0.1})` :
                        getTransitionType() === 'ken-burns' ? `scale(${1.05 - crossfadeProgress * 0.05}) translate(${(1 - crossfadeProgress) * -2}%, ${(1 - crossfadeProgress) * -1}%)` :
                        getTransitionType() === 'wipe' ? getInfiniteScrollTransform(slideDirection, slideProgress, true) : 'none',
              transition: 'none', // Remove CSS transitions to prevent conflicts
            }}
          />
        )}
        
        {/* Wallpaper Overlay Effects */}
        <WallpaperOverlay
          effect={overlayEffect}
          enabled={overlayEnabled}
          intensity={overlayIntensity}
          speed={overlaySpeed}
          wind={overlayWind}
          gravity={overlayGravity}
        />
        
        {/* Drag region for windowed mode only */}
        {!isFullscreen && (
          <div style={{ width: '100%', height: 32, WebkitAppRegion: 'drag', position: 'fixed', top: 0, left: 0, zIndex: 10000 }} />
        )}
        {showDragRegion && (
          <div style={{ width: '100%', height: 32, WebkitAppRegion: 'drag', position: 'fixed', top: 0, left: 0, zIndex: 10000 }} />
        )}
        
        {/* Floating Settings Button - shown when dock is hidden */}
        {!showDock && (
          <div
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              zIndex: 1000,
              cursor: 'pointer'
            }}
            onClick={() => {
              const { openSettingsMenu } = useUIStore.getState();
              openSettingsMenu();
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.transition = 'transform 0.2s ease';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#666" strokeWidth="2" fill="none"/>
                <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2579 9.77251 19.9887C9.5799 19.7195 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.2448 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.74206 9.96512 4.01128 9.77251C4.2805 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.02405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="#666" strokeWidth="2" fill="none"/>
              </svg>
            </div>
          </div>
        )}
        
        <div style={{ opacity: channelOpacity, transition: 'opacity 0.5s ease-in-out', position: 'relative', zIndex: 100, pointerEvents: 'auto' }}>
          <PaginatedChannels
            allChannels={channels}
            channelConfigs={channelConfigs}
            mediaMap={mediaMap}
            appPathMap={appPathMap}
            animatedOnHover={animatedOnHover}
            adaptiveEmptyChannels={adaptiveEmptyChannels}
            kenBurnsEnabled={kenBurnsEnabled}
            kenBurnsMode={kenBurnsMode}
            idleAnimationEnabled={idleAnimationEnabled}
            idleAnimationTypes={idleAnimationTypes}
            idleAnimationInterval={idleAnimationInterval}
            onMediaChange={handleMediaChange}
            onAppPathChange={handleAppPathChange}
            onChannelSave={handleChannelSave}
            onChannelHover={handleChannelHover}
            onOpenModal={setOpenChannelModal}
            gridSettings={gridSettings}
          />
          <PageNavigation />
          <WiiSideNavigation />
        </div>
                    {showDock && !classicMode && (
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
        )}
        {showDock && classicMode && (
          <ClassicWiiDock
            onSettingsClick={handleSettingsClick}
            onSettingsChange={handleSettingsChange}
            buttonConfigs={ribbonButtonConfigs}
            onButtonContextMenu={handleClassicButtonContextMenu}
            onButtonClick={handleClassicButtonClick}
            timeColor={timeColor}
            timeFormat24hr={timeFormat24hr}
            timeFont={timeFont}
            ribbonGlowColor={ribbonGlowColor}
            showPresetsButton={showPresetsButton}
            presetsButtonConfig={presetsButtonConfig}
            openPresetsModal={useUIStore.getState().openPresetsModal}
            dockSettings={dockSettings}
            onDockContextMenu={handleDockContextMenu}
            onAccessoryButtonContextMenu={handleAccessoryButtonContextMenu}
            onAccessoryButtonClick={handleAccessoryButtonClick}
            accessoryButtonConfig={accessoryButtonConfig}
          />
        )}
        
        {/* Floating Settings Button when dock is hidden */}
        {!showDock && (
          <div
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              zIndex: 1000,
              cursor: 'pointer'
            }}
            onClick={handleSettingsClick}
            title="Settings (Dock is hidden)"
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" style={{ color: '#666' }}>
                <path fill="currentColor" d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
              </svg>
            </div>
          </div>
        )}
        
        {/* Global Settings Menu - rendered at app level so it works when dock is hidden */}
        {(() => {
          const { showSettingsMenu, settingsMenuFadeIn, closeSettingsMenu } = useUIStore.getState();
          if (!showSettingsMenu) return null;
          
          return (
            <div className="settings-menu">
              <div
                className={`context-menu-content settings-menu-fade${settingsMenuFadeIn ? ' in' : ''}`}
                style={{ position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)', zIndex: 1002 }}
              >
                {/* Appearance Group */}
                <Text variant="label" size="sm" weight={600} color="#0099ff" style={{ padding: '6px 16px 2px 16px', letterSpacing: '0.02em', opacity: 0.85 }}>
                  Appearance
                </Text>
                <div className="context-menu-item" onClick={() => { useUIStore.getState().openPresetsModal(); closeSettingsMenu(); }}>
                  🎨 Presets (Ctrl+P)
                </div>
                {/* <div className="context-menu-item" onClick={() => { useUIStore.getState().openWallpaperModal(); closeSettingsMenu(); }}>
                  Change Wallpaper
                </div> */}
                <div className="context-menu-item" onClick={() => { 
                  useUIStore.getState().openChannelSettingsModal();
                  closeSettingsMenu(); 
                }}>
                  Channel Settings
                </div>
                <div className="context-menu-item" onClick={() => { useUIStore.getState().openLayoutManagerModal(); closeSettingsMenu(); }}>
                  📐 Layout Manager
                </div>
                <div className="context-menu-item" onClick={() => { useUIStore.getState().openAppShortcutsModal(); closeSettingsMenu(); }}>
                  ⌨️ Keyboard Shortcuts
                </div>
                <div className="context-menu-item" onClick={() => { handleToggleDarkMode(); closeSettingsMenu(); }}>
                  Toggle Dark Mode
                </div>
                <div className="context-menu-item" onClick={() => { handleToggleCursor(); closeSettingsMenu(); }}>
                  {useCustomCursor ? 'Use Default Cursor' : 'Use Wii Cursor'}
                </div>
                <div className="context-menu-item" onClick={async () => {
                  const newShowDock = !showDock;
                  setShowDock(newShowDock);
                  await handleSettingsChange({ showDock: newShowDock });
                  closeSettingsMenu();
                }}>
                  {showDock ? 'Hide Ribbon (Dock)' : 'Show Ribbon'}
                </div>
                <div className="context-menu-item" onClick={async () => {
                  const newClassicMode = !classicMode;
                  setClassicMode(newClassicMode);
                  await handleSettingsChange({ classicMode: newClassicMode });
                  closeSettingsMenu();
                }}>
                  {classicMode ? 'Switch to Modern Mode' : 'Switch to Classic Mode'}
                </div>
                <div className="settings-menu-separator" />
                {/* Window Group */}
                <Text variant="label" size="sm" weight={600} color="#0099ff" style={{ padding: '6px 16px 2px 16px', letterSpacing: '0.02em', opacity: 0.85 }}>
                  Window
                </Text>
                <div className="context-menu-item" onClick={() => { 
                  if (window.api?.toggleFullscreen) window.api.toggleFullscreen(); 
                  closeSettingsMenu(); 
                }}>
                  Toggle Fullscreen
                </div>
                <div className="context-menu-item" onClick={() => { 
                  if (window.api?.minimize) window.api.minimize(); 
                  closeSettingsMenu(); 
                }}>
                  Minimize Window
                </div>
                <div className="settings-menu-separator" />
                {/* System Group */}
                <Text variant="label" size="sm" weight={600} color="#0099ff" style={{ padding: '6px 16px 2px 16px', letterSpacing: '0.02em', opacity: 0.85 }}>
                  System
                </Text>
                <div className="context-menu-item" onClick={() => { 
                  handleOpenGeneralModal();
                  closeSettingsMenu(); 
                }}>
                  General Settings
                </div>
                <div className="context-menu-item" onClick={() => { 
                  useUIStore.getState().openAppShortcutsModal();
                  closeSettingsMenu(); 
                }}>
                  📱 App Shortcuts
                </div>
                <div className="context-menu-item" onClick={() => { useUIStore.getState().openSoundModal(); closeSettingsMenu(); }}>
                  🎵 Change Sounds
                </div>
                <div className="context-menu-item" onClick={() => { 
                  handleOpenUpdateModal();
                  closeSettingsMenu(); 
                }}>
                  �� Check for Updates
                  {updateAvailable && (
                    <span style={{
                      background: '#dc3545',
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
                <div className="context-menu-item" onClick={() => { 
                  if (window.api?.close) window.api.close(); 
                  closeSettingsMenu(); 
                }}>
                  Close App
                </div>
                <div className="settings-menu-separator" />
                <div className="context-menu-item" style={{ color: '#dc3545', fontWeight: 600 }}
                  onClick={async () => {
                    closeSettingsMenu();
                    if (window.confirm('Are you sure you want to reset all appearance settings to default? This will not affect your saved presets.')) {
                      // Reset all visual/cosmetic settings to their original first-time user defaults
                      if (typeof handleSettingsChange === 'function') {
                        handleSettingsChange({
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
                          gridSettings: {
                            rowGap: 16,
                            columnGap: 16,
                            gridPosition: 'center',
                            responsiveRows: 3, // Original default: 3 rows
                            responsiveColumns: 4, // Original default: 4 columns
                            hiddenChannels: [],
                            gridAlignment: 'start',
                            gridJustification: 'center'
                          },
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
          );
        })()}
        
        {/* Click outside to close settings menu */}
        {(() => {
          const { showSettingsMenu, closeSettingsMenu } = useUIStore.getState();
          if (!showSettingsMenu) return null;
          
          return (
            <div 
              style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                zIndex: 1001 
              }} 
              onClick={closeSettingsMenu}
            />
          );
        })()}
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
        <NavigationCustomizationModal />
        <WallpaperModal
          isOpen={showWallpaperModal}
          onClose={closeWallpaperModal}
          onSettingsChange={handleSettingsChange}
        />
        <ChannelSettingsModal
          isOpen={showChannelSettingsModal}
          onClose={closeChannelSettingsModal}
          onSettingsChange={handleSettingsChange}
          adaptiveEmptyChannels={adaptiveEmptyChannels}
          channelAnimation={channelAnimation}
          animatedOnHover={animatedOnHover}
          idleAnimationEnabled={idleAnimationEnabled}
          idleAnimationTypes={idleAnimationTypes}
          idleAnimationInterval={idleAnimationInterval}
          kenBurnsEnabled={kenBurnsEnabled}
          kenBurnsMode={kenBurnsMode}
          kenBurnsHoverScale={kenBurnsHoverScale}
          kenBurnsAutoplayScale={kenBurnsAutoplayScale}
          kenBurnsSlideshowScale={kenBurnsSlideshowScale}
          kenBurnsHoverDuration={kenBurnsHoverDuration}
          kenBurnsAutoplayDuration={kenBurnsAutoplayDuration}
          kenBurnsSlideshowDuration={kenBurnsSlideshowDuration}
          kenBurnsCrossfadeDuration={kenBurnsCrossfadeDuration}
          kenBurnsForGifs={kenBurnsForGifs}
          kenBurnsForVideos={kenBurnsForVideos}
          kenBurnsEasing={kenBurnsEasing}
          kenBurnsAnimationType={kenBurnsAnimationType}
          kenBurnsCrossfadeReturn={kenBurnsCrossfadeReturn}
          kenBurnsTransitionType={kenBurnsTransitionType}
          channelAutoFadeTimeout={channelAutoFadeTimeout}
        />
        
        <LayoutManagerModal
          isOpen={showLayoutManagerModal}
          onClose={closeLayoutManagerModal}
          onSettingsChange={handleSettingsChange}
          channels={channels}
          gridSettings={gridSettings}
        />
        
        {showAppShortcutsModal && (
          <AppShortcutsModal
            isOpen={showAppShortcutsModal}
            onClose={closeAppShortcutsModal}
          />
        )}
        
        {/* Additional modals for when dock is hidden */}
        {showGeneralSettingsModal && (
          <GeneralSettingsModal 
            isOpen={showGeneralSettingsModal} 
            onClose={closeGeneralSettingsModal}
            immersivePip={window.settings?.immersivePip ?? false}
            setImmersivePip={val => {
              localStorage.setItem('immersivePip', JSON.stringify(val));
              handleSettingsChange({ immersivePip: val });
            }}
            glassWiiRibbon={glassWiiRibbon}
            setGlassWiiRibbon={setGlassWiiRibbon}
            startInFullscreen={startInFullscreen}
            setStartInFullscreen={setStartInFullscreen}
            showPresetsButton={showPresetsButton}
            setShowPresetsButton={val => handleSettingsChange({ showPresetsButton: val })}
            channelAnimation={window.settings?.channelAnimation}
            adaptiveEmptyChannels={window.settings?.adaptiveEmptyChannels}
            idleAnimationEnabled={window.settings?.idleAnimationEnabled}
            idleAnimationTypes={window.settings?.idleAnimationTypes}
            idleAnimationInterval={window.settings?.idleAnimationInterval}
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
            onSettingsChange={handleSettingsChange}
          />
        )}
        
        {showTimeSettingsModal && (
          <TimeSettingsModal
            isOpen={showTimeSettingsModal}
            onClose={closeTimeSettingsModal}
            onSettingsChange={handleSettingsChange}
          />
        )}
        
        {showRibbonSettingsModal && (
          <RibbonSettingsModal
            isOpen={showRibbonSettingsModal}
            onClose={closeRibbonSettingsModal}
            onSettingsChange={handleSettingsChange}
            glassWiiRibbon={glassWiiRibbon}
            setGlassWiiRibbon={setGlassWiiRibbon}
          />
        )}
        
        {showClassicDockSettingsModal && (
          <ClassicDockSettingsModal
            isOpen={showClassicDockSettingsModal}
            onClose={() => setShowClassicDockSettingsModal(false)}
            onSettingsChange={handleDockSettingsChange}
            dockSettings={dockSettings}
          />
        )}
        
                {showUpdateModal && (
          <UpdateModal
            isOpen={showUpdateModal}
            onClose={closeUpdateModal}
          />
        )}

        {/* PrimaryActionsModal for ClassicWiiDock */}
        {showPrimaryActionsModal && (
          <PrimaryActionsModal
            config={activeButtonIndex === "accessory" ? accessoryButtonConfig : ribbonButtonConfigs[activeButtonIndex]}
            buttonIndex={activeButtonIndex}
            preavailableIcons={[]}
            ribbonGlowColor={ribbonGlowColor}
          />
        )}

        {/* Admin Menu for ClassicWiiDock */}
        {showAdminMenu && (
          <div className="admin-menu">
            <div
              className="context-menu-content"
              style={{ 
                position: 'absolute', 
                bottom: '120px',
                left: '250px',
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
              {ribbonButtonConfigs[0]?.powerActions?.map((action, index) => (
                <div
                  key={action.id}
                  className="context-menu-item"
                  onClick={() => {
                    if (window.api && window.api.executeCommand) {
                      window.api.executeCommand(action.command);
                    } else {
                      console.log('Would execute command:', action.command);
                    }
                    setShowAdminMenu(false);
                  }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    borderBottom: index < ribbonButtonConfigs[0].powerActions.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
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
            onClick={() => setShowAdminMenu(false)}
          />
        )}
      </div>
    </>
  );
}

export default App;
