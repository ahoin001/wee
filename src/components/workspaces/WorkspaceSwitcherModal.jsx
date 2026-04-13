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

  const handleApplyWorkspace = async (workspace, handleClose) => {
    await applyWorkspaceSnapshot(workspace);
    setWorkspacesState({ activeWorkspaceId: workspace.id });
    handleClose();
  };

  const openWorkspaceSettings = (handleClose) => {
    setUIState({
      showSettingsModal: true,
      settingsActiveTab: 'workspaces',
    });
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <WBaseModal title="Workspace Switcher" isOpen={isOpen} onClose={onClose} maxWidth="860px">
      <div className="space-y-5">
        <p className="text-sm text-[hsl(var(--text-secondary))]">
          Switch entire setups with one click — channels, wallpaper, colors, and sound profile.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          {normalized.items.map((workspace, index) => {
            const isActive = workspace.id === normalized.activeWorkspaceId;
            return (
              <button
                type="button"
                key={workspace.id}
                onClick={({ currentTarget }) => {
                  const handleClose = () => {
                    currentTarget.blur();
                    onClose();
                  };
                  handleApplyWorkspace(workspace, handleClose);
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
                  <h3 className="m-0 text-base font-semibold text-[hsl(var(--text-primary))]">{workspace.name}</h3>
                  {isActive && (
                    <span className="rounded-full bg-[hsl(var(--wii-blue)/0.2)] px-2 py-0.5 text-xs font-medium text-[hsl(var(--wii-blue))]">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-[hsl(var(--text-secondary))]">
                  Updated {workspace.timestamp ? new Date(workspace.timestamp).toLocaleString() : 'just now'}
                </p>
                <p className="mt-3 text-sm text-[hsl(var(--text-secondary))]">
                  Click to transition into this workspace.
                </p>
              </button>
            );
          })}

          {normalized.items.length === 0 && (
            <div className="rounded-xl border border-dashed border-[hsl(var(--border-primary))] p-6 text-sm text-[hsl(var(--text-secondary))]">
              No workspaces yet. Create one in Settings → Workspaces.
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
            openWorkspaceSettings(onClose);
          }}
        >
          Manage Workspaces
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
