const { runExclusive } = require('../services/scan-serialization.cjs');
const { execFile } = require('child_process');
const { isTrustedMainWindowEvent } = require('./trusted-renderer-utils.cjs');

function registerSystemCommandHandlers({
  ipcMain,
  exec,
  shell,
  getMainWindow,
}) {
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
  ]);
  const SHELL_GUID_PATTERN = /^shell:::\{[0-9a-f-]{36}\}$/i;
  const SETTINGS_URI_PATTERN = /^ms-settings:[a-z0-9-]+$/i;

  function isLikelyStoreAppId(appId) {
    if (!appId || typeof appId !== 'string') return false;
    const normalized = appId.trim();
    if (!normalized.includes('!')) return false;
    // Package-backed AUMID is usually "PackageFamily!AppId"; keep this broad to avoid false negatives.
    if (!/^[^\s!]+![^\s!]+$/.test(normalized)) return false;
    // Desktop aliases often leak here but are not store identifiers.
    if (/\.exe/i.test(normalized)) return false;
    if (normalized.includes('\\') || normalized.includes('/')) return false;
    return true;
  }

  ipcMain.handle('uwp:list-apps', async (event) => {
    if (!isTrustedMainWindowEvent(event, getMainWindow)) return [];
    return runExclusive(
      () =>
        new Promise((resolve) => {
          exec(
            'powershell -Command "Get-StartApps | Select-Object Name, AppID | ConvertTo-Json"',
            { encoding: 'utf8', maxBuffer: 1024 * 1024 },
            (err, stdout) => {
              if (err) return resolve([]);
              try {
                const data = JSON.parse(stdout);
                const apps = Array.isArray(data) ? data : [data];
                resolve(
                  apps
                    .map((app) => ({ name: app.Name, appId: app.AppID }))
                    .filter((app) => app.name && isLikelyStoreAppId(app.appId))
                );
              } catch {
                resolve([]);
              }
            }
          );
        })
    );
  });

  ipcMain.handle('uwp:launch', async (event, appId) => {
    if (!isTrustedMainWindowEvent(event, getMainWindow)) {
      return { success: false, error: 'Untrusted renderer' };
    }
    return new Promise((resolve) => {
      if (!appId) return resolve({ success: false, error: 'No AppID provided' });
      if (!isLikelyStoreAppId(appId)) {
        return resolve({ success: false, error: 'Invalid AppID format' });
      }
      exec(`start shell:AppsFolder\\${appId}`, (err) => {
        if (err) return resolve({ success: false, error: err.message });
        resolve({ success: true });
      });
    });
  });

  function splitCommand(input) {
    return String(input || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  function runExecFile(command, args = []) {
    return new Promise((resolve) => {
      execFile(command, args, { windowsHide: true }, (err, stdout, stderr) => {
        if (err) {
          return resolve({ success: false, error: err.message, stdout: stdout || '', stderr: stderr || '' });
        }
        resolve({ success: true, stdout: stdout || '', stderr: stderr || '' });
      });
    });
  }

  async function executeApprovedCommand(command) {
    const trimmed = String(command || '').trim();
    if (!trimmed || trimmed.length > 256) {
      return { success: false, error: 'Command is empty or too long' };
    }
    if (/[\r\n;&|><`]/.test(trimmed)) {
      return { success: false, error: 'Command contains disallowed characters' };
    }

    if (/^shutdown\s+\/s\s+\/t\s+0$/i.test(trimmed)) return runExecFile('shutdown.exe', ['/s', '/t', '0']);
    if (/^shutdown\s+\/r\s+\/t\s+0$/i.test(trimmed)) return runExecFile('shutdown.exe', ['/r', '/t', '0']);
    if (/^shutdown\s+\/h$/i.test(trimmed)) return runExecFile('shutdown.exe', ['/h']);
    if (/^rundll32\.exe\s+user32\.dll,LockWorkStation$/i.test(trimmed)) {
      return runExecFile('rundll32.exe', ['user32.dll,LockWorkStation']);
    }
    if (/^rundll32\.exe\s+powrprof\.dll,SetSuspendState\s+0,1,0$/i.test(trimmed)) {
      return runExecFile('rundll32.exe', ['powrprof.dll,SetSuspendState', '0,1,0']);
    }

    const parts = splitCommand(trimmed);
    if (parts.length >= 2 && parts[0].toLowerCase() === 'start') {
      const target = parts[1];
      const lowerTarget = target.toLowerCase();
      const extraArgs = parts.slice(2);
      if (SETTINGS_URI_PATTERN.test(target)) {
        try {
          await shell.openExternal(target);
          return { success: true, stdout: '', stderr: '' };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
      if (lowerTarget === 'explorer' && extraArgs.length > 0 && SHELL_GUID_PATTERN.test(extraArgs[0])) {
        return runExecFile('explorer.exe', [extraArgs[0]]);
      }
      if (ALLOWED_SIMPLE_START_TARGETS.has(lowerTarget) || /\.(msc|cpl)$/i.test(target)) {
        return runExecFile('cmd.exe', ['/c', 'start', '', target, ...extraArgs]);
      }
    }

    return { success: false, error: 'Command is not allowlisted' };
  }

  ipcMain.handle('execute-command', async (event, command) => {
    if (!isTrustedMainWindowEvent(event, getMainWindow)) {
      return { success: false, error: 'Untrusted renderer' };
    }
    return executeApprovedCommand(command);
  });
}

module.exports = {
  registerSystemCommandHandlers,
};
