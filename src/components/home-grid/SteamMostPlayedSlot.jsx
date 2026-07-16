/**
 * Home-grid Steam Most Played tile.
 */
import React from 'react';
import SteamGamesGlanceSlot from './SteamGamesGlanceSlot';

function SteamMostPlayedSlot(props) {
  return <SteamGamesGlanceSlot variant="mostPlayed" {...props} />;
}

export default React.memo(SteamMostPlayedSlot);
