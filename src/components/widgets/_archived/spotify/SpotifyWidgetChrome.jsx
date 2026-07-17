import React from 'react';
import PropTypes from 'prop-types';
import { m } from 'framer-motion';
import { ChevronLeft, Library, Music, Search, Settings } from 'lucide-react';

const stopDrag = (e) => {
  e.stopPropagation();
};

/**
 * Top navigation: back, brand, tier, library, expandable search, settings.
 * Hub-widget spacing + gooey tokens via CSS variables.
 */
function SpotifyWidgetChrome({
  currentPage,
  onNavigatePlayer,
  onNavigateBrowse,
  onNavigateSettings,
  searchQuery,
  onSearchChange,
  onSearchFocus,
  onSearchSubmit,
  reducedMotion,
  searchExpanded,
  onSearchExpandedChange,
  tierLabel,
}) {
  const showBack = currentPage === 'browse' || currentPage === 'settings';
  const browseActive = currentPage === 'browse';

  const tapProps = reducedMotion ? {} : { whileTap: { scale: 0.94 } };

  return (
    <div className="flex w-full min-w-0 items-center justify-between gap-2 sm:gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
        {showBack ? (
          <m.button
            type="button"
            {...tapProps}
            onPointerDown={stopDrag}
            onClick={onNavigatePlayer}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 sm:h-12 sm:w-12"
            style={{
              backgroundColor: 'var(--spotify-gooey-surface)',
              borderColor: 'var(--spotify-gooey-border)',
              color: 'var(--spotify-gooey-text)',
            }}
            aria-label="Back to now playing"
          >
            <ChevronLeft size={20} strokeWidth={2.5} aria-hidden />
          </m.button>
        ) : null}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-lg sm:h-10 sm:w-10"
            style={{
              backgroundColor: 'var(--spotify-gooey-primary, rgb(var(--spotify-green-rgb)))',
              color: 'var(--spotify-gooey-contrast-on-primary, hsl(var(--color-pure-black)))',
              boxShadow: '0 8px 20px var(--spotify-gooey-glow, rgb(var(--spotify-green-rgb) / 0.25))',
            }}
          >
            <Music size={18} strokeWidth={3} aria-hidden />
          </div>
          <span
            className="hidden max-w-[5.5rem] truncate font-black uppercase italic tracking-tighter text-sm sm:inline sm:max-w-[9rem] sm:text-lg"
            style={{ color: 'var(--spotify-gooey-text)' }}
          >
            Spotify
          </span>
          {tierLabel === 'premium' ? (
            <span
              className="hidden shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide sm:inline"
              style={{
                backgroundColor: 'var(--spotify-gooey-surface)',
                color: 'var(--spotify-gooey-primary, rgb(var(--spotify-green-rgb)))',
                border: '1px solid var(--spotify-gooey-border)',
              }}
            >
              Premium
            </span>
          ) : tierLabel === 'free' ? (
            <span
              className="hidden shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide sm:inline"
              style={{
                backgroundColor: 'var(--spotify-gooey-surface)',
                color: 'var(--spotify-gooey-text-secondary)',
                border: '1px solid var(--spotify-gooey-border)',
              }}
            >
              Free
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <m.button
          type="button"
          {...tapProps}
          onPointerDown={stopDrag}
          onClick={onNavigateBrowse}
          title="Library"
          aria-label="Open library"
          aria-pressed={browseActive}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 transition-colors sm:h-12 sm:w-12"
          style={
            browseActive
              ? {
                  backgroundColor: 'var(--spotify-gooey-primary, rgb(var(--spotify-green-rgb)))',
                  borderColor: 'transparent',
                  color: 'var(--spotify-gooey-contrast-on-primary, hsl(var(--color-pure-black)))',
                }
              : {
                  backgroundColor: 'var(--spotify-gooey-surface)',
                  borderColor: 'var(--spotify-gooey-border)',
                  color: 'var(--spotify-gooey-text)',
                }
          }
        >
          <Library size={18} strokeWidth={2.5} aria-hidden />
        </m.button>

        <m.button
          type="button"
          {...tapProps}
          onPointerDown={stopDrag}
          onClick={onNavigateSettings}
          title="Widget settings"
          aria-label="Widget settings"
          aria-pressed={currentPage === 'settings'}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 transition-colors sm:h-12 sm:w-12"
          style={
            currentPage === 'settings'
              ? {
                  backgroundColor: 'var(--spotify-gooey-primary, rgb(var(--spotify-green-rgb)))',
                  borderColor: 'transparent',
                  color: 'var(--spotify-gooey-contrast-on-primary, hsl(var(--color-pure-black)))',
                }
              : {
                  backgroundColor: 'var(--spotify-gooey-surface)',
                  borderColor: 'var(--spotify-gooey-border)',
                  color: 'var(--spotify-gooey-text)',
                }
          }
        >
          <Settings size={18} strokeWidth={2.5} aria-hidden />
        </m.button>

        <div
          className={`group relative flex items-center transition-all duration-500 ${
            searchExpanded || searchQuery ? 'min-w-[7rem] sm:min-w-[10rem]' : ''
          }`}
        >
          <Search
            className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 sm:left-3.5"
            size={16}
            style={{ color: 'var(--spotify-gooey-text-secondary)', opacity: 0.5 }}
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search…"
            value={searchQuery}
            onPointerDown={stopDrag}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => {
              onSearchFocus?.();
              onSearchExpandedChange(true);
            }}
            onBlur={() => {
              if (!searchQuery.trim()) onSearchExpandedChange(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearchSubmit?.();
            }}
            className={`h-10 rounded-2xl border-2 py-0 pl-9 pr-3 text-[10px] font-black uppercase italic outline-none transition-all duration-500 sm:h-12 sm:pl-10 sm:text-[11px] ${
              searchExpanded || searchQuery ? 'w-full min-w-[7rem] sm:min-w-[10rem]' : 'w-10 min-w-[2.5rem] cursor-pointer sm:w-12'
            }`}
            style={{
              backgroundColor: 'var(--spotify-gooey-surface)',
              borderColor: 'var(--spotify-gooey-border)',
              color: 'var(--spotify-gooey-primary, rgb(var(--spotify-green-rgb)))',
            }}
            aria-label="Search tracks"
          />
        </div>
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
  onSearchSubmit: PropTypes.func,
  reducedMotion: PropTypes.bool,
  searchExpanded: PropTypes.bool,
  onSearchExpandedChange: PropTypes.func,
  tierLabel: PropTypes.oneOf(['premium', 'free']),
};

SpotifyWidgetChrome.defaultProps = {
  onSearchFocus: undefined,
  onSearchSubmit: undefined,
  reducedMotion: false,
  searchExpanded: false,
  onSearchExpandedChange: () => {},
  tierLabel: undefined,
};

export default SpotifyWidgetChrome;
