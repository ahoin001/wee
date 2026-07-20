import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { useLaunchFeedback } from '../../contexts/LaunchFeedbackContext';
import { launchWithFeedback } from '../../utils/launchWithFeedback';
import { enterSessionAwayIfIntensive } from '../../hooks/useSessionPowerSync';
import { buildHubData, orderHubCollectionItems, sortHubGamesByName } from './hubData';
import AuraHero from './AuraHero';
import AuraCollectionsSection from './AuraCollectionsSection';
import AuraLibrarySection from './AuraLibrarySection';
import { isAppLibraryBackgroundPrefetchScheduled } from '../../utils/appLibraryStartupCoordinator';
import { shouldUseWarmEnrichmentCache } from '../../utils/gameHub/gameHubEnrichmentCache';
import { getCachedSteamClientLibrary, setCachedSteamClientLibrary } from '../../utils/gameHub/gameHubClientLibraryCache';
import { steamEnrichmentIpcArgs } from '../../utils/steamGamesGlance';
import { refreshCacheDomain } from '../../utils/cacheRegistry';
import { useHeroMediaCrossfade } from './useHeroMediaCrossfade';
import {
  createHubEntranceBandVariants,
  createHubEntranceFadeVariants,
  createHubEntranceOrchestratorVariants,
} from '../../design/weeMotion';
import { useHubSpaceEntrance } from '../../hooks/useHubSpaceEntrance';
import { weeMarkGameHubLibrary } from '../../utils/weePerformanceMarks';
import './GameHubSpace.css';
import GameHubTileDialogsProvider from './GameHubTileDialogsProvider';
import GameHubControlsPill from './GameHubControlsPill';

const MotionDiv = m.div;

/** First ~80px of scroll commits hero from spotlight → compact bar */
const HERO_SCROLL_COMPACT_THRESHOLD_PX = 80;

const BACKDROP_HOVER_DEBOUNCE_MS = 110;
const BACKDROP_MIN_HOLD_MS = 260;
/** After scroll stops, resume debounced hero/backdrop media updates. */
const SCROLL_SETTLE_MS = 150;
const URL_CHURN_WINDOW_MS = 450;
const URL_CHURN_THRESHOLD = 8;
const HEAVY_DEBOUNCE_MS = 280;
const HEAVY_MIN_HOLD_MS = 380;
/** While collection shelf/fly chrome is busy, slow hero backdrop churn. */
const COLLECTION_CHROME_BUSY_MIN_HOLD_MS = 520;

export default function GameHubSpace() {
  const {
    appLibrary,
    gameHub,
    wallpaper,
    appearanceBySpace,
    setGameHubState,
    patchGameHubLastLaunch,
    appLibraryManager,
    showDock,
    isSpaceTransitioning,
    activeSpaceId,
  } =
    useConsolidatedAppStore(
      useShallow((state) => ({
        appLibrary: state.appLibrary,
        gameHub: state.gameHub,
        wallpaper: state.wallpaper,
        appearanceBySpace: state.appearanceBySpace,
        setGameHubState: state.actions.setGameHubState,
        patchGameHubLastLaunch: state.actions.patchGameHubLastLaunch,
        appLibraryManager: state.appLibraryManager,
        showDock: state.ui.showDock ?? true,
        isSpaceTransitioning: state.spaces.isTransitioning,
        activeSpaceId: state.spaces.activeSpaceId,
      }))
    );

  /** Defer heavy hub recompute when library arrays churn rapidly (React concurrent-friendly). */
  const deferredSteamGames = useDeferredValue(appLibrary.steamGames);
  const deferredEpicGames = useDeferredValue(appLibrary.epicGames);

  const hubShelfOrderMode = gameHub.ui?.hubShelfOrderMode ?? 'custom';
  const collectionShelfOrder = gameHub.ui?.collectionShelfOrder ?? null;
  const hubLibrarySort = gameHub.ui?.hubLibrarySort ?? 'default';
  const hubCollectionGamesSort = gameHub.ui?.hubCollectionGamesSort ?? 'default';
  const { showLaunchError, beginLaunchFeedback, endLaunchFeedback } = useLaunchFeedback();

  const [isLaunching, setIsLaunching] = useState(false);
  const [isHeroCompact, setIsHeroCompact] = useState(false);
  const [heroPreviewGameId, setHeroPreviewGameId] = useState(null);
  const heroPreviewClearRef = useRef(null);
  const contentScrollRef = useRef(null);
  const [scrollHot, setScrollHot] = useState(false);
  const scrollSettleTimerRef = useRef(null);
  const mediaDebounceTimerRef = useRef(null);
  const urlChurnTimestampsRef = useRef([]);
  const prevRawArtUrlRef = useRef(undefined);
  const firstMediaDebounceRef = useRef(true);
  const [mediaMinHoldMs, setMediaMinHoldMs] = useState(BACKDROP_MIN_HOLD_MS);
  /** `undefined` = not yet synced; then follows debounced raw art URL. */
  const [debouncedMediaUrl, setDebouncedMediaUrl] = useState(undefined);
  const [scrollNode, setScrollNode] = useState(null);
  const [collectionChromeBusy, setCollectionChromeBusy] = useState(false);
  const stageRef = useRef(null);
  const heroScrollRafRef = useRef(null);

  const reducedMotion = useReducedMotion();
  const { entranceKey, tier: hubEntranceTier, animateState: hubEntranceState, onEntranceComplete, shellMs } = useHubSpaceEntrance(
    'gamehub',
    reducedMotion
  );

  const hubOrchestratorVariants = useMemo(
    () => createHubEntranceOrchestratorVariants(hubEntranceTier, reducedMotion, shellMs),
    [hubEntranceTier, reducedMotion, shellMs]
  );
  const hubBandVariants = useMemo(
    () => createHubEntranceBandVariants(hubEntranceTier, reducedMotion),
    [hubEntranceTier, reducedMotion]
  );
  const hubFadeVariants = useMemo(
    () => createHubEntranceFadeVariants(reducedMotion, hubEntranceTier),
    [reducedMotion, hubEntranceTier]
  );

  const setScrollRef = useCallback((node) => {
    contentScrollRef.current = node;
    setScrollNode(node);
  }, []);

  const handleCollectionChromeBusyChange = useCallback((busy) => {
    setCollectionChromeBusy(Boolean(busy));
  }, []);

  /** Freeze debounced hero/backdrop media while scrolling so hover+scroll doesn’t thrash layers. */
  useEffect(() => {
    if (!scrollNode) return undefined;
    const onScroll = () => {
      setScrollHot(true);
      if (scrollSettleTimerRef.current) window.clearTimeout(scrollSettleTimerRef.current);
      scrollSettleTimerRef.current = window.setTimeout(() => {
        scrollSettleTimerRef.current = null;
        setScrollHot(false);
      }, SCROLL_SETTLE_MS);
    };
    scrollNode.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scrollNode.removeEventListener('scroll', onScroll);
      if (scrollSettleTimerRef.current) window.clearTimeout(scrollSettleTimerRef.current);
    };
  }, [scrollNode]);

  const applyHeroScrollMode = useCallback(() => {
    const main = contentScrollRef.current;
    if (!main) return;
    const scrolled = main.scrollTop > HERO_SCROLL_COMPACT_THRESHOLD_PX;
    setIsHeroCompact((prev) => (prev !== scrolled ? scrolled : prev));
  }, []);

  const scheduleHeroScrollMode = useCallback(() => {
    if (heroScrollRafRef.current != null) return;
    heroScrollRafRef.current = window.requestAnimationFrame(() => {
      heroScrollRafRef.current = null;
      applyHeroScrollMode();
    });
  }, [applyHeroScrollMode]);

  useEffect(() => {
    applyHeroScrollMode();
  }, [applyHeroScrollMode]);

  /* Reserve space + scroll math for fixed dock so hub content doesn’t sit unreadably under it */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    const syncDockInset = () => {
      const dock = document.querySelector('.dock-container');
      let px = 0;
      if (showDock && dock) {
        px = Math.round(dock.getBoundingClientRect().height + 20);
      }
      stage.style.setProperty('--hub-dock-inset', `${px}px`);
    };

    syncDockInset();
    const onResize = () => syncDockInset();
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(() => syncDockInset());
    const dock = document.querySelector('.dock-container');
    if (dock) ro.observe(dock);

    return () => {
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, [showDock]);

  useEffect(
    () => () => {
      if (heroScrollRafRef.current != null) {
        window.cancelAnimationFrame(heroScrollRafRef.current);
        heroScrollRafRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    if (activeSpaceId !== 'gamehub') return undefined;
    if (isSpaceTransitioning) return undefined;

    let cancelled = false;

    const hydrate = async () => {
      const gh = useConsolidatedAppStore.getState().gameHub;
      const library = gh.library || {};
      const profile = gh.profile || {};
      const steamId = profile.steamId;
      const useSteamWebApi = profile.useSteamWebApi !== false;

      try {
        if (!isAppLibraryBackgroundPrefetchScheduled()) {
          await Promise.all([
            appLibraryManager?.fetchSteamGames?.(false, { silent: true }),
            appLibraryManager?.fetchEpicGames?.(false, { silent: true }),
          ]);
        }
      } catch {
        /* app library manager is best-effort; hub still uses persisted / API enrichment */
      }
      if (cancelled) return;

      if (!useSteamWebApi) {
        setGameHubState({
          library: {
            enrichedGames: [],
            lastSyncedAt: library.lastSyncedAt ?? Date.now(),
            syncStatus: 'local-only',
            statusReason: 'Steam enrichment disabled in Now Playing, Steam & Widgets settings.',
            lastError: null,
          },
        });
        return;
      }

      if (!steamId || !window.api?.steam?.getEnrichedGames) {
        setGameHubState({
          library: {
            enrichedGames: [],
            lastSyncedAt: library.lastSyncedAt ?? Date.now(),
            syncStatus: 'local-only',
            statusReason: 'Add SteamID64 in Now Playing, Steam & Widgets settings to enrich your library.',
            lastError: null,
          },
        });
        return;
      }

      const applyFromApiResponse = (enriched) => {
        const enrichedGames = Array.isArray(enriched?.games) ? enriched.games : [];
        const hasError = Boolean(enriched?.error);
        setGameHubState({
          library: {
            enrichedGames,
            lastSyncedAt: Date.now(),
            syncStatus: hasError ? 'error' : 'ready',
            statusReason: enriched?.statusReason || enriched?.error || '',
            lastError: hasError ? enriched.error : null,
            lastEnrichedSteamId: steamId,
          },
        });
      };

      if (shouldUseWarmEnrichmentCache(library, profile)) {
        // Warm cache is fresh (< GAME_HUB_ENRICHMENT_TTL_MS): trust it and skip the
        // network entirely. Manual refresh (refreshSteamEnrichmentNow) forces a refetch.
        setGameHubState({
          library: {
            syncStatus: 'ready',
            lastError: null,
          },
        });
        return;
      }

      const hasPersistedList = Array.isArray(library.enrichedGames) && library.enrichedGames.length > 0;
      if (hasPersistedList) {
        setGameHubState({
          library: {
            syncStatus: 'refreshing',
            statusReason: 'Refreshing Steam library…',
            lastError: null,
          },
        });
      } else {
        setGameHubState({
          library: {
            syncStatus: 'loading',
            lastError: null,
            statusReason: '',
          },
        });
      }

      try {
        const enriched = await window.api.steam.getEnrichedGames(
          steamEnrichmentIpcArgs(profile) || { steamId }
        );
        if (cancelled) return;
        applyFromApiResponse(enriched);
      } catch (error) {
        if (!cancelled) {
          setGameHubState({
            library: {
              syncStatus: 'error',
              statusReason: 'Network or API request failed.',
              lastError: error?.message || 'Failed to sync library',
            },
          });
        }
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [
    activeSpaceId,
    appLibraryManager,
    gameHub.profile?.steamId,
    gameHub.profile?.useSteamWebApi,
    gameHub.profile?.steamWebApiKey,
    isSpaceTransitioning,
    setGameHubState,
  ]);

  useEffect(
    () => () => {
      if (heroPreviewClearRef.current) window.clearTimeout(heroPreviewClearRef.current);
    },
    []
  );

  const enrichmentMap = useMemo(() => {
    const map = {};
    (gameHub.library?.enrichedGames || []).forEach((item) => {
      if (item?.appId) map[String(item.appId)] = item;
    });
    return map;
  }, [gameHub.library?.enrichedGames]);

  const weeMeta = useMemo(
    () => ({
      favoriteGameIds: gameHub.ui?.favoriteGameIds || [],
      hiddenGameIds: gameHub.ui?.hiddenGameIds || [],
      weeCollections: gameHub.library?.weeCollections || [],
      lastLaunchedAt: gameHub.library?.lastLaunchedAt || {},
      customArtByGameId: gameHub.ui?.customArtByGameId || {},
    }),
    [
      gameHub.ui?.favoriteGameIds,
      gameHub.ui?.hiddenGameIds,
      gameHub.library?.weeCollections,
      gameHub.library?.lastLaunchedAt,
      gameHub.ui?.customArtByGameId,
    ]
  );

  const [clientLibrary, setClientLibrary] = useState({
    ok: false,
    favoritesAppIds: [],
    appIdToTags: {},
  });

  useEffect(() => {
    if (activeSpaceId !== 'gamehub') return undefined;
    if (isSpaceTransitioning) return undefined;

    const steamId = gameHub.profile?.steamId;
    if (!steamId || !window.api?.steam?.getClientLibraryMetadata) {
      setClientLibrary({ ok: false, favoritesAppIds: [], appIdToTags: {} });
      return undefined;
    }
    const cached = getCachedSteamClientLibrary(steamId);
    if (cached) {
      setClientLibrary(cached);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await window.api.steam.getClientLibraryMetadata({ steamId });
        if (!cancelled && res && typeof res === 'object') {
          const payload = {
            ok: Boolean(res.ok),
            favoritesAppIds: Array.isArray(res.favoritesAppIds) ? res.favoritesAppIds : [],
            appIdToTags: res.appIdToTags && typeof res.appIdToTags === 'object' ? res.appIdToTags : {},
          };
          setCachedSteamClientLibrary(steamId, payload);
          setClientLibrary(payload);
        }
      } catch {
        if (!cancelled) setClientLibrary({ ok: false, favoritesAppIds: [], appIdToTags: {} });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeSpaceId, gameHub.profile?.steamId, isSpaceTransitioning]);

  const showHubBackdrop = gameHub.ui?.showHubBackdrop ?? false;
  const hubSteamOnlyGames = gameHub.ui?.hubSteamOnlyGames ?? true;
  const effectsEnabled = gameHub.ui?.effectsEnabled ?? true;
  const activeCollectionId = gameHub.ui?.activeCollectionId || null;
  const selectedGameId = gameHub.ui?.selectedGameId || null;

  const hubData = useMemo(
    () =>
      buildHubData({
        steamGames: deferredSteamGames,
        epicGames: deferredEpicGames,
        enrichmentMap,
        clientLibrary,
        weeMeta,
      }),
    [deferredEpicGames, deferredSteamGames, enrichmentMap, clientLibrary, weeMeta]
  );

  const hubDataView = useMemo(() => {
    if (!hubSteamOnlyGames) return hubData;
    const steamOnly = (arr) => (Array.isArray(arr) ? arr.filter((g) => g?.source === 'steam') : []);
    return {
      ...hubData,
      installed: steamOnly(hubData.installed),
      favoritesOnly: steamOnly(hubData.favoritesOnly),
      railGames: steamOnly(hubData.railGames),
      collections: {
        ...hubData.collections,
        items: hubData.collections.items.map((c) => ({
          ...c,
          games: steamOnly(c.games),
        })),
      },
    };
  }, [hubData, hubSteamOnlyGames]);

  /** Clear selection / open shelf when hide (or filter) removes their visible target. */
  useEffect(() => {
    const patch = {};
    if (selectedGameId && !hubDataView.installed.some((g) => g.id === selectedGameId)) {
      patch.selectedGameId = null;
    }
    if (activeCollectionId) {
      const open = hubDataView.collections.items.find((c) => c.id === activeCollectionId);
      if (!open || (Array.isArray(open.games) && open.games.length === 0)) {
        patch.activeCollectionId = null;
      }
    }
    if (Object.keys(patch).length > 0) {
      setGameHubState({ ui: patch });
    }
  }, [activeCollectionId, hubDataView.collections.items, hubDataView.installed, selectedGameId, setGameHubState]);

  const displayCollections = useMemo(() => {
    const raw = hubDataView.collections.items;
    const ordered = orderHubCollectionItems(raw, {
      shelfOrderMode: hubShelfOrderMode,
      customShelfOrder: collectionShelfOrder,
    });
    if (hubCollectionGamesSort === 'alphabetical') {
      return ordered.map((c) => ({ ...c, games: sortHubGamesByName(c.games) }));
    }
    return ordered;
  }, [hubDataView.collections.items, hubShelfOrderMode, collectionShelfOrder, hubCollectionGamesSort]);

  const libraryGames = useMemo(() => {
    const installed = hubDataView.installed;
    if (hubLibrarySort === 'alphabetical') {
      return sortHubGamesByName(installed);
    }
    return installed;
  }, [hubDataView.installed, hubLibrarySort]);

  useEffect(() => {
    weeMarkGameHubLibrary(libraryGames.length);
  }, [libraryGames.length]);

  const selectedGame = useMemo(
    () => hubDataView.installed.find((game) => game.id === selectedGameId) || null,
    [hubDataView.installed, selectedGameId]
  );

  const previewGame = useMemo(
    () => (heroPreviewGameId ? hubDataView.installed.find((g) => g.id === heroPreviewGameId) : null),
    [heroPreviewGameId, hubDataView.installed]
  );

  const heroGame =
    previewGame ||
    selectedGame ||
    hubDataView.favoritesOnly[0] ||
    hubDataView.installed[0] ||
    null;

  const rawArtUrl = useMemo(() => heroGame?.headerUrl || heroGame?.imageUrl || null, [heroGame]);

  /** Single input for hero + hub backdrop layers; debounced to avoid desync under hover + scroll. */
  const mediaInputUrl = debouncedMediaUrl === undefined ? rawArtUrl : debouncedMediaUrl;

  useEffect(() => {
    const now = Date.now();
    urlChurnTimestampsRef.current = urlChurnTimestampsRef.current.filter((t) => now - t < URL_CHURN_WINDOW_MS);
    if (prevRawArtUrlRef.current !== rawArtUrl) {
      prevRawArtUrlRef.current = rawArtUrl;
      if (rawArtUrl != null) urlChurnTimestampsRef.current.push(now);
    }
    const heavy = urlChurnTimestampsRef.current.length >= URL_CHURN_THRESHOLD;
    setMediaMinHoldMs(heavy ? HEAVY_MIN_HOLD_MS : BACKDROP_MIN_HOLD_MS);

    if (collectionChromeBusy) {
      if (mediaDebounceTimerRef.current) {
        window.clearTimeout(mediaDebounceTimerRef.current);
        mediaDebounceTimerRef.current = null;
      }
      return undefined;
    }

    if (scrollHot) {
      if (mediaDebounceTimerRef.current) {
        window.clearTimeout(mediaDebounceTimerRef.current);
        mediaDebounceTimerRef.current = null;
      }
      return undefined;
    }

    const debounceMs = firstMediaDebounceRef.current
      ? 0
      : heavy
        ? HEAVY_DEBOUNCE_MS
        : BACKDROP_HOVER_DEBOUNCE_MS;
    if (firstMediaDebounceRef.current) firstMediaDebounceRef.current = false;

    if (mediaDebounceTimerRef.current) {
      window.clearTimeout(mediaDebounceTimerRef.current);
      mediaDebounceTimerRef.current = null;
    }

    mediaDebounceTimerRef.current = window.setTimeout(() => {
      mediaDebounceTimerRef.current = null;
      setDebouncedMediaUrl(rawArtUrl ?? null);
    }, debounceMs);

    return () => {
      if (mediaDebounceTimerRef.current) {
        window.clearTimeout(mediaDebounceTimerRef.current);
        mediaDebounceTimerRef.current = null;
      }
    };
  }, [rawArtUrl, scrollHot, collectionChromeBusy]);

  const prevCollectionChromeBusyRef = useRef(false);
  useEffect(() => {
    const prev = prevCollectionChromeBusyRef.current;
    prevCollectionChromeBusyRef.current = collectionChromeBusy;
    if (prev && !collectionChromeBusy) {
      setDebouncedMediaUrl(rawArtUrl ?? null);
    }
  }, [collectionChromeBusy, rawArtUrl]);

  const {
    baseUrl: heroMediaBaseUrl,
    overlayUrl: heroMediaOverlayUrl,
    overlayOpacity: heroMediaOverlayOpacity,
    onOverlayTransitionEnd: onHeroMediaOverlayTransitionEnd,
  } = useHeroMediaCrossfade(mediaInputUrl, effectsEnabled, {
    minHoldMs: collectionChromeBusy
      ? Math.max(mediaMinHoldMs, COLLECTION_CHROME_BUSY_MIN_HOLD_MS)
      : mediaMinHoldMs,
    stallRecoveryMs: 1000,
  });

  const setHeroPreview = useCallback((game) => {
    if (heroPreviewClearRef.current) {
      window.clearTimeout(heroPreviewClearRef.current);
      heroPreviewClearRef.current = null;
    }
    if (game) {
      setHeroPreviewGameId(game.id);
      return;
    }
    const clearDelay = collectionChromeBusy ? 240 : 90;
    heroPreviewClearRef.current = window.setTimeout(() => {
      setHeroPreviewGameId(null);
      heroPreviewClearRef.current = null;
    }, clearDelay);
  }, [collectionChromeBusy]);
  const activeCollection =
    displayCollections.find((collection) => collection.id === activeCollectionId) || null;
  const hasFavorites = hubDataView.railGames.length > 0;

  const handleLaunchGame = async (game) => {
    if (!game?.launchPath || !window.api?.launchApp) return;
    if (effectsEnabled) {
      setIsLaunching(true);
      window.setTimeout(() => setIsLaunching(false), 500);
    }
    const result = await launchWithFeedback({
      launch: () => window.api.launchApp({ type: 'url', path: game.launchPath, asAdmin: false }),
      beginLaunchFeedback,
      endLaunchFeedback,
      showLaunchError,
      label: `Launching ${game.name}`,
      launchType: game.source,
      path: game.launchPath,
      source: 'gamehub',
    });
    if (result?.ok !== false) {
      patchGameHubLastLaunch(game.id, Date.now());
      enterSessionAwayIfIntensive({
        type: game.source === 'epic' ? 'epic' : 'steam',
        path: game.launchPath,
        source: 'gamehub',
        mode: 'on',
      });
    }
  };

  const floatingUi = !showHubBackdrop;
  const gameHubAppearance = appearanceBySpace?.gamehub?.wallpaper || null;
  const gameHubWallpaperBrightness =
    typeof gameHubAppearance?.spaceBrightness === 'number' && Number.isFinite(gameHubAppearance.spaceBrightness)
      ? gameHubAppearance.spaceBrightness
      : (wallpaper?.gameHubBrightness ?? 0.78);
  const gameHubWallpaperSaturation =
    typeof gameHubAppearance?.spaceSaturate === 'number' && Number.isFinite(gameHubAppearance.spaceSaturate)
      ? gameHubAppearance.spaceSaturate
      : (wallpaper?.gameHubSaturate ?? 1);

  const hubHeroNotice =
    gameHub.library?.syncStatus === 'error'
      ? gameHub.library?.statusReason || 'Could not refresh Steam library stats.'
      : gameHub.library?.syncStatus === 'refreshing'
        ? gameHub.library?.statusReason || 'Refreshing library…'
        : null;

  const hubHeroBaseProps = {
    floatingUi,
    effectsEnabled,
    selectedGameId,
    heroGame,
    heroNotice: hubHeroNotice,
    hasSteamId: Boolean(gameHub.profile?.steamId),
    hasFavorites,
    railGames: hubDataView.railGames,
    onLaunchGame: handleLaunchGame,
    onSelectGame: (gameId) => setGameHubState({ ui: { selectedGameId: gameId } }),
    onHeroPreview: setHeroPreview,
    heroMediaBaseUrl,
    heroMediaOverlayUrl,
    heroMediaOverlayOpacity,
    onHeroMediaOverlayTransitionEnd,
  };

  const stageClassName = [
    'aura-hub-stage',
    isHeroCompact ? 'aura-hub-stage--scrolled' : '',
    floatingUi ? 'aura-hub-stage--floating' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const hubCollectionsAnchor = (
    <div id="game-hub-collections-anchor" className="aura-hub-scroll-anchor" aria-hidden />
  );

  const hubCollectionsSection = (
    <AuraCollectionsSection
      collections={displayCollections}
      activeCollection={activeCollection}
      activeCollectionId={activeCollectionId}
      effectsEnabled={effectsEnabled}
      shelfOrderMode={hubShelfOrderMode}
      onShelfOrderModeChange={(mode) => setGameHubState({ ui: { hubShelfOrderMode: mode } })}
      hubCollectionGamesSort={hubCollectionGamesSort}
      onHubCollectionGamesSortChange={(sort) =>
        setGameHubState({ ui: { hubCollectionGamesSort: sort } })
      }
      onSetCollection={(collectionId) => setGameHubState({ ui: { activeCollectionId: collectionId } })}
      onSelectGame={(gameId) => setGameHubState({ ui: { selectedGameId: gameId } })}
      onLaunchGame={handleLaunchGame}
      onHeroPreview={setHeroPreview}
      onCollectionChromeBusyChange={handleCollectionChromeBusyChange}
      hubScrollContainerRef={contentScrollRef}
    />
  );

  const hubLibrarySection = (
    <AuraLibrarySection
      games={libraryGames}
      librarySort={hubLibrarySort}
      onLibrarySortChange={(sort) => setGameHubState({ ui: { hubLibrarySort: sort } })}
      onRefreshLibrary={
        gameHub.profile?.steamId ? () => refreshCacheDomain('game-enrichment') : undefined
      }
      libraryRefreshing={gameHub.library?.syncStatus === 'refreshing'}
      onSelectGame={(gameId) => setGameHubState({ ui: { selectedGameId: gameId } })}
      onLaunchGame={handleLaunchGame}
      onHeroPreview={setHeroPreview}
      hubScrollContainerRef={contentScrollRef}
    />
  );

  const hubSections = (
    <>
      {hubCollectionsAnchor}
      {hubCollectionsSection}
      {hubLibrarySection}
    </>
  );

  return (
    <GameHubTileDialogsProvider>
    <section
      className={`aura-hub-space ${floatingUi ? 'aura-hub-space--floating' : ''} ${effectsEnabled ? 'aura-hub-space--effects' : 'aura-hub-space--static'} ${isLaunching ? 'aura-hub-space--launching' : ''}`}
      style={{
        '--aura-hub-wallpaper-brightness': gameHubWallpaperBrightness,
        '--aura-hub-wallpaper-saturation': gameHubWallpaperSaturation,
      }}
    >
      <div
        ref={stageRef}
        className={stageClassName}
        style={{ '--hub-scroll-top-reserve': '18px' }}
      >
        <MotionDiv
          layout={false}
          className="flex min-h-0 flex-1 flex-col"
          variants={hubOrchestratorVariants}
          initial={false}
          animate={hubEntranceState}
          onAnimationComplete={
            hubEntranceState === 'show' ? () => onEntranceComplete(entranceKey) : undefined
          }
        >
        {showHubBackdrop && (heroMediaBaseUrl || heroMediaOverlayUrl) ? (
          <m.div className="aura-hub-backdrop" aria-hidden variants={hubFadeVariants}>
            {heroMediaBaseUrl ? (
              <div
                className="aura-hub-backdrop__layer aura-hub-backdrop__layer--base"
                style={{ backgroundImage: `url('${heroMediaBaseUrl}')` }}
              />
            ) : null}
            {heroMediaOverlayUrl ? (
              <div
                className="aura-hub-backdrop__layer aura-hub-backdrop__layer--overlay"
                style={{
                  backgroundImage: `url('${heroMediaOverlayUrl}')`,
                  opacity: heroMediaOverlayOpacity,
                  transform: `scale(${1.015 - heroMediaOverlayOpacity * 0.015})`,
                }}
                onTransitionEnd={onHeroMediaOverlayTransitionEnd}
              />
            ) : null}
          </m.div>
        ) : null}

        <m.div className="aura-hub-stage-toolbar" variants={hubBandVariants}>
          <GameHubControlsPill hiddenGames={hubData.hiddenGames || []} />
        </m.div>

        <m.div className="aura-hub-column" variants={hubBandVariants}>
          <div className="aura-hub-hero-wrap">
            <div className="aura-hub-hero-shell">
              <AuraHero {...hubHeroBaseProps} compact={isHeroCompact} />
            </div>
          </div>

          <main ref={setScrollRef} className="aura-hub-content" onScroll={scheduleHeroScrollMode}>
            {hubSections}
          </main>
        </m.div>
        </MotionDiv>
      </div>
    </section>
    </GameHubTileDialogsProvider>
  );
}
