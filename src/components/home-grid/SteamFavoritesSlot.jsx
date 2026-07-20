/**
 * Home-grid Steam Favorites — client favorites from sharedconfig.vdf.
 */
import React from 'react';
import SteamGamesGlanceSlot from './SteamGamesGlanceSlot';

function SteamFavoritesSlot(props) {
  return <SteamGamesGlanceSlot variant="favorites" {...props} />;
}

export default React.memo(SteamFavoritesSlot);
