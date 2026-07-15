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

/**
 * Home-grid Now Playing tile — narrow subscription to existing Spotify state
 * (no polling of its own; playback sampling stays owned by the Spotify manager).
 * Degrades to a connect prompt (not connected) or a play prompt (idle player).
 */
function NowPlayingSlot({
  slot,
  channelId,
  arrangeMode = false,
  punchMode = false,
  selected = false,
  onArrangeSelect,
}) {
  // Primitive-only selection: progress/volume updates must not re-render this tile.
  const { isConnected, isPlaying, trackName, artistLine, albumArtUrl, takeoverAvailable } =
    useConsolidatedAppStore(
      useShallow((state) => {
        const track = state.spotify.currentTrack;
        return {
          isConnected: Boolean(state.spotify.isConnected),
          isPlaying: Boolean(state.spotify.isPlaying),
          trackName: track?.name || '',
          artistLine: Array.isArray(track?.artists)
            ? track.artists.map((a) => a?.name).filter(Boolean).join(', ')
            : '',
          albumArtUrl: track?.album?.images?.[0]?.url || '',
          takeoverAvailable:
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

  const openSpotifyWidget = useCallback(() => {
    if (window.api?.ui?.showSpotifyWidget) {
      window.api.ui.showSpotifyWidget();
      return;
    }
    const { actions, floatingWidgets } = useConsolidatedAppStore.getState();
    actions.setFloatingWidgetsState({
      spotify: { ...floatingWidgets.spotify, visible: true },
    });
  }, []);

  const handleActivate = useCallback(
    (event) => {
      if (arrangeMode && !punchMode) {
        event?.stopPropagation?.();
        onArrangeSelect?.(channelId);
        return;
      }
      if (interactionsLocked) return;
      if (!isConnected) {
        openSettingsToTab('api-integrations');
        return;
      }
      openSpotifyWidget();
    },
    [arrangeMode, punchMode, interactionsLocked, isConnected, onArrangeSelect, channelId, openSpotifyWidget]
  );

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
                {isPlaying ? 'Now Playing' : 'Paused'}
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
                {isConnected ? 'Play something' : 'Connect Spotify'}
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
