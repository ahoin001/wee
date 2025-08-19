import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../ui/Card';
import WToggle from '../../ui/WToggle';
import Text from '../../ui/Text';
import Button from '../../ui/WButton';
import WSelect from '../../ui/WSelect';
import WInput from '../../ui/WInput';
import Slider from '../../ui/Slider';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';

const WALLPAPER_ANIMATIONS = [
  { value: 'fade', label: 'Crossfade - Smooth, elegant transition (Recommended)' },
  { value: 'slide', label: 'Slide - Directional slide transition' },
  { value: 'zoom', label: 'Zoom - Gentle scale transition' },
  { value: 'ken-burns', label: 'Ken Burns - Cinematic pan and zoom effect' },
  { value: 'morph', label: 'Morph - Smooth shape-based transition' },
  { value: 'blur', label: 'Blur - Blur-based crossfade transition' },
];

const EASING_OPTIONS = [
  { value: 'ease-out', label: 'Ease Out - Smooth deceleration (Recommended)' },
  { value: 'ease-in-out', label: 'Ease In-Out - Smooth acceleration and deceleration' },
  { value: 'ease-in', label: 'Ease In - Gradual acceleration' },
  { value: 'linear', label: 'Linear - Constant speed' },
  { value: 'cubic-bezier', label: 'Cubic Bezier - Custom curve' },
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

const WallpaperSettingsTab = React.memo(() => {
  // Use consolidated store directly
  const { wallpaper, overlay } = useConsolidatedAppStore();
  const { setWallpaperState, setOverlayState } = useConsolidatedAppStore(state => state.actions);
  
  // Local state for wallpaper management
  const [wallpapers, setWallpapers] = useState([]);
  const [activeWallpaper, setActiveWallpaper] = useState(null);
  const [likedWallpapers, setLikedWallpapers] = useState([]);
  const [selectedWallpaper, setSelectedWallpaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState({});

  // Cycling settings state
  const [cycling, setCycling] = useState(false);
  const [cycleInterval, setCycleInterval] = useState(30);
  const [cycleAnimation, setCycleAnimation] = useState('fade');
  const [slideDirection, setSlideDirection] = useState('right');
  const [crossfadeDuration, setCrossfadeDuration] = useState(1.2);
  const [crossfadeEasing, setCrossfadeEasing] = useState('ease-out');
  const [slideRandomDirection, setSlideRandomDirection] = useState(false);
  const [slideDuration, setSlideDuration] = useState(1.5);
  const [slideEasing, setSlideEasing] = useState('ease-out');

  // Use consolidated store values for wallpaper effects
  const wallpaperOpacity = wallpaper.opacity;
  const wallpaperBlur = wallpaper.blur;

  // Use consolidated store values for overlay effects
  const overlayEnabled = overlay.enabled;
  const overlayEffect = overlay.effect;
  const overlayIntensity = overlay.intensity;
  const overlaySpeed = overlay.speed;
  const overlayWind = overlay.wind;
  const overlayGravity = overlay.gravity;

  // Handlers for wallpaper effects that update consolidated store
  const handleWallpaperOpacityChange = useCallback((value) => {
    setWallpaperState({ opacity: value });
  }, [setWallpaperState]);

  const handleWallpaperBlurChange = useCallback((value) => {
    setWallpaperState({ blur: value });
  }, [setWallpaperState]);

  // Handlers for overlay effects that update consolidated store
  const handleOverlayEnabledChange = useCallback((value) => {
    setOverlayState({ enabled: value });
  }, [setOverlayState]);

  const handleOverlayEffectChange = useCallback((value) => {
    setOverlayState({ effect: value });
  }, [setOverlayState]);

  const handleOverlayIntensityChange = useCallback((value) => {
    setOverlayState({ intensity: value });
  }, [setOverlayState]);

  const handleOverlaySpeedChange = useCallback((value) => {
    setOverlayState({ speed: value });
  }, [setOverlayState]);

  const handleOverlayWindChange = useCallback((value) => {
    setOverlayState({ wind: value });
  }, [setOverlayState]);

  const handleOverlayGravityChange = useCallback((value) => {
    setOverlayState({ gravity: value });
  }, [setOverlayState]);

  // Handlers for cycling settings that update consolidated store
  const handleCyclingChange = useCallback((value) => {
    setWallpaperState({ cycleWallpapers: value });
  }, [setWallpaperState]);

  const handleCycleIntervalChange = useCallback((value) => {
    setWallpaperState({ cycleInterval: value });
  }, [setWallpaperState]);

  const handleCycleAnimationChange = useCallback((value) => {
    setWallpaperState({ cycleAnimation: value });
  }, [setWallpaperState]);

  const handleSlideDirectionChange = useCallback((value) => {
    setWallpaperState({ slideDirection: value });
  }, [setWallpaperState]);

  const handleCrossfadeDurationChange = useCallback((value) => {
    setWallpaperState({ crossfadeDuration: value });
  }, [setWallpaperState]);

  const handleCrossfadeEasingChange = useCallback((value) => {
    setWallpaperState({ crossfadeEasing: value });
  }, [setWallpaperState]);

  const handleSlideRandomDirectionChange = useCallback((value) => {
    setWallpaperState({ slideRandomDirection: value });
  }, [setWallpaperState]);

  const handleSlideDurationChange = useCallback((value) => {
    setWallpaperState({ slideDuration: value });
  }, [setWallpaperState]);

  const handleSlideEasingChange = useCallback((value) => {
    setWallpaperState({ slideEasing: value });
  }, [setWallpaperState]);

  // Load wallpapers from backend
  const loadWallpapers = useCallback(async () => {
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
      // setWallpaperOpacity(typeof data.wallpaperOpacity === 'number' ? data.wallpaperOpacity : 1); // This line is now redundant
      // setWallpaperBlur(data.wallpaperBlur ?? 0); // This line is now redundant

      // Load overlay settings
      // setOverlayEnabled(data.overlayEnabled ?? false); // This line is now redundant
      // setOverlayEffect(data.overlayEffect ?? 'snow'); // This line is now redundant
      // setOverlayIntensity(data.overlayIntensity ?? 50); // This line is now redundant
      // setOverlaySpeed(data.overlaySpeed ?? 1); // This line is now redundant
      // setOverlayWind(data.overlayWind ?? 0.02); // This line is now redundant
      // setOverlayGravity(data.overlayGravity ?? 0.1); // This line is now redundant

      // Update consolidated store with loaded data
      setWallpaperState({
        current: data.wallpaper || null,
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
  }, [setWallpaperState, setOverlayState]);

  // Load wallpapers on component mount
  useEffect(() => {
    loadWallpapers();
  }, [loadWallpapers]);

  // Sync local cycling state with consolidated store
  useEffect(() => {
    setCycling(wallpaper.cycleWallpapers);
    setCycleInterval(wallpaper.cycleInterval);
    setCycleAnimation(wallpaper.cycleAnimation);
    setSlideDirection(wallpaper.slideDirection);
    setCrossfadeDuration(wallpaper.crossfadeDuration);
    setCrossfadeEasing(wallpaper.crossfadeEasing);
    setSlideRandomDirection(wallpaper.slideRandomDirection);
    setSlideDuration(wallpaper.slideDuration);
    setSlideEasing(wallpaper.slideEasing);
  }, [
    wallpaper.cycleWallpapers, wallpaper.cycleInterval, wallpaper.cycleAnimation,
    wallpaper.slideDirection, wallpaper.crossfadeDuration, wallpaper.crossfadeEasing,
    wallpaper.slideRandomDirection, wallpaper.slideDuration, wallpaper.slideEasing
  ]);

  // Upload a new wallpaper
  const handleUpload = useCallback(async () => {
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
  }, [loadWallpapers]);

  // Delete a wallpaper
  const handleDelete = useCallback(async (url) => {
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
  }, [loadWallpapers]);

  // Like/unlike a wallpaper
  const handleLike = useCallback(async (url) => {
    try {
      const result = await api.toggleLike({ url });
      if (!result.success) {
        setMessage({ type: 'error', text: result.error || 'Failed to toggle like.' });
      } else {
        setLikedWallpapers(result.likedWallpapers);
        
        // Immediately update the consolidated store with the new liked wallpapers
        setWallpaperState({
          likedWallpapers: result.likedWallpapers,
        });
        
        setMessage({ type: 'success', text: result.liked ? 'Wallpaper liked!' : 'Wallpaper unliked.' });
        await loadWallpapers();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Like/unlike failed: ' + err.message });
    }
  }, [setWallpaperState, loadWallpapers]);

  // Set as current wallpaper
  const handleSetCurrent = useCallback(async (w) => {
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
  }, [setWallpaperState, loadWallpapers]);

  // Remove current wallpaper (set to default)
  const handleRemoveWallpaper = useCallback(async () => {
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
  }, [setWallpaperState, loadWallpapers]);

  // Save all settings
  const handleSaveAll = useCallback(async () => {
    try {
      // Save wallpaper-specific settings only
      let wallpaperData = await api.get();
      wallpaperData.wallpaperOpacity = wallpaper.opacity; // Use consolidated store value
      wallpaperData.wallpaperBlur = wallpaper.blur; // Use consolidated store value
      wallpaperData.overlayEnabled = overlay.enabled; // Use consolidated store value
      wallpaperData.overlayEffect = overlay.effect; // Use consolidated store value
      wallpaperData.overlayIntensity = overlay.intensity; // Use consolidated store value
      wallpaperData.overlaySpeed = overlay.speed; // Use consolidated store value
      wallpaperData.overlayWind = overlay.wind; // Use consolidated store value
      wallpaperData.overlayGravity = overlay.gravity; // Use consolidated store value
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

      // Update consolidated store with new settings (cycling settings only, effects are already updated)
      setWallpaperState({
        current: selectedWallpaper || null,
        savedWallpapers: wallpapers,
        likedWallpapers: likedWallpapers,
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

      await loadWallpapers();
    } catch (err) {
      setMessage({ type: 'error', text: 'Save failed: ' + err.message });
    }
  }, [
    wallpaper.opacity, wallpaper.blur, overlay.enabled, overlay.effect, overlay.intensity, 
    overlay.speed, overlay.wind, overlay.gravity, selectedWallpaper, cycling, cycleInterval, 
    cycleAnimation, slideDirection, crossfadeDuration, crossfadeEasing, slideRandomDirection, 
    slideDuration, slideEasing, setWallpaperState, loadWallpapers, wallpapers, likedWallpapers
  ]);

  // Set selected wallpaper when wallpapers change
  useEffect(() => {
    setSelectedWallpaper(activeWallpaper);
  }, [activeWallpaper]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Text variant="body">Loading wallpaper settings...</Text>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message.text && (
        <div className={`message ${message.type} mb-4 font-medium p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 
          message.type === 'error' ? 'bg-red-100 text-red-800' : 
          'bg-blue-100 text-blue-800'
        }`}>
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
                  {/* Set as current button */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSetCurrent(wallpaper)}
                    className="mt-1 text-xs px-2 py-1"
                  >
                    Set as Current
                  </Button>
                </div>
              ))}
            </div>
          </>
        }
      />

      {/* Wallpaper Effects Card */}
      <Card
        title="Wallpaper Effects"
        separator
        desc="Adjust the transparency and blur of the wallpaper background."
        actions={
          <>
            <div className="text-[14px] text-gray-600 mt-0">
              <strong>Wallpaper Opacity:</strong> Adjust the transparency of the wallpaper background.
            </div>
            <div className="mt-2.5 flex items-center gap-4">
              <div className="flex-1">
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={wallpaperOpacity}
                  onChange={handleWallpaperOpacityChange}
                />
              </div>
              <span className="min-w-[38px] font-semibold text-gray-500">{Math.round(wallpaperOpacity * 100)}%</span>
            </div>
            <div className="text-[13px] text-gray-400 mt-0.5">Higher transparency makes the wallpaper more see-through. 0% = fully visible, 100% = fully transparent.</div>
            
            <div className="mt-4.5 flex items-center gap-4">
              <div className="flex-1">
                <Slider
                  min={0}
                  max={24}
                  step={0.5}
                  value={wallpaperBlur}
                  onChange={handleWallpaperBlurChange}
                />
              </div>
              <span className="min-w-[38px] font-semibold text-gray-500">{wallpaperBlur}px</span>
            </div>
            <div className="text-[13px] text-gray-400 mt-0.5">Higher blur makes the wallpaper more blurry. 0px = no blur, 24px = very blurry.</div>
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
            onChange={handleCyclingChange}
          />
        }
        actions={
          cycling && (
            <>
              {/* Manual Cycle Button for Testing */}
              <div className="flex items-center gap-4 mb-4">
                <span className="font-medium text-gray-700">Test Cycling</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    // Trigger manual cycle
                    if (window.api?.wallpapers?.cycle) {
                      window.api.wallpapers.cycle();
                    }
                    // Also trigger through the cycling hook if available
                    if (window.cycleToNextWallpaper) {
                      window.cycleToNextWallpaper();
                    }
                  }}
                >
                  Manual Cycle
                </Button>
                <Text variant="small" className="text-gray-500">
                  Test the cycling animation manually
                </Text>
              </div>
              
              <div className="flex items-center gap-4 mt-3.5">
                <span className="font-medium min-w-[120px] text-gray-700">Time per wallpaper</span>
                <div className="w-[70px] mr-2">
                  <WInput
                type="number"
                min={2}
                max={600}
                    value={cycleInterval}
                    onChange={e => handleCycleIntervalChange(Number(e.target.value))}
                    className="text-[15px]"
                  />
                </div>
                <Text variant="small" className="text-gray-500">seconds</Text>
              </div>
              
              <div className="flex items-center gap-4 mt-3.5">
                <span className="font-medium min-w-[120px] text-gray-700">Animation</span>
                <div className="flex-1">
                  <WSelect
                    options={WALLPAPER_ANIMATIONS}
                    value={cycleAnimation}
                    onChange={handleCycleAnimationChange}
                    className="w-full"
                  />
                  <Text variant="small" className="text-gray-500 mt-1">
                    {cycleAnimation === 'fade' && 'Smooth crossfade - best for most wallpapers'}
                    {cycleAnimation === 'slide' && 'Directional slide - good for panoramic images'}
                    {cycleAnimation === 'zoom' && 'Gentle zoom - subtle and elegant'}
                    {cycleAnimation === 'ken-burns' && 'Cinematic effect - dramatic and engaging'}
                    {cycleAnimation === 'morph' && 'Smooth morphing - unique and creative'}
                    {cycleAnimation === 'blur' && 'Blur transition - soft and dreamy'}
                  </Text>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    // Trigger a test cycle to preview the animation
                    if (window.cycleToNextWallpaper) {
                      window.cycleToNextWallpaper();
                    }
                  }}
                  title="Preview animation with current settings"
                >
                  Preview
                </Button>
              </div>
              
              {cycleAnimation === 'slide' && (
                <>
                  <div className="flex items-center gap-4 mt-3.5">
                    <span className="font-medium min-w-[120px] text-gray-700">Slide Direction</span>
                    <div className="flex-1">
                      <WSelect
                        options={SLIDE_DIRECTION_MODE_OPTIONS}
                        value={slideRandomDirection ? 'random' : 'fixed'}
                        onChange={(value) => handleSlideRandomDirectionChange(value === 'random')}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  {!slideRandomDirection && (
                    <div className="flex items-center gap-4 mt-3.5">
                      <span className="font-medium min-w-[120px] text-gray-700">Direction</span>
                      <div className="flex-1">
                        <WSelect
                          options={SLIDE_DIRECTION_OPTIONS}
                          value={slideDirection}
                          onChange={handleSlideDirectionChange}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 mt-3.5">
                    <span className="font-medium min-w-[120px] text-gray-700">Slide Duration</span>
                    <div className="flex-1">
                      <Slider
                        min={0.3}
                        max={2}
                        step={0.1}
                        value={slideDuration}
                        onChange={handleSlideDurationChange}
                      />
                    </div>
                    <span className="min-w-[40px] font-semibold text-gray-500">{slideDuration}s</span>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3.5">
                    <span className="font-medium min-w-[120px] text-gray-700">Slide Easing</span>
                    <div className="flex-1">
                      <WSelect
                        options={EASING_OPTIONS}
                        value={slideEasing}
                        onChange={handleSlideEasingChange}
                        className="w-full"
                      />
                    </div>
                  </div>
                </>
              )}
              
              {cycleAnimation === 'fade' && (
                <>
                  <div className="flex items-center gap-4 mt-3.5">
                    <span className="font-medium min-w-[120px] text-gray-700">Crossfade Duration</span>
                    <div className="flex-1">
                      <Slider
                        min={0.3}
                        max={2}
                        step={0.1}
                        value={crossfadeDuration}
                        onChange={handleCrossfadeDurationChange}
                      />
                    </div>
                    <span className="min-w-[40px] font-semibold text-gray-500">{crossfadeDuration}s</span>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3.5">
                    <span className="font-medium min-w-[120px] text-gray-700">Crossfade Easing</span>
                    <div className="flex-1">
                      <WSelect
                        options={EASING_OPTIONS}
                        value={crossfadeEasing}
                        onChange={handleCrossfadeEasingChange}
                        className="w-full"
                      />
                    </div>
            </div>
                </>
              )}
              
              <div className="text-[13px] text-gray-400 mt-2">
                <strong>Animation Types:</strong> Fade (smooth crossfade), Slide (slide transition), 
                Zoom (zoom effect), Ken Burns (pan and zoom), Dissolve (pixel dissolve), Wipe (clean wipe).
            </div>
          </>
          )
        }
      />

      {/* Wallpaper Overlay Effects Card */}
      <Card
        title="Wallpaper Overlay Effects"
        separator
        desc="Add beautiful animated overlay effects to your wallpaper, like snow, rain, leaves, fireflies, or dust particles."
        headerActions={
          <WToggle
            checked={overlayEnabled}
            onChange={handleOverlayEnabledChange}
          />
        }
        actions={
          overlayEnabled && (
            <>
              <div className="flex items-center gap-4 mt-3.5">
                <span className="font-medium min-w-[120px] text-gray-700">Effect Type</span>
                <div className="flex-1">
                  <WSelect
                    options={OVERLAY_EFFECT_OPTIONS}
                    value={overlayEffect}
                    onChange={handleOverlayEffectChange}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3.5">
                <span className="font-medium min-w-[120px] text-gray-700">Intensity</span>
                <div className="flex-1">
                  <Slider
                  min={10}
                  max={100}
                  step={5}
                    value={overlayIntensity}
                    onChange={handleOverlayIntensityChange}
                />
                </div>
                <span className="min-w-[40px] font-semibold text-gray-500">{overlayIntensity}%</span>
              </div>
              <div className="flex items-center gap-4 mt-3.5">
                <span className="font-medium min-w-[120px] text-gray-700">Speed</span>
                <div className="flex-1">
                  <Slider
                  min={0.1}
                  max={3}
                  step={0.05}
                    value={overlaySpeed}
                    onChange={handleOverlaySpeedChange}
                  />
                </div>
                <span className="min-w-[40px] font-semibold text-gray-500">{overlaySpeed}x</span>
              </div>
              <div className="flex items-center gap-4 mt-3.5">
                <span className="font-medium min-w-[120px] text-gray-700">Wind</span>
                <div className="flex-1">
                  <Slider
                    min={-0.1}
                    max={0.1}
                    step={0.005}
                    value={overlayWind}
                    onChange={handleOverlayWindChange}
                  />
                </div>
                <span className="min-w-[40px] font-semibold text-gray-500">{overlayWind.toFixed(3)}</span>
              </div>
              <div className="flex items-center gap-4 mt-3.5">
                <span className="font-medium min-w-[120px] text-gray-700">Gravity</span>
                <div className="flex-1">
                  <Slider
                    min={-0.2}
                    max={0.5}
                    step={0.01}
                    value={overlayGravity}
                    onChange={handleOverlayGravityChange}
                  />
                </div>
                <span className="min-w-[40px] font-semibold text-gray-500">{overlayGravity.toFixed(2)}</span>
              </div>
              <div className="text-[13px] text-gray-400 mt-2">
                <strong>Effect Types:</strong> Snow (gentle falling snowflakes), Rain (falling raindrops),
                Leaves (floating autumn leaves), Fireflies (glowing particles), Dust (floating dust particles),
                Fire (rising flames).
              </div>
            </>
          )
        }
      />

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button variant="primary" onClick={handleSaveAll}>
          Save All Settings
        </Button>
      </div>
    </div>
  );
});

WallpaperSettingsTab.displayName = 'WallpaperSettingsTab';

export default WallpaperSettingsTab; 