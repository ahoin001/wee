/**
 * Home-grid Steam Recently Played tile — reads Game Hub enrichment cache (no new poller).
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

const STEAM_CDN_CAPSULE = (appId) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`;

function sortRecentSteamGames(games) {
  return [...(games || [])]
    .filter((g) => g?.appId)
    .sort((a, b) => {
      const recentA = Number(a.playtimeRecent || 0);
      const recentB = Number(b.playtimeRecent || 0);
      if (recentB !== recentA) return recentB - recentA;
      return Number(b.lastPlayedAt || 0) - Number(a.lastPlayedAt || 0);
    })
    .filter((g) => Number(g.playtimeRecent || 0) > 0 || Number(g.lastPlayedAt || 0) > 0);
}

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
      className="aspect-[2/3] w-full overflow-hidden rounded-xl border-2 border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-elevated)/0.85)] shadow-[var(--shadow-sm)] transition-transform hover:scale-105 active:scale-95"
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

function SteamRecentSlot({
  slot,
  channelId,
  arrangeMode = false,
  punchMode = false,
  selected = false,
  onArrangeSelect,
}) {
  const { enrichedGames, steamId, apiEnabled, lastSyncedAt } = useConsolidatedAppStore(
    useShallow((state) => ({
      enrichedGames: state.gameHub?.library?.enrichedGames || [],
      steamId: state.gameHub?.profile?.steamId || '',
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

  const recent = useMemo(
    () => sortRecentSteamGames(enrichedGames).slice(0, capacity),
    [enrichedGames, capacity]
  );

  // Soft one-shot refresh when cache empty and Steam settings allow — no new poller.
  useEffect(() => {
    if (softRefreshTried.current) return;
    if (!steamId || !apiEnabled) return;
    if (recent.length > 0) return;
    if (!window.api?.steam?.getEnrichedGames) return;
    softRefreshTried.current = true;
    let cancelled = false;
    (async () => {
      try {
        const enriched = await window.api.steam.getEnrichedGames({ steamId });
        if (cancelled) return;
        const games = Array.isArray(enriched?.games) ? enriched.games : [];
        if (games.length === 0) return;
        setGameHubState({
          library: {
            ...(useConsolidatedAppStore.getState().gameHub?.library || {}),
            enrichedGames: games,
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
  }, [steamId, apiEnabled, recent.length, setGameHubState]);

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
        source: 'steamRecent',
      });
    },
    [interactionsLocked, beginLaunchFeedback, endLaunchFeedback, showLaunchError]
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
      if (recent.length === 0) {
        openSteamApiSettings();
        return;
      }
      if (isCompact && recent[0]) {
        void handleLaunch(recent[0]);
      }
    },
    [
      arrangeMode,
      punchMode,
      interactionsLocked,
      recent,
      isCompact,
      handleLaunch,
      openSteamApiSettings,
      onArrangeSelect,
      channelId,
    ]
  );

  const emptyHint = !steamId
    ? 'Set SteamID in API & Widgets'
    : !apiEnabled
      ? 'Enable Steam Web API in API & Widgets'
      : lastSyncedAt
        ? 'No recent Steam play yet'
        : 'Sync Steam from API & Widgets'

  return (
    <HomeWidgetShell
      surface={surface}
      selected={selected}
      className="p-2"
      onClick={handleActivate}
      aria-label="Steam Recently Played"
    >
      {recent.length === 0 ? (
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
          aria-label={`Launch ${recent[0].name}`}
          title={recent[0].name}
          disabled={interactionsLocked && !arrangeMode}
        >
          <img
            src={STEAM_CDN_CAPSULE(String(recent[0].appId))}
            alt=""
            className="h-10 w-7 rounded-md object-cover"
            draggable={false}
          />
          <span className="max-w-full truncate text-[9px] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-secondary))]">
            {recent[0].name}
          </span>
        </button>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between gap-1 px-0.5">
            <span className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-secondary))]">
              Steam Recent
            </span>
            <Gamepad2 size={12} strokeWidth={2.5} className="shrink-0 text-[hsl(var(--text-tertiary))]" aria-hidden />
          </div>
          <div className="grid min-h-0 flex-1 content-start gap-1.5 grid-cols-3">
            {recent.map((game) => (
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

SteamRecentSlot.propTypes = {
  slot: PropTypes.object,
  channelId: PropTypes.string,
  arrangeMode: PropTypes.bool,
  punchMode: PropTypes.bool,
  selected: PropTypes.bool,
  onArrangeSelect: PropTypes.func,
};

export default React.memo(SteamRecentSlot);
