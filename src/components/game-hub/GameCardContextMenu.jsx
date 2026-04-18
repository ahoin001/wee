import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { useGameHubTileDialogs } from './useGameHubTileDialogs';

/**
 * Radix context menu for hub tiles: favorites, art, Wee collections (portal content matches hub chrome).
 * @param {object} props
 * @param {React.ReactNode} props.children — single element (e.g. AuraGameCard root)
 * @param {object} props.game — normalized hub game
 * @param {string} [props.contextCollectionId] — when non-null and `wee-`, show "Remove from this collection"
 */
export default function GameCardContextMenu({ children, game, contextCollectionId = null }) {
  const dialogs = useGameHubTileDialogs();
  if (!dialogs) {
    throw new Error('GameCardContextMenu must be rendered inside GameHubTileDialogsProvider');
  }
  const { openMediaDialog, openNewCollectionDialog } = dialogs;

  const {
    favoriteGameIds,
    weeCollections,
    toggleGameHubFavorite,
    addGameToWeeCollection,
    removeGameFromWeeCollection,
    setGameHubCustomArt,
    customArtByGameId,
  } = useConsolidatedAppStore(
    useShallow((state) => ({
      favoriteGameIds: state.gameHub?.ui?.favoriteGameIds || [],
      weeCollections: state.gameHub?.library?.weeCollections || [],
      toggleGameHubFavorite: state.actions.toggleGameHubFavorite,
      addGameToWeeCollection: state.actions.addGameToWeeCollection,
      removeGameFromWeeCollection: state.actions.removeGameFromWeeCollection,
      setGameHubCustomArt: state.actions.setGameHubCustomArt,
      customArtByGameId: state.gameHub?.ui?.customArtByGameId || {},
    }))
  );

  const isFavorite = favoriteGameIds.includes(game?.id);
  const showRemoveFromShelf =
    contextCollectionId && String(contextCollectionId).startsWith('wee-');
  const hasCustomArt = Boolean(game?.id && customArtByGameId?.[game.id]?.url);

  const handleClearArt = useCallback(() => {
    if (!game?.id) return;
    setGameHubCustomArt(game.id, null);
  }, [game?.id, setGameHubCustomArt]);

  return (
    <>
      {/* Native wrapper: Radix Slot + ref merge is most reliable on a DOM div; stopPropagation avoids nested shelf menu roots stealing the gesture. */}
      <ContextMenu.Root modal={false}>
        <ContextMenu.Trigger asChild>
          <div
            className="aura-hub-game-card__context-anchor"
            tabIndex={-1}
            onContextMenu={(e) => {
              e.stopPropagation();
            }}
          >
            {children}
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content
            className="aura-hub-context-menu"
            collisionPadding={12}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <ContextMenu.Item
              className="aura-hub-context-menu__item"
              onSelect={() => toggleGameHubFavorite(game.id)}
            >
              {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            </ContextMenu.Item>
            <ContextMenu.Item
              className="aura-hub-context-menu__item"
              onSelect={() => openMediaDialog(game)}
            >
              Change art…
            </ContextMenu.Item>
            {hasCustomArt ? (
              <ContextMenu.Item className="aura-hub-context-menu__item" onSelect={handleClearArt}>
                Reset to default art
              </ContextMenu.Item>
            ) : null}
            {showRemoveFromShelf ? (
              <ContextMenu.Item
                className="aura-hub-context-menu__item"
                onSelect={() => removeGameFromWeeCollection(contextCollectionId, game.id)}
              >
                Remove from this collection
              </ContextMenu.Item>
            ) : null}
            <ContextMenu.Sub>
              <ContextMenu.SubTrigger className="aura-hub-context-menu__item aura-hub-context-menu__subtrigger">
                Add to collection
              </ContextMenu.SubTrigger>
              <ContextMenu.Portal>
                <ContextMenu.SubContent
                  className="aura-hub-context-menu aura-hub-context-menu--sub"
                  collisionPadding={12}
                >
                  {(weeCollections || []).map((c) => (
                    <ContextMenu.Item
                      key={c.id}
                      className="aura-hub-context-menu__item"
                      onSelect={() => addGameToWeeCollection(c.id, game.id)}
                    >
                      {c.label}
                    </ContextMenu.Item>
                  ))}
                  <ContextMenu.Item
                    className="aura-hub-context-menu__item aura-hub-context-menu__item--accent"
                    onSelect={() => openNewCollectionDialog(game)}
                  >
                    New collection…
                  </ContextMenu.Item>
                </ContextMenu.SubContent>
              </ContextMenu.Portal>
            </ContextMenu.Sub>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu.Root>
    </>
  );
}

GameCardContextMenu.propTypes = {
  children: PropTypes.node.isRequired,
  game: PropTypes.object.isRequired,
  contextCollectionId: PropTypes.string,
};
