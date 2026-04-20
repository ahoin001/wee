import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useShallow } from 'zustand/react/shallow';
import { WBaseModal } from '../core';
import WButton from '../../ui/WButton';
import { applyWorkspaceSnapshot } from '../../utils/workspaces/applyWorkspace';
import { normalizeWorkspacesState } from '../../utils/workspaces/workspaceState';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';

function WorkspaceSwitcherModal({ isOpen, onClose }) {
  const { workspaces, setWorkspacesState, setUIState } = useConsolidatedAppStore(
    useShallow((state) => ({
      workspaces: state.workspaces,
      setWorkspacesState: state.actions.setWorkspacesState,
      setUIState: state.actions.setUIState,
    }))
  );
  const normalized = useMemo(() => normalizeWorkspacesState(workspaces), [workspaces]);

  const handleApplyProfile = async (profile, handleClose) => {
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
    handleClose();
  };

  const openHomeProfilesSettings = (handleClose) => {
    setUIState({
      showSettingsModal: true,
      settingsActiveTab: 'workspaces',
    });
    handleClose();
  };

  return (
    <WBaseModal title="Home Profile Switcher" isOpen={isOpen} onClose={onClose} maxWidth="860px">
      <div className="space-y-5">
        <p className="text-sm text-[hsl(var(--text-secondary))]">
          Switch Home profiles with one click — channels and visuals move together.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          {normalized.items.map((profile, index) => {
            const isActive = profile.id === normalized.activeWorkspaceId;
            return (
              <button
                type="button"
                key={profile.id}
                onClick={({ currentTarget }) => {
                  const handleClose = () => {
                    currentTarget.blur();
                    onClose();
                  };
                  handleApplyProfile(profile, handleClose);
                }}
                className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-300 ${
                  isActive
                    ? 'border-[hsl(var(--wii-blue))] bg-[hsl(var(--wii-blue)/0.12)] shadow-[0_0_26px_hsl(var(--wii-blue)/0.28)]'
                    : 'border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))] hover:border-[hsl(var(--wii-blue)/0.7)] hover:shadow-[0_0_18px_hsl(var(--wii-blue)/0.16)]'
                }`}
              >
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[hsl(var(--wii-blue)/0.75)] opacity-70"
                  style={{ transform: `scaleX(${Math.max(0.16, ((index % 4) + 1) / 4)})`, transformOrigin: 'left' }}
                />
                <div className="flex items-start justify-between gap-3">
                  <h3 className="m-0 text-base font-semibold text-[hsl(var(--text-primary))]">{profile.name}</h3>
                  {isActive && (
                    <span className="rounded-full bg-[hsl(var(--wii-blue)/0.2)] px-2 py-0.5 text-xs font-medium text-[hsl(var(--wii-blue))]">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-[hsl(var(--text-secondary))]">
                  Updated {profile.timestamp ? new Date(profile.timestamp).toLocaleString() : 'just now'}
                </p>
                <p className="mt-3 text-sm text-[hsl(var(--text-secondary))]">
                  Click to switch into this profile.
                </p>
              </button>
            );
          })}

          {normalized.items.length === 0 && (
            <div className="rounded-xl border border-dashed border-[hsl(var(--border-primary))] p-6 text-sm text-[hsl(var(--text-secondary))]">
              No profiles yet. Create one in Settings → Home Profiles.
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <WButton variant="secondary" onClick={onClose}>
          Close
        </WButton>
        <WButton
          variant="primary"
          onClick={() => {
            openHomeProfilesSettings(onClose);
          }}
        >
          Manage Home Profiles
        </WButton>
      </div>
    </WBaseModal>
  );
}

WorkspaceSwitcherModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
};

WorkspaceSwitcherModal.defaultProps = {
  isOpen: false,
};

export default React.memo(WorkspaceSwitcherModal);
