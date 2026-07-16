/**
 * Home-grid Steam Friends — console-style list of friends in-game.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Lock, Users } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import HomeWidgetShell from './HomeWidgetShell';
import SteamWidgetHeading from './SteamWidgetHeading';
import { WeeFadeScroll } from '../../ui/wee';
import { normalizeHomeWidgetSurface } from '../../utils/homeWidgetSurface';
import { resolveHomeWidgetLayout } from '../../utils/homeWidgetLayout';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { matchHomeSlotSizePreset } from './slotKindRegistry';
import { launchWithFeedback } from '../../utils/launchWithFeedback';
import { useLaunchFeedback } from '../../contexts/LaunchFeedbackContext';
import { openExternalUrl, openSettingsToTab, SETTINGS_TAB_ID } from '../../utils/settingsNavigation';
import { steamEnrichmentIpcArgs, STEAM_CDN_HEADER, STEAM_CDN_LIBRARY_COVER } from '../../utils/steamGamesGlance';

const FRIENDS_TTL_MS = 2 * 60 * 1000;
const STEAM_FRIENDS_PRIVACY_URL = 'https://steamcommunity.com/my/edit/settings';
const EMPTY_FRIENDS_PLAYING = Object.freeze([]);

const PRIVATE_FRIENDS_HINT =
  'Friends list is private on Steam. Set Friends List → Public, then tap to retry.';

function FriendListRow({ friend, interactionsLocked, onLaunchGame, onOpenProfile, layout }) {
  const gameId = friend.gameId ? String(friend.gameId) : '';
  const gameThumb = gameId ? STEAM_CDN_HEADER(gameId) : '';
  const coverFallback = gameId ? STEAM_CDN_LIBRARY_COVER(gameId) : '';

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
      disabled={interactionsLocked}
      onClick={(event) => {
        event.stopPropagation();
        if (interactionsLocked) return;
        if (friend.gameId) onLaunchGame?.(friend);
        else onOpenProfile?.(friend);
      }}
      className={`group flex w-full min-w-0 items-center border border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-elevated)/0.55)] text-left shadow-[var(--shadow-sm)] backdrop-blur-sm transition-[transform,background-color,border-color] hover:border-[hsl(var(--primary)/0.4)] hover:bg-[hsl(var(--surface-elevated)/0.82)] hover:shadow-[var(--shadow-hover-glow)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70 ${layout.listRowClass}`}
    >
      <div className="relative shrink-0">
        {friend.avatarUrl ? (
          <img
            src={friend.avatarUrl}
            alt=""
            className={`rounded-full border border-[hsl(var(--border-primary)/0.45)] object-cover ${
              layout.density === 'roomy'
                ? 'h-10 w-10'
                : layout.density === 'compact'
                  ? 'h-7 w-7'
                  : 'h-9 w-9'
            }`}
            draggable={false}
          />
        ) : (
          <span
            className={`flex items-center justify-center rounded-full bg-[hsl(var(--surface-secondary))] text-[11px] font-black text-[hsl(var(--text-secondary))] ${
              layout.density === 'roomy'
                ? 'h-10 w-10'
                : layout.density === 'compact'
                  ? 'h-7 w-7'
                  : 'h-9 w-9'
            }`}
          >
            {(friend.personaName || '?').slice(0, 1).toUpperCase()}
          </span>
        )}
        <span
          className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[hsl(var(--surface-elevated))] bg-[hsl(var(--signal-success))]"
          title="In game"
          aria-hidden
        />
      </div>

      <div className="min-w-0 flex-1">
        <div
          className={`truncate font-extrabold tracking-wide text-[hsl(var(--text-primary))] ${
            layout.density === 'roomy' ? 'text-[length:var(--font-size-caption)]' : 'text-[length:var(--font-size-micro)]'
          }`}
        >
          {friend.personaName}
        </div>
        <div
          className={`mt-0.5 truncate font-bold text-[hsl(var(--text-secondary))] ${
            layout.density === 'compact' ? 'text-[8px]' : 'text-[9px]'
          }`}
        >
          {friend.gameName ? (
            <>
              <span className="text-[hsl(var(--signal-success))]">Playing</span>
              <span className="text-[hsl(var(--text-tertiary))]"> · </span>
              {friend.gameName}
            </>
          ) : (
            'Online'
          )}
        </div>
      </div>

      {gameThumb ? (
        <div
          className={`relative shrink-0 overflow-hidden rounded-md border border-[hsl(var(--border-primary)/0.4)] bg-[hsl(var(--surface-secondary))] shadow-[var(--shadow-sm)] ${layout.listThumbClass}`}
        >
          <img
            src={gameThumb}
            alt=""
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            draggable={false}
            loading="lazy"
            onError={(event) => {
              const img = event.currentTarget;
              if (!coverFallback || img.dataset.fallback === 'cover') return;
              img.dataset.fallback = 'cover';
              img.src = coverFallback;
            }}
          />
        </div>
      ) : null}
    </button>
  );
}

FriendListRow.propTypes = {
  friend: PropTypes.shape({
    steamId: PropTypes.string,
    personaName: PropTypes.string,
    avatarUrl: PropTypes.string,
    gameId: PropTypes.string,
    gameName: PropTypes.string,
  }).isRequired,
  interactionsLocked: PropTypes.bool,
  onLaunchGame: PropTypes.func,
  onOpenProfile: PropTypes.func,
  layout: PropTypes.object.isRequired,
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
    friendsPlayingStatusCode,
    steamId,
    apiKeyConfigured,
    apiEnabled,
  } = useConsolidatedAppStore(
    useShallow((state) => ({
      friendsPlaying: state.gameHub?.library?.friendsPlaying,
      friendsPlayingFetchedAt: state.gameHub?.library?.friendsPlayingFetchedAt || 0,
      friendsPlayingError: state.gameHub?.library?.friendsPlayingError || null,
      friendsPlayingStatusCode: state.gameHub?.library?.friendsPlayingStatusCode || null,
      steamId: state.gameHub?.profile?.steamId || '',
      apiKeyConfigured: Boolean(String(state.gameHub?.profile?.steamWebApiKey || '').trim()),
      apiEnabled: state.gameHub?.profile?.useSteamWebApi !== false,
    }))
  );
  const setGameHubState = useConsolidatedAppStore((s) => s.actions.setGameHubState);
  const { beginLaunchFeedback, endLaunchFeedback, showLaunchError } = useLaunchFeedback();
  const [loading, setLoading] = useState(false);

  const friendsList = Array.isArray(friendsPlaying) ? friendsPlaying : EMPTY_FRIENDS_PLAYING;

  const sizePreset = useMemo(
    () =>
      matchHomeSlotSizePreset('steamFriends', slot?.colSpan ?? 2, slot?.rowSpan ?? 2) || {
        id: 'M',
        colSpan: 2,
        rowSpan: 2,
        capacity: 12,
      },
    [slot?.colSpan, slot?.rowSpan]
  );
  const layout = useMemo(
    () => resolveHomeWidgetLayout(slot?.colSpan ?? 2, slot?.rowSpan ?? 2),
    [slot?.colSpan, slot?.rowSpan]
  );
  const capacity = Math.max(
    Number(sizePreset.capacity) || 12,
    layout.density === 'roomy' ? 16 : 8
  );
  const interactionsLocked = arrangeMode || punchMode;
  const surface = normalizeHomeWidgetSurface(slot?.surface);
  const isPrivateFriends =
    friendsPlayingStatusCode === 'private-friends' ||
    /private/i.test(String(friendsPlayingError || ''));

  const friends = useMemo(
    () => friendsList.slice(0, capacity),
    [friendsList, capacity]
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
        const ok = result?.statusCode === 'ok' || result?.status === 'ok';
        setGameHubState({
          library: {
            friendsPlaying: list,
            friendsPlayingFetchedAt: Date.now(),
            friendsPlayingStatusCode: result?.statusCode || (ok ? 'ok' : 'api-error'),
            friendsPlayingError: ok
              ? null
              : result?.statusReason || result?.error || 'Failed to load friends',
          },
        });
      } catch (error) {
        if (cancelled) return;
        setGameHubState({
          library: {
            friendsPlayingStatusCode: 'network-error',
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

  const openSteamPrivacySettings = useCallback(() => {
    openExternalUrl(STEAM_FRIENDS_PRIVACY_URL);
  }, []);

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

  const handleOpenProfile = useCallback(
    (friend) => {
      if (interactionsLocked) return;
      const url =
        friend?.profileUrl ||
        (friend?.steamId ? `https://steamcommunity.com/profiles/${friend.steamId}` : '');
      if (url) openExternalUrl(url);
    },
    [interactionsLocked]
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
      if (isPrivateFriends) {
        openSteamPrivacySettings();
        return;
      }
      if (friends.length === 0) openSteamApiSettings();
    },
    [
      arrangeMode,
      punchMode,
      interactionsLocked,
      isPrivateFriends,
      friends.length,
      openSteamPrivacySettings,
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
        : isPrivateFriends
          ? PRIVATE_FRIENDS_HINT
          : friendsPlayingError
            ? friendsPlayingError
            : loading
              ? 'Loading friends…'
              : 'No friends in-game right now';

  return (
    <HomeWidgetShell
      surface={surface}
      selected={selected}
      className={layout.shellPadClass}
      onClick={handleActivate}
      aria-label="Steam Friends playing"
    >
      {friends.length === 0 ? (
        <button
          type="button"
          className={`flex h-full w-full flex-col items-center justify-center px-2 text-center transition-transform hover:scale-[1.02] active:scale-95 ${layout.gapClass}`}
          onClick={(event) => {
            event.stopPropagation();
            if (arrangeMode && !punchMode) {
              onArrangeSelect?.(channelId);
              return;
            }
            if (isPrivateFriends) {
              openSteamPrivacySettings();
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
          {isPrivateFriends ? (
            <Lock size={layout.iconPx} strokeWidth={2.25} className="text-[hsl(var(--primary))]" aria-hidden />
          ) : (
            <Users size={layout.iconPx} strokeWidth={2.25} className="text-[hsl(var(--primary))]" aria-hidden />
          )}
          <span className="max-w-[16rem] text-[10px] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
            {emptyHint}
          </span>
          {isPrivateFriends ? (
            <span className="max-w-[16rem] text-[9px] font-bold text-[hsl(var(--text-tertiary))]">
              Tap to open Steam privacy settings
            </span>
          ) : null}
        </button>
      ) : (
        <div className={`flex min-h-0 flex-1 flex-col ${layout.gapClass}`}>
          <SteamWidgetHeading title="Friends" icon={Users} />
          {layout.density !== 'compact' ? (
            <p className="-mt-0.5 mb-0 px-0.5 text-[9px] font-bold text-[hsl(var(--text-tertiary))]">
              {friends.length} in-game
            </p>
          ) : null}
          <WeeFadeScroll axis="y" fadePx={28} hideScrollbar className="min-h-0 flex-1">
            <div
              className={`pb-2 ${layout.gapClass} ${
                layout.listColumns > 1 ? 'grid grid-cols-2' : 'flex flex-col'
              }`}
            >
              {friends.map((friend) => (
                <FriendListRow
                  key={friend.steamId}
                  friend={friend}
                  interactionsLocked={interactionsLocked}
                  onLaunchGame={handleLaunchGame}
                  onOpenProfile={handleOpenProfile}
                  layout={layout}
                />
              ))}
            </div>
          </WeeFadeScroll>
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
