import React from 'react';

/**
 * Poster-first tile: art only (keeps fly / ghost-handoff aligned); launch on click.
 */
export default function AuraGameCard({
  game,
  onHover,
  onHeroPreview,
  onLaunch,
  className = '',
  /** Use `eager` for collection fly handoff so img decode matches CSS background flyers */
  imageLoading = 'lazy',
}) {
  const label = game.name || 'Game';

  return (
    <article
      className={`aura-game-card${className ? ` ${className}` : ''}`}
      onMouseEnter={() => {
        onHover?.(game);
        onHeroPreview?.(game);
      }}
      onMouseLeave={() => onHeroPreview?.(null)}
    >
      <button
        type="button"
        className="aura-game-card__launch"
        onFocus={() => onHover?.(game)}
        onClick={() => onLaunch?.(game)}
        title={label}
        aria-label={label ? `Open ${label}` : 'Open game'}
      >
        {game.imageUrl ? <img src={game.imageUrl} alt="" loading={imageLoading} /> : <div className="aura-game-card__fallback">No art</div>}
      </button>
    </article>
  );
}
