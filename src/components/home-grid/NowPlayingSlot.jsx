/**
 * Home-grid Now Playing tile — reads the shared nowPlaying projection
 * (Spotify and/or Windows system media).
 */
import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Maximize2, Music } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { WeeGlassPill } from '../../ui/wee';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { matchSizePresetBySpan } from '../../utils/homeSlotSizePresets';
import { openSettingsToTab } from '../../utils/settingsNavigation';
import {
  normalizeNowPlayingExperience,
  toggleSpotifyTakeover,
} from '../../utils/spotifyTakeover';

function NowPlayingSlot({
  slot,
  channelId,
  arrangeMode = false,
  punchMode = false,
  selected = false,
  onArrangeSelect,
}) {
  const {
    trackName,
    artistLine,
    albumArtUrl,
    isPlaying,
    source,
    appName,
    spotifyConnected,
    systemEnabled,
    systemAvailable,
    takeoverAvailable,
  } = useConsolidatedAppStore(
    useShallow((state) => {
      const np = state.nowPlaying || {};
      return {
        trackName: np.trackName || '',
        artistLine: np.artistLine || '',
        albumArtUrl: np.albumArtUrl || '',
        isPlaying: Boolean(np.isPlaying),
        source: np.source,
        appName: np.appName || '',
        spotifyConnected: Boolean(state.spotify.isConnected),
        systemEnabled: state.ui.systemMediaEnabled !== false,
        systemAvailable: Boolean(state.systemMedia?.available),
        takeoverAvailable:
          np.source === 'spotify' &&
          normalizeNowPlayingExperience(state.spotify.nowPlayingExperience) !== 'off',
      };
    })
  );

  const sizePreset = useMemo(
    () => matchSizePresetBySpan(slot?.colSpan ?? 1, slot?.rowSpan ?? 1) || matchSizePresetBySpan(1, 1),
    [slot?.colSpan, slot?.rowSpan]
  );
  const isCompact = sizePreset?.id === 'S';
  const isTall = (sizePreset?.rowSpan ?? 1) > 1;
  const interactionsLocked = arrangeMode || punchMode;
  const hasTrack = Boolean(trackName);

  const openMediaWidget = useCallback(() => {
    if (window.api?.ui?.showSpotifyWidget) {
      window.api.ui.showSpotifyWidget();
      return;
    }
    const { actions, floatingWidgets } = useConsolidatedAppStore.getState();
    actions.setFloatingWidgetsState({
      spotify: { ...floatingWidgets.spotify, visible: true },
    });
  }, []);

  const emptyLabel = useMemo(() => {
    if (hasTrack) return '';
    if (spotifyConnected || (systemEnabled && systemAvailable)) return 'Play something';
    if (systemEnabled) return 'Start a player';
    return 'Connect Spotify';
  }, [hasTrack, spotifyConnected, systemEnabled, systemAvailable]);

  const handleActivate = useCallback(
    (event) => {
      if (arrangeMode && !punchMode) {
        event?.stopPropagation?.();
        onArrangeSelect?.(channelId);
        return;
      }
      if (interactionsLocked) return;
      if (!hasTrack && !spotifyConnected && !(systemEnabled && systemAvailable)) {
        openSettingsToTab('api-integrations');
        return;
      }
      openMediaWidget();
    },
    [
      arrangeMode,
      punchMode,
      interactionsLocked,
      hasTrack,
      spotifyConnected,
      systemEnabled,
      systemAvailable,
      onArrangeSelect,
      channelId,
      openMediaWidget,
    ]
  );

  const statusLabel = isPlaying
    ? appName
      ? `${appName}`
      : 'Now Playing'
    : hasTrack
      ? 'Paused'
      : '';

  return (
    <WeeGlassPill
      as="div"
      className={`relative flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[1.35rem] ${
        selected
          ? 'ring-2 ring-[hsl(var(--primary))] ring-offset-2 ring-offset-[hsl(var(--surface-primary)/0)]'
          : ''
      }`}
      onClick={handleActivate}
      role="group"
      aria-label="Now Playing"
    >
      <button
        type="button"
        className="relative flex h-full w-full flex-col overflow-hidden rounded-[1.2rem] text-left"
        onClick={handleActivate}
        disabled={interactionsLocked && !arrangeMode}
        aria-label={hasTrack ? `Now playing: ${trackName} by ${artistLine}` : 'Now Playing'}
      >
        {hasTrack && albumArtUrl ? (
          <>
            <img
              src={albumArtUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--surface-primary)/0.88)] via-[hsl(var(--surface-primary)/0.28)] to-transparent" />
          </>
        ) : null}

        <div
          className={`relative z-10 flex min-h-0 flex-1 flex-col justify-end gap-0.5 ${
            isTall ? 'p-3.5' : 'p-2.5'
          }`}
        >
          {hasTrack ? (
            <>
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[hsl(var(--text-secondary))]">
                <Music size={11} strokeWidth={2.5} className="text-[hsl(var(--primary))]" aria-hidden />
                {statusLabel}
                {source === 'system' && !isCompact ? (
                  <span className="truncate opacity-70">· System</span>
                ) : null}
              </span>
              {!isCompact ? (
                <>
                  <span
                    className={`truncate font-black text-[hsl(var(--text-primary))] ${
                      isTall ? 'text-base' : 'text-sm'
                    }`}
                  >
                    {trackName}
                  </span>
                  {artistLine ? (
                    <span
                      className={`truncate font-semibold text-[hsl(var(--text-secondary))] ${
                        isTall ? 'text-xs' : 'text-[11px]'
                      }`}
                    >
                      {artistLine}
                    </span>
                  ) : null}
                </>
              ) : null}
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-center">
              <Music
                size={isCompact ? 22 : 28}
                strokeWidth={2.25}
                className="text-[hsl(var(--primary))]"
                aria-hidden
              />
              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[hsl(var(--text-secondary))]">
                {emptyLabel}
              </span>
            </div>
          )}
        </div>
      </button>

      {hasTrack && takeoverAvailable && !isCompact && !interactionsLocked ? (
        <button
          type="button"
          className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--surface-elevated)/0.75)] text-[hsl(var(--text-secondary))] backdrop-blur-sm transition-transform hover:scale-110 hover:text-[hsl(var(--text-primary))]"
          title="Now Playing takeover"
          aria-label="Toggle Now Playing takeover"
          onClick={(event) => {
            event.stopPropagation();
            toggleSpotifyTakeover(useConsolidatedAppStore, 'manual');
          }}
        >
          <Maximize2 size={13} strokeWidth={2.5} aria-hidden />
        </button>
      ) : null}
    </WeeGlassPill>
  );
}

NowPlayingSlot.propTypes = {
  slot: PropTypes.object,
  channelId: PropTypes.string.isRequired,
  arrangeMode: PropTypes.bool,
  punchMode: PropTypes.bool,
  selected: PropTypes.bool,
  onArrangeSelect: PropTypes.func,
};

export default React.memo(NowPlayingSlot);
