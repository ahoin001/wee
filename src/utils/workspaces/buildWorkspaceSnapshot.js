import { buildPresetDataFromStore } from '../presets/buildPresetSnapshot';
import useConsolidatedAppStore from '../useConsolidatedAppStore';

export function createWorkspaceId() {
  return `workspace-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildWorkspaceDataFromStore() {
  const base = buildPresetDataFromStore({
    includeSounds: true,
  });
  const { channels } = useConsolidatedAppStore.getState();
  return {
    ...base,
    channels,
  };
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
