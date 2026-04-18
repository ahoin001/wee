import React, { forwardRef } from 'react';

/**
 * Poster-first tile: art only (keeps fly / ghost-handoff aligned); launch on click.
 * Forwards ref for Radix `ContextMenu.Trigger asChild`.
 */
const AuraGameCard = forwardRef(function AuraGameCard(
  {
    game,
    onHover,
    onHeroPreview,
    onLaunch,
    className = '',
    /** Use `eager` for collection fly handoff so img decode matches CSS background flyers */
    imageLoading = 'lazy',
  },
  ref
) {
  const label = game.name || 'Game';

  return (
    <article
      ref={ref}
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
        onContextMenu={(e) => {
          // Let Radix on the outer trigger handle opening; block Electron/Chromium default image/menu UI.
          e.preventDefault();
        }}
        title={label}
        aria-label={label ? `Open ${label}` : 'Open game'}
      >
        {game.imageUrl ? (
          <img
            src={game.imageUrl}
            alt=""
            loading={imageLoading}
            draggable={false}
            onContextMenu={(e) => {
              e.preventDefault();
            }}
          />
        ) : (
          <div className="aura-game-card__fallback">No art</div>
        )}
      </button>
    </article>
  );
});

export default AuraGameCard;
