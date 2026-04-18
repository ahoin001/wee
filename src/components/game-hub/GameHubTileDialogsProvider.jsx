import React, { useCallback, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { GameHubTileDialogsContext } from './gameHubTileDialogsContext.js';
import GameHubGameMediaDialog from './GameHubGameMediaDialog';
import GameHubNewCollectionDialog from './GameHubNewCollectionDialog';

/**
 * Single shared media + new-collection dialogs for all Game Hub tiles (avoids N× dialog subtrees per card).
 */
export default function GameHubTileDialogsProvider({ children }) {
  const [mediaGame, setMediaGame] = useState(null);
  const [newCollectionGame, setNewCollectionGame] = useState(null);

  const { setGameHubCustomArt, createWeeCollectionWithGame } = useConsolidatedAppStore(
    useShallow((state) => ({
      setGameHubCustomArt: state.actions.setGameHubCustomArt,
      createWeeCollectionWithGame: state.actions.createWeeCollectionWithGame,
    }))
  );

  const openMediaDialog = useCallback((game) => {
    if (game?.id) setMediaGame(game);
  }, []);

  const openNewCollectionDialog = useCallback((game) => {
    if (game?.id) setNewCollectionGame(game);
  }, []);

  const handleMediaOpenChange = useCallback((open) => {
    if (!open) setMediaGame(null);
  }, []);

  const handleNewCollectionOpenChange = useCallback((open) => {
    if (!open) setNewCollectionGame(null);
  }, []);

  const handleApplyArt = useCallback(
    (gameId, entry) => {
      setGameHubCustomArt(gameId, entry);
    },
    [setGameHubCustomArt]
  );

  const handleCreateCollection = useCallback(
    (name) => {
      if (!newCollectionGame?.id) return;
      createWeeCollectionWithGame(name, newCollectionGame.id);
    },
    [createWeeCollectionWithGame, newCollectionGame]
  );

  const value = useMemo(
    () => ({ openMediaDialog, openNewCollectionDialog }),
    [openMediaDialog, openNewCollectionDialog]
  );

  return (
    <GameHubTileDialogsContext.Provider value={value}>
      {children}
      <GameHubGameMediaDialog
        open={Boolean(mediaGame)}
        onOpenChange={handleMediaOpenChange}
        game={mediaGame}
        onApplyArt={handleApplyArt}
      />
      <GameHubNewCollectionDialog
        open={Boolean(newCollectionGame)}
        onOpenChange={handleNewCollectionOpenChange}
        onCreate={handleCreateCollection}
      />
    </GameHubTileDialogsContext.Provider>
  );
}
