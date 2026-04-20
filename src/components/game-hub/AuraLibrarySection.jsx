import React, { useLayoutEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import AuraGameCard from './AuraGameCard';
import GameCardContextMenu from './GameCardContextMenu';

/** Align with `.aura-hub-grid` min track (~210px) + gap. */
const VIRTUAL_THRESHOLD = 48;
const MIN_TRACK_PX = 210;
const GAP_EST_PX = 20;
const ROW_HEIGHT_EST = 400;

export default function AuraLibrarySection({
  games,
  librarySort = 'default',
  onLibrarySortChange,
  onSelectGame,
  onHeroPreview,
  onLaunchGame,
  hubScrollContainerRef,
}) {
  const gridMeasureRef = useRef(null);
  const [cols, setCols] = useState(4);

  useLayoutEffect(() => {
    const el = gridMeasureRef.current;
    if (!el) return undefined;
    const update = () => {
      const w = el.clientWidth;
      const c = Math.max(1, Math.floor((w + GAP_EST_PX) / (MIN_TRACK_PX + GAP_EST_PX)));
      setCols(c);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const virtualize = Boolean(hubScrollContainerRef) && games.length > VIRTUAL_THRESHOLD;
  const rowCount = Math.ceil(games.length / Math.max(cols, 1));

  const rowVirtualizer = useVirtualizer({
    count: virtualize ? rowCount : 0,
    getScrollElement: () => hubScrollContainerRef?.current ?? null,
    estimateSize: () => ROW_HEIGHT_EST,
    overscan: 1,
  });

  const header = (
    <div className="aura-hub-section__header aura-hub-section__header--row">
      <h3>Complete Library</h3>
      <div className="aura-hub-section__header-actions">
        <label className="aura-hub-sort">
          <span className="sr-only">Sort library</span>
          <select
            className="aura-hub-sort__select"
            value={librarySort}
            onChange={(e) => onLibrarySortChange?.(e.target.value)}
          >
            <option value="default">Sort: Default</option>
            <option value="alphabetical">Sort: A–Z</option>
          </select>
        </label>
      </div>
    </div>
  );

  const renderGame = (game) => (
    <GameCardContextMenu key={game.id} game={game}>
      <AuraGameCard
        game={game}
        onHover={() => onSelectGame(game.id)}
        onHeroPreview={onHeroPreview}
        onLaunch={onLaunchGame}
      />
    </GameCardContextMenu>
  );

  if (!virtualize) {
    return (
      <section className="aura-hub-section aura-hub-section--library" id="game-hub-library">
        {header}
        <div
          ref={gridMeasureRef}
          className={`aura-hub-grid${games.length > 32 ? ' aura-hub-grid--content-visibility' : ''}`}
        >
          {games.map((game) => renderGame(game))}
        </div>
      </section>
    );
  }

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const gap = 'var(--hub-game-grid-gap, clamp(1rem, 2.4vw, 1.45rem))';

  return (
    <section className="aura-hub-section aura-hub-section--library" id="game-hub-library">
      {header}
      <div
        ref={gridMeasureRef}
        className="aura-hub-library-virtual-root min-h-0 w-full"
        style={{ position: 'relative', height: totalSize }}
      >
        {virtualRows.map((vr) => {
          const start = vr.index * cols;
          const rowGames = games.slice(start, start + cols);
          return (
            <div
              key={vr.key}
              className="aura-hub-grid aura-hub-grid--virtual-row"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap,
                transform: `translateY(${vr.start}px)`,
              }}
            >
              {rowGames.map((game) => renderGame(game))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
