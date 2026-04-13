import { applyPresetData } from '../presets/applyPresetData';
import { runSceneTransition } from './runSceneTransition';

export async function applyWorkspaceSnapshot(workspace) {
  if (!workspace?.data) return;
  await runSceneTransition(`Switching to ${workspace.name || 'workspace'}`, async () => {
    await applyPresetData({ data: workspace.data });
  });
}
