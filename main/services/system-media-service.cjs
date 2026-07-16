/**
 * Windows SMTC (system media) main-process service.
 * Uses windows-media-sessions (stdio .NET bridge) — no native node addons.
 * Soft-fails on non-Windows or missing package.
 *
 * start/stop are serialized: concurrent stop cannot tear down a bridge that a
 * newer start just opened (React Strict Mode / effect remount races).
 */

const TIMELINE_COALESCE_MS = 400;

function createSystemMediaService({ getMainWindow, execFile, platform }) {
  let unsubscribe = null;
  let started = false;
  let available = false;
  let lastError = null;
  let lastSessions = [];
  let lastPushAt = 0;
  let lastFingerprint = '';
  let mediaSessionsApi = null;
  /** @type {Promise<void> | null} */
  let stopPromise = null;
  /** @type {Promise<object> | null} */
  let startPromise = null;

  function isWindows() {
    return (platform || process.platform) === 'win32';
  }

  function loadApi() {
    if (mediaSessionsApi) return mediaSessionsApi;
    if (!isWindows()) {
      available = false;
      lastError = 'System media is only available on Windows.';
      return null;
    }
    try {
      // Lazy require so non-Windows / missing package never crash main boot.
      mediaSessionsApi = require('windows-media-sessions');
      available = true;
      lastError = null;
      return mediaSessionsApi;
    } catch (err) {
      available = false;
      lastError = err?.message || 'windows-media-sessions unavailable';
      mediaSessionsApi = null;
      return null;
    }
  }

  function sessionFingerprint(sessions) {
    return (sessions || [])
      .map((s) =>
        [
          s.id,
          s.playbackStatus,
          s.title,
          s.artist,
          s.timeline?.positionMs ?? '',
          s.timeline?.durationMs ?? '',
          s.thumbnail ? 'art' : '',
        ].join('|')
      )
      .join(';;');
  }

  function broadcast(sessions) {
    const win = typeof getMainWindow === 'function' ? getMainWindow() : null;
    if (!win || win.isDestroyed()) return;
    win.webContents.send('system-media:update', {
      available,
      error: lastError,
      sessions: sessions || [],
    });
  }

  function onSessions(sessions) {
    lastSessions = Array.isArray(sessions) ? sessions : [];
    const fp = sessionFingerprint(lastSessions);
    const now = Date.now();
    // Coalesce rapid timeline ticks so renderer store isn't hammered.
    if (fp === lastFingerprint) return;
    const onlyTimeline =
      lastFingerprint &&
      fp.replace(/\d+\|/g, '|') === lastFingerprint.replace(/\d+\|/g, '|');
    if (onlyTimeline && now - lastPushAt < TIMELINE_COALESCE_MS) return;
    lastFingerprint = fp;
    lastPushAt = now;
    broadcast(lastSessions);
  }

  function getStatus() {
    if (!started && isWindows() && !mediaSessionsApi && !lastError) {
      // Probe without starting the subscription — tells settings UI if the bridge loads.
      loadApi();
    }
    return {
      available,
      error: lastError,
      started,
      sessions: lastSessions,
      platform: platform || process.platform,
    };
  }

  /**
   * Start SMTC subscription. Awaits any in-flight stop, then awaits the first
   * session snapshot so the IPC caller gets real sessions (not an empty race).
   */
  async function start() {
    if (startPromise) return startPromise;

    startPromise = (async () => {
      if (stopPromise) {
        try {
          await stopPromise;
        } catch {
          /* ignore */
        }
      }

      if (started) return getStatus();

      started = true;
      const api = loadApi();
      if (!api) {
        broadcast([]);
        return getStatus();
      }

      try {
        unsubscribe = api.onSessionsChanged(onSessions);
        try {
          const sessions = await api.getAllSessions();
          onSessions(sessions);
        } catch (err) {
          lastError = err?.message || String(err);
          available = false;
          broadcast([]);
        }
      } catch (err) {
        lastError = err?.message || String(err);
        available = false;
        broadcast([]);
      }

      return getStatus();
    })();

    try {
      return await startPromise;
    } finally {
      startPromise = null;
    }
  }

  async function stop() {
    if (stopPromise) return stopPromise;

    stopPromise = (async () => {
      // Wait for an in-flight start so we don't shutdown under it.
      if (startPromise) {
        try {
          await startPromise;
        } catch {
          /* ignore */
        }
      }

      started = false;
      if (typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch {
          /* ignore */
        }
        unsubscribe = null;
      }
      if (mediaSessionsApi?.shutdown) {
        try {
          await mediaSessionsApi.shutdown();
        } catch {
          /* ignore */
        }
      }
      lastSessions = [];
      lastFingerprint = '';
      lastPushAt = 0;
    })();

    try {
      await stopPromise;
    } finally {
      stopPromise = null;
    }
  }

  /**
   * Media-key transport (SMTC package is read-only). Targets Windows current session.
   * @param {'playPause' | 'next' | 'previous'} action
   */
  function sendMediaKey(action) {
    if (!isWindows()) {
      return Promise.resolve({ success: false, error: 'Not Windows' });
    }
    const vk =
      action === 'next' ? 0xb0 : action === 'previous' ? 0xb1 : 0xb3; // NEXT / PREV / PLAY_PAUSE
    const script = `
$code = @"
using System;
using System.Runtime.InteropServices;
public class K {
  [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
}
"@
Add-Type -TypeDefinition $code -ErrorAction SilentlyContinue
[K]::keybd_event(${vk}, 0, 0, [UIntPtr]::Zero)
[K]::keybd_event(${vk}, 0, 2, [UIntPtr]::Zero)
`;
    const run = execFile || require('child_process').execFile;
    return new Promise((resolve) => {
      run(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-Command', script],
        { windowsHide: true, timeout: 4000 },
        (err) => {
          if (err) {
            resolve({ success: false, error: err.message });
            return;
          }
          resolve({ success: true });
        }
      );
    });
  }

  return {
    start,
    stop,
    getStatus,
    sendMediaKey,
    isWindows,
  };
}

module.exports = {
  createSystemMediaService,
};
