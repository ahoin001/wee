import React, { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Card from '../../ui/Card';
import WButton from '../../ui/WButton';
import WInput from '../../ui/WInput';
import { applyPresetData } from '../../utils/presets/applyPresetData';
import { toThemeOnlyPreset } from '../../utils/presets/presetThemeData';
import {
  buildWorkspaceDataFromStore,
  createWorkspaceFromCurrentState,
} from '../../utils/workspaces/buildWorkspaceSnapshot';
import { applyWorkspaceSnapshot } from '../../utils/workspaces/applyWorkspace';
import { runSceneTransition } from '../../utils/workspaces/runSceneTransition';
import { normalizeWorkspacesState, removeWorkspaceById } from '../../utils/workspaces/workspaceState';
import { MAX_SAVED_WORKSPACES } from '../../utils/workspaces/workspaceConstants';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import SecondaryChannelProfilesCard from './SecondaryChannelProfilesCard';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import SettingsWeeSection from './SettingsWeeSection';
import './surfaceStyles.css';

const WorkspacesSettingsTab = React.memo(() => {
  const { workspaces, presets, setWorkspacesState } = useConsolidatedAppStore(
    useShallow((state) => ({
      workspaces: state.workspaces,
      presets: state.presets,
      setWorkspacesState: state.actions.setWorkspacesState,
    }))
  );

  const normalized = useMemo(() => normalizeWorkspacesState(workspaces), [workspaces]);
  const availablePresets = useMemo(
    () => (Array.isArray(presets) ? presets.filter((preset) => preset?.data) : []),
    [presets]
  );
  const activeWorkspace = useMemo(
    () => normalized.items.find((workspace) => workspace.id === normalized.activeWorkspaceId) || null,
    [normalized.activeWorkspaceId, normalized.items]
  );
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [selectedPresetName, setSelectedPresetName] = useState('');
  const [editingWorkspaceId, setEditingWorkspaceId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    if (normalized.items.length > 0 && !normalized.activeWorkspaceId) {
      setWorkspacesState({ activeWorkspaceId: normalized.items[0].id });
    }
  }, [normalized.activeWorkspaceId, normalized.items, setWorkspacesState]);

  useEffect(() => {
    if (!selectedPresetName && availablePresets.length > 0) {
      setSelectedPresetName(availablePresets[0].name);
    }
  }, [availablePresets, selectedPresetName]);

  const handleCreateWorkspace = () => {
    if (normalized.items.length >= MAX_SAVED_WORKSPACES) {
      setStatusText(`You can save up to ${MAX_SAVED_WORKSPACES} workspaces. Delete one to add another.`);
      return;
    }
    const trimmed = newWorkspaceName.trim();
    const nameToUse = trimmed || 'New Workspace';
    if (
      normalized.items.some(
        (w) => w.name.trim().toLowerCase() === nameToUse.toLowerCase()
      )
    ) {
      setStatusText('A workspace with this name already exists.');
      return;
    }
    const workspace = createWorkspaceFromCurrentState(newWorkspaceName);
    setWorkspacesState({
      items: [...normalized.items, workspace],
      activeWorkspaceId: workspace.id,
    });
    setNewWorkspaceName('');
    setStatusText(`Created "${workspace.name}".`);
  };

  const handleApplyWorkspace = async (workspace) => {
    await applyWorkspaceSnapshot(workspace);
    setWorkspacesState({ activeWorkspaceId: workspace.id });
    setStatusText(`Switched to "${workspace.name}".`);
  };

  const handleUpdateFromCurrent = (workspace) => {
    const nextItems = normalized.items.map((item) =>
      item.id === workspace.id
        ? {
            ...item,
            data: buildWorkspaceDataFromStore(),
            timestamp: new Date().toISOString(),
          }
        : item
    );
    setWorkspacesState({ items: nextItems });
    setStatusText(`Updated "${workspace.name}" from current app state.`);
  };

  const handleDeleteWorkspace = (workspace) => {
    const nextState = removeWorkspaceById(normalized, workspace.id);
    setWorkspacesState(nextState);
    setStatusText(`Deleted "${workspace.name}".`);
  };

  const handleApplyPresetToActiveWorkspace = async () => {
    if (!activeWorkspace) return;
    const selectedPreset = availablePresets.find((preset) => preset.name === selectedPresetName);
    const themeOnlyPreset = toThemeOnlyPreset(selectedPreset);
    if (!themeOnlyPreset) return;

    await runSceneTransition(`Applying ${selectedPreset.name} to ${activeWorkspace.name}`, async () => {
      await applyPresetData(themeOnlyPreset);
    });

    const nextItems = normalized.items.map((workspace) =>
      workspace.id === activeWorkspace.id
        ? {
            ...workspace,
            data: buildWorkspaceDataFromStore(),
            timestamp: new Date().toISOString(),
          }
        : workspace
    );
    setWorkspacesState({
      items: nextItems,
      activeWorkspaceId: activeWorkspace.id,
    });
    setStatusText(`Applied preset "${selectedPreset.name}" and saved it into "${activeWorkspace.name}".`);
  };

  const startEditingName = (workspace) => {
    setEditingWorkspaceId(workspace.id);
    setEditingName(workspace.name);
  };

  const saveEditingName = () => {
    if (!editingWorkspaceId) return;
    const trimmed = editingName.trim();
    if (!trimmed) return;
    if (
      normalized.items.some(
        (w) =>
          w.id !== editingWorkspaceId &&
          w.name.trim().toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      setStatusText('That name is already in use.');
      return;
    }
    const nextItems = normalized.items.map((item) =>
      item.id === editingWorkspaceId ? { ...item, name: trimmed } : item
    );
    setWorkspacesState({ items: nextItems });
    setEditingWorkspaceId(null);
    setEditingName('');
    setStatusText('Workspace name updated.');
  };

  return (
    <div className="surface-stack mx-auto flex max-w-4xl flex-col space-y-8 pb-12">
      <SettingsTabPageHeader
        title="Workspaces"
        subtitle="Create and switch full app environments"
      />

      <SecondaryChannelProfilesCard />

      <SettingsWeeSection eyebrow="Create">
      <Card
        title="Workspace manager"
        desc="Save complete environments (wallpaper, colors, channels, and sounds) and swap instantly."
      >
        <div className="surface-controls">
          <div className="surface-row">
            <WInput
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="Workspace name (e.g. Work, Gaming, Focus)"
            />
            <WButton
              variant="primary"
              onClick={handleCreateWorkspace}
              disabled={normalized.items.length >= MAX_SAVED_WORKSPACES}
            >
              Create from Current
            </WButton>
          </div>
          <p className="surface-help">
            Tip: Create one workspace per mode (up to {MAX_SAVED_WORKSPACES}). Changes sync automatically while a workspace is active.
          </p>
        </div>
      </Card>
      </SettingsWeeSection>

      <SettingsWeeSection eyebrow="Saved">
      <Card title="Saved workspaces" desc="Apply, update, rename, and delete your workspace modes.">
        <div className="grid gap-3 md:grid-cols-2">
          {normalized.items.map((workspace) => {
            const isActive = workspace.id === normalized.activeWorkspaceId;
            return (
              <div
                key={workspace.id}
                className={`rounded-lg border p-4 transition-all ${
                  isActive
                    ? 'border-[hsl(var(--wii-blue))] bg-[hsl(var(--wii-blue)/0.09)] shadow-[0_0_22px_hsl(var(--wii-blue)/0.26)]'
                    : 'border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))]'
                }`}
              >
                <div className="surface-row-between mb-3">
                  {editingWorkspaceId === workspace.id ? (
                    <WInput
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditingName();
                        if (e.key === 'Escape') setEditingWorkspaceId(null);
                      }}
                    />
                  ) : (
                    <h4 className="m-0 text-[hsl(var(--text-primary))]">
                      {workspace.name} {isActive ? '• Active' : ''}
                    </h4>
                  )}
                </div>
                <p className="surface-help mb-4">
                  Updated {workspace.timestamp ? new Date(workspace.timestamp).toLocaleString() : 'just now'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <WButton size="sm" variant={isActive ? 'secondary' : 'primary'} onClick={() => handleApplyWorkspace(workspace)}>
                    Apply
                  </WButton>
                  <WButton size="sm" variant="secondary" onClick={() => handleUpdateFromCurrent(workspace)}>
                    Update
                  </WButton>
                  {editingWorkspaceId === workspace.id ? (
                    <WButton size="sm" variant="secondary" onClick={saveEditingName}>
                      Save Name
                    </WButton>
                  ) : (
                    <WButton size="sm" variant="tertiary" onClick={() => startEditingName(workspace)}>
                      Rename
                    </WButton>
                  )}
                  <WButton size="sm" variant="danger-secondary" onClick={() => handleDeleteWorkspace(workspace)}>
                    Delete
                  </WButton>
                </div>
              </div>
            );
          })}
          {normalized.items.length === 0 && (
            <div className="rounded-lg border border-dashed border-[hsl(var(--border-primary))] p-6 text-sm text-[hsl(var(--text-secondary))]">
              No workspaces yet. Create one from your current setup to start switching modes.
            </div>
          )}
        </div>
      </Card>
      </SettingsWeeSection>

      <SettingsWeeSection eyebrow="Presets">
      <Card
        title="Preset to workspace"
        desc="Apply a preset look and immediately save that look into your active workspace."
      >
        <div className="surface-controls">
          <div className="surface-row">
            <select value={selectedPresetName} onChange={(e) => setSelectedPresetName(e.target.value)} className="surface-select">
              {availablePresets.length === 0 && <option value="">No presets available</option>}
              {availablePresets.map((preset) => (
                <option key={preset.name} value={preset.name}>
                  {preset.name}
                </option>
              ))}
            </select>
            <WButton
              variant="primary"
              onClick={handleApplyPresetToActiveWorkspace}
              disabled={!activeWorkspace || !selectedPresetName || availablePresets.length === 0}
            >
              Apply to Active Workspace
            </WButton>
          </div>
          <p className="surface-help">
            Active workspace: {activeWorkspace ? activeWorkspace.name : 'None selected'}.
          </p>
        </div>
      </Card>
      </SettingsWeeSection>

      {statusText && <p className="text-sm text-[hsl(var(--text-secondary))]">{statusText}</p>}
    </div>
  );
});

WorkspacesSettingsTab.displayName = 'WorkspacesSettingsTab';

export default WorkspacesSettingsTab;
