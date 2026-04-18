import React from 'react';
import AuraGameCard from './AuraGameCard';
import GameCardContextMenu from './GameCardContextMenu';

export default function AuraLibrarySection({
  games,
  librarySort = 'default',
  onLibrarySortChange,
  onSelectGame,
  onHeroPreview,
  onLaunchGame,
}) {
  return (
    <section className="aura-hub-section aura-hub-section--library" id="game-hub-library">
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
      <div
        className={`aura-hub-grid${games.length > 32 ? ' aura-hub-grid--content-visibility' : ''}`}
      >
        {games.map((game) => (
          <GameCardContextMenu key={game.id} game={game}>
            <AuraGameCard
              game={game}
              onHover={() => onSelectGame(game.id)}
              onHeroPreview={onHeroPreview}
              onLaunch={onLaunchGame}
            />
          </GameCardContextMenu>
        ))}
      </div>
    </section>
  );
}
