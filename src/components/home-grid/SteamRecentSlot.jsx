/**
 * Home-grid Steam Recently Played tile.
 */
import React from 'react';
import SteamGamesGlanceSlot from './SteamGamesGlanceSlot';

function SteamRecentSlot(props) {
  return <SteamGamesGlanceSlot variant="recent" {...props} />;
}

export default React.memo(SteamRecentSlot);
