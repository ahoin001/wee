/**
 * Home-grid Steam glance tile — recent or most-played from enrichment cache.
 */
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { Gamepad2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import HomeWidgetShell from './HomeWidgetShell';
import { normalizeHomeWidgetSurface } from '../../utils/homeWidgetSurface';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { matchSizePresetBySpan } from '../../utils/homeSlotSizePresets';
import { launchWithFeedback } from '../../utils/launchWithFeedback';
import { useLaunchFeedback } from '../../contexts/LaunchFeedbackContext';
import { openSettingsToTab, SETTINGS_TAB_ID } from '../../utils/settingsNavigation';
import {
  STEAM_CDN_CAPSULE,
  sortMostPlayedSteamGames,
  sortRecentSteamGames,
  steamEnrichmentIpcArgs,
} from '../../utils/steamGamesGlance';

const VARIANT_META = {
  recent: {
    title: 'Steam Recent',
    ariaLabel: 'Steam Recently Played',
    launchSource: 'steamRecent',
    emptyNoData: 'No recent Steam play yet',
    sort: sortRecentSteamGames,
  },
  mostPlayed: {
    title: 'Steam Most Played',
    ariaLabel: 'Steam Most Played',
    launchSource: 'steamMostPlayed',
    emptyNoData: 'No playtime data yet',
    sort: sortMostPlayedSteamGames,
  },
};

function SteamCapsuleButton({ game, onLaunch }) {
  const appId = String(game.appId);
  return (
    <button
      type="button"
      title={game.name}
      aria-label={`Launch ${game.name}`}
      onClick={(event) => {
        event.stopPropagation();
        onLaunch(game);
      }}
      className="home-widget-float-tile aspect-[2/3] w-full overflow-hidden rounded-xl border-2 border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-elevated)/0.85)] shadow-[var(--shadow-sm)] transition-transform hover:scale-105 active:scale-95"
    >
      <img
        src={STEAM_CDN_CAPSULE(appId)}
        alt=""
        className="h-full w-full object-cover"
        draggable={false}
        loading="lazy"
      />
    </button>
  );
}

SteamCapsuleButton.propTypes = {
  game: PropTypes.shape({
    appId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
  }).isRequired,
  onLaunch: PropTypes.func.isRequired,
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
  const { enrichedGames, steamId, apiKeyConfigured, apiEnabled, lastSyncedAt } =
    useConsolidatedAppStore(
      useShallow((state) => ({
        enrichedGames: state.gameHub?.library?.enrichedGames || [],
        steamId: state.gameHub?.profile?.steamId || '',
        apiKeyConfigured: Boolean(String(state.gameHub?.profile?.steamWebApiKey || '').trim()),
        apiEnabled: state.gameHub?.profile?.useSteamWebApi !== false,
        lastSyncedAt: state.gameHub?.library?.lastSyncedAt || 0,
      }))
    );
  const setGameHubState = useConsolidatedAppStore((s) => s.actions.setGameHubState);
  const { beginLaunchFeedback, endLaunchFeedback, showLaunchError } = useLaunchFeedback();
  const softRefreshTried = useRef(false);

  const sizePreset = useMemo(
    () => matchSizePresetBySpan(slot?.colSpan ?? 1, slot?.rowSpan ?? 1) || matchSizePresetBySpan(1, 1),
    [slot?.colSpan, slot?.rowSpan]
  );
  const capacity =
    sizePreset?.id === 'S' ? 1 : sizePreset?.id === 'M' ? 3 : sizePreset?.id === 'L' ? 6 : 4;
  const isCompact = sizePreset?.id === 'S';
  const interactionsLocked = arrangeMode || punchMode;
  const surface = normalizeHomeWidgetSurface(slot?.surface);

  const games = useMemo(
    () => meta.sort(enrichedGames).slice(0, capacity),
    [enrichedGames, capacity, meta]
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
    openSettingsToTab(SETTINGS_TAB_ID.API_INTEGRATIONS);
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
        return;
      }
      if (isCompact && games[0]) {
        void handleLaunch(games[0]);
      }
    },
    [
      arrangeMode,
      punchMode,
      interactionsLocked,
      games,
      isCompact,
      handleLaunch,
      openSteamApiSettings,
      onArrangeSelect,
      channelId,
    ]
  );

  const emptyHint = !steamId
    ? 'Set Steam ID in API & Widgets'
    : !apiEnabled
      ? 'Enable Steam Web API in API & Widgets'
      : !apiKeyConfigured && !lastSyncedAt
        ? 'Add Steam API key in API & Widgets'
        : lastSyncedAt
          ? meta.emptyNoData
          : 'Sync Steam from API & Widgets';

  return (
    <HomeWidgetShell
      surface={surface}
      selected={selected}
      className="p-2"
      onClick={handleActivate}
      aria-label={meta.ariaLabel}
    >
      {games.length === 0 ? (
        <button
          type="button"
          className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-center transition-transform hover:scale-[1.02] active:scale-95"
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
            size={isCompact ? 22 : 28}
            strokeWidth={2.25}
            className="text-[hsl(var(--primary))]"
            aria-hidden
          />
          <span className="max-w-[12rem] text-[10px] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
            {isCompact ? 'Steam' : emptyHint}
          </span>
        </button>
      ) : isCompact ? (
        <button
          type="button"
          className="flex h-full w-full flex-col items-center justify-center gap-1 transition-transform hover:scale-[1.03] active:scale-95"
          onClick={handleActivate}
          aria-label={`Launch ${games[0].name}`}
          title={games[0].name}
          disabled={interactionsLocked && !arrangeMode}
        >
          <img
            src={STEAM_CDN_CAPSULE(String(games[0].appId))}
            alt=""
            className="h-10 w-7 rounded-md object-cover"
            draggable={false}
          />
          <span className="max-w-full truncate text-[9px] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-secondary))]">
            {games[0].name}
          </span>
        </button>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between gap-1 px-0.5">
            <span className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-secondary))]">
              {meta.title}
            </span>
            <Gamepad2 size={12} strokeWidth={2.5} className="shrink-0 text-[hsl(var(--text-tertiary))]" aria-hidden />
          </div>
          <div className="grid min-h-0 flex-1 content-start gap-1.5 grid-cols-3">
            {games.map((game) => (
              <SteamCapsuleButton
                key={String(game.appId)}
                game={game}
                onLaunch={handleLaunch}
              />
            ))}
          </div>
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
