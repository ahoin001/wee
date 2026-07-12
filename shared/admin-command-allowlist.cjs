/**
 * Canonical Windows admin-command allowlist for Quick Access / Admin Panel.
 * Used by main IPC (`execute-command`) and mirrored by the renderer preflight
 * in `src/utils/adminPanelCommands.js` — keep both in sync when changing rules.
 */

const ALLOWED_SIMPLE_START_TARGETS = new Set([
  'taskmgr',
  'control',
  'devmgmt.msc',
  'services.msc',
  'regedit',
  'cmd',
  'powershell',
  'explorer',
  'ncpa.cpl',
  'mmsys.cpl',
  'desk.cpl',
  'sysdm.cpl',
  'nusrmgr.cpl',
  'firewall.cpl',
  'main.cpl',
  'calc',
  'notepad',
  'mspaint',
  'snippingtool',
  'write',
  'osk',
  'cleanmgr',
  'dxdiag',
  'msinfo32',
  'perfmon',
  'resmon',
  'charmap',
  'magnify',
  'control.exe',
  'compmgmt.msc',
  'diskmgmt.msc',
  'eventvwr.msc',
  'gpedit.msc',
  'secpol.msc',
  'appwiz.cpl',
  'timedate.cpl',
  'powercfg.cpl',
  'hdwwiz.cpl',
  'intl.cpl',
]);

const SHELL_GUID_PATTERN = /^shell:::\{[0-9a-f-]{36}\}$/i;
/** ms-settings URIs: path may include nested segments (e.g. network-wifi). */
const SETTINGS_URI_PATTERN = /^ms-settings:[a-z0-9-]+(?:\/[a-z0-9-]+)*$/i;

const DESTRUCTIVE_ACTION_IDS = new Set(['shutdown', 'restart', 'hibernate', 'sleep']);

const DESTRUCTIVE_COMMAND_PATTERNS = [
  /^shutdown\s+\/s\s+\/t\s+0$/i,
  /^shutdown\s+\/r\s+\/t\s+0$/i,
  /^shutdown\s+\/h$/i,
  /^rundll32\.exe\s+powrprof\.dll,SetSuspendState\s+0,1,0$/i,
];

function splitCommand(input) {
  return String(input || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Preflight / gate for Admin Panel commands.
 * @returns {{ ok: boolean, error?: string, destructive?: boolean }}
 */
function validateAdminCommand(command) {
  const trimmed = String(command || '').trim();
  if (!trimmed) {
    return { ok: false, error: 'Command is empty' };
  }
  if (trimmed.length > 256) {
    return { ok: false, error: 'Command is too long (max 256 characters)' };
  }
  if (/[\r\n;&|><`]/.test(trimmed)) {
    return {
      ok: false,
      error: 'Command contains disallowed characters (; & | > < ` and newlines)',
    };
  }

  const destructive = DESTRUCTIVE_COMMAND_PATTERNS.some((re) => re.test(trimmed));

  if (/^shutdown\s+\/s\s+\/t\s+0$/i.test(trimmed)) {
    return { ok: true, destructive: true };
  }
  if (/^shutdown\s+\/r\s+\/t\s+0$/i.test(trimmed)) {
    return { ok: true, destructive: true };
  }
  if (/^shutdown\s+\/h$/i.test(trimmed)) {
    return { ok: true, destructive: true };
  }
  if (/^rundll32\.exe\s+user32\.dll,LockWorkStation$/i.test(trimmed)) {
    return { ok: true, destructive: false };
  }
  if (/^rundll32\.exe\s+powrprof\.dll,SetSuspendState\s+0,1,0$/i.test(trimmed)) {
    return { ok: true, destructive: true };
  }

  const parts = splitCommand(trimmed);
  if (parts.length >= 2 && parts[0].toLowerCase() === 'start') {
    const target = parts[1];
    const lowerTarget = target.toLowerCase();
    const extraArgs = parts.slice(2);

    if (SETTINGS_URI_PATTERN.test(target)) {
      return { ok: true, destructive: false };
    }
    if (lowerTarget === 'explorer' && extraArgs.length > 0 && SHELL_GUID_PATTERN.test(extraArgs[0])) {
      return { ok: true, destructive: false };
    }
    if (ALLOWED_SIMPLE_START_TARGETS.has(lowerTarget) || /\.(msc|cpl)$/i.test(target)) {
      return { ok: true, destructive: false };
    }

    return {
      ok: false,
      error: `"${target}" is not on the allowlist. Use start with a known tool (e.g. notepad, calc) or ms-settings:… / .cpl / .msc.`,
    };
  }

  return {
    ok: false,
    error:
      'Command is not allowlisted. Use forms like “start notepad”, “start ms-settings:sound”, or a known power command.',
  };
}

function isDestructiveAdminAction(action) {
  if (!action || typeof action !== 'object') return false;
  if (action.id && DESTRUCTIVE_ACTION_IDS.has(String(action.id))) return true;
  const result = validateAdminCommand(action.command);
  return Boolean(result.ok && result.destructive);
}

module.exports = {
  ALLOWED_SIMPLE_START_TARGETS,
  SHELL_GUID_PATTERN,
  SETTINGS_URI_PATTERN,
  DESTRUCTIVE_ACTION_IDS,
  validateAdminCommand,
  isDestructiveAdminAction,
  splitCommand,
};
