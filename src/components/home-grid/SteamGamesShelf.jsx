/**
 * Shared Steam cover shelf for Home widgets — denser tiles, axis-aware scroll, peek.
 */
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Clock } from 'lucide-react';
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

/**
 * Frosted title + playtime dock at the bottom of a cover tile.
 */
function SteamCoverDetailPanel({ name, playLabel, footer }) {
  if (!name && !playLabel && !footer) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0">
      <div
        className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-[hsl(var(--surface-primary)/0.94)] via-[hsl(var(--surface-primary)/0.45)] to-transparent"
        aria-hidden
      />
      <div className="relative m-1 overflow-hidden rounded-[0.65rem] border border-[hsl(var(--border-primary)/0.4)] bg-[hsl(var(--surface-elevated)/0.72)] p-1.5 shadow-[var(--shadow-sm)] backdrop-blur-md">
        {footer ? <div className="mb-1 min-w-0">{footer}</div> : null}
        {name ? (
          <div className="truncate text-[length:var(--font-size-micro)] font-extrabold leading-tight tracking-wide text-[hsl(var(--text-primary))] [text-shadow:0_1px_2px_hsl(var(--surface-primary)/0.55)]">
            {name}
          </div>
        ) : null}
        {playLabel ? (
          <div
            className={`inline-flex max-w-full items-center gap-1 rounded-full border border-[hsl(var(--border-primary)/0.35)] bg-[hsl(var(--surface-primary)/0.55)] px-1.5 py-0.5 ${
              name ? 'mt-1' : ''
            }`}
          >
            <Clock
              size={9}
              strokeWidth={2.75}
              className="shrink-0 text-[hsl(var(--primary))]"
              aria-hidden
            />
            <span className="truncate text-[9px] font-black tabular-nums tracking-wide text-[hsl(var(--text-primary))]">
              {playLabel}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

SteamCoverDetailPanel.propTypes = {
  name: PropTypes.string,
  playLabel: PropTypes.string,
  footer: PropTypes.node,
};

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
  const displayName = showName && name ? name : '';

  return (
    <button
      type="button"
      title={title || name}
      aria-label={ariaLabel || (name ? `Launch ${name}` : 'Launch game')}
      onClick={(event) => {
        event.stopPropagation();
        onActivate?.(event);
      }}
      className="home-widget-float-tile group relative aspect-[2/3] w-full min-w-0 overflow-hidden rounded-[0.85rem] border border-[hsl(var(--border-primary)/0.55)] bg-[hsl(var(--surface-elevated)/0.88)] text-left shadow-[var(--shadow-sm)] transition-transform hover:scale-[1.03] active:scale-95"
    >
      {primarySrc ? (
        <img
          src={primarySrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
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

      <SteamCoverDetailPanel name={displayName} playLabel={playLabel} footer={footer} />
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
        if (Math.abs(event.deltaX) < Math.abs(event.deltaY) && event.deltaY) {
          event.currentTarget.scrollLeft += event.deltaY;
          event.preventDefault();
        }
      }}
    >
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
