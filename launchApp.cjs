'use strict';

/**
 * Single place for channel launch behavior on Windows (proven patterns):
 * - shell.openExternal for http(s), steam://, Epic launcher URIs, and other registered schemes
 * - cmd start shell:AppsFolder for Microsoft Store AUMIDs
 * - child_process.spawn for Win32 .exe (with cwd + optional elevation)
 * - shell.openPath for .lnk shortcuts, folders, and fallback file paths
 */

const { shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

async function checkAndBringToForeground(executablePath, args = []) {
  try {
    const processName = path.basename(executablePath, path.extname(executablePath));
    let targetProcessName = processName;

    if (processName === 'Update' && args.includes('--processStart')) {
      const processStartIndex = args.indexOf('--processStart');
      if (processStartIndex !== -1 && args[processStartIndex + 1]) {
        targetProcessName = args[processStartIndex + 1].replace('.exe', '');
      }
    } else if (processName === 'Launcher' && args.includes('--launch')) {
      const launchIndex = args.indexOf('--launch');
      if (launchIndex !== -1 && args[launchIndex + 1]) {
        targetProcessName = args[launchIndex + 1].replace('.exe', '');
      }
    } else if (processName === 'Updater' && args.includes('--process')) {
      const processIndex = args.indexOf('--process');
      if (processIndex !== -1 && args[processIndex + 1]) {
        targetProcessName = args[processIndex + 1].replace('.exe', '');
      }
    }

    const psCommand = `
      Add-Type -TypeDefinition @"
        using System;
        using System.Runtime.InteropServices;
        public class Win32 {
          [DllImport("user32.dll")]
          [return: MarshalAs(UnmanagedType.Bool)]
          public static extern bool SetForegroundWindow(IntPtr hWnd);

          [DllImport("user32.dll")]
          [return: MarshalAs(UnmanagedType.Bool)]
          public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
        }
"@

      $processes = Get-Process -Name "${targetProcessName}" -ErrorAction SilentlyContinue
      if ($processes) {
        foreach ($process in $processes) {
          try {
            $hwnd = $process.MainWindowHandle
            if ($hwnd -ne [System.IntPtr]::Zero) {
              [Win32]::SetForegroundWindow($hwnd)
              [Win32]::ShowWindow($hwnd, 9)
              Write-Host "Brought ${targetProcessName} to foreground"
              exit 0
            }
          } catch {
            Write-Host "Could not bring ${targetProcessName} to foreground: $_"
          }
        }
      }
      exit 1
    `;

    const result = await new Promise((resolve) => {
      const child = spawn('powershell', ['-Command', psCommand], { stdio: ['pipe', 'pipe', 'pipe'] });
      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      child.stderr.on('data', (data) => {
        console.error('PowerShell error:', data.toString());
      });
      child.on('close', (code) => {
        resolve({ success: code === 0, output: output.trim() });
      });
    });

    return result.success;
  } catch (error) {
    console.error('Error checking/bringing app to foreground:', error);
    return false;
  }
}

async function launchViaOpenExternal(uri) {
  try {
    await shell.openExternal(uri.trim());
    return { ok: true };
  } catch (err) {
    console.error('[launchApp] openExternal failed:', err);
    return { ok: false, error: err.message || String(err) };
  }
}

function spawnDetachedPromise(command, args, options) {
  return new Promise((resolve) => {
    try {
      const child = spawn(command, args, options);
      child.on('error', (err) => resolve({ ok: false, error: err.message }));
      child.on('spawn', () => {
        child.unref();
        resolve({ ok: true });
      });
    } catch (err) {
      resolve({ ok: false, error: err.message });
    }
  });
}

async function launchMicrosoftStoreAumid(appPath) {
  const command = `start shell:AppsFolder\\${appPath}`;
  return spawnDetachedPromise('cmd', ['/c', command], {
    detached: true,
    stdio: 'ignore',
    shell: true,
  });
}

function parseExeAndArgs(appPathStr) {
  if (appPathStr.startsWith('"')) {
    const match = appPathStr.match(/^"([^\"]+)"\s*(.*)$/);
    if (match) {
      const exe = match[1];
      const argsString = match[2] || '';
      const args = argsString.match(/(?:[^\s\"]+|"[^"]*")+/g) || [];
      return [exe, ...args.map((arg) => arg.replace(/^"|"$/g, ''))];
    }
  }

  if (fs.existsSync(appPathStr)) {
    return [appPathStr];
  }

  const parts = appPathStr.split(' ');
  let i = 1;
  let exe = parts[0];

  while (i <= parts.length) {
    const testPath = parts.slice(0, i).join(' ');
    if (fs.existsSync(testPath)) {
      exe = testPath;
      i++;
    } else {
      break;
    }
  }

  const args = parts.slice(i - 1);
  return [exe, ...args];
}

async function launchWin32Exe(appPathStr, asAdmin) {
  const systemAppFallbacks = {
    'File Explorer': 'C:\\Windows\\explorer.exe',
    explorer: 'C:\\Windows\\explorer.exe',
    Explorer: 'C:\\Windows\\explorer.exe',
    Notepad: 'C:\\Windows\\System32\\notepad.exe',
    notepad: 'C:\\Windows\\System32\\notepad.exe',
    Calculator: 'C:\\Windows\\System32\\calc.exe',
    calc: 'C:\\Windows\\System32\\calc.exe',
    Paint: 'C:\\Windows\\System32\\mspaint.exe',
    mspaint: 'C:\\Windows\\System32\\mspaint.exe',
    'Command Prompt': 'C:\\Windows\\System32\\cmd.exe',
    cmd: 'C:\\Windows\\System32\\cmd.exe',
    PowerShell: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
    powershell: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
  };

  let mutablePath = appPathStr;
  const appName = path.basename(mutablePath, path.extname(mutablePath));
  if (systemAppFallbacks[appName] && fs.existsSync(systemAppFallbacks[appName])) {
    mutablePath = systemAppFallbacks[appName];
  }

  const [executablePath, ...args] = parseExeAndArgs(mutablePath);
  const workingDir = path.dirname(executablePath);

  const broughtToForeground = await checkAndBringToForeground(executablePath, args);
  if (broughtToForeground) {
    return { ok: true, foreground: true };
  }

  if (asAdmin) {
    const argsString = args.length > 0 ? ` -ArgumentList "${args.join('", "')}"` : '';
    const psCmd = `Start-Process -FilePath "${executablePath}"${argsString} -Verb RunAs`;
    return spawnDetachedPromise('powershell', ['-Command', psCmd], {
      detached: true,
      stdio: 'ignore',
      shell: true,
    });
  }

  return new Promise((resolve) => {
    const child = spawn(executablePath, args, {
      cwd: workingDir,
      detached: true,
      stdio: 'ignore',
      shell: false,
    });
    child.on('error', (err) => {
      console.error('[LAUNCH ERROR]', err);
      resolve({ ok: false, error: err.message });
    });
    child.on('spawn', () => {
      child.unref();
      resolve({ ok: true });
    });
  });
}

/**
 * @param {{ type?: string, path: string, asAdmin?: boolean }} payload
 * @returns {Promise<{ ok: boolean, error?: string, foreground?: boolean }>}
 */
async function launchChannelApp(payload) {
  const { type: launchType = 'exe', path: rawPath, asAdmin } = payload || {};
  if (!rawPath || typeof rawPath !== 'string') {
    return { ok: false, error: 'No path provided' };
  }

  const trimmed = rawPath.trim();
  console.log(`[launchApp] type=${launchType} path=${trimmed} asAdmin=${!!asAdmin}`);

  // 1) Well-known URI schemes → OS default handler (browser, Steam, Epic, etc.)
  if (/^https?:\/\//i.test(trimmed)) {
    return launchViaOpenExternal(trimmed);
  }
  if (/^steam:\/\//i.test(trimmed)) {
    return launchViaOpenExternal(trimmed);
  }
  if (/^com\.epicgames\.launcher:\/\//i.test(trimmed)) {
    return launchViaOpenExternal(trimmed);
  }

  // Steam numeric App ID (may be stored without steam:// prefix)
  if (launchType === 'steam' && /^\d+$/.test(trimmed)) {
    return launchViaOpenExternal(`steam://rungameid/${trimmed}`);
  }

  // Other registered schemes for URL channels (mailto:, etc.)
  if (launchType === 'url' && /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    return launchViaOpenExternal(trimmed);
  }

  // 2) Microsoft Store / UWP by AUMID
  if (launchType === 'microsoftstore') {
    return launchMicrosoftStoreAumid(trimmed);
  }

  // 3) Win32 executable path (+ args)
  if (launchType === 'exe') {
    try {
      return await launchWin32Exe(trimmed, !!asAdmin);
    } catch (err) {
      console.error('[launchApp] exe launch failed:', err);
      return { ok: false, error: err.message || String(err) };
    }
  }

  // 4) Fallback: .lnk, folders, or Explorer-associated paths
  try {
    const errMsg = await shell.openPath(trimmed);
    if (errMsg) {
      console.error('[launchApp] openPath:', errMsg);
      return { ok: false, error: errMsg };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}

module.exports = { launchChannelApp };
