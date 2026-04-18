import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { Heart, Loader2, Trash2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useWeeMotion } from '../../design/weeMotion';
import WToggle from '../../ui/WToggle';
import Text from '../../ui/Text';
import Button from '../../ui/WButton';
import WSelect from '../../ui/WSelect';
import WInput from '../../ui/WInput';
import Slider from '../../ui/Slider';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { WALLPAPER_CHECKERBOARD_BG } from '../../design/runtimeColorStrings.js';
import SettingsWeeSection from './SettingsWeeSection';
import { WeeButton, WeeModalFieldCard } from '../../ui/wee';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import './settings-wee-panels.css';

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
  const { wallpaper, overlay } = useConsolidatedAppStore(
    useShallow((state) => ({
      wallpaper: state.wallpaper,
      overlay: state.overlay,
    }))
  );
  const { setWallpaperState, setOverlayState } = useConsolidatedAppStore(
    useShallow((state) => ({
      setWallpaperState: state.actions.setWallpaperState,
      setOverlayState: state.actions.setOverlayState,
    }))
  );
  
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
  const workspaceBrightness = wallpaper.workspaceBrightness ?? 1;
  const workspaceSaturate = wallpaper.workspaceSaturate ?? 1;
  const gameHubBrightness = wallpaper.gameHubBrightness ?? 0.78;
  const gameHubSaturate = wallpaper.gameHubSaturate ?? 1;

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

  const handleWorkspaceBrightnessChange = useCallback((value) => {
    setWallpaperState({ workspaceBrightness: value });
  }, [setWallpaperState]);

  const handleWorkspaceSaturateChange = useCallback((value) => {
    setWallpaperState({ workspaceSaturate: value });
  }, [setWallpaperState]);

  const handleGameHubBrightnessChange = useCallback((value) => {
    setWallpaperState({ gameHubBrightness: value });
  }, [setWallpaperState]);

  const handleGameHubSaturateChange = useCallback((value) => {
    setWallpaperState({ gameHubSaturate: value });
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
        workspaceBrightness: data.wallpaperWorkspaceBrightness ?? 1,
        workspaceSaturate: data.wallpaperWorkspaceSaturate ?? 1,
        gameHubBrightness: data.wallpaperGameHubBrightness ?? 0.78,
        gameHubSaturate: data.wallpaperGameHubSaturate ?? 1,
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



  // Set selected wallpaper when wallpapers change
  useEffect(() => {
    setSelectedWallpaper(activeWallpaper);
  }, [activeWallpaper]);

  const reduceMotion = useReducedMotion();
  const { tabTransition } = useWeeMotion();

  if (loading) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center p-8">
        <Text variant="body" className="text-[hsl(var(--text-secondary))]">
          Loading wallpaper settings…
        </Text>
      </div>
    );
  }

  return (
    <div className="settings-wee-tab-root pb-12">
      <SettingsTabPageHeader title="Wallpaper" subtitle="Background & cycling" />

      {message.text ? (
        <div
          className={`settings-wee-msg ${
            message.type === 'success'
              ? 'settings-wee-msg--success'
              : message.type === 'error'
                ? 'settings-wee-msg--error'
                : 'settings-wee-msg--info'
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <SettingsWeeSection eyebrow="Library">
        <WeeModalFieldCard hoverAccent="primary" paddingClassName="p-5 md:p-6">
          <Text variant="h3" className="mb-1 playful-hero-text">
            Add to library
          </Text>
          <Text variant="desc" className="mb-5">
            From your computer — JPG, PNG, GIF, MP4, WEBM, and other supported formats.
          </Text>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={uploading}
            className="settings-wee-primary-pill"
          >
            {uploading ? 'Uploading…' : 'Upload wallpaper'}
          </Button>
        </WeeModalFieldCard>

        <WeeModalFieldCard hoverAccent="primary" paddingClassName="p-5 md:p-6">
          <Text variant="h3" className="mb-1 playful-hero-text">
            Saved wallpapers
          </Text>
          <Text variant="desc" className="mb-5">
            Same vibe as Configure Channel — pick a tile, preview it in the hero, then set it as your desktop or
            heart it for cycling.
          </Text>
          <div className="mb-5 flex justify-center py-1">
            <button
              type="button"
              className={`settings-wee-default-wallpaper min-w-[220px] max-w-full text-left ${
                activeWallpaper === null ? 'settings-wee-default-wallpaper--active' : ''
              }`}
              onClick={handleRemoveWallpaper}
            >
              <div
                className="settings-wee-default-wallpaper__swatch"
                style={{
                  background: WALLPAPER_CHECKERBOARD_BG,
                  backgroundSize: '8px 8px',
                  backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                }}
              />
              <div className="min-w-0">
                <div
                  className={`mb-0.5 text-[14px] font-semibold ${
                    activeWallpaper === null ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--text-primary))]'
                  }`}
                >
                  Default background
                </div>
                <div
                  className={`text-xs ${
                    activeWallpaper === null
                      ? 'text-[hsl(var(--primary))]'
                      : 'text-[hsl(var(--text-tertiary))]'
                  }`}
                >
                  {activeWallpaper === null ? 'Currently active' : 'Click to clear wallpaper'}
                </div>
              </div>
            </button>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {selectedWallpaper ? (
              <m.div
                key={selectedWallpaper.url}
                className="settings-wee-wallpaper-hero"
                initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
                transition={tabTransition}
              >
                <div className="settings-wee-wallpaper-hero__row">
                  <div className="settings-wee-wallpaper-hero__frame">
                    <img src={selectedWallpaper.url} alt="" />
                  </div>
                  <div className="settings-wee-wallpaper-hero__meta">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="settings-wee-wallpaper-hero__eyebrow">
                        {activeWallpaper?.url === selectedWallpaper.url ? 'Active asset' : 'Preview'}
                      </span>
                      {activeWallpaper?.url === selectedWallpaper.url ? (
                        <span className="settings-wee-wallpaper-hero__badge">On desktop</span>
                      ) : null}
                    </div>
                    <div className="settings-wee-wallpaper-hero__name">{selectedWallpaper.name}</div>
                  </div>
                  <div className="settings-wee-wallpaper-hero__actions">
                    <WeeButton
                      type="button"
                      variant="primary"
                      className="!px-4 !py-2.5 sm:!px-5 sm:!py-3"
                      disabled={activeWallpaper?.url === selectedWallpaper.url}
                      onClick={() => handleSetCurrent(selectedWallpaper)}
                    >
                      {activeWallpaper?.url === selectedWallpaper.url ? 'On desktop' : 'Set as desktop'}
                    </WeeButton>
                    <WeeButton
                      type="button"
                      variant="secondary"
                      className="!min-w-0 !px-3 !py-2.5 sm:!py-3"
                      title={likedWallpapers.includes(selectedWallpaper.url) ? 'Unlike for cycling' : 'Like for cycling'}
                      aria-label={
                        likedWallpapers.includes(selectedWallpaper.url) ? 'Unlike wallpaper' : 'Like wallpaper'
                      }
                      onClick={() => handleLike(selectedWallpaper.url)}
                    >
                      <Heart
                        size={18}
                        strokeWidth={2.4}
                        className={
                          likedWallpapers.includes(selectedWallpaper.url)
                            ? 'fill-[hsl(var(--state-error))] text-[hsl(var(--state-error))]'
                            : ''
                        }
                        aria-hidden
                      />
                    </WeeButton>
                  </div>
                </div>
              </m.div>
            ) : null}
          </AnimatePresence>

          <p className="settings-wee-subhead !mb-3 !mt-1">Library</p>
          <div className="settings-wee-wallpaper-picker-grid">
            {wallpapers.length === 0 ? (
              <Text variant="help" className="col-span-full text-center">
                No saved wallpapers yet.
              </Text>
            ) : null}
            {wallpapers.map((wallpaper, idx) => {
              const selected = selectedWallpaper && selectedWallpaper.url === wallpaper.url;
              const liked = likedWallpapers.includes(wallpaper.url);
              const onDesktop = activeWallpaper?.url === wallpaper.url;
              return (
                <div
                  key={wallpaper.url || idx}
                  role="button"
                  tabIndex={0}
                  className={[
                    'settings-wee-wallpaper-picker-tile',
                    selected ? 'settings-wee-wallpaper-picker-tile--selected' : '',
                    onDesktop ? 'settings-wee-wallpaper-picker-tile--active-desktop' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-label={`Select wallpaper ${wallpaper.name}`}
                  onClick={() => setSelectedWallpaper(wallpaper)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedWallpaper(wallpaper);
                    }
                  }}
                >
                  <div className="settings-wee-wallpaper-picker-tile__media">
                    <img
                      className="settings-wee-wallpaper-picker-tile__img"
                      src={wallpaper.url}
                      alt=""
                    />
                    {onDesktop ? (
                      <span className="settings-wee-wallpaper-picker-tile__pill">Desktop</span>
                    ) : null}
                    <button
                      type="button"
                      className={`settings-wee-wallpaper-fab settings-wee-wallpaper-fab--bl ${
                        liked ? 'settings-wee-wallpaper-fab--like-on' : ''
                      }`}
                      title={liked ? 'Unlike' : 'Like for cycling'}
                      aria-label={liked ? 'Unlike wallpaper' : 'Like wallpaper'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(wallpaper.url);
                      }}
                    >
                      <Heart size={14} strokeWidth={2.5} className={liked ? 'fill-current' : ''} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="settings-wee-wallpaper-fab settings-wee-wallpaper-fab--br settings-wee-wallpaper-fab--danger"
                      title="Remove from library"
                      aria-label="Remove saved wallpaper"
                      disabled={deleting[wallpaper.url]}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(wallpaper.url);
                      }}
                    >
                      {deleting[wallpaper.url] ? (
                        <Loader2 size={14} className="animate-spin" aria-hidden />
                      ) : (
                        <Trash2 size={14} strokeWidth={2.25} aria-hidden />
                      )}
                    </button>
                  </div>
                  <span className="settings-wee-wallpaper-picker-tile__title" title={wallpaper.name}>
                    {wallpaper.name}
                  </span>
                </div>
              );
            })}
          </div>
        </WeeModalFieldCard>
      </SettingsWeeSection>

      <SettingsWeeSection eyebrow="Wallpaper layer">
        <WeeModalFieldCard hoverAccent="primary" paddingClassName="p-5 md:p-6">
          <Text variant="h3" className="mb-1 playful-hero-text">
            Layer &amp; spaces
          </Text>
          <Text variant="desc" className="mb-4">
            Opacity and blur apply everywhere. Brightness and saturation are per space so you can dim Game Hub and
            tune Home &amp; Workspaces independently.
          </Text>
            <p className="mt-0 mb-3 text-[13px] text-[hsl(var(--text-secondary))]">
              These settings affect the desktop wallpaper layer behind channels and Game Hub.
            </p>

            <h4 className="settings-wee-subhead">Overall</h4>
            <div className="settings-wee-slider-row">
              <label className="settings-wee-slider-row__label" htmlFor="wallpaper-opacity-range">
                Wallpaper opacity
              </label>
              <div className="flex-1 min-w-0">
                <Slider
                  id="wallpaper-opacity-range"
                  aria-label="Wallpaper opacity"
                  min={0}
                  max={1}
                  step={0.01}
                  value={wallpaperOpacity}
                  onChange={handleWallpaperOpacityChange}
                  containerClassName="!mb-0"
                  hideValue
                />
              </div>
              <span className="settings-wee-slider-row__value">{Math.round(wallpaperOpacity * 100)}%</span>
            </div>
            <p className="settings-wee-help mb-4 pl-[156px] max-md:pl-0">
              100% = fully opaque image; lower values let more of the default background show through.
            </p>

            <div className="settings-wee-slider-row">
              <label className="settings-wee-slider-row__label" htmlFor="wallpaper-blur-range">
                Background blur
              </label>
              <div className="flex-1 min-w-0">
                <Slider
                  id="wallpaper-blur-range"
                  aria-label="Background blur"
                  min={0}
                  max={24}
                  step={0.5}
                  value={wallpaperBlur}
                  onChange={handleWallpaperBlurChange}
                  containerClassName="!mb-0"
                  hideValue
                />
              </div>
              <span className="settings-wee-slider-row__value">{wallpaperBlur}px</span>
            </div>
            <p className="settings-wee-help mb-5 pl-[156px] max-md:pl-0">
              Gaussian blur on the wallpaper only (not UI). 0 = sharp, higher = softer.
            </p>

            <h4 className="settings-wee-subhead">Home &amp; Workspaces</h4>
            <div className="settings-wee-slider-row">
              <label className="settings-wee-slider-row__label" htmlFor="wallpaper-ws-brightness-range">
                Brightness
              </label>
              <div className="flex-1 min-w-0">
                <Slider
                  id="wallpaper-ws-brightness-range"
                  aria-label="Home and workspaces wallpaper brightness"
                  min={0.45}
                  max={1.2}
                  step={0.01}
                  value={workspaceBrightness}
                  onChange={handleWorkspaceBrightnessChange}
                  containerClassName="!mb-0"
                  hideValue
                />
              </div>
              <span className="settings-wee-slider-row__value">{workspaceBrightness.toFixed(2)}×</span>
            </div>
            <p className="settings-wee-help mb-3 pl-[156px] max-md:pl-0">
              Darken or brighten the wallpaper behind channel grids. 1.00 = unchanged.
            </p>

            <div className="settings-wee-slider-row">
              <label className="settings-wee-slider-row__label" htmlFor="wallpaper-ws-saturate-range">
                Saturation
              </label>
              <div className="flex-1 min-w-0">
                <Slider
                  id="wallpaper-ws-saturate-range"
                  aria-label="Home and workspaces wallpaper saturation"
                  min={0}
                  max={1.5}
                  step={0.02}
                  value={workspaceSaturate}
                  onChange={handleWorkspaceSaturateChange}
                  containerClassName="!mb-0"
                  hideValue
                />
              </div>
              <span className="settings-wee-slider-row__value">{workspaceSaturate.toFixed(2)}×</span>
            </div>
            <p className="settings-wee-help mb-5 pl-[156px] max-md:pl-0">
              1.00 = natural color; lower approaches grayscale; above 1 boosts vividness.
            </p>

            <h4 className="settings-wee-subhead">Game Hub</h4>
            <div className="settings-wee-slider-row">
              <label className="settings-wee-slider-row__label" htmlFor="wallpaper-gh-brightness-range">
                Brightness
              </label>
              <div className="flex-1 min-w-0">
                <Slider
                  id="wallpaper-gh-brightness-range"
                  aria-label="Game Hub wallpaper brightness"
                  min={0.45}
                  max={1.2}
                  step={0.01}
                  value={gameHubBrightness}
                  onChange={handleGameHubBrightnessChange}
                  containerClassName="!mb-0"
                  hideValue
                />
              </div>
              <span className="settings-wee-slider-row__value">{gameHubBrightness.toFixed(2)}×</span>
            </div>
            <p className="settings-wee-help mb-3 pl-[156px] max-md:pl-0">
              Default ~0.78 matched the previous Game Hub dim. Raise for a brighter hero backdrop.
            </p>

            <div className="settings-wee-slider-row">
              <label className="settings-wee-slider-row__label" htmlFor="wallpaper-gh-saturate-range">
                Saturation
              </label>
              <div className="flex-1 min-w-0">
                <Slider
                  id="wallpaper-gh-saturate-range"
                  aria-label="Game Hub wallpaper saturation"
                  min={0}
                  max={1.5}
                  step={0.02}
                  value={gameHubSaturate}
                  onChange={handleGameHubSaturateChange}
                  containerClassName="!mb-0"
                  hideValue
                />
              </div>
              <span className="settings-wee-slider-row__value">{gameHubSaturate.toFixed(2)}×</span>
            </div>
            <p className="settings-wee-help pl-[156px] max-md:pl-0">
              Pairs with brightness to keep artwork readable behind Game Hub cards.
            </p>
        </WeeModalFieldCard>
      </SettingsWeeSection>

      <SettingsWeeSection eyebrow="Cycling">
        <WeeModalFieldCard hoverAccent="primary" paddingClassName="p-5 md:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Text variant="h3" className="mb-1 playful-hero-text">
                Liked-wallpaper cycling
              </Text>
              <Text variant="desc" className="!m-0">
                Rotate through liked wallpapers on an interval. Only applies when cycling is enabled.
              </Text>
            </div>
            <WToggle checked={cycling} onChange={handleCyclingChange} disableLabelClick title="Enable automatic cycling" />
          </div>
          {cycling ? (
            <>
              <div className="settings-wee-field-row mb-4">
                <span className="settings-wee-field-row__label">Try it</span>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    rounded
                    onClick={() => {
                      if (window.api?.wallpapers?.cycle) {
                        window.api.wallpapers.cycle();
                      }
                      if (window.cycleToNextWallpaper) {
                        window.cycleToNextWallpaper();
                      }
                    }}
                  >
                    Manual cycle
                  </Button>
                  <Text variant="small" className="!m-0 text-[hsl(var(--text-tertiary))]">
                    Fire one advance with your current animation settings.
                  </Text>
                </div>
              </div>

              <div className="settings-wee-slider-row">
                <span className="settings-wee-slider-row__label">Interval</span>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-[4.5rem]">
                    <WInput
                      type="number"
                      min={2}
                      max={600}
                      value={cycleInterval}
                      onChange={(e) => handleCycleIntervalChange(Number(e.target.value))}
                      className="text-[15px]"
                    />
                  </div>
                  <Text variant="small" className="text-[hsl(var(--text-tertiary))]">
                    seconds per wallpaper
                  </Text>
                </div>
              </div>

              <div className="settings-wee-slider-row items-start">
                <span className="settings-wee-slider-row__label pt-1">Animation</span>
                <div className="min-w-0 flex-1">
                  <WSelect
                    options={WALLPAPER_ANIMATIONS}
                    value={cycleAnimation}
                    onChange={handleCycleAnimationChange}
                    className="w-full"
                  />
                  <Text variant="small" className="mt-1 text-[hsl(var(--text-tertiary))]">
                    {cycleAnimation === 'fade' && 'Smooth crossfade — best for most wallpapers'}
                    {cycleAnimation === 'slide' && 'Directional slide — good for panoramas'}
                    {cycleAnimation === 'zoom' && 'Gentle zoom — subtle and calm'}
                    {cycleAnimation === 'ken-burns' && 'Cinematic pan and zoom'}
                    {cycleAnimation === 'morph' && 'Shape-style blend transition'}
                    {cycleAnimation === 'blur' && 'Soft blur-based blend'}
                  </Text>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  rounded
                  onClick={() => {
                    if (window.cycleToNextWallpaper) {
                      window.cycleToNextWallpaper();
                    }
                  }}
                  title="Preview animation with current settings"
                >
                  Preview
                </Button>
              </div>

              {cycleAnimation === 'slide' ? (
                <>
                  <div className="settings-wee-slider-row">
                    <span className="settings-wee-slider-row__label">Slide mode</span>
                    <div className="min-w-0 flex-1">
                      <WSelect
                        options={SLIDE_DIRECTION_MODE_OPTIONS}
                        value={slideRandomDirection ? 'random' : 'fixed'}
                        onChange={(value) => handleSlideRandomDirectionChange(value === 'random')}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {!slideRandomDirection ? (
                    <div className="settings-wee-slider-row">
                      <span className="settings-wee-slider-row__label">Direction</span>
                      <div className="min-w-0 flex-1">
                        <WSelect
                          options={SLIDE_DIRECTION_OPTIONS}
                          value={slideDirection}
                          onChange={handleSlideDirectionChange}
                          className="w-full"
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="settings-wee-slider-row">
                    <span className="settings-wee-slider-row__label">Slide duration</span>
                    <div className="min-w-0 flex-1">
                      <Slider
                        min={0.3}
                        max={2}
                        step={0.1}
                        value={slideDuration}
                        onChange={handleSlideDurationChange}
                        containerClassName="!mb-0"
                        hideValue
                      />
                    </div>
                    <span className="settings-wee-slider-row__value">{slideDuration}s</span>
                  </div>

                  <div className="settings-wee-slider-row">
                    <span className="settings-wee-slider-row__label">Slide easing</span>
                    <div className="min-w-0 flex-1">
                      <WSelect
                        options={EASING_OPTIONS}
                        value={slideEasing}
                        onChange={handleSlideEasingChange}
                        className="w-full"
                      />
                    </div>
                  </div>
                </>
              ) : null}

              {cycleAnimation === 'fade' ? (
                <>
                  <div className="settings-wee-slider-row">
                    <span className="settings-wee-slider-row__label">Crossfade duration</span>
                    <div className="min-w-0 flex-1">
                      <Slider
                        min={0.3}
                        max={2}
                        step={0.1}
                        value={crossfadeDuration}
                        onChange={handleCrossfadeDurationChange}
                        containerClassName="!mb-0"
                        hideValue
                      />
                    </div>
                    <span className="settings-wee-slider-row__value">{crossfadeDuration}s</span>
                  </div>

                  <div className="settings-wee-slider-row">
                    <span className="settings-wee-slider-row__label">Crossfade easing</span>
                    <div className="min-w-0 flex-1">
                      <WSelect
                        options={EASING_OPTIONS}
                        value={crossfadeEasing}
                        onChange={handleCrossfadeEasingChange}
                        className="w-full"
                      />
                    </div>
                  </div>
                </>
              ) : null}

              <p className="settings-wee-help !mb-0 mt-2">
                Fade, slide, zoom, Ken Burns, morph, and blur transitions use the same liked set — tune the interval
                so cycling stays gentle on slower machines.
              </p>
            </>
          ) : null}
        </WeeModalFieldCard>
      </SettingsWeeSection>

      <SettingsWeeSection eyebrow="Overlay">
        <WeeModalFieldCard hoverAccent="discovery" paddingClassName="p-5 md:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Text variant="h3" className="mb-1 playful-hero-text">
                Particle overlay
              </Text>
              <Text variant="desc" className="!m-0">
                Optional snow, rain, leaves, fireflies, dust, or fire — drawn above the wallpaper, under the UI.
              </Text>
            </div>
            <WToggle
              checked={overlayEnabled}
              onChange={handleOverlayEnabledChange}
              disableLabelClick
              title="Toggle animated particles over the wallpaper"
            />
          </div>
          {overlayEnabled ? (
            <>
              <div className="settings-wee-slider-row items-start">
                <label className="settings-wee-slider-row__label pt-1" htmlFor="wallpaper-overlay-effect">
                  Effect
                </label>
                <div className="min-w-0 flex-1">
                  <WSelect
                    id="wallpaper-overlay-effect"
                    options={OVERLAY_EFFECT_OPTIONS}
                    value={overlayEffect}
                    onChange={handleOverlayEffectChange}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="settings-wee-slider-row">
                <label className="settings-wee-slider-row__label" htmlFor="wallpaper-overlay-intensity">
                  Intensity
                </label>
                <div className="min-w-0 flex-1">
                  <Slider
                    id="wallpaper-overlay-intensity"
                    aria-label="Particle overlay intensity"
                    min={10}
                    max={100}
                    step={5}
                    value={overlayIntensity}
                    onChange={handleOverlayIntensityChange}
                    containerClassName="!mb-0"
                    hideValue
                  />
                </div>
                <span className="settings-wee-slider-row__value">{overlayIntensity}%</span>
              </div>
              <div className="settings-wee-slider-row">
                <label className="settings-wee-slider-row__label" htmlFor="wallpaper-overlay-speed">
                  Speed
                </label>
                <div className="min-w-0 flex-1">
                  <Slider
                    id="wallpaper-overlay-speed"
                    aria-label="Particle overlay speed"
                    min={0.1}
                    max={3}
                    step={0.05}
                    value={overlaySpeed}
                    onChange={handleOverlaySpeedChange}
                    containerClassName="!mb-0"
                    hideValue
                  />
                </div>
                <span className="settings-wee-slider-row__value">{overlaySpeed}x</span>
              </div>
              <div className="settings-wee-slider-row">
                <label className="settings-wee-slider-row__label" htmlFor="wallpaper-overlay-wind">
                  Wind
                </label>
                <div className="min-w-0 flex-1">
                  <Slider
                    id="wallpaper-overlay-wind"
                    aria-label="Particle overlay wind"
                    min={-0.1}
                    max={0.1}
                    step={0.005}
                    value={overlayWind}
                    onChange={handleOverlayWindChange}
                    containerClassName="!mb-0"
                    hideValue
                  />
                </div>
                <span className="settings-wee-slider-row__value">{overlayWind.toFixed(3)}</span>
              </div>
              <div className="settings-wee-slider-row">
                <label className="settings-wee-slider-row__label" htmlFor="wallpaper-overlay-gravity">
                  Gravity
                </label>
                <div className="min-w-0 flex-1">
                  <Slider
                    id="wallpaper-overlay-gravity"
                    aria-label="Particle overlay gravity"
                    min={-0.2}
                    max={0.5}
                    step={0.01}
                    value={overlayGravity}
                    onChange={handleOverlayGravityChange}
                    containerClassName="!mb-0"
                    hideValue
                  />
                </div>
                <span className="settings-wee-slider-row__value">{overlayGravity.toFixed(2)}</span>
              </div>
              <p className="settings-wee-help !mb-0 mt-1">
                Heavier overlays cost more GPU — lower intensity on laptops or when many channels are visible.
              </p>
            </>
          ) : null}
        </WeeModalFieldCard>
      </SettingsWeeSection>

    </div>
  );
});

WallpaperSettingsTab.displayName = 'WallpaperSettingsTab';

export default WallpaperSettingsTab; 