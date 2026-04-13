import useConsolidatedAppStore from './useConsolidatedAppStore';

/**
 * Executable / launcher string as stored on a selected-app object (path + optional args).
 */
export function buildLaunchPathFromSelectedApp(app) {
  if (!app?.path) return '';
  const args = typeof app.args === 'string' ? app.args.trim() : '';
  return args ? `${app.path} ${args}` : app.path;
}

/**
 * True when the global `selectedApp` (e.g. from Suggested Content) targets the same launch as `path` + `type`.
 */
export function selectedAppMatchesChannel(selectedApp, path, type) {
  if (!selectedApp || !path || !type) return false;
  const p = String(path).trim();

  if (type === 'steam' && selectedApp.type === 'steam') {
    const id = String(selectedApp.appId ?? '');
    if (!id) return false;
    if (p.startsWith('steam://rungameid/')) {
      return p.replace('steam://rungameid/', '') === id;
    }
    if (/^\d+$/.test(p)) return p === id;
    return false;
  }

  if (type === 'epic' && selectedApp.type === 'epic' && p.includes('com.epicgames.launcher://apps/')) {
    const fromUrl = p.match(/com\.epicgames\.launcher:\/\/apps\/([^?]+)/)?.[1];
    const appName = selectedApp.appName;
    return Boolean(fromUrl && appName && fromUrl === appName);
  }

  if (type === 'microsoftstore' && selectedApp.type === 'microsoft') {
    return selectedApp.appId === p;
  }

  if (type === 'exe' && selectedApp.type === 'exe') {
    const built = buildLaunchPathFromSelectedApp(selectedApp);
    const pathHead = p.split(/\s+/)[0];
    const builtHead = built.split(/\s+/)[0];
    return pathHead.toLowerCase() === builtHead.toLowerCase();
  }

  return false;
}

/**
 * Prefer the in-memory selected app (Suggested Content / picker) when it matches the channel path,
 * otherwise fall back to the unified app list lookup.
 */
export function resolveAppForUnifiedPath(path, type, selectedAppFromStore) {
  const fromList = findMatchingAppForPath(path, type);
  const selected =
    selectedAppFromStore ?? useConsolidatedAppStore.getState().unifiedApps?.selectedApp ?? null;
  if (selected && selectedAppMatchesChannel(selected, path, type)) {
    return selected;
  }
  return fromList;
}

/**
 * Resolve unified app entry for an existing channel path (for UnifiedAppPathCard prefill).
 */
export function findMatchingAppForPath(path, type) {
  if (!path || !type) return null;

  try {
    const unifiedAppsState = useConsolidatedAppStore.getState().unifiedApps;
    const unifiedApps = Array.isArray(unifiedAppsState?.apps) ? unifiedAppsState.apps : [];

    if (unifiedApps.length === 0) {
      return null;
    }

    if (type === 'steam') {
      if (path.startsWith('steam://rungameid/')) {
        const appId = path.replace('steam://rungameid/', '');
        return unifiedApps.find((app) => app.type === 'steam' && String(app.appId) === String(appId)) || null;
      }
      if (/^\d+$/.test(path.trim())) {
        const appId = path.trim();
        return unifiedApps.find((app) => app.type === 'steam' && String(app.appId) === String(appId)) || null;
      }
    }

    if (type === 'epic' && path.includes('com.epicgames.launcher://apps/')) {
      const appName = path.match(/com\.epicgames\.launcher:\/\/apps\/([^?]+)/)?.[1];
      if (appName) {
        return unifiedApps.find((app) => app.type === 'epic' && app.appName === appName) || null;
      }
    }

    if (type === 'microsoftstore' && path.includes('!')) {
      return unifiedApps.find((app) => app.type === 'microsoft' && app.appId === path) || null;
    }

    if (type === 'exe') {
      return unifiedApps.find((app) => app.type === 'exe' && app.path === path) || null;
    }

    return null;
  } catch (e) {
    console.error('[findMatchingAppForPath]', e);
    return null;
  }
}
