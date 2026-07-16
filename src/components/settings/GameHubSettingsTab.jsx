/**
 * Game Hub settings tab — archived; hub visuals/toggles live on the in-hub
 * controls pill (`GameHubControlsPill`). Kept as a no-op module so old imports
 * do not break; the Settings rail no longer lists this destination
 * (`normalizeSettingsTabId('gamehub')` → channels).
 */
import React from 'react';

const GameHubSettingsTab = React.memo(() => null);

GameHubSettingsTab.displayName = 'GameHubSettingsTab';

export default GameHubSettingsTab;
