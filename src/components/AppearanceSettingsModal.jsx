import React, { useState, useEffect, useRef } from 'react';
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
  
  // Auth modal store
  const { openModal: openAuthModal } = useAuthModalStore();

  // Load current settings when modal opens
  useEffect(() => {
    if (isOpen) {
      openModal();
      // Load current settings from window.settings
      if (window.settings) {
        console.log('Loading settings from window.settings:', window.settings);
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
        
        // Load presets from window.settings
        if (window.settings && window.settings.presets) {
          setPresets(window.settings.presets);
        }
        
        console.log('Loaded settings into modal:', currentSettings);
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
        console.log('Saving settings from modal:', flattenedSettings);
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

  const updateLocalSetting = (tab, key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [key]: value
      }
    }));
    updateTabSettings(tab, { [key]: value });
  };

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
    console.log('[SETTINGS] Sign In button clicked');
    openAuthModal('signin');
    console.log('[SETTINGS] Auth modal should now be open');
  };

  const handleSignUp = () => {
    console.log('[SETTINGS] Sign Up button clicked');
    openAuthModal('signup');
    console.log('[SETTINGS] Auth modal should now be open');
  };

  const handleSignOut = async () => {
    const { error } = await authService.signOut();
    if (error) {
      console.error('Sign out error:', error);
    }
  };

  const renderChannelsTab = () => (
    <div>
      {/* Only play channel animations on hover */}
      <Card
        title="Only play channel animations on hover"
        separator
        desc="When enabled, animated channel art (GIFs/MP4s) will only play when you hover over a channel. When disabled, animations will play automatically."
        headerActions={
          <Toggle
            checked={localSettings.channels?.animatedOnHover ?? false}
            onChange={(checked) => updateLocalSetting('channels', 'animatedOnHover', checked)}
          />
        }
      />

      {/* Idle Channel Animations */}
      <Card
        title="Idle Channel Animations"
        separator
        desc="When enabled, channels will play subtle animations when not being interacted with, adding life to the interface."
        headerActions={
          <Toggle
            checked={localSettings.channels?.idleAnimationEnabled ?? false}
            onChange={(checked) => updateLocalSetting('channels', 'idleAnimationEnabled', checked)}
          />
        }
        style={{ marginBottom: '20px' }}
        actions={
          localSettings.channels?.idleAnimationEnabled && (
            <>
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>Animation Types:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['pulse', 'bounce', 'glow', 'heartbeat', 'shake', 'wiggle'].map(type => (
                    <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={localSettings.channels?.idleAnimationTypes?.includes(type) ?? false}
                        onChange={() => {
                          const currentTypes = localSettings.channels?.idleAnimationTypes || [];
                          const newTypes = currentTypes.includes(type)
                            ? currentTypes.filter(t => t !== type)
                            : [...currentTypes, type];
                          updateLocalSetting('channels', 'idleAnimationTypes', newTypes);
                        }}
                        style={{ width: 16, height: 16 }}
                      />
                      <span style={{ fontSize: 14, textTransform: 'capitalize' }}>{type}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>Animation Interval: {localSettings.channels?.idleAnimationInterval ?? 8} seconds</div>
                <input
                  type="range"
                  min={2}
                  max={20}
                  value={localSettings.channels?.idleAnimationInterval ?? 8}
                  onChange={e => updateLocalSetting('channels', 'idleAnimationInterval', Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </>
          )
        }
      />

      {/* Ken Burns Effect */}
      <Card
        title="Ken Burns Effect"
        separator
        desc="Add cinematic zoom and pan effects to channel images, creating dynamic visual interest."
        headerActions={
          <Toggle
            checked={localSettings.channels?.kenBurnsEnabled ?? false}
            onChange={(checked) => updateLocalSetting('channels', 'kenBurnsEnabled', checked)}
          />
        }
        style={{ marginBottom: '20px' }}
        actions={
          localSettings.channels?.kenBurnsEnabled && (
            <>
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>Trigger Mode:</div>
                <select
                  value={localSettings.channels?.kenBurnsMode || 'hover'}
                  onChange={e => updateLocalSetting('channels', 'kenBurnsMode', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid hsl(var(--border-primary))', fontSize: 14, background: 'hsl(var(--surface-primary))', color: 'hsl(var(--text-primary))' }}
                >
                  <option value="hover">On Hover</option>
                  <option value="autoplay">Autoplay</option>
                  <option value="slideshow">Slideshow</option>
                </select>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>Scale Settings:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'hsl(var(--text-secondary))' }}>Hover Scale: {localSettings.channels?.kenBurnsHoverScale ?? 1.1}</label>
                    <input
                      type="range"
                      min={1.0}
                      max={1.5}
                      step={0.05}
                      value={localSettings.channels?.kenBurnsHoverScale ?? 1.1}
                      onChange={e => updateLocalSetting('channels', 'kenBurnsHoverScale', Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'hsl(var(--text-secondary))' }}>Autoplay Scale: {localSettings.channels?.kenBurnsAutoplayScale ?? 1.15}</label>
                    <input
                      type="range"
                      min={1.0}
                      max={1.5}
                      step={0.05}
                      value={localSettings.channels?.kenBurnsAutoplayScale ?? 1.15}
                      onChange={e => updateLocalSetting('channels', 'kenBurnsAutoplayScale', Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>Duration Settings:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'hsl(var(--text-secondary))' }}>Hover Duration: {localSettings.channels?.kenBurnsHoverDuration ?? 8000}ms</label>
                    <input
                      type="range"
                      min={2000}
                      max={15000}
                      step={500}
                      value={localSettings.channels?.kenBurnsHoverDuration ?? 8000}
                      onChange={e => updateLocalSetting('channels', 'kenBurnsHoverDuration', Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'hsl(var(--text-secondary))' }}>Autoplay Duration: {localSettings.channels?.kenBurnsAutoplayDuration ?? 12000}ms</label>
                    <input
                      type="range"
                      min={5000}
                      max={20000}
                      step={500}
                      value={localSettings.channels?.kenBurnsAutoplayDuration ?? 12000}
                      onChange={e => updateLocalSetting('channels', 'kenBurnsAutoplayDuration', Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>Advanced Settings:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'hsl(var(--text-secondary))' }}>Crossfade Duration: {localSettings.channels?.kenBurnsCrossfadeDuration ?? 1000}ms</label>
                    <input
                      type="range"
                      min={500}
                      max={3000}
                      step={100}
                      value={localSettings.channels?.kenBurnsCrossfadeDuration ?? 1000}
                      onChange={e => updateLocalSetting('channels', 'kenBurnsCrossfadeDuration', Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'hsl(var(--text-secondary))' }}>Easing:</label>
                    <select
                      value={localSettings.channels?.kenBurnsEasing || 'ease-out'}
                      onChange={e => updateLocalSetting('channels', 'kenBurnsEasing', e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid hsl(var(--border-primary))', fontSize: 12, background: 'hsl(var(--surface-primary))', color: 'hsl(var(--text-primary))' }}
                    >
                      <option value="ease-out">Ease Out</option>
                      <option value="ease-in">Ease In</option>
                      <option value="ease-in-out">Ease In-Out</option>
                      <option value="linear">Linear</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )
        }
      />

      {/* Channel Auto-Fade */}
      <Card
        title="Channel Auto-Fade"
        separator
        desc="Automatically lower the opacity of channel items when they haven't been hovered over for a while, allowing the wallpaper to shine through. Hovering over any channel will restore full opacity."
        headerActions={
          <Toggle
            checked={(localSettings.channels?.channelAutoFadeTimeout ?? 0) > 0}
            onChange={(checked) => updateLocalSetting('channels', 'channelAutoFadeTimeout', checked ? 5 : 0)}
          />
        }
        style={{ marginBottom: '20px' }}
        actions={
          (localSettings.channels?.channelAutoFadeTimeout ?? 0) > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Fade Timeout: {localSettings.channels?.channelAutoFadeTimeout ?? 5}s</div>
              <input
                type="range"
                min={1}
                max={30}
                step={1}
                value={localSettings.channels?.channelAutoFadeTimeout ?? 5}
                onChange={e => updateLocalSetting('channels', 'channelAutoFadeTimeout', Number(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: 13, color: 'hsl(var(--text-secondary))', marginTop: 8 }}>
                <strong>Fade Timeout:</strong> The time in seconds before channels start to fade out when not hovered.
              </div>
            </div>
          )
        }
      />
    </div>
  );

  const renderRibbonTab = () => (
    <div>
      {/* Ribbon Styles */}
      <Card
        title="Ribbon Styles"
        separator
        desc="Customize the appearance of the Wii Ribbon including colors and glow effects."
        actions={
          <>
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <label style={{ fontWeight: 500, minWidth: 120 }}>Ribbon Color</label>
                <input
                  type="color"
                  value={localSettings.ribbon?.ribbonColor ?? '#e0e6ef'}
                  onChange={e => updateLocalSetting('ribbon', 'ribbonColor', e.target.value)}
                  style={{
                    width: 50,
                    height: 40,
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                />
                <Text variant="small" style={{ color: 'hsl(var(--text-secondary))' }}>
                  {(localSettings.ribbon?.ribbonColor ?? '#e0e6ef').toUpperCase()}
                </Text>
              </div>
              {(localSettings.ribbon?.recentRibbonColors ?? []).length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
                  <Text variant="caption" style={{ marginRight: 2 }}>Previous:</Text>
                  {(localSettings.ribbon?.recentRibbonColors ?? []).map((color, idx) => (
                    <button
                      key={color}
                      onClick={() => updateLocalSetting('ribbon', 'ribbonColor', color)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: color === (localSettings.ribbon?.ribbonColor ?? '#e0e6ef') ? '2px solid hsl(var(--wii-blue))' : '1.5px solid hsl(var(--border-secondary))',
                        background: color,
                        cursor: 'pointer',
                        outline: 'none',
                        marginLeft: idx === 0 ? 0 : 2
                      }}
                      title={color}
                    />
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <label style={{ fontWeight: 500, minWidth: 120 }}>Ribbon Glow Color</label>
                <input
                  type="color"
                  value={localSettings.ribbon?.ribbonGlowColor ?? '#0099ff'}
                  onChange={e => updateLocalSetting('ribbon', 'ribbonGlowColor', e.target.value)}
                  style={{
                    width: 50,
                    height: 40,
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                />
                <Text variant="small" style={{ color: 'hsl(var(--text-secondary))' }}>
                  {(localSettings.ribbon?.ribbonGlowColor ?? '#0099ff').toUpperCase()}
                </Text>
              </div>
              {(localSettings.ribbon?.recentRibbonGlowColors ?? []).length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
                  <Text variant="caption" style={{ marginRight: 2 }}>Previous:</Text>
                  {(localSettings.ribbon?.recentRibbonGlowColors ?? []).map((color, idx) => (
                    <button
                      key={color}
                      onClick={() => updateLocalSetting('ribbon', 'ribbonGlowColor', color)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: color === (localSettings.ribbon?.ribbonGlowColor ?? '#0099ff') ? '2px solid hsl(var(--wii-blue))' : '1.5px solid hsl(var(--border-secondary))',
                        background: color,
                        cursor: 'pointer',
                        outline: 'none',
                        marginLeft: idx === 0 ? 0 : 2
                      }}
                      title={color}
                    />
                  ))}
                </div>
              )}
              <Slider
                label="Glow Strength"
                value={localSettings.ribbon?.ribbonGlowStrength ?? 20}
                min={0}
                max={64}
                step={1}
                onChange={e => updateLocalSetting('ribbon', 'ribbonGlowStrength', Number(e.target.value))}
              />
              <Slider
                label="Glow Strength on Hover"
                value={localSettings.ribbon?.ribbonGlowStrengthHover ?? 28}
                min={0}
                max={96}
                step={1}
                onChange={e => updateLocalSetting('ribbon', 'ribbonGlowStrengthHover', Number(e.target.value))}
              />
              {!localSettings.ribbon?.glassWiiRibbon && (
                <Slider
                  label="Dock Transparency"
                  value={localSettings.ribbon?.ribbonDockOpacity ?? 1}
                  min={0.1}
                  max={1}
                  step={0.01}
                  onChange={e => updateLocalSetting('ribbon', 'ribbonDockOpacity', Number(e.target.value))}
                />
              )}
            </div>
          </>
        }
      />

      {/* Glass Effect */}
      <Card
        title="Glass Effect"
        separator
        desc="Add a frosted glass effect to the Wii Ribbon for a more modern look."
        headerActions={
          <Toggle
            checked={localSettings.ribbon?.glassWiiRibbon ?? false}
            onChange={(checked) => updateLocalSetting('ribbon', 'glassWiiRibbon', checked)}
          />
        }
        actions={
          localSettings.ribbon?.glassWiiRibbon && (
            <>
              <Slider
                label="Background Opacity"
                value={localSettings.ribbon?.glassOpacity ?? 0.18}
                min={0.05}
                max={0.4}
                step={0.01}
                onChange={e => updateLocalSetting('ribbon', 'glassOpacity', Number(e.target.value))}
              />
              <Slider
                label="Backdrop Blur"
                value={localSettings.ribbon?.glassBlur ?? 2.5}
                min={0}
                max={8}
                step={0.1}
                onChange={e => updateLocalSetting('ribbon', 'glassBlur', Number(e.target.value))}
              />
              <Slider
                label="Border Opacity"
                value={localSettings.ribbon?.glassBorderOpacity ?? 0.5}
                min={0}
                max={1}
                step={0.05}
                onChange={e => updateLocalSetting('ribbon', 'glassBorderOpacity', Number(e.target.value))}
              />
              <Slider
                label="Shine Effect"
                value={localSettings.ribbon?.glassShineOpacity ?? 0.7}
                min={0}
                max={1}
                step={0.05}
                onChange={e => updateLocalSetting('ribbon', 'glassShineOpacity', Number(e.target.value))}
              />
            </>
          )
        }
      />
    </div>
  );

  const renderWallpaperTab = () => (
    <div>
      {/* Wallpaper Effects */}
      <Card
        title="Wallpaper Effects"
        separator
        desc="Adjust the transparency and blur of the wallpaper background."
        actions={
          <>
            <div style={{ fontSize: 14, color: 'hsl(var(--text-secondary))', marginTop: 0 }}>
              <strong>Wallpaper Opacity:</strong> Adjust the transparency of the wallpaper background.
            </div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 16 }}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={localSettings.wallpaper?.wallpaperOpacity ?? 1}
                onChange={e => updateLocalSetting('wallpaper', 'wallpaperOpacity', Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <Text variant="small" style={{ minWidth: 38, fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>{Math.round((localSettings.wallpaper?.wallpaperOpacity ?? 1) * 100)}%</Text>
            </div>
            <Text variant="help" style={{ marginTop: 2 }}>Higher transparency makes the wallpaper more see-through. 0% = fully visible, 100% = fully transparent.</Text>
            
            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
              <input
                type="range"
                min="0"
                max="24"
                step="0.5"
                value={localSettings.wallpaper?.wallpaperBlur ?? 0}
                onChange={e => updateLocalSetting('wallpaper', 'wallpaperBlur', Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <Text variant="small" style={{ minWidth: 38, fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>{localSettings.wallpaper?.wallpaperBlur ?? 0}px</Text>
            </div>
            <Text variant="help" style={{ marginTop: 2 }}>Higher blur makes the wallpaper more blurry. 0px = no blur, 24px = very blurry.</Text>
          </>
        }
      />

      {/* Wallpaper Cycling */}
      <Card
        title="Enable Wallpaper Cycling"
        separator
        desc="When enabled, your wallpapers will automatically cycle through your liked wallpapers at the interval you set below."
        headerActions={
          <Toggle
            checked={localSettings.wallpaper?.cycling ?? false}
            onChange={(checked) => updateLocalSetting('wallpaper', 'cycling', checked)}
          />
        }
        actions={
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 16 }}>
              <span style={{ fontWeight: 500, minWidth: 120 }}>Time per wallpaper</span>
              <input
                type="number"
                min={2}
                max={600}
                value={localSettings.wallpaper?.cycleInterval ?? 30}
                onChange={e => updateLocalSetting('wallpaper', 'cycleInterval', Number(e.target.value))}
                style={{ width: 70, fontSize: 15, padding: '4px 8px', borderRadius: 6, border: '1px solid hsl(var(--border-primary))', marginRight: 8, background: 'hsl(var(--surface-primary))', color: 'hsl(var(--text-primary))' }}
              />
              <Text variant="small" style={{ color: 'hsl(var(--text-secondary))' }}>seconds</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
              <span style={{ fontWeight: 500, minWidth: 120 }}>Animation</span>
              <select
                value={localSettings.wallpaper?.cycleAnimation ?? 'fade'}
                onChange={e => updateLocalSetting('wallpaper', 'cycleAnimation', e.target.value)}
                style={{ fontSize: 15, padding: '4px 10px', borderRadius: 6, border: '1px solid hsl(var(--border-primary))', background: 'hsl(var(--surface-primary))', color: 'hsl(var(--text-primary))' }}
              >
                <option value="fade">Fade - Smooth crossfade between wallpapers</option>
                <option value="slide">Slide - Slide one wallpaper out while sliding the next in</option>
                <option value="zoom">Zoom - Zoom out current wallpaper while zooming in the next</option>
                <option value="ken-burns">Ken Burns - Classic documentary-style pan and zoom effect</option>
                <option value="dissolve">Dissolve - Pixel-based dissolve transition</option>
                <option value="wipe">Wipe - Clean wipe transition in the selected direction</option>
              </select>
            </div>
          </>
        }
      />

      {/* Wallpaper Overlay Effects */}
      <Card
        title="Wallpaper Overlay Effects"
        separator
        desc="Add beautiful animated overlay effects to your wallpaper, like snow, rain, leaves, fireflies, or dust particles."
        headerActions={
          <Toggle
            checked={localSettings.wallpaper?.overlayEnabled ?? false}
            onChange={(checked) => updateLocalSetting('wallpaper', 'overlayEnabled', checked)}
          />
        }
        actions={
          localSettings.wallpaper?.overlayEnabled && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
                <span style={{ fontWeight: 500, minWidth: 120 }}>Effect Type</span>
                <select
                  value={localSettings.wallpaper?.overlayEffect ?? 'snow'}
                  onChange={e => updateLocalSetting('wallpaper', 'overlayEffect', e.target.value)}
                  style={{ fontSize: 15, padding: '4px 10px', borderRadius: 6, border: '1px solid hsl(var(--border-primary))', background: 'hsl(var(--surface-primary))', color: 'hsl(var(--text-primary))' }}
                >
                  <option value="snow">❄️ Snow</option>
                  <option value="rain">🌧️ Rain</option>
                  <option value="leaves">🍃 Leaves</option>
                  <option value="fireflies">✨ Fireflies</option>
                  <option value="dust">💨 Dust</option>
                  <option value="fire">🔥 Fire</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
                <span style={{ fontWeight: 500, minWidth: 120 }}>Intensity</span>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={localSettings.wallpaper?.overlayIntensity ?? 50}
                  onChange={e => updateLocalSetting('wallpaper', 'overlayIntensity', Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ minWidth: 40, fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>{localSettings.wallpaper?.overlayIntensity ?? 50}%</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14 }}>
                <span style={{ fontWeight: 500, minWidth: 120 }}>Speed</span>
                <input
                  type="range"
                  min={0.1}
                  max={3}
                  step={0.05}
                  value={localSettings.wallpaper?.overlaySpeed ?? 1}
                  onChange={e => updateLocalSetting('wallpaper', 'overlaySpeed', Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ minWidth: 40, fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>{localSettings.wallpaper?.overlaySpeed ?? 1}x</span>
              </div>
            </>
          )
        }
      />
    </div>
  );

  const renderGeneralTab = () => (
    <div>
      {/* Immersive PiP */}
      <Card
        title="Immersive Picture in Picture mode"
        separator
        desc="When enabled, video overlays will use immersive PiP mode for a more cinematic experience."
        headerActions={
          <Toggle
            checked={localSettings.general?.immersivePip ?? false}
            onChange={(checked) => updateLocalSetting('general', 'immersivePip', checked)}
          />
        }
        style={{ marginBottom: '20px' }}
      />

      {/* Start in Fullscreen */}
      <Card
        title="Start in Fullscreen"
        separator
        desc="When enabled, the app will start in fullscreen mode. When disabled, it will start in windowed mode."
        headerActions={
          <Toggle
            checked={localSettings.general?.startInFullscreen ?? false}
            onChange={(checked) => updateLocalSetting('general', 'startInFullscreen', checked)}
          />
        }
        style={{ marginBottom: '20px' }}
      />

      {/* Show Presets Button */}
      <Card
        title="Show Presets Button"
        separator
        desc="When enabled, shows a presets button near the time display that allows quick access to saved appearance presets. Right-click the button to customize its icon."
        headerActions={
          <Toggle
            checked={localSettings.general?.showPresetsButton ?? true}
            onChange={(checked) => updateLocalSetting('general', 'showPresetsButton', checked)}
          />
        }
        style={{ marginBottom: '20px' }}
      />

      {/* Launch on Startup */}
      <Card
        title="Launch app when my computer starts"
        separator
        desc="When enabled, the app will launch automatically when your computer starts."
        headerActions={
          <Toggle
            checked={localSettings.general?.startOnBoot ?? false}
            onChange={(checked) => updateLocalSetting('general', 'startOnBoot', checked)}
          />
        }
        style={{ marginBottom: '20px' }}
      />

      {/* Keyboard Shortcut */}
      <Card
        title="Keyboard Shortcut"
        separator
        desc="Set a keyboard shortcut to quickly open the settings modal. Press the keys you want to use for the shortcut."
        actions={
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <label style={{ fontWeight: 500, minWidth: 120 }}>Shortcut</label>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                padding: '8px 12px',
                border: '1px solid hsl(var(--border-primary))',
                borderRadius: '6px',
                background: 'hsl(var(--surface-primary))',
                minWidth: '200px',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              onClick={() => {
                // Start listening for key combination
                const handleKeyDown = (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const keys = [];
                  if (e.ctrlKey) keys.push('Ctrl');
                  if (e.shiftKey) keys.push('Shift');
                  if (e.altKey) keys.push('Alt');
                  if (e.metaKey) keys.push('Cmd');
                  
                  // Add the main key (avoid modifier keys)
                  if (e.key && e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt' && e.key !== 'Meta') {
                    keys.push(e.key.toUpperCase());
                  }
                  
                  if (keys.length > 0) {
                    const shortcut = keys.join(' + ');
                    updateLocalSetting('general', 'settingsShortcut', shortcut);
                    document.removeEventListener('keydown', handleKeyDown);
                    document.removeEventListener('click', handleClickOutside);
                  }
                };
                
                const handleClickOutside = () => {
                  document.removeEventListener('keydown', handleKeyDown);
                  document.removeEventListener('click', handleClickOutside);
                };
                
                document.addEventListener('keydown', handleKeyDown);
                document.addEventListener('click', handleClickOutside);
                
                // Show visual feedback
                const shortcutElement = document.querySelector('[data-shortcut-input]');
                if (shortcutElement) {
                  shortcutElement.style.background = 'hsl(var(--surface-tertiary))';
                  shortcutElement.textContent = 'Press keys...';
                }
              }}
              data-shortcut-input
              >
                {localSettings.general?.settingsShortcut || 'Click to set shortcut'}
              </div>
              <Button 
                variant="secondary" 
                onClick={() => updateLocalSetting('general', 'settingsShortcut', '')}
                disabled={!localSettings.general?.settingsShortcut}
              >
                Clear
              </Button>
            </div>
            
            <div style={{ 
              fontSize: '13px', 
              color: 'hsl(var(--text-secondary))', 
              padding: '12px',
              background: 'hsl(var(--surface-secondary))',
              borderRadius: '6px',
              border: '1px solid hsl(var(--border-primary))'
            }}>
              <strong>💡 Tip:</strong> Common shortcuts include Ctrl+Shift+S, Ctrl+, (comma), or F12. 
              The shortcut will work globally when the app is focused.
            </div>
          </div>
        }
        style={{ marginBottom: '20px' }}
      />

      {/* Account Management */}
      <Card
        title="Account Management"
        separator
        desc={isAnonymous 
          ? "You can use all community features without an account! Browse, download, and upload presets anonymously. Create an account to manage your uploads, track favorites, and get a personalized experience."
          : `Signed in as ${currentUser?.email || 'Unknown'}. You can manage your uploads and get a personalized experience.`
        }
        actions={
          <div style={{ marginTop: 16 }}>
            {isAnonymous ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    console.log('[SETTINGS] Create Account button clicked');
                    handleSignUp();
                  }}
                >
                  Create Account (Optional)
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    console.log('[SETTINGS] Sign In button clicked');
                    handleSignIn();
                  }}
                >
                  Sign In (Optional)
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Text size="sm" color="hsl(var(--text-secondary))">
                  {currentUser?.email}
                </Text>
                <Button 
                  variant="tertiary" 
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        }
        style={{ marginBottom: '20px' }}
      />

      {/* Fresh Install Restore */}
      <Card
        title="Restore Fresh Install"
        separator
        desc="If you're experiencing issues with the app, you can restore it to a fresh state. This will backup your current data and give you a clean start. Your old data will be preserved in a backup folder."
        actions={
          <div style={{ marginTop: 16 }}>
            <Button 
              variant="primary" 
              onClick={async () => {
                if (window.confirm('Are you sure you want to restore to a fresh install? This will backup your current data and give you a clean start. Your old data will be preserved in a backup folder.')) {
                  try {
                    // Trigger fresh install through the backend
                    if (window.api && window.api.getFreshInstallInfo) {
                      // First, get current info to show backup location
                      const currentInfo = await window.api.getFreshInstallInfo();
                      
                      // Show confirmation with backup location
                      const backupLocation = currentInfo.backupLocation;
                      const confirmMessage = backupLocation 
                        ? `Your current data will be backed up to:\n${backupLocation}\n\nProceed with fresh install?`
                        : 'Proceed with fresh install?';
                      
                      if (window.confirm(confirmMessage)) {
                        // Trigger the fresh install by calling the backend
                        // We'll use a special IPC call to trigger the fresh install
                        if (window.api && window.api.triggerFreshInstall) {
                          await window.api.triggerFreshInstall();
                          alert('Fresh install completed! The app will restart with a clean state. Your old data has been backed up.');
                          // Reload the app to apply the fresh install
                          window.location.reload();
                        } else {
                          alert('Fresh install feature not available. Please restart the app manually.');
                        }
                      }
                    } else {
                      alert('Fresh install feature not available. Please restart the app manually.');
                    }
                  } catch (error) {
                    console.error('Error during fresh install:', error);
                    alert('Error during fresh install: ' + error.message);
                  }
                }
              }}
              style={{
                background: '#dc3545',
                borderColor: '#dc3545',
                color: 'white'
              }}
            >
              🔄 Restore Fresh Install
            </Button>
            <div style={{ 
              fontSize: '13px', 
              color: 'hsl(var(--text-secondary))', 
              marginTop: '8px',
              padding: '12px',
              background: 'hsl(var(--surface-secondary))',
              borderRadius: '6px',
              border: '1px solid hsl(var(--border-primary))'
            }}>
              <strong>⚠️ Warning:</strong> This will backup your current data and give you a completely fresh start. 
              All your current settings, wallpapers, sounds, and channel configurations will be reset to defaults. 
              Your old data will be preserved in a backup folder that you can access later if needed.
            </div>
          </div>
        }
        style={{ marginBottom: '20px' }}
      />
    </div>
  );

  const renderTimeTab = () => (
    <div>
      {/* Time Display Color */}
      <Card
        title="Time Display Color"
        separator
        desc="Choose the color for the time and date display text."
        actions={
          <>
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <input
                  type="color"
                  value={localSettings.time?.timeColor ?? '#ffffff'}
                  onChange={(e) => updateLocalSetting('time', 'timeColor', e.target.value)}
                  style={{
                    width: 50,
                    height: 40,
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                />
                <span style={{ color: 'hsl(var(--text-secondary))', fontSize: 14 }}>
                  {(localSettings.time?.timeColor ?? '#ffffff').toUpperCase()}
                </span>
              </div>
              {(localSettings.time?.recentTimeColors ?? []).length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color: 'hsl(var(--text-secondary))', marginRight: 2 }}>Previous:</span>
                  {(localSettings.time?.recentTimeColors ?? []).map((color, idx) => (
                    <button
                      key={color}
                      onClick={() => updateLocalSetting('time', 'timeColor', color)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: color === (localSettings.time?.timeColor ?? '#ffffff') ? '2px solid hsl(var(--wii-blue))' : '1.5px solid hsl(var(--border-secondary))',
                        background: color,
                        cursor: 'pointer',
                        outline: 'none',
                        marginLeft: idx === 0 ? 0 : 2
                      }}
                      title={color}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Font Selection */}
            <div style={{ marginTop: 18 }}>
              <label style={{ fontWeight: 500, marginRight: 10 }}>Time Font</label>
              <select
                value={localSettings.time?.timeFont ?? 'default'}
                onChange={e => updateLocalSetting('time', 'timeFont', e.target.value)}
                style={{ padding: 4, borderRadius: 6 }}
              >
                <option value="default">Default</option>
                <option value="digital">DigitalDisplayRegular-ODEO</option>
              </select>
            </div>
          </>
        }
      />

      {/* Time Format */}
      <Card
        title="Time Format"
        separator
        desc="Choose between 12-hour and 24-hour time format."
        actions={
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', gap: 18 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="radio"
                  name="timeFormat"
                  value="24hr"
                  checked={localSettings.time?.timeFormat24hr ?? true}
                  onChange={() => updateLocalSetting('time', 'timeFormat24hr', true)}
                />
                24-Hour (13:30)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="radio"
                  name="timeFormat"
                  value="12hr"
                  checked={!(localSettings.time?.timeFormat24hr ?? true)}
                  onChange={() => updateLocalSetting('time', 'timeFormat24hr', false)}
                />
                12-Hour (1:30 PM)
              </label>
            </div>
          </div>
        }
      />

      {/* Time Pill Display */}
      <Card
        title="Time Pill Display"
        separator
        desc="Enable the Apple-style liquid glass pill container for the time display."
        headerActions={
          <Toggle
            checked={localSettings.time?.enableTimePill ?? true}
            onChange={(checked) => updateLocalSetting('time', 'enableTimePill', checked)}
          />
        }
        actions={
          localSettings.time?.enableTimePill && (
            <>
              <div style={{ marginTop: 14 }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
                    Backdrop Blur: {localSettings.time?.timePillBlur ?? 8}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={localSettings.time?.timePillBlur ?? 8}
                    onChange={(e) => updateLocalSetting('time', 'timePillBlur', Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
                    Background Opacity: {Math.round((localSettings.time?.timePillOpacity ?? 0.05) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="0.3"
                    step="0.01"
                    value={localSettings.time?.timePillOpacity ?? 0.05}
                    onChange={(e) => updateLocalSetting('time', 'timePillOpacity', Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </>
          )
        }
      />
    </div>
  );

  const renderSoundsTab = () => (
    <div>
      {/* Background Music Section */}
      <Card
        title="Background Music"
        separator
        desc="Background music plays continuously and can use significant CPU and memory resources."
        style={{ marginBottom: '20px' }}
      >
        <div style={{ padding: '20px' }}>
          {/* Background Music Settings */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <Toggle
                checked={localSettings.sounds?.backgroundMusicEnabled ?? true}
                onChange={(checked) => updateLocalSetting('sounds', 'backgroundMusicEnabled', checked)}
              />
              <span style={{ marginLeft: '10px' }}>Enable Background Music</span>
            </div>
            
            {localSettings.sounds?.backgroundMusicEnabled && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <Toggle
                    checked={localSettings.sounds?.backgroundMusicLooping ?? true}
                    onChange={(checked) => updateLocalSetting('sounds', 'backgroundMusicLooping', checked)}
                  />
                  <span style={{ marginLeft: '10px' }}>Loop Music</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <Toggle
                    checked={localSettings.sounds?.backgroundMusicPlaylistMode ?? false}
                    onChange={(checked) => updateLocalSetting('sounds', 'backgroundMusicPlaylistMode', checked)}
                  />
                  <span style={{ marginLeft: '10px' }}>Playlist Mode (Play liked sounds in order)</span>
                </div>
              </>
            )}
          </div>

          {/* Background Music Disabled Warning */}
          {!localSettings.sounds?.backgroundMusicEnabled && (
            <div style={{ 
              padding: '15px', 
              background: '#fff3cd', 
              border: '1px solid #ffeaa7', 
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>🔇 Background Music Disabled</div>
              <div style={{ fontSize: '14px', color: '#856404' }}>
                Background music is currently disabled. Enable it above to hear background music sounds.
              </div>
            </div>
          )}

          {/* Playlist Mode Info */}
          {localSettings.sounds?.backgroundMusicEnabled && localSettings.sounds?.backgroundMusicPlaylistMode && (
            <div style={{ 
              padding: '15px', 
              background: '#d1ecf1', 
              border: '1px solid #bee5eb', 
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>🎵 Playlist Mode Active</div>
              <div style={{ fontSize: '14px', color: '#0c5460' }}>
                Only liked sounds will play in the order they appear. Click the ❤️ to like/unlike sounds and drag items to reorder your playlist.
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Channel Click Sound */}
      <Card
        title="Channel Click Sound"
        separator
        desc="Sound played when clicking on a channel."
        style={{ marginBottom: '20px' }}
      >
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <Toggle
              checked={localSettings.sounds?.channelClickEnabled ?? true}
              onChange={(checked) => updateLocalSetting('sounds', 'channelClickEnabled', checked)}
            />
            <span style={{ marginLeft: '10px' }}>Enable Channel Click Sound</span>
          </div>
          
          {localSettings.sounds?.channelClickEnabled && (
            <div style={{ marginTop: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Volume</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={localSettings.sounds?.channelClickVolume ?? 0.5}
                    onChange={(e) => updateLocalSetting('sounds', 'channelClickVolume', Number(e.target.value))}
                    style={{ width: '100px' }}
                  />
                  <span style={{ minWidth: '40px', textAlign: 'right' }}>
                    {Math.round((localSettings.sounds?.channelClickVolume ?? 0.5) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Channel Hover Sound */}
      <Card
        title="Channel Hover Sound"
        separator
        desc="Sound played when hovering over a channel. Can impact performance with many channels."
        style={{ marginBottom: '20px' }}
      >
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <Toggle
              checked={localSettings.sounds?.channelHoverEnabled ?? true}
              onChange={(checked) => updateLocalSetting('sounds', 'channelHoverEnabled', checked)}
            />
            <span style={{ marginLeft: '10px' }}>Enable Channel Hover Sound</span>
          </div>
          
          {localSettings.sounds?.channelHoverEnabled && (
            <div style={{ marginTop: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Volume</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={localSettings.sounds?.channelHoverVolume ?? 0.5}
                    onChange={(e) => updateLocalSetting('sounds', 'channelHoverVolume', Number(e.target.value))}
                    style={{ width: '100px' }}
                  />
                  <span style={{ minWidth: '40px', textAlign: 'right' }}>
                    {Math.round((localSettings.sounds?.channelHoverVolume ?? 0.5) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Startup Sound */}
      <Card
        title="Startup Sound"
        separator
        desc="Sound played when the application starts."
        style={{ marginBottom: '20px' }}
      >
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <Toggle
              checked={localSettings.sounds?.startupEnabled ?? true}
              onChange={(checked) => updateLocalSetting('sounds', 'startupEnabled', checked)}
            />
            <span style={{ marginLeft: '10px' }}>Enable Startup Sound</span>
          </div>
          
          {localSettings.sounds?.startupEnabled && (
            <div style={{ marginTop: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Volume</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={localSettings.sounds?.startupVolume ?? 0.5}
                    onChange={(e) => updateLocalSetting('sounds', 'startupVolume', Number(e.target.value))}
                    style={{ width: '100px' }}
                  />
                  <span style={{ minWidth: '40px', textAlign: 'right' }}>
                    {Math.round((localSettings.sounds?.startupVolume ?? 0.5) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderDockTab = () => (
    <div>
      <Card
        title="Dock Settings"
        separator
        desc="Customize the classic Wii dock appearance and behavior."
        actions={
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'hsl(var(--text-secondary))' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚓</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Dock Settings</div>
            <div style={{ fontSize: '14px' }}>Coming soon - customize dock size, themes, and button configurations</div>
          </div>
        }
      />
    </div>
  );

  const renderThemesTab = () => (
    <div>
      {importError && <div style={{ color: 'red', marginBottom: 12 }}>{importError}</div>}
       
      <Card style={{ marginBottom: 18 }} title="Save Current as Preset" separator>
        <div className="wee-card-desc">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="text"
              placeholder="Preset name"
              value={newPresetName}
              onChange={e => { setNewPresetName(e.target.value); setError(''); }}
              style={{ 
                flex: 1, 
                padding: 8, 
                borderRadius: 6, 
                border: '1.5px solid hsl(var(--border-primary))', 
                fontSize: 15, 
                background: 'hsl(var(--surface-primary))', 
                color: 'hsl(var(--text-primary))',
                opacity: presets.length >= 6 ? 0.6 : 1
              }}
              maxLength={32}
              tabIndex={presets.length >= 6 ? -1 : 0}
            />
            <Button variant="primary" style={{ minWidth: 90 }} onClick={handleSavePreset} disabled={presets.length >= 6}>
              Save Preset
            </Button>
          </div>
          
          {error && <Text size="sm" color={"#dc3545"} style={{ marginTop: 6 }}>{error}</Text>}
          {presets.length >= 6 && <Text size="sm" color="hsl(var(--text-secondary))" style={{ marginTop: 6 }}>You can save up to 6 presets.</Text>}
        </div>
      </Card>

      <Card 
        style={{ marginBottom: 18 }} 
        title="Saved Presets" 
        separator
        desc={!selectMode ? "Drag presets by the ⋮⋮ handle to reorder them. Apply presets to change your appearance settings." : "Select presets to export them as a ZIP file."}
      >
        {/* Import/Export controls */}
        {/* <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'flex-end', marginBottom: 18 }}>
          <Button variant="secondary" onClick={handleImportClick}>
            Import
          </Button>
          <Button variant="primary" onClick={() => { setSelectMode(true); setSelectedPresets([]); }}>
            Export
          </Button>
          <input
            type="file"
            accept=".json,.zip,application/json,application/zip"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files[0];
              if (!file) return;
              if (file.name.endsWith('.zip')) {
                handleImportZip(file);
              } else {
                handleFileChange(e);
              }
            }}
          />
        </div>

        {selectMode && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 18, justifyContent: 'flex-end' }}>
            <Text size="md" weight={500} style={{ color: 'hsl(var(--text-primary))', marginRight: 'auto' }}>
              Click presets to select for export
            </Text>
            <Button variant="primary" onClick={() => { handleExportZip(getPresetsToExport()); setSelectMode(false); }} disabled={selectedPresets.length === 0}>
              Export Selected
            </Button>
            <Button variant="secondary" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="secondary" onClick={handleDeselectAll}>
              Deselect All
            </Button>
            <Button variant="tertiary" onClick={() => { setSelectMode(false); setSelectedPresets([]); }}>
              Cancel
            </Button>
          </div>
        )} */}

        <hr style={{ border: 'none', borderTop: '1.5px solid hsl(var(--border-primary))', margin: '0 0 18px 0' }} />
          
        {showImportPreview && importedPresets && (
          <div className="import-preview-modal" style={{ background: 'hsl(var(--surface-secondary))', border: '1.5px solid hsl(var(--wii-blue))', borderRadius: 12, padding: 24, marginBottom: 18 }}>
            <h3>Preview Imported Presets</h3>
            <ul style={{ textAlign: 'left', margin: '12px 0 18px 0' }}>
              {importedPresets.map((preset, idx) => {
                const exists = presets.some(p => p.name === preset.name);
                return (
                  <li key={idx} style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <b>{preset.name}</b> {preset.data ? '' : <span style={{ color: 'red' }}>(Invalid)</span>}
                    {exists && (
                      <label style={{ fontSize: 13, color: 'hsl(var(--wii-blue))', marginLeft: 8, cursor: 'pointer', userSelect: 'none' }}>
                        <input
                          type="checkbox"
                          checked={overwriteMap[preset.name]}
                          onChange={() => handleToggleOverwrite(preset.name)}
                          style={{ marginRight: 4 }}
                        />
                        Overwrite existing
                      </label>
                    )}
                    {exists && !overwriteMap[preset.name] && <span style={{ color: 'hsl(var(--text-secondary))', fontSize: 13 }}>(Will skip)</span>}
                  </li>
                );
              })}
            </ul>
            <Button variant="primary" onClick={handleConfirmImport} style={{ marginRight: 12 }}>Import</Button>
            <Button variant="secondary" onClick={handleCancelImport}>Cancel</Button>
          </div>
        )}
          
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: 0 }}>
          {presets.map((preset, idx) => {
            const isDragging = draggingPreset === preset.name;
            const isDropTarget = dropTarget === preset.name;
            const isSelected = selectMode && selectedPresets.includes(preset.name);
            
            return (
              <PresetListItem
                key={preset.name}
                preset={preset}
                isDragging={isDragging}
                isDropTarget={isDropTarget}
                isSelected={isSelected}
                selectMode={selectMode}
                editingPreset={editingPreset}
                editName={editName}
                justUpdated={justUpdated}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onToggleSelect={handleToggleSelectPreset}
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

  const renderAdvancedTab = () => (
    <div>
      <Card
        title="Advanced Settings"
        separator
        desc="Expert-level configuration options for power users."
        actions={
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'hsl(var(--text-secondary))' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Advanced Settings</div>
            <div style={{ fontSize: '14px' }}>Coming soon - performance tuning, debug options, and expert configurations</div>
          </div>
        }
      />
    </div>
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


    </BaseModal>
  );
}

AppearanceSettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSettingsChange: PropTypes.func,
};

export default AppearanceSettingsModal; 