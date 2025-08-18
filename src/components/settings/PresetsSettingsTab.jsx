import React, { useState, useRef, useCallback, useEffect } from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/WButton';
import Text from '../../ui/Text';
import WToggle from '../../ui/WToggle';
import WInput from '../../ui/WInput';
import PresetListItem from '../PresetListItem';
import CommunityPresets from '../CommunityPresets';
import AuthModal from '../AuthModal';
import { uploadPreset } from '../../utils/supabase';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import JSZip from 'jszip';

const PresetsSettingsTab = React.memo(() => {
  // Use consolidated store for presets
  const { presets } = useConsolidatedAppStore();
  const { setPresets } = useConsolidatedAppStore(state => state.actions);
  
  // Local state for UI
  const [newPresetName, setNewPresetName] = useState('');
  const [error, setError] = useState('');
  const [draggingPreset, setDraggingPreset] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [editingPreset, setEditingPreset] = useState(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');
  const [justUpdated, setJustUpdated] = useState(null);
  const [showCommunitySection, setShowCommunitySection] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState({ type: '', text: '' });
  const [uploadFormData, setUploadFormData] = useState({
    name: '',
    description: '',
    creator_name: '',
    tags: '',
    custom_image: null,
    selectedPreset: null
  });
  const [includeChannels, setIncludeChannels] = useState(false);
  const [includeSounds, setIncludeSounds] = useState(false);
  
  // Load presets from backend on component mount
  useEffect(() => {
    const loadPresets = async () => {
      console.log('[DEBUG] 📋 [PresetsSettingsTab] Loading presets from backend...');
      try {
        if (window.api?.settings?.get) {
          console.log('[DEBUG] 📋 [PresetsSettingsTab] window.api.settings.get available');
          const settings = await window.api.settings.get();
          console.log('[DEBUG] 📋 [PresetsSettingsTab] Settings loaded:', Object.keys(settings));
          console.log('[DEBUG] 📋 [PresetsSettingsTab] Presets in settings:', settings.presets);
          
          if (settings.presets && Array.isArray(settings.presets)) {
            console.log('[DEBUG] 📋 [PresetsSettingsTab] Setting presets in store:', settings.presets.length, 'presets');
            setPresets(settings.presets);
          } else {
            console.log('[DEBUG] 📋 [PresetsSettingsTab] No presets found in settings or not an array');
          }
        } else {
          console.log('[DEBUG] 📋 [PresetsSettingsTab] window.api.settings.get not available');
        }
      } catch (error) {
        console.error('[DEBUG] 📋 [PresetsSettingsTab] Failed to load presets from backend:', error);
      }
    };
    
    loadPresets();
  }, [setPresets]);

  // Save presets to backend whenever they change
  const savePresetsToBackend = useCallback(async (updatedPresets) => {
    try {
      if (window.api?.settings?.get && window.api?.settings?.set) {
        const currentSettings = await window.api.settings.get();
        const updatedSettings = {
          ...currentSettings,
          presets: updatedPresets
        };
        await window.api.settings.set(updatedSettings);
        console.log('[PresetsSettingsTab] Presets saved to backend successfully');
      }
    } catch (error) {
      console.error('[PresetsSettingsTab] Failed to save presets to backend:', error);
    }
  }, []);

  // Drag and drop handlers for preset reordering
  const handleDragStart = (e, presetName) => {
    setDraggingPreset(presetName);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  const handleDragOver = (e, presetName) => {
    if (!draggingPreset) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(presetName);
  };

  const handleDragEnter = (e, presetName) => {
    if (!draggingPreset) return;
    e.preventDefault();
    setDropTarget(presetName);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDropTarget(null);
  };

  const handleDrop = (e, targetPresetName) => {
    if (!draggingPreset || draggingPreset === targetPresetName) {
      setDraggingPreset(null);
      setDropTarget(null);
      return;
    }
    
    e.preventDefault();
    
    // Reorder the presets array
    const currentPresets = [...presets];
    const draggedIndex = currentPresets.findIndex(p => p.name === draggingPreset);
    const targetIndex = currentPresets.findIndex(p => p.name === targetPresetName);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedPreset] = currentPresets.splice(draggedIndex, 1);
      currentPresets.splice(targetIndex, 0, draggedPreset);
      
      // Update the consolidated store and backend
      setPresets(currentPresets);
      savePresetsToBackend(currentPresets);
    }
    
    setDraggingPreset(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDraggingPreset(null);
    setDropTarget(null);
  };

  const handleSave = async () => {
    if (!newPresetName.trim()) {
      setError('Please enter a name for the preset.');
      return;
    }
    if (presets.some(p => p.name === newPresetName.trim())) {
      setError('A preset with this name already exists.');
      return;
    }
    console.log('[PresetsSettingsTab] Saving preset with includeChannels:', includeChannels, 'includeSounds:', includeSounds);
    
    // Get current settings from consolidated store
    const { wallpaper, ribbon, time, overlay, ui } = useConsolidatedAppStore.getState();
    
    const presetData = {
      wallpaper: {
        current: wallpaper.current,
        opacity: wallpaper.opacity,
        blur: wallpaper.blur,
        cycleWallpapers: wallpaper.cycleWallpapers,
        cycleInterval: wallpaper.cycleInterval,
        cycleAnimation: wallpaper.cycleAnimation,
        savedWallpapers: wallpaper.savedWallpapers,
        likedWallpapers: wallpaper.likedWallpapers
      },
      ribbon: {
        ribbonColor: ribbon.ribbonColor,
        ribbonGlowColor: ribbon.ribbonGlowColor,
        ribbonGlowStrength: ribbon.ribbonGlowStrength,
        ribbonGlowStrengthHover: ribbon.ribbonGlowStrengthHover,
        ribbonDockOpacity: ribbon.ribbonDockOpacity,
        glassWiiRibbon: ribbon.glassWiiRibbon,
        glassOpacity: ribbon.glassOpacity,
        glassBlur: ribbon.glassBlur,
        glassBorderOpacity: ribbon.glassBorderOpacity,
        glassShineOpacity: ribbon.glassShineOpacity
      },
      time: {
        color: time.color,
        enablePill: time.enablePill,
        pillBlur: time.pillBlur,
        pillOpacity: time.pillOpacity,
        font: time.font
      },
      overlay: {
        enabled: overlay.enabled,
        effect: overlay.effect,
        intensity: overlay.intensity,
        speed: overlay.speed,
        wind: overlay.wind,
        gravity: overlay.gravity
      },
      ui: {
        isDarkMode: ui.isDarkMode,
        useCustomCursor: ui.useCustomCursor,
        classicMode: ui.classicMode
      }
    };

    // Add channel data if requested
    if (includeChannels) {
      const { channels } = useConsolidatedAppStore.getState();
      presetData.channels = channels;
    }

    // Add sound settings if requested
    if (includeSounds) {
      // Get sound settings from backend
      if (window.api?.sounds?.get) {
        try {
          const soundData = await window.api.sounds.get();
          presetData.sounds = soundData;
        } catch (error) {
          console.warn('Failed to load sound settings for preset:', error);
        }
      }
    }

    const newPreset = {
      name: newPresetName.trim(),
      data: presetData,
      timestamp: new Date().toISOString()
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    await savePresetsToBackend(updatedPresets);
    setNewPresetName('');
    setError('');
  };

  const handleUpdate = async (name) => {
    console.log('[PresetsSettingsTab] Updating preset with includeChannels:', includeChannels, 'includeSounds:', includeSounds);
    
    // Similar logic to handleSave but update existing preset
    const { wallpaper, ribbon, time, overlay, ui } = useConsolidatedAppStore.getState();
    
    const presetData = {
      wallpaper: {
        current: wallpaper.current,
        opacity: wallpaper.opacity,
        blur: wallpaper.blur,
        cycleWallpapers: wallpaper.cycleWallpapers,
        cycleInterval: wallpaper.cycleInterval,
        cycleAnimation: wallpaper.cycleAnimation,
        savedWallpapers: wallpaper.savedWallpapers,
        likedWallpapers: wallpaper.likedWallpapers
      },
      ribbon: {
        ribbonColor: ribbon.ribbonColor,
        ribbonGlowColor: ribbon.ribbonGlowColor,
        ribbonGlowStrength: ribbon.ribbonGlowStrength,
        ribbonGlowStrengthHover: ribbon.ribbonGlowStrengthHover,
        ribbonDockOpacity: ribbon.ribbonDockOpacity,
        glassWiiRibbon: ribbon.glassWiiRibbon,
        glassOpacity: ribbon.glassOpacity,
        glassBlur: ribbon.glassBlur,
        glassBorderOpacity: ribbon.glassBorderOpacity,
        glassShineOpacity: ribbon.glassShineOpacity
      },
      time: {
        color: time.color,
        enablePill: time.enablePill,
        pillBlur: time.pillBlur,
        pillOpacity: time.pillOpacity,
        font: time.font
      },
      overlay: {
        enabled: overlay.enabled,
        effect: overlay.effect,
        intensity: overlay.intensity,
        speed: overlay.speed,
        wind: overlay.wind,
        gravity: overlay.gravity
      },
      ui: {
        isDarkMode: ui.isDarkMode,
        useCustomCursor: ui.useCustomCursor,
        classicMode: ui.classicMode
      }
    };

    if (includeChannels) {
      const { channels } = useConsolidatedAppStore.getState();
      presetData.channels = channels;
    }

    if (includeSounds) {
      if (window.api?.sounds?.get) {
        try {
          const soundData = await window.api.sounds.get();
          presetData.sounds = soundData;
        } catch (error) {
          console.warn('Failed to load sound settings for preset:', error);
        }
      }
    }

    const updatedPresets = presets.map(p => 
      p.name === name 
        ? { ...p, data: presetData, timestamp: new Date().toISOString() }
        : p
    );
    setPresets(updatedPresets);
    await savePresetsToBackend(updatedPresets);
    setJustUpdated(name);
    setTimeout(() => setJustUpdated(null), 1500);
  };

  const handleStartEdit = (preset) => {
    setEditingPreset(preset.name);
    setEditName(preset.name);
    setEditError('');
  };

  const handleCancelEdit = () => {
    setEditingPreset(null);
    setEditName('');
    setEditError('');
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      setEditError('Please enter a name for the preset.');
      return;
    }
    if (presets.some(p => p.name === editName.trim() && p.name !== editingPreset)) {
      setEditError('A preset with this name already exists.');
      return;
    }
    
    const updatedPresets = presets.map(p => 
      p.name === editingPreset 
        ? { ...p, name: editName.trim() }
        : p
    );
    setPresets(updatedPresets);
    await savePresetsToBackend(updatedPresets);
    setEditingPreset(null);
    setEditName('');
    setEditError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleDeletePreset = async (name) => {
    console.log('[DEBUG] 📋 [PresetsSettingsTab] ===== DELETING PRESET =====');
    console.log('[DEBUG] 📋 [PresetsSettingsTab] Preset name to delete:', name);
    console.log('[DEBUG] 📋 [PresetsSettingsTab] Current presets before deletion:', presets.map(p => p.name));
    
    const updatedPresets = presets.filter(p => p.name !== name);
    console.log('[DEBUG] 📋 [PresetsSettingsTab] Updated presets after deletion:', updatedPresets.map(p => p.name));
    
    setPresets(updatedPresets);
    await savePresetsToBackend(updatedPresets);
    console.log('[DEBUG] 📋 [PresetsSettingsTab] ✅ Preset deleted successfully');
  };

  const handleApplyPreset = async (preset) => {
    console.log('[DEBUG] 📋 [PresetsSettingsTab] ===== APPLYING PRESET =====');
    console.log('[DEBUG] 📋 [PresetsSettingsTab] Preset name:', preset.name);
    console.log('[DEBUG] 📋 [PresetsSettingsTab] Preset type:', preset.isCommunity ? 'Community' : 'Local');
    console.log('[DEBUG] 📋 [PresetsSettingsTab] Full preset object:', preset);
    
    // Compare structure differences
    console.log('[DEBUG] 📋 [PresetsSettingsTab] === STRUCTURE ANALYSIS ===');
    console.log('[DEBUG] 📋 [PresetsSettingsTab] Has data property:', !!preset.data);
    console.log('[DEBUG] 📋 [PresetsSettingsTab] Data type:', typeof preset.data);
    console.log('[DEBUG] 📋 [PresetsSettingsTab] Data keys:', preset.data ? Object.keys(preset.data) : 'N/A');
    
    if (preset.data) {
      console.log('[DEBUG] 📋 [PresetsSettingsTab] Wallpaper in data:', !!preset.data.wallpaper);
      console.log('[DEBUG] 📋 [PresetsSettingsTab] Ribbon in data:', !!preset.data.ribbon);
      console.log('[DEBUG] 📋 [PresetsSettingsTab] Time in data:', !!preset.data.time);
      console.log('[DEBUG] 📋 [PresetsSettingsTab] Overlay in data:', !!preset.data.overlay);
      console.log('[DEBUG] 📋 [PresetsSettingsTab] UI in data:', !!preset.data.ui);
      
      if (preset.data.wallpaper) {
        console.log('[DEBUG] 📋 [PresetsSettingsTab] Wallpaper keys:', Object.keys(preset.data.wallpaper));
      }
    }
    
    console.log('[DEBUG] 📋 [PresetsSettingsTab] === END STRUCTURE ANALYSIS ===');
    
    if (!preset.data) {
      console.error('[DEBUG] 📋 [PresetsSettingsTab] ❌ No preset data found');
      return;
    }
    
    console.log('[DEBUG] 📋 [PresetsSettingsTab] Preset data keys:', Object.keys(preset.data));
    console.log('[DEBUG] 📋 [PresetsSettingsTab] Preset data structure:', preset.data);
    
    const { setWallpaperState, setRibbonState, setTimeState, setOverlayState, setUIState } = useConsolidatedAppStore.getState().actions;
    
    // Handle different preset structures
    let settingsToApply = preset.data;
    
    console.log('[DEBUG] 📋 [PresetsSettingsTab] Initial settingsToApply:', settingsToApply);
    
    // If this is a community preset, the settings might be nested differently
    if (preset.isCommunity && preset.data.settings) {
      settingsToApply = preset.data.settings;
      console.log('[DEBUG] 📋 [PresetsSettingsTab] Using nested settings for community preset:', settingsToApply);
    }
    
    // Check if this is using the old flat structure (properties at top level)
    const hasOldStructure = settingsToApply && (
      settingsToApply.timeColor !== undefined ||
      settingsToApply.enableTimePill !== undefined ||
      settingsToApply.ribbonColor !== undefined ||
      settingsToApply.glassWiiRibbon !== undefined ||
      settingsToApply.wallpaperOpacity !== undefined
    );
    
    if (hasOldStructure) {
      console.log('[DEBUG] 📋 [PresetsSettingsTab] Detected old flat structure, converting to new nested structure');
      
      // Convert old flat structure to new nested structure
      settingsToApply = {
        time: {
          color: settingsToApply.timeColor,
          enablePill: settingsToApply.enableTimePill,
          pillBlur: settingsToApply.timePillBlur,
          pillOpacity: settingsToApply.timePillOpacity,
          font: settingsToApply.timeFont
        },
        ribbon: {
          ribbonColor: settingsToApply.ribbonColor,
          ribbonGlowColor: settingsToApply.ribbonGlowColor,
          ribbonGlowStrength: settingsToApply.ribbonGlowStrength,
          ribbonGlowStrengthHover: settingsToApply.ribbonGlowStrengthHover,
          glassWiiRibbon: settingsToApply.glassWiiRibbon,
          glassOpacity: settingsToApply.glassOpacity,
          glassBlur: settingsToApply.glassBlur,
          glassBorderOpacity: settingsToApply.glassBorderOpacity,
          glassShineOpacity: settingsToApply.glassShineOpacity,
          ribbonButtonConfigs: settingsToApply.ribbonButtonConfigs,
          recentRibbonColors: settingsToApply.recentRibbonColors,
          recentRibbonGlowColors: settingsToApply.recentRibbonGlowColors
        },
        wallpaper: {
          current: settingsToApply.wallpaper,
          opacity: settingsToApply.wallpaperOpacity,
          blur: settingsToApply.wallpaperBlur,
          cycleWallpapers: settingsToApply.cycleWallpapers,
          cycleInterval: settingsToApply.cycleInterval,
          cycleAnimation: settingsToApply.cycleAnimation,
          savedWallpapers: settingsToApply.savedWallpapers,
          likedWallpapers: settingsToApply.likedWallpapers,
          slideDirection: settingsToApply.slideDirection,
          slideDuration: settingsToApply.slideDuration,
          slideEasing: settingsToApply.slideEasing,
          slideRandomDirection: settingsToApply.slideRandomDirection,
          crossfadeDuration: settingsToApply.crossfadeDuration,
          crossfadeEasing: settingsToApply.crossfadeEasing
        },
        ui: {
          presetsButtonConfig: settingsToApply.presetsButtonConfig
        }
      };
      
      console.log('[DEBUG] 📋 [PresetsSettingsTab] Converted to new nested structure:', settingsToApply);
    }
    
    // Validate that we have the expected structure
    if (!settingsToApply || typeof settingsToApply !== 'object') {
      console.error('[DEBUG] 📋 [PresetsSettingsTab] ❌ Invalid settings structure:', settingsToApply);
      return;
    }
    
    console.log('[DEBUG] 📋 [PresetsSettingsTab] Final settingsToApply keys:', Object.keys(settingsToApply));
    
    console.log('[PresetsSettingsTab] Settings to apply:', settingsToApply);
    console.log('[PresetsSettingsTab] Current store state before applying:', useConsolidatedAppStore.getState());
    
    // Apply wallpaper settings
    if (settingsToApply.wallpaper) {
      console.log('[PresetsSettingsTab] Applying wallpaper settings:', settingsToApply.wallpaper);
      setWallpaperState(settingsToApply.wallpaper);
    }
    
    // Apply ribbon settings
    if (settingsToApply.ribbon) {
      console.log('[PresetsSettingsTab] Applying ribbon settings:', settingsToApply.ribbon);
      setRibbonState(settingsToApply.ribbon);
    }
    
    // Apply time settings with backward compatibility
    if (settingsToApply.time) {
      console.log('[PresetsSettingsTab] Applying time settings:', settingsToApply.time);
      
      // Handle both old and new property names for backward compatibility
      const timeSettings = {};
      
      // Map old property names to new ones
      if (settingsToApply.time.timeColor !== undefined) {
        timeSettings.color = settingsToApply.time.timeColor;
      }
      if (settingsToApply.time.enableTimePill !== undefined) {
        timeSettings.enablePill = settingsToApply.time.enableTimePill;
      }
      if (settingsToApply.time.timePillBlur !== undefined) {
        timeSettings.pillBlur = settingsToApply.time.timePillBlur;
      }
      if (settingsToApply.time.timePillOpacity !== undefined) {
        timeSettings.pillOpacity = settingsToApply.time.timePillOpacity;
      }
      if (settingsToApply.time.timeFont !== undefined) {
        timeSettings.font = settingsToApply.time.timeFont;
      }
      
      // Also handle new property names
      if (settingsToApply.time.color !== undefined) {
        timeSettings.color = settingsToApply.time.color;
      }
      if (settingsToApply.time.enablePill !== undefined) {
        timeSettings.enablePill = settingsToApply.time.enablePill;
      }
      if (settingsToApply.time.pillBlur !== undefined) {
        timeSettings.pillBlur = settingsToApply.time.pillBlur;
      }
      if (settingsToApply.time.pillOpacity !== undefined) {
        timeSettings.pillOpacity = settingsToApply.time.pillOpacity;
      }
      if (settingsToApply.time.font !== undefined) {
        timeSettings.font = settingsToApply.time.font;
      }
      
      console.log('[PresetsSettingsTab] Normalized time settings:', timeSettings);
      setTimeState(timeSettings);
    }
    
    // Apply overlay settings
    if (settingsToApply.overlay) {
      console.log('[PresetsSettingsTab] Applying overlay settings:', settingsToApply.overlay);
      setOverlayState(settingsToApply.overlay);
    }
    
    // Apply UI settings
    if (settingsToApply.ui) {
      console.log('[PresetsSettingsTab] Applying UI settings:', settingsToApply.ui);
      setUIState(settingsToApply.ui);
    }
    
    // Apply channel settings if present
    if (settingsToApply.channels) {
      console.log('[PresetsSettingsTab] Applying channel settings');
      const { setChannelState } = useConsolidatedAppStore.getState().actions;
      setChannelState(settingsToApply.channels);
    }
    
    // Apply sound settings if present
    if (settingsToApply.sounds && window.api?.sounds?.set) {
      console.log('[PresetsSettingsTab] Applying sound settings');
      window.api.sounds.set(settingsToApply.sounds);
    }
    
    console.log('[PresetsSettingsTab] Preset applied successfully');
    
    // Save the applied settings to backend to ensure they persist
    try {
      // Save general settings (time, ribbon, ui, channels, sounds)
      if (window.api?.settings?.get && window.api?.settings?.set) {
        const currentSettings = await window.api.settings.get();
        
        // Update settings with the applied preset values
        const updatedSettings = { ...currentSettings };
        
        if (settingsToApply.ribbon) {
          updatedSettings.ribbon = settingsToApply.ribbon;
        }
        if (settingsToApply.time) {
          updatedSettings.time = settingsToApply.time;
        }
        if (settingsToApply.ui) {
          updatedSettings.ui = settingsToApply.ui;
        }
        if (settingsToApply.channels) {
          updatedSettings.channels = settingsToApply.channels;
        }
        if (settingsToApply.sounds) {
          updatedSettings.sounds = settingsToApply.sounds;
        }
        
        await window.api.settings.set(updatedSettings);
        console.log('[PresetsSettingsTab] General settings saved to backend');
      }
      
      // Save wallpaper settings separately using wallpaper API
      if (settingsToApply.wallpaper && window.api?.wallpapers?.get && window.api?.wallpapers?.set) {
        try {
          const currentWallpaperData = await window.api.wallpapers.get();
          const updatedWallpaperData = { ...currentWallpaperData };
          
          // Update wallpaper-specific settings
          if (settingsToApply.wallpaper.current !== undefined) {
            updatedWallpaperData.wallpaper = settingsToApply.wallpaper.current;
          }
          if (settingsToApply.wallpaper.opacity !== undefined) {
            updatedWallpaperData.wallpaperOpacity = settingsToApply.wallpaper.opacity;
          }
          if (settingsToApply.wallpaper.blur !== undefined) {
            updatedWallpaperData.wallpaperBlur = settingsToApply.wallpaper.blur;
          }
          if (settingsToApply.wallpaper.savedWallpapers !== undefined) {
            updatedWallpaperData.savedWallpapers = settingsToApply.wallpaper.savedWallpapers;
          }
          if (settingsToApply.wallpaper.likedWallpapers !== undefined) {
            updatedWallpaperData.likedWallpapers = settingsToApply.wallpaper.likedWallpapers;
          }
          
          // Update cycling settings
          if (settingsToApply.wallpaper.cycleWallpapers !== undefined ||
              settingsToApply.wallpaper.cycleInterval !== undefined ||
              settingsToApply.wallpaper.cycleAnimation !== undefined) {
            updatedWallpaperData.cyclingSettings = {
              ...updatedWallpaperData.cyclingSettings,
              enabled: settingsToApply.wallpaper.cycleWallpapers ?? updatedWallpaperData.cyclingSettings?.enabled ?? false,
              interval: settingsToApply.wallpaper.cycleInterval ?? updatedWallpaperData.cyclingSettings?.interval ?? 30,
              animation: settingsToApply.wallpaper.cycleAnimation ?? updatedWallpaperData.cyclingSettings?.animation ?? 'fade',
              slideDirection: settingsToApply.wallpaper.slideDirection ?? updatedWallpaperData.cyclingSettings?.slideDirection ?? 'right',
              crossfadeDuration: settingsToApply.wallpaper.crossfadeDuration ?? updatedWallpaperData.cyclingSettings?.crossfadeDuration ?? 1.2,
              crossfadeEasing: settingsToApply.wallpaper.crossfadeEasing ?? updatedWallpaperData.cyclingSettings?.crossfadeEasing ?? 'ease-out',
              slideRandomDirection: settingsToApply.wallpaper.slideRandomDirection ?? updatedWallpaperData.cyclingSettings?.slideRandomDirection ?? false,
              slideDuration: settingsToApply.wallpaper.slideDuration ?? updatedWallpaperData.cyclingSettings?.slideDuration ?? 1.5,
              slideEasing: settingsToApply.wallpaper.slideEasing ?? updatedWallpaperData.cyclingSettings?.slideEasing ?? 'ease-out'
            };
          }
          
          await window.api.wallpapers.set(updatedWallpaperData);
          console.log('[PresetsSettingsTab] Wallpaper settings saved to backend');
        } catch (wallpaperError) {
          console.error('[PresetsSettingsTab] Failed to save wallpaper settings:', wallpaperError);
        }
      }
      
      // Save overlay settings separately (they're also stored in wallpaper data)
      if (settingsToApply.overlay && window.api?.wallpapers?.get && window.api?.wallpapers?.set) {
        try {
          const currentWallpaperData = await window.api.wallpapers.get();
          const updatedWallpaperData = { ...currentWallpaperData };
          
          if (settingsToApply.overlay.enabled !== undefined) {
            updatedWallpaperData.overlayEnabled = settingsToApply.overlay.enabled;
          }
          if (settingsToApply.overlay.effect !== undefined) {
            updatedWallpaperData.overlayEffect = settingsToApply.overlay.effect;
          }
          if (settingsToApply.overlay.intensity !== undefined) {
            updatedWallpaperData.overlayIntensity = settingsToApply.overlay.intensity;
          }
          if (settingsToApply.overlay.speed !== undefined) {
            updatedWallpaperData.overlaySpeed = settingsToApply.overlay.speed;
          }
          if (settingsToApply.overlay.wind !== undefined) {
            updatedWallpaperData.overlayWind = settingsToApply.overlay.wind;
          }
          if (settingsToApply.overlay.gravity !== undefined) {
            updatedWallpaperData.overlayGravity = settingsToApply.overlay.gravity;
          }
          
          await window.api.wallpapers.set(updatedWallpaperData);
          console.log('[PresetsSettingsTab] Overlay settings saved to backend');
        } catch (overlayError) {
          console.error('[PresetsSettingsTab] Failed to save overlay settings:', overlayError);
        }
      }
      
      console.log('[PresetsSettingsTab] All applied settings saved to backend');
    } catch (error) {
      console.error('[PresetsSettingsTab] Failed to save applied settings to backend:', error);
    }
  };

  const toggleCommunitySection = () => {
    setShowCommunitySection(prev => !prev);
  };

  // Community sharing handlers
  const handleSharePreset = (preset) => {
    setUploadFormData({
      name: preset.name,
      description: '',
      creator_name: '',
      selectedPreset: preset
    });
    setShowUploadForm(true);
    setUploadMessage({ type: '', text: '' });
  };

  const handleImportCommunityPreset = async (presetData) => {
    console.log('[DEBUG] 📋 [PresetsSettingsTab] ===== IMPORTING COMMUNITY PRESET =====');
    console.log('[DEBUG] 📋 [PresetsSettingsTab] Preset data received:', presetData);
    console.log('[DEBUG] 📋 [PresetsSettingsTab] Is array:', Array.isArray(presetData));
    
    // Handle both single preset and array of presets
    const presetsToImport = Array.isArray(presetData) ? presetData : [presetData];
    console.log('[DEBUG] 📋 [PresetsSettingsTab] Presets to import count:', presetsToImport.length);
    
    for (let index = 0; index < presetsToImport.length; index++) {
      const preset = presetsToImport[index];
      
      // Convert the downloaded preset structure to the expected format
      console.log('[DEBUG] 📋 [PresetsSettingsTab] Original preset.settings:', preset.settings);
      
      // Community presets should have the same structure as local presets
      let presetSettings = preset.settings;
      
      // If the preset.settings doesn't have the expected structure, try to normalize it
      if (presetSettings && typeof presetSettings === 'object') {
        // Check if this is using the old flat structure (properties at top level)
        const hasOldStructure = presetSettings.timeColor !== undefined ||
          presetSettings.enableTimePill !== undefined ||
          presetSettings.ribbonColor !== undefined ||
          presetSettings.glassWiiRibbon !== undefined ||
          presetSettings.wallpaperOpacity !== undefined;
        
        if (hasOldStructure) {
          console.log('[DEBUG] 📋 [PresetsSettingsTab] Converting old flat structure to new nested structure during import');
          
          // Convert old flat structure to new nested structure
          presetSettings = {
            time: {
              color: presetSettings.timeColor,
              enablePill: presetSettings.enableTimePill,
              pillBlur: presetSettings.timePillBlur,
              pillOpacity: presetSettings.timePillOpacity,
              font: presetSettings.timeFont
            },
            ribbon: {
              ribbonColor: presetSettings.ribbonColor,
              ribbonGlowColor: presetSettings.ribbonGlowColor,
              ribbonGlowStrength: presetSettings.ribbonGlowStrength,
              ribbonGlowStrengthHover: presetSettings.ribbonGlowStrengthHover,
              glassWiiRibbon: presetSettings.glassWiiRibbon,
              glassOpacity: presetSettings.glassOpacity,
              glassBlur: presetSettings.glassBlur,
              glassBorderOpacity: presetSettings.glassBorderOpacity,
              glassShineOpacity: presetSettings.glassShineOpacity,
              ribbonButtonConfigs: presetSettings.ribbonButtonConfigs,
              recentRibbonColors: presetSettings.recentRibbonColors,
              recentRibbonGlowColors: presetSettings.recentRibbonGlowColors
            },
            wallpaper: {
              current: presetSettings.wallpaper,
              opacity: presetSettings.wallpaperOpacity,
              blur: presetSettings.wallpaperBlur,
              cycleWallpapers: presetSettings.cycleWallpapers,
              cycleInterval: presetSettings.cycleInterval,
              cycleAnimation: presetSettings.cycleAnimation,
              savedWallpapers: presetSettings.savedWallpapers,
              likedWallpapers: presetSettings.likedWallpapers,
              slideDirection: presetSettings.slideDirection,
              slideDuration: presetSettings.slideDuration,
              slideEasing: presetSettings.slideEasing,
              slideRandomDirection: presetSettings.slideRandomDirection,
              crossfadeDuration: presetSettings.crossfadeDuration,
              crossfadeEasing: presetSettings.crossfadeEasing
            },
            ui: {
              presetsButtonConfig: presetSettings.presetsButtonConfig
            }
          };
        } else if (!presetSettings.wallpaper && presetSettings.current) {
          // If wallpaper settings are at the top level, wrap them
          presetSettings = {
            wallpaper: presetSettings,
            ribbon: presetSettings.ribbon || {},
            time: presetSettings.time || {},
            overlay: presetSettings.overlay || {},
            ui: presetSettings.ui || {}
          };
        }
      }
      
      console.log('[DEBUG] 📋 [PresetsSettingsTab] Normalized presetSettings:', presetSettings);
      
      // Handle wallpaper download and conversion
      if (preset.wallpaper && preset.wallpaper.data) {
        try {
          if (preset.wallpaper.data && (preset.wallpaper.data instanceof ArrayBuffer || preset.wallpaper.data.byteLength > 0)) {
            const arrayBuffer = preset.wallpaper.data;
            const uint8Array = new Uint8Array(arrayBuffer);
            const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
            const base64Data = btoa(binaryString);
            
            const fileName = preset.wallpaper.fileName || `community-wallpaper-${Date.now()}.jpg`;
            const mimeType = preset.wallpaper.mimeType || 'image/jpeg';
            
            if (window.api?.wallpapers?.saveFile) {
              const saveResult = await window.api.wallpapers.saveFile({
                filename: fileName,
                data: base64Data,
                mimeType: mimeType
              });
              
              if (saveResult.success) {
                if (presetSettings.wallpaper) {
                  presetSettings.wallpaper.url = saveResult.url;
                  presetSettings.wallpaper.name = fileName;
                }
                
                if (presetSettings.savedWallpapers && Array.isArray(presetSettings.savedWallpapers)) {
                  presetSettings.savedWallpapers = presetSettings.savedWallpapers.map(wp => {
                    if (wp.url && wp.url.includes('userdata://wallpapers/')) {
                      return wp;
                    } else {
                      return wp;
                    }
                  });
                }
              }
            }
          }
        } catch (error) {
          console.error(`[PresetsSettingsTab] Error processing wallpaper for preset ${index}:`, error);
        }
      }
      
      const convertedPreset = {
        name: preset.name,
        data: presetSettings,
        timestamp: new Date().toISOString(),
        isCommunity: true,
        communityId: preset.id
      };
      
      console.log('[DEBUG] 📋 [PresetsSettingsTab] Converted community preset structure:', convertedPreset);
      
      if (presets.length < 6) {
        console.log('[DEBUG] 📋 [PresetsSettingsTab] Adding preset to store (current count:', presets.length, ')');
        const updatedPresets = [...presets, convertedPreset];
        setPresets(updatedPresets);
        await savePresetsToBackend(updatedPresets);
        console.log('[DEBUG] 📋 [PresetsSettingsTab] ✅ Community preset imported successfully');
      } else {
        console.log('[DEBUG] 📋 [PresetsSettingsTab] ❌ Cannot import - max presets reached (6)');
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadFormData.selectedPreset) {
      setUploadMessage({ type: 'error', text: 'Please select a preset to share' });
      return;
    }

    try {
      setUploading(true);
      setUploadMessage({ type: '', text: '' });

      // Get current wallpaper if it exists
      let wallpaperFile = null;
      if (uploadFormData.selectedPreset.data?.wallpaper?.url) {
        try {
          if (uploadFormData.selectedPreset.data.wallpaper.url.startsWith('userdata://')) {
            const wallpaperResult = await window.api.wallpapers.getFile(uploadFormData.selectedPreset.data.wallpaper.url);
            if (wallpaperResult.success) {
              const binaryString = atob(wallpaperResult.data);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              wallpaperFile = new File([bytes], wallpaperResult.filename, { 
                type: uploadFormData.selectedPreset.data.wallpaper.mimeType || 'image/jpeg' 
              });
            }
          } else {
            const response = await fetch(uploadFormData.selectedPreset.data.wallpaper.url);
            const blob = await response.blob();
            wallpaperFile = new File([blob], 'wallpaper.jpg', { type: 'image/jpeg' });
          }
        } catch (error) {
          console.warn('[UPLOAD] Could not load wallpaper for upload:', error);
        }
      }

      // Process custom image if provided
      let customImageFile = null;
      if (uploadFormData.custom_image) {
        try {
          const base64Data = uploadFormData.custom_image.split(',')[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          customImageFile = new File([bytes], 'custom-display.jpg', { type: 'image/jpeg' });
        } catch (error) {
          console.warn('[UPLOAD] Could not process custom image:', error);
        }
      }

      // Create preset data for new schema
      const presetData = {
        settings: uploadFormData.selectedPreset.data,
        wallpaper: wallpaperFile,
        customImage: customImageFile
      };

      // Remove channel data from shared presets for security and compatibility
      if (presetData.settings) {
        delete presetData.settings.channels;
        delete presetData.settings.mediaMap;
        delete presetData.settings.appPathMap;
        delete presetData.settings.channelData;
        delete presetData.settings.soundLibrary;
      }

      // Create form data for new schema
      const formData = {
        name: uploadFormData.name,
        description: uploadFormData.description,
        tags: uploadFormData.tags ? uploadFormData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [],
        creator_name: uploadFormData.creator_name || 'Anonymous'
      };

      const result = await uploadPreset(presetData, formData);
      
      if (result) {
        setUploadMessage({ type: 'success', text: 'Preset uploaded successfully!' });
        setTimeout(() => {
          setShowUploadForm(false);
          setUploadFormData({ 
            name: '', 
            description: '', 
            creator_name: '', 
            tags: '',
            custom_image: null,
            selectedPreset: null
          });
          setUploadMessage({ type: '', text: '' });
        }, 1500);
      } else {
        setUploadMessage({ type: 'error', text: 'Failed to upload preset' });
      }
    } catch (error) {
      console.error('[UPLOAD] Upload error:', error);
      setUploadMessage({ type: 'error', text: `Upload failed: ${error.message}` });
    } finally {
      setUploading(false);
    }
  };

  const handleUploadInputChange = (field, value) => {
    setUploadFormData(prev => ({ ...prev, [field]: value }));
    if (uploadMessage.text) setUploadMessage({ type: '', text: '' });
  };

  return (
    <div>
      <Card style={{ marginBottom: 18 }} title="Save Current as Preset" separator>
        <div className="wee-card-desc">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <WInput
              type="text"
              placeholder="Preset name"
              value={newPresetName}
              onChange={e => { setNewPresetName(e.target.value); setError(''); }}
              maxLength={32}
              disabled={presets.length >= 6}
              style={{ flex: 1 }}
            />
            <Button variant="primary" style={{ minWidth: 90 }} onClick={handleSave} disabled={presets.length >= 6}>
              Save Preset
            </Button>
          </div>
          
          {/* Include Channel Data Toggle */}
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <WToggle
              checked={includeChannels}
              onChange={setIncludeChannels}
              label="Include Channel Data"
            />
            <Text size="sm" color="hsl(var(--text-secondary))" style={{ marginLeft: 8 }}>
              Save channels, their media, and app paths for workspace switching
            </Text>
          </div>
          
          {/* Include Sound Settings Toggle */}
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <WToggle
              checked={includeSounds}
              onChange={setIncludeSounds}
              label="Include Sound Settings"
            />
            <Text size="sm" color="hsl(var(--text-secondary))" style={{ marginLeft: 8 }}>
              Save sound library and audio preferences
            </Text>
          </div>
          
          {/* Help text for channel data feature */}
          {includeChannels && (
            <div style={{ 
              marginTop: 8, 
              padding: 8, 
              background: 'hsl(var(--primary) / 0.1)', 
              border: '1px solid hsl(var(--primary) / 0.2)', 
              borderRadius: 6,
              fontSize: 12
            }}>
              <Text size="sm" color="hsl(var(--primary))" style={{ fontWeight: 500, marginBottom: 4 }}>
                🎯 Workspace Mode Enabled
              </Text>
              <Text size="sm" color="hsl(var(--text-secondary))">
                This preset will save your current channels, apps, and settings. Perfect for switching between "Gaming" and "Work" workspaces. 
                <strong>Note:</strong> Channel data is never included when sharing presets.
              </Text>
            </div>
          )}
          
          {error && <Text size="sm" color={"#dc3545"} style={{ marginTop: 6 }}>{error}</Text>}
          {presets.length >= 6 && <Text size="sm" color="hsl(var(--text-secondary))" style={{ marginTop: 6 }}>You can save up to 6 presets.</Text>}
        </div>
      </Card>

      <Card 
        style={{ marginBottom: 18 }} 
        title="Saved Presets" 
        separator
        desc="Drag presets by the ⋮⋮ handle to reorder them. Apply presets to change your appearance settings."
      >
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: 0 }}>
          {presets.map((preset, idx) => {
            const isDragging = draggingPreset === preset.name;
            const isDropTarget = dropTarget === preset.name;
            
            return (
              <PresetListItem
                key={preset.name}
                preset={preset}
                isDragging={isDragging}
                isDropTarget={isDropTarget}
                isSelected={false}
                selectMode={false}
                editingPreset={editingPreset}
                editName={editName}
                justUpdated={justUpdated}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onToggleSelect={() => {}}
                onApply={handleApplyPreset}
                onUpdate={handleUpdate}
                onStartEdit={handleStartEdit}
                onDelete={handleDeletePreset}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onEditNameChange={e => setEditName(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            );
          })}
        </ul>
      </Card>

      {/* Community Presets Section */}
      <Card 
        style={{ marginBottom: 18 }} 
        title="Community Presets" 
        separator
        desc="Browse and download presets shared by the community."
      >
        <div style={{ marginBottom: '16px' }}>
          <Button 
            variant="secondary" 
            onClick={toggleCommunitySection}
            style={{ marginRight: '12px' }}
          >
            {showCommunitySection ? 'Hide Community' : 'Browse Community'}
          </Button>
          {presets.length > 0 && (
            <Button 
              variant="primary" 
              onClick={() => {
                setUploadFormData({
                  name: '',
                  description: '',
                  creator_name: '',
                  custom_image: null,
                  selectedPreset: null
                });
                setShowUploadForm(true);
                setUploadMessage({ type: '', text: '' });
              }}
            >
              Share My Preset
            </Button>
          )}
        </div>

        {/* Upload Form Section */}
        {showUploadForm && (
          <Card style={{ marginBottom: '16px', padding: '16px' }}>
            {uploadMessage.text && (
              <div style={{ 
                padding: '12px', 
                borderRadius: '6px', 
                marginBottom: '16px',
                background: uploadMessage.type === 'success' ? 'hsl(var(--success-light))' : 'hsl(var(--error-light))',
                color: uploadMessage.type === 'success' ? 'hsl(var(--success))' : 'hsl(var(--error))',
                border: `1px solid ${uploadMessage.type === 'success' ? 'hsl(var(--success))' : 'hsl(var(--error))'}`
              }}>
                {uploadMessage.text}
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <Text variant="label" style={{ marginBottom: '8px' }}>Select Preset to Share *</Text>
              <select
                value={uploadFormData.selectedPreset ? uploadFormData.selectedPreset.name : ''}
                onChange={(e) => {
                  const selectedPreset = presets.find(p => p.name === e.target.value);
                  setUploadFormData(prev => ({
                    ...prev,
                    name: selectedPreset ? selectedPreset.name : '',
                    selectedPreset: selectedPreset || null
                  }));
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid hsl(var(--border-primary))',
                  borderRadius: '6px',
                  background: 'hsl(var(--surface-primary))',
                  color: 'hsl(var(--text-primary))'
                }}
              >
                <option value="">Select a preset to share...</option>
                {presets.map((preset) => (
                  <option key={preset.name} value={preset.name}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <Text variant="label" style={{ marginBottom: '8px' }}>Description</Text>
              <textarea
                value={uploadFormData.description}
                onChange={(e) => handleUploadInputChange('description', e.target.value)}
                placeholder="Describe your preset..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid hsl(var(--border-primary))',
                  borderRadius: '6px',
                  background: 'hsl(var(--surface-primary))',
                  color: 'hsl(var(--text-primary))',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text variant="label" style={{ marginBottom: '8px' }}>Your Name (Optional)</Text>
              <input
                type="text"
                value={uploadFormData.creator_name}
                onChange={(e) => handleUploadInputChange('creator_name', e.target.value)}
                placeholder="Anonymous"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid hsl(var(--border-primary))',
                  borderRadius: '6px',
                  background: 'hsl(var(--surface-primary))',
                  color: 'hsl(var(--text-primary))'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text variant="label" style={{ marginBottom: '8px' }}>Custom Image (Optional)</Text>
              <Text size="sm" color="hsl(var(--text-secondary))" style={{ marginBottom: '8px' }}>
                Upload a custom image to represent your preset. If not provided, a thumbnail will be auto-generated.
              </Text>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        handleUploadInputChange('custom_image', reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ display: 'none' }}
                  id="custom-image-upload"
                />
                <Button
                  variant="secondary"
                  onClick={() => document.getElementById('custom-image-upload').click()}
                  style={{ flex: 1 }}
                >
                  Choose Image
                </Button>
                {uploadFormData.custom_image && (
                  <Button
                    variant="secondary"
                    onClick={() => handleUploadInputChange('custom_image', null)}
                  >
                    Remove
                  </Button>
                )}
              </div>
              {uploadFormData.custom_image && (
                <div style={{ marginTop: '8px' }}>
                  <img
                    src={uploadFormData.custom_image}
                    alt="Custom image preview"
                    style={{
                      width: '100px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      border: '1px solid hsl(var(--border-primary))'
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowUploadForm(false);
                  setUploadFormData({ name: '', description: '', creator_name: '' });
                  setUploadMessage({ type: '', text: '' });
                }}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleUpload} 
                disabled={uploading || !uploadFormData.name.trim()}
              >
                {uploading ? 'Uploading...' : 'Share Preset'}
              </Button>
            </div>
          </Card>
        )}

        {showCommunitySection && (
          <CommunityPresets 
            onImportPreset={handleImportCommunityPreset}
            onClose={() => toggleCommunitySection()}
          />
        )}
      </Card>

      {/* Auth Modal */}
      <AuthModal />
    </div>
  );
});

export default PresetsSettingsTab; 