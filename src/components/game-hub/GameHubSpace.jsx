import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { useLaunchFeedback } from '../../contexts/LaunchFeedbackContext';
import { launchWithFeedback } from '../../utils/launchWithFeedback';
import { buildHubData } from './hubData';
import AuraHero from './AuraHero';
import AuraCollectionsSection from './AuraCollectionsSection';
import AuraLibrarySection from './AuraLibrarySection';
import { readHubDockInsetPx, scrollHubRegionIntoFocus } from './hubScrollUtils';
import './GameHubSpace.css';

/** hub-design style: first ~80px of scroll commits hero from spotlight → compact bar */
const HERO_SCROLL_COMPACT_THRESHOLD_PX = 80;

export default function GameHubSpace() {
  const { appLibrary, gameHub, setGameHubState, patchGameHubLastLaunch, appLibraryManager, showDock } =
    useConsolidatedAppStore(
      useShallow((state) => ({
        appLibrary: state.appLibrary,
        gameHub: state.gameHub,
        setGameHubState: state.actions.setGameHubState,
        patchGameHubLastLaunch: state.actions.patchGameHubLastLaunch,
        appLibraryManager: state.appLibraryManager,
        showDock: state.ui.showDock ?? true,
      }))
    );
  const { showLaunchError, beginLaunchFeedback, endLaunchFeedback } = useLaunchFeedback();

  const [isLaunching, setIsLaunching] = useState(false);
  const [isHeroCompact, setIsHeroCompact] = useState(false);
  const [heroPreviewGameId, setHeroPreviewGameId] = useState(null);
  const heroPreviewClearRef = useRef(null);
  const contentScrollRef = useRef(null);
  const stageRef = useRef(null);
  const heroScrollRafRef = useRef(null);

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
    const hydrate = async () => {
      setGameHubState({
        library: {
          syncStatus: 'loading',
          lastError: null,
          statusReason: '',
        },
      });

      try {
        await Promise.all([
          appLibraryManager?.fetchSteamGames?.(),
          appLibraryManager?.fetchEpicGames?.(),
        ]);

        const steamId = gameHub.profile?.steamId;
        const useSteamWebApi = gameHub.profile?.useSteamWebApi !== false;
        if (!useSteamWebApi) {
          setGameHubState({
            library: {
              enrichedGames: [],
              lastSyncedAt: Date.now(),
              syncStatus: 'local-only',
              statusReason: 'Steam enrichment disabled in Game Hub settings.',
              lastError: null,
            },
          });
          return;
        }

        if (!steamId || !window.api?.steam?.getEnrichedGames) {
          setGameHubState({
            library: {
              enrichedGames: [],
              lastSyncedAt: Date.now(),
              syncStatus: 'local-only',
              statusReason: 'Add SteamID64 in Game Hub settings to enrich your library.',
              lastError: null,
            },
          });
          return;
        }

        const enriched = await window.api.steam.getEnrichedGames({ steamId });
        const enrichedGames = Array.isArray(enriched?.games) ? enriched.games : [];
        const hasError = Boolean(enriched?.error);

        setGameHubState({
          library: {
            enrichedGames,
            lastSyncedAt: Date.now(),
            syncStatus: hasError ? 'error' : 'ready',
            statusReason: enriched?.statusReason || enriched?.error || '',
            lastError: hasError ? enriched.error : null,
          },
        });
      } catch (error) {
        setGameHubState({
          library: {
            syncStatus: 'error',
            statusReason: 'Network or API request failed.',
            lastError: error?.message || 'Failed to sync library',
          },
        });
      }
    };
    hydrate();
  }, [appLibraryManager, gameHub.profile?.steamId, gameHub.profile?.useSteamWebApi, setGameHubState]);

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
      weeCollections: gameHub.library?.weeCollections || [],
      lastLaunchedAt: gameHub.library?.lastLaunchedAt || {},
    }),
    [gameHub.ui?.favoriteGameIds, gameHub.library?.weeCollections, gameHub.library?.lastLaunchedAt]
  );

  const [clientLibrary, setClientLibrary] = useState({
    ok: false,
    favoritesAppIds: [],
    appIdToTags: {},
  });

  useEffect(() => {
    const steamId = gameHub.profile?.steamId;
    if (!steamId || !window.api?.steam?.getClientLibraryMetadata) {
      setClientLibrary({ ok: false, favoritesAppIds: [], appIdToTags: {} });
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await window.api.steam.getClientLibraryMetadata({ steamId });
        if (!cancelled && res && typeof res === 'object') {
          setClientLibrary({
            ok: Boolean(res.ok),
            favoritesAppIds: Array.isArray(res.favoritesAppIds) ? res.favoritesAppIds : [],
            appIdToTags: res.appIdToTags && typeof res.appIdToTags === 'object' ? res.appIdToTags : {},
          });
        }
      } catch {
        if (!cancelled) setClientLibrary({ ok: false, favoritesAppIds: [], appIdToTags: {} });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gameHub.profile?.steamId]);

  const showHubBackdrop = gameHub.ui?.showHubBackdrop ?? false;
  const effectsEnabled = gameHub.ui?.effectsEnabled ?? true;
  const activeCollectionId = gameHub.ui?.activeCollectionId || null;
  const selectedGameId = gameHub.ui?.selectedGameId || null;

  const hubData = useMemo(
    () =>
      buildHubData({
        steamGames: appLibrary.steamGames,
        epicGames: appLibrary.epicGames,
        enrichmentMap,
        clientLibrary,
        weeMeta,
      }),
    [appLibrary.epicGames, appLibrary.steamGames, enrichmentMap, clientLibrary, weeMeta]
  );

  const selectedGame = useMemo(
    () => hubData.installed.find((game) => game.id === selectedGameId) || null,
    [hubData.installed, selectedGameId]
  );

  const previewGame = useMemo(
    () => (heroPreviewGameId ? hubData.installed.find((g) => g.id === heroPreviewGameId) : null),
    [heroPreviewGameId, hubData.installed]
  );

  const heroGame =
    previewGame ||
    selectedGame ||
    hubData.favoritesOnly[0] ||
    hubData.recentlyPlayed[0] ||
    hubData.installed[0] ||
    null;

  const setHeroPreview = useCallback((game) => {
    if (heroPreviewClearRef.current) {
      window.clearTimeout(heroPreviewClearRef.current);
      heroPreviewClearRef.current = null;
    }
    if (game) {
      setHeroPreviewGameId(game.id);
      return;
    }
    heroPreviewClearRef.current = window.setTimeout(() => {
      setHeroPreviewGameId(null);
      heroPreviewClearRef.current = null;
    }, 90);
  }, []);
  const activeCollection = hubData.collections.items.find((collection) => collection.id === activeCollectionId) || null;
  const hasFavorites = hubData.railGames.length > 0;

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
    }
  };

  const floatingUi = !showHubBackdrop;

  return (
    <section
      className={`aura-hub-space ${floatingUi ? 'aura-hub-space--floating' : ''} ${effectsEnabled ? 'aura-hub-space--effects' : 'aura-hub-space--static'} ${isLaunching ? 'aura-hub-space--launching' : ''}`}
    >
      <div
        ref={stageRef}
        className={`aura-hub-stage ${isHeroCompact ? 'aura-hub-stage--scrolled' : ''} ${floatingUi ? 'aura-hub-stage--floating' : ''}`}
      >
        {showHubBackdrop && (heroGame?.headerUrl || heroGame?.imageUrl) ? (
          <div
            className="aura-hub-backdrop"
            style={{ backgroundImage: `url('${heroGame.headerUrl || heroGame.imageUrl}')` }}
            aria-hidden
          />
        ) : null}

        <button
          type="button"
          className="aura-hub-mode-toggle"
          onClick={() => setGameHubState({ ui: { showHubBackdrop: !showHubBackdrop } })}
          title={showHubBackdrop ? 'Hide hub backdrop' : 'Show hub backdrop'}
        >
          {showHubBackdrop ? 'Backdrop On' : 'Backdrop Off'}
        </button>

        <nav className="aura-hub-scroll-anchors" aria-label="Jump to hub section">
          <a
            href="#game-hub-collections"
            className="aura-hub-scroll-anchors__link"
            onClick={(e) => {
              e.preventDefault();
              const main = contentScrollRef.current;
              const region = document.getElementById('game-hub-collections');
              if (main && region) {
                scrollHubRegionIntoFocus(main, region, { bottomInset: readHubDockInsetPx(region) });
              }
            }}
          >
            Collections
          </a>
          <span className="aura-hub-scroll-anchors__sep" aria-hidden>
            ·
          </span>
          <a
            href="#game-hub-library"
            className="aura-hub-scroll-anchors__link"
            onClick={(e) => {
              e.preventDefault();
              const main = contentScrollRef.current;
              const region = document.getElementById('game-hub-library');
              if (main && region) {
                scrollHubRegionIntoFocus(main, region, { bottomInset: readHubDockInsetPx(region) });
              }
            }}
          >
            Library
          </a>
        </nav>

        <div className="aura-hub-column">
          <div className="aura-hub-hero-wrap">
            <div className="aura-hub-hero-shell">
            <AuraHero
              floatingUi={floatingUi}
              compact={isHeroCompact}
              effectsEnabled={effectsEnabled}
              selectedGameId={selectedGameId}
              heroGame={heroGame}
              heroNotice={
                gameHub.library?.syncStatus === 'error'
                  ? gameHub.library?.statusReason || 'Could not refresh Steam library stats.'
                  : null
              }
              hasSteamId={Boolean(gameHub.profile?.steamId)}
              hasFavorites={hasFavorites}
              railGames={hubData.railGames}
              onLaunchGame={handleLaunchGame}
              onSelectGame={(gameId) => setGameHubState({ ui: { selectedGameId: gameId } })}
              onHeroPreview={setHeroPreview}
            />
            </div>
          </div>

          <main ref={contentScrollRef} className="aura-hub-content" onScroll={scheduleHeroScrollMode}>
          <div id="game-hub-collections-anchor" className="aura-hub-scroll-anchor" aria-hidden />
          <AuraCollectionsSection
            scrollContainerRef={contentScrollRef}
            collections={hubData.collections.items}
            activeCollection={activeCollection}
            activeCollectionId={activeCollectionId}
            effectsEnabled={effectsEnabled}
            onSetCollection={(collectionId) => setGameHubState({ ui: { activeCollectionId: collectionId } })}
            onSelectGame={(gameId) => setGameHubState({ ui: { selectedGameId: gameId } })}
            onLaunchGame={handleLaunchGame}
            onHeroPreview={setHeroPreview}
          />
          <AuraLibrarySection
            games={hubData.installed}
            onSelectGame={(gameId) => setGameHubState({ ui: { selectedGameId: gameId } })}
            onLaunchGame={handleLaunchGame}
            onHeroPreview={setHeroPreview}
          />
          </main>
        </div>
      </div>
    </section>
  );
}
