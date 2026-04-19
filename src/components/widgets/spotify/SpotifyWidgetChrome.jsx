import React from 'react';
import PropTypes from 'prop-types';
import { m } from 'framer-motion';
import { ChevronLeft, Library, Music, Search, Settings } from 'lucide-react';

/**
 * Top navigation: back, brand, library, expandable search, settings.
 */
function SpotifyWidgetChrome({
  currentPage,
  onNavigatePlayer,
  onNavigateBrowse,
  onNavigateSettings,
  searchQuery,
  onSearchChange,
  onSearchFocus,
  reducedMotion,
  searchExpanded,
  onSearchExpandedChange,
}) {
  const showBack = currentPage === 'browse' || currentPage === 'settings';
  const browseActive = currentPage === 'browse';

  const tapProps = reducedMotion
    ? {}
    : { whileTap: { scale: 0.94 } };

  return (
    <div className="wee-spotify-widget__chrome-row">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {showBack ? (
          <m.button
            type="button"
            {...tapProps}
            onClick={onNavigatePlayer}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 border-[hsl(var(--color-pure-white)/0.08)] bg-[hsl(var(--color-pure-white)/0.06)] text-[hsl(var(--text-on-accent))] transition-colors hover:bg-[hsl(var(--color-pure-white)/0.1)]"
            aria-label="Back to now playing"
          >
            <ChevronLeft size={20} strokeWidth={2.5} aria-hidden />
          </m.button>
        ) : null}
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--spotify-green-rgb))] text-[hsl(var(--color-pure-black))] shadow-md shadow-[rgb(var(--spotify-green-rgb)/0.25)]">
            <Music size={18} strokeWidth={3} aria-hidden />
          </div>
          <span className="hidden truncate font-black uppercase italic tracking-tighter text-[hsl(var(--text-on-accent))] sm:inline sm:max-w-[8rem] sm:text-lg">
            Spotify
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <m.button
          type="button"
          {...tapProps}
          onClick={onNavigateBrowse}
          title="Library"
          aria-label="Open library"
          aria-pressed={browseActive}
          className={`flex h-10 w-10 items-center justify-center rounded-2xl border-2 transition-colors sm:h-11 sm:w-11 ${
            browseActive
              ? 'border-[rgb(var(--spotify-green-rgb))] bg-[rgb(var(--spotify-green-rgb))] text-[hsl(var(--color-pure-black))]'
              : 'border-[hsl(var(--color-pure-white)/0.08)] bg-[hsl(var(--color-pure-white)/0.06)] text-[hsl(var(--text-on-accent))] hover:bg-[hsl(var(--color-pure-white)/0.1)]'
          }`}
        >
          <Library size={18} strokeWidth={2.5} aria-hidden />
        </m.button>

        <div
          className={`relative flex items-center ${searchExpanded || searchQuery ? 'min-w-[7rem] sm:min-w-[10rem]' : ''}`}
        >
          <Search
            className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-[hsl(var(--color-pure-white)/0.4)] sm:left-3.5"
            size={16}
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => {
              onSearchFocus?.();
              onSearchExpandedChange(true);
            }}
            onBlur={() => {
              if (!searchQuery.trim()) onSearchExpandedChange(false);
            }}
            className={`h-10 rounded-2xl border-2 border-[hsl(var(--color-pure-white)/0.08)] bg-[hsl(var(--color-pure-white)/0.06)] py-0 pl-9 pr-3 text-[10px] font-black uppercase italic text-[hsl(var(--text-on-accent))] outline-none transition-[width,min-width] placeholder:text-[hsl(var(--color-pure-white)/0.35)] focus:border-[rgb(var(--spotify-green-rgb))] sm:h-11 sm:pl-10 sm:text-[11px] ${
              searchExpanded || searchQuery ? 'w-full min-w-[7rem] sm:min-w-[10rem]' : 'w-10 min-w-[2.5rem] cursor-pointer sm:w-11'
            }`}
            aria-label="Search tracks"
          />
        </div>

        <m.button
          type="button"
          {...tapProps}
          onClick={onNavigateSettings}
          title="Widget settings"
          aria-label="Widget settings"
          aria-pressed={currentPage === 'settings'}
          className={`flex h-10 w-10 items-center justify-center rounded-2xl border-2 transition-colors sm:h-11 sm:w-11 ${
            currentPage === 'settings'
              ? 'border-[rgb(var(--spotify-green-rgb))] bg-[rgb(var(--spotify-green-rgb))] text-[hsl(var(--color-pure-black))]'
              : 'border-[hsl(var(--color-pure-white)/0.08)] bg-[hsl(var(--color-pure-white)/0.06)] text-[hsl(var(--text-on-accent))] hover:bg-[hsl(var(--color-pure-white)/0.1)]'
          }`}
        >
          <Settings size={18} strokeWidth={2.5} aria-hidden />
        </m.button>
      </div>
    </div>
  );
}

SpotifyWidgetChrome.propTypes = {
  currentPage: PropTypes.oneOf(['player', 'browse', 'settings']).isRequired,
  onNavigatePlayer: PropTypes.func.isRequired,
  onNavigateBrowse: PropTypes.func.isRequired,
  onNavigateSettings: PropTypes.func.isRequired,
  searchQuery: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onSearchFocus: PropTypes.func,
  reducedMotion: PropTypes.bool,
  searchExpanded: PropTypes.bool,
  onSearchExpandedChange: PropTypes.func,
};

SpotifyWidgetChrome.defaultProps = {
  onSearchFocus: undefined,
  reducedMotion: false,
  searchExpanded: false,
  onSearchExpandedChange: () => {},
};

export default SpotifyWidgetChrome;
