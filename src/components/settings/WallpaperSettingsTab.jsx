import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { Image, Sparkles } from 'lucide-react';
import { useWeeMotion } from '../../design/weeMotion';
import Text from '../../ui/Text';
import WToggle from '../../ui/WToggle';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import {
  createDefaultSpaceAppearance,
  syncActiveSpaceAppearanceCapture,
} from '../../utils/appearance/spaceAppearance';
import {
  mergeSpaceScopedRibbonFields,
  normalizeRibbonByPage,
  normalizeRibbonScope,
  pickRibbonLook,
  resolveLiveMatchRibbonOverlay,
} from '../../utils/appearance/resolveEffectiveRibbonLook';
import { resolveDisplayWallpaperUrl } from '../../utils/theme/resolveEffectiveAccent';
import { liveColorMatchUiPatch } from '../../utils/appearance/liveColorMatchMode';
import { normalizeWallpaperForStore, wallpaperEntryUrlKey } from '../../utils/wallpaperShape';
import { getSecondaryChannelSpaceData } from '../../utils/channelSpaces';
import { resolveLayout } from '../../utils/channelLayoutSystem';
import { saveUnifiedSettingsSnapshot } from '../../utils/electronApi';
import { openSettingsToTab, SETTINGS_TAB_ID } from '../../utils/settingsNavigation';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import SettingsWeeSection from './SettingsWeeSection';
import {
  WeeButton,
  WeeHelpLinkButton,
  WeeModalFieldCard,
  WeeSegmentedControl,
  WeeSettingsCollapsibleSection,
  WeeSpaceRailPillButton,
} from '../../ui/wee';

import WallpaperLibrarySection from './wallpaper/WallpaperLibrarySection';
import SpaceWallpaperAppearanceSection from './wallpaper/SpaceWallpaperAppearanceSection';
import SurfacesScenePreview from './wallpaper/SurfacesScenePreview';
import WallpaperCyclingSection from './wallpaper/WallpaperCyclingSection';
import WallpaperOverlaySection from './wallpaper/WallpaperOverlaySection';
import {
  SPACE_WALLPAPER_OPTIONS,
} from './wallpaper/wallpaperSettingsConstants';
import './settings-wee-panels.css';

const SURFACES_SEGMENTS = [
  { value: 'wallpaper', label: 'Wallpaper', title: 'Library, apply, and tone' },
  { value: 'ribbon', label: 'Ribbon', title: 'Scoped dock look and wallpaper match' },
  { value: 'effects', label: 'Effects', title: 'Home cycling and particle overlays' },
];

const api = window.api?.wallpapers || {};
const selectFile = window.api?.selectWallpaperFile;

function useWallpaperSettingsController() {
  // Use consolidated store directly
  const { wallpaper, overlay, appearanceBySpace, activeSpaceId, channels, wallpaperMatchEnabled, ribbon, ambientColor, spotifyMatchEnabled, spotifyColors } =
    useConsolidatedAppStore(
      useShallow((state) => ({
        wallpaper: state.wallpaper,
        overlay: state.overlay,
        appearanceBySpace: state.appearanceBySpace,
        activeSpaceId: state.spaces.activeSpaceId,
        channels: state.channels,
        wallpaperMatchEnabled: state.ui.wallpaperMatchEnabled !== false,
        ribbon: state.ribbon,
        ambientColor: state.ui.ambientColor ?? null,
        spotifyMatchEnabled: Boolean(state.ui.spotifyMatchEnabled),
        spotifyColors: state.spotify?.extractedColors ?? null,
      }))
    );
  const { setWallpaperState, setOverlayState, setAppearanceBySpaceState, setUIState, setRibbonState } =
    useConsolidatedAppStore(
      useShallow((state) => ({
        setWallpaperState: state.actions.setWallpaperState,
        setOverlayState: state.actions.setOverlayState,
        setAppearanceBySpaceState: state.actions.setAppearanceBySpaceState,
        setUIState: state.actions.setUIState,
        setRibbonState: state.actions.setRibbonState,
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
  const selectedWallpaperScope =
    selectedSpaceAppearance.wallpaperScope === 'perPage' ? 'perPage' : 'space';
  const supportsPerPageWallpaper =
    selectedSpaceId === 'home' || selectedSpaceId === 'workspaces';
  const boardSpaceData =
    selectedSpaceId === 'workspaces'
      ? getSecondaryChannelSpaceData(channels)
      : channels?.dataBySpace?.home;
  const liveBoardPage = boardSpaceData?.navigation?.currentPage ?? 0;
  /** Settings-local page target — pick any page without visiting it on Home first. */
  const [settingsTargetPage, setSettingsTargetPage] = useState(liveBoardPage);
  const boardLayout = resolveLayout(boardSpaceData || {});
  const totalPages = Math.max(1, Number(boardLayout?.totalPages) || 1);

  useEffect(() => {
    // When switching space pills, seed target from that board's live page.
    setSettingsTargetPage(Math.max(0, Math.min(totalPages - 1, liveBoardPage)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reseed on space change
  }, [selectedSpaceId]);

  useEffect(() => {
    setSettingsTargetPage((prev) => Math.max(0, Math.min(totalPages - 1, prev)));
  }, [totalPages]);

  const selectedBoardCurrentPage = settingsTargetPage;
  const selectedPageWallpaperUrl = (() => {
    const byPage = selectedSpaceAppearance.wallpaperByPage;
    if (!byPage || typeof byPage !== 'object') return null;
    const url = byPage[selectedBoardCurrentPage] ?? byPage[String(selectedBoardCurrentPage)];
    return typeof url === 'string' && url.length > 0 ? url : null;
  })();
  const pageMapEntries = useMemo(() => {
    const byPage = selectedSpaceAppearance.wallpaperByPage || {};
    return Array.from({ length: totalPages }, (_, pageIndex) => {
      const url = byPage[pageIndex] ?? byPage[String(pageIndex)];
      return {
        pageIndex,
        url: typeof url === 'string' && url.length > 0 ? url : null,
      };
    });
  }, [selectedSpaceAppearance.wallpaperByPage, totalPages]);
  const selectedSpaceRibbon = appearanceBySpace?.[selectedSpaceId]?.ribbon || {};
  const ribbonScope = normalizeRibbonScope(selectedSpaceRibbon.ribbonScope);
  const ribbonByPage = normalizeRibbonByPage(selectedSpaceRibbon.ribbonByPage);
  const pageRibbonLook =
    ribbonByPage[String(selectedBoardCurrentPage)] ||
    ribbonByPage[selectedBoardCurrentPage] ||
    null;
  /** Same display-URL policy as live wallpaper / ribbon paint (Home never uses space override). */
  const effectiveActiveWallpaperUrl = resolveDisplayWallpaperUrl({
    activeSpaceId: selectedSpaceId,
    wallpaperCurrent: wallpaper.current,
    appearanceBySpace,
    wallpaperEntryUrlKey,
    currentPage: selectedBoardCurrentPage,
  });
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

  const updateSpaceWallpaperAppearance = useCallback((spaceId, patch) => {
    const state = useConsolidatedAppStore.getState();
    // Seed missing rows with empty defaults — never copy the active space's live look.
    const currentSnapshot =
      state.appearanceBySpace?.[spaceId] ?? createDefaultSpaceAppearance(spaceId);
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
      wallpaperScope: 'space',
      wallpaperByPage: {},
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
      blur: 0,
    });
  }, [selectedSpaceId, setWallpaperState, updateSpaceWallpaperAppearance]);

  const handleWallpaperMatchChange = useCallback(
    async (enabled) => {
      // Turning match off leaves last manual/locked ribbon colors; only clears ambient extract cache.
      // Enabling wallpaper match turns off Now Playing match (mutual exclusive).
      const matchPatch = enabled
        ? liveColorMatchUiPatch('wallpaper')
        : { wallpaperMatchEnabled: false };
      setUIState({
        ...matchPatch,
        ...(enabled
          ? {
              ambientColor: {
                source: 'wallpaper',
                seedHex: null,
                palette: null,
                cachedForUrl: null,
                seeds: [],
              },
            }
          : {}),
      });
      await saveUnifiedSettingsSnapshot({
        ui: matchPatch,
      });
    },
    [setUIState]
  );

  const handleSelectedWallpaperScopeChange = useCallback(
    (nextScope) => {
      const scope = nextScope === 'perPage' ? 'perPage' : 'space';
      updateSpaceWallpaperAppearance(selectedSpaceId, { wallpaperScope: scope });
    },
    [selectedSpaceId, updateSpaceWallpaperAppearance]
  );

  const handleSelectSettingsTargetPage = useCallback((pageIndex) => {
    const page = Math.max(0, Math.floor(Number(pageIndex) || 0));
    setSettingsTargetPage(Math.max(0, Math.min(totalPages - 1, page)));
  }, [totalPages]);

  const handleApplyWallpaperToCurrentPage = useCallback(
    (url) => {
      const page = selectedBoardCurrentPage;
      const prev = selectedSpaceAppearance.wallpaperByPage;
      const nextByPage = {
        ...(prev && typeof prev === 'object' ? prev : {}),
      };
      if (typeof url === 'string' && url.length > 0) {
        nextByPage[page] = url;
        nextByPage[String(page)] = url;
        updateSpaceWallpaperAppearance(selectedSpaceId, {
          wallpaperScope: 'perPage',
          wallpaperByPage: nextByPage,
        });
        return;
      }
      delete nextByPage[page];
      delete nextByPage[String(page)];
      updateSpaceWallpaperAppearance(selectedSpaceId, { wallpaperByPage: nextByPage });
    },
    [
      selectedBoardCurrentPage,
      selectedSpaceAppearance.wallpaperByPage,
      selectedSpaceId,
      updateSpaceWallpaperAppearance,
    ]
  );

  const handleClearCurrentPageWallpaper = useCallback(() => {
    handleApplyWallpaperToCurrentPage(null);
  }, [handleApplyWallpaperToCurrentPage]);

  const updateSpaceRibbonAppearance = useCallback(
    (spaceId, patch) => {
      const state = useConsolidatedAppStore.getState();
      const currentSnapshot =
        state.appearanceBySpace?.[spaceId] ?? createDefaultSpaceAppearance(spaceId);
      const nextRibbon = mergeSpaceScopedRibbonFields(
        { ...(currentSnapshot.ribbon || {}), ...patch },
        { ...(currentSnapshot.ribbon || {}), ...patch }
      );
      setAppearanceBySpaceState({
        [spaceId]: {
          ...currentSnapshot,
          ribbon: nextRibbon,
        },
      });
      if (spaceId === state.spaces?.activeSpaceId) {
        setRibbonState(pickRibbonLook(nextRibbon));
        syncActiveSpaceAppearanceCapture({
          getState: () => useConsolidatedAppStore.getState(),
          setAppearanceBySpaceState,
        });
      }
    },
    [setAppearanceBySpaceState, setRibbonState]
  );

  const handleRibbonScopeChange = useCallback(
    (next) => {
      updateSpaceRibbonAppearance(selectedSpaceId, { ribbonScope: next });
    },
    [selectedSpaceId, updateSpaceRibbonAppearance]
  );

  const handleApplyRibbonToCurrentPage = useCallback(() => {
    const wallpaperUrl = resolveDisplayWallpaperUrl({
      activeSpaceId: selectedSpaceId,
      wallpaperCurrent: wallpaper?.current,
      appearanceBySpace,
      wallpaperEntryUrlKey,
      currentPage: selectedBoardCurrentPage,
    });
    const liveOverlay = resolveLiveMatchRibbonOverlay({
      wallpaperMatchEnabled,
      wallpaperUrl,
      ambientPalette: ambientColor?.palette ?? null,
      ambientCachedForUrl: ambientColor?.cachedForUrl ?? null,
      spotifyMatchEnabled,
      spotifyColors,
    });
    const look = {
      ...pickRibbonLook(ribbon),
      ...(liveOverlay || {}),
    };
    const prev = normalizeRibbonByPage(selectedSpaceRibbon.ribbonByPage);
    updateSpaceRibbonAppearance(selectedSpaceId, {
      ribbonScope: 'perPage',
      ribbonByPage: {
        ...prev,
        [String(selectedBoardCurrentPage)]: look,
      },
    });
  }, [
    ambientColor?.cachedForUrl,
    ambientColor?.palette,
    appearanceBySpace,
    ribbon,
    selectedBoardCurrentPage,
    selectedSpaceId,
    selectedSpaceRibbon.ribbonByPage,
    spotifyColors,
    spotifyMatchEnabled,
    updateSpaceRibbonAppearance,
    wallpaper?.current,
    wallpaperMatchEnabled,
  ]);

  const handleClearCurrentPageRibbon = useCallback(() => {
    const prev = { ...normalizeRibbonByPage(selectedSpaceRibbon.ribbonByPage) };
    delete prev[String(selectedBoardCurrentPage)];
    delete prev[selectedBoardCurrentPage];
    updateSpaceRibbonAppearance(selectedSpaceId, { ribbonByPage: prev });
  }, [
    selectedBoardCurrentPage,
    selectedSpaceId,
    selectedSpaceRibbon.ribbonByPage,
    updateSpaceRibbonAppearance,
  ]);

  const handleSaveRibbonForSpace = useCallback(() => {
    const wallpaperUrl = resolveDisplayWallpaperUrl({
      activeSpaceId: selectedSpaceId,
      wallpaperCurrent: wallpaper?.current,
      appearanceBySpace,
      wallpaperEntryUrlKey,
      currentPage: selectedBoardCurrentPage,
    });
    const liveOverlay = resolveLiveMatchRibbonOverlay({
      wallpaperMatchEnabled,
      wallpaperUrl,
      ambientPalette: ambientColor?.palette ?? null,
      ambientCachedForUrl: ambientColor?.cachedForUrl ?? null,
      spotifyMatchEnabled,
      spotifyColors,
    });
    updateSpaceRibbonAppearance(selectedSpaceId, {
      ...pickRibbonLook(ribbon),
      ...(liveOverlay || {}),
      ribbonScope,
      ribbonByPage: normalizeRibbonByPage(selectedSpaceRibbon.ribbonByPage),
    });
  }, [
    ambientColor?.cachedForUrl,
    ambientColor?.palette,
    appearanceBySpace,
    ribbon,
    ribbonScope,
    selectedBoardCurrentPage,
    selectedSpaceId,
    selectedSpaceRibbon.ribbonByPage,
    spotifyColors,
    spotifyMatchEnabled,
    updateSpaceRibbonAppearance,
    wallpaper?.current,
    wallpaperMatchEnabled,
  ]);

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
    const n = Number(value);
    const clamped = Number.isFinite(n)
      ? Math.min(1800, Math.max(5, Math.round(n)))
      : 30;
    setWallpaperState({ cycleInterval: clamped });
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
    handleWallpaperOpacityChange,
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
    wallpaperMatchEnabled,
    handleWallpaperMatchChange,
    supportsPerPageWallpaper,
    selectedWallpaperScope,
    handleSelectedWallpaperScopeChange,
    selectedBoardCurrentPage,
    selectedPageWallpaperUrl,
    pageMapEntries,
    handleSelectSettingsTargetPage,
    handleApplyWallpaperToCurrentPage,
    handleClearCurrentPageWallpaper,
    ribbon,
    ribbonScope,
    pageRibbonLook,
    handleRibbonScopeChange,
    handleApplyRibbonToCurrentPage,
    handleClearCurrentPageRibbon,
    handleSaveRibbonForSpace,
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
  const [surfacesSegment, setSurfacesSegment] = useState('wallpaper');
  const mediaHubEnabled = useConsolidatedAppStore((s) => s.spaces.mediaHubEnabled === true);
  const spaceWallpaperOptions = SPACE_WALLPAPER_OPTIONS.filter(
    (space) => mediaHubEnabled || space.id !== 'mediahub'
  );
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
    handleWallpaperOpacityChange,
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
    wallpaperMatchEnabled,
    handleWallpaperMatchChange,
    supportsPerPageWallpaper,
    selectedWallpaperScope,
    handleSelectedWallpaperScopeChange,
    selectedBoardCurrentPage,
    selectedPageWallpaperUrl,
    pageMapEntries,
    handleSelectSettingsTargetPage,
    handleApplyWallpaperToCurrentPage,
    handleClearCurrentPageWallpaper,
    ribbon,
    ribbonScope,
    pageRibbonLook,
    handleRibbonScopeChange,
    handleApplyRibbonToCurrentPage,
    handleClearCurrentPageRibbon,
    handleSaveRibbonForSpace,
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
  const applyPageWallpaperUrl =
    (typeof selectedWallpaper?.url === 'string' && selectedWallpaper.url) ||
    effectiveActiveWallpaperUrl ||
    null;
  const activeSurfacesSegment =
    surfacesSegment === 'effects' && !isHomeSpace ? 'wallpaper' : surfacesSegment;
  const contextPageBit = supportsPerPageWallpaper
    ? ` · page ${selectedBoardCurrentPage + 1}`
    : '';

  useEffect(() => {
    if (!isHomeSpace && surfacesSegment === 'effects') {
      setSurfacesSegment('wallpaper');
    }
  }, [isHomeSpace, surfacesSegment]);

  if (loading && !hasLoadedOnce) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center p-8">
        <Text variant="body" className="text-[hsl(var(--text-secondary))]">
          Loading Surfaces…
        </Text>
      </div>
    );
  }

  const sceneUrl =
    (typeof selectedWallpaper?.url === 'string' && selectedWallpaper.url) ||
    (typeof effectiveActiveWallpaperUrl === 'string' && effectiveActiveWallpaperUrl) ||
    (typeof selectedSpaceWallpaperUrl === 'string' && selectedSpaceWallpaperUrl) ||
    null;

  const sceneCaption = (() => {
    const where = `${selectedSpaceLabel}${contextPageBit}`;
    if (activeSurfacesSegment === 'ribbon') {
      return `Editing ribbon on ${where} — wallpaper dimmed so dock chrome can shine.`;
    }
    if (activeSurfacesSegment === 'effects') {
      return `Editing Home effects for ${where} — cycling & overlays apply to this scene.`;
    }
    return `Editing wallpaper on ${where} — tone and scope update this scene live.`;
  })();

  return (
    <div className="settings-wee-tab-root settings-wee-tab-root--studio pb-12">
      <SettingsTabPageHeader
        title="Surfaces"
        subtitle="Wallpaper, ribbon, and looks — preview the whole scene as you edit"
      />

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

      <div className="settings-wee-sticky-step-bar settings-wee-sticky-step-bar--studio">
        <div className="settings-wee-studio-context-row">
          <div className="settings-wee-studio-context-group">
            <Text
              variant="small"
              className="!m-0 font-bold uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]"
            >
              Space
            </Text>
            {spaceWallpaperOptions.map((space) => (
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
          {supportsPerPageWallpaper ? (
            <div className="settings-wee-studio-context-group">
              <span className="text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
                Page
              </span>
              {(pageMapEntries || []).map((entry) => {
                const filled = Boolean(entry.url);
                const isCurrent = entry.pageIndex === selectedBoardCurrentPage;
                return (
                  <button
                    key={`sticky-page-${entry.pageIndex}`}
                    type="button"
                    title={
                      filled
                        ? `Page ${entry.pageIndex + 1} · custom wallpaper`
                        : `Page ${entry.pageIndex + 1}`
                    }
                    onClick={() => handleSelectSettingsTargetPage(entry.pageIndex)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] transition-colors ${
                      isCurrent
                        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.18)] text-[hsl(var(--text-primary))]'
                        : filled
                          ? 'border-[hsl(var(--border-primary)/0.55)] bg-[hsl(var(--surface-elevated)/0.8)] text-[hsl(var(--text-primary))]'
                          : 'border-dashed border-[hsl(var(--border-primary)/0.45)] bg-transparent text-[hsl(var(--text-tertiary))]'
                    }`}
                  >
                    {entry.pageIndex + 1}
                  </button>
                );
              })}
            </div>
          ) : null}
          <div className="settings-wee-studio-segments min-w-0">
            <WeeSegmentedControl
              size="sm"
              ariaLabel="Surfaces section"
              layoutId="surfacesSettingsSegment"
              value={activeSurfacesSegment}
              onChange={setSurfacesSegment}
              options={
                isHomeSpace
                  ? SURFACES_SEGMENTS
                  : SURFACES_SEGMENTS.filter((opt) => opt.value !== 'effects')
              }
            />
          </div>
        </div>
      </div>

      <div className="settings-wee-studio-body">
        <aside className="settings-wee-studio-preview" aria-label="Surfaces live scene">
          <SurfacesScenePreview
            wallpaperUrl={sceneUrl}
            opacity={wallpaperOpacity}
            blur={selectedSpaceBlur}
            brightness={selectedSpaceBrightness}
            saturate={selectedSpaceSaturate}
            activeSegment={activeSurfacesSegment}
            caption={sceneCaption}
          />
        </aside>

        <div className="settings-wee-studio-controls">
          {activeSurfacesSegment === 'wallpaper' ? (
            <>
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
                handleWallpaperOpacityChange={handleWallpaperOpacityChange}
                selectedSpaceId={selectedSpaceId}
                setSelectedSpaceId={setSelectedSpaceId}
                reduceMotion={reduceMotion}
                tabTransition={tabTransition}
                selectedSpaceLabel={selectedSpaceLabel}
                selectedSpaceUsesGlobalWallpaper={selectedSpaceUsesGlobalWallpaper}
                handleSelectedSpaceUseGlobalWallpaperChange={
                  handleSelectedSpaceUseGlobalWallpaperChange
                }
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
                supportsPerPageWallpaper={supportsPerPageWallpaper}
                selectedWallpaperScope={selectedWallpaperScope}
                onWallpaperScopeChange={handleSelectedWallpaperScopeChange}
                selectedBoardCurrentPage={selectedBoardCurrentPage}
                selectedPageWallpaperUrl={selectedPageWallpaperUrl}
                onApplyWallpaperToCurrentPage={() =>
                  handleApplyWallpaperToCurrentPage(applyPageWallpaperUrl)
                }
                onClearCurrentPageWallpaper={handleClearCurrentPageWallpaper}
                canApplyPageWallpaper={Boolean(applyPageWallpaperUrl)}
                pageMapEntries={pageMapEntries}
                onSelectBoardPage={handleSelectSettingsTargetPage}
              />
            </>
          ) : null}

          {activeSurfacesSegment === 'ribbon' ? (
            <>
              <SettingsWeeSection eyebrow="Ribbon look">
                <WeeModalFieldCard hoverAccent="primary" paddingClassName="p-5 md:p-6">
                  <Text variant="h3" className="mb-1 playful-hero-text">
                    Ribbon by space &amp; page
                  </Text>
                  <Text variant="desc" className="mb-4">
                    Color and glass for the Wii ribbon on {selectedSpaceLabel}. Buttons stay global
                    — tune chrome in Dock.
                  </Text>

                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <span
                      className="h-8 w-8 rounded-full border border-[hsl(var(--border-primary)/0.5)] shadow-[var(--shadow-sm)]"
                      style={{ background: ribbon?.ribbonColor || 'hsl(var(--primary))' }}
                      title="Current ribbon color"
                      aria-hidden
                    />
                    <span
                      className="h-8 w-8 rounded-full border border-[hsl(var(--border-primary)/0.5)] shadow-[var(--shadow-sm)]"
                      style={{ background: ribbon?.ribbonGlowColor || 'hsl(var(--primary))' }}
                      title="Current ribbon glow"
                      aria-hidden
                    />
                    <WeeHelpLinkButton onClick={() => openSettingsToTab(SETTINGS_TAB_ID.DOCK)}>
                      Edit ribbon colors in Dock
                    </WeeHelpLinkButton>
                  </div>

                  {supportsPerPageWallpaper ? (
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <span className="text-[length:var(--font-size-micro)] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
                        Scope
                      </span>
                      <WeeSegmentedControl
                        size="sm"
                        ariaLabel="Ribbon look scope"
                        layoutId="surfacesRibbonScope"
                        value={ribbonScope}
                        onChange={handleRibbonScopeChange}
                        options={[
                          {
                            value: 'space',
                            label: 'Space',
                            title: 'One ribbon look for this space',
                          },
                          {
                            value: 'perPage',
                            label: 'Per page',
                            title: 'Different ribbon look per Home/Focus page',
                          },
                        ]}
                      />
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <WeeButton
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleSaveRibbonForSpace}
                    >
                      Save current look for {selectedSpaceLabel}
                    </WeeButton>
                    {supportsPerPageWallpaper && ribbonScope === 'perPage' ? (
                      <>
                        <WeeButton
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleApplyRibbonToCurrentPage}
                        >
                          Apply to page {selectedBoardCurrentPage + 1}
                        </WeeButton>
                        <WeeButton
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleClearCurrentPageRibbon}
                        >
                          Clear page look
                        </WeeButton>
                      </>
                    ) : null}
                  </div>
                  <p className="settings-wee-help !mb-0 mt-3">
                    {supportsPerPageWallpaper && ribbonScope === 'perPage'
                      ? pageRibbonLook
                        ? `Page ${selectedBoardCurrentPage + 1} has a custom ribbon look.`
                        : `Page ${selectedBoardCurrentPage + 1} uses the space ribbon look until you apply one.`
                      : 'Space-level ribbon look. Page flips keep the same colors.'}
                  </p>
                </WeeModalFieldCard>
              </SettingsWeeSection>

              <SettingsWeeSection eyebrow="Match wallpaper">
                <WeeModalFieldCard hoverAccent="primary" paddingClassName="p-5 md:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <Text variant="h3" className="mb-1 playful-hero-text">
                        Paint ribbon from wallpaper
                      </Text>
                      <Text variant="desc" className="!m-0">
                        Live accents from the wallpaper on screen. Turning this off keeps the last
                        painted ribbon colors. Spotify Match still wins while it&apos;s on.
                      </Text>
                    </div>
                    <WToggle
                      checked={wallpaperMatchEnabled}
                      onChange={handleWallpaperMatchChange}
                      disableLabelClick
                      title="Toggle match wallpaper colors to ribbon"
                    />
                  </div>
                  <div className="mt-3">
                    <WeeHelpLinkButton onClick={() => openSettingsToTab(SETTINGS_TAB_ID.DOCK)}>
                      Edit ribbon accents in Dock
                    </WeeHelpLinkButton>
                  </div>
                </WeeModalFieldCard>
              </SettingsWeeSection>
            </>
          ) : null}

          {activeSurfacesSegment === 'effects' && isHomeSpace ? (
            <div className="flex flex-col gap-4">
              <p className="settings-wee-help !mb-0 px-1">
                Cycling and particle overlays are Home-only. Focus and hubs use the wallpaper you
                set under Wallpaper.
              </p>
              <WeeSettingsCollapsibleSection
                icon={Image}
                title="Liked-wallpaper cycling"
                description="Rotate through liked wallpapers on a timer"
                defaultOpen={false}
              >
                <WallpaperCyclingSection
                  cycling={cycling}
                  handleCyclingChange={handleCyclingChange}
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
              </WeeSettingsCollapsibleSection>

              <WeeSettingsCollapsibleSection
                icon={Sparkles}
                title="Particle overlay"
                description="Optional snow, rain, leaves, and more above the wallpaper"
                defaultOpen={false}
              >
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
              </WeeSettingsCollapsibleSection>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
});

WallpaperSettingsTab.displayName = 'WallpaperSettingsTab';

export default WallpaperSettingsTab; 