import { useContext } from 'react';
import { GameHubTileDialogsContext } from './gameHubTileDialogsContext.js';

export function useGameHubTileDialogs() {
  return useContext(GameHubTileDialogsContext);
}
