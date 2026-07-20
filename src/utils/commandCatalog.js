/**
 * Command palette catalog — wraps existing action paths (keyboard shortcut actions,
 * settings registry destinations, Home channels, spaces, allowlisted admin actions).
 * No new dispatchers: everything executes through `executeShortcutAction`,
 * `openSettingsToTab`, the store, or the shared launch wrapper passed in by the palette.
 */

import { executeShortcutAction } from './keyboardShortcuts';
import { SETTINGS_TAB_META } from './settingsRegistry';
import { openSettingsToTab } from './settingsNavigation';
import {
  isDestructiveAdminAction,
  normalizeAdminPanelConfig,
} from './adminPanelCommands';
import { normalizeNowPlayingExperience, toggleSpotifyTakeover } from './spotifyTakeover';
/** Immersive Sound Mode — Listening Stage helpers. */
import { normalizeImmersiveSoundMode } from '../features/immersiveSoundMode/immersiveSoundModePrefs.js';
import { toggleImmersiveSoundMode } from '../features/immersiveSoundMode/immersiveSoundModeApi.js';
import useConsolidatedAppStore from './useConsolidatedAppStore';
import { clearAllCacheDomains, listCacheDomains, refreshCacheDomain } from './cacheRegistry';
import { CHANNEL_SPACE_LABELS, MEDIA_HUB_ARCHIVED } from './channelSpaces';
// Side effect: ensures cache domains are registered before the palette builds refresh commands.
import './cacheDomains';

export const COMMAND_GROUPS = Object.freeze([
  Object.freeze({ id: 'recent', label: 'Recent' }),
  Object.freeze({ id: 'channels', label: 'Channels & apps' }),
  Object.freeze({ id: 'spaces', label: 'Go to' }),
  Object.freeze({ id: 'actions', label: 'Actions' }),
  Object.freeze({ id: 'refresh', label: 'Refresh & caches' }),
  Object.freeze({ id: 'settings', label: 'Settings' }),
  Object.freeze({ id: 'admin', label: 'System tools' }),
]);

const SPACE_DESTINATIONS = [
  { id: 'home', label: CHANNEL_SPACE_LABELS.home, icon: '🏠', keywords: ['board', 'channels'] },
  {
    id: 'workspaces',
    label: CHANNEL_SPACE_LABELS.workspaces,
    icon: '🎯',
    keywords: ['focus', 'second board', 'second home'],
  },
  ...(MEDIA_HUB_ARCHIVED
    ? []
    : [
        {
          id: 'mediahub',
          label: CHANNEL_SPACE_LABELS.mediahub,
          icon: '🎬',
          keywords: ['movies', 'video'],
        },
      ]),
  { id: 'gamehub', label: CHANNEL_SPACE_LABELS.gamehub, icon: '🎮', keywords: ['games', 'steam'] },
];

/** Shortcut actions that make sense as palette commands (skip page nav / palette itself). */
const EXCLUDED_SHORTCUT_IDS = new Set([
  'open-command-palette',
  'next-page',
  'prev-page',
  'toggle-settings-menu',
]);

/**
 * Simple fuzzy scoring: exact substring > word prefix > in-order subsequence.
 * Returns 0 when the query does not match.
 */
export function fuzzyScore(query, text) {
  const q = (query || '').trim().toLowerCase();
  const t = (text || '').toLowerCase();
  if (!q || !t) return 0;

  const idx = t.indexOf(q);
  if (idx === 0) return 100;
  if (idx > 0) {
    return t[idx - 1] === ' ' ? 90 : 70;
  }

  // In-order subsequence (e.g. "gh" → "Game Hub")
  let ti = 0;
  let matched = 0;
  for (let qi = 0; qi < q.length; qi += 1) {
    const ch = q[qi];
    if (ch === ' ') continue;
    let found = false;
    while (ti < t.length) {
      if (t[ti] === ch) {
        matched += 1;
        ti += 1;
        found = true;
        break;
      }
      ti += 1;
    }
    if (!found) return 0;
  }
  return matched > 0 ? 40 : 0;
}

/** Best score across title + keywords. */
export function scoreCommand(query, command) {
  let best = fuzzyScore(query, command.title);
  if (command.subtitle) {
    best = Math.max(best, fuzzyScore(query, command.subtitle) - 10);
  }
  for (const keyword of command.keywords || []) {
    best = Math.max(best, fuzzyScore(query, keyword) - 5);
  }
  return best;
}

function channelTitleFromSlot(slot, index) {
  const channel = slot?.channel;
  if (channel?.title) return channel.title;
  if (channel?.path) {
    const parts = String(channel.path).split(/[\\/]/).filter(Boolean);
    const last = parts[parts.length - 1] || channel.path;
    return last.replace(/\.(exe|lnk|url|bat)$/i, '');
  }
  return `Channel ${index + 1}`;
}

/**
 * Build the full command list from current store state.
 * @param {object} state — consolidated store state
 * @param {{ launchChannel?: (payload: { path: string, type: string, asAdmin: boolean, title: string }) => void,
 *           runAdminAction?: (action: object) => void }} handlers
 */
export function buildCommandCatalog(state, handlers = {}) {
  const commands = [];

  // —— Home channels & apps ——
  const homeSlots = state?.channels?.dataBySpace?.home?.slots;
  if (Array.isArray(homeSlots) && typeof handlers.launchChannel === 'function') {
    homeSlots.forEach((slot, index) => {
      if (!slot || slot.kind !== 'channel' || slot.hidden) return;
      const channel = slot.channel;
      if (!channel?.path) return;
      const title = channelTitleFromSlot(slot, index);
      commands.push({
        id: `channel:${index}`,
        group: 'channels',
        title,
        subtitle: channel.launchType === 'url' ? 'Open link' : 'Launch app',
        icon: channel.launchType === 'url' ? '🌐' : '🚀',
        keywords: [channel.path],
        run: () =>
          handlers.launchChannel({
            path: channel.path,
            type: channel.launchType || 'exe',
            asAdmin: Boolean(channel.asAdmin),
            title,
          }),
      });
    });
  }

  // —— Spaces ——
  const activeSpaceId = state?.spaces?.activeSpaceId;
  SPACE_DESTINATIONS.forEach((space) => {
    if (space.id === activeSpaceId) return;
    commands.push({
      id: `space:${space.id}`,
      group: 'spaces',
      title: `Go to ${space.label}`,
      icon: space.icon,
      keywords: space.keywords,
      run: () => {
        const { actions } = state;
        actions?.setSpacesState?.({ activeSpaceId: space.id });
      },
    });
  });

  // —— Shortcut-backed actions (single dispatcher: executeShortcutAction) ——
  const shortcuts = Array.isArray(state?.ui?.keyboardShortcuts)
    ? state.ui.keyboardShortcuts
    : [];
  shortcuts.forEach((shortcut) => {
    if (!shortcut || EXCLUDED_SHORTCUT_IDS.has(shortcut.id)) return;
    // Settings deep links are covered by the settings registry group below.
    if (shortcut.action === 'openSettingsModal' && shortcut.actionParams?.tab) return;
    commands.push({
      id: `action:${shortcut.id}`,
      group: 'actions',
      title: shortcut.name,
      subtitle: shortcut.description,
      icon: shortcut.icon || '⚡',
      keywords: [shortcut.action],
      run: () => executeShortcutAction(shortcut.action, shortcut.actionParams),
    });
  });

  // —— Now Playing takeover (player-agnostic; Windows system media is canonical) ——
  if (
    normalizeNowPlayingExperience(state?.spotify?.nowPlayingExperience) !== 'off' &&
    Boolean(state?.nowPlaying?.trackName || state?.nowPlaying?.albumArtUrl)
  ) {
    const takeoverOn = Boolean(state?.ui?.spotifyTakeoverActive);
    commands.push({
      id: 'action:spotify-takeover',
      group: 'actions',
      title: takeoverOn ? 'Exit Now Playing takeover' : 'Enter Now Playing takeover',
      subtitle: 'Album-driven immersive overlay',
      icon: '🎵',
      keywords: ['spotify', 'immersive', 'music', 'takeover'],
      run: () => toggleSpotifyTakeover(useConsolidatedAppStore, 'manual'),
    });
  }

  // —— Immersive Sound Mode Listening Stage ——
  if (
    normalizeImmersiveSoundMode(state?.ui?.immersiveSoundMode).enabled &&
    Boolean(state?.nowPlaying?.trackName || state?.nowPlaying?.isPlaying)
  ) {
    const stageOn = Boolean(state?.ui?.immersiveSoundModeActive);
    commands.push({
      id: 'action:immersive-sound-mode',
      group: 'actions',
      title: stageOn ? 'Exit Listening Stage' : 'Enter Listening Stage',
      subtitle: 'Immersive Sound Mode',
      icon: '🎧',
      keywords: ['immersive', 'listening', 'stage', 'sound mode', 'music'],
      run: () => toggleImmersiveSoundMode(useConsolidatedAppStore, 'manual'),
    });
  }

  // —— Refresh & caches (cache registry–driven; one refresh path app-wide) ——
  listCacheDomains().forEach((domain) => {
    if (!domain.palette) return;
    commands.push({
      id: `refresh:${domain.id}`,
      group: 'refresh',
      title: `Refresh ${domain.label.toLowerCase()}`,
      subtitle: domain.description,
      icon: '🔄',
      keywords: ['refresh', 'cache', 'reload', domain.id],
      run: () => refreshCacheDomain(domain.id),
    });
  });
  commands.push({
    id: 'refresh:all',
    group: 'refresh',
    title: 'Clear all caches',
    subtitle: 'Drop every cached library, catalog, and palette — data refetches as needed',
    icon: '🧹',
    keywords: ['refresh', 'cache', 'clear', 'bust', 'reset'],
    run: () => clearAllCacheDomains(),
  });

  // —— Settings destinations (registry-driven) ——
  SETTINGS_TAB_META.forEach((tab) => {
    commands.push({
      id: `settings:${tab.id}`,
      group: 'settings',
      title: `Settings · ${tab.label}`,
      subtitle: tab.description,
      icon: tab.icon,
      keywords: tab.keywords,
      run: () => openSettingsToTab(tab.id),
    });
  });

  // —— Allowlisted admin quick actions (non-destructive only) ——
  if (typeof handlers.runAdminAction === 'function') {
    const adminConfig = normalizeAdminPanelConfig(state?.floatingWidgets?.adminPanel?.config);
    adminConfig.powerActions.forEach((action) => {
      if (!action?.command || isDestructiveAdminAction(action)) return;
      commands.push({
        id: `admin:${action.id || action.command}`,
        group: 'admin',
        title: action.name || action.command,
        subtitle: 'Quick Access action',
        icon: action.icon || '🔧',
        keywords: [action.command],
        run: () => handlers.runAdminAction(action),
      });
    });
  }

  return commands;
}

/**
 * Filter + group commands for display.
 * Empty query: recents first (by id), then all commands in group order.
 * With query: fuzzy-scored matches only, still grouped.
 *
 * @param {Array} commands
 * @param {string} query
 * @param {string[]} recentIds
 * @returns {Array<{ group: { id: string, label: string }, commands: Array }>}
 */
export function filterAndGroupCommands(commands, query, recentIds = []) {
  const q = (query || '').trim();

  let visible;
  if (!q) {
    visible = commands;
  } else {
    visible = commands
      .map((command) => ({ command, score: scoreCommand(q, command) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ command }) => command);
  }

  const groups = [];

  if (!q && recentIds.length > 0) {
    const byId = new Map(commands.map((c) => [c.id, c]));
    const recents = recentIds.map((id) => byId.get(id)).filter(Boolean);
    if (recents.length > 0) {
      groups.push({ group: COMMAND_GROUPS[0], commands: recents });
    }
  }

  for (const group of COMMAND_GROUPS) {
    if (group.id === 'recent') continue;
    const inGroup = visible.filter((c) => c.group === group.id);
    if (inGroup.length > 0) {
      groups.push({ group, commands: inGroup });
    }
  }

  return groups;
}
