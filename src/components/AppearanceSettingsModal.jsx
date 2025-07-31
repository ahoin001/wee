import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import Button from '../ui/Button';
import Slider from '../ui/Slider';
import Card from '../ui/Card';
import Toggle from '../ui/Toggle';
import Text from '../ui/Text';
import useAppearanceSettingsStore from '../utils/useAppearanceSettingsStore';
import { spacing } from '../ui/tokens';
import './BaseModal.css';
import './SoundModal.css';
import JSZip from 'jszip';
import PresetListItem from './PresetListItem';
import CommunityPresets from './CommunityPresets';
import useUIStore from '../utils/useUIStore';
import { uploadPreset } from '../utils/supabase';
import AuthModal from './AuthModal';
import useAuthModalStore from '../utils/useAuthModalStore';
import MonitorSelectionModal from './MonitorSelectionModal';
import ChannelsSettingsTab from './settings/ChannelsSettingsTab';
import RibbonSettingsTab from './settings/RibbonSettingsTab';
import PresetManager from './settings/PresetManager';
import ThemesSettingsTab from './settings/ThemesSettingsTab';
import WallpaperSettingsTab from './settings/WallpaperSettingsTab';
import GeneralSettingsTab from './settings/GeneralSettingsTab';
import TimeSettingsTab from './settings/TimeSettingsTab';
import SoundsSettingsTab from './settings/SoundsSettingsTab';
import DockSettingsTab from './settings/DockSettingsTab';
import MonitorSettingsTab from './settings/MonitorSettingsTab';
import AdvancedSettingsTab from './settings/AdvancedSettingsTab';

// Auth service (we'll create this)
import { authService } from '../utils/authService';

// Sidebar navigation configuration
const SIDEBAR_SECTIONS = [
  { id: 'channels', label: 'Channels', icon: '📺', color: '#0099ff', description: 'Animation & display settings' },
  { id: 'ribbon', label: 'Ribbon', icon: '🎗️', color: '#ff6b35', description: 'Colors & glass effects' },
  { id: 'wallpaper', label: 'Wallpaper', icon: '🖼️', color: '#4ecdc4', description: 'Background & cycling' },
  { id: 'time', label: 'Time', icon: '🕐', color: '#45b7d1', description: 'Clock & pill display' },
//   { id: 'sounds', label: 'Sounds', icon: '🎵', color: '#96ceb4', description: 'Audio & feedback' },
//   { id: 'dock', label: 'Dock', icon: '⚓', color: '#feca57', description: 'Classic dock settings' },
  { id: 'themes', label: 'Themes', icon: '🎨', color: '#ff9ff3', description: 'Preset themes' },
  { id: 'monitor', label: 'Monitor (beta)', icon: '🖥️', color: '#ff6b9d', description: 'Multi-monitor settings' },
  { id: 'general', label: 'General', icon: '⚙️', color: '#6c5ce7', description: 'App behavior & startup' },
//   { id: 'advanced', label: 'Advanced', icon: '⚙️', color: '#54a0ff', description: 'Expert options' }
];

function AppearanceSettingsModal({ isOpen, onClose, onSettingsChange }) {
  const {
    isOpen: modalIsOpen,
    activeTab,
    tabs,
    openModal,
    closeModal,
    setActiveTab,
    updateTabSettings,
    loadSettings,
    getAllSettings,
    resetAllSettings
  } = useAppearanceSettingsStore();

  // Local state for form inputs
  const [localSettings, setLocalSettings] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  // Presets state and functions
  const [presets, setPresets] = useState([]);
  const [importedPresets, setImportedPresets] = useState(null);
  const [importError, setImportError] = useState('');
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [error, setError] = useState('');
  const [justUpdated, setJustUpdated] = useState(null);
  const [editingPreset, setEditingPreset] = useState(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');
  const [includeChannels, setIncludeChannels] = useState(false);
  const [includeSounds, setIncludeSounds] = useState(false);
  const [overwriteMap, setOverwriteMap] = useState({});
  const [selectedPresets, setSelectedPresets] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [draggingPreset, setDraggingPreset] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const fileInputRef = useRef();
  
  // Upload form state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState({ type: '', text: '' });
  const [uploadFormData, setUploadFormData] = useState({
    name: '',
    description: '',
    creator_name: '',
    custom_image: null,
    selectedPreset: null
  });

  // Get Zustand store state for community section
  const { 
    showCommunitySection, 
    toggleCommunitySection
  } = useUIStore();

  // Account management state
  const [currentUser, setCurrentUser] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  
  // Monitor modal state
  const [showMonitorModal, setShowMonitorModal] = useState(false);
  
  // Auth modal store
  const { openModal: openAuthModal } = useAuthModalStore();

  // Load current settings when modal opens
  useEffect(() => {
    if (isOpen) {
      openModal();
      // Load current settings from window.settings
      if (window.settings) {
        // Load presets from window.settings
        if (window.settings && window.settings.presets) {
          setPresets(window.settings.presets);
        }
        
        const currentSettings = {
          channels: {
            adaptiveEmptyChannels: window.settings.adaptiveEmptyChannels ?? true,
            channelAnimation: window.settings.channelAnimation || 'none',
            animatedOnHover: window.settings.animatedOnHover ?? false,
            idleAnimationEnabled: window.settings.idleAnimationEnabled ?? false,
            idleAnimationTypes: window.settings.idleAnimationTypes || ['pulse', 'bounce', 'glow'],
            idleAnimationInterval: window.settings.idleAnimationInterval ?? 8,
            kenBurnsEnabled: window.settings.kenBurnsEnabled ?? false,
            kenBurnsMode: window.settings.kenBurnsMode || 'hover',
            kenBurnsHoverScale: window.settings.kenBurnsHoverScale ?? 1.1,
            kenBurnsAutoplayScale: window.settings.kenBurnsAutoplayScale ?? 1.15,
            kenBurnsSlideshowScale: window.settings.kenBurnsSlideshowScale ?? 1.08,
            kenBurnsHoverDuration: window.settings.kenBurnsHoverDuration ?? 8000,
            kenBurnsAutoplayDuration: window.settings.kenBurnsAutoplayDuration ?? 12000,
            kenBurnsSlideshowDuration: window.settings.kenBurnsSlideshowDuration ?? 10000,
            kenBurnsCrossfadeDuration: window.settings.kenBurnsCrossfadeDuration ?? 1000,
            kenBurnsForGifs: window.settings.kenBurnsForGifs ?? false,
            kenBurnsForVideos: window.settings.kenBurnsForVideos ?? false,
            kenBurnsEasing: window.settings.kenBurnsEasing || 'ease-out',
            kenBurnsAnimationType: window.settings.kenBurnsAnimationType || 'both',
            kenBurnsCrossfadeReturn: window.settings.kenBurnsCrossfadeReturn !== false,
            kenBurnsTransitionType: window.settings.kenBurnsTransitionType || 'cross-dissolve',
            channelAutoFadeTimeout: window.settings.channelAutoFadeTimeout ?? 5,
          },
          ribbon: {
            glassWiiRibbon: window.settings.glassWiiRibbon ?? false,
            glassOpacity: window.settings.glassOpacity ?? 0.18,
            glassBlur: window.settings.glassBlur ?? 2.5,
            glassBorderOpacity: window.settings.glassBorderOpacity ?? 0.5,
            glassShineOpacity: window.settings.glassShineOpacity ?? 0.7,
            ribbonColor: window.settings.ribbonColor ?? '#e0e6ef',
            recentRibbonColors: window.settings.recentRibbonColors ?? [],
            ribbonGlowColor: window.settings.ribbonGlowColor ?? '#0099ff',
            recentRibbonGlowColors: window.settings.recentRibbonGlowColors ?? [],
            ribbonGlowStrength: window.settings.ribbonGlowStrength ?? 20,
            ribbonGlowStrengthHover: window.settings.ribbonGlowStrengthHover ?? 28,
            ribbonDockOpacity: window.settings.ribbonDockOpacity ?? 1,
          },
          wallpaper: {
            wallpapers: window.settings.savedWallpapers ?? [],
            activeWallpaper: window.settings.wallpaper ?? null,
            likedWallpapers: window.settings.likedWallpapers ?? [],
            cycling: window.settings.cycleWallpapers ?? false,
            cycleInterval: window.settings.cycleInterval ?? 30,
            cycleAnimation: window.settings.cycleAnimation ?? 'fade',
            slideDirection: window.settings.slideDirection ?? 'right',
            crossfadeDuration: window.settings.crossfadeDuration ?? 1.2,
            crossfadeEasing: window.settings.crossfadeEasing ?? 'ease-out',
            slideRandomDirection: window.settings.slideRandomDirection ?? false,
            slideDuration: window.settings.slideDuration ?? 1.5,
            slideEasing: window.settings.slideEasing ?? 'ease-out',
            wallpaperOpacity: window.settings.wallpaperOpacity ?? 1,
            wallpaperBlur: window.settings.wallpaperBlur ?? 0,
            overlayEnabled: window.settings.overlayEnabled ?? false,
            overlayEffect: window.settings.overlayEffect ?? 'snow',
            overlayIntensity: window.settings.overlayIntensity ?? 50,
            overlaySpeed: window.settings.overlaySpeed ?? 1,
            overlayWind: window.settings.overlayWind ?? 0.02,
            overlayGravity: window.settings.overlayGravity ?? 0.1,
          },
          time: {
            timeColor: window.settings.timeColor ?? '#ffffff',
            recentTimeColors: window.settings.recentTimeColors ?? [],
            timeFormat24hr: window.settings.timeFormat24hr ?? true,
            enableTimePill: window.settings.enableTimePill ?? true,
            timePillBlur: window.settings.timePillBlur ?? 8,
            timePillOpacity: window.settings.timePillOpacity ?? 0.05,
            timeFont: window.settings.timeFont ?? 'default',
          },
          general: {
            immersivePip: window.settings.immersivePip ?? false,
            startInFullscreen: window.settings.startInFullscreen ?? false,
            showPresetsButton: window.settings.showPresetsButton ?? true,
            startOnBoot: window.settings.startOnBoot ?? false,
            settingsShortcut: window.settings.settingsShortcut || '',
          },
          sounds: {
            backgroundMusicEnabled: window.settings.backgroundMusicEnabled ?? true,
            backgroundMusicLooping: window.settings.backgroundMusicLooping ?? true,
            backgroundMusicPlaylistMode: window.settings.backgroundMusicPlaylistMode ?? false,
            channelClickEnabled: window.settings.channelClickEnabled ?? true,
            channelClickVolume: window.settings.channelClickVolume ?? 0.5,
            channelHoverEnabled: window.settings.channelHoverEnabled ?? true,
            channelHoverVolume: window.settings.channelHoverVolume ?? 0.5,
            startupEnabled: window.settings.startupEnabled ?? true,
            startupVolume: window.settings.startupVolume ?? 0.5,
          }
        };
        loadSettings(currentSettings);
        setLocalSettings(currentSettings);
      }
    } else {
      closeModal();
    }
  }, [isOpen, openModal, closeModal, loadSettings]);

  // Update local settings when store changes
  useEffect(() => {
    setLocalSettings(tabs);
  }, [tabs]);

  const handleSave = async (handleClose) => {
    try {
      const allSettings = getAllSettings();
      
      // Flatten the settings structure to match what handleSettingsChange expects
      const flattenedSettings = {
        // Channel settings
        channelAutoFadeTimeout: allSettings.channels.channelAutoFadeTimeout,
        animatedOnHover: allSettings.channels.animatedOnHover,
        idleAnimationEnabled: allSettings.channels.idleAnimationEnabled,
        idleAnimationTypes: allSettings.channels.idleAnimationTypes,
        idleAnimationInterval: allSettings.channels.idleAnimationInterval,
        kenBurnsEnabled: allSettings.channels.kenBurnsEnabled,
        kenBurnsMode: allSettings.channels.kenBurnsMode,
        kenBurnsHoverScale: allSettings.channels.kenBurnsHoverScale,
        kenBurnsAutoplayScale: allSettings.channels.kenBurnsAutoplayScale,
        kenBurnsSlideshowScale: allSettings.channels.kenBurnsSlideshowScale,
        kenBurnsHoverDuration: allSettings.channels.kenBurnsHoverDuration,
        kenBurnsAutoplayDuration: allSettings.channels.kenBurnsAutoplayDuration,
        kenBurnsSlideshowDuration: allSettings.channels.kenBurnsSlideshowDuration,
        kenBurnsCrossfadeDuration: allSettings.channels.kenBurnsCrossfadeDuration,
        kenBurnsForGifs: allSettings.channels.kenBurnsForGifs,
        kenBurnsForVideos: allSettings.channels.kenBurnsForVideos,
        kenBurnsEasing: allSettings.channels.kenBurnsEasing,
        kenBurnsAnimationType: allSettings.channels.kenBurnsAnimationType,
        kenBurnsCrossfadeReturn: allSettings.channels.kenBurnsCrossfadeReturn,
        kenBurnsTransitionType: allSettings.channels.kenBurnsTransitionType,
        
        // Ribbon settings
        glassWiiRibbon: allSettings.ribbon.glassWiiRibbon,
        glassOpacity: allSettings.ribbon.glassOpacity,
        glassBlur: allSettings.ribbon.glassBlur,
        glassBorderOpacity: allSettings.ribbon.glassBorderOpacity,
        glassShineOpacity: allSettings.ribbon.glassShineOpacity,
        ribbonColor: allSettings.ribbon.ribbonColor,
        recentRibbonColors: allSettings.ribbon.recentRibbonColors,
        ribbonGlowColor: allSettings.ribbon.ribbonGlowColor,
        recentRibbonGlowColors: allSettings.ribbon.recentRibbonGlowColors,
        ribbonGlowStrength: allSettings.ribbon.ribbonGlowStrength,
        ribbonGlowStrengthHover: allSettings.ribbon.ribbonGlowStrengthHover,
        ribbonDockOpacity: allSettings.ribbon.ribbonDockOpacity,
        
        // Wallpaper settings
        wallpaperOpacity: allSettings.wallpaper.wallpaperOpacity,
        wallpaperBlur: allSettings.wallpaper.wallpaperBlur,
        cycleWallpapers: allSettings.wallpaper.cycling,
        cycleInterval: allSettings.wallpaper.cycleInterval,
        cycleAnimation: allSettings.wallpaper.cycleAnimation,
        slideDirection: allSettings.wallpaper.slideDirection,
        crossfadeDuration: allSettings.wallpaper.crossfadeDuration,
        crossfadeEasing: allSettings.wallpaper.crossfadeEasing,
        slideRandomDirection: allSettings.wallpaper.slideRandomDirection,
        slideDuration: allSettings.wallpaper.slideDuration,
        slideEasing: allSettings.wallpaper.slideEasing,
        overlayEnabled: allSettings.wallpaper.overlayEnabled,
        overlayEffect: allSettings.wallpaper.overlayEffect,
        overlayIntensity: allSettings.wallpaper.overlayIntensity,
        overlaySpeed: allSettings.wallpaper.overlaySpeed,
        overlayWind: allSettings.wallpaper.overlayWind,
        overlayGravity: allSettings.wallpaper.overlayGravity,
        
        // Time settings
        timeColor: allSettings.time.timeColor,
        recentTimeColors: allSettings.time.recentTimeColors,
        timeFormat24hr: allSettings.time.timeFormat24hr,
        enableTimePill: allSettings.time.enableTimePill,
        timePillBlur: allSettings.time.timePillBlur,
        timePillOpacity: allSettings.time.timePillOpacity,
        timeFont: allSettings.time.timeFont,
        
        // General settings
        immersivePip: allSettings.general.immersivePip,
        startInFullscreen: allSettings.general.startInFullscreen,
        showPresetsButton: allSettings.general.showPresetsButton,
        startOnBoot: allSettings.general.startOnBoot,
        settingsShortcut: allSettings.general.settingsShortcut,
        
        // Sound settings
        backgroundMusicEnabled: allSettings.sounds.backgroundMusicEnabled,
        backgroundMusicLooping: allSettings.sounds.backgroundMusicLooping,
        backgroundMusicPlaylistMode: allSettings.sounds.backgroundMusicPlaylistMode,
        channelClickEnabled: allSettings.sounds.channelClickEnabled,
        channelClickVolume: allSettings.sounds.channelClickVolume,
        channelHoverEnabled: allSettings.sounds.channelHoverEnabled,
        channelHoverVolume: allSettings.sounds.channelHoverVolume,
        startupEnabled: allSettings.sounds.startupEnabled,
        startupVolume: allSettings.sounds.startupVolume,
        
        // Presets
        presets: presets,
      };
      
      // Call onSettingsChange to notify parent component
      if (onSettingsChange) {
        onSettingsChange(flattenedSettings);
      }
      
      setMessage({ type: 'success', text: 'Appearance settings saved successfully!' });
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings: ' + error.message });
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all appearance settings to default?')) {
      resetAllSettings();
      setMessage({ type: 'success', text: 'Settings reset to default!' });
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const updateLocalSetting = useCallback((tab, key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [key]: value
      }
    }));
    updateTabSettings(tab, { [key]: value });
  }, [updateTabSettings]);

  // Presets functions
  const getPresetsToExport = () => {
    if (selectedPresets.length > 0) {
      return presets.filter(p => selectedPresets.includes(p.name));
    }
    return presets;
  };

  // Drag and drop handlers for preset reordering
  const handleDragStart = (e, presetName) => {
    if (selectMode) return;
    setDraggingPreset(presetName);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  const handleDragOver = (e, presetName) => {
    if (!draggingPreset || selectMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(presetName);
  };

  const handleDragEnter = (e, presetName) => {
    if (!draggingPreset || selectMode) return;
    e.preventDefault();
    setDropTarget(presetName);
  };

  const handleDragLeave = (e) => {
    if (selectMode) return;
    e.preventDefault();
    setDropTarget(null);
  };

  const handleDrop = (e, targetPresetName) => {
    if (!draggingPreset || draggingPreset === targetPresetName || selectMode) {
      setDraggingPreset(null);
      setDropTarget(null);
      return;
    }
    
    e.preventDefault();
    
    const currentPresets = [...presets];
    const draggedIndex = currentPresets.findIndex(p => p.name === draggingPreset);
    const targetIndex = currentPresets.findIndex(p => p.name === targetPresetName);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedPreset] = currentPresets.splice(draggedIndex, 1);
      currentPresets.splice(targetIndex, 0, draggedPreset);
      setPresets(currentPresets);
    }
    
    setDraggingPreset(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDraggingPreset(null);
    setDropTarget(null);
  };

  // Export presets as JSON
  const handleExport = () => {
    const dataStr = JSON.stringify(presets, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wiidesktop-presets.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export presets as zip
  const handleExportZip = async (presetsToExport = null) => {
    const zip = new JSZip();
    const exportPresets = presetsToExport || getPresetsToExport();
    
    const allWallpapers = new Set();
    exportPresets.forEach(preset => {
      if (preset.data && preset.data.wallpaper && preset.data.wallpaper.url && preset.data.wallpaper.url.startsWith('userdata://wallpapers/')) {
        allWallpapers.add(preset.data.wallpaper.url);
      }
      if (preset.data && Array.isArray(preset.data.savedWallpapers)) {
        preset.data.savedWallpapers.forEach(wp => {
          if (wp.url && wp.url.startsWith('userdata://wallpapers/')) {
            allWallpapers.add(wp.url);
          }
        });
      }
    });
    
    zip.file('presets.json', JSON.stringify(exportPresets, null, 2));
    
    for (const url of allWallpapers) {
      const result = await window.api.wallpapers.getFile(url);
      if (result.success) {
        zip.file(`wallpapers/${result.filename}`, result.data, { base64: true });
      }
    }
    
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportPresets.length === 1 ? `wiidesktop-preset-${exportPresets[0].name}.zip` : 'wiidesktop-presets.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import presets from file
  const handleImportClick = () => {
    setImportError('');
    fileInputRef.current.value = '';
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    setImportError('');
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!Array.isArray(imported)) throw new Error('Invalid preset file format.');
        const map = {};
        imported.forEach(preset => {
          if (preset && preset.name && presets.some(p => p.name === preset.name)) {
            map[preset.name] = true;
          }
        });
        setOverwriteMap(map);
        setImportedPresets(imported);
        setShowImportPreview(true);
      } catch (err) {
        setImportError('Failed to import: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Import presets from zip
  const handleImportZip = async (file) => {
    setImportError('');
    try {
      const zip = await JSZip.loadAsync(file);
      const jsonFile = zip.file('presets.json');
      if (!jsonFile) throw new Error('No presets.json found in zip');
      const jsonStr = await jsonFile.async('string');
      const imported = JSON.parse(jsonStr);
      
      const wallpaperFiles = zip.folder('wallpapers');
      const urlMap = {};
      if (wallpaperFiles) {
        const files = Object.values(wallpaperFiles.files || {});
        for (const fileObj of files) {
          if (!fileObj.dir) {
            const data = await fileObj.async('base64');
            const filename = fileObj.name.split('/').pop();
            const saveResult = await window.api.wallpapers.saveFile({ filename, data });
            if (saveResult.success) {
              urlMap[`userdata://wallpapers/${filename}`] = saveResult.url;
            }
          }
        }
      }
      
      imported.forEach(preset => {
        if (preset.data && preset.data.wallpaper && urlMap[preset.data.wallpaper.url]) {
          preset.data.wallpaper.url = urlMap[preset.data.wallpaper.url];
        }
        if (preset.data && Array.isArray(preset.data.savedWallpapers)) {
          preset.data.savedWallpapers.forEach(wp => {
            if (urlMap[wp.url]) wp.url = urlMap[wp.url];
          });
        }
      });
      
      const map = {};
      imported.forEach(preset => {
        if (preset && preset.name && presets.some(p => p.name === preset.name)) {
          map[preset.name] = true;
        }
      });
      setOverwriteMap(map);
      setImportedPresets(imported);
      setShowImportPreview(true);
    } catch (err) {
      setImportError('Failed to import: ' + err.message);
    }
  };

  const handleToggleOverwrite = (name) => {
    setOverwriteMap(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Confirm import
  const handleConfirmImport = () => {
    if (importedPresets && Array.isArray(importedPresets)) {
      let updated = [...presets];
      importedPresets.forEach(preset => {
        if (preset && preset.name && preset.data) {
          const existsIdx = updated.findIndex(p => p.name === preset.name);
          if (existsIdx !== -1) {
            if (overwriteMap[preset.name]) {
              updated[existsIdx] = preset;
            }
          } else {
            updated.push(preset);
          }
        }
      });
      
      setPresets(updated.slice(0, 6));
      setShowImportPreview(false);
      setImportedPresets(null);
      setOverwriteMap({});
    }
  };

  const handleCancelImport = () => {
    setShowImportPreview(false);
    setImportedPresets(null);
    setOverwriteMap({});
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      setError('Please enter a name for the preset.');
      return;
    }
    if (presets.some(p => p.name === newPresetName.trim())) {
      setError('A preset with this name already exists.');
      return;
    }
    
    // Create preset data from current settings
    const presetData = {
      channels: localSettings.channels || {},
      ribbon: localSettings.ribbon || {},
      wallpaper: localSettings.wallpaper || {},
      time: localSettings.time || {},
      general: localSettings.general || {},
      sounds: localSettings.sounds || {}
    };
    
    setPresets(prev => [...prev, { name: newPresetName.trim(), data: presetData }].slice(0, 6));
    setNewPresetName('');
    setError('');
  };

  const handleUpdate = (name) => {
    const presetIndex = presets.findIndex(p => p.name === name);
    if (presetIndex !== -1) {
      const presetData = {
        channels: localSettings.channels || {},
        ribbon: localSettings.ribbon || {},
        wallpaper: localSettings.wallpaper || {},
        time: localSettings.time || {},
        general: localSettings.general || {},
        sounds: localSettings.sounds || {}
      };
      
      setPresets(prev => prev.map((p, idx) => 
        idx === presetIndex ? { ...p, data: presetData } : p
      ));
    }
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

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      setEditError('Please enter a name for the preset.');
      return;
    }
    if (presets.some(p => p.name === editName.trim() && p.name !== editingPreset)) {
      setEditError('A preset with this name already exists.');
      return;
    }
    
    setPresets(prev => prev.map(p => p.name === editingPreset ? { ...p, name: editName.trim() } : p));
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

  const handleApplyPreset = (preset) => {
    if (preset.data) {
      // Apply preset data to local settings
      Object.keys(preset.data).forEach(tab => {
        if (preset.data[tab]) {
          setLocalSettings(prev => ({
            ...prev,
            [tab]: { ...prev[tab], ...preset.data[tab] }
          }));
          updateTabSettings(tab, preset.data[tab]);
        }
      });
    }
  };

  const handleDeletePreset = (name) => {
    const confirmMessage = `Are you sure you want to delete the preset "${name}"?\n\nThis action cannot be undone.`;
    if (window.confirm(confirmMessage)) {
      setPresets(prev => prev.filter(p => p.name !== name));
    }
  };

  const handleToggleSelectPreset = (name) => {
    setSelectedPresets(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const handleSelectAll = () => {
    setSelectedPresets(presets.map(p => p.name));
  };

  const handleDeselectAll = () => {
    setSelectedPresets([]);
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

  const handleImportCommunityPreset = (presetData) => {
    if (Array.isArray(presetData)) {
      setPresets(prev => {
        const existingNames = prev.map(p => p.name);
        const uniqueNewPresets = presetData.filter(p => !existingNames.includes(p.name));
        return [...prev, ...uniqueNewPresets].slice(0, 6);
      });
    } else if (presetData && typeof presetData === 'object') {
      setPresets(prev => {
        const exists = prev.some(p => p.name === presetData.name);
        if (!exists) {
          return [...prev, presetData].slice(0, 6);
        }
        return prev;
      });
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

      const presetData = {
        name: uploadFormData.name,
        data: {
          ...uploadFormData.selectedPreset.data
        }
      };

      const uploadData = {
        ...uploadFormData
      };
      
      const result = await uploadPreset(presetData, uploadData);
      
      if (result.success) {
        setUploadMessage({ type: 'success', text: 'Preset uploaded successfully!' });
        setTimeout(() => {
          setShowUploadForm(false);
          setUploadFormData({ 
            name: '', 
            description: '', 
            creator_name: '', 
            custom_image: null,
            selectedPreset: null
          });
          setUploadMessage({ type: '', text: '' });
        }, 1500);
      } else {
        setUploadMessage({ type: 'error', text: `Failed to upload: ${result.error}` });
      }
    } catch (error) {
      setUploadMessage({ type: 'error', text: `Upload failed: ${error.message}` });
    } finally {
      setUploading(false);
    }
  };

  const handleUploadInputChange = (field, value) => {
    setUploadFormData(prev => ({ ...prev, [field]: value }));
    if (uploadMessage.text) setUploadMessage({ type: '', text: '' });
  };

  // Account management functions
  useEffect(() => {
    // Check current auth state
    const checkAuthState = async () => {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      setIsAnonymous(!user);
    };

    checkAuthState();
    
    // Subscribe to auth changes
    const unsubscribe = authService.subscribe((user, anonymous) => {
      setCurrentUser(user);
      setIsAnonymous(anonymous);
    });

    return unsubscribe;
  }, []);

  const handleSignIn = () => {
    openAuthModal('signin');
  };

  const handleSignUp = () => {
    openAuthModal('signup');
  };

  const handleSignOut = async () => {
    const { error } = await authService.signOut();
  };

  const renderChannelsTab = () => (
    <ChannelsSettingsTab 
      localSettings={localSettings} 
      updateLocalSetting={updateLocalSetting} 
    />
  );

  const renderRibbonTab = () => (
    <RibbonSettingsTab 
      localSettings={localSettings} 
      updateLocalSetting={updateLocalSetting} 
    />
  );

  const renderWallpaperTab = () => (
    <WallpaperSettingsTab 
      localSettings={localSettings} 
      updateLocalSetting={updateLocalSetting}
    />
  );

  const renderGeneralTab = () => (
    <GeneralSettingsTab 
      localSettings={localSettings} 
      updateLocalSetting={updateLocalSetting}
      isAnonymous={isAnonymous}
      currentUser={currentUser}
      handleSignUp={handleSignUp}
      handleSignIn={handleSignIn}
      handleSignOut={handleSignOut}
    />
  );

  const renderTimeTab = () => (
    <TimeSettingsTab 
      localSettings={localSettings} 
      updateLocalSetting={updateLocalSetting}
    />
  );

  const renderSoundsTab = () => (
    <SoundsSettingsTab 
      localSettings={localSettings} 
      updateLocalSetting={updateLocalSetting}
    />
  );

  const renderDockTab = () => (
    <DockSettingsTab />
  );

  const renderThemesTab = () => (
    <ThemesSettingsTab 
      localSettings={localSettings} 
      updateLocalSetting={updateLocalSetting}
      presets={presets}
      setPresets={setPresets}
      newPresetName={newPresetName}
      setNewPresetName={setNewPresetName}
      error={error}
      setError={setError}
      importedPresets={importedPresets}
      setImportedPresets={setImportedPresets}
      importError={importError}
      setImportError={setImportError}
      showImportPreview={showImportPreview}
      setShowImportPreview={setShowImportPreview}
      overwriteMap={overwriteMap}
      setOverwriteMap={setOverwriteMap}
      draggingPreset={draggingPreset}
      setDraggingPreset={setDraggingPreset}
      dropTarget={dropTarget}
      setDropTarget={setDropTarget}
      selectedPresets={selectedPresets}
      setSelectedPresets={setSelectedPresets}
      selectMode={selectMode}
      setSelectMode={setSelectMode}
      editingPreset={editingPreset}
      setEditingPreset={setEditingPreset}
      editName={editName}
      setEditName={setEditName}
      justUpdated={justUpdated}
      setJustUpdated={setJustUpdated}
      showCommunitySection={showCommunitySection}
      toggleCommunitySection={toggleCommunitySection}
      showUploadForm={showUploadForm}
      setShowUploadForm={setShowUploadForm}
      uploading={uploading}
      setUploading={setUploading}
      uploadMessage={uploadMessage}
      setUploadMessage={setUploadMessage}
      uploadFormData={uploadFormData}
      setUploadFormData={setUploadFormData}
      handleSavePreset={handleSavePreset}
      handleUpdate={handleUpdate}
      handleStartEdit={handleStartEdit}
      handleCancelEdit={handleCancelEdit}
      handleSaveEdit={handleSaveEdit}
      handleKeyPress={handleKeyPress}
      handleApplyPreset={handleApplyPreset}
      handleDeletePreset={handleDeletePreset}
      handleToggleSelectPreset={handleToggleSelectPreset}
      handleDragStart={handleDragStart}
      handleDragOver={handleDragOver}
      handleDragEnter={handleDragEnter}
      handleDragLeave={handleDragLeave}
      handleDrop={handleDrop}
      handleDragEnd={handleDragEnd}
      handleToggleOverwrite={handleToggleOverwrite}
      handleConfirmImport={handleConfirmImport}
      handleCancelImport={handleCancelImport}
      handleImportCommunityPreset={handleImportCommunityPreset}
      handleUpload={handleUpload}
      handleUploadInputChange={handleUploadInputChange}
    />
  );

  const renderMonitorTab = () => (
    <MonitorSettingsTab setShowMonitorModal={setShowMonitorModal} />
  );

  const renderAdvancedTab = () => (
    <AdvancedSettingsTab />
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'channels':
        return renderChannelsTab();
      case 'ribbon':
        return renderRibbonTab();
      case 'wallpaper':
        return renderWallpaperTab();
      case 'time':
        return renderTimeTab();
      case 'general':
        return renderGeneralTab();
      case 'sounds':
        return renderSoundsTab();
      case 'dock':
        return renderDockTab();
      case 'themes':
        return renderThemesTab();
      case 'monitor':
        return renderMonitorTab();
      case 'advanced':
        return renderAdvancedTab();
      default:
        return renderChannelsTab();
    }
  };

  if (!modalIsOpen) return null;

  return (
    <BaseModal
      title="Settings"
      onClose={onClose}
      maxWidth="1000px"
      maxHeight="85vh"
      footerContent={({ handleClose }) => (
        <div style={{ display: 'flex', gap: 10,justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            className="reset-button" 
            onClick={handleReset}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '2px solid hsl(var(--wii-blue))',
              background: 'transparent',
              color: 'hsl(var(--wii-blue))',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'hsl(var(--wii-blue))';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = 'hsl(var(--wii-blue))';
            }}
          >
            Reset to Default
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button variant="primary" onClick={() => handleSave(handleClose)}>Save</Button>
          </div>
        </div>
      )}
    >
      {message.text && (
        <div className={`message ${message.type}`} style={{ marginBottom: 10, fontWeight: 500 }}>
          {message.text}
        </div>
      )}

      {/* Sidebar Navigation */}
      <div style={{ 
        display: 'flex', 
        height: 'calc(85vh - 200px)', // Account for header, footer, and padding
        border: '1px solid hsl(var(--border-primary))',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {/* Sidebar */}
        <div style={{
          width: '220px',
          background: 'hsl(var(--surface-secondary))',
          borderRight: '1px solid hsl(var(--border-primary))',
          overflowY: 'auto',
          flexShrink: 0
        }}>
          {SIDEBAR_SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => handleTabChange(section.id)}
              style={{
                width: '100%',
                padding: '16px 20px',
                border: 'none',
                background: activeTab === section.id ? section.color : 'transparent',
                color: activeTab === section.id ? 'white' : 'hsl(var(--text-secondary))',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === section.id ? '600' : '500',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'left',
                borderBottom: '1px solid hsl(var(--border-primary))'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== section.id) {
                  e.target.style.background = 'hsl(var(--surface-tertiary))';
                  e.target.style.color = section.color;
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== section.id) {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'hsl(var(--text-secondary))';
                }
              }}
            >
              <span style={{ fontSize: '18px' }}>{section.icon}</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: '600' }}>{section.label}</span>
                <span style={{ 
                  fontSize: '11px', 
                  opacity: 0.7,
                  marginTop: '2px'
                }}>
                  {section.description}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{
          flex: 1,
          padding: '20px',
          paddingBottom: '90px',
          overflowY: 'auto',
          background: 'hsl(var(--surface-primary))',
          minHeight: 0 // Important for flex child scrolling
        }}>
          {renderTabContent()}
        </div>
      </div>

      {/* Monitor Selection Modal */}
      <MonitorSelectionModal
        isOpen={showMonitorModal}
        onClose={() => setShowMonitorModal(false)}
      />

    </BaseModal>
  );
}

AppearanceSettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSettingsChange: PropTypes.func,
};

export default AppearanceSettingsModal; 