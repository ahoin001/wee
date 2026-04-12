import useConsolidatedAppStore from './useConsolidatedAppStore';

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
