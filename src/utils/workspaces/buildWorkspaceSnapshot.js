import { buildPresetDataFromStore } from '../presets/buildPresetSnapshot';
import { PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS } from '../presets/presetScopes';

export function createWorkspaceId() {
  return `workspace-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildWorkspaceDataFromStore() {
  return buildPresetDataFromStore({
    captureScope: PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS,
  });
}

export function createWorkspaceFromCurrentState(name) {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  const safeName = trimmed || 'New Workspace';
  return {
    id: createWorkspaceId(),
    name: safeName,
    data: buildWorkspaceDataFromStore(),
    timestamp: new Date().toISOString(),
  };
}
