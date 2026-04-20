import React from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, m } from 'framer-motion';

const MotionButton = m.button;

function PlaylistCard({ playlist, onPlay, reducedMotion }) {
  const tap = reducedMotion ? {} : { whileTap: { scale: 0.98 } };
  const hover = reducedMotion ? {} : { whileHover: { scale: 1.05, y: -5 } };
  return (
    <MotionButton
      type="button"
      {...hover}
      {...tap}
      onClick={() => onPlay(playlist)}
      className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border-4 p-4 text-left shadow-lg sm:rounded-[2.5rem] sm:p-6"
      style={{
        backgroundColor: 'var(--spotify-gooey-surface)',
        borderColor: 'var(--spotify-gooey-border)',
      }}
    >
      {playlist.images?.[0]?.url ? (
        <img src={playlist.images[0].url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
      ) : null}
      <div className="relative z-[1] flex h-full flex-col justify-end">
        <h4
          className="font-black italic uppercase leading-tight text-sm sm:text-lg"
          style={{ color: 'var(--spotify-gooey-text)' }}
        >
          {playlist.name}
        </h4>
        <p
          className="text-[8px] font-bold uppercase tracking-widest sm:text-[9px]"
          style={{ color: 'var(--spotify-gooey-text-secondary)' }}
        >
          {playlist.tracks?.total ?? 0} tracks
        </p>
      </div>
    </MotionButton>
  );
}

function TrackRow({ track, isCurrent, onPlay, reducedMotion }) {
  const tap = reducedMotion ? {} : { whileTap: { scale: 0.98 } };
  const hover = reducedMotion ? {} : { whileHover: { scale: 1.02, x: 8 } };
  return (
    <MotionButton
      type="button"
      {...hover}
      {...tap}
      onClick={() => onPlay(track)}
      className="flex w-full items-center gap-4 rounded-[2rem] border-4 p-4 text-left transition-colors sm:gap-4"
      style={
        isCurrent
          ? {
              backgroundColor: 'var(--spotify-gooey-primary, rgb(var(--spotify-green-rgb)))',
              borderColor: 'transparent',
              color: 'var(--spotify-gooey-contrast-on-primary, hsl(var(--color-pure-black)))',
              boxShadow: '0 15px 30px var(--spotify-gooey-glow)',
            }
          : {
              backgroundColor: 'var(--spotify-gooey-surface)',
              borderColor: 'var(--spotify-gooey-border)',
              color: 'var(--spotify-gooey-text)',
            }
      }
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border-2 border-[hsl(var(--color-pure-white)/0.1)] shadow-lg sm:h-14 sm:w-14">
        {track.album?.images?.[0]?.url ? (
          <img src={track.album.images[0].url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ backgroundColor: 'var(--spotify-gooey-surface)' }}
          >
            🎵
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="truncate text-sm font-black uppercase italic tracking-tight sm:text-base">{track.name}</div>
        <div
          className="truncate text-[10px] font-bold uppercase tracking-wider opacity-70"
          style={isCurrent ? { color: 'inherit' } : { color: 'var(--spotify-gooey-text-secondary)' }}
        >
          {track.artists?.[0]?.name || 'Artist'}
        </div>
      </div>
    </MotionButton>
  );
}

function SpotifyBrowseView({
  loading,
  isFreeTierConnected,
  searchQuery,
  activeTab,
  onTabPlaylists,
  onTabSongs,
  onTabSearch,
  playlists,
  savedTracks,
  searchResults,
  onPlayPlaylist,
  onPlayTrack,
  widgetWidth,
  reducedMotion,
  currentTrackId,
}) {
  const gridThreeCols = widgetWidth > 700;

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-10 sm:space-y-12 px-1 pb-2 pt-1 sm:px-2">
      {isFreeTierConnected ? (
        <p
          className="text-center text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: 'var(--spotify-gooey-text-secondary)' }}
        >
          Tap a row to open in Spotify. Premium unlocks playback from Wee.
        </p>
      ) : null}

      <header>
        <h3
          className="text-4xl font-black uppercase italic tracking-tighter sm:text-5xl"
          style={{ color: 'var(--spotify-gooey-text)' }}
        >
          {searchQuery.trim() ? 'Results' : 'Library'}
        </h3>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onTabPlaylists}
          className="rounded-2xl border-2 px-4 py-2 text-[11px] font-black uppercase tracking-wide transition-colors"
          style={
            activeTab === 'playlists'
              ? {
                  borderColor: 'transparent',
                  backgroundColor: 'var(--spotify-gooey-primary, rgb(var(--spotify-green-rgb)))',
                  color: 'var(--spotify-gooey-contrast-on-primary, hsl(var(--color-pure-black)))',
                }
              : {
                  borderColor: 'var(--spotify-gooey-border)',
                  backgroundColor: 'var(--spotify-gooey-surface)',
                  color: 'var(--spotify-gooey-text)',
                }
          }
        >
          Playlists
        </button>
        <button
          type="button"
          onClick={onTabSongs}
          className="rounded-2xl border-2 px-4 py-2 text-[11px] font-black uppercase tracking-wide transition-colors"
          style={
            activeTab === 'songs'
              ? {
                  borderColor: 'transparent',
                  backgroundColor: 'var(--spotify-gooey-primary, rgb(var(--spotify-green-rgb)))',
                  color: 'var(--spotify-gooey-contrast-on-primary, hsl(var(--color-pure-black)))',
                }
              : {
                  borderColor: 'var(--spotify-gooey-border)',
                  backgroundColor: 'var(--spotify-gooey-surface)',
                  color: 'var(--spotify-gooey-text)',
                }
          }
        >
          Saved
        </button>
        {searchResults.length > 0 ? (
          <button
            type="button"
            onClick={onTabSearch}
            className="rounded-2xl border-2 px-4 py-2 text-[11px] font-black uppercase tracking-wide transition-colors"
            style={
              activeTab === 'search'
                ? {
                    borderColor: 'transparent',
                    backgroundColor: 'var(--spotify-gooey-primary, rgb(var(--spotify-green-rgb)))',
                    color: 'var(--spotify-gooey-contrast-on-primary, hsl(var(--color-pure-black)))',
                  }
                : {
                    borderColor: 'var(--spotify-gooey-border)',
                    backgroundColor: 'var(--spotify-gooey-surface)',
                    color: 'var(--spotify-gooey-text)',
                  }
            }
          >
            Results ({searchResults.length})
          </button>
        ) : null}
      </div>

      <div className="custom-scrollbar gooey-floating-panel__scrollbar wee-spotify-widget__scroll min-h-0 flex-1 pr-1">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16" style={{ color: 'var(--spotify-gooey-text)' }}>
            <div
              className="h-8 w-8 animate-spin rounded-full border-2 border-[hsl(var(--color-pure-white)/0.2)]"
              style={{ borderTopColor: 'var(--spotify-gooey-primary, rgb(var(--spotify-green-rgb)))' }}
            />
            <span className="text-sm font-semibold">Loading…</span>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <m.div
              key={activeTab}
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === 'playlists' && (
                <div className={`grid gap-3 pb-4 sm:gap-4 ${gridThreeCols ? 'sm:grid-cols-3' : 'grid-cols-2'}`}>
                  {playlists.length === 0 ? (
                    <p
                      className="col-span-full py-10 text-center text-sm"
                      style={{ color: 'var(--spotify-gooey-text-secondary)' }}
                    >
                      No playlists loaded.
                    </p>
                  ) : (
                    playlists.slice(0, 12).map((pl) => (
                      <PlaylistCard key={pl.id} playlist={pl} onPlay={onPlayPlaylist} reducedMotion={reducedMotion} />
                    ))
                  )}
                </div>
              )}
              {activeTab === 'songs' && (
                <div className="flex flex-col gap-3 pb-4">
                  {savedTracks.length === 0 ? (
                    <p className="py-10 text-center text-sm" style={{ color: 'var(--spotify-gooey-text-secondary)' }}>
                      No saved tracks yet.
                    </p>
                  ) : (
                    savedTracks.slice(0, 24).map((t) => (
                      <TrackRow
                        key={t.id}
                        track={t}
                        isCurrent={currentTrackId === t.id}
                        onPlay={onPlayTrack}
                        reducedMotion={reducedMotion}
                      />
                    ))
                  )}
                </div>
              )}
              {activeTab === 'search' && (
                <div className="flex flex-col gap-3 pb-4">
                  {searchResults.length === 0 ? (
                    <p className="py-10 text-center text-sm" style={{ color: 'var(--spotify-gooey-text-secondary)' }}>
                      {searchQuery.trim() ? 'No results.' : 'Use the search field above and open Library to search.'}
                    </p>
                  ) : (
                    searchResults.slice(0, 24).map((t) => (
                      <TrackRow
                        key={t.id}
                        track={t}
                        isCurrent={currentTrackId === t.id}
                        onPlay={onPlayTrack}
                        reducedMotion={reducedMotion}
                      />
                    ))
                  )}
                </div>
              )}
            </m.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

PlaylistCard.propTypes = {
  playlist: PropTypes.object.isRequired,
  onPlay: PropTypes.func.isRequired,
  reducedMotion: PropTypes.bool,
};

TrackRow.propTypes = {
  track: PropTypes.object.isRequired,
  isCurrent: PropTypes.bool,
  onPlay: PropTypes.func.isRequired,
  reducedMotion: PropTypes.bool,
};

TrackRow.defaultProps = {
  isCurrent: false,
};

SpotifyBrowseView.propTypes = {
  loading: PropTypes.bool,
  isFreeTierConnected: PropTypes.bool,
  searchQuery: PropTypes.string.isRequired,
  activeTab: PropTypes.oneOf(['playlists', 'songs', 'search']).isRequired,
  onTabPlaylists: PropTypes.func.isRequired,
  onTabSongs: PropTypes.func.isRequired,
  onTabSearch: PropTypes.func.isRequired,
  playlists: PropTypes.array,
  savedTracks: PropTypes.array,
  searchResults: PropTypes.array,
  onPlayPlaylist: PropTypes.func.isRequired,
  onPlayTrack: PropTypes.func.isRequired,
  /** Playlist grid uses 3 columns when widget width exceeds 700px (hub prototype). */
  widgetWidth: PropTypes.number,
  reducedMotion: PropTypes.bool,
  currentTrackId: PropTypes.string,
};

SpotifyBrowseView.defaultProps = {
  loading: false,
  isFreeTierConnected: false,
  playlists: [],
  savedTracks: [],
  searchResults: [],
  widgetWidth: 360,
  reducedMotion: false,
  currentTrackId: null,
};

export default SpotifyBrowseView;
