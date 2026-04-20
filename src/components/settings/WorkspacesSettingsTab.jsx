import React, { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Card from '../../ui/Card';
import WButton from '../../ui/WButton';
import WInput from '../../ui/WInput';
import { applyPresetData } from '../../utils/presets/applyPresetData';
import { normalizePresetRecord } from '../../utils/presets/presetThemeData';
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
  const activeProfile = useMemo(
    () => normalized.items.find((profile) => profile.id === normalized.activeWorkspaceId) || null,
    [normalized.activeWorkspaceId, normalized.items]
  );
  const [newProfileName, setNewProfileName] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [editingProfileId, setEditingProfileId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    if (normalized.items.length > 0 && !normalized.activeWorkspaceId) {
      setWorkspacesState({ activeWorkspaceId: normalized.items[0].id });
    }
  }, [normalized.activeWorkspaceId, normalized.items, setWorkspacesState]);

  useEffect(() => {
    if (!selectedPresetId && availablePresets.length > 0) {
      setSelectedPresetId(availablePresets[0].id);
    }
  }, [availablePresets, selectedPresetId]);

  const handleCreateProfile = () => {
    if (normalized.items.length >= MAX_SAVED_WORKSPACES) {
      setStatusText(`You can save up to ${MAX_SAVED_WORKSPACES} profiles. Delete one to add another.`);
      return;
    }
    const trimmed = newProfileName.trim();
    const nameToUse = trimmed || 'New Profile';
    if (
      normalized.items.some(
        (w) => w.name.trim().toLowerCase() === nameToUse.toLowerCase()
      )
    ) {
      setStatusText('A profile with this name already exists.');
      return;
    }
    const profile = createWorkspaceFromCurrentState(newProfileName);
    setWorkspacesState({
      items: [...normalized.items, profile],
      activeWorkspaceId: profile.id,
    });
    setNewProfileName('');
    setStatusText(`Created profile "${profile.name}".`);
  };

  const handleApplyProfile = async (profile) => {
    const resolvedData = await applyWorkspaceSnapshot(profile);
    const nextItems = normalized.items.map((item) =>
      item.id === profile.id
        ? {
            ...item,
            data: item.data || resolvedData || null,
            timestamp: new Date().toISOString(),
          }
        : item
    );
    setWorkspacesState({ items: nextItems, activeWorkspaceId: profile.id });
    setStatusText(`Switched to profile "${profile.name}".`);
  };

  const handleUpdateProfileFromCurrent = (profile) => {
    const nextItems = normalized.items.map((item) =>
      item.id === profile.id
        ? {
            ...item,
            data: buildWorkspaceDataFromStore(),
            timestamp: new Date().toISOString(),
          }
        : item
    );
    setWorkspacesState({ items: nextItems });
    setStatusText(`Updated profile "${profile.name}" from current app state.`);
  };

  const handleDeleteProfile = (profile) => {
    const nextState = removeWorkspaceById(normalized, profile.id);
    setWorkspacesState(nextState);
    setStatusText(`Deleted profile "${profile.name}".`);
  };

  const handleApplyPresetToActiveProfile = async () => {
    if (!activeProfile) return;
    const selectedPreset = availablePresets.find((preset) => preset.id === selectedPresetId);
    if (!selectedPreset) return;
    const normalizedPreset = normalizePresetRecord(selectedPreset);
    if (!normalizedPreset) return;

    await runSceneTransition(`Applying ${selectedPreset.name} to ${activeProfile.name}`, async () => {
      await applyPresetData(normalizedPreset);
    });

    const nextItems = normalized.items.map((profile) =>
      profile.id === activeProfile.id
        ? {
            ...profile,
            data: buildWorkspaceDataFromStore(),
            timestamp: new Date().toISOString(),
          }
        : profile
    );
    setWorkspacesState({
      items: nextItems,
      activeWorkspaceId: activeProfile.id,
    });
    setStatusText(`Applied preset "${selectedPreset.name}" and saved it into profile "${activeProfile.name}".`);
  };

  const startEditingName = (profile) => {
    setEditingProfileId(profile.id);
    setEditingName(profile.name);
  };

  const saveEditingName = () => {
    if (!editingProfileId) return;
    const trimmed = editingName.trim();
    if (!trimmed) return;
    if (
      normalized.items.some(
        (w) =>
          w.id !== editingProfileId &&
          w.name.trim().toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      setStatusText('That name is already in use.');
      return;
    }
    const nextItems = normalized.items.map((item) =>
      item.id === editingProfileId ? { ...item, name: trimmed } : item
    );
    setWorkspacesState({ items: nextItems });
    setEditingProfileId(null);
    setEditingName('');
    setStatusText('Profile name updated.');
  };

  return (
    <div className="surface-stack mx-auto flex max-w-4xl flex-col space-y-8 pb-12">
      <SettingsTabPageHeader
        title="Home Profiles"
        subtitle="Create and switch Home mode setups manually"
      />

      <SecondaryChannelProfilesCard />

      <SettingsWeeSection eyebrow="Create">
      <Card
        title="Profile manager"
        desc="Save complete Home setups (wallpaper, colors, and Home channels) and switch anytime."
      >
        <div className="surface-controls">
          <div className="surface-row">
            <WInput
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              placeholder="Profile name (e.g. Work, Hobby, Focus)"
            />
            <WButton
              variant="primary"
              onClick={handleCreateProfile}
              disabled={normalized.items.length >= MAX_SAVED_WORKSPACES}
            >
              Create from Current
            </WButton>
          </div>
          <p className="surface-help">
            Tip: Profiles do not auto-save. Use Update when you want to capture current changes.
          </p>
        </div>
      </Card>
      </SettingsWeeSection>

      <SettingsWeeSection eyebrow="Saved">
      <Card title="Saved profiles" desc="Apply, update, rename, and delete your Home mode profiles.">
        <div className="grid gap-3 md:grid-cols-2">
          {normalized.items.map((profile) => {
            const isActive = profile.id === normalized.activeWorkspaceId;
            return (
              <div
                key={profile.id}
                className={`rounded-lg border p-4 transition-all ${
                  isActive
                    ? 'border-[hsl(var(--wii-blue))] bg-[hsl(var(--wii-blue)/0.09)] shadow-[0_0_22px_hsl(var(--wii-blue)/0.26)]'
                    : 'border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))]'
                }`}
              >
                <div className="surface-row-between mb-3">
                  {editingProfileId === profile.id ? (
                    <WInput
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditingName();
                        if (e.key === 'Escape') setEditingProfileId(null);
                      }}
                    />
                  ) : (
                    <h4 className="m-0 text-[hsl(var(--text-primary))]">
                      {profile.name} {isActive ? '• Active' : ''}
                    </h4>
                  )}
                </div>
                <p className="surface-help mb-4">
                  Updated {profile.timestamp ? new Date(profile.timestamp).toLocaleString() : 'just now'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <WButton size="sm" variant={isActive ? 'secondary' : 'primary'} onClick={() => handleApplyProfile(profile)}>
                    Apply
                  </WButton>
                  <WButton size="sm" variant="secondary" onClick={() => handleUpdateProfileFromCurrent(profile)}>
                    Update
                  </WButton>
                  {editingProfileId === profile.id ? (
                    <WButton size="sm" variant="secondary" onClick={saveEditingName}>
                      Save Name
                    </WButton>
                  ) : (
                    <WButton size="sm" variant="tertiary" onClick={() => startEditingName(profile)}>
                      Rename
                    </WButton>
                  )}
                  <WButton size="sm" variant="danger-secondary" onClick={() => handleDeleteProfile(profile)}>
                    Delete
                  </WButton>
                </div>
              </div>
            );
          })}
          {normalized.items.length === 0 && (
            <div className="rounded-lg border border-dashed border-[hsl(var(--border-primary))] p-6 text-sm text-[hsl(var(--text-secondary))]">
              No profiles yet. Create one from your current setup to start switching modes.
            </div>
          )}
        </div>
      </Card>
      </SettingsWeeSection>

      <SettingsWeeSection eyebrow="Presets">
      <Card
        title="Preset to profile"
        desc="Apply a preset and then save that result into your active profile."
      >
        <div className="surface-controls">
          <div className="surface-row">
            <select value={selectedPresetId} onChange={(e) => setSelectedPresetId(e.target.value)} className="surface-select">
              {availablePresets.length === 0 && <option value="">No presets available</option>}
              {availablePresets.map((preset) => (
                <option key={preset.id || preset.name} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
            <WButton
              variant="primary"
              onClick={handleApplyPresetToActiveProfile}
              disabled={!activeProfile || !selectedPresetId || availablePresets.length === 0}
            >
              Apply to Active Profile
            </WButton>
          </div>
          <p className="surface-help">
            Active profile: {activeProfile ? activeProfile.name : 'None selected'}.
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
