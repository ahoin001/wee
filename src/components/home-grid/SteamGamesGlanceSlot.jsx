/**
 * Home-grid Steam glance tile — recent or most-played from enrichment cache.
 * Portrait library covers; denser scrollable shelf with shared display prefs.
 */
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { Gamepad2 } from 'lucide-react';
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
  getHomeSteamTileSizeConfig,
  normalizeHomeSteamWidget,
} from '../../utils/homeSteamWidgetPrefs';
import {
  sortMostPlayedSteamGames,
  sortRecentSteamGames,
  steamEnrichmentIpcArgs,
} from '../../utils/steamGamesGlance';

/** Stable empty fallback — never allocate `|| []` inside a useShallow selector. */
const EMPTY_ENRICHED_GAMES = Object.freeze([]);

const VARIANT_META = {
  recent: {
    title: 'Recent',
    kindId: 'steamRecent',
    ariaLabel: 'Steam Recently Played',
    launchSource: 'steamRecent',
    emptyNoData: 'No recent Steam play yet',
    sort: sortRecentSteamGames,
    playtimeField: 'playtimeRecent',
  },
  mostPlayed: {
    title: 'Most Played',
    kindId: 'steamMostPlayed',
    ariaLabel: 'Steam Most Played',
    launchSource: 'steamMostPlayed',
    emptyNoData: 'No playtime data yet',
    sort: sortMostPlayedSteamGames,
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
  const { enrichedGames, steamId, apiKeyConfigured, apiEnabled, lastSyncedAt, homeSteamWidgetRaw } =
    useConsolidatedAppStore(
      useShallow((state) => ({
        // Never allocate || [] / normalize() inside useShallow — new refs → React #185.
        enrichedGames: state.gameHub?.library?.enrichedGames,
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

  const steamPrefs = useMemo(
    () => normalizeHomeSteamWidget(homeSteamWidgetRaw),
    [homeSteamWidgetRaw]
  );
  const enrichedList = Array.isArray(enrichedGames) ? enrichedGames : EMPTY_ENRICHED_GAMES;

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
  const capacity = Math.max(Number(sizePreset.capacity) || 12, tileCfg.capacity);
  const interactionsLocked = arrangeMode || punchMode;
  const surface = normalizeHomeWidgetSurface(slot?.surface);
  const colSpan = slot?.colSpan ?? sizePreset.colSpan ?? 2;
  const rowSpan = slot?.rowSpan ?? sizePreset.rowSpan ?? 2;
  const layout = useMemo(
    () => resolveHomeWidgetLayout(colSpan, rowSpan),
    [colSpan, rowSpan]
  );
  // Covers are always Dense; density follows widget footprint for chrome only.
  const coverDensity = layout.density === 'roomy' ? 'cozy' : 'compact';

  const games = useMemo(
    () => meta.sort(enrichedList).slice(0, capacity),
    [enrichedList, capacity, meta]
  );

  useEffect(() => {
    if (softRefreshTried.current) return;
    if (!steamId || !apiEnabled) return;
    if (games.length > 0) return;
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
  }, [steamId, apiEnabled, games.length, setGameHubState]);

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

  const emptyHint = !steamId
    ? 'Set Steam ID in Now Playing, Steam & Widgets'
    : !apiEnabled
      ? 'Enable Steam Web API in Now Playing, Steam & Widgets'
      : !apiKeyConfigured && !lastSyncedAt
        ? 'Add Steam API key in Now Playing, Steam & Widgets'
        : lastSyncedAt
          ? meta.emptyNoData
          : 'Sync Steam from Now Playing, Steam & Widgets';

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
          <Gamepad2
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
              title={meta.title}
              icon={Gamepad2}
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
  variant: PropTypes.oneOf(['recent', 'mostPlayed']),
  slot: PropTypes.object,
  channelId: PropTypes.string,
  arrangeMode: PropTypes.bool,
  punchMode: PropTypes.bool,
  selected: PropTypes.bool,
  onArrangeSelect: PropTypes.func,
};

export default React.memo(SteamGamesGlanceSlot);
