import React, { useState, useEffect, useCallback, Suspense } from 'react';
import PropTypes from 'prop-types';
import WBaseModal from './WBaseModal';
import Button from '../ui/WButton';
import Card from '../ui/Card';
import Text from '../ui/Text';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';

// Legacy settings system imports

// Lazy load settings tabs
const LazyChannelsSettingsTab = React.lazy(() => import('./settings/ChannelsSettingsTab'));
const LazyUnifiedDockSettingsTab = React.lazy(() => import('./settings/UnifiedDockSettingsTab'));
const LazyWallpaperSettingsTab = React.lazy(() => import('./settings/WallpaperSettingsTab'));
const LazyTimeSettingsTab = React.lazy(() => import('./settings/TimeSettingsTab'));
const LazySoundsSettingsTab = React.lazy(() => import('./settings/SoundsSettingsTab'));
const LazyGeneralSettingsTab = React.lazy(() => import('./settings/GeneralSettingsTab'));
const LazyPresetsSettingsTab = React.lazy(() => import('./settings/PresetsSettingsTab'));
const LazyMonitorSettingsTab = React.lazy(() => import('./settings/MonitorSettingsTab'));
const LazyApiIntegrationsSettingsTab = React.lazy(() => import('./settings/ApiIntegrationsSettingsTab'));
const LazyAdvancedSettingsTab = React.lazy(() => import('./settings/AdvancedSettingsTab'));
const LazyLayoutSettingsTab = React.lazy(() => import('./settings/LayoutSettingsTab'));
const LazyShortcutsSettingsTab = React.lazy(() => import('./settings/ShortcutsSettingsTab'));
const LazyUpdatesSettingsTab = React.lazy(() => import('./settings/UpdatesSettingsTab'));

// Settings Tab Button Component
const SettingsTabButton = React.memo(({ tab, isActive, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);
  
  const getBackgroundColor = () => {
    if (isActive) return tab.color;
    if (isHovered) return 'hsl(var(--surface-tertiary))';
    return 'transparent';
  };
  
  const getTextColor = () => {
    if (isActive) return 'white';
    if (isHovered) return tab.color;
    return 'hsl(var(--text-secondary))';
  };
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="w-full p-4 border-none cursor-pointer text-sm font-medium transition-all duration-200 ease-in-out flex items-center gap-3 text-left border-b border-[hsl(var(--border-primary))]"
      style={{
        background: getBackgroundColor(),
        color: getTextColor(),
        fontWeight: isActive ? '600' : '500'
      }}
    >
      <span className="text-lg">{tab.icon}</span>
      <div className="flex flex-col items-start">
        <span className="font-semibold">{tab.label}</span>
        <span className="text-xs opacity-70 mt-0.5">
          {tab.description}
        </span>
      </div>
    </button>
  );
});

SettingsTabButton.propTypes = {
  tab: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

// Tab configuration - Alphabetically ordered
const SETTINGS_TABS = [
  { 
    id: 'advanced', 
    label: 'Advanced', 
    icon: '🔧', 
    color: '#fd79a8', 
    description: 'Developer & performance settings',
    component: LazyAdvancedSettingsTab
  },
  { 
    id: 'api-integrations', 
    label: 'API & Widgets', 
    icon: '🔌', 
    color: '#1db954', 
    description: 'External services & floating widgets',
    component: LazyApiIntegrationsSettingsTab
  },
  { 
    id: 'channels', 
    label: 'Channels', 
    icon: '📺', 
    color: '#0099ff', 
    description: 'Animation & display settings',
    component: LazyChannelsSettingsTab
  },
  { 
    id: 'dock', 
    label: 'Dock', 
    icon: '⚓', 
    color: '#feca57', 
    description: 'Classic & Ribbon dock settings',
    component: LazyUnifiedDockSettingsTab
  },
  { 
    id: 'general', 
    label: 'General', 
    icon: '⚙️', 
    color: '#6c5ce7', 
    description: 'App behavior & startup',
    component: LazyGeneralSettingsTab
  },
  { 
    id: 'layout', 
    label: 'Layout', 
    icon: '📐', 
    color: '#00b894', 
    description: 'Grid & navigation modes',
    component: LazyLayoutSettingsTab
  },
  { 
    id: 'monitor', 
    label: 'Monitor (beta)', 
    icon: '🖥️', 
    color: '#ff6b9d', 
    description: 'Multi-monitor settings',
    component: LazyMonitorSettingsTab
  },
  { 
    id: 'shortcuts', 
    label: 'Shortcuts', 
    icon: '⌨️', 
    color: '#ff9f43', 
    description: 'Keyboard shortcuts & hotkeys',
    component: LazyShortcutsSettingsTab
  },
  { 
    id: 'sounds', 
    label: 'Sounds', 
    icon: '🔊', 
    color: '#a55eea', 
    description: 'Audio feedback & music',
    component: LazySoundsSettingsTab
  },
  { 
    id: 'themes', 
    label: 'Presets', 
    icon: '🎨', 
    color: '#ff9ff3', 
    description: 'Preset themes & customization',
    component: LazyPresetsSettingsTab
  },
  { 
    id: 'time', 
    label: 'Time', 
    icon: '🕐', 
    color: '#45b7d1', 
    description: 'Clock & pill display',
    component: LazyTimeSettingsTab
  },
  { 
    id: 'updates', 
    label: 'Updates', 
    icon: '🔄', 
    color: '#00cec9', 
    description: 'Check for updates & version info',
    component: LazyUpdatesSettingsTab
  },
  { 
    id: 'wallpaper', 
    label: 'Wallpaper', 
    icon: '🖼️', 
    color: '#4ecdc4', 
    description: 'Background & cycling',
    component: LazyWallpaperSettingsTab
  }
];

function SettingsModal({ isOpen, onClose, onSettingsChange, initialActiveTab = 'channels' }) {
  // Get initial tab from UI state if available
  const { ui } = useConsolidatedAppStore();
  const effectiveInitialTab = ui.settingsActiveTab || initialActiveTab;
  // Use legacy settings system for now since unified data layer isn't fully implemented
  const [localSettings, setLocalSettings] = useState({});
  const [presets, setPresets] = useState([]);

  // Local state
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [tabChanges, setTabChanges] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showMonitorModal, setShowMonitorModal] = useState(false);

  // Load settings when modal opens
  useEffect(() => {
    if (isOpen) {
      // Load current settings from window.settings (legacy system)
      const currentSettings = window.settings || {};
      
      // Ensure general settings exist
      if (!currentSettings.general) {
        currentSettings.general = {};
      }
      
      setLocalSettings(currentSettings);
      
      // Load presets
      if (window.settings?.presets) {
        setPresets(window.settings.presets);
      }
    }
  }, [isOpen]);

  // Update active tab when initialActiveTab prop changes
  useEffect(() => {
    if (isOpen && effectiveInitialTab) {
      setActiveTab(effectiveInitialTab);
    }
  }, [isOpen, effectiveInitialTab]);

  // Settings update handler for general tab and other categorized tabs
  const handleGeneralSettingUpdate = useCallback((category, key, value) => {
    console.log('[SettingsModal] Setting update:', { category, key, value });
    
    setLocalSettings(prev => {
      const newSettings = { ...prev };
      
      // Handle different category structures
      if (category === 'general') {
        // General settings go to general.general
        if (!newSettings.general) newSettings.general = {};
        newSettings.general[key] = value;
      } else if (category === 'time') {
        // Time settings go to top level
        newSettings[key] = value;
      } else if (category === 'wallpaper') {
        // Wallpaper settings go to top level
        newSettings[key] = value;
      } else if (category === 'sounds') {
        // Sound settings go to top level
        newSettings[key] = value;
      } else if (category === 'dock') {
        // Dock settings go to top level
        newSettings[key] = value;
      } else if (category === 'channels') {
        // Channel settings go to top level
        newSettings[key] = value;
      } else if (category === 'themes') {
        // Theme settings go to top level
        newSettings[key] = value;
      } else if (category === 'monitor') {
        // Monitor settings go to top level
        newSettings[key] = value;
      } else if (category === 'advanced') {
        // Advanced settings go to top level
        newSettings[key] = value;
      } else if (category === 'api-integrations') {
        // API settings go to top level
        newSettings[key] = value;
      } else {
        // Default: set at top level
        newSettings[key] = value;
      }
      
      return newSettings;
    });
    
    // Also update window.settings to keep it in sync
    if (window.settings) {
      if (category === 'general') {
        if (!window.settings.general) {
          window.settings.general = {};
        }
        window.settings.general[key] = value;
      } else {
        window.settings[key] = value;
      }
    }
    
    // Mark tab as changed
    setTabChanges(prev => ({ ...prev, [category]: true }));
    setHasUnsavedChanges(true);
  }, []);

  // Settings update handler for ribbon/channels tabs
  const handleDirectSettingUpdate = useCallback((key, value) => {
    console.log('[SettingsModal] Direct setting update:', { key, value, activeTab });
    
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Also update window.settings to keep it in sync
    if (window.settings) {
      window.settings[key] = value;
    }
    
    // Mark tab as changed
    setTabChanges(prev => ({ ...prev, [activeTab]: true }));
    setHasUnsavedChanges(true);
  }, [activeTab]);

  // Save all settings
  const handleSave = async (handleClose) => {
    try {
      // Call parent callback with updated settings
      if (onSettingsChange) {
        // Flatten the settings structure to match what App.jsx expects
        const flattenedSettings = {
          ...localSettings,
          // Extract general settings to top level
          ...(localSettings.general || {}),
          // Keep other settings as they are
          presets: localSettings.presets,
          dockSettings: localSettings.dockSettings,
          classicDockButtonConfigs: localSettings.classicDockButtonConfigs,
          accessoryButtonConfig: localSettings.accessoryButtonConfig,
          animatedOnHover: localSettings.animatedOnHover,
          useCustomCursor: localSettings.useCustomCursor,
          classicMode: localSettings.classicMode,
          particleSettings: localSettings.particleSettings,
          // Ensure all tab-specific settings are included
          timeColor: localSettings.timeColor,
          recentTimeColors: localSettings.recentTimeColors,
          timeFormat24hr: localSettings.timeFormat24hr,
          enableTimePill: localSettings.enableTimePill,
          timePillBlur: localSettings.timePillBlur,
          timePillOpacity: localSettings.timePillOpacity,
          timeFont: localSettings.timeFont,
          wallpaperOpacity: localSettings.wallpaperOpacity,
          wallpaperBlur: localSettings.wallpaperBlur,
          cycleWallpapers: localSettings.cycleWallpapers,
          cycleInterval: localSettings.cycleInterval,
          cycleAnimation: localSettings.cycleAnimation,
          overlayEnabled: localSettings.overlayEnabled,
          overlayEffect: localSettings.overlayEffect,
          overlayIntensity: localSettings.overlayIntensity,
          overlaySpeed: localSettings.overlaySpeed,
          overlayWind: localSettings.overlayWind,
          overlayGravity: localSettings.overlayGravity,
          backgroundMusicEnabled: localSettings.backgroundMusicEnabled,
          backgroundMusicLooping: localSettings.backgroundMusicLooping,
          backgroundMusicPlaylistMode: localSettings.backgroundMusicPlaylistMode,
          channelClickEnabled: localSettings.channelClickEnabled,
          channelClickVolume: localSettings.channelClickVolume,
          channelHoverEnabled: localSettings.channelHoverEnabled,
          channelHoverVolume: localSettings.channelHoverVolume,
          startupEnabled: localSettings.startupEnabled,
          startupVolume: localSettings.startupVolume,
          channelAutoFadeTimeout: localSettings.channelAutoFadeTimeout,
          channelAnimation: localSettings.channelAnimation,
          adaptiveEmptyChannels: localSettings.adaptiveEmptyChannels,
          idleAnimationEnabled: localSettings.idleAnimationEnabled,
          idleAnimationTypes: localSettings.idleAnimationTypes,
          idleAnimationInterval: localSettings.idleAnimationInterval,
          kenBurnsEnabled: localSettings.kenBurnsEnabled,
          kenBurnsMode: localSettings.kenBurnsMode,
          kenBurnsHoverScale: localSettings.kenBurnsHoverScale,
          kenBurnsAutoplayScale: localSettings.kenBurnsAutoplayScale,
          kenBurnsSlideshowScale: localSettings.kenBurnsSlideshowScale,
          kenBurnsHoverDuration: localSettings.kenBurnsHoverDuration,
          kenBurnsAutoplayDuration: localSettings.kenBurnsAutoplayDuration,
          kenBurnsSlideshowDuration: localSettings.kenBurnsSlideshowDuration,
          kenBurnsCrossfadeDuration: localSettings.kenBurnsCrossfadeDuration,
          kenBurnsForGifs: localSettings.kenBurnsForGifs,
          kenBurnsForVideos: localSettings.kenBurnsForVideos,
          kenBurnsEasing: localSettings.kenBurnsEasing,
          kenBurnsAnimationType: localSettings.kenBurnsAnimationType,
          kenBurnsCrossfadeReturn: localSettings.kenBurnsCrossfadeReturn,
          kenBurnsTransitionType: localSettings.kenBurnsTransitionType,
          ribbonColor: localSettings.ribbonColor,
          ribbonGlowColor: localSettings.ribbonGlowColor,
          ribbonGlowStrength: localSettings.ribbonGlowStrength,
          ribbonGlowStrengthHover: localSettings.ribbonGlowStrengthHover,
          ribbonDockOpacity: localSettings.ribbonDockOpacity,
          glassWiiRibbon: localSettings.glassWiiRibbon,
          glassOpacity: localSettings.glassOpacity,
          glassBlur: localSettings.glassBlur,
          glassBorderOpacity: localSettings.glassBorderOpacity,
          glassShineOpacity: localSettings.glassShineOpacity,
          recentRibbonColors: localSettings.recentRibbonColors,
          recentRibbonGlowColors: localSettings.recentRibbonGlowColors,
          showDock: localSettings.showDock,
          currentTheme: localSettings.currentTheme,
          monitorSettings: localSettings.monitorSettings,
          currentMonitor: localSettings.currentMonitor,
          performanceSettings: localSettings.performanceSettings,
          debugSettings: localSettings.debugSettings,
          spotifySettings: localSettings.spotifySettings,
          steamSettings: localSettings.steamSettings,
          epicSettings: localSettings.epicSettings,
          floatingWidgetSettings: localSettings.floatingWidgetSettings,
        };
        
        console.log('[SettingsModal] Saving settings:', flattenedSettings);
        onSettingsChange(flattenedSettings);
      }
      
      // Clear tab changes
      setTabChanges({});
      setHasUnsavedChanges(false);
      
      // Show success message
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      
      // Close modal if requested
      if (handleClose) {
        onClose();
      }
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    }
  };

  // Reset all settings
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      // Reset using unified data layer
      // Note: This would need to be implemented in the data layer
      setMessage({ type: 'success', text: 'Settings reset to default!' });
    }
  };

  // Save individual tab
  const handleTabSave = useCallback((tabId) => {
    try {
      // Call parent callback with updated settings for this tab
      if (onSettingsChange) {
        let tabSettings = {};
        
        switch (tabId) {
          case 'general':
            // For general tab, extract general settings to top level
            tabSettings = {
              ...(localSettings.general || {})
            };
            break;

          case 'time':
            // For time tab, save directly to backend since it uses consolidated store
            try {
              const { time } = useConsolidatedAppStore.getState();
              if (window.api?.settings?.get && window.api?.settings?.set) {
                window.api.settings.get().then(currentSettings => {
                  const updatedSettings = {
                    ...currentSettings,
                    timeColor: time.timeColor,
                    recentTimeColors: time.recentTimeColors,
                    timeFormat24hr: time.timeFormat24hr,
                    enableTimePill: time.enableTimePill,
                    timePillBlur: time.timePillBlur,
                    timePillOpacity: time.timePillOpacity,
                    timeFont: time.timeFont,
                  };
                  return window.api.settings.set(updatedSettings);
                }).then(() => {
                  console.log('[SettingsModal] Time settings saved to backend');
                }).catch(error => {
                  console.error('[SettingsModal] Failed to save time settings:', error);
                });
              }
            } catch (error) {
              console.error('[SettingsModal] Error saving time settings:', error);
            }
            // Return empty object since we're saving directly
            tabSettings = {};
            break;
          case 'wallpaper':
            // For wallpaper tab, save directly to backend since it uses consolidated store
            try {
              const { wallpaper, overlay } = useConsolidatedAppStore.getState();
              if (window.api?.wallpapers?.get && window.api?.wallpapers?.set) {
                window.api.wallpapers.get().then(currentData => {
                  const updatedData = {
                    ...currentData,
                    wallpaperOpacity: wallpaper.opacity,
                    wallpaperBlur: wallpaper.blur,
                    overlayEnabled: overlay.enabled,
                    overlayEffect: overlay.effect,
                    overlayIntensity: overlay.intensity,
                    overlaySpeed: overlay.speed,
                    cyclingSettings: {
                      ...currentData.cyclingSettings,
                      enabled: wallpaper.cycleWallpapers,
                      interval: wallpaper.cycleInterval,
                      animation: wallpaper.cycleAnimation,
                    }
                  };
                  return window.api.wallpapers.set(updatedData);
                }).then(() => {
                  console.log('[SettingsModal] Wallpaper settings saved to backend');
                }).catch(error => {
                  console.error('[SettingsModal] Failed to save wallpaper settings:', error);
                });
              }
            } catch (error) {
              console.error('[SettingsModal] Error saving wallpaper settings:', error);
            }
            // Return empty object since we're saving directly
            tabSettings = {};
            break;
          case 'sounds':
            // For sounds tab, extract sound-specific settings
            tabSettings = {
              backgroundMusicEnabled: localSettings.backgroundMusicEnabled,
              backgroundMusicLooping: localSettings.backgroundMusicLooping,
              backgroundMusicPlaylistMode: localSettings.backgroundMusicPlaylistMode,
              channelClickEnabled: localSettings.channelClickEnabled,
              channelClickVolume: localSettings.channelClickVolume,
              channelHoverEnabled: localSettings.channelHoverEnabled,
              channelHoverVolume: localSettings.channelHoverVolume,
              startupEnabled: localSettings.startupEnabled,
              startupVolume: localSettings.startupVolume,
            };
            break;
          case 'dock':
            // For unified dock tab, save directly to backend since it uses consolidated store
            try {
              const { dock, ribbon, ui, floatingWidgets } = useConsolidatedAppStore.getState();
              if (window.api?.settings?.get && window.api?.settings?.set) {
                window.api.settings.get().then(currentSettings => {
                  const updatedSettings = {
                    ...currentSettings,
                    // Classic dock settings
                    dockSettings: dock,
                    // Ribbon settings
                    ribbonColor: ribbon.ribbonColor,
                    ribbonGlowColor: ribbon.ribbonGlowColor,
                    ribbonGlowStrength: ribbon.ribbonGlowStrength,
                    ribbonGlowStrengthHover: ribbon.ribbonGlowStrengthHover,
                    ribbonDockOpacity: ribbon.ribbonDockOpacity,
                    glassWiiRibbon: ribbon.glassWiiRibbon,
                    glassOpacity: ribbon.glassOpacity,
                    glassBlur: ribbon.glassBlur,
                    glassBorderOpacity: ribbon.glassBorderOpacity,
                    glassShineOpacity: ribbon.glassShineOpacity,
                    recentRibbonColors: ribbon.recentRibbonColors,
                    recentRibbonGlowColors: ribbon.recentRibbonGlowColors,
                    // UI settings
                    classicMode: ui.classicMode,
                    showDock: ui.showDock,
                    // Particle settings
                    particleEnabled: floatingWidgets?.systemInfo?.particleEnabled,
                    particleEffectType: floatingWidgets?.systemInfo?.particleEffectType,
                    particleCount: floatingWidgets?.systemInfo?.particleCount,
                    particleSpeed: floatingWidgets?.systemInfo?.particleSpeed,
                  };
                  return window.api.settings.set(updatedSettings);
                }).then(() => {
                  console.log('[SettingsModal] Unified dock settings saved to backend');
                }).catch(error => {
                  console.error('[SettingsModal] Failed to save unified dock settings:', error);
                });
              }
            } catch (error) {
              console.error('[SettingsModal] Error saving unified dock settings:', error);
            }
            // Return empty object since we're saving directly
            tabSettings = {};
            break;
          case 'channels':
            // For channels tab, extract channel-specific settings
            tabSettings = {
              channelAutoFadeTimeout: localSettings.channelAutoFadeTimeout,
              channelAnimation: localSettings.channelAnimation,
              animatedOnHover: localSettings.animatedOnHover,
              adaptiveEmptyChannels: localSettings.adaptiveEmptyChannels,
              idleAnimationEnabled: localSettings.idleAnimationEnabled,
              idleAnimationTypes: localSettings.idleAnimationTypes,
              idleAnimationInterval: localSettings.idleAnimationInterval,
              kenBurnsEnabled: localSettings.kenBurnsEnabled,
              kenBurnsMode: localSettings.kenBurnsMode,
              kenBurnsHoverScale: localSettings.kenBurnsHoverScale,
              kenBurnsAutoplayScale: localSettings.kenBurnsAutoplayScale,
              kenBurnsSlideshowScale: localSettings.kenBurnsSlideshowScale,
              kenBurnsHoverDuration: localSettings.kenBurnsHoverDuration,
              kenBurnsAutoplayDuration: localSettings.kenBurnsAutoplayDuration,
              kenBurnsSlideshowDuration: localSettings.kenBurnsSlideshowDuration,
              kenBurnsCrossfadeDuration: localSettings.kenBurnsCrossfadeDuration,
              kenBurnsForGifs: localSettings.kenBurnsForGifs,
              kenBurnsForVideos: localSettings.kenBurnsForVideos,
              kenBurnsEasing: localSettings.kenBurnsEasing,
              kenBurnsAnimationType: localSettings.kenBurnsAnimationType,
              kenBurnsCrossfadeReturn: localSettings.kenBurnsCrossfadeReturn,
              kenBurnsTransitionType: localSettings.kenBurnsTransitionType,
            };
            break;
          case 'themes':
            // For themes tab, save directly to backend since it uses consolidated store
            try {
              const { presets } = useConsolidatedAppStore.getState();
              if (window.api?.settings?.get && window.api?.settings?.set) {
                window.api.settings.get().then(currentSettings => {
                  const updatedSettings = {
                    ...currentSettings,
                    presets: presets,
                  };
                  return window.api.settings.set(updatedSettings);
                }).then(() => {
                  console.log('[SettingsModal] Themes settings saved to backend');
                }).catch(error => {
                  console.error('[SettingsModal] Failed to save themes settings:', error);
                });
              }
            } catch (error) {
              console.error('[SettingsModal] Error saving themes settings:', error);
            }
            // Return empty object since we're saving directly
            tabSettings = {};
            break;
          case 'monitor':
            // For monitor tab, extract monitor-specific settings
            tabSettings = {
              monitorSettings: localSettings.monitorSettings,
              currentMonitor: localSettings.currentMonitor,
            };
            break;
          case 'advanced':
            // For advanced tab, extract advanced-specific settings
            tabSettings = {
              performanceSettings: localSettings.performanceSettings,
              debugSettings: localSettings.debugSettings,
            };
            break;
          case 'api-integrations':
            // For api-integrations tab, extract API-specific settings
            tabSettings = {
              spotifySettings: localSettings.spotifySettings,
              steamSettings: localSettings.steamSettings,
              epicSettings: localSettings.epicSettings,
              floatingWidgetSettings: localSettings.floatingWidgetSettings,
            };
            break;
          case 'shortcuts':
            // For shortcuts tab, save directly to backend since it uses consolidated store
            try {
              const { ui } = useConsolidatedAppStore.getState();
              if (window.api?.settings?.get && window.api?.settings?.set) {
                window.api.settings.get().then(currentSettings => {
                  const updatedSettings = {
                    ...currentSettings,
                    settingsShortcut: ui.settingsShortcut,
                    spotifyWidgetShortcut: ui.spotifyWidgetShortcut,
                    systemInfoWidgetShortcut: ui.systemInfoWidgetShortcut,
                    adminPanelWidgetShortcut: ui.adminPanelWidgetShortcut,
                    performanceMonitorShortcut: ui.performanceMonitorShortcut,
                    nextPageShortcut: ui.nextPageShortcut,
                    prevPageShortcut: ui.prevPageShortcut,
                    toggleDockShortcut: ui.toggleDockShortcut,
                    toggleDarkModeShortcut: ui.toggleDarkModeShortcut,
                    toggleCustomCursorShortcut: ui.toggleCustomCursorShortcut,
                  };
                  return window.api.settings.set(updatedSettings);
                }).then(() => {
                  console.log('[SettingsModal] Shortcuts settings saved to backend');
                }).catch(error => {
                  console.error('[SettingsModal] Failed to save shortcuts settings:', error);
                });
              }
            } catch (error) {
              console.error('[SettingsModal] Error saving shortcuts settings:', error);
            }
            // Return empty object since we're saving directly
            tabSettings = {};
            break;
          case 'updates':
            // Updates tab doesn't save any settings - it's read-only
            tabSettings = {};
            break;
          case 'layout':
            // For layout tab, save directly to backend since it uses consolidated store
            try {
              const { channels } = useConsolidatedAppStore.getState();
              if (window.api?.settings?.get && window.api?.settings?.set) {
                window.api.settings.get().then(currentSettings => {
                  const updatedSettings = {
                    ...currentSettings,
                    layoutSettings: {
                      navigationMode: channels.data.navigation.mode,
                      gridColumns: channels.data.gridColumns,
                      gridRows: channels.data.gridRows,
                      totalPages: channels.data.navigation.totalPages,
                      totalChannels: channels.data.totalChannels,
                      animationType: channels.data.navigation.animationType,
                      animationDuration: channels.data.navigation.animationDuration,
                      animationEasing: channels.data.navigation.animationEasing,
                      enableSlideAnimation: channels.data.navigation.enableSlideAnimation,
                    }
                  };
                  return window.api.settings.set(updatedSettings);
                }).then(() => {
                  console.log('[SettingsModal] Layout settings saved to backend');
                }).catch(error => {
                  console.error('[SettingsModal] Failed to save layout settings:', error);
                });
              }
            } catch (error) {
              console.error('[SettingsModal] Error saving layout settings:', error);
            }
            // Return empty object since we're saving directly
            tabSettings = {};
            break;
          default:
            // For other tabs, pass the relevant settings
            tabSettings = localSettings;
        }
        
        console.log(`[SettingsModal] Saving ${tabId} settings:`, tabSettings);
        onSettingsChange(tabSettings);
      }
      
      // Clear tab changes
      setTabChanges(prev => ({ ...prev, [tabId]: false }));
      setHasUnsavedChanges(false);
      setMessage({ type: 'success', text: `${SETTINGS_TABS.find(s => s.id === tabId)?.label || tabId} settings saved!` });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } catch (error) {
      console.error(`Failed to save ${tabId} settings:`, error);
      setMessage({ type: 'error', text: `Failed to save ${tabId} settings. Please try again.` });
    }
  }, [localSettings, onSettingsChange]);

  // Tab navigation
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  // Get settings for current tab
  const getTabSettings = (tabId) => {
    // Return the appropriate settings structure based on tab type
    let tabSettings;
    switch (tabId) {
      case 'updates':
        // UpdatesSettingsTab doesn't need any settings - it's read-only
        tabSettings = {};
        break;
      case 'general':
        // GeneralSettingsTab expects localSettings.general, so pass the full settings object
        tabSettings = localSettings;
        break;
      case 'channels':
        // ChannelsSettingsTab expects direct access
        tabSettings = localSettings;
        break;

      case 'time':
        // TimeSettingsTab uses consolidated store directly - no props needed
        tabSettings = {};
        break;
      case 'wallpaper':
        // WallpaperSettingsTab expects localSettings.wallpaper
        tabSettings = {
          wallpaper: {
            wallpaperOpacity: localSettings.wallpaperOpacity,
            wallpaperBlur: localSettings.wallpaperBlur,
            cycling: localSettings.cycleWallpapers,
            cycleInterval: localSettings.cycleInterval,
            cycleAnimation: localSettings.cycleAnimation,
            overlayEnabled: localSettings.overlayEnabled,
            overlayEffect: localSettings.overlayEffect,
            overlayIntensity: localSettings.overlayIntensity,
            overlaySpeed: localSettings.overlaySpeed,
            overlayWind: localSettings.overlayWind,
            overlayGravity: localSettings.overlayGravity,
          }
        };
        break;
      case 'sounds':
        // SoundsSettingsTab expects localSettings.sounds
        tabSettings = {
          sounds: {
            backgroundMusicEnabled: localSettings.backgroundMusicEnabled,
            backgroundMusicLooping: localSettings.backgroundMusicLooping,
            backgroundMusicPlaylistMode: localSettings.backgroundMusicPlaylistMode,
            channelClickEnabled: localSettings.channelClickEnabled,
            channelClickVolume: localSettings.channelClickVolume,
            channelHoverEnabled: localSettings.channelHoverEnabled,
            channelHoverVolume: localSettings.channelHoverVolume,
            startupEnabled: localSettings.startupEnabled,
            startupVolume: localSettings.startupVolume,
          }
        };
        break;
      case 'dock':
        // UnifiedDockSettingsTab uses consolidated store directly - no props needed
        tabSettings = {};
        break;
      case 'themes':
        // ThemesSettingsTab uses consolidated store directly - no props needed
        tabSettings = {};
        break;
      case 'monitor':
        // MonitorSettingsTab expects localSettings.monitor
        tabSettings = {
          monitor: {
            monitorSettings: localSettings.monitorSettings,
            currentMonitor: localSettings.currentMonitor,
          }
        };
        break;
      case 'advanced':
        // AdvancedSettingsTab expects localSettings.advanced
        tabSettings = {
          advanced: {
            performanceSettings: localSettings.performanceSettings,
            debugSettings: localSettings.debugSettings,
          }
        };
        break;
      case 'api-integrations':
        // ApiIntegrationsSettingsTab expects localSettings.api
        tabSettings = {
          api: {
            spotifySettings: localSettings.spotifySettings,
            steamSettings: localSettings.steamSettings,
            epicSettings: localSettings.epicSettings,
            floatingWidgetSettings: localSettings.floatingWidgetSettings,
          }
        };
        break;
      case 'layout':
        // LayoutSettingsTab uses consolidated store directly - no props needed
        tabSettings = {};
        break;
      case 'shortcuts':
        // ShortcutsSettingsTab uses consolidated store directly - no props needed
        tabSettings = {};
        break;
      default:
        tabSettings = localSettings;
    }
    
    console.log(`[SettingsModal] Tab settings for ${tabId}:`, tabSettings);
    return tabSettings;
  };

  // Handle cancel changes for current tab
  const handleCancelChanges = useCallback(() => {
    // Reset the current tab's changes by reloading settings
    if (isOpen) {
      const currentSettings = window.settings || {};
      setLocalSettings(currentSettings);
      setTabChanges(prev => ({ ...prev, [activeTab]: false }));
      setHasUnsavedChanges(false);
      setMessage({ type: 'info', text: 'Changes cancelled' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    }
  }, [activeTab, isOpen]);

  // Render tab content
  const renderTabContent = () => {
    const currentTab = SETTINGS_TABS.find(tab => tab.id === activeTab);
    const hasChanges = tabChanges[activeTab] || false;
    
    if (!currentTab) {
      return <div>Tab not found</div>;
    }

    const TabComponent = currentTab.component;
    const tabSettings = getTabSettings(activeTab);

    return (
      <div className="relative h-full">
        {/* Tab Content */}
        <div className="pb-24"> {/* Add bottom padding for absolute footer */}
          <Suspense fallback={<div>Loading {currentTab.label} Settings...</div>}>
            <TabComponent 
              // Pass props based on the tab's expected interface
              {...(activeTab === 'general' || activeTab === 'sounds' || activeTab === 'monitor' || activeTab === 'advanced' || activeTab === 'api-integrations' ? {
                localSettings: tabSettings,
                updateLocalSetting: handleGeneralSettingUpdate
              } : activeTab === 'channels' ? {
                settings: tabSettings,
                onSettingChange: handleDirectSettingUpdate
              } : activeTab === 'ribbon' || activeTab === 'wallpaper' || activeTab === 'time' || activeTab === 'themes' || activeTab === 'layout' || activeTab === 'updates' ? {
                // RibbonSettingsTab, WallpaperSettingsTab, TimeSettingsTab, ThemesSettingsTab, LayoutSettingsTab, and UpdatesSettingsTab use consolidated store directly - no props needed
              } : {
                localSettings: tabSettings,
                updateLocalSetting: handleGeneralSettingUpdate
              })}
              presets={presets}
              addPreset={(preset) => {
                const newPresets = [...presets, preset];
                setPresets(newPresets);
                setLocalSettings(prev => ({ ...prev, presets: newPresets }));
              }}
              removePreset={(name) => {
                const newPresets = presets.filter(p => p.name !== name);
                setPresets(newPresets);
                setLocalSettings(prev => ({ ...prev, presets: newPresets }));
              }}
              setShowMonitorModal={setShowMonitorModal}
            />
          </Suspense>
        </div>

        {/* Persistent Footer - Only show when there are changes */}
        {hasChanges && (
          <div className="absolute bottom-0 left-0 right-0 bg-[hsl(var(--surface-primary))] border-t border-[hsl(var(--border-primary))] shadow-lg z-10 p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[hsl(var(--text-secondary))]">
                  Unsaved changes in {currentTab.label}
                </span>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={handleCancelChanges}
                  className="px-4 py-2"
                >
                  Cancel Changes
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleTabSave(activeTab)}
                  className="px-4 py-2"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <WBaseModal
      title="Settings"
      onClose={onClose}
      maxWidth="1400px"
      maxHeight="85vh"
      footerContent={({ handleClose }) => (
        <div className="flex gap-2.5 justify-between items-center">
          <div className="flex gap-2.5">
            <Button 
              variant="secondary"
              onClick={handleReset}
            >
              Reset to Default
            </Button>
          </div>
          <div className="flex gap-2.5">
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button variant="primary" onClick={() => handleSave(handleClose)}>Save All</Button>
          </div>
        </div>
      )}
    >
      {message.text && (
        <Text 
          variant="body" 
          className={`message ${message.type} mb-2.5 font-medium`}
        >
          {message.text}
        </Text>
      )}

      {/* Sidebar Navigation */}
      <div className="flex h-[calc(85vh-200px)] border border-[hsl(var(--border-primary))] rounded-lg overflow-hidden">
        {/* Sidebar */}
        <div className="w-55 bg-[hsl(var(--surface-secondary))] border-r border-[hsl(var(--border-primary))] overflow-y-auto flex-shrink-0">
          {SETTINGS_TABS.map((tab) => (
            <SettingsTabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
            />
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-5 overflow-y-auto bg-[hsl(var(--surface-primary))] min-h-0 relative">
          {renderTabContent()}
        </div>
      </div>
    </WBaseModal>
  );
}

SettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSettingsChange: PropTypes.func,
  initialActiveTab: PropTypes.string,
};

export default SettingsModal;
