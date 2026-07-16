/**
 * Shell settings tab — archived with Media Hub (`MEDIA_HUB_ARCHIVED`).
 * Kept as a no-op module so old imports do not break; the Settings rail no longer
 * lists this destination (`normalizeSettingsTabId('workspaces')` → channels).
 */
import React from 'react';

const WorkspacesSettingsTab = React.memo(() => null);

WorkspacesSettingsTab.displayName = 'WorkspacesSettingsTab';

export default WorkspacesSettingsTab;
