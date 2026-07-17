/**
 * Detect whether a launch target should deep-pause Wee decorative work.
 * Casual http(s) / generic tools stay soft-throttle only.
 */

const GAME_PATH_MARKERS = [
  /steamapps[/\\]common/i,
  /[/\\]Epic Games[/\\]/i,
  /GOG Galaxy[/\\]Games/i,
  /[/\\]XboxGames[/\\]/i,
  /[/\\]Riot Games[/\\]/i,
  /[/\\]Origin Games[/\\]/i,
  /[/\\]EA Games[/\\]/i,
  /[/\\]Ubisoft[/\\](games|Ubisoft Game Launcher[/\\]games)/i,
  /[/\\]Battle\.net[/\\]/i,
];

const CASUAL_EXE_NAMES = [
  'chrome.exe',
  'msedge.exe',
  'firefox.exe',
  'brave.exe',
  'opera.exe',
  'discord.exe',
  'spotify.exe',
  'code.exe',
  'devenv.exe',
  'explorer.exe',
  'notepad.exe',
  'winword.exe',
  'excel.exe',
  'powerpnt.exe',
  'outlook.exe',
  'slack.exe',
  'teams.exe',
  'zoom.exe',
];

/**
 * @param {string|null|undefined} path
 * @param {string|null|undefined} type
 * @returns {boolean}
 */
export function isIntensiveLaunchTarget(path, type) {
  const p = typeof path === 'string' ? path.trim() : '';
  const t = typeof type === 'string' ? type.trim().toLowerCase() : '';

  if (t === 'steam' || t === 'epic') return true;

  if (!p) return false;

  if (/^https?:\/\//i.test(p)) {
    // Steam store links are not game launches; treat as casual.
    return false;
  }

  if (/^steam:\/\//i.test(p) || /^\d+$/.test(p)) return true;
  if (/^com\.epicgames\.launcher:/i.test(p)) return true;

  if (GAME_PATH_MARKERS.some((re) => re.test(p))) return true;

  const base = p.replace(/^"|"$/g, '').split(/[/\\]/).pop()?.toLowerCase() || '';
  if (CASUAL_EXE_NAMES.includes(base)) return false;

  // Generic exe without game-folder markers → casual (browsers, tools, unknown).
  if (t === 'exe' || /\.exe(\s|$|")/i.test(p)) return false;

  if (t === 'url' || t === 'microsoftstore') return false;

  return false;
}

/**
 * @param {{ mode?: string, type?: string, path?: string, source?: string }} opts
 * @returns {boolean}
 */
export function resolveChannelPerformancePause(opts = {}) {
  // Per-channel mode overrides removed — always auto-detect (Game Hub always pauses).
  if (opts.source === 'gamehub') return true;
  return isIntensiveLaunchTarget(opts.path, opts.type);
}

/**
 * @param {string|null|undefined} path
 * @param {string|null|undefined} type
 * @returns {'game' | 'casual'}
 */
export function getAutoPerformancePauseHint(path, type) {
  return isIntensiveLaunchTarget(path, type) ? 'game' : 'casual';
}

export const PERFORMANCE_PAUSE_MODES = ['auto', 'on', 'off'];

export function normalizePerformancePauseMode(value) {
  if (value === 'on' || value === 'off' || value === 'auto') return value;
  return 'auto';
}
