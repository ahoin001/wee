import React, { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Card from '../../ui/Card';
import WButton from '../../ui/WButton';
import WInput from '../../ui/WInput';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { MAX_SAVED_WORKSPACES } from '../../utils/workspaces/workspaceConstants';

/**
 * Manage swappable channel grids for the **second** shell space (rail id `workspaces`).
 * Home always uses `dataBySpace.home`; Game Hub is separate.
 */
const SecondaryChannelProfilesCard = React.memo(() => {
  const {
    secondaryChannelProfiles,
    activeSecondaryChannelProfileId,
    setActiveSecondaryChannelProfileId,
    createSecondaryChannelProfile,
    renameSecondaryChannelProfile,
    deleteSecondaryChannelProfile,
  } = useConsolidatedAppStore(
    useShallow((state) => ({
      secondaryChannelProfiles: state.channels.secondaryChannelProfiles,
      activeSecondaryChannelProfileId: state.channels.activeSecondaryChannelProfileId,
      setActiveSecondaryChannelProfileId: state.actions.setActiveSecondaryChannelProfileId,
      createSecondaryChannelProfile: state.actions.createSecondaryChannelProfile,
      renameSecondaryChannelProfile: state.actions.renameSecondaryChannelProfile,
      deleteSecondaryChannelProfile: state.actions.deleteSecondaryChannelProfile,
    }))
  );

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [status, setStatus] = useState('');

  const profilesList = useMemo(() => {
    const map = secondaryChannelProfiles || {};
    return Object.values(map).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [secondaryChannelProfiles]);

  const handleCreate = () => {
    if (profilesList.length >= MAX_SAVED_WORKSPACES) {
      setStatus(`You can save up to ${MAX_SAVED_WORKSPACES} channel layouts for the second space.`);
      return;
    }
    createSecondaryChannelProfile(newName);
    setNewName('');
    setStatus('Created a new channel layout.');
  };

  const handleActivate = (id) => {
    setActiveSecondaryChannelProfileId(id);
    setStatus('Switched active layout for the second space.');
  };

  const saveRename = () => {
    if (!editingId) return;
    const t = editingName.trim();
    if (!t) return;
    renameSecondaryChannelProfile(editingId, t);
    setEditingId(null);
    setEditingName('');
    setStatus('Renamed layout.');
  };

  return (
    <Card
      title="Second space channel layouts"
      desc="The left rail slot (before Home) shows one of these grids at a time — like a second phone. Home stays in the middle; Game Hub is unchanged."
    >
      <div className="surface-controls mb-4">
        <div className="surface-row flex-wrap gap-2">
          <WInput
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name (e.g. Work, Personal)"
            className="min-w-[12rem] flex-1"
          />
          <WButton
            variant="primary"
            onClick={handleCreate}
            disabled={profilesList.length >= MAX_SAVED_WORKSPACES}
          >
            New layout
          </WButton>
        </div>
        <p className="surface-help mt-2">
          Up to {MAX_SAVED_WORKSPACES} layouts. The active one is what you edit when you open the second space.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {profilesList.map((p) => {
          const active = p.id === activeSecondaryChannelProfileId;
          return (
            <div
              key={p.id}
              className={`rounded-lg border p-4 transition-all ${
                active
                  ? 'border-[hsl(var(--wii-blue))] bg-[hsl(var(--wii-blue)/0.09)] shadow-[0_0_22px_hsl(var(--wii-blue)/0.26)]'
                  : 'border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))]'
              }`}
            >
              <div className="surface-row-between mb-3">
                {editingId === p.id ? (
                  <WInput
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                ) : (
                  <h4 className="m-0 text-[hsl(var(--text-primary))]">
                    {p.name} {active ? '• Active' : ''}
                  </h4>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {!active && (
                  <WButton size="sm" variant="primary" onClick={() => handleActivate(p.id)}>
                    Use layout
                  </WButton>
                )}
                {editingId === p.id ? (
                  <WButton size="sm" variant="secondary" onClick={saveRename}>
                    Save name
                  </WButton>
                ) : (
                  <WButton size="sm" variant="tertiary" onClick={() => {
                    setEditingId(p.id);
                    setEditingName(p.name || '');
                  }}
                  >
                    Rename
                  </WButton>
                )}
                <WButton
                  size="sm"
                  variant="danger-secondary"
                  disabled={profilesList.length <= 1}
                  onClick={() => {
                    deleteSecondaryChannelProfile(p.id);
                    setStatus('Layout removed.');
                  }}
                >
                  Delete
                </WButton>
              </div>
            </div>
          );
        })}
      </div>
      {status ? (
        <p className="mt-3 text-sm text-[hsl(var(--text-secondary))]" role="status">
          {status}
        </p>
      ) : null}
    </Card>
  );
});

SecondaryChannelProfilesCard.displayName = 'SecondaryChannelProfilesCard';

export default SecondaryChannelProfilesCard;
