import React from 'react';
import AuraGameCard from './AuraGameCard';
import GameCardContextMenu from './GameCardContextMenu';

export default function AuraLibrarySection({
  games,
  onSelectGame,
  onHeroPreview,
  onLaunchGame,
}) {
  return (
    <section className="aura-hub-section aura-hub-section--library" id="game-hub-library">
      <div className="aura-hub-section__header">
        <h3>Complete Library</h3>
      </div>
      <div className="aura-hub-grid">
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
