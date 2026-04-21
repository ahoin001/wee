import React, { useState, useEffect, useCallback } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { useWeeMotion } from '../../design/weeMotion';
import Text from '../../ui/Text';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { captureSpaceAppearanceFromState } from '../../utils/appearance/spaceAppearance';
import { normalizeWallpaperForStore, wallpaperEntryUrlKey } from '../../utils/wallpaperShape';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import { WeeSpaceRailPillButton } from '../../ui/wee';
import WallpaperLibrarySection from './wallpaper/WallpaperLibrarySection';
import SpaceWallpaperAppearanceSection from './wallpaper/SpaceWallpaperAppearanceSection';
import WallpaperCyclingSection from './wallpaper/WallpaperCyclingSection';
import WallpaperOverlaySection from './wallpaper/WallpaperOverlaySection';
import {
  SPACE_WALLPAPER_OPTIONS,
} from './wallpaper/wallpaperSettingsConstants';
import './settings-wee-panels.css';

const api = window.api?.wallpapers || {};
const selectFile = window.api?.selectWallpaperFile;

function useWallpaperSettingsController() {
  // Use consolidated store directly
  const { wallpaper, overlay, appearanceBySpace, activeSpaceId } = useConsolidatedAppStore(
    useShallow((state) => ({
      wallpaper: state.wallpaper,
      overlay: state.overlay,
      appearanceBySpace: state.appearanceBySpace,
      activeSpaceId: state.spaces.activeSpaceId,
    }))
  );
  const { setWallpaperState, setOverlayState, setAppearanceBySpaceState } = useConsolidatedAppStore(
    useShallow((state) => ({
      setWallpaperState: state.actions.setWallpaperState,
      setOverlayState: state.actions.setOverlayState,
      setAppearanceBySpaceState: state.actions.setAppearanceBySpaceState,
    }))
  );
  
  // Local state for wallpaper management
  const [wallpapers, setWallpapers] = useState([]);
  const [activeWallpaper, setActiveWallpaper] = useState(null);
  const [likedWallpapers, setLikedWallpapers] = useState([]);
  const [selectedWallpaper, setSelectedWallpaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState({});
  const [selectedSpaceId, setSelectedSpaceId] = useState(activeSpaceId || 'home');

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
  const selectedSpaceAppearance = appearanceBySpace?.[selectedSpaceId]?.wallpaper || {};
  const selectedSpaceUsesGlobalWallpaper = selectedSpaceAppearance.useGlobalWallpaper !== false;
  const selectedSpaceWallpaperUrl =
    typeof selectedSpaceAppearance.spaceWallpaperUrl === 'string'
      ? selectedSpaceAppearance.spaceWallpaperUrl
      : null;
  const selectedSpaceWallpaperEntry = selectedSpaceWallpaperUrl
    ? wallpapers.find((w) => w?.url === selectedSpaceWallpaperUrl) || null
    : null;
  /** Home is the global desktop wallpaper; do not read stale `appearanceBySpace.home` overrides for active URL. */
  const effectiveActiveWallpaperUrl =
    selectedSpaceId === 'home'
      ? wallpaperEntryUrlKey(wallpaper.current) || null
      : selectedSpaceUsesGlobalWallpaper
        ? wallpaperEntryUrlKey(wallpaper.current) || null
        : selectedSpaceWallpaperUrl;
  const selectedSpaceLabel =
    SPACE_WALLPAPER_OPTIONS.find((space) => space.id === selectedSpaceId)?.label || 'Space';
  const selectedSpaceBrightness =
    typeof selectedSpaceAppearance.spaceBrightness === 'number'
      ? selectedSpaceAppearance.spaceBrightness
      : selectedSpaceId === 'gamehub' || selectedSpaceId === 'mediahub'
        ? gameHubBrightness
        : workspaceBrightness;
  const selectedSpaceBlur =
    typeof selectedSpaceAppearance.spaceBlur === 'number'
      ? selectedSpaceAppearance.spaceBlur
      : wallpaperBlur;
  const selectedSpaceSaturate =
    typeof selectedSpaceAppearance.spaceSaturate === 'number'
      ? selectedSpaceAppearance.spaceSaturate
      : selectedSpaceId === 'gamehub' || selectedSpaceId === 'mediahub'
        ? gameHubSaturate
        : workspaceSaturate;

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

  const updateSpaceWallpaperAppearance = useCallback((spaceId, patch) => {
    const state = useConsolidatedAppStore.getState();
    const currentSnapshot = state.appearanceBySpace?.[spaceId] ?? captureSpaceAppearanceFromState(state);
    setAppearanceBySpaceState({
      [spaceId]: {
        ...currentSnapshot,
        wallpaper: {
          ...(currentSnapshot.wallpaper || {}),
          ...patch,
        },
      },
    });
  }, [setAppearanceBySpaceState]);

  const handleSelectedSpaceBrightnessChange = useCallback((value) => {
    updateSpaceWallpaperAppearance(selectedSpaceId, { spaceBrightness: value });
    if (selectedSpaceId === 'gamehub' || selectedSpaceId === 'mediahub') {
      setWallpaperState({ gameHubBrightness: value });
    } else {
      setWallpaperState({ workspaceBrightness: value });
    }
  }, [selectedSpaceId, setWallpaperState, updateSpaceWallpaperAppearance]);

  const handleSelectedSpaceSaturateChange = useCallback((value) => {
    updateSpaceWallpaperAppearance(selectedSpaceId, { spaceSaturate: value });
    if (selectedSpaceId === 'gamehub' || selectedSpaceId === 'mediahub') {
      setWallpaperState({ gameHubSaturate: value });
    } else {
      setWallpaperState({ workspaceSaturate: value });
    }
  }, [selectedSpaceId, setWallpaperState, updateSpaceWallpaperAppearance]);

  const handleSelectedSpaceBlurChange = useCallback((value) => {
    updateSpaceWallpaperAppearance(selectedSpaceId, { spaceBlur: value });
    if (selectedSpaceId === 'home') {
      setWallpaperState({ blur: value });
    }
  }, [selectedSpaceId, setWallpaperState, updateSpaceWallpaperAppearance]);

  const handleSelectedSpaceUseGlobalWallpaperChange = useCallback((nextValue) => {
    updateSpaceWallpaperAppearance(selectedSpaceId, { useGlobalWallpaper: nextValue });
  }, [selectedSpaceId, updateSpaceWallpaperAppearance]);

  const handleSelectedSpaceWallpaperOverride = useCallback((url) => {
    updateSpaceWallpaperAppearance(selectedSpaceId, {
      useGlobalWallpaper: false,
      spaceWallpaperUrl: url || null,
    });
  }, [selectedSpaceId, updateSpaceWallpaperAppearance]);

  const handleResetSelectedSpaceAppearance = useCallback(() => {
    const isHubSpace = selectedSpaceId === 'gamehub' || selectedSpaceId === 'mediahub';
    const resetBrightness = isHubSpace ? 0.78 : 1;
    const resetSaturate = 1;
    updateSpaceWallpaperAppearance(selectedSpaceId, {
      useGlobalWallpaper: true,
      spaceWallpaperUrl: null,
      spaceBlur: 0,
      spaceBrightness: resetBrightness,
      spaceSaturate: resetSaturate,
    });

    if (isHubSpace) {
      setWallpaperState({
        gameHubBrightness: resetBrightness,
        gameHubSaturate: resetSaturate,
      });
      return;
    }
    setWallpaperState({
      workspaceBrightness: resetBrightness,
      workspaceSaturate: resetSaturate,
    });
  }, [selectedSpaceId, setWallpaperState, updateSpaceWallpaperAppearance]);

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
  const loadWallpapers = useCallback(async ({ showLoading = true, clearMessage = true } = {}) => {
    if (showLoading) {
      setLoading(true);
    }
    if (clearMessage) {
      setMessage({ type: '', text: '' });
    }
    try {
      const data = await api.get();
      const prevW = useConsolidatedAppStore.getState().wallpaper;
      const prevO = useConsolidatedAppStore.getState().overlay;
      const c = data.cyclingSettings || {};

      const num = (v, fallback) => (typeof v === 'number' && !Number.isNaN(v) ? v : fallback);
      const bool = (v, fallback) => (typeof v === 'boolean' ? v : fallback);
      const str = (v, fallback) => (typeof v === 'string' && v.length ? v : fallback);
      const savedFromFile = Array.isArray(data.savedWallpapers) ? data.savedWallpapers : [];

      // Prefer the live store current wallpaper over wallpapers.json when available.
      // wallpapers.json can be stale relative to unified settings during rapid transitions.
      const effectiveCurrentWallpaper =
        normalizeWallpaperForStore(prevW.current, { savedWallpapers: savedFromFile }) ||
        normalizeWallpaperForStore(data.wallpaper, { savedWallpapers: savedFromFile });

      setWallpapers(savedFromFile);
      setActiveWallpaper(effectiveCurrentWallpaper || null);
      setLikedWallpapers(data.likedWallpapers || []);

      const mergedCycleEnabled = bool(c.enabled, prevW.cycleWallpapers);
      const mergedInterval = num(c.interval, prevW.cycleInterval);
      const mergedAnimation = str(c.animation, prevW.cycleAnimation);
      const mergedSlideDir = str(c.slideDirection, prevW.slideDirection);
      const mergedCfDur = num(c.crossfadeDuration, prevW.crossfadeDuration);
      const mergedCfEase = str(c.crossfadeEasing, prevW.crossfadeEasing);
      const mergedSlideRand = bool(c.slideRandomDirection, prevW.slideRandomDirection);
      const mergedSlideDur = num(c.slideDuration, prevW.slideDuration);
      const mergedSlideEase = str(c.slideEasing, prevW.slideEasing);

      setCycling(mergedCycleEnabled);
      setCycleInterval(mergedInterval);
      setCycleAnimation(mergedAnimation);
      setSlideDirection(mergedSlideDir);
      setCrossfadeDuration(mergedCfDur);
      setCrossfadeEasing(mergedCfEase);
      setSlideRandomDirection(mergedSlideRand);
      setSlideDuration(mergedSlideDur);
      setSlideEasing(mergedSlideEase);

      // Merge with current store when `wallpapers.json` omits fields (avoids clobbering unified store / session state).
      setWallpaperState({
        current: effectiveCurrentWallpaper || null,
        savedWallpapers: savedFromFile,
        likedWallpapers: data.likedWallpapers || [],
        opacity: num(data.wallpaperOpacity, prevW.opacity),
        blur: num(data.wallpaperBlur, prevW.blur),
        // Keep tone values store-first; wallpapers.json can lag unified settings.
        workspaceBrightness: prevW.workspaceBrightness ?? 1,
        workspaceSaturate: prevW.workspaceSaturate ?? 1,
        gameHubBrightness: prevW.gameHubBrightness ?? 0.78,
        gameHubSaturate: prevW.gameHubSaturate ?? 1,
        cycleWallpapers: mergedCycleEnabled,
        cycleInterval: mergedInterval,
        cycleAnimation: mergedAnimation,
        slideDirection: mergedSlideDir,
        crossfadeDuration: mergedCfDur,
        crossfadeEasing: mergedCfEase,
        slideRandomDirection: mergedSlideRand,
        slideDuration: mergedSlideDur,
        slideEasing: mergedSlideEase,
      });

      setOverlayState({
        enabled: bool(data.overlayEnabled, prevO.enabled),
        effect: str(data.overlayEffect, prevO.effect),
        intensity: num(data.overlayIntensity, prevO.intensity),
        speed: num(data.overlaySpeed, prevO.speed),
        wind: num(data.overlayWind, prevO.wind),
        gravity: num(data.overlayGravity, prevO.gravity),
      });

      // Persisted hygiene: Home image is always the global active wallpaper; legacy per-space overrides caused drift.
      const homeWp = useConsolidatedAppStore.getState().appearanceBySpace?.home?.wallpaper;
      if (
        homeWp &&
        (homeWp.useGlobalWallpaper === false ||
          (typeof homeWp.spaceWallpaperUrl === 'string' && homeWp.spaceWallpaperUrl.length > 0))
      ) {
        updateSpaceWallpaperAppearance('home', {
          useGlobalWallpaper: true,
          spaceWallpaperUrl: null,
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load wallpapers: ' + err.message });
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      setHasLoadedOnce(true);
    }
  }, [setWallpaperState, setOverlayState, updateSpaceWallpaperAppearance]);

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
      await loadWallpapers({ showLoading: false, clearMessage: false });
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
        await loadWallpapers({ showLoading: false, clearMessage: false });
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
        await loadWallpapers({ showLoading: false, clearMessage: false });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Like/unlike failed: ' + err.message });
    }
  }, [setWallpaperState, loadWallpapers]);

  // Set wallpaper for selected space
  const handleSetCurrent = useCallback(async (w) => {
    if (selectedSpaceId !== 'home') {
      updateSpaceWallpaperAppearance(selectedSpaceId, {
        useGlobalWallpaper: false,
        spaceWallpaperUrl: w?.url || null,
      });
      setMessage({ type: 'success', text: `${selectedSpaceLabel} wallpaper updated.` });
      return;
    }
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
        updateSpaceWallpaperAppearance('home', {
          useGlobalWallpaper: true,
          spaceWallpaperUrl: null,
        });
        
        setMessage({ type: 'success', text: 'Wallpaper set as current.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Set wallpaper failed: ' + err.message });
    }
  }, [selectedSpaceId, selectedSpaceLabel, setWallpaperState, updateSpaceWallpaperAppearance]);

  // Remove wallpaper for selected space
  const handleRemoveWallpaper = useCallback(async () => {
    if (selectedSpaceId !== 'home') {
      updateSpaceWallpaperAppearance(selectedSpaceId, {
        useGlobalWallpaper: true,
        spaceWallpaperUrl: null,
      });
      setMessage({ type: 'success', text: `${selectedSpaceLabel} now uses Home wallpaper.` });
      return;
    }
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
        updateSpaceWallpaperAppearance('home', {
          useGlobalWallpaper: true,
          spaceWallpaperUrl: null,
        });
        
        setMessage({ type: 'success', text: 'Wallpaper removed. Back to default background.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Remove wallpaper failed: ' + err.message });
    }
  }, [selectedSpaceId, selectedSpaceLabel, setWallpaperState, updateSpaceWallpaperAppearance]);



  // Set selected wallpaper when wallpapers change
  useEffect(() => {
    setSelectedWallpaper(activeWallpaper);
  }, [activeWallpaper]);

  useEffect(() => {
    if (!activeSpaceId) return;
    setSelectedSpaceId(activeSpaceId);
  }, [activeSpaceId]);

  return {
    loading,
    hasLoadedOnce,
    message,
    uploading,
    handleUpload,
    activeWallpaper,
    handleRemoveWallpaper,
    selectedWallpaper,
    likedWallpapers,
    handleLike,
    handleSetCurrent,
    wallpapers,
    setSelectedWallpaper,
    deleting,
    handleDelete,
    wallpaperOpacity,
    wallpaperBlur,
    handleWallpaperOpacityChange,
    handleWallpaperBlurChange,
    selectedSpaceId,
    setSelectedSpaceId,
    selectedSpaceLabel,
    selectedSpaceUsesGlobalWallpaper,
    handleSelectedSpaceUseGlobalWallpaperChange,
    handleSelectedSpaceWallpaperOverride,
    selectedSpaceWallpaperEntry,
    selectedSpaceWallpaperUrl,
    effectiveActiveWallpaperUrl,
    selectedSpaceBrightness,
    selectedSpaceBlur,
    handleSelectedSpaceBlurChange,
    handleSelectedSpaceBrightnessChange,
    selectedSpaceSaturate,
    handleSelectedSpaceSaturateChange,
    handleResetSelectedSpaceAppearance,
    cycling,
    handleCyclingChange,
    cycleInterval,
    handleCycleIntervalChange,
    cycleAnimation,
    handleCycleAnimationChange,
    slideRandomDirection,
    handleSlideRandomDirectionChange,
    slideDirection,
    handleSlideDirectionChange,
    slideDuration,
    handleSlideDurationChange,
    slideEasing,
    handleSlideEasingChange,
    crossfadeDuration,
    handleCrossfadeDurationChange,
    crossfadeEasing,
    handleCrossfadeEasingChange,
    overlayEnabled,
    handleOverlayEnabledChange,
    overlayEffect,
    handleOverlayEffectChange,
    overlayIntensity,
    handleOverlayIntensityChange,
    overlaySpeed,
    handleOverlaySpeedChange,
    overlayWind,
    handleOverlayWindChange,
    overlayGravity,
    handleOverlayGravityChange,
  };
}

const WallpaperSettingsTab = React.memo(() => {
  const controller = useWallpaperSettingsController();
  const reduceMotion = useReducedMotion();
  const { tabTransition } = useWeeMotion();
  const {
    loading,
    hasLoadedOnce,
    message,
    uploading,
    handleUpload,
    activeWallpaper,
    handleRemoveWallpaper,
    selectedWallpaper,
    likedWallpapers,
    handleLike,
    handleSetCurrent,
    wallpapers,
    setSelectedWallpaper,
    deleting,
    handleDelete,
    wallpaperOpacity,
    wallpaperBlur,
    handleWallpaperOpacityChange,
    handleWallpaperBlurChange,
    selectedSpaceId,
    setSelectedSpaceId,
    selectedSpaceLabel,
    selectedSpaceUsesGlobalWallpaper,
    handleSelectedSpaceUseGlobalWallpaperChange,
    handleSelectedSpaceWallpaperOverride,
    selectedSpaceWallpaperEntry,
    selectedSpaceWallpaperUrl,
    effectiveActiveWallpaperUrl,
    selectedSpaceBrightness,
    selectedSpaceBlur,
    handleSelectedSpaceBlurChange,
    handleSelectedSpaceBrightnessChange,
    selectedSpaceSaturate,
    handleSelectedSpaceSaturateChange,
    handleResetSelectedSpaceAppearance,
    cycling,
    handleCyclingChange,
    cycleInterval,
    handleCycleIntervalChange,
    cycleAnimation,
    handleCycleAnimationChange,
    slideRandomDirection,
    handleSlideRandomDirectionChange,
    slideDirection,
    handleSlideDirectionChange,
    slideDuration,
    handleSlideDurationChange,
    slideEasing,
    handleSlideEasingChange,
    crossfadeDuration,
    handleCrossfadeDurationChange,
    crossfadeEasing,
    handleCrossfadeEasingChange,
    overlayEnabled,
    handleOverlayEnabledChange,
    overlayEffect,
    handleOverlayEffectChange,
    overlayIntensity,
    handleOverlayIntensityChange,
    overlaySpeed,
    handleOverlaySpeedChange,
    overlayWind,
    handleOverlayWindChange,
    overlayGravity,
    handleOverlayGravityChange,
  } = controller;
  const isHomeSpace = selectedSpaceId === 'home';

  if (loading && !hasLoadedOnce) {
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

      <div className="settings-wee-sticky-step-bar">
        <div className="mb-2 flex items-center justify-between gap-3">
          <Text variant="small" className="!m-0 font-bold uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
            1. Space
          </Text>
          <Text variant="small" className="!m-0 text-[hsl(var(--text-tertiary))]">
            2. Wallpaper  3. Controls
          </Text>
        </div>
        <div className="flex flex-wrap gap-2">
          {SPACE_WALLPAPER_OPTIONS.map((space) => (
            <WeeSpaceRailPillButton
              key={space.id}
              type="button"
              size="sm"
              active={selectedSpaceId === space.id}
              onClick={() => setSelectedSpaceId(space.id)}
            >
              {space.label}
            </WeeSpaceRailPillButton>
          ))}
        </div>
      </div>

      <WallpaperLibrarySection
        selectedSpaceLabel={selectedSpaceLabel}
        isHomeSpace={isHomeSpace}
        selectedSpaceUsesGlobalWallpaper={selectedSpaceUsesGlobalWallpaper}
        uploading={uploading}
        handleUpload={handleUpload}
        effectiveActiveWallpaperUrl={effectiveActiveWallpaperUrl}
        handleRemoveWallpaper={handleRemoveWallpaper}
        selectedWallpaper={selectedWallpaper}
        reduceMotion={reduceMotion}
        tabTransition={tabTransition}
        likedWallpapers={likedWallpapers}
        handleLike={handleLike}
        handleSetCurrent={handleSetCurrent}
        wallpapers={wallpapers}
        setSelectedWallpaper={setSelectedWallpaper}
        deleting={deleting}
        handleDelete={handleDelete}
      />

      <SpaceWallpaperAppearanceSection
        wallpaperOpacity={wallpaperOpacity}
        wallpaperBlur={wallpaperBlur}
        handleWallpaperOpacityChange={handleWallpaperOpacityChange}
        handleWallpaperBlurChange={handleWallpaperBlurChange}
        selectedSpaceId={selectedSpaceId}
        setSelectedSpaceId={setSelectedSpaceId}
        reduceMotion={reduceMotion}
        tabTransition={tabTransition}
        selectedSpaceLabel={selectedSpaceLabel}
        selectedSpaceUsesGlobalWallpaper={selectedSpaceUsesGlobalWallpaper}
        handleSelectedSpaceUseGlobalWallpaperChange={handleSelectedSpaceUseGlobalWallpaperChange}
        selectedWallpaper={selectedWallpaper}
        handleSelectedSpaceWallpaperOverride={handleSelectedSpaceWallpaperOverride}
        selectedSpaceWallpaperEntry={selectedSpaceWallpaperEntry}
        selectedSpaceWallpaperUrl={selectedSpaceWallpaperUrl}
        selectedSpaceBlur={selectedSpaceBlur}
        handleSelectedSpaceBlurChange={handleSelectedSpaceBlurChange}
        selectedSpaceBrightness={selectedSpaceBrightness}
        handleSelectedSpaceBrightnessChange={handleSelectedSpaceBrightnessChange}
        selectedSpaceSaturate={selectedSpaceSaturate}
        handleSelectedSpaceSaturateChange={handleSelectedSpaceSaturateChange}
        handleResetSelectedSpaceAppearance={handleResetSelectedSpaceAppearance}
        showSpaceSelector={false}
        showGlobalOpacity={isHomeSpace}
        showWallpaperSourceSection={!isHomeSpace}
      />

      {isHomeSpace ? (
        <>
          <WallpaperCyclingSection
            cycling={cycling}
            handleCyclingChange={handleCyclingChange}
            reduceMotion={reduceMotion}
            tabTransition={tabTransition}
            cycleInterval={cycleInterval}
            handleCycleIntervalChange={handleCycleIntervalChange}
            cycleAnimation={cycleAnimation}
            handleCycleAnimationChange={handleCycleAnimationChange}
            slideRandomDirection={slideRandomDirection}
            handleSlideRandomDirectionChange={handleSlideRandomDirectionChange}
            slideDirection={slideDirection}
            handleSlideDirectionChange={handleSlideDirectionChange}
            slideDuration={slideDuration}
            handleSlideDurationChange={handleSlideDurationChange}
            slideEasing={slideEasing}
            handleSlideEasingChange={handleSlideEasingChange}
            crossfadeDuration={crossfadeDuration}
            handleCrossfadeDurationChange={handleCrossfadeDurationChange}
            crossfadeEasing={crossfadeEasing}
            handleCrossfadeEasingChange={handleCrossfadeEasingChange}
          />

          <WallpaperOverlaySection
            overlayEnabled={overlayEnabled}
            handleOverlayEnabledChange={handleOverlayEnabledChange}
            overlayEffect={overlayEffect}
            handleOverlayEffectChange={handleOverlayEffectChange}
            overlayIntensity={overlayIntensity}
            handleOverlayIntensityChange={handleOverlayIntensityChange}
            overlaySpeed={overlaySpeed}
            handleOverlaySpeedChange={handleOverlaySpeedChange}
            overlayWind={overlayWind}
            handleOverlayWindChange={handleOverlayWindChange}
            overlayGravity={overlayGravity}
            handleOverlayGravityChange={handleOverlayGravityChange}
          />
        </>
      ) : null}

    </div>
  );
});

WallpaperSettingsTab.displayName = 'WallpaperSettingsTab';

export default WallpaperSettingsTab; 