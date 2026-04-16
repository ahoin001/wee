import { useEffect } from 'react';
import isEqual from 'fast-deep-equal';
import useConsolidatedAppStore from '../utils/useConsolidatedAppStore';
import { buildWorkspaceDataFromStore } from '../utils/workspaces/buildWorkspaceSnapshot';

const DEBOUNCE_MS = 500;

/**
 * When a workspace is active, keep its snapshot in sync with live app state (theme + channels + sounds)
 * without a manual Save — debounced like OS settings.
 */
export function useActiveWorkspaceAutoSync() {
  useEffect(() => {
    let debounceTimer = null;
    const unsub = useConsolidatedAppStore.subscribe(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        const state = useConsolidatedAppStore.getState();
        const id = state.workspaces?.activeWorkspaceId;
        if (!id) return;

        const active = state.workspaces.items?.find((w) => w.id === id);
        if (!active) return;

        const nextData = buildWorkspaceDataFromStore();
        if (isEqual(nextData, active.data)) return;

        const nextItems = state.workspaces.items.map((w) =>
          w.id === id
            ? { ...w, data: nextData, timestamp: new Date().toISOString() }
            : w
        );
        state.actions.setWorkspacesState({
          items: nextItems,
          activeWorkspaceId: id,
        });
      }, DEBOUNCE_MS);
    });
    return () => {
      unsub();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, []);
}

export default useActiveWorkspaceAutoSync;
