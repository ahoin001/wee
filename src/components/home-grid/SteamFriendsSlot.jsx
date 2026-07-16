/**
 * Home-grid Steam Friends — friends currently in a game.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Users } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import HomeWidgetShell from './HomeWidgetShell';
import { normalizeHomeWidgetSurface } from '../../utils/homeWidgetSurface';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { matchHomeSlotSizePreset } from './slotKindRegistry';
import { launchWithFeedback } from '../../utils/launchWithFeedback';
import { useLaunchFeedback } from '../../contexts/LaunchFeedbackContext';
import { openExternalUrl, openSettingsToTab, SETTINGS_TAB_ID } from '../../utils/settingsNavigation';
import { STEAM_CDN_CAPSULE, steamEnrichmentIpcArgs } from '../../utils/steamGamesGlance';

const GRID_COLS = 3;
const FRIENDS_TTL_MS = 2 * 60 * 1000;

function FriendPlayingCard({ friend, onLaunchGame, onOpenProfile }) {
  const hasGame = Boolean(friend.gameId);
  return (
    <button
      type="button"
      title={
        friend.gameName
          ? `${friend.personaName} · ${friend.gameName}`
          : friend.personaName
      }
      aria-label={
        friend.gameName
          ? `${friend.personaName} playing ${friend.gameName}`
          : friend.personaName
      }
      onClick={(event) => {
        event.stopPropagation();
        if (hasGame) onLaunchGame(friend);
        else onOpenProfile(friend);
      }}
      className="home-widget-float-tile relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border-2 border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-elevated)/0.9)] shadow-[var(--shadow-sm)] transition-transform hover:scale-[1.03] active:scale-95"
    >
      {hasGame ? (
        <img
          src={STEAM_CDN_CAPSULE(friend.gameId)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-90"
          draggable={false}
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-[hsl(var(--surface-secondary))]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--surface-primary)/0.92)] via-[hsl(var(--surface-primary)/0.35)] to-transparent" />
      <div className="relative z-[1] mt-auto flex min-w-0 items-center gap-1.5 p-1.5">
        {friend.avatarUrl ? (
          <img
            src={friend.avatarUrl}
            alt=""
            className="h-6 w-6 shrink-0 rounded-full border border-[hsl(var(--border-primary)/0.5)] object-cover"
            draggable={false}
          />
        ) : (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--surface-secondary))] text-[10px] font-black text-[hsl(var(--text-secondary))]">
            {(friend.personaName || '?').slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1 text-left">
          <div className="truncate text-[9px] font-black uppercase tracking-[0.08em] text-[hsl(var(--text-primary))]">
            {friend.personaName}
          </div>
          {friend.gameName ? (
            <div className="truncate text-[8px] font-bold text-[hsl(var(--text-secondary))]">
              {friend.gameName}
            </div>
          ) : null}
        </div>
      </div>
    </button>
  );
}

FriendPlayingCard.propTypes = {
  friend: PropTypes.shape({
    steamId: PropTypes.string,
    personaName: PropTypes.string,
    avatarUrl: PropTypes.string,
    gameId: PropTypes.string,
    gameName: PropTypes.string,
  }).isRequired,
  onLaunchGame: PropTypes.func.isRequired,
  onOpenProfile: PropTypes.func.isRequired,
};

function SteamFriendsSlot({
  slot,
  channelId,
  arrangeMode = false,
  punchMode = false,
  selected = false,
  onArrangeSelect,
}) {
  const {
    friendsPlaying,
    friendsPlayingFetchedAt,
    friendsPlayingError,
    steamId,
    apiKeyConfigured,
    apiEnabled,
  } = useConsolidatedAppStore(
    useShallow((state) => ({
      friendsPlaying: state.gameHub?.library?.friendsPlaying || [],
      friendsPlayingFetchedAt: state.gameHub?.library?.friendsPlayingFetchedAt || 0,
      friendsPlayingError: state.gameHub?.library?.friendsPlayingError || null,
      steamId: state.gameHub?.profile?.steamId || '',
      apiKeyConfigured: Boolean(String(state.gameHub?.profile?.steamWebApiKey || '').trim()),
      apiEnabled: state.gameHub?.profile?.useSteamWebApi !== false,
    }))
  );
  const setGameHubState = useConsolidatedAppStore((s) => s.actions.setGameHubState);
  const { beginLaunchFeedback, endLaunchFeedback, showLaunchError } = useLaunchFeedback();
  const [loading, setLoading] = useState(false);

  const sizePreset = useMemo(
    () =>
      matchHomeSlotSizePreset('steamFriends', slot?.colSpan ?? 2, slot?.rowSpan ?? 2) || {
        id: 'M',
        colSpan: 2,
        rowSpan: 2,
        capacity: 6,
      },
    [slot?.colSpan, slot?.rowSpan]
  );
  const capacity = Number(sizePreset.capacity) || 6;
  const gridRows = Math.max(1, Math.ceil(capacity / GRID_COLS));
  const interactionsLocked = arrangeMode || punchMode;
  const surface = normalizeHomeWidgetSurface(slot?.surface);

  const friends = useMemo(
    () => (Array.isArray(friendsPlaying) ? friendsPlaying : []).slice(0, capacity),
    [friendsPlaying, capacity]
  );

  useEffect(() => {
    if (!steamId || !apiEnabled || !window.api?.steam?.getFriendsPlaying) return;
    const age = Date.now() - Number(friendsPlayingFetchedAt || 0);
    if (friendsPlayingFetchedAt && age < FRIENDS_TTL_MS) return;

    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const profile = useConsolidatedAppStore.getState().gameHub?.profile;
        const args = steamEnrichmentIpcArgs(profile);
        if (!args) return;
        const result = await window.api.steam.getFriendsPlaying(args);
        if (cancelled) return;
        const list = Array.isArray(result?.friends) ? result.friends : [];
        setGameHubState({
          library: {
            friendsPlaying: list,
            friendsPlayingFetchedAt: Date.now(),
            friendsPlayingError:
              result?.statusCode === 'ok' || result?.status === 'ok'
                ? null
                : result?.statusReason || result?.error || null,
          },
        });
      } catch (error) {
        if (cancelled) return;
        setGameHubState({
          library: {
            friendsPlayingError: error?.message || 'Failed to load friends',
          },
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [steamId, apiEnabled, friendsPlayingFetchedAt, setGameHubState]);

  const forceRefreshFriends = useCallback(() => {
    setGameHubState({
      library: {
        friendsPlayingFetchedAt: 0,
      },
    });
  }, [setGameHubState]);

  const handleLaunchGame = useCallback(
    async (friend) => {
      if (interactionsLocked || !friend?.gameId || !window.api?.launchApp) return;
      const path = `steam://rungameid/${friend.gameId}`;
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
        label: `Launching ${friend.gameName || 'Steam game'}`,
        launchType: 'steam',
        path,
        source: 'steamFriends',
      });
    },
    [interactionsLocked, beginLaunchFeedback, endLaunchFeedback, showLaunchError]
  );

  const handleOpenProfile = useCallback((friend) => {
    if (interactionsLocked) return;
    const url = friend?.profileUrl || (friend?.steamId ? `https://steamcommunity.com/profiles/${friend.steamId}` : '');
    if (url) openExternalUrl(url);
  }, [interactionsLocked]);

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
      if (friends.length === 0) openSteamApiSettings();
    },
    [
      arrangeMode,
      punchMode,
      interactionsLocked,
      friends.length,
      openSteamApiSettings,
      onArrangeSelect,
      channelId,
    ]
  );

  const emptyHint = !steamId
    ? 'Set Steam ID in API & Widgets'
    : !apiEnabled
      ? 'Enable Steam Web API in API & Widgets'
      : !apiKeyConfigured && !friendsPlayingFetchedAt
        ? 'Add Steam API key in API & Widgets'
        : friendsPlayingError
          ? friendsPlayingError
          : loading
            ? 'Loading friends…'
            : 'No friends in-game right now';

  return (
    <HomeWidgetShell
      surface={surface}
      selected={selected}
      className="p-2"
      onClick={handleActivate}
      aria-label="Steam Friends playing"
    >
      {friends.length === 0 ? (
        <button
          type="button"
          className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-center transition-transform hover:scale-[1.02] active:scale-95"
          onClick={(event) => {
            event.stopPropagation();
            if (arrangeMode && !punchMode) {
              onArrangeSelect?.(channelId);
              return;
            }
            if (steamId && apiEnabled && apiKeyConfigured) {
              forceRefreshFriends();
              return;
            }
            openSteamApiSettings();
          }}
          disabled={interactionsLocked && !arrangeMode}
        >
          <Users size={28} strokeWidth={2.25} className="text-[hsl(var(--primary))]" aria-hidden />
          <span className="max-w-[14rem] text-[10px] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
            {emptyHint}
          </span>
        </button>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-1.5">
          <div className="flex shrink-0 items-center justify-between gap-1 px-0.5">
            <span className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-secondary))]">
              Steam Friends
            </span>
            <Users size={12} strokeWidth={2.5} className="shrink-0 text-[hsl(var(--text-tertiary))]" aria-hidden />
          </div>
          <div
            className="grid min-h-0 flex-1 gap-1.5"
            style={{
              gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))`,
            }}
          >
            {friends.map((friend) => (
              <FriendPlayingCard
                key={friend.steamId}
                friend={friend}
                onLaunchGame={handleLaunchGame}
                onOpenProfile={handleOpenProfile}
              />
            ))}
          </div>
        </div>
      )}
    </HomeWidgetShell>
  );
}

SteamFriendsSlot.propTypes = {
  slot: PropTypes.object,
  channelId: PropTypes.string,
  arrangeMode: PropTypes.bool,
  punchMode: PropTypes.bool,
  selected: PropTypes.bool,
  onArrangeSelect: PropTypes.func,
};

export default React.memo(SteamFriendsSlot);
