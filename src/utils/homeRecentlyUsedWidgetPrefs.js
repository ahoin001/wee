/**
 * Display prefs for the Home Recently Used tile.
 * Persisted on `ui.homeRecentlyUsedWidget`.
 */

export const HOME_RECENT_LAUNCH_FILTERS = Object.freeze({
  all: Object.freeze({ id: 'all', label: 'All' }),
  apps: Object.freeze({ id: 'apps', label: 'Apps' }),
  games: Object.freeze({ id: 'games', label: 'Games' }),
});

const GAME_LAUNCH_TYPES = new Set(['steam', 'epic']);

export const DEFAULT_HOME_RECENTLY_USED_WIDGET = Object.freeze({
  showLabels: true,
  filter: 'all',
});

/**
 * @param {unknown} raw
 * @returns {{ showLabels: boolean, filter: 'all' | 'apps' | 'games' }}
 */
export function normalizeHomeRecentlyUsedWidget(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const filter =
    src.filter === 'apps' || src.filter === 'games' ? src.filter : DEFAULT_HOME_RECENTLY_USED_WIDGET.filter;
  return {
    showLabels: src.showLabels !== false,
    filter,
  };
}

/**
 * @param {unknown[]} launches
 * @param {'all'|'apps'|'games'} filter
 */
export function filterRecentLaunches(launches, filter) {
  const list = Array.isArray(launches) ? launches : [];
  if (filter === 'games') {
    return list.filter((entry) => GAME_LAUNCH_TYPES.has(String(entry?.launchType || '')));
  }
  if (filter === 'apps') {
    return list.filter((entry) => !GAME_LAUNCH_TYPES.has(String(entry?.launchType || '')));
  }
  return list;
}
