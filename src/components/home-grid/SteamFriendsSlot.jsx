/**
 * Home-grid Steam Friends — sectioned online (in-game first) then offline list.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ExternalLink, Lock, Users } from 'lucide-react';
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
import { openExternalUrl, openSettingsToIntegrationsSubtab } from '../../utils/settingsNavigation';
import { steamEnrichmentIpcArgs, STEAM_CDN_HEADER, STEAM_CDN_LIBRARY_COVER } from '../../utils/steamGamesGlance';

const FRIENDS_TTL_MS = 2 * 60 * 1000;
const STEAM_FRIENDS_PRIVACY_URL = 'https://steamcommunity.com/my/edit/settings';
const EMPTY_FRIENDS_PLAYING = Object.freeze([]);

const PRIVATE_FRIENDS_HINT =
  'Friends list is private on Steam. Set Friends List → Public, then tap to retry.';

/** Steam personaState → short label (0 Offline handled separately). */
const PERSONA_STATUS = Object.freeze({
  1: 'Online',
  2: 'Busy',
  3: 'Away',
  4: 'Snooze',
  5: 'Looking to trade',
  6: 'Looking to play',
});

function isFriendInGame(friend) {
  if (typeof friend?.inGame === 'boolean') return friend.inGame;
  return Boolean(friend?.gameId || friend?.gameName);
}

function isFriendOnline(friend) {
  if (typeof friend?.online === 'boolean') return friend.online;
  return isFriendInGame(friend) || Number(friend?.personaState || 0) >= 1;
}

/** Higher rank sorts first: in-game → online → offline. */
function friendPresenceRank(friend) {
  if (isFriendInGame(friend)) return 2;
  if (isFriendOnline(friend)) return 1;
  return 0;
}

function friendStatusLabel(friend) {
  if (isFriendInGame(friend) && friend.gameName) return null; // rendered as Playing · title
  if (!isFriendOnline(friend)) return 'Offline';
  return PERSONA_STATUS[Number(friend.personaState)] || 'Online';
}

function FriendSectionLabel({ children, spanGrid = false }) {
  return (
    <p
      className={`m-0 px-0.5 pt-1 text-[8px] font-black uppercase tracking-[0.18em] text-[var(--hw-text-tertiary)] first:pt-0 ${
        spanGrid ? 'col-span-2' : ''
      }`}
    >
      {children}
    </p>
  );
}

FriendSectionLabel.propTypes = {
  children: PropTypes.node,
  spanGrid: PropTypes.bool,
};

function FriendListRow({ friend, interactionsLocked, onLaunchGame, onOpenProfile, layout }) {
  const gameId = friend.gameId ? String(friend.gameId) : '';
  const gameThumb = gameId ? STEAM_CDN_HEADER(gameId) : '';
  const coverFallback = gameId ? STEAM_CDN_LIBRARY_COVER(gameId) : '';
  const avatarPx = Number(layout.listAvatarPx) || 40;
  const avatarStyle = { width: avatarPx, height: avatarPx };
  const online = isFriendOnline(friend);
  const inGame = isFriendInGame(friend);
  const statusOnly = friendStatusLabel(friend);
  const nameClass =
    layout.density === 'roomy'
      ? 'text-[length:var(--font-size-caption)]'
      : layout.density === 'compact'
        ? 'text-[length:var(--font-size-micro)]'
        : 'text-[11px]';
  const statusClass = layout.density === 'compact' ? 'text-[8px]' : 'text-[9px]';
  const avatarRing = inGame
    ? 'border-[hsl(var(--state-success)/0.75)]'
    : online
      ? 'border-[hsl(var(--primary)/0.65)]'
      : 'border-[hsl(var(--border-primary)/0.45)]';
  const presenceDot = inGame
    ? 'bg-[hsl(var(--state-success))]'
    : online
      ? 'bg-[hsl(var(--primary))]'
      : 'bg-[hsl(var(--text-tertiary))]';
  const accentBar = online
    ? 'bg-[hsl(var(--primary))] opacity-80'
    : 'bg-[hsl(var(--border-primary))] opacity-50';

  return (
    <div
      role="button"
      tabIndex={interactionsLocked ? -1 : 0}
      title={
        friend.gameName
          ? `${friend.personaName} · ${friend.gameName}`
          : friend.personaName
      }
      aria-label={
        friend.gameName
          ? `${friend.personaName} playing ${friend.gameName}`
          : `${friend.personaName}${statusOnly ? `, ${statusOnly}` : ''}`
      }
      aria-disabled={interactionsLocked || undefined}
      onClick={(event) => {
        event.stopPropagation();
        if (interactionsLocked) return;
        if (friend.gameId) onLaunchGame?.(friend);
        else onOpenProfile?.(friend);
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        event.stopPropagation();
        if (interactionsLocked) return;
        if (friend.gameId) onLaunchGame?.(friend);
        else onOpenProfile?.(friend);
      }}
      className={`group relative flex w-full min-w-0 items-center overflow-hidden border border-[hsl(var(--border-primary)/0.28)] bg-[hsl(var(--surface-elevated)/0.72)] text-left shadow-[var(--shadow-sm)] backdrop-blur-md transition-[transform,background-color,border-color,box-shadow,opacity] hover:border-[hsl(var(--primary)/0.55)] hover:bg-[hsl(var(--surface-elevated)/0.92)] hover:shadow-[var(--shadow-hover-glow)] active:scale-[0.985] ${
        interactionsLocked ? 'pointer-events-none opacity-70' : ''
      } ${online ? '' : 'opacity-80'} ${layout.listRowClass}`}
    >
      <span
        className={`pointer-events-none absolute inset-y-0 left-0 w-1 ${accentBar}`}
        aria-hidden
      />

      <div className="relative shrink-0">
        {friend.avatarUrl ? (
          <img
            src={friend.avatarUrl}
            alt=""
            style={avatarStyle}
            className={`rounded-full border-2 object-cover ${avatarRing}`}
            draggable={false}
          />
        ) : (
          <span
            style={avatarStyle}
            className={`flex items-center justify-center rounded-full border-2 bg-[hsl(var(--surface-secondary))] text-[11px] font-black text-[hsl(var(--text-secondary))] ${avatarRing}`}
          >
            {(friend.personaName || '?').slice(0, 1).toUpperCase()}
          </span>
        )}
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[hsl(var(--surface-elevated))] ${presenceDot}`}
          title={inGame ? 'In game' : online ? 'Online' : 'Offline'}
          aria-hidden
        />
      </div>

      <div className="min-w-0 flex-1 pr-1">
        <div
          className={`truncate font-extrabold tracking-wide text-[var(--hw-text-primary)] ${nameClass}`}
        >
          {friend.personaName}
        </div>
        <div className={`mt-0.5 truncate font-bold ${statusClass}`}>
          {friend.gameName ? (
            <>
              <span className="text-[hsl(var(--state-success))]">Playing</span>
              <span className="text-[var(--hw-text-tertiary)]"> · </span>
              <span className="text-[var(--hw-text-secondary)]">{friend.gameName}</span>
            </>
          ) : (
            <span
              className={
                online ? 'text-[var(--hw-text-secondary)]' : 'text-[var(--hw-text-tertiary)]'
              }
            >
              {statusOnly || 'Online'}
            </span>
          )}
        </div>
      </div>

      {gameThumb ? (
        <div
          className={`relative shrink-0 overflow-hidden border border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-secondary))] shadow-[var(--shadow-soft)] ${layout.listThumbClass}`}
        >
          <img
            src={gameThumb}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            draggable={false}
            loading="lazy"
            onError={(event) => {
              const img = event.currentTarget;
              if (!coverFallback || img.dataset.fallback === 'cover') return;
              img.dataset.fallback = 'cover';
              img.src = coverFallback;
            }}
          />
          <span
            className="pointer-events-none absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[hsl(var(--surface-elevated)/0.35)]"
            aria-hidden
          />
        </div>
      ) : null}

      {inGame ? (
        <button
          type="button"
          tabIndex={interactionsLocked ? -1 : 0}
          title={`Open ${friend.personaName}'s Steam profile`}
          aria-label={`Open ${friend.personaName}'s Steam profile`}
          disabled={interactionsLocked}
          className="ml-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-secondary)/0.9)] text-[hsl(var(--text-secondary))] opacity-80 transition-[opacity,background-color,border-color,box-shadow] hover:border-[hsl(var(--primary)/0.55)] hover:bg-[hsl(var(--surface-elevated))] hover:text-[hsl(var(--primary))] hover:opacity-100 hover:shadow-[var(--shadow-hover-glow)] disabled:pointer-events-none"
          onClick={(event) => {
            event.stopPropagation();
            if (interactionsLocked) return;
            onOpenProfile?.(friend);
          }}
        >
          <ExternalLink size={12} strokeWidth={2.5} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

FriendListRow.propTypes = {
  friend: PropTypes.shape({
    steamId: PropTypes.string,
    personaName: PropTypes.string,
    avatarUrl: PropTypes.string,
    gameId: PropTypes.string,
    gameName: PropTypes.string,
    personaState: PropTypes.number,
    online: PropTypes.bool,
    inGame: PropTypes.bool,
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
  const rowSpan = slot?.rowSpan ?? 2;

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
    layout.cells <= 2 ? 6 : layout.density === 'roomy' ? 24 : 12
  );
  const interactionsLocked = arrangeMode || punchMode;
  const surface = normalizeHomeWidgetSurface(slot?.surface);
  const isPrivateFriends =
    friendsPlayingStatusCode === 'private-friends' ||
    /private/i.test(String(friendsPlayingError || ''));

  const { inGameFriends, onlineFriends, offlineFriends, visibleCount, onlineCount, inGameCount } =
    useMemo(() => {
      // Sort before capacity so in-game friends never get truncated by offline rows.
      const sorted = [...friendsList].sort((a, b) => {
        const rank = friendPresenceRank(b) - friendPresenceRank(a);
        if (rank !== 0) return rank;
        return String(a?.personaName || '').localeCompare(String(b?.personaName || ''), undefined, {
          sensitivity: 'base',
        });
      });
      const capped = sorted.slice(0, capacity);
      const inGame = [];
      const online = [];
      const offline = [];
      for (const friend of capped) {
        if (isFriendInGame(friend)) inGame.push(friend);
        else if (isFriendOnline(friend)) online.push(friend);
        else offline.push(friend);
      }
      return {
        inGameFriends: inGame,
        onlineFriends: online,
        offlineFriends: offline,
        visibleCount: capped.length,
        onlineCount: friendsList.filter(isFriendOnline).length,
        inGameCount: friendsList.filter(isFriendInGame).length,
      };
    }, [friendsList, capacity]);

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
      if (isPrivateFriends) {
        openSteamPrivacySettings();
        return;
      }
      if (visibleCount === 0) openSteamApiSettings();
    },
    [
      arrangeMode,
      punchMode,
      interactionsLocked,
      isPrivateFriends,
      visibleCount,
      openSteamPrivacySettings,
      openSteamApiSettings,
      onArrangeSelect,
      channelId,
    ]
  );

  const emptyHint = !steamId
    ? 'Set Steam ID in Now Playing, Steam & Widgets'
    : !apiEnabled
      ? 'Enable Steam Web API in Now Playing, Steam & Widgets'
      : !apiKeyConfigured && !friendsPlayingFetchedAt
        ? 'Add Steam API key in Now Playing, Steam & Widgets'
        : isPrivateFriends
          ? PRIVATE_FRIENDS_HINT
          : friendsPlayingError
            ? friendsPlayingError
            : loading
              ? 'Loading friends…'
              : 'No Steam friends found';

  const renderFriendRows = (list) =>
    list.map((friend) => (
      <FriendListRow
        key={friend.steamId}
        friend={friend}
        interactionsLocked={interactionsLocked}
        onLaunchGame={handleLaunchGame}
        onOpenProfile={handleOpenProfile}
        layout={layout}
      />
    ));

  return (
    <HomeWidgetShell
      surface={surface}
      brandTone="steam"
      textColor={slot?.textColor}
      selected={selected}
      className={layout.shellPadClass}
      onClick={handleActivate}
      aria-label="Steam Friends"
    >
      {visibleCount === 0 ? (
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
          <span className="max-w-[16rem] text-[10px] font-black uppercase tracking-[0.12em] text-[var(--hw-text-secondary)]">
            {emptyHint}
          </span>
          {isPrivateFriends ? (
            <span className="max-w-[16rem] text-[9px] font-bold text-[var(--hw-text-tertiary)]">
              Tap to open Steam privacy settings
            </span>
          ) : null}
        </button>
      ) : (
        <div className={`flex min-h-0 flex-1 flex-col ${layout.gapClass}`}>
          <SteamWidgetHeading title="Friends" icon={Users} compact={rowSpan <= 1} />
          {layout.density !== 'compact' ? (
            <p className="-mt-0.5 mb-0 px-0.5 text-[9px] font-bold text-[var(--hw-text-tertiary)]">
              {inGameCount > 0 ? `${inGameCount} in game · ` : ''}
              {onlineCount} online
              {friendsList.length > onlineCount
                ? ` · ${friendsList.length - onlineCount} offline`
                : ''}
            </p>
          ) : null}
          <WeeFadeScroll axis="y" fadePx={28} hideScrollbar className="min-h-0 flex-1">
            <div
              className={`pb-2 ${layout.gapClass} ${
                layout.listColumns > 1 ? 'grid grid-cols-2' : 'flex flex-col'
              }`}
            >
              {inGameFriends.length > 0 ? (
                <>
                  <FriendSectionLabel spanGrid={layout.listColumns > 1}>
                    In game · {inGameFriends.length}
                  </FriendSectionLabel>
                  {renderFriendRows(inGameFriends)}
                </>
              ) : null}
              {onlineFriends.length > 0 ? (
                <>
                  <FriendSectionLabel spanGrid={layout.listColumns > 1}>
                    Online · {onlineFriends.length}
                  </FriendSectionLabel>
                  {renderFriendRows(onlineFriends)}
                </>
              ) : null}
              {offlineFriends.length > 0 ? (
                <>
                  <FriendSectionLabel spanGrid={layout.listColumns > 1}>
                    Offline · {offlineFriends.length}
                  </FriendSectionLabel>
                  {renderFriendRows(offlineFriends)}
                </>
              ) : null}
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
