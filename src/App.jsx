import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import useConsolidatedAppStore from './utils/useConsolidatedAppStore';
import useWallpaperCycling from './utils/useWallpaperCycling';
import useSoundManager from './utils/useSoundManager';
import useKeyboardShortcuts from './utils/useKeyboardShortcuts';
import { 
  useTimeColor, 
  useEnableTimePill, 
  useTimePillBlur, 
  useTimePillOpacity, 
  useTimeFont 
} from './utils/useConsolidatedAppHooks';
import ErrorBoundary from './components/ErrorBoundary';
import SplashScreen from './components/SplashScreen';
import WallpaperOverlay from './components/WallpaperOverlay';

// Lazy load components to reduce initial bundle size
const LazyPaginatedChannels = React.lazy(() => import('./components/PaginatedChannels'));
const LazyPageNavigation = React.lazy(() => import('./components/PageNavigation'));
const LazyWiiRibbon = React.lazy(() => import('./components/WiiRibbon'));
const LazyClassicWiiDock = React.lazy(() => import('./components/ClassicWiiDock'));
const LazyWiiSideNavigation = React.lazy(() => import('./components/WiiSideNavigation'));
const LazySettingsModal = React.lazy(() => import('./components/SettingsModal'));
const LazySettingsActionMenu = React.lazy(() => import('./components/SettingsActionMenu'));



function App() {
  // Use consolidated store for single source of truth
  const {
    app: { appReady, isLoading, splashFading },
        ui: {
      isDarkMode,
      useCustomCursor,
      cursorStyle,
      startInFullscreen,
      showDock,
      classicMode,
      showSettingsModal,
      settingsActiveTab,
      showSettingsActionMenu
    },
    ribbon: {
        ribbonColor,
        ribbonGlowColor,
        ribbonGlowStrength,
        ribbonGlowStrengthHover,
        ribbonDockOpacity,
      glassWiiRibbon,
      glassOpacity,
      glassBlur,
      glassBorderOpacity,
      glassShineOpacity,
        ribbonButtonConfigs,
      presetsButtonConfig
    },
    wallpaper,
    overlay: {
      enabled,
      effect,
      intensity,
      speed,
      wind,
      gravity
    },
    // Time settings using individual hooks for proper property mapping
  } = useConsolidatedAppStore();

  // Time settings using individual hooks for proper property mapping
  const timeColor = useTimeColor();
  const enableTimePill = useEnableTimePill();
  const timePillBlur = useTimePillBlur();
  const timePillOpacity = useTimePillOpacity();
  const timeFont = useTimeFont();

  // Initialize wallpaper cycling (only for cycling status indicator)
  const { isCycling, cycleToNextWallpaper } = useWallpaperCycling();

  // Initialize sound manager for background music
  const {
    soundSettings,
    startBackgroundMusic,
    stopBackgroundMusic,
    updateBackgroundMusic
  } = useSoundManager();

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Initialize background music when app is ready
  useEffect(() => {
    if (appReady && soundSettings?.backgroundMusicEnabled) {
      console.log('[App] App ready and background music enabled - starting background music...');
      startBackgroundMusic();
    }
  }, [appReady, soundSettings?.backgroundMusicEnabled, startBackgroundMusic]);

  // Handle background music updates when sound settings change
  useEffect(() => {
    if (appReady && soundSettings?.backgroundMusicEnabled) {
      console.log('[App] Sound settings changed - updating background music...');
      updateBackgroundMusic();
    }
  }, [appReady, soundSettings, updateBackgroundMusic]);

  // Watch for background music enable/disable changes and respond immediately
  useEffect(() => {
    if (appReady) {
      if (soundSettings?.backgroundMusicEnabled) {
        console.log('[App] Background music enabled - starting immediately...');
        startBackgroundMusic();
      } else {
        console.log('[App] Background music disabled - stopping immediately...');
        stopBackgroundMusic();
      }
    }
  }, [appReady, soundSettings?.backgroundMusicEnabled, startBackgroundMusic, stopBackgroundMusic]);

  // Cleanup background music on unmount
  useEffect(() => {
    return () => {
      console.log('[App] App unmounting - stopping background music...');
      stopBackgroundMusic();
    };
  }, [stopBackgroundMusic]);

  // Handle settings changes from SettingsModal
  const handleSettingsChange = useCallback((settings) => {
    console.log('[App] Settings changed:', settings);
    
    // Update sound settings if they changed
    if (settings.sounds) {
      console.log('[App] Sound settings updated - triggering background music update...');
      updateBackgroundMusic();
    }
    
    // Update other settings as needed
    // (The consolidated store will handle most updates automatically)
  }, [updateBackgroundMusic]);

  // Actions from consolidated store
  const {
    actions: { 
      setAppState, 
      setUIState, 
      setRibbonState, 
      setWallpaperState, 
      setChannelState,
      setOverlayState,
      setTimeState,
      setPresets
    }
  } = useConsolidatedAppStore();

  // Settings action menu state and positioning
  const [settingsMenuPosition, setSettingsMenuPosition] = useState({ x: 0, y: 0 });
  
  // Ref to access SettingsActionMenu's handleClose method
  const settingsActionMenuRef = useRef(null);
  
  // Define closeSettingsActionMenu function
  const closeSettingsActionMenu = useCallback(() => {
    setUIState({ showSettingsActionMenu: false });
  }, [setUIState]);

  // Handle settings action menu positioning
  const handleSettingsActionMenuOpen = useCallback(() => {
    // Use modal-style centering - no need to calculate position manually
    setSettingsMenuPosition({ x: 0, y: 0 }); // Will be centered by CSS
    setUIState({ showSettingsActionMenu: true });
  }, [setUIState]);

  // Debug function to open developer tools
  const openDevTools = useCallback(() => {
    console.log('[DEBUG] 🔧 Attempting to open DevTools...');
    console.log('[DEBUG] 🔧 window.api available:', !!window.api);
    console.log('[DEBUG] 🔧 window.api.openDevTools available:', !!window.api?.openDevTools);
    console.log('[DEBUG] 🔧 window.api.forceDevTools available:', !!window.api?.forceDevTools);
    
    // Log all available window.api methods
    if (window.api) {
      console.log('[DEBUG] 🔧 Available window.api methods:', Object.keys(window.api));
    }
    
    // Try multiple methods
    const tryOpenDevTools = async () => {
      try {
        // Method 1: Standard openDevTools
        if (window.api?.openDevTools) {
          console.log('[DEBUG] 🔧 Trying openDevTools...');
          const result = await window.api.openDevTools();
          console.log('[DEBUG] 🔧 openDevTools result:', result);
          if (result.success) return;
        }
        
        // Method 2: Force DevTools
        if (window.api?.forceDevTools) {
          console.log('[DEBUG] 🔧 Trying forceDevTools...');
          const result = await window.api.forceDevTools();
          console.log('[DEBUG] 🔧 forceDevTools result:', result);
          if (result.success) return;
        }
        
        // Method 3: Try to trigger keyboard shortcut programmatically
        console.log('[DEBUG] 🔧 Trying keyboard shortcut simulation...');
        const event = new KeyboardEvent('keydown', {
          key: 'F12',
          code: 'F12',
          keyCode: 123,
          which: 123,
          ctrlKey: false,
          shiftKey: false,
          altKey: false,
          metaKey: false,
          bubbles: true
        });
        document.dispatchEvent(event);
        
        console.log('[DEBUG] 🔧 All methods attempted');
      } catch (error) {
        console.error('[DEBUG] 🔧 Error opening DevTools:', error);
      }
    };
    
    tryOpenDevTools();
  }, []);

    // Add keyboard event listener for DevTools shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // F12 key
      if (event.key === 'F12' || event.keyCode === 123) {
        console.log('[DEBUG] 🔧 F12 pressed in renderer');
        event.preventDefault();
        openDevTools();
      }
      // Ctrl+Shift+I
      else if (event.ctrlKey && event.shiftKey && event.key === 'I') {
        console.log('[DEBUG] 🔧 Ctrl+Shift+I pressed in renderer');
        event.preventDefault();
        openDevTools();
      }
      // Ctrl+Shift+J
      else if (event.ctrlKey && event.shiftKey && event.key === 'J') {
        console.log('[DEBUG] 🔧 Ctrl+Shift+J pressed in renderer');
        event.preventDefault();
        openDevTools();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Handle Escape key to open/close settings action menu
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        if (showSettingsActionMenu) {
          // Close settings action menu when Escape is pressed - use the menu's own close method
          if (settingsActionMenuRef.current?.handleClose) {
            settingsActionMenuRef.current.handleClose();
          } else {
            // Fallback to direct close if ref method not available
            closeSettingsActionMenu();
          }
        } else {
          // Open settings action menu when Escape is pressed and no other menus are open
          handleSettingsActionMenuOpen();
        }
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    
    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showSettingsActionMenu, closeSettingsActionMenu, handleSettingsActionMenuOpen]);

  // Initialize custom cursor on app load
  useEffect(() => {
    if (useCustomCursor) {
      // Add class to body to enable global cursor hiding
      document.body.classList.add('custom-cursor-enabled');
      
      // Create custom cursor element if it doesn't exist
      let customCursor = document.getElementById('wii-custom-cursor');
      if (!customCursor) {
        customCursor = document.createElement('div');
        customCursor.id = 'wii-custom-cursor';
        document.body.appendChild(customCursor);
      }
      
      // Set cursor style (get from store)
      const storeState = useConsolidatedAppStore.getState();
      customCursor.setAttribute('data-style', storeState.ui.cursorStyle || 'classic');
      
      // Show custom cursor
      customCursor.style.display = 'block';
      
      // Simple mouse tracking for better performance
      const handleMouseMove = (e) => {
        customCursor.style.left = e.clientX + 'px';
        customCursor.style.top = e.clientY + 'px';
      };
      
      // Simple click effects
      const handleMouseDown = () => {
        customCursor.classList.add('clicking');
      };
      
      const handleMouseUp = () => {
        customCursor.classList.remove('clicking');
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Cleanup function
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mouseup', handleMouseUp);
        customCursor.classList.remove('clicking');
      };
    } else {
      // Remove class from body to restore default cursors
      document.body.classList.remove('custom-cursor-enabled');
      
      // Hide custom cursor
      const customCursor = document.getElementById('wii-custom-cursor');
      if (customCursor) {
        customCursor.style.display = 'none';
        customCursor.classList.remove('clicking');
      }
    }
  }, [useCustomCursor, cursorStyle]);

  // Expose DevTools and debug functions globally
  useEffect(() => {
    // Expose openDevTools globally for console access
    window.openDevTools = openDevTools;
    
    // Expose shortcut testing functions
    window.testShortcut = (key, modifier) => {
      console.log(`[Debug] Testing shortcut: ${modifier}+${key}`);
      if (window.handleGlobalShortcut) {
        return window.handleGlobalShortcut(key, modifier);
      }
      return false;
    };
    
    window.listShortcuts = () => {
      const { ui } = useConsolidatedAppStore.getState();
      console.log('[Debug] Current shortcuts:', ui?.keyboardShortcuts || []);
    };
    window.forceDevTools = () => {
      if (window.api?.forceDevTools) {
        window.api.forceDevTools().then(result => {
          console.log('[DEBUG] 🔧 Force DevTools result:', result);
        });
      }
    };
    
    // Expose test functions for debugging
    window.testPresetFunctions = () => {
      console.log('[DEBUG] 🧪 === TESTING PRESET FUNCTIONS ===');
      console.log('[DEBUG] 🧪 Current store state:', useConsolidatedAppStore.getState());
      console.log('[DEBUG] 🧪 Available window.api methods:', Object.keys(window.api || {}));
      console.log('[DEBUG] 🧪 Settings API available:', !!window.api?.settings);
      console.log('[DEBUG] 🧪 Wallpapers API available:', !!window.api?.wallpapers);
      console.log('[DEBUG] 🧪 === END TEST ===');
    };
    
    // Test preset structure comparison
    window.comparePresetStructures = async () => {
      console.log('[DEBUG] 🧪 === COMPARING PRESET STRUCTURES ===');
      try {
        const settings = await window.api.settings.get();
        const presets = settings.presets || [];
        
        console.log('[DEBUG] 🧪 Total presets:', presets.length);
        
        presets.forEach((preset, index) => {
          console.log(`[DEBUG] 🧪 Preset ${index + 1}: ${preset.name}`);
          console.log(`[DEBUG] 🧪 - Type: ${preset.isCommunity ? 'Community' : 'Local'}`);
          console.log(`[DEBUG] 🧪 - Has data: ${!!preset.data}`);
          console.log(`[DEBUG] 🧪 - Data keys: ${preset.data ? Object.keys(preset.data) : 'N/A'}`);
          
          if (preset.data) {
            console.log(`[DEBUG] 🧪 - Wallpaper: ${!!preset.data.wallpaper}`);
            console.log(`[DEBUG] 🧪 - Ribbon: ${!!preset.data.ribbon}`);
            console.log(`[DEBUG] 🧪 - Time: ${!!preset.data.time}`);
            console.log(`[DEBUG] 🧪 - Overlay: ${!!preset.data.overlay}`);
            console.log(`[DEBUG] 🧪 - UI: ${!!preset.data.ui}`);
          }
          console.log('[DEBUG] 🧪 ---');
        });
      } catch (error) {
        console.error('[DEBUG] 🧪 Error comparing presets:', error);
      }
      console.log('[DEBUG] 🧪 === END COMPARISON ===');
    };
    
    // Test channel operations
    window.testChannelOperations = () => {
      console.log('[DEBUG] 🧪 === TESTING CHANNEL OPERATIONS ===');
      const { channels } = useConsolidatedAppStore.getState();
      console.log('[DEBUG] 🧪 Channel state:', channels);
      console.log('[DEBUG] 🧪 Channel data:', channels?.data);
      console.log('[DEBUG] 🧪 Channel settings:', channels?.settings);
      console.log('[DEBUG] 🧪 Configured channels:', channels?.data?.configuredChannels);
      console.log('[DEBUG] 🧪 Navigation:', channels?.data?.navigation);
      console.log('[DEBUG] 🧪 === END CHANNEL TEST ===');
    };
    
    // Test DevTools functionality
    window.testDevTools = async () => {
      console.log('[DEBUG] 🧪 === TESTING DEVTOOLS FUNCTIONALITY ===');
      try {
        console.log('[DEBUG] 🧪 Testing DevTools methods...');
        
        // Test 1: Standard openDevTools
        if (window.api?.openDevTools) {
          console.log('[DEBUG] 🧪 Testing openDevTools...');
          const result1 = await window.api.openDevTools();
          console.log('[DEBUG] 🧪 openDevTools result:', result1);
        }
        
        // Test 2: Force DevTools
        if (window.api?.forceDevTools) {
          console.log('[DEBUG] 🧪 Testing forceDevTools...');
          const result2 = await window.api.forceDevTools();
          console.log('[DEBUG] 🧪 forceDevTools result:', result2);
        }
        
        // Test 3: Check window state
        console.log('[DEBUG] 🧪 Window state check...');
        console.log('[DEBUG] 🧪 - window.api available:', !!window.api);
        console.log('[DEBUG] 🧪 - openDevTools available:', !!window.api?.openDevTools);
        console.log('[DEBUG] 🧪 - forceDevTools available:', !!window.api?.forceDevTools);
        
      } catch (error) {
        console.error('[DEBUG] 🧪 Error testing DevTools:', error);
      }
    };
    
    // Test community preset structure
    window.testCommunityPresetStructure = async () => {
      console.log('[DEBUG] 🧪 === TESTING COMMUNITY PRESET STRUCTURE ===');
      try {
        // Simulate a community preset download structure
        const communityPreset = {
          name: 'Community Test Preset',
          settings: {
            time: {
              color: '#00ff00',
              enablePill: false,
              pillBlur: 5,
              pillOpacity: 0.05,
              font: 'default'
            },
            wallpaper: {
              current: null,
              opacity: 1,
              blur: 0
            },
            ribbon: {
              ribbonColor: '#e0e6ef',
              ribbonGlowColor: '#0099ff'
            }
          },
          id: 'test-community-id',
          wallpaper: null
        };
        
        console.log('[DEBUG] 🧪 Community preset structure:', communityPreset);
        
        // Simulate the import process
        const convertedPreset = {
          name: communityPreset.name,
          data: communityPreset.settings,
          timestamp: new Date().toISOString(),
          isCommunity: true,
          communityId: communityPreset.id
        };
        
        console.log('[DEBUG] 🧪 Converted preset structure:', convertedPreset);
        
        // Test the apply process
        const { setTimeState, setWallpaperState, setRibbonState } = useConsolidatedAppStore.getState().actions;
        
        if (convertedPreset.data.time) {
          console.log('[DEBUG] 🧪 Applying time settings:', convertedPreset.data.time);
          setTimeState(convertedPreset.data.time);
        }
        
        if (convertedPreset.data.wallpaper) {
          console.log('[DEBUG] 🧪 Applying wallpaper settings:', convertedPreset.data.wallpaper);
          setWallpaperState(convertedPreset.data.wallpaper);
        }
        
        if (convertedPreset.data.ribbon) {
          console.log('[DEBUG] 🧪 Applying ribbon settings:', convertedPreset.data.ribbon);
          setRibbonState(convertedPreset.data.ribbon);
        }
        
        console.log('[DEBUG] 🧪 Community preset test completed');
        
      } catch (error) {
        console.error('[DEBUG] 🧪 Error testing community preset structure:', error);
      }
    };
    
    // Test wallpaper persistence
    window.testWallpaperPersistence = async () => {
      console.log('[DEBUG] 🧪 === TESTING WALLPAPER PERSISTENCE ===');
      try {
        // Check current wallpaper state
        const { wallpaper } = useConsolidatedAppStore.getState();
        console.log('[DEBUG] 🧪 Current wallpaper state:', wallpaper);
        
        // Check backend wallpaper data
        if (window.api?.wallpapers?.get) {
          const backendData = await window.api.wallpapers.get();
          console.log('[DEBUG] 🧪 Backend wallpaper data:', backendData);
          console.log('[DEBUG] 🧪 Backend current wallpaper:', backendData?.wallpaper);
          console.log('[DEBUG] 🧪 Backend wallpaper opacity:', backendData?.wallpaperOpacity);
          console.log('[DEBUG] 🧪 Backend wallpaper blur:', backendData?.wallpaperBlur);
        }
        
        // Check general settings
        if (window.api?.settings?.get) {
          const settingsData = await window.api.settings.get();
          console.log('[DEBUG] 🧪 General settings data:', settingsData);
        }
        
        console.log('[DEBUG] 🧪 Wallpaper persistence test completed');
        
      } catch (error) {
        console.error('[DEBUG] 🧪 Error testing wallpaper persistence:', error);
      }
    };
    
    console.log('[DEBUG] 🔧 DevTools functions exposed to window:');
    console.log('[DEBUG] 🔧 - window.openDevTools()');
    console.log('[DEBUG] 🔧 - window.forceDevTools()');
    console.log('[DEBUG] 🔧 - window.testPresetFunctions()');
    console.log('[DEBUG] 🔧 - window.comparePresetStructures()');
    console.log('[DEBUG] 🔧 - window.testChannelOperations()');
    console.log('[DEBUG] 🔧 - window.testDevTools()');
    console.log('[DEBUG] 🔧 - window.testCommunityPresetStructure()');
    console.log('[DEBUG] 🔧 - window.testWallpaperPersistence()');
    
    return () => {
      delete window.openDevTools;
      delete window.forceDevTools;
      delete window.testPresetFunctions;
      delete window.comparePresetStructures;
      delete window.testChannelOperations;
      delete window.testDevTools;
      delete window.testCommunityPresetStructure;
      delete window.testWallpaperPersistence;
    };
  }, [openDevTools]);

    // Debug wallpaper cycling functionality
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.debugWallpaperCycling = () => {
        console.log('[DEBUG] 🖼️ === WALLPAPER CYCLING DEBUG ===');
        console.log('[DEBUG] 🖼️ Current wallpaper state:', wallpaper);
        console.log('[DEBUG] 🖼️ Cycling settings:', {
          cycleWallpapers: wallpaper.cycleWallpapers,
          cycleInterval: wallpaper.cycleInterval,
          cycleAnimation: wallpaper.cycleAnimation,
          likedWallpapersCount: wallpaper.likedWallpapers?.length
        });
        console.log('[DEBUG] 🖼️ Cycling hook state:', {
          isCycling,
          currentWallpaper: 'Isolated Component',
          nextWallpaper: 'Isolated Component'
        });
      };
      
      window.cycleToNextWallpaper = () => {
        console.log('[DEBUG] 🖼️ Manually triggering wallpaper cycle');
        cycleToNextWallpaper();
      };
      
      console.log('[DEBUG] 🖼️ - window.debugWallpaperCycling()');
      console.log('[DEBUG] 🖼️ - window.cycleToNextWallpaper()');
      
      return () => {
        delete window.debugWallpaperCycling;
        delete window.cycleToNextWallpaper;
      };
    }
  }, [isCycling, cycleToNextWallpaper, wallpaper]);

  // Debug DevTools functionality
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.debugDevTools = async () => {
        console.log('[DEBUG] 🔧 === DEVTOOLS DEBUG ===');
        console.log('[DEBUG] 🔧 Testing DevTools methods...');
        
        try {
          // Test 1: Standard openDevTools
          if (window.api?.openDevTools) {
            console.log('[DEBUG] 🔧 Testing openDevTools...');
            const result1 = await window.api.openDevTools();
            console.log('[DEBUG] 🔧 openDevTools result:', result1);
          }
          
          // Test 2: Force DevTools
          if (window.api?.forceDevTools) {
            console.log('[DEBUG] 🔧 Testing forceDevTools...');
            const result2 = await window.api.forceDevTools();
            console.log('[DEBUG] 🔧 forceDevTools result:', result2);
          }
          
          // Test 3: Check available methods
          console.log('[DEBUG] 🔧 Available DevTools methods:');
          console.log('[DEBUG] 🔧 - openDevTools available:', !!window.api?.openDevTools);
          console.log('[DEBUG] 🔧 - forceDevTools available:', !!window.api?.forceDevTools);
          
        } catch (error) {
          console.error('[DEBUG] 🔧 Error testing DevTools:', error);
        }
      };
      
      // Expose DevTools functions globally for testing
      window.testDevTools = window.debugDevTools;
      
      console.log('[DEBUG] 🔧 - window.debugDevTools()');
      console.log('[DEBUG] 🔧 - window.testDevTools()');
      
      return () => {
        delete window.debugDevTools;
        delete window.testDevTools;
      };
    }
  }, []);

  // Comprehensive logging system
  useEffect(() => {
    console.log('[DEBUG] 📊 === APP STATE LOGGING ===');
    console.log('[DEBUG] 📊 App Ready:', appReady);
    console.log('[DEBUG] 📊 Is Loading:', isLoading);
    console.log('[DEBUG] 📊 Splash Fading:', splashFading);
    console.log('[DEBUG] 📊 Show Settings Modal:', showSettingsModal);
    console.log('[DEBUG] 📊 Settings Active Tab:', settingsActiveTab);
    console.log('[DEBUG] 📊 Classic Mode:', classicMode);
    console.log('[DEBUG] 📊 Start In Fullscreen:', startInFullscreen);
    console.log('[DEBUG] 📊 Current Wallpaper: Isolated Component');
    console.log('[DEBUG] 📊 Next Wallpaper: Isolated Component');
    console.log('[DEBUG] 📊 Is Transitioning: Isolated Component');
    console.log('[DEBUG] 📊 Overlay Enabled:', enabled);
    console.log('[DEBUG] 📊 Cycling Active:', isCycling);
    console.log('[DEBUG] 📊 === END APP STATE ===');
  }, [appReady, isLoading, splashFading, showSettingsModal, settingsActiveTab, classicMode, startInFullscreen, enabled, isCycling]);

  // Initialize app with data loading
  useEffect(() => {
    console.log('[DEBUG] 🚀 Starting app initialization with data loading');
    
    const initializeApp = async () => {
      try {
        // Set app as ready immediately to show interface
        setAppState({ 
          appReady: true, 
          isLoading: false, 
          splashFading: false 
        });

        // Load essential data in background
        console.log('[DEBUG] 📡 Loading essential data...');
        
        // Load wallpaper data
        if (window.api?.wallpapers?.get) {
          try {
            const wallpaperData = await window.api.wallpapers.get();
            console.log('[DEBUG] ✅ Wallpaper data loaded:', wallpaperData ? 'success' : 'null');
            console.log('[DEBUG] 📊 Cycling settings:', wallpaperData?.cyclingSettings);
            console.log('[DEBUG] 📊 Liked wallpapers count:', wallpaperData?.likedWallpapers?.length);
            if (wallpaperData) {
              setWallpaperState({
                current: wallpaperData.wallpaper || null, // Load the current wallpaper
                savedWallpapers: wallpaperData.savedWallpapers || [],
                likedWallpapers: wallpaperData.likedWallpapers || [],
                opacity: wallpaperData.wallpaperOpacity ?? 1,
                blur: wallpaperData.wallpaperBlur ?? 0,
                // Load cycling settings
                cycleWallpapers: wallpaperData.cyclingSettings?.enabled ?? false,
                cycleInterval: wallpaperData.cyclingSettings?.interval ?? 30,
                cycleAnimation: wallpaperData.cyclingSettings?.animation ?? 'fade',
                slideDirection: wallpaperData.cyclingSettings?.slideDirection ?? 'right',
                crossfadeDuration: wallpaperData.cyclingSettings?.crossfadeDuration ?? 1.2,
                crossfadeEasing: wallpaperData.cyclingSettings?.crossfadeEasing ?? 'ease-out',
                slideRandomDirection: wallpaperData.cyclingSettings?.slideRandomDirection ?? false,
                slideDuration: wallpaperData.cyclingSettings?.slideDuration ?? 1.5,
                slideEasing: wallpaperData.cyclingSettings?.slideEasing ?? 'ease-out'
              });

              // Load overlay settings
              setOverlayState({
                enabled: wallpaperData.overlayEnabled ?? false,
                effect: wallpaperData.overlayEffect ?? 'snow',
                intensity: wallpaperData.overlayIntensity ?? 50,
                speed: wallpaperData.overlaySpeed ?? 1,
                wind: wallpaperData.overlayWind ?? 0.02,
                gravity: wallpaperData.overlayGravity ?? 0.1
              });
            }
          } catch (error) {
            console.warn('[DEBUG] ⚠️ Failed to load wallpaper data:', error);
          }
        }

        // Load channel data
        if (window.api?.channels?.get) {
          try {
            const channelData = await window.api.channels.get();
            console.log('[DEBUG] ✅ Channel data loaded:', channelData ? 'success' : 'null');
            if (channelData) {
              setChannelState({
                configuredChannels: channelData.configuredChannels || []
              });
            }
          } catch (error) {
            console.warn('[DEBUG] ⚠️ Failed to load channel data:', error);
          }
        }

        // Load settings data
        if (window.api?.settings?.get) {
          try {
            const settingsData = await window.api.settings.get();
            console.log('[DEBUG] ✅ Settings data loaded:', settingsData ? 'success' : 'null');
            if (settingsData) {
              // Apply settings to consolidated store
              if (settingsData.ui) setUIState(settingsData.ui);
              if (settingsData.ribbon) setRibbonState(settingsData.ribbon);
              if (settingsData.channels) setChannelState(settingsData.channels);
              if (settingsData.time) setTimeState(settingsData.time);
              if (settingsData.presets) setPresets(settingsData.presets);
            }
          } catch (error) {
            console.warn('[DEBUG] ⚠️ Failed to load settings data:', error);
          }
        }

        console.log('[DEBUG] ✅ App initialization complete');
        
      } catch (error) {
        console.error('[DEBUG] ❌ Error during app initialization:', error);
        // Even if there's an error, mark app as ready
        setAppState({ 
          appReady: true, 
          isLoading: false, 
          splashFading: false 
        });
      }
    };
      
    initializeApp();
  }, [setAppState, setWallpaperState, setChannelState, setUIState, setRibbonState, setTimeState, setPresets]);

  // Apply fullscreen setting when UI state changes
  useEffect(() => {
    if (appReady && window.api?.setFullscreen) {
      console.log('[App] Applying fullscreen setting:', startInFullscreen);
      window.api.setFullscreen(startInFullscreen);
    }
  }, [appReady, startInFullscreen]);

  // Optimized handlers using consolidated store with useCallback
  const openSettingsModal = useCallback(() => setUIState({ showSettingsModal: true }), [setUIState]);
  const closeSettingsModal = useCallback(() => setUIState({ showSettingsModal: false }), [setUIState]);




  // Global right-click handler for settings modal (wallpaper tab)
  const handleGlobalRightClick = useCallback((event) => {
    // Check if the click target is within the ribbon or dock areas
    const target = event.target;
    const isInRibbon = target.closest('.interactive-footer') || target.closest('.wii-dock-wrapper');
    const isInDock = target.closest('.dock-container');
    const isInModal = target.closest('.modal-overlay') || target.closest('.modal-content');
    
    // Check if Ctrl key is held for DevTools
    if (event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();
      console.log('[DEBUG] 🔧 Ctrl+Right-click detected - opening DevTools');
      openDevTools();
      return;
    }
    
    // Only open settings modal to wallpaper tab if not clicking on ribbon, dock, or existing modals
    if (!isInRibbon && !isInDock && !isInModal) {
      event.preventDefault();
      event.stopPropagation();
      // Open settings modal and set active tab to wallpaper
      setUIState({ 
        showSettingsModal: true,
        settingsActiveTab: 'wallpaper' // This will be handled by SettingsModal
      });
    }
  }, [setUIState, openDevTools]);
  const toggleDock = useCallback(() => setUIState(prev => ({ showDock: !prev.showDock })), [setUIState]);
  const toggleDarkMode = useCallback(() => setUIState(prev => ({ isDarkMode: !prev.isDarkMode })), [setUIState]);
  const toggleCustomCursor = useCallback(() => setUIState(prev => ({ useCustomCursor: !prev.useCustomCursor })), [setUIState]);

  // Debug wallpaper cycling isolation
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] 🖼️ === WALLPAPER CYCLING ISOLATION CHECK ===');
      console.log('[DEBUG] 🖼️ Wallpaper cycling is now completely isolated');
      console.log('[DEBUG] 🖼️ Channels should NOT be affected by cycling transitions');
    }
  }, []);

  // Create isolated wallpaper component to prevent re-renders
  const IsolatedWallpaperBackground = React.memo(() => {
    const { wallpaper } = useConsolidatedAppStore();
    const {
      isCycling,
      isTransitioning: cyclingTransitioning,
      currentWallpaper,
      nextWallpaper,
      crossfadeProgress: cyclingProgress,
      slideProgress: cyclingSlideProgress,
      slideDirection: cyclingSlideDirection,
      forceUpdate,
    } = useWallpaperCycling();

    const { opacity, blur, cycleAnimation } = wallpaper;

    // Animation-specific style calculations
    const getCurrentWallpaperStyle = useCallback(() => {
      if (!cyclingTransitioning || !currentWallpaper?.url) {
        return {
          opacity: opacity,
          transform: 'none',
          filter: `blur(${blur}px)`,
        };
      }

      const progress = cyclingProgress;
      
      switch (cycleAnimation) {
        case 'fade':
          return {
            opacity: opacity * (1 - progress),
            transform: 'none',
            filter: `blur(${blur}px)`,
          };
          
        case 'slide':
          const slideOffset = progress * 100;
          let slideTransform = 'none';
          
          switch (cyclingSlideDirection) {
            case 'left':
              slideTransform = `translateX(-${slideOffset}%)`;
              break;
            case 'right':
              slideTransform = `translateX(${slideOffset}%)`;
              break;
            case 'up':
              slideTransform = `translateY(-${slideOffset}%)`;
              break;
            case 'down':
              slideTransform = `translateY(${slideOffset}%)`;
              break;
          }
          
          return {
            opacity: opacity,
            transform: slideTransform,
            filter: `blur(${blur}px)`,
          };
          
        case 'zoom':
          const zoomScale = 1 + (progress * 0.1); // Scale from 1.0 to 1.1
          return {
            opacity: opacity * (1 - progress * 0.5), // Fade out slightly during zoom
            transform: `scale(${zoomScale})`,
            filter: `blur(${blur + (progress * 2)}px)`, // Increase blur during zoom
          };
          
        case 'ken-burns':
          const kenBurnsScale = 1 + (progress * 0.15); // More dramatic scale
          const kenBurnsX = progress * 3; // Pan horizontally
          const kenBurnsY = progress * 1.5; // Pan vertically
          return {
            opacity: opacity * (1 - progress * 0.3),
            transform: `scale(${kenBurnsScale}) translateX(${kenBurnsX}%) translateY(${kenBurnsY}%)`,
            filter: `blur(${blur}px)`,
          };
          
        case 'morph':
          const morphScale = 1 + (progress * 0.05);
          const morphRotate = progress * 2; // Subtle rotation
          const morphSkew = progress * 1; // Subtle skew
          return {
            opacity: opacity * (1 - progress * 0.7),
            transform: `scale(${morphScale}) rotate(${morphRotate}deg) skew(${morphSkew}deg)`,
            filter: `blur(${blur + (progress * 1)}px)`,
          };
          
        case 'blur':
          const blurIntensity = blur + (progress * 10); // Dramatic blur increase
          return {
            opacity: opacity * (1 - progress * 0.8),
            transform: 'none',
            filter: `blur(${blurIntensity}px)`,
          };
          
        default:
          return {
            opacity: opacity,
            transform: 'none',
            filter: `blur(${blur}px)`,
          };
      }
    }, [cyclingTransitioning, currentWallpaper?.url, opacity, blur, cycleAnimation, cyclingProgress, cyclingSlideDirection]);

    const getNextWallpaperStyle = useCallback(() => {
      if (!cyclingTransitioning || !nextWallpaper?.url) {
        return {
          opacity: 0,
          transform: 'none',
          filter: `blur(${blur}px)`,
        };
      }

      const progress = cyclingProgress;
      
      switch (cycleAnimation) {
        case 'fade':
          return {
            opacity: opacity * progress,
            transform: 'none',
            filter: `blur(${blur}px)`,
          };
          
        case 'slide':
          const slideOffset = (1 - progress) * 100;
          let slideTransform = 'none';
          
          switch (cyclingSlideDirection) {
            case 'left':
              slideTransform = `translateX(${slideOffset}%)`;
              break;
            case 'right':
              slideTransform = `translateX(-${slideOffset}%)`;
              break;
            case 'up':
              slideTransform = `translateY(${slideOffset}%)`;
              break;
            case 'down':
              slideTransform = `translateY(-${slideOffset}%)`;
              break;
          }
          
          return {
            opacity: opacity,
            transform: slideTransform,
            filter: `blur(${blur}px)`,
          };
          
        case 'zoom':
          const zoomScale = 1.1 - (progress * 0.1); // Scale from 1.1 to 1.0
          return {
            opacity: opacity * progress,
            transform: `scale(${zoomScale})`,
            filter: `blur(${blur + ((1 - progress) * 2)}px)`, // Decrease blur as it comes in
          };
          
        case 'ken-burns':
          const kenBurnsScale = 1.15 - (progress * 0.15); // More dramatic scale
          const kenBurnsX = (1 - progress) * 3; // Pan horizontally
          const kenBurnsY = (1 - progress) * 1.5; // Pan vertically
          return {
            opacity: opacity * progress,
            transform: `scale(${kenBurnsScale}) translateX(-${kenBurnsX}%) translateY(-${kenBurnsY}%)`,
            filter: `blur(${blur}px)`,
          };
          
        case 'morph':
          const morphScale = 1.05 - (progress * 0.05);
          const morphRotate = (1 - progress) * 2; // Subtle rotation
          const morphSkew = (1 - progress) * 1; // Subtle skew
          return {
            opacity: opacity * progress,
            transform: `scale(${morphScale}) rotate(-${morphRotate}deg) skew(-${morphSkew}deg)`,
            filter: `blur(${blur + ((1 - progress) * 1)}px)`,
          };
          
        case 'blur':
          const blurIntensity = blur + ((1 - progress) * 10); // Dramatic blur decrease
          return {
            opacity: opacity * progress,
            transform: 'none',
            filter: `blur(${blurIntensity}px)`,
          };
          
        default:
          return {
            opacity: opacity * progress,
            transform: 'none',
            filter: `blur(${blur}px)`,
          };
      }
    }, [cyclingTransitioning, nextWallpaper?.url, opacity, blur, cycleAnimation, cyclingProgress, cyclingSlideDirection]);

    // Debug animation values
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] 🎬 Animation State:', {
        cycleAnimation,
        cyclingTransitioning,
        cyclingProgress,
        cyclingSlideProgress,
        cyclingSlideDirection,
        forceUpdate,
        currentWallpaper: currentWallpaper?.url ? 'Set' : 'Not Set',
        nextWallpaper: nextWallpaper?.url ? 'Set' : 'Not Set',
        wallpaperState: {
          cycleAnimation: wallpaper.cycleAnimation,
          cycleWallpapers: wallpaper.cycleWallpapers,
          cycleInterval: wallpaper.cycleInterval
        }
      });
      
      if (cyclingTransitioning) {
        const currentStyle = getCurrentWallpaperStyle();
        const nextStyle = getNextWallpaperStyle();
        
        console.log('[DEBUG] 🎬 Style Values:', {
          currentStyle,
          nextStyle,
          progress: cyclingProgress
        });
      }
    }

    // Force re-render when transition state changes
    const transitionKey = `${cyclingTransitioning}-${cyclingProgress}-${cyclingSlideProgress}-${cyclingSlideDirection}-${forceUpdate}`;

    return (
      <div key={transitionKey}>
        {/* Current Wallpaper Background */}
        {currentWallpaper && currentWallpaper.url && (
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
              background: `url('${currentWallpaper.url}') center center / cover no-repeat`,
              ...getCurrentWallpaperStyle(),
              transition: cyclingTransitioning ? 'none' : 'opacity 0.3s ease-out, transform 0.3s ease-out, filter 0.3s ease-out',
            }}
            data-debug={`current-${cycleAnimation}-${cyclingTransitioning}-${cyclingProgress.toFixed(3)}`}
          />
        )}
        
        {/* Next Wallpaper Background for Transitions */}
        {cyclingTransitioning && nextWallpaper && nextWallpaper.url && (
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
              ...getNextWallpaperStyle(),
              transition: 'none',
            }}
            data-debug={`next-${cycleAnimation}-${cyclingTransitioning}-${cyclingProgress.toFixed(3)}`}
          />
        )}
      </div>
    );
  });

  // Render splash screen only if not ready
  if (!appReady || isLoading) {
    return <SplashScreen fadingOut={splashFading} />;
  }

  // Validate required data
  if (!ribbonColor || !ribbonGlowColor) {
    console.warn('[App] Missing required ribbon configuration, using defaults');
  }

  return (
    <ErrorBoundary>
      <div 
        className={`app-container ${useCustomCursor ? 'custom-cursor' : ''} ${isDarkMode ? 'dark-mode' : ''}`}
        onContextMenu={handleGlobalRightClick}
      >
        {/* Isolated Wallpaper Background - Completely separate from main app */}
        <IsolatedWallpaperBackground />

        {/* Wallpaper Overlay Effects */}
        <WallpaperOverlay
          effect={effect}
          enabled={enabled}
          intensity={intensity}
          speed={speed}
          wind={wind}
          gravity={gravity}
        />

        {/* Main Content */}
        <div className="main-content">
          <LazyPaginatedChannels />
        </div>

        {/* Page Navigation - Positioned independently */}
        <LazyPageNavigation 
          position="bottom"
          showPageIndicator={true}
        />

        {/* Wii Side Navigation - Available in both modes */}
        <LazyWiiSideNavigation />

        {/* Dock with proper props from consolidated store */}
        {showDock && (
          <div className="dock-container">
            {classicMode ? (
              <LazyClassicWiiDock
                buttonConfigs={ribbonButtonConfigs}
                presetsButtonConfig={presetsButtonConfig}
                onSettingsClick={openSettingsModal}
                onSettingsChange={(settings) => setRibbonState(settings)}
                onButtonClick={() => {}}
                onButtonContextMenu={() => {}}
                onAccessoryButtonClick={() => {}}
                onAccessoryButtonContextMenu={() => {}}
                onDockContextMenu={() => {}}
  
                showPresetsButton={true}
                timeColor={timeColor ?? '#ffffff'}
                timeFont={timeFont ?? 'default'}
                ribbonGlowColor={ribbonGlowColor}
                accessoryButtonConfig={{}}
              />
            ) : (
              <LazyWiiRibbon
                ribbonColor={ribbonColor}
                ribbonGlowColor={ribbonGlowColor}
                ribbonGlowStrength={ribbonGlowStrength}
                ribbonGlowStrengthHover={ribbonGlowStrengthHover}
                ribbonDockOpacity={ribbonDockOpacity}
                glassWiiRibbon={glassWiiRibbon}
                glassOpacity={glassOpacity}
                glassBlur={glassBlur}
                glassBorderOpacity={glassBorderOpacity}
                glassShineOpacity={glassShineOpacity}
                ribbonButtonConfigs={ribbonButtonConfigs}
                presetsButtonConfig={presetsButtonConfig}
                onSettingsClick={handleSettingsActionMenuOpen}
                onPresetsClick={() => setUIState({ showSettingsModal: true, settingsActiveTab: 'themes' })}
                onSettingsChange={(settings) => setRibbonState(settings)}
                onToggleDarkMode={toggleDarkMode}
                onToggleCursor={toggleCustomCursor}
                useCustomCursor={useCustomCursor}
                // Time settings from consolidated store
                enableTimePill={enableTimePill ?? true}
                timePillBlur={timePillBlur ?? 8}
                timePillOpacity={timePillOpacity ?? 0.05}
                timeColor={timeColor ?? '#ffffff'}
                timeFont={timeFont ?? 'default'}
              />
            )}
          </div>
        )}

        {/* Floating Quick Access Buttons */}
        {!showDock && (
          <div className="fixed bottom-5 right-5 z-[1000] flex flex-col gap-2">
            {/* Quick Settings Menu */}
            <div
              className="cursor-pointer p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-200 shadow-lg"
              onClick={handleSettingsActionMenuOpen}
              title="Quick Settings (Escape key)"
            >
              ⚙️
            </div>
            {/* Wallpaper Quick Access */}
            <div
              className="cursor-pointer p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-200 shadow-lg"
              onClick={() => setUIState({ 
                showSettingsModal: true,
                settingsActiveTab: 'wallpaper'
              })}
              title="Wallpaper Settings"
            >
              🖼️
            </div>
            {/* Settings Quick Access */}
            <div
              className="cursor-pointer p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-200 shadow-lg"
              onClick={openSettingsModal}
              title="Settings"
            >
              🔧
            </div>
            
            {/* Cycling Status Indicator */}
            {isCycling && (
              <div
                className="cursor-pointer p-3 bg-green-500/20 backdrop-blur-md rounded-full border border-green-400/30 hover:bg-green-500/30 transition-all duration-200 shadow-lg"
                onClick={cycleToNextWallpaper}
                title={`Cycling active (${cycleInterval}s interval) - Click to cycle manually`}
              >
                🔄
                </div>
            )}
            
            {/* Debug Button - Only in development */}
            {process.env.NODE_ENV === 'development' && (
              <div
                className="cursor-pointer p-3 bg-red-500/20 backdrop-blur-md rounded-full border border-red-400/30 hover:bg-red-500/30 transition-all duration-200 shadow-lg"
                onClick={openDevTools}
                title="Open Developer Tools (Debug)"
              >
                🐛
              </div>
            )}
                </div>
        )}

        {/* Modals */}
        <Suspense fallback={<div>Loading settings...</div>}>
          {showSettingsModal && (
          <LazySettingsModal
              isOpen={showSettingsModal}
            onClose={closeSettingsModal}
              onSettingsChange={handleSettingsChange}
              initialActiveTab={settingsActiveTab}
            />
          )}
        </Suspense>

        {/* Settings Action Menu - Independent of dock visibility */}
        <Suspense fallback={<div>Loading settings menu...</div>}>
          {showSettingsActionMenu && (
            <LazySettingsActionMenu
              ref={settingsActionMenuRef}
              isOpen={showSettingsActionMenu}
              onClose={closeSettingsActionMenu}
              position={settingsMenuPosition}
            />
          )}
        </Suspense>




      </div>
    </ErrorBoundary>
  );
}

export default App;
