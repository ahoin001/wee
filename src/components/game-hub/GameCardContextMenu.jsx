import React, { useCallback } from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';

/**
 * Radix context menu for hub tiles: favorites + Wee collections (portal content matches hub chrome).
 * @param {object} props
 * @param {React.ReactNode} props.children — single element (e.g. AuraGameCard root)
 * @param {object} props.game — normalized hub game
 * @param {string} [props.contextCollectionId] — when non-null and `wee-`, show "Remove from this collection"
 */
export default function GameCardContextMenu({ children, game, contextCollectionId = null }) {
  const {
    favoriteGameIds,
    weeCollections,
    toggleGameHubFavorite,
    addGameToWeeCollection,
    removeGameFromWeeCollection,
    createWeeCollection,
  } = useConsolidatedAppStore(
    useShallow((state) => ({
      favoriteGameIds: state.gameHub?.ui?.favoriteGameIds || [],
      weeCollections: state.gameHub?.library?.weeCollections || [],
      toggleGameHubFavorite: state.actions.toggleGameHubFavorite,
      addGameToWeeCollection: state.actions.addGameToWeeCollection,
      removeGameFromWeeCollection: state.actions.removeGameFromWeeCollection,
      createWeeCollection: state.actions.createWeeCollection,
    }))
  );

  const isFavorite = favoriteGameIds.includes(game?.id);
  const showRemoveFromShelf =
    contextCollectionId && String(contextCollectionId).startsWith('wee-');

  const handleCreateCollection = useCallback(() => {
    const name = window.prompt('Name for the new collection');
    if (name == null) return;
    const trimmed = String(name).trim();
    if (!trimmed) return;
    createWeeCollection(trimmed);
  }, [createWeeCollection]);

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
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
                  onSelect={handleCreateCollection}
                >
                  New collection…
                </ContextMenu.Item>
              </ContextMenu.SubContent>
            </ContextMenu.Portal>
          </ContextMenu.Sub>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
