import React, { useState, useEffect, useCallback, Suspense, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import WBaseModal from './WBaseModal';
import Button from '../ui/WButton';
import Card from '../ui/Card';
import Text from '../ui/Text';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import SoundModal from './SoundModal';

// Direct imports for all tabs - no lazy loading needed
import ChannelsSettingsTab from './settings/ChannelsSettingsTab';
import UnifiedDockSettingsTab from './settings/UnifiedDockSettingsTab';
import WallpaperSettingsTab from './settings/WallpaperSettingsTab';
import TimeSettingsTab from './settings/TimeSettingsTab';
import SoundsSettingsTab from './settings/SoundsSettingsTab';
import GeneralSettingsTab from './settings/GeneralSettingsTab';
import PresetsSettingsTab from './settings/PresetsSettingsTab';
import MonitorSettingsTab from './settings/MonitorSettingsTab';
import ApiIntegrationsSettingsTab from './settings/ApiIntegrationsSettingsTab';
import AdvancedSettingsTab from './settings/AdvancedSettingsTab';
import LayoutSettingsTab from './settings/LayoutSettingsTab';
import ShortcutsSettingsTab from './settings/ShortcutsSettingsTab';
import UpdatesSettingsTab from './settings/UpdatesSettingsTab';
import NavigationSettingsTab from './settings/NavigationSettingsTab';



// Settings Tab Button Component - Optimized
const SettingsTabButton = React.memo(({ tab, isActive, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);
  const handleClick = useCallback(() => onClick(tab.id), [onClick, tab.id]);
  
  const backgroundColor = useMemo(() => {
    if (isActive) return tab.color;
    if (isHovered) return 'hsl(var(--surface-tertiary))';
    return 'transparent';
  }, [isActive, isHovered, tab.color]);
  
  const textColor = useMemo(() => {
    if (isActive) return 'white';
    if (isHovered) return tab.color;
    return 'hsl(var(--text-secondary))';
  }, [isActive, isHovered, tab.color]);
  
  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="w-full p-4 border-none cursor-pointer text-sm font-medium transition-all duration-200 ease-in-out flex items-center gap-3 text-left border-b border-[hsl(var(--border-primary))] relative group"
      style={{
        background: backgroundColor,
        color: textColor,
        fontWeight: isActive ? '600' : '500'
      }}
    >
      <span className="text-lg">{tab.icon}</span>
      <div className="flex flex-col items-start flex-1">
        <div className="flex items-center gap-2">
        <span className="font-semibold">{tab.label}</span>
        </div>
        <span className="text-xs opacity-70 mt-0.5">
          {tab.description}
        </span>
      </div>
      {/* Hover indicator */}
      <div 
        className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-1 h-8 rounded-full transition-all duration-200 ${
          isHovered ? 'bg-current opacity-60' : 'opacity-0'
        }`}
      />
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
    id: 'api-integrations', 
    label: 'API & Widgets', 
    icon: '🔌', 
    color: '#1db954', 
    description: 'External services & floating widgets',
    component: ApiIntegrationsSettingsTab
  },
  { 
    id: 'channels', 
    label: 'Channels', 
    icon: '📺', 
    color: '#0099ff', 
    description: 'Animation & display settings',
    component: ChannelsSettingsTab
  },
  { 
    id: 'dock', 
    label: 'Dock', 
    icon: '⚓', 
    color: '#feca57', 
    description: 'Classic & Ribbon dock settings',
    component: UnifiedDockSettingsTab
  },
  { 
    id: 'general', 
    label: 'General', 
    icon: '⚙️', 
    color: '#6c5ce7', 
    description: 'App behavior & startup',
    component: GeneralSettingsTab
  },
  { 
    id: 'layout', 
    label: 'Layout', 
    icon: '📐', 
    color: '#00b894', 
    description: 'Grid & navigation modes',
    component: LayoutSettingsTab
  },
  { 
    id: 'navigation', 
    label: 'Navigation', 
    icon: '🧭', 
    color: '#fd79a8', 
    description: 'Side navigation buttons',
    component: NavigationSettingsTab
  },
  { 
    id: 'monitor', 
    label: 'Monitor (beta)', 
    icon: '🖥️', 
    color: '#ff6b9d', 
    description: 'Multi-monitor settings',
    component: MonitorSettingsTab
  },
  { 
    id: 'shortcuts', 
    label: 'Shortcuts', 
    icon: '⌨️', 
    color: '#ff9f43', 
    description: 'Keyboard shortcuts & hotkeys',
    component: ShortcutsSettingsTab
  },
  { 
    id: 'sounds', 
    label: 'Sounds', 
    icon: '🔊', 
    color: '#a55eea', 
    description: 'Audio feedback & music',
    component: SoundsSettingsTab
  },
  { 
    id: 'themes', 
    label: 'Presets', 
    icon: '🎨', 
    color: '#ff9ff3', 
    description: 'Preset themes & customization',
    component: PresetsSettingsTab
  },
  { 
    id: 'time', 
    label: 'Time', 
    icon: '🕐', 
    color: '#45b7d1', 
    description: 'Clock & pill display',
    component: TimeSettingsTab
  },
  { 
    id: 'updates', 
    label: 'Updates', 
    icon: '🔄', 
    color: '#00cec9', 
    description: 'Check for updates & version info',
    component: UpdatesSettingsTab
  },
  { 
    id: 'wallpaper', 
    label: 'Wallpaper', 
    icon: '🖼️', 
    color: '#4ecdc4', 
    description: 'Background & cycling',
    component: WallpaperSettingsTab
  }
];

function SettingsModal({ isOpen, onClose, onSettingsChange, initialActiveTab = 'channels' }) {
  // Performance optimizations
  const modalRef = useRef(null);
  const tabContentRef = useRef(null);
  
  // Get initial tab from UI state if available
  const { ui } = useConsolidatedAppStore();
  const effectiveInitialTab = ui.settingsActiveTab || initialActiveTab;
  
  // Use legacy settings system for now since unified data layer isn't fully implemented
  const [localSettings, setLocalSettings] = useState({});
  const [presets, setPresets] = useState([]);

  // Local state
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showMonitorModal, setShowMonitorModal] = useState(false);
  const [showSoundModal, setShowSoundModal] = useState(false);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTabs, setFilteredTabs] = useState(SETTINGS_TABS);

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
      
      // Ensure dockSettings exist in localSettings
      if (window.settings?.dockSettings) {
        setLocalSettings(prev => ({
          ...prev,
          dockSettings: window.settings.dockSettings
        }));
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
          dockSettings: localSettings.dockSettings || {},
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



  // Simple tab navigation
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  // Open sound modal
  const handleOpenSoundModal = () => {
    setShowSoundModal(true);
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
        // GeneralSettingsTab uses consolidated store directly - no props needed
        tabSettings = {};
        break;
      case 'channels':
        // ChannelsSettingsTab uses consolidated store directly - no props needed
        tabSettings = {};
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
        // SoundsSettingsTab uses consolidated store directly - no props needed
        tabSettings = {};
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
      case 'navigation':
        // NavigationSettingsTab uses consolidated store directly - no props needed
        tabSettings = {};
        break;
      default:
        tabSettings = localSettings;
    }
    
    return tabSettings;
  };


  





  
  // Simple render tab content
  const renderTabContent = useMemo(() => {
    const currentTab = SETTINGS_TABS.find(tab => tab.id === activeTab);
    
    if (!currentTab) {
      return <div className="p-8 text-center text-[hsl(var(--text-secondary))]">Tab not found</div>;
    }

    const TabComponent = currentTab.component;
    const tabSettings = getTabSettings(activeTab);

    return (
      <div className="relative h-full flex flex-col">
        {/* Tab Content with Scrollable Area */}
        <div 
          ref={tabContentRef}
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[hsl(var(--border-primary))] scrollbar-track-transparent pb-4"
        >
            <TabComponent 
              // Pass props based on the tab's expected interface
            {...(activeTab === 'monitor' || activeTab === 'advanced' || activeTab === 'api-integrations' ? {
                localSettings: tabSettings,
                updateLocalSetting: handleGeneralSettingUpdate
              } : activeTab === 'channels' ? {
                settings: tabSettings,
                onSettingChange: handleDirectSettingUpdate
            } : activeTab === 'general' || activeTab === 'ribbon' || activeTab === 'wallpaper' || activeTab === 'time' || activeTab === 'layout' || activeTab === 'updates' || activeTab === 'dock' || activeTab === 'navigation' ? {
              // GeneralSettingsTab, RibbonSettingsTab, WallpaperSettingsTab, TimeSettingsTab, LayoutSettingsTab, UpdatesSettingsTab, UnifiedDockSettingsTab, and NavigationSettingsTab use consolidated store directly - no props needed
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
        </div>


      </div>
    );
  }, [activeTab, presets, handleGeneralSettingUpdate, handleDirectSettingUpdate, handleTabChange]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      const currentIndex = SETTINGS_TABS.findIndex(tab => tab.id === activeTab);
      
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % SETTINGS_TABS.length;
          handleTabChange(SETTINGS_TABS[nextIndex].id);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          const prevIndex = currentIndex === 0 ? SETTINGS_TABS.length - 1 : currentIndex - 1;
          handleTabChange(SETTINGS_TABS[prevIndex].id);
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;

      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, handleTabChange, onClose]);

  // Search filter logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTabs(SETTINGS_TABS);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = SETTINGS_TABS.filter(tab => 
      tab.label.toLowerCase().includes(query) ||
      tab.description.toLowerCase().includes(query) ||
      tab.id.toLowerCase().includes(query)
    );
    setFilteredTabs(filtered);
  }, [searchQuery]);

  // Auto-focus first tab on open
  useEffect(() => {
    if (isOpen && tabContentRef.current) {
      const firstFocusable = tabContentRef.current.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, [isOpen, activeTab]);



  if (!isOpen) return null;

  return (
    <WBaseModal
      title="Settings"
      onClose={onClose}
      maxWidth="1400px"
      maxHeight="85vh"
      ref={modalRef}
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
            <Button variant="secondary" onClick={handleClose}>Close</Button>
          </div>
        </div>
      )}
    >
      {/* Enhanced Message Display */}
      {message.text && (
        <div 
          className={`mb-4 p-4 rounded-lg border shadow-lg backdrop-blur-sm transition-all duration-300 ${
            message.type === 'success' 
              ? 'bg-green-50/90 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300' 
              : message.type === 'error' 
              ? 'bg-red-50/90 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300' 
              : 'bg-blue-50/90 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`text-xl ${
              message.type === 'success' ? 'text-green-600' : 
              message.type === 'error' ? 'text-red-600' : 'text-blue-600'
            }`}>
              {message.type === 'success' ? '✅' : message.type === 'error' ? '❌' : 'ℹ️'}
            </div>
            <Text variant="body" className="font-medium flex-1">
          {message.text}
        </Text>
            <button 
              onClick={() => setMessage({ type: '', text: '' })}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <div className="flex h-[calc(85vh-200px)] border border-[hsl(var(--border-primary))] rounded-lg overflow-hidden">
        {/* Sidebar */}
        <div className="w-55 bg-[hsl(var(--surface-secondary))] border-r border-[hsl(var(--border-primary))] flex flex-col flex-shrink-0">
          {/* Search Bar */}
          <div className="p-4 border-b border-[hsl(var(--border-primary))]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 pl-10 text-sm bg-[hsl(var(--surface-primary))] border border-[hsl(var(--border-primary))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all duration-200"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[hsl(var(--text-secondary))]">
                🔍
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          
          {/* Tab List */}
          <div className="flex-1 overflow-y-auto">
            {filteredTabs.length > 0 ? (
              filteredTabs.map((tab) => (
            <SettingsTabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
                  onClick={handleTabChange}
                />
              ))
            ) : (
              <div className="p-4 text-center text-[hsl(var(--text-secondary))]">
                <div className="text-2xl mb-2">🔍</div>
                <div className="text-sm">No settings found</div>
                <div className="text-xs mt-1">Try a different search term</div>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-5 bg-[hsl(var(--surface-primary))] min-h-0 relative">
          {renderTabContent}
        </div>
      </div>

      {/* Sound Modal */}
      <SoundModal
        isOpen={showSoundModal}
        onClose={() => setShowSoundModal(false)}
        onSettingsChange={onSettingsChange}
      />
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
