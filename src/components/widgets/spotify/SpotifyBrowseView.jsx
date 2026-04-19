import React from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, m } from 'framer-motion';

const MotionButton = m.button;

function PlaylistCard({ playlist, onPlay, reducedMotion }) {
  const tap = reducedMotion ? {} : { whileTap: { scale: 0.98 } };
  const hover = reducedMotion ? {} : { whileHover: { scale: 1.03, y: -3 } };
  return (
    <MotionButton
      type="button"
      {...hover}
      {...tap}
      onClick={() => onPlay(playlist)}
      className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] border-4 border-[hsl(var(--color-pure-white)/0.08)] bg-[hsl(var(--color-pure-white)/0.06)] p-4 text-left shadow-lg sm:rounded-[2rem] sm:p-5"
    >
      {playlist.images?.[0]?.url ? (
        <img src={playlist.images[0].url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
      ) : null}
      <div className="relative z-[1] flex h-full flex-col justify-end">
        <h4 className="font-black uppercase italic leading-tight text-[hsl(var(--text-on-accent))] sm:text-base">
          {playlist.name}
        </h4>
        <p className="text-[8px] font-bold uppercase tracking-widest text-[hsl(var(--color-pure-white)/0.45)] sm:text-[9px]">
          {playlist.tracks?.total ?? 0} tracks
        </p>
      </div>
    </MotionButton>
  );
}

function TrackRow({ track, onPlay, reducedMotion }) {
  const tap = reducedMotion ? {} : { whileTap: { scale: 0.98 } };
  const hover = reducedMotion ? {} : { whileHover: { scale: 1.02, x: 6 } };
  return (
    <MotionButton
      type="button"
      {...hover}
      {...tap}
      onClick={() => onPlay(track)}
      className="flex w-full items-center gap-3 rounded-[1.5rem] border-4 border-[hsl(var(--color-pure-white)/0.06)] bg-[hsl(var(--color-pure-white)/0.06)] p-3 text-left transition-colors hover:border-[hsl(var(--color-pure-white)/0.12)] sm:gap-4 sm:p-4"
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border-2 border-[hsl(var(--color-pure-white)/0.1)] sm:h-14 sm:w-14">
        {track.album?.images?.[0]?.url ? (
          <img src={track.album.images[0].url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[hsl(var(--color-pure-white)/0.08)]">🎵</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-black uppercase italic tracking-tight text-sm text-[hsl(var(--text-on-accent))] sm:text-base">
          {track.name}
        </div>
        <div className="truncate text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--color-pure-white)/0.45)]">
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
  onSearchChange,
  onSearchSubmit,
  activeTab,
  onTabPlaylists,
  onTabSongs,
  onTabSearch,
  playlists,
  savedTracks,
  searchResults,
  onPlayPlaylist,
  onPlayTrack,
  gridWide,
  reducedMotion,
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-3 pt-2 sm:px-6">
      {isFreeTierConnected ? (
        <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-[hsl(var(--color-pure-white)/0.65)]">
          Tap a row to open in Spotify. Premium unlocks playback from Wee.
        </p>
      ) : null}

      <div className="flex gap-2 rounded-2xl border-2 border-[hsl(var(--color-pure-white)/0.08)] bg-[hsl(var(--color-pure-black)/0.2)] p-1 sm:gap-3">
        <input
          type="search"
          placeholder="Search songs, artists…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
          className="min-w-0 flex-1 rounded-xl border-0 bg-[hsl(var(--color-pure-white)/0.95)] px-3 py-2 text-sm text-[hsl(var(--text-primary))] outline-none ring-0 placeholder:text-[hsl(var(--text-tertiary))]"
        />
        <button
          type="button"
          onClick={onSearchSubmit}
          className="shrink-0 rounded-xl bg-[rgb(var(--spotify-green-rgb))] px-4 py-2 text-sm font-black uppercase tracking-wide text-[hsl(var(--color-pure-black))]"
        >
          Go
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onTabPlaylists}
          className={`rounded-2xl border-2 px-4 py-2 text-[11px] font-black uppercase tracking-wide ${
            activeTab === 'playlists'
              ? 'border-[rgb(var(--spotify-green-rgb))] bg-[rgb(var(--spotify-green-rgb))] text-[hsl(var(--color-pure-black))]'
              : 'border-[hsl(var(--color-pure-white)/0.12)] bg-[hsl(var(--color-pure-white)/0.06)] text-[hsl(var(--text-on-accent))]'
          }`}
        >
          Playlists
        </button>
        <button
          type="button"
          onClick={onTabSongs}
          className={`rounded-2xl border-2 px-4 py-2 text-[11px] font-black uppercase tracking-wide ${
            activeTab === 'songs'
              ? 'border-[rgb(var(--spotify-green-rgb))] bg-[rgb(var(--spotify-green-rgb))] text-[hsl(var(--color-pure-black))]'
              : 'border-[hsl(var(--color-pure-white)/0.12)] bg-[hsl(var(--color-pure-white)/0.06)] text-[hsl(var(--text-on-accent))]'
          }`}
        >
          Saved
        </button>
        {searchResults.length > 0 ? (
          <button
            type="button"
            onClick={onTabSearch}
            className={`rounded-2xl border-2 px-4 py-2 text-[11px] font-black uppercase tracking-wide ${
              activeTab === 'search'
                ? 'border-[rgb(var(--spotify-green-rgb))] bg-[rgb(var(--spotify-green-rgb))] text-[hsl(var(--color-pure-black))]'
                : 'border-[hsl(var(--color-pure-white)/0.12)] bg-[hsl(var(--color-pure-white)/0.06)] text-[hsl(var(--text-on-accent))]'
            }`}
          >
            Results ({searchResults.length})
          </button>
        ) : null}
      </div>

      <div className="wee-spotify-widget__scroll min-h-0 flex-1 pr-1">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16 text-[hsl(var(--text-on-accent))]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[hsl(var(--color-pure-white)/0.2)] border-t-[rgb(var(--spotify-green-rgb))]" />
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
                <div className={`grid gap-3 pb-4 sm:gap-4 ${gridWide ? 'sm:grid-cols-3' : 'grid-cols-2'}`}>
                  {playlists.length === 0 ? (
                    <p className="col-span-full py-10 text-center text-sm text-[hsl(var(--color-pure-white)/0.55)]">
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
                <div className="flex flex-col gap-2 pb-4">
                  {savedTracks.length === 0 ? (
                    <p className="py-10 text-center text-sm text-[hsl(var(--color-pure-white)/0.55)]">No saved tracks yet.</p>
                  ) : (
                    savedTracks.slice(0, 24).map((t) => (
                      <TrackRow key={t.id} track={t} onPlay={onPlayTrack} reducedMotion={reducedMotion} />
                    ))
                  )}
                </div>
              )}
              {activeTab === 'search' && (
                <div className="flex flex-col gap-2 pb-4">
                  {searchResults.length === 0 ? (
                    <p className="py-10 text-center text-sm text-[hsl(var(--color-pure-white)/0.55)]">
                      {searchQuery.trim() ? 'No results.' : 'Run a search.'}
                    </p>
                  ) : (
                    searchResults.slice(0, 24).map((t) => (
                      <TrackRow key={t.id} track={t} onPlay={onPlayTrack} reducedMotion={reducedMotion} />
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
  onPlay: PropTypes.func.isRequired,
  reducedMotion: PropTypes.bool,
};

SpotifyBrowseView.propTypes = {
  loading: PropTypes.bool,
  isFreeTierConnected: PropTypes.bool,
  searchQuery: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onSearchSubmit: PropTypes.func.isRequired,
  activeTab: PropTypes.oneOf(['playlists', 'songs', 'search']).isRequired,
  onTabPlaylists: PropTypes.func.isRequired,
  onTabSongs: PropTypes.func.isRequired,
  onTabSearch: PropTypes.func.isRequired,
  playlists: PropTypes.array,
  savedTracks: PropTypes.array,
  searchResults: PropTypes.array,
  onPlayPlaylist: PropTypes.func.isRequired,
  onPlayTrack: PropTypes.func.isRequired,
  gridWide: PropTypes.bool,
  reducedMotion: PropTypes.bool,
};

SpotifyBrowseView.defaultProps = {
  loading: false,
  isFreeTierConnected: false,
  playlists: [],
  savedTracks: [],
  searchResults: [],
  gridWide: false,
  reducedMotion: false,
};

export default SpotifyBrowseView;
