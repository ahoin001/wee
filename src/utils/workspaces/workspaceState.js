const DEFAULT_HOME_PROFILE_NAMES = ['Home Space', 'Game Focus', 'Media Focus'];

function createProfileId(seed, index) {
  return `profile-${seed}-${index + 1}`;
}

export function createSeededWorkspaceState() {
  const timestamp = new Date().toISOString();
  return {
    items: DEFAULT_HOME_PROFILE_NAMES.map((name, index) => ({
      id: createProfileId('default', index),
      name,
      data: null,
      timestamp,
    })),
    activeWorkspaceId: createProfileId('default', 0),
  };
}

export function normalizeWorkspacesState(workspaces) {
  const seeded = createSeededWorkspaceState();
  const items = Array.isArray(workspaces?.items) && workspaces.items.length > 0
    ? workspaces.items
    : seeded.items;
  const activeWorkspaceId = workspaces?.activeWorkspaceId || items[0]?.id || seeded.activeWorkspaceId;
  return {
    items,
    activeWorkspaceId,
  };
}

export function removeWorkspaceById(workspaces, profileId) {
  const normalized = normalizeWorkspacesState(workspaces);
  const nextItems = normalized.items.filter((item) => item.id !== profileId);
  const nextActiveWorkspaceId =
    normalized.activeWorkspaceId === profileId
      ? (nextItems[0]?.id || null)
      : normalized.activeWorkspaceId;
  return {
    items: nextItems,
    activeWorkspaceId: nextActiveWorkspaceId,
  };
}
