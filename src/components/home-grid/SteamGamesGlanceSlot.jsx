/**
 * Home-grid Steam glance tile — recent / most-played / favorites / tagged shelves.
 * Portrait library covers; denser scrollable shelf with shared display prefs.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Gamepad2, Star, Tags } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import HomeWidgetShell from './HomeWidgetShell';
import { SteamCoverTile, SteamGamesShelf } from './SteamGamesShelf';
import SteamWidgetHeading from './SteamWidgetHeading';
import { normalizeHomeWidgetSurface } from '../../utils/homeWidgetSurface';
import { resolveHomeWidgetLayout } from '../../utils/homeWidgetLayout';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { matchHomeSlotSizePreset } from './slotKindRegistry';
import { launchWithFeedback } from '../../utils/launchWithFeedback';
import { useLaunchFeedback } from '../../contexts/LaunchFeedbackContext';
import { openSettingsToIntegrationsSubtab } from '../../utils/settingsNavigation';
import {
  sortMostPlayedSteamGames,
  sortRecentSteamGames,
  sortTaggedSteamGames,
  sortWeeFavoriteSteamGames,
  steamEnrichmentIpcArgs,
} from '../../utils/steamGamesGlance';
import {
  getHomeSteamTileSizeConfig,
  normalizeHomeSteamWidget,
  resolveSteamShelfTileLayout,
} from '../../utils/homeSteamWidgetPrefs';

/** Stable empty fallback — never allocate `|| []` inside a useShallow selector. */
const EMPTY_ENRICHED_GAMES = Object.freeze([]);
const EMPTY_HIDDEN_GAME_IDS = Object.freeze([]);
const EMPTY_FAVORITES = Object.freeze([]);
const EMPTY_TAGS_MAP = Object.freeze({});

const CLIENT_META_TTL_MS = 5 * 60 * 1000;

const VARIANT_META = {
  recent: {
    title: 'Recent',
    kindId: 'steamRecent',
    ariaLabel: 'Steam Recently Played',
    launchSource: 'steamRecent',
    emptyNoData: 'No recent Steam play yet',
    needsClientMeta: false,
    needsApi: true,
    icon: Gamepad2,
    playtimeField: 'playtimeRecent',
  },
  mostPlayed: {
    title: 'Most Played',
    kindId: 'steamMostPlayed',
    ariaLabel: 'Steam Most Played',
    launchSource: 'steamMostPlayed',
    emptyNoData: 'No playtime data yet',
    needsClientMeta: false,
    needsApi: true,
    icon: Gamepad2,
    playtimeField: 'playtimeForever',
  },
  favorites: {
    title: 'Favorites',
    kindId: 'steamFavorites',
    ariaLabel: 'Steam Favorites',
    launchSource: 'steamFavorites',
    emptyNoData: 'Star games in Game Hub to fill this shelf',
    needsClientMeta: false,
    needsApi: true,
    icon: Star,
    playtimeField: 'playtimeForever',
  },
  tagged: {
    title: 'Tags',
    kindId: 'steamTags',
    ariaLabel: 'Steam Tagged Games',
    launchSource: 'steamTags',
    emptyNoData: 'Pick a Steam library tag in Looks',
    needsClientMeta: true,
    needsApi: false,
    icon: Tags,
    playtimeField: 'playtimeForever',
  },
};

function SteamGamesGlanceSlot({
  variant = 'recent',
  slot,
  channelId,
  arrangeMode = false,
  punchMode = false,
  selected = false,
  onArrangeSelect,
}) {
  const meta = VARIANT_META[variant] || VARIANT_META.recent;
  const {
    enrichedGames,
    hiddenGameIds,
    favoriteGameIds,
    steamId,
    apiKeyConfigured,
    apiEnabled,
    lastSyncedAt,
    homeSteamWidgetRaw,
  } = useConsolidatedAppStore(
    useShallow((state) => ({
      // Never allocate || [] / normalize() inside useShallow — new refs → React #185.
      enrichedGames: state.gameHub?.library?.enrichedGames,
      hiddenGameIds: Array.isArray(state.gameHub?.ui?.hiddenGameIds)
        ? state.gameHub.ui.hiddenGameIds
        : EMPTY_HIDDEN_GAME_IDS,
      favoriteGameIds: Array.isArray(state.gameHub?.ui?.favoriteGameIds)
        ? state.gameHub.ui.favoriteGameIds
        : EMPTY_FAVORITES,
      steamId: state.gameHub?.profile?.steamId || '',
      apiKeyConfigured: Boolean(String(state.gameHub?.profile?.steamWebApiKey || '').trim()),
      apiEnabled: state.gameHub?.profile?.useSteamWebApi !== false,
      lastSyncedAt: state.gameHub?.library?.lastSyncedAt || 0,
      homeSteamWidgetRaw: state.ui?.homeSteamWidget,
    }))
  );
  const setGameHubState = useConsolidatedAppStore((s) => s.actions.setGameHubState);
  const { beginLaunchFeedback, endLaunchFeedback, showLaunchError } = useLaunchFeedback();
  const softRefreshTried = useRef(false);
  const clientMetaSteamIdRef = useRef('');
  const [clientMeta, setClientMeta] = useState({
    favoritesAppIds: EMPTY_FAVORITES,
    appIdToTags: EMPTY_TAGS_MAP,
    fetchedAt: 0,
    error: null,
  });

  const steamPrefs = useMemo(
    () => normalizeHomeSteamWidget(homeSteamWidgetRaw),
    [homeSteamWidgetRaw]
  );
  const enrichedList = Array.isArray(enrichedGames) ? enrichedGames : EMPTY_ENRICHED_GAMES;
  const selectedTag = String(slot?.widget?.tag || '').trim();

  const sizePreset = useMemo(
    () =>
      matchHomeSlotSizePreset(meta.kindId, slot?.colSpan ?? 2, slot?.rowSpan ?? 2) || {
        id: 'M',
        colSpan: 2,
        rowSpan: 2,
        capacity: 12,
      },
    [meta.kindId, slot?.colSpan, slot?.rowSpan]
  );

  const tileCfg = getHomeSteamTileSizeConfig(steamPrefs.tileSize);
  const shelfLayout = resolveSteamShelfTileLayout({
    colSpan: slot?.colSpan ?? sizePreset.colSpan ?? 2,
    rowSpan: slot?.rowSpan ?? sizePreset.rowSpan ?? 2,
  });
  const capacity =
    shelfLayout.mode === 'shelf'
      ? Math.min(Number(sizePreset.capacity) || 14, shelfLayout.capacityCap)
      : Math.max(Number(sizePreset.capacity) || 12, tileCfg.capacity);
  const interactionsLocked = arrangeMode || punchMode;
  const surface = normalizeHomeWidgetSurface(slot?.surface);
  const colSpan = slot?.colSpan ?? sizePreset.colSpan ?? 2;
  const rowSpan = slot?.rowSpan ?? sizePreset.rowSpan ?? 2;
  const layout = useMemo(
    () => resolveHomeWidgetLayout(colSpan, rowSpan),
    [colSpan, rowSpan]
  );
  // 1-row cinema shelves use cozy density + width caps; taller grids stay compact/dense.
  const coverDensity =
    shelfLayout.mode === 'shelf'
      ? shelfLayout.density
      : layout.density === 'roomy'
        ? 'cozy'
        : 'compact';

  useEffect(() => {
    // Client VDF metadata is only required for Steam Tags (not Wee Favorites).
    if (!meta.needsClientMeta) return;
    if (!steamId || !window.api?.steam?.getClientLibraryMetadata) return;
    const age = Date.now() - Number(clientMeta.fetchedAt || 0);
    const sameUser = clientMetaSteamIdRef.current === steamId;
    if (sameUser && clientMeta.fetchedAt && age < CLIENT_META_TTL_MS) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await window.api.steam.getClientLibraryMetadata({ steamId });
        if (cancelled) return;
        clientMetaSteamIdRef.current = steamId;
        setClientMeta({
          favoritesAppIds: Array.isArray(res?.favoritesAppIds) ? res.favoritesAppIds : EMPTY_FAVORITES,
          appIdToTags:
            res?.appIdToTags && typeof res.appIdToTags === 'object'
              ? res.appIdToTags
              : EMPTY_TAGS_MAP,
          fetchedAt: Date.now(),
          error: res?.ok === false ? res?.error || 'client-meta-failed' : null,
        });
      } catch (error) {
        if (cancelled) return;
        clientMetaSteamIdRef.current = steamId;
        setClientMeta((prev) => ({
          ...prev,
          fetchedAt: Date.now(),
          error: error?.message || 'client-meta-failed',
        }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [meta.needsClientMeta, steamId, clientMeta.fetchedAt]);

  const games = useMemo(() => {
    if (variant === 'favorites') {
      return sortWeeFavoriteSteamGames(enrichedList, favoriteGameIds, hiddenGameIds).slice(
        0,
        capacity
      );
    }
    if (variant === 'tagged') {
      return sortTaggedSteamGames(
        enrichedList,
        selectedTag,
        clientMeta.appIdToTags,
        hiddenGameIds
      ).slice(0, capacity);
    }
    if (variant === 'mostPlayed') {
      return sortMostPlayedSteamGames(enrichedList, hiddenGameIds).slice(0, capacity);
    }
    return sortRecentSteamGames(enrichedList, hiddenGameIds).slice(0, capacity);
  }, [
    variant,
    enrichedList,
    hiddenGameIds,
    favoriteGameIds,
    capacity,
    clientMeta.appIdToTags,
    selectedTag,
  ]);

  useEffect(() => {
    if (softRefreshTried.current) return;
    if (!steamId || !apiEnabled) return;
    if (games.length > 0) return;
    if (variant === 'favorites' && favoriteGameIds.length === 0) return;
    if (meta.needsClientMeta && !meta.needsApi) return;
    if (!window.api?.steam?.getEnrichedGames) return;
    softRefreshTried.current = true;
    let cancelled = false;
    (async () => {
      try {
        const profile = useConsolidatedAppStore.getState().gameHub?.profile;
        const args = steamEnrichmentIpcArgs(profile);
        if (!args) return;
        const enriched = await window.api.steam.getEnrichedGames(args);
        if (cancelled) return;
        const list = Array.isArray(enriched?.games) ? enriched.games : [];
        if (list.length === 0) return;
        setGameHubState({
          library: {
            ...(useConsolidatedAppStore.getState().gameHub?.library || {}),
            enrichedGames: list,
            lastSyncedAt: Date.now(),
            lastEnrichedSteamId: steamId,
          },
        });
      } catch {
        /* leave empty state */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [steamId, apiEnabled, games.length, setGameHubState, meta.needsClientMeta, meta.needsApi, variant, favoriteGameIds.length]);

  const handleLaunch = useCallback(
    async (game) => {
      if (interactionsLocked || !window.api?.launchApp) return;
      const appId = String(game.appId);
      const path = `steam://rungameid/${appId}`;
      await launchWithFeedback({
        launch: () =>
          window.api.launchApp({
            type: 'steam',
            path,
            asAdmin: false,
          }),
        beginLaunchFeedback,
        endLaunchFeedback,
        showLaunchError,
        label: `Launching ${game.name || 'Steam game'}`,
        launchType: 'steam',
        path,
        source: meta.launchSource,
      });
    },
    [interactionsLocked, beginLaunchFeedback, endLaunchFeedback, showLaunchError, meta.launchSource]
  );

  const openSteamApiSettings = useCallback(() => {
    if (interactionsLocked && !arrangeMode) return;
    openSettingsToIntegrationsSubtab('steam');
  }, [interactionsLocked, arrangeMode]);

  const handleActivate = useCallback(
    (event) => {
      if (arrangeMode && !punchMode) {
        event?.stopPropagation?.();
        onArrangeSelect?.(channelId);
        return;
      }
      if (interactionsLocked) return;
      if (games.length === 0) {
        openSteamApiSettings();
      }
    },
    [
      arrangeMode,
      punchMode,
      interactionsLocked,
      games.length,
      openSteamApiSettings,
      onArrangeSelect,
      channelId,
    ]
  );

  const headingTitle =
    variant === 'tagged' && selectedTag ? selectedTag : meta.title;
  const HeadingIcon = meta.icon || Gamepad2;

  let emptyHint = meta.emptyNoData;
  if (!steamId) {
    emptyHint = 'Set Steam ID in Now Playing, Steam & Widgets';
  } else if (meta.needsClientMeta && clientMeta.error === 'steam-not-found') {
    emptyHint = 'Steam install not found on this PC';
  } else if (meta.needsClientMeta && clientMeta.error === 'sharedconfig-missing') {
    emptyHint = 'Open Steam once so tags can sync';
  } else if (variant === 'tagged' && !selectedTag) {
    emptyHint = 'Pick a Steam library tag in Looks';
  } else if (variant === 'favorites' && favoriteGameIds.length === 0) {
    emptyHint = meta.emptyNoData;
  } else if (meta.needsApi && !apiEnabled) {
    emptyHint = 'Enable Steam Web API in Now Playing, Steam & Widgets';
  } else if (meta.needsApi && !apiKeyConfigured && !lastSyncedAt) {
    emptyHint = 'Add Steam API key in Now Playing, Steam & Widgets';
  } else if (meta.needsApi && !lastSyncedAt && variant !== 'favorites') {
    emptyHint = 'Sync Steam from Now Playing, Steam & Widgets';
  }

  return (
    <HomeWidgetShell
      surface={surface}
      brandTone="steam"
      textColor={slot?.textColor}
      selected={selected}
      className={layout.shellPadClass}
      onClick={handleActivate}
      aria-label={meta.ariaLabel}
    >
      {games.length === 0 ? (
        <button
          type="button"
          className={`flex h-full w-full flex-col items-center justify-center text-center transition-transform hover:scale-[1.02] active:scale-95 ${layout.gapClass}`}
          onClick={(event) => {
            event.stopPropagation();
            if (arrangeMode && !punchMode) {
              onArrangeSelect?.(channelId);
              return;
            }
            openSteamApiSettings();
          }}
          disabled={interactionsLocked && !arrangeMode}
        >
          <HeadingIcon
            size={layout.iconPx + 4}
            strokeWidth={2.25}
            className="text-[hsl(var(--primary))]"
            aria-hidden
          />
          <span className="max-w-[14rem] text-[10px] font-black uppercase tracking-[0.12em] text-[var(--hw-text-secondary)]">
            {emptyHint}
          </span>
        </button>
      ) : (
        <div className={`flex min-h-0 flex-1 flex-col ${layout.gapClass}`}>
          {layout.showHeader ? (
            <SteamWidgetHeading
              title={headingTitle}
              icon={HeadingIcon}
              compact={rowSpan <= 1}
            />
          ) : null}
          <SteamGamesShelf
            prefs={steamPrefs}
            colSpan={colSpan}
            rowSpan={rowSpan}
            coverDensity={coverDensity}
          >
            {games.map((game) => (
              <SteamCoverTile
                key={String(game.appId)}
                appId={game.appId}
                name={game.name}
                imageUrl={game.imageUrl}
                playtimeMinutes={Number(game[meta.playtimeField] || game.playtimeForever || 0)}
                showPlaytime={steamPrefs.showPlaytime}
                showName={steamPrefs.showName}
                density={coverDensity}
                onActivate={() => handleLaunch(game)}
              />
            ))}
          </SteamGamesShelf>
        </div>
      )}
    </HomeWidgetShell>
  );
}

SteamGamesGlanceSlot.propTypes = {
  variant: PropTypes.oneOf(['recent', 'mostPlayed', 'favorites', 'tagged']),
  slot: PropTypes.object,
  channelId: PropTypes.string,
  arrangeMode: PropTypes.bool,
  punchMode: PropTypes.bool,
  selected: PropTypes.bool,
  onArrangeSelect: PropTypes.func,
};

export default React.memo(SteamGamesGlanceSlot);
