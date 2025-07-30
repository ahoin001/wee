import React, { useState, useEffect } from 'react';
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

// Sidebar navigation configuration
const SIDEBAR_SECTIONS = [
  { id: 'channels', label: 'Channels', icon: '📺', color: '#0099ff', description: 'Animation & display settings' },
  { id: 'ribbon', label: 'Ribbon', icon: '🎗️', color: '#ff6b35', description: 'Colors & glass effects' },
  { id: 'wallpaper', label: 'Wallpaper', icon: '🖼️', color: '#4ecdc4', description: 'Background & cycling' },
  { id: 'time', label: 'Time', icon: '🕐', color: '#45b7d1', description: 'Clock & pill display' },
  { id: 'general', label: 'General', icon: '⚙️', color: '#6c5ce7', description: 'App behavior & startup' },
//   { id: 'sounds', label: 'Sounds', icon: '🎵', color: '#96ceb4', description: 'Audio & feedback' },
//   { id: 'dock', label: 'Dock', icon: '⚓', color: '#feca57', description: 'Classic dock settings' },
  { id: 'themes', label: 'Themes', icon: '🎨', color: '#ff9ff3', description: 'Preset themes' },
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

      {/* Restore App */}
      <Card
        title="Restore App to Fresh State"
        separator
        desc="Reset the app to a completely fresh state. This will backup your current data and create a clean installation. Use this if you're experiencing issues or want to start over."
        actions={
          <div style={{ marginTop: 16 }}>
            <div style={{ 
              padding: '16px', 
              background: '#fff3cd', 
              border: '1px solid #ffeaa7', 
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#856404' }}>⚠️ Warning</div>
              <div style={{ fontSize: '14px', color: '#856404', marginBottom: '12px' }}>
                This will:
              </div>
              <ul style={{ fontSize: '14px', color: '#856404', margin: '0', paddingLeft: '20px' }}>
                <li>Backup your current settings and data</li>
                <li>Remove all customizations and configurations</li>
                <li>Reset the app to default settings</li>
                <li>Require you to reconfigure everything</li>
              </ul>
            </div>
            <button
              onClick={async () => {
                if (window.confirm('Are you sure you want to restore the app to a fresh state? This will backup your current data and reset everything to default settings.')) {
                  try {
                    if (window.api && window.api.triggerFreshInstall) {
                      const result = await window.api.triggerFreshInstall();
                      if (result.success) {
                        alert(`Restore completed successfully!\n\nYour old data has been backed up to:\n${result.backupLocation}\n\nThe app will now restart with fresh settings.`);
                        // Reload the app to apply fresh settings
                        window.location.reload();
                      } else {
                        alert('Failed to restore app: ' + (result.error || 'Unknown error'));
                      }
                    } else {
                      alert('Restore functionality not available');
                    }
                  } catch (error) {
                    alert('Error during restore: ' + error.message);
                  }
                }
              }}
              style={{
                padding: '12px 24px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#c82333';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#dc3545';
              }}
            >
              🔄 Restore to Fresh State
            </button>
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
      <Card
        title="Theme Management"
        separator
        desc="Manage and apply preset themes for the entire application."
        actions={
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'hsl(var(--text-secondary))' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎨</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Theme Management</div>
            <div style={{ fontSize: '14px' }}>Coming soon - browse, apply, and create custom themes</div>
          </div>
        }
      />
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
      title="Appearance Settings"
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