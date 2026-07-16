/**
 * Shared Steam cover shelf for Home widgets — denser tiles, axis-aware scroll, peek.
 */
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { WeeFadeScroll } from '../../ui/wee';
import {
  STEAM_CDN_HEADER,
  STEAM_CDN_LIBRARY_COVER,
} from '../../utils/steamGamesGlance';
import {
  formatSteamPlaytimeShort,
  getHomeSteamGutterConfig,
  getHomeSteamTileSizeConfig,
  resolveSteamShelfScrollAxis,
} from '../../utils/homeSteamWidgetPrefs';

export function SteamCoverTile({
  appId,
  name,
  imageUrl,
  playtimeMinutes,
  showPlaytime = false,
  showName = false,
  title,
  ariaLabel,
  onActivate,
  footer = null,
}) {
  const id = String(appId || '');
  const primarySrc =
    (typeof imageUrl === 'string' && imageUrl.trim()) || (id ? STEAM_CDN_LIBRARY_COVER(id) : '');
  const playLabel = showPlaytime ? formatSteamPlaytimeShort(playtimeMinutes) : '';

  return (
    <button
      type="button"
      title={title || name}
      aria-label={ariaLabel || (name ? `Launch ${name}` : 'Launch game')}
      onClick={(event) => {
        event.stopPropagation();
        onActivate?.(event);
      }}
      className="home-widget-float-tile group relative aspect-[2/3] w-full min-w-0 overflow-hidden rounded-lg border border-[hsl(var(--border-primary)/0.55)] bg-[hsl(var(--surface-elevated)/0.88)] text-left shadow-[var(--shadow-sm)] transition-transform hover:scale-[1.03] active:scale-95"
    >
      {primarySrc ? (
        <img
          src={primarySrc}
          alt=""
          className="absolute inset-0 h-full w-full object-contain"
          draggable={false}
          loading="lazy"
          onError={(event) => {
            if (!id) return;
            const img = event.currentTarget;
            const header = STEAM_CDN_HEADER(id);
            if (img.dataset.fallback === 'header' || img.src === header) return;
            img.dataset.fallback = 'header';
            img.src = header;
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[hsl(var(--surface-secondary))]" />
      )}

      {(playLabel || showName || footer) && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[hsl(var(--surface-primary)/0.92)] via-[hsl(var(--surface-primary)/0.35)] to-transparent pt-5">
          <div className="flex min-w-0 flex-col gap-0.5 p-1">
            {footer}
            {showName && name ? (
              <span className="truncate text-[8px] font-black uppercase tracking-[0.06em] text-[hsl(var(--text-primary))]">
                {name}
              </span>
            ) : null}
            {playLabel ? (
              <span className="w-fit rounded-md bg-[hsl(var(--surface-elevated)/0.85)] px-1 py-px text-[8px] font-black tabular-nums text-[hsl(var(--text-secondary))]">
                {playLabel}
              </span>
            ) : null}
          </div>
        </div>
      )}
    </button>
  );
}

SteamCoverTile.propTypes = {
  appId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  name: PropTypes.string,
  imageUrl: PropTypes.string,
  playtimeMinutes: PropTypes.number,
  showPlaytime: PropTypes.bool,
  showName: PropTypes.bool,
  title: PropTypes.string,
  ariaLabel: PropTypes.string,
  onActivate: PropTypes.func,
  footer: PropTypes.node,
};

/**
 * @param {{
 *   prefs: object,
 *   colSpan: number,
 *   rowSpan: number,
 *   children: React.ReactNode,
 * }} props
 */
export function SteamGamesShelf({ prefs, colSpan = 2, rowSpan = 2, children }) {
  const tileCfg = getHomeSteamTileSizeConfig(prefs?.tileSize);
  const gutterCfg = getHomeSteamGutterConfig(prefs?.gutter);
  const scrollAxis = resolveSteamShelfScrollAxis(prefs, { colSpan, rowSpan });
  const isHorizontal = scrollAxis === 'horizontal';

  const gridStyle = useMemo(() => {
    if (isHorizontal) {
      return {
        gridAutoFlow: 'column',
        gridTemplateRows: `repeat(${tileCfg.horizontalRows}, minmax(0, auto))`,
        gridAutoColumns: `minmax(0, ${tileCfg.tileMaxPx}px)`,
      };
    }
    return {
      gridTemplateColumns: `repeat(${tileCfg.columns}, minmax(0, 1fr))`,
    };
  }, [isHorizontal, tileCfg.columns, tileCfg.horizontalRows, tileCfg.tileMaxPx]);

  return (
    <WeeFadeScroll
      axis={isHorizontal ? 'x' : 'y'}
      fadePx={40}
      hideScrollbar
      className="min-h-0 flex-1"
      onWheel={(event) => {
        event.stopPropagation();
        if (!isHorizontal) return;
        // Prefer horizontal wheel/trackpad intent when the shelf scrolls sideways.
        if (Math.abs(event.deltaX) < Math.abs(event.deltaY) && event.deltaY) {
          event.currentTarget.scrollLeft += event.deltaY;
          event.preventDefault();
        }
      }}
    >
      {/* Slight end padding keeps a peek of the next row/column past the clip edge */}
      <div
        className={`grid content-start ${gutterCfg.gapClass} ${
          isHorizontal ? 'h-full w-max min-w-full pr-4' : 'pb-4'
        }`}
        style={gridStyle}
      >
        {children}
      </div>
    </WeeFadeScroll>
  );
}

SteamGamesShelf.propTypes = {
  prefs: PropTypes.object,
  colSpan: PropTypes.number,
  rowSpan: PropTypes.number,
  children: PropTypes.node,
};

export default SteamGamesShelf;
