import { applyPresetData } from '../presets/applyPresetData';
import { PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS } from '../presets/presetScopes';
import { buildWorkspaceDataFromStore } from './buildWorkspaceSnapshot';
import { runSceneTransition } from './runSceneTransition';

export async function applyWorkspaceSnapshot(workspace) {
  if (!workspace) return null;
  const snapshotData = workspace.data || buildWorkspaceDataFromStore();
  await runSceneTransition(`Switching to ${workspace.name || 'profile'}`, async () => {
    await applyPresetData({
      data: snapshotData,
      captureScope: PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS,
    });
  });
  return snapshotData;
}
