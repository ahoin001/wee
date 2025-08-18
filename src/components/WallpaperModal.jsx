import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import WBaseModal from './WBaseModal';
import ResourceUsageIndicator from './ResourceUsageIndicator';
import Text from '../ui/Text';
import Button from '../ui/WButton';

import Card from '../ui/Card';
import WToggle from '../ui/WToggle';
import WSelect from '../ui/WSelect';
// New unified data layer imports
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';

const WALLPAPER_ANIMATIONS = [
  { value: 'fade', label: 'Fade - Smooth crossfade between wallpapers' },
  { value: 'slide', label: 'Slide - Slide one wallpaper out while sliding the next in' },
  { value: 'zoom', label: 'Zoom - Zoom out current wallpaper while zooming in the next' },
  { value: 'ken-burns', label: 'Ken Burns - Classic documentary-style pan and zoom effect' },
  { value: 'dissolve', label: 'Dissolve - Pixel-based dissolve transition' },
  { value: 'wipe', label: 'Wipe - Clean wipe transition in the selected direction' },
];

const EASING_OPTIONS = [
  { value: 'ease-out', label: 'Ease Out (Smooth)' },
  { value: 'ease-in', label: 'Ease In (Accelerate)' },
  { value: 'ease-in-out', label: 'Ease In-Out (Smooth)' },
  { value: 'linear', label: 'Linear (Constant)' },
];

const SLIDE_DIRECTION_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' },
];

const SLIDE_DIRECTION_MODE_OPTIONS = [
  { value: 'fixed', label: 'Fixed Direction' },
  { value: 'random', label: 'Random Direction' },
];

const OVERLAY_EFFECT_OPTIONS = [
  { value: 'snow', label: '❄️ Snow' },
  { value: 'rain', label: '🌧️ Rain' },
  { value: 'leaves', label: '🍃 Leaves' },
  { value: 'fireflies', label: '✨ Fireflies' },
  { value: 'dust', label: '💨 Dust' },
  { value: 'fire', label: '🔥 Fire' },
];

const api = window.api?.wallpapers || {};
const selectFile = window.api?.selectWallpaperFile;

function WallpaperModal({ isOpen, onClose, onSettingsChange }) {
  // New unified data layer hooks
  const { wallpaper, overlay } = useConsolidatedAppStore();
  const { setWallpaperState, setOverlayState } = useConsolidatedAppStore(state => state.actions);
  
  const wallpaperSettings = wallpaper;
  const updateWallpaperSetting = (key, value) => setWallpaperState({ [key]: value });
  
  const [wallpapers, setWallpapers] = useState([]);
  const [activeWallpaper, setActiveWallpaper] = useState(null);
  const [likedWallpapers, setLikedWallpapers] = useState([]);
  const [cycling, setCycling] = useState(false);
  const [cycleInterval, setCycleInterval] = useState(30);
  const [cycleAnimation, setCycleAnimation] = useState('fade');
  const [slideDirection, setSlideDirection] = useState('right');
  const [crossfadeDuration, setCrossfadeDuration] = useState(1.2);
  const [crossfadeEasing, setCrossfadeEasing] = useState('ease-out');
  const [slideRandomDirection, setSlideRandomDirection] = useState(false);
  const [slideDuration, setSlideDuration] = useState(1.5);
  const [slideEasing, setSlideEasing] = useState('ease-out');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState({});

  const [selectedWallpaper, setSelectedWallpaper] = useState(null);
  const [wallpaperOpacity, setWallpaperOpacity] = useState(1);
  const [wallpaperBlur, setWallpaperBlur] = useState(0);

  // Overlay effect settings
  const [overlayEnabled, setOverlayEnabled] = useState(false);
  const [overlayEffect, setOverlayEffect] = useState('snow');
  const [overlayIntensity, setOverlayIntensity] = useState(50);
  const [overlaySpeed, setOverlaySpeed] = useState(1);
  const [overlayWind, setOverlayWind] = useState(0.02);
  const [overlayGravity, setOverlayGravity] = useState(0.1);

  // Load wallpapers from backend
  const loadWallpapers = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const data = await api.get();
      setWallpapers(data.savedWallpapers || []);
      setActiveWallpaper(data.wallpaper || null);
      setLikedWallpapers(data.likedWallpapers || []);
      setCycling(data.cyclingSettings?.enabled ?? false);
      setCycleInterval(data.cyclingSettings?.interval ?? 30);
      setCycleAnimation(data.cyclingSettings?.animation ?? 'fade');
      setSlideDirection(data.cyclingSettings?.slideDirection ?? 'right');
      setCrossfadeDuration(data.cyclingSettings?.crossfadeDuration ?? 1.2);
      setCrossfadeEasing(data.cyclingSettings?.crossfadeEasing ?? 'ease-out');
      setSlideRandomDirection(data.cyclingSettings?.slideRandomDirection ?? false);
      setSlideDuration(data.cyclingSettings?.slideDuration ?? 1.5);
      setSlideEasing(data.cyclingSettings?.slideEasing ?? 'ease-out');
      setWallpaperOpacity(typeof data.wallpaperOpacity === 'number' ? data.wallpaperOpacity : 1);
      setWallpaperBlur(data.wallpaperBlur ?? 0);

      // Load overlay settings
      setOverlayEnabled(data.overlayEnabled ?? false);
      setOverlayEffect(data.overlayEffect ?? 'snow');
      setOverlayIntensity(data.overlayIntensity ?? 50);
      setOverlaySpeed(data.overlaySpeed ?? 1);
      setOverlayWind(data.overlayWind ?? 0.02);
      setOverlayGravity(data.overlayGravity ?? 0.1);

      // Update consolidated store with loaded data
      setWallpaperState({
        current: data.wallpaper || null, // This is the key - update the current wallpaper
        savedWallpapers: data.savedWallpapers || [],
        likedWallpapers: data.likedWallpapers || [],
        opacity: data.wallpaperOpacity ?? 1,
        blur: data.wallpaperBlur ?? 0,
        cycleWallpapers: data.cyclingSettings?.enabled ?? false,
        cycleInterval: data.cyclingSettings?.interval ?? 30,
        cycleAnimation: data.cyclingSettings?.animation ?? 'fade',
        slideDirection: data.cyclingSettings?.slideDirection ?? 'right',
        crossfadeDuration: data.cyclingSettings?.crossfadeDuration ?? 1.2,
        crossfadeEasing: data.cyclingSettings?.crossfadeEasing ?? 'ease-out',
        slideRandomDirection: data.cyclingSettings?.slideRandomDirection ?? false,
        slideDuration: data.cyclingSettings?.slideDuration ?? 1.5,
        slideEasing: data.cyclingSettings?.slideEasing ?? 'ease-out',
      });

      setOverlayState({
        enabled: data.overlayEnabled ?? false,
        effect: data.overlayEffect ?? 'snow',
        intensity: data.overlayIntensity ?? 50,
        speed: data.overlaySpeed ?? 1,
        wind: data.overlayWind ?? 0.02,
        gravity: data.overlayGravity ?? 0.1,
      });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load wallpapers: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadWallpapers();
    // Listen for backend updates
    if (window.api && window.api.onWallpapersUpdated) {
      window.api.onWallpapersUpdated(loadWallpapers);
    }
    // Cleanup
    return () => {
      if (window.api && window.api.offWallpapersUpdated) {
        window.api.offWallpapersUpdated(loadWallpapers);
      }
    };
  }, [isOpen]);

  // Upload a new wallpaper
  const handleUpload = async () => {
    setUploading(true);
    setMessage({ type: '', text: '' });
    try {
      const fileResult = await selectFile();
      if (!fileResult.success) {
        setMessage({ type: 'error', text: fileResult.error || 'File selection cancelled.' });
        setUploading(false);
        return;
      }
      const file = fileResult.file;
      const addResult = await api.add({ filePath: file.path, filename: file.name });
      if (!addResult.success) {
        setMessage({ type: 'error', text: addResult.error || 'Failed to add wallpaper.' });
        setUploading(false);
        return;
      }
      setMessage({ type: 'success', text: 'Wallpaper uploaded!' });
      await loadWallpapers();
    } catch (err) {
      setMessage({ type: 'error', text: 'Upload failed: ' + err.message });
    } finally {
      setUploading(false);
    }
  };

  // Delete a wallpaper
  const handleDelete = async (url) => {
    setDeleting(prev => ({ ...prev, [url]: true }));
    setMessage({ type: '', text: '' });
    try {
      const result = await api.delete({ url });
      if (!result.success) {
        setMessage({ type: 'error', text: result.error || 'Failed to delete wallpaper.' });
      } else {
        setMessage({ type: 'success', text: 'Wallpaper deleted.' });
        await loadWallpapers();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Delete failed: ' + err.message });
    } finally {
      setDeleting(prev => ({ ...prev, [url]: false }));
    }
  };

  // Like/unlike a wallpaper
  const handleLike = async (url) => {
    try {
      const result = await api.toggleLike({ url });
      if (!result.success) {
        setMessage({ type: 'error', text: result.error || 'Failed to toggle like.' });
      } else {
        setLikedWallpapers(result.likedWallpapers);
        setMessage({ type: 'success', text: result.liked ? 'Wallpaper liked!' : 'Wallpaper unliked.' });
        await loadWallpapers();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Like/unlike failed: ' + err.message });
    }
  };

  // Set as current wallpaper
  const handleSetCurrent = async (w) => {
    try {
      const result = await api.setActive({ url: w.url });
      if (!result.success) {
        setMessage({ type: 'error', text: result.error || 'Failed to set wallpaper.' });
      } else {
        setActiveWallpaper(w);
        setSelectedWallpaper(w);
        
        // Immediately update the consolidated store with the new current wallpaper
        setWallpaperState({
          current: w,
        });
        
        setMessage({ type: 'success', text: 'Wallpaper set as current.' });
        await loadWallpapers();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Set wallpaper failed: ' + err.message });
    }
  };

  // Remove current wallpaper (set to default)
  const handleRemoveWallpaper = async () => {
    try {
      const result = await api.setActive({ url: null });
      if (!result.success) {
        setMessage({ type: 'error', text: result.error || 'Failed to remove wallpaper.' });
      } else {
        setActiveWallpaper(null);
        setSelectedWallpaper(null);
        
        // Immediately update the consolidated store to clear the current wallpaper
        setWallpaperState({
          current: null,
        });
        
        setMessage({ type: 'success', text: 'Wallpaper removed. Back to default background.' });
        await loadWallpapers();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Remove wallpaper failed: ' + err.message });
    }
  };

  // Save cycling settings
  const handleSaveCycling = async () => {
    try {
      const result = await api.setCyclingSettings({
        enabled: cycling,
        interval: cycleInterval,
        animation: cycleAnimation,
        slideDirection: slideDirection,
        crossfadeDuration: crossfadeDuration,
        crossfadeEasing: crossfadeEasing,
        slideRandomDirection: slideRandomDirection,
        slideDuration: slideDuration,
        slideEasing: slideEasing,
      });
      if (!result.success) {
        setMessage({ type: 'error', text: result.error || 'Failed to save cycling settings.' });
      } else {
        setMessage({ type: 'success', text: 'Cycling settings saved.' });
        await loadWallpapers();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Save cycling failed: ' + err.message });
    }
  };

  // Set selected wallpaper when modal opens or wallpapers change
  useEffect(() => {
    if (isOpen) {
      setSelectedWallpaper(activeWallpaper);
      setWallpaperBlur(wallpaperSettings?.wallpaperBlur ?? 0);
    }
  }, [isOpen, activeWallpaper, wallpaperSettings]);

  // Save both selected wallpaper and cycling settings
  const handleSaveAll = async (handleClose) => {
    try {
      // Save wallpaper-specific settings only
      let wallpaperData = await api.get();
      wallpaperData.wallpaperOpacity = wallpaperOpacity;
      wallpaperData.wallpaperBlur = wallpaperBlur;
      wallpaperData.overlayEnabled = overlayEnabled;
      wallpaperData.overlayEffect = overlayEffect;
      wallpaperData.overlayIntensity = overlayIntensity;
      wallpaperData.overlaySpeed = overlaySpeed;
      wallpaperData.overlayWind = overlayWind;
      wallpaperData.overlayGravity = overlayGravity;
      await api.set(wallpaperData);

      // Handle wallpaper and cycling settings
      if (selectedWallpaper) {
        await api.setActive({ url: selectedWallpaper.url });
      }
      await api.setCyclingSettings({
        enabled: cycling,
        interval: cycleInterval,
        animation: cycleAnimation,
        slideDirection: slideDirection,
        crossfadeDuration: crossfadeDuration,
        crossfadeEasing: crossfadeEasing,
        slideRandomDirection: slideRandomDirection,
        slideDuration: slideDuration,
        slideEasing: slideEasing,
      });

      setMessage({ type: 'success', text: 'Wallpaper and settings saved.' });

      // Update consolidated store with new settings
      setWallpaperState({
        current: selectedWallpaper || null, // Update current wallpaper to the selected one
        opacity: wallpaperOpacity,
        blur: wallpaperBlur,
        cycleWallpapers: cycling,
        cycleInterval: cycleInterval,
        cycleAnimation: cycleAnimation,
        slideDirection: slideDirection,
        crossfadeDuration: crossfadeDuration,
        crossfadeEasing: crossfadeEasing,
        slideRandomDirection: slideRandomDirection,
        slideDuration: slideDuration,
        slideEasing: slideEasing,
      });

      setOverlayState({
        enabled: overlayEnabled,
        effect: overlayEffect,
        intensity: overlayIntensity,
        speed: overlaySpeed,
        wind: overlayWind,
        gravity: overlayGravity,
      });

      // Call onSettingsChange to notify parent component of the new settings
      if (onSettingsChange) {
        onSettingsChange({
          wallpaperOpacity: wallpaperOpacity,
          wallpaperBlur: wallpaperBlur,
          overlayEnabled: overlayEnabled,
          overlayEffect: overlayEffect,
          overlayIntensity: overlayIntensity,
          overlaySpeed: overlaySpeed,
          overlayWind: overlayWind,
          overlayGravity: overlayGravity,
        });
      }
      handleClose();
    } catch (err) {
      setMessage({ type: 'error', text: 'Save failed: ' + err.message });
    }
  };

  if (!isOpen) return null;
  return (
    <WBaseModal
      title="Manage Wallpapers"
      onClose={onClose}
      maxWidth="1200px"
      footerContent={({ handleClose }) => (
        <div className="text-right flex justify-end gap-2.5">
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={() => handleSaveAll(handleClose)} className="min-w-[90px]">Save</Button>
        </div>
      )}
    >
      {message.text && (
        <div className={`message ${message.type} mb-2.5 font-medium`}>
          {message.text}
        </div>
      )}
      {/* Upload Wallpaper Card */}
      <Card
        title="Upload New Wallpaper"
        separator
        desc="Add a new wallpaper from your computer. Supported formats: JPG, PNG, GIF, MP4, WEBM, etc."
        actions={
          <div className="mt-3.5">
            <Button variant="secondary" onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload New Wallpaper'}
            </Button>
          </div>
        }
      />
      {/* Saved Wallpapers Card */}
      <Card
        title="Saved Wallpapers"
        separator
        desc="Browse, select, and manage your saved wallpapers below."
        actions={
          <>
            <div className="flex items-center justify-center mb-5 py-3 px-4 bg-gradient-to-br from-white/80 to-blue-50/90 rounded-xl border border-blue-300/15 shadow-md">
              <div
                className={`flex items-center gap-3 cursor-pointer px-4 py-2 rounded-lg min-w-[200px] justify-center transition-all duration-200
                  ${activeWallpaper === null
                    ? 'bg-blue-100/60 border-2 border-blue-400'
                    : 'bg-white/70 border border-blue-300/20'}
                `}
                onClick={handleRemoveWallpaper}
                onMouseEnter={e => {
                  if (activeWallpaper !== null) {
                    e.currentTarget.classList.remove('bg-white/70', 'border-blue-300/20');
                    e.currentTarget.classList.add('bg-blue-100/40', 'border-blue-300/30');
                  }
                }}
                onMouseLeave={e => {
                  if (activeWallpaper !== null) {
                    e.currentTarget.classList.remove('bg-blue-100/40', 'border-blue-300/30');
                    e.currentTarget.classList.add('bg-white/70', 'border-blue-300/20');
                  }
                }}
              >
                <div
                  className="w-10 h-[25px] rounded border border-gray-200"
                  style={{
                    background:
                      'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                    backgroundSize: '8px 8px',
                    backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                  }}
                />
                <div className="text-left">
                  <div className={`font-semibold text-[14px] mb-0.5 ${activeWallpaper === null ? 'text-blue-500' : 'text-gray-900'}`}>
                    Default Background
                  </div>
                  <div className={`text-xs ${activeWallpaper === null ? 'text-blue-500' : 'text-gray-500'}`}>
                    {activeWallpaper === null ? 'Currently active' : 'Remove wallpaper'}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 justify-center items-start">
              {wallpapers.length === 0 && <Text variant="help">No saved wallpapers yet.</Text>}
              {wallpapers.map((wallpaper, idx) => (
                <div
                  key={wallpaper.url || idx}
                  className="min-w-[120px] max-w-[160px] flex flex-col items-center justify-start"
                >
                  <div
                    className={`
                      relative w-[110px] h-[70px] rounded-xl overflow-hidden
                      ${selectedWallpaper && selectedWallpaper.url === wallpaper.url
                        ? 'border-2.5 border-blue-400 shadow-[0_0_0_2px_#b0e0ff]'
                        : 'border border-gray-300 shadow-md'}
                      bg-white cursor-pointer flex items-center justify-center mb-0.5
                      transition-all duration-200
                    `}
                    tabIndex={0}
                    aria-label={`Select wallpaper ${wallpaper.name}`}
                    onClick={() => setSelectedWallpaper(wallpaper)}
                    onKeyDown={e => { if (e.key === 'Enter') setSelectedWallpaper(wallpaper); }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <img
                      src={wallpaper.url}
                      alt={wallpaper.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                    {/* Like button */}
                    <button
                      className={`
                        absolute top-2 left-2 flex items-center justify-center rounded-full w-7 h-7 z-20
                        text-base shadow
                        transition-colors duration-200
                        ${likedWallpapers.includes(wallpaper.url)
                          ? 'bg-red-100 text-red-500'
                          : 'bg-white/90 text-gray-800'}
                      `}
                      title={likedWallpapers.includes(wallpaper.url) ? 'Unlike' : 'Like'}
                      aria-label={likedWallpapers.includes(wallpaper.url) ? 'Unlike wallpaper' : 'Like wallpaper'}
                      onClick={e => { e.stopPropagation(); handleLike(wallpaper.url); }}
                      onMouseEnter={e => {
                        e.currentTarget.classList.add('bg-red-200', 'text-red-500');
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.classList.remove('bg-red-200');
                        if (likedWallpapers.includes(wallpaper.url)) {
                          e.currentTarget.classList.add('bg-red-100', 'text-red-500');
                        } else {
                          e.currentTarget.classList.remove('text-red-500');
                          e.currentTarget.classList.add('bg-white/90', 'text-gray-800');
                        }
                      }}
                    >
                      {likedWallpapers.includes(wallpaper.url) ? '♥' : '♡'}
                    </button>
                    {/* Delete button */}
                    <button
                      className={`
                        absolute top-2 right-2 flex items-center justify-center rounded-full w-7 h-7 z-20
                        text-base shadow
                        transition-colors duration-200
                        bg-white/90 text-gray-800
                        hover:bg-gray-500 hover:text-white
                      `}
                      title="Remove saved wallpaper"
                      aria-label="Remove saved wallpaper"
                      onClick={e => { e.stopPropagation(); handleDelete(wallpaper.url); }}
                      disabled={deleting[wallpaper.url]}
                    >
                      {deleting[wallpaper.url] ? '⏳' : <span>🗑️</span>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        }
      />
      {/* Enable Cycling Card */}
      <Card
        title="Enable Wallpaper Cycling"
        separator
        desc="When enabled, your wallpapers will automatically cycle through your liked wallpapers at the interval you set below."
        headerActions={
          <WToggle
            checked={cycling}
            onChange={setCycling}
          />
        }
        actions={
          <>
            <div className="flex items-center gap-4 mt-4">
              <span className="font-medium min-w-[120px] text-gray-700">Time per wallpaper</span>
              <input
                type="number"
                min={2}
                max={600}
                value={cycleInterval}
                onChange={e => setCycleInterval(Number(e.target.value))}
                className="w-[70px] text-[15px] px-2 py-1 rounded border border-gray-300 mr-2"
              />
              <Text variant="small" className="text-gray-500">seconds</Text>
            </div>
            <div className="flex items-center gap-4 mt-3.5">
              <span className="font-medium min-w-[120px] text-gray-700">Animation</span>
              <div className="flex-1">
                <WSelect
                  options={WALLPAPER_ANIMATIONS}
                  value={cycleAnimation}
                  onChange={setCycleAnimation}
                  className="w-full"
                />
              </div>
            </div>

            {/* Crossfade Animation Parameters */}
            {cycleAnimation === 'fade' && (
              <>
                <div className="flex items-center gap-4 mt-3.5">
                  <span className="font-medium min-w-[120px] text-gray-700">Crossfade Duration</span>
                  <input
                    type="range"
                    min={0.5}
                    max={3.0}
                    step={0.1}
                    value={crossfadeDuration}
                    onChange={e => setCrossfadeDuration(Number(e.target.value))}
                    className="flex-1"
                  />
                  <Text variant="small" className="min-w-[40px] font-semibold text-gray-500">{crossfadeDuration}s</Text>
                </div>
                <div className="flex items-center gap-4 mt-3.5">
                  <span className="font-medium min-w-[120px] text-gray-700">Easing Function</span>
                  <div className="flex-1">
                    <WSelect
                      options={EASING_OPTIONS}
                      value={crossfadeEasing}
                      onChange={setCrossfadeEasing}
                      className="w-full"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Zoom Animation Parameters */}
            {cycleAnimation === 'zoom' && (
              <>
                <div className="flex items-center gap-4 mt-3.5">
                  <span className="font-medium min-w-[120px] text-gray-700">Zoom Duration</span>
                  <input
                    type="range"
                    min={0.5}
                    max={3.0}
                    step={0.1}
                    value={crossfadeDuration}
                    onChange={e => setCrossfadeDuration(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="min-w-[40px] font-semibold text-gray-500">{crossfadeDuration}s</span>
                </div>
                <div className="flex items-center gap-4 mt-3.5">
                  <span className="font-medium min-w-[120px] text-gray-700">Easing Function</span>
                  <div className="flex-1">
                    <WSelect
                      options={EASING_OPTIONS}
                      value={crossfadeEasing}
                      onChange={setCrossfadeEasing}
                      className="w-full"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Ken Burns Animation Parameters */}
            {cycleAnimation === 'ken-burns' && (
              <>
                <div className="flex items-center gap-4 mt-3.5">
                  <span className="font-medium min-w-[120px] text-gray-700">Ken Burns Duration</span>
                  <input
                    type="range"
                    min={0.5}
                    max={3.0}
                    step={0.1}
                    value={crossfadeDuration}
                    onChange={e => setCrossfadeDuration(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="min-w-[40px] font-semibold text-gray-500">{crossfadeDuration}s</span>
                </div>
                <div className="flex items-center gap-4 mt-3.5">
                  <span className="font-medium min-w-[120px] text-gray-700">Easing Function</span>
                  <div className="flex-1">
                    <WSelect
                      options={EASING_OPTIONS}
                      value={crossfadeEasing}
                      onChange={setCrossfadeEasing}
                      className="w-full"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Dissolve Animation Parameters */}
            {cycleAnimation === 'dissolve' && (
              <>
                <div className="flex items-center gap-4 mt-3.5">
                  <span className="font-medium min-w-[120px] text-gray-700">Dissolve Duration</span>
                  <input
                    type="range"
                    min={0.5}
                    max={3.0}
                    step={0.1}
                    value={crossfadeDuration}
                    onChange={e => setCrossfadeDuration(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="min-w-[40px] font-semibold text-gray-500">{crossfadeDuration}s</span>
                </div>
                <div className="flex items-center gap-4 mt-3.5">
                  <span className="font-medium min-w-[120px] text-gray-700">Easing Function</span>
                  <div className="flex-1">
                    <WSelect
                      options={EASING_OPTIONS}
                      value={crossfadeEasing}
                      onChange={setCrossfadeEasing}
                      className="w-full"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Slide Animation Parameters */}
            {cycleAnimation === 'slide' && (
              <>
                <div className="flex items-center gap-4 mt-3.5">
                  <span className="font-medium min-w-[120px] text-gray-700">Direction Mode</span>
                  <div className="flex-1">
                    <WSelect
                      options={SLIDE_DIRECTION_MODE_OPTIONS}
                      value={slideRandomDirection ? 'random' : 'fixed'}
                      onChange={val => setSlideRandomDirection(val === 'random')}
                      className="w-full"
                    />
                  </div>
                </div>
                {!slideRandomDirection && (
                  <div className="flex items-center gap-4 mt-3.5">
                    <span className="font-medium min-w-[120px] text-gray-700">Slide Direction</span>
                    <div className="flex-1">
                      <WSelect
                        options={SLIDE_DIRECTION_OPTIONS}
                        value={slideDirection}
                        onChange={setSlideDirection}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4 mt-3.5">
                  <span className="font-medium min-w-[120px] text-gray-700">Slide Duration</span>
                  <input
                    type="range"
                    min={0.8}
                    max={3.0}
                    step={0.1}
                    value={slideDuration}
                    onChange={e => setSlideDuration(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="min-w-[40px] font-semibold text-gray-500">{slideDuration}s</span>
                </div>
                <div className="flex items-center gap-4 mt-3.5">
                  <span className="font-medium min-w-[120px] text-gray-700">Easing Function</span>
                  <div className="flex-1">
                    <WSelect
                      options={EASING_OPTIONS}
                      value={slideEasing}
                      onChange={setSlideEasing}
                      className="w-full"
                    />
                  </div>
                </div>
              </>
            )}
          </>
        }
      />
      {/* Wallpaper Effects Card (merged opacity and blur) */}
      <Card
        title="Wallpaper Effects"
        separator
        desc="Adjust the transparency and blur of the wallpaper background."
        actions={
          <>
            <div className="text-[14px] text-gray-600 mt-0">
              <strong>Wallpaper Opacity:</strong> Adjust the transparency of the wallpaper background.
            </div>
            {/* Wallpaper Opacity Slider */}
            <div className="mt-2.5 flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={wallpaperOpacity}
                onChange={e => setWallpaperOpacity(Number(e.target.value))}
                className="flex-1"
              />
              <span className="min-w-[38px] font-semibold text-gray-500">{Math.round(wallpaperOpacity * 100)}%</span>
            </div>
            <div className="text-[13px] text-gray-400 mt-0.5">Higher transparency makes the wallpaper more see-through. 0% = fully visible, 100% = fully transparent.</div>
            {/* Wallpaper Blur Slider */}
            <div className="mt-4.5 flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="24"
                step="0.5"
                value={wallpaperBlur}
                onChange={e => setWallpaperBlur(Number(e.target.value))}
                className="flex-1"
              />
              <span className="min-w-[38px] font-semibold text-gray-500">{wallpaperBlur}px</span>
            </div>
            <div className="text-[13px] text-gray-400 mt-0.5">Higher blur makes the wallpaper more blurry. 0px = no blur, 24px = very blurry.</div>
          </>
        }
      />
      {/* Wallpaper Overlay Effects Card */}
      <Card
        title="Wallpaper Overlay Effects"
        separator
        desc="Add beautiful animated overlay effects to your wallpaper, like snow, rain, leaves, fireflies, or dust particles."
        actions={
          <>
            <div className="flex items-center gap-4 mt-4">
              <span className="font-medium min-w-[120px] text-gray-700">Enable Overlay</span>
              <WToggle
                checked={overlayEnabled}
                onChange={setOverlayEnabled}
                label="Show overlay effects"
              />
            </div>
            {overlayEnabled && (
              <>
                <div className="flex items-center gap-4 mt-3.5">
                  <span className="font-medium min-w-[120px] text-gray-700">Effect Type</span>
                  <div className="flex-1">
                    <WSelect
                      options={OVERLAY_EFFECT_OPTIONS}
                      value={overlayEffect}
                      onChange={setOverlayEffect}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3.5">
                  <span className="font-medium min-w-[120px] text-gray-700">Intensity</span>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={overlayIntensity}
                    onChange={e => setOverlayIntensity(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="min-w-[40px] font-semibold text-gray-500">{overlayIntensity}%</span>
                </div>
                <div className="flex items-center gap-4 mt-3.5">
                  <span className="font-medium min-w-[120px] text-gray-700">Speed</span>
                  <input
                    type="range"
                    min={0.1}
                    max={3}
                    step={0.05}
                    value={overlaySpeed}
                    onChange={e => setOverlaySpeed(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="min-w-[40px] font-semibold text-gray-500">{overlaySpeed}x</span>
                </div>
                <div className="flex items-center gap-4 mt-3.5">
                  <span className="font-medium min-w-[120px] text-gray-700">Wind</span>
                  <input
                    type="range"
                    min={-0.1}
                    max={0.1}
                    step={0.005}
                    value={overlayWind}
                    onChange={e => setOverlayWind(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="min-w-[40px] font-semibold text-gray-500">{overlayWind.toFixed(3)}</span>
                </div>
                <div className="flex items-center gap-4 mt-3.5">
                  <span className="font-medium min-w-[120px] text-gray-700">Gravity</span>
                  <input
                    type="range"
                    min={-0.2}
                    max={0.5}
                    step={0.01}
                    value={overlayGravity}
                    onChange={e => setOverlayGravity(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="min-w-[40px] font-semibold text-gray-500">{overlayGravity.toFixed(2)}</span>
                </div>
                <div className="text-[13px] text-gray-400 mt-2">
                  <strong>Effect Types:</strong> Snow (gentle falling snowflakes), Rain (falling raindrops),
                  Leaves (floating autumn leaves), Fireflies (glowing particles), Dust (floating dust particles),
                  Fire (rising flames).
                </div>
              </>
            )}
          </>
        }
      />
    </WBaseModal>
  );
}

WallpaperModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
};

export default WallpaperModal;