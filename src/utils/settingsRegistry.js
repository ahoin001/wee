/**
 * Settings metadata registry — single source of truth for settings destinations.
 *
 * Pure data (no component imports) so it can power the Settings rail, search,
 * deep links, and the command palette without pulling tab components into
 * consumer bundles. `SettingsModal` maps `id → component` locally.
 *
 * Tab ids are a stable public contract (deep links via `settingsNavigation.js`,
 * persisted `ui.settingsActiveTab`); never rename ids, only labels/categories.
 */

/** Grouped destinations shown in the Settings rail, in display order. */
export const SETTINGS_CATEGORIES = Object.freeze([
  Object.freeze({ id: 'home', label: 'Home & Channels' }),
  Object.freeze({ id: 'appearance', label: 'Appearance' }),
  Object.freeze({ id: 'dock-nav', label: 'Dock & Navigation' }),
  Object.freeze({ id: 'motion', label: 'Motion & Atmosphere' }),
  Object.freeze({ id: 'integrations', label: 'Integrations & Widgets' }),
  Object.freeze({ id: 'system', label: 'General & System' }),
]);

/**
 * @typedef {Object} SettingsTabMeta
 * @property {string} id — stable route id (never rename)
 * @property {string} label
 * @property {string} icon — emoji glyph for the rail
 * @property {string} color — CSS color string (design-system token)
 * @property {string} description
 * @property {string} categoryId — one of SETTINGS_CATEGORIES ids
 * @property {string[]} keywords — extra search terms (settings inside the tab)
 * @property {boolean} [beta]
 */

/** @type {ReadonlyArray<SettingsTabMeta>} */
export const SETTINGS_TAB_META = Object.freeze([
  // —— Home & Channels ——
  {
    id: 'channels',
    label: 'Channels & layout',
    icon: '📺',
    color: 'hsl(var(--settings-tab-channels))',
    description: 'Home board, widgets, and tile look',
    categoryId: 'home',
    keywords: [
      'edit home', 'arrange', 'board', 'grid', 'widgets', 'quick access',
      'ken burns', 'idle', 'auto fade', 'focus recede', 'hover', 'tiles', 'layout',
    ],
  },
  {
    id: 'workspaces',
    label: 'Home Profiles',
    icon: '🧩',
    color: 'hsl(var(--settings-tab-workspaces))',
    description: 'Create and switch Home mode setups',
    categoryId: 'home',
    keywords: ['profiles', 'workspaces', 'switch', 'scenes', 'setups'],
  },
  {
    id: 'gamehub',
    label: 'Game Hub',
    icon: '🎮',
    color: 'hsl(var(--settings-tab-layout))',
    description: 'Hub visuals, onboarding & library experience',
    categoryId: 'home',
    keywords: ['epic', 'games', 'library', 'collections', 'aura', 'hub', 'backdrop'],
  },

  // —— Appearance ——
  {
    id: 'wallpaper',
    label: 'Wallpaper',
    icon: '🖼️',
    color: 'hsl(var(--settings-tab-wallpaper))',
    description: 'Background & cycling',
    categoryId: 'appearance',
    keywords: ['background', 'cycling', 'blur', 'overlay', 'particles', 'image', 'video'],
  },
  {
    id: 'colors',
    label: 'Colors',
    icon: '🌈',
    color: 'hsl(var(--settings-tab-colors))',
    description: 'Discover and route color controls',
    categoryId: 'appearance',
    keywords: ['accent', 'theme', 'dark mode', 'ambient', 'match', 'palette'],
  },
  {
    id: 'themes',
    label: 'Presets',
    icon: '🎨',
    color: 'hsl(var(--settings-tab-themes))',
    description: 'Save, share & apply looks',
    categoryId: 'appearance',
    keywords: ['presets', 'themes', 'community', 'share', 'import', 'export', 'looks'],
  },
  {
    id: 'time',
    label: 'Time',
    icon: '🕐',
    color: 'hsl(var(--settings-tab-time))',
    description: 'Clock & pill display',
    categoryId: 'appearance',
    keywords: ['clock', 'pill', 'date', 'format', '24 hour'],
  },

  // —— Dock & Navigation ——
  {
    id: 'dock',
    label: 'Dock',
    icon: '⚓',
    color: 'hsl(var(--settings-tab-dock))',
    description: 'Classic & Ribbon dock settings',
    categoryId: 'dock-nav',
    keywords: [
      'ribbon', 'classic', 'glass', 'glow', 'ribbon dock effects', 'chrome effects', 'particles',
      'buttons', 'animations', 'surface',
    ],
  },
  {
    id: 'navigation-pill',
    label: 'Navigation Pill',
    icon: '📍',
    color: 'hsl(var(--settings-tab-navigation))',
    description: 'Space rail visibility & pinning',
    categoryId: 'dock-nav',
    keywords: ['space rail', 'pin', 'spaces', 'pill'],
  },
  {
    id: 'navigation',
    label: 'Navigation',
    icon: '🧭',
    color: 'hsl(var(--settings-tab-navigation))',
    description: 'Side navigation buttons',
    categoryId: 'dock-nav',
    keywords: ['side nav', 'arrows', 'page', 'peek'],
    beta: true,
  },

  // —— Motion & Atmosphere ——
  {
    id: 'motion',
    label: 'Motion',
    icon: '✨',
    color: 'hsl(var(--settings-tab-motion))',
    description: 'Press, drag & reorder feedback',
    categoryId: 'motion',
    keywords: [
      'springs', 'gooey', 'physics', 'reduced motion', 'feedback', 'launch',
      'cinematic', 'idle experience', 'attract', 'delight', 'auto fade',
    ],
  },
  {
    id: 'sounds',
    label: 'Sounds',
    icon: '🔊',
    color: 'hsl(var(--settings-tab-sounds))',
    description: 'Audio feedback & music',
    categoryId: 'motion',
    keywords: ['audio', 'music', 'click', 'hover', 'volume', 'startup'],
  },

  // —— Integrations & Widgets ——
  {
    id: 'api-integrations',
    label: 'API & Widgets',
    icon: '🔌',
    color: 'hsl(var(--settings-tab-api))',
    description: 'Spotify, Steam, system media & widget options',
    categoryId: 'integrations',
    keywords: [
      'spotify', 'steam', 'steamid', 'enrichment', 'now playing', 'takeover', 'immersive',
      'system info', 'admin panel', 'floating widgets', 'integrations',
    ],
  },

  // —— General & System ——
  {
    id: 'general',
    label: 'General',
    icon: '⚙️',
    color: 'hsl(var(--settings-tab-general))',
    description: 'App behavior & startup',
    categoryId: 'system',
    keywords: ['startup', 'launch on boot', 'cursor', 'classic mode', 'reset', 'danger', 'cache', 'refresh', 'data'],
  },
  {
    id: 'shortcuts',
    label: 'Shortcuts',
    icon: '⌨️',
    color: 'hsl(var(--settings-tab-shortcuts))',
    description: 'Keyboard shortcuts & hotkeys',
    categoryId: 'system',
    keywords: ['keyboard', 'hotkeys', 'command palette', 'bindings'],
    beta: true,
  },
  {
    id: 'monitor',
    label: 'Monitor',
    icon: '🖥️',
    color: 'hsl(var(--settings-tab-monitor))',
    description: 'Multi-monitor settings',
    categoryId: 'system',
    keywords: ['display', 'screen', 'multi monitor'],
    beta: true,
  },
  {
    id: 'updates',
    label: 'Updates',
    icon: '🔄',
    color: 'hsl(var(--settings-tab-updates))',
    description: 'Check for updates & version info',
    categoryId: 'system',
    keywords: ['version', 'update', 'release', 'changelog'],
  },
]);

/** Legacy route aliases — kept for deep links and persisted `ui.settingsActiveTab`. */
export function normalizeSettingsTabId(tabId) {
  if (!tabId) return tabId;
  if (tabId === 'layout') return 'channels';
  if (tabId === 'presets') return 'themes';
  return tabId;
}

/**
 * @param {string} id
 * @returns {SettingsTabMeta | null}
 */
export function getSettingsTabMeta(id) {
  const normalized = normalizeSettingsTabId(id);
  return SETTINGS_TAB_META.find((tab) => tab.id === normalized) ?? null;
}

/**
 * Search destinations by label, description, id, or keyword.
 * Returns matches in registry order; keyword hits include the matched term
 * so callers can show *why* a tab matched (e.g. "Ken Burns → Channels & layout").
 *
 * @param {string} query
 * @returns {Array<{ tab: SettingsTabMeta, matchedKeyword: string | null }>}
 */
export function searchSettingsTabs(query) {
  const q = (query ?? '').trim().toLowerCase();
  if (!q) {
    return SETTINGS_TAB_META.map((tab) => ({ tab, matchedKeyword: null }));
  }
  const results = [];
  for (const tab of SETTINGS_TAB_META) {
    const direct =
      tab.label.toLowerCase().includes(q) ||
      tab.description.toLowerCase().includes(q) ||
      tab.id.toLowerCase().includes(q);
    if (direct) {
      results.push({ tab, matchedKeyword: null });
      continue;
    }
    const keyword = tab.keywords.find((k) => k.toLowerCase().includes(q));
    if (keyword) {
      results.push({ tab, matchedKeyword: keyword });
    }
  }
  return results;
}

/**
 * Group tabs (or search results) under SETTINGS_CATEGORIES for the rail.
 * @param {Array<{ tab: SettingsTabMeta, matchedKeyword: string | null }>} entries
 * @returns {Array<{ category: { id: string, label: string }, entries: typeof entries }>}
 */
export function groupSettingsEntries(entries) {
  return SETTINGS_CATEGORIES.map((category) => ({
    category,
    entries: entries.filter(({ tab }) => tab.categoryId === category.id),
  })).filter((group) => group.entries.length > 0);
}
