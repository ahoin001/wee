/**
 * System command IPC — allowlisted Windows tools / power actions only.
 */
const { runExclusive } = require('../services/scan-serialization.cjs');
const { execFile } = require('child_process');
const { isTrustedMainWindowEvent } = require('./trusted-renderer-utils.cjs');
const {
  ALLOWED_SIMPLE_START_TARGETS,
  SHELL_GUID_PATTERN,
  SETTINGS_URI_PATTERN,
  validateAdminCommand,
  splitCommand,
} = require('../../shared/admin-command-allowlist.cjs');

function registerSystemCommandHandlers({
  ipcMain,
  exec,
  shell,
  getMainWindow,
}) {
  function isLikelyStoreAppId(appId) {
    if (!appId || typeof appId !== 'string') return false;
    const normalized = appId.trim();
    if (!normalized.includes('!')) return false;
    if (!/^[^\s!]+![^\s!]+$/.test(normalized)) return false;
    if (/\.exe/i.test(normalized)) return false;
    if (normalized.includes('\\') || normalized.includes('/')) return false;
    return true;
  }

  function normalizeStartAppsPayload(stdout) {
    const trimmed = String(stdout || '').trim();
    if (!trimmed) return [];
    const data = JSON.parse(trimmed);
    const apps = Array.isArray(data) ? data : data ? [data] : [];
    return apps
      .map((app) => ({
        name: app.Name || app.name || '',
        appId: app.AppID || app.AppId || app.appId || '',
      }))
      .filter((app) => app.name && isLikelyStoreAppId(app.appId));
  }

  function runPowerShellJson(command) {
    return new Promise((resolve) => {
      execFile(
        'powershell.exe',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command],
        { encoding: 'utf8', windowsHide: true, maxBuffer: 10 * 1024 * 1024 },
        (err, stdout, stderr) => {
          if (err) {
            resolve({
              success: false,
              apps: [],
              error: err.message || String(stderr || 'PowerShell failed'),
            });
            return;
          }
          try {
            resolve({ success: true, apps: normalizeStartAppsPayload(stdout), error: null });
          } catch (parseError) {
            resolve({
              success: false,
              apps: [],
              error: parseError.message || 'Failed to parse Store app list',
            });
          }
        }
      );
    });
  }

  function mergeStoreAppsById(primary, extra) {
    const byId = new Map();
    [...(primary || []), ...(extra || [])].forEach((app) => {
      const key = String(app.appId || '').toLowerCase();
      if (!key || byId.has(key)) return;
      byId.set(key, app);
    });
    return [...byId.values()];
  }

  async function ensureAppleMusicStoreApp(apps) {
    const hasAppleMusic = (apps || []).some((app) => /apple\s*music/i.test(String(app.name || '')));
    if (hasAppleMusic) return apps;

    const filtered = await runPowerShellJson(
      "Get-StartApps | Where-Object { $_.Name -like '*Apple Music*' } | Select-Object Name, AppID | ConvertTo-Json -Compress"
    );
    let merged = mergeStoreAppsById(apps, filtered.success ? filtered.apps : []);

    if (merged.some((app) => /apple\s*music/i.test(String(app.name || '')))) {
      return merged;
    }

    const appx = await runPowerShellJson(
      [
        "$pkg = Get-AppxPackage -Name '*AppleMusic*' -ErrorAction SilentlyContinue | Select-Object -First 1;",
        "if (-not $pkg) { '[]'; exit }",
        "$family = $pkg.PackageFamilyName;",
        "$manifestPath = Join-Path $pkg.InstallLocation 'AppxManifest.xml';",
        "$id = 'App';",
        "if (Test-Path $manifestPath) {",
        "  try {",
        "    [xml]$manifest = Get-Content -LiteralPath $manifestPath -ErrorAction Stop;",
        "    $appNode = $manifest.Package.Applications.Application | Select-Object -First 1;",
        "    if ($appNode -and $appNode.Id) { $id = [string]$appNode.Id }",
        "  } catch {}",
        "}",
        "@{ Name = 'Apple Music'; AppID = ($family + '!' + $id) } | ConvertTo-Json -Compress",
      ].join(' ')
    );

    if (appx.success && appx.apps.length) {
      merged = mergeStoreAppsById(merged, appx.apps);
    }
    return merged;
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

  ipcMain.handle('uwp:list-apps', async (event) => {
    if (!isTrustedMainWindowEvent(event, getMainWindow)) {
      return { success: false, apps: [], error: 'Untrusted renderer' };
    }
    return runExclusive(async () => {
      const listed = await runPowerShellJson(
        'Get-StartApps | Select-Object Name, AppID | ConvertTo-Json -Compress'
      );
      if (!listed.success) {
        return { success: false, apps: [], error: listed.error || 'Failed to list Store apps' };
      }
      try {
        const apps = await ensureAppleMusicStoreApp(listed.apps);
        return { success: true, apps, error: null };
      } catch (error) {
        return {
          success: true,
          apps: listed.apps,
          error: error?.message || null,
        };
      }
    });
  });

  ipcMain.handle('uwp:launch', async (event, appId) => {
    if (!isTrustedMainWindowEvent(event, getMainWindow)) {
      return { success: false, error: 'Untrusted renderer' };
    }
    if (!appId) return { success: false, error: 'No AppID provided' };
    if (!isLikelyStoreAppId(appId)) {
      return { success: false, error: 'Invalid AppID format' };
    }
    return runExecFile('cmd.exe', ['/c', 'start', '', `shell:AppsFolder\\${appId}`]);
  });

  async function executeApprovedCommand(command) {
    const gate = validateAdminCommand(command);
    if (!gate.ok) {
      return { success: false, error: gate.error || 'Command is not allowlisted' };
    }

    const trimmed = String(command || '').trim();

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
