/**
 * Admin Panel helpers (renderer).
 * Command allowlist rules mirror `shared/admin-command-allowlist.cjs` — keep in sync.
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
const SETTINGS_URI_PATTERN = /^ms-settings:[a-z0-9-]+(?:\/[a-z0-9-]+)*$/i;

export const DESTRUCTIVE_ACTION_IDS = new Set(['shutdown', 'restart', 'hibernate', 'sleep']);

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
 * @returns {{ ok: boolean, error?: string, destructive?: boolean }}
 */
export function validateAdminCommand(command) {
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

export function isDestructiveAdminAction(action) {
  if (!action || typeof action !== 'object') return false;
  if (action.id && DESTRUCTIVE_ACTION_IDS.has(String(action.id))) return true;
  const result = validateAdminCommand(action.command);
  return Boolean(result.ok && result.destructive);
}

/** Normalize whatever onSave / store may hand us into `{ powerActions: [] }`. */
export function normalizeAdminPanelConfig(input) {
  if (Array.isArray(input)) {
    return { powerActions: input };
  }
  if (input && typeof input === 'object') {
    const list = Array.isArray(input.powerActions) ? input.powerActions : [];
    return { powerActions: list };
  }
  return { powerActions: [] };
}

export function applyAdminPanelPowerActions(currentAdminPanel, powerActionsOrConfig) {
  const config = normalizeAdminPanelConfig(powerActionsOrConfig);
  return {
    ...currentAdminPanel,
    config,
  };
}

export async function executeAdminCommand(command) {
  if (!window.api?.executeCommand) {
    return { success: false, error: 'Command API is unavailable' };
  }
  const preflight = validateAdminCommand(command);
  if (!preflight.ok) {
    return { success: false, error: preflight.error || 'Command is not allowlisted' };
  }
  try {
    const result = await window.api.executeCommand(command);
    if (result && typeof result === 'object') {
      return result;
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error?.message || 'Failed to run command' };
  }
}

/** Built-in catalog used by the action picker. */
export const ADMIN_POWER_ACTIONS_CATALOG = [
  { id: 'shutdown', name: 'Shut Down', command: 'shutdown /s /t 0', icon: '🔌', category: 'Power', destructive: true },
  { id: 'restart', name: 'Restart', command: 'shutdown /r /t 0', icon: '🔄', category: 'Power', destructive: true },
  { id: 'sleep', name: 'Sleep', command: 'rundll32.exe powrprof.dll,SetSuspendState 0,1,0', icon: '😴', category: 'Power', destructive: true },
  { id: 'hibernate', name: 'Hibernate', command: 'shutdown /h', icon: '💤', category: 'Power', destructive: true },
  { id: 'lock', name: 'Lock Computer', command: 'rundll32.exe user32.dll,LockWorkStation', icon: '🔒', category: 'Power' },

  { id: 'taskmgr', name: 'Task Manager', command: 'start taskmgr', icon: '⚙️', category: 'System' },
  { id: 'control', name: 'Control Panel', command: 'start control', icon: '🎛️', category: 'System' },
  { id: 'devmgmt', name: 'Device Manager', command: 'start devmgmt.msc', icon: '🔧', category: 'System' },
  { id: 'services', name: 'Services', command: 'start services.msc', icon: '🛠️', category: 'System' },
  { id: 'regedit', name: 'Registry Editor', command: 'start regedit', icon: '📝', category: 'System' },
  { id: 'about', name: 'About Windows', command: 'start ms-settings:about', icon: 'ℹ️', category: 'System' },
  { id: 'calc', name: 'Calculator', command: 'start calc', icon: '🧮', category: 'Tools' },
  { id: 'notepad', name: 'Notepad', command: 'start notepad', icon: '📄', category: 'Tools' },

  { id: 'cmd', name: 'Command Prompt', command: 'start cmd', icon: '💻', category: 'Tools' },
  { id: 'powershell', name: 'PowerShell', command: 'start powershell', icon: '⚡', category: 'Tools' },

  { id: 'explorer', name: 'File Explorer', command: 'start explorer', icon: '📁', category: 'File' },
  { id: 'desktop', name: 'Show Desktop', command: 'start explorer shell:::{3080F90D-D7AD-11D9-BD98-0000947B0257}', icon: '🖥️', category: 'File' },
  { id: 'recycle', name: 'Recycle Bin', command: 'start explorer shell:::{645FF040-5081-101B-9F08-00AA002F954E}', icon: '🗑️', category: 'File' },

  { id: 'network', name: 'Network Connections', command: 'start ncpa.cpl', icon: '🌐', category: 'Settings' },
  { id: 'sound', name: 'Sound Settings', command: 'start mmsys.cpl', icon: '🔊', category: 'Settings' },
  { id: 'display', name: 'Display Settings', command: 'start desk.cpl', icon: '🖼️', category: 'Settings' },
  { id: 'keyboard', name: 'Keyboard Settings', command: 'start main.cpl keyboard', icon: '⌨️', category: 'Settings' },
  { id: 'mouse', name: 'Mouse Settings', command: 'start main.cpl', icon: '🖱️', category: 'Settings' },
  { id: 'system', name: 'System Properties', command: 'start sysdm.cpl', icon: '💻', category: 'Settings' },
  { id: 'users', name: 'User Accounts', command: 'start nusrmgr.cpl', icon: '👤', category: 'Settings' },
  { id: 'firewall', name: 'Windows Firewall', command: 'start firewall.cpl', icon: '🔥', category: 'Security' },

  { id: 'volume-mixer', name: 'Volume Settings', command: 'start ms-settings:sound', icon: '🔊', category: 'Settings' },
  { id: 'update', name: 'Windows Update', command: 'start ms-settings:windowsupdate', icon: '🔄', category: 'Settings' },
  { id: 'privacy', name: 'Privacy Settings', command: 'start ms-settings:privacy', icon: '🔒', category: 'Settings' },
  { id: 'accessibility', name: 'Accessibility Settings', command: 'start ms-settings:easeofaccess', icon: '♿', category: 'Settings' },
  { id: 'gaming', name: 'Gaming Settings', command: 'start ms-settings:gaming-gamebar', icon: '🎮', category: 'Settings' },
  { id: 'notifications', name: 'Notifications', command: 'start ms-settings:notifications', icon: '🔔', category: 'Settings' },
  { id: 'focus', name: 'Focus Assist', command: 'start ms-settings:quiethours', icon: '🎯', category: 'Settings' },
  { id: 'nightlight', name: 'Night Light', command: 'start ms-settings:nightlight', icon: '🌙', category: 'Settings' },
  { id: 'bluetooth', name: 'Bluetooth Settings', command: 'start ms-settings:bluetooth', icon: '📶', category: 'Settings' },
  { id: 'wifi', name: 'Wi-Fi Settings', command: 'start ms-settings:network-wifi', icon: '📡', category: 'Settings' },
  { id: 'storage', name: 'Storage Settings', command: 'start ms-settings:storagesense', icon: '💾', category: 'Settings' },
  { id: 'apps', name: 'Apps & Features', command: 'start ms-settings:appsfeatures', icon: '📱', category: 'Settings' },
  { id: 'defaults', name: 'Default Apps', command: 'start ms-settings:defaultapps', icon: '📋', category: 'Settings' },
  { id: 'language', name: 'Language Settings', command: 'start ms-settings:language', icon: '🌍', category: 'Settings' },
  { id: 'time', name: 'Time & Language', command: 'start ms-settings:dateandtime', icon: '🕐', category: 'Settings' },
  { id: 'region', name: 'Region Settings', command: 'start ms-settings:regionlanguage', icon: '🌎', category: 'Settings' },
  { id: 'search', name: 'Search Settings', command: 'start ms-settings:search', icon: '🔍', category: 'Settings' },
  { id: 'speech', name: 'Speech Settings', command: 'start ms-settings:speech', icon: '🗣️', category: 'Settings' },
  { id: 'ink', name: 'Pen & Windows Ink', command: 'start ms-settings:pen', icon: '✏️', category: 'Settings' },
  { id: 'touch', name: 'Touch Settings', command: 'start ms-settings:devices-touch', icon: '👆', category: 'Settings' },
  { id: 'printers', name: 'Printers & Scanners', command: 'start ms-settings:printers', icon: '🖨️', category: 'Settings' },
  { id: 'phone', name: 'Phone Settings', command: 'start ms-settings:phone', icon: '📞', category: 'Settings' },
  { id: 'project', name: 'Project Settings', command: 'start ms-settings:project', icon: '📽️', category: 'Settings' },
  { id: 'multitask', name: 'Multitasking', command: 'start ms-settings:multitasking', icon: '🔄', category: 'Settings' },
];

export const ADMIN_ACTION_CATEGORIES = [
  ...new Set(ADMIN_POWER_ACTIONS_CATALOG.map((a) => a.category)),
  'Custom',
];

export const CUSTOM_ACTION_ICONS = ['⚙️', '🕐', '🔧', '🎛️', '📁', '💻', '🔍', '⚡', '🎮', '🔊', '🌐', '🔒', '🧮', '📄'];
