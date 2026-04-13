export function normalizeWorkspacesState(workspaces) {
  const items = Array.isArray(workspaces?.items) ? workspaces.items : [];
  const activeWorkspaceId = workspaces?.activeWorkspaceId || items[0]?.id || null;
  return {
    items,
    activeWorkspaceId,
  };
}

export function removeWorkspaceById(workspaces, workspaceId) {
  const normalized = normalizeWorkspacesState(workspaces);
  const nextItems = normalized.items.filter((item) => item.id !== workspaceId);
  const nextActiveWorkspaceId =
    normalized.activeWorkspaceId === workspaceId
      ? (nextItems[0]?.id || null)
      : normalized.activeWorkspaceId;
  return {
    items: nextItems,
    activeWorkspaceId: nextActiveWorkspaceId,
  };
}
