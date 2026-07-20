/**
 * Home-grid Steam Tags — shelf filtered by a Steam client library tag.
 */
import React from 'react';
import SteamGamesGlanceSlot from './SteamGamesGlanceSlot';

function SteamTagsSlot(props) {
  return <SteamGamesGlanceSlot variant="tagged" {...props} />;
}

export default React.memo(SteamTagsSlot);
