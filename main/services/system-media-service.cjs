/**
 * Windows SMTC (system media) main-process service.
 * Uses windows-media-sessions (stdio .NET bridge) — no native addons.
 * Soft-fails on non-Windows or missing package.
 *
 * Lifecycle rules:
 * - `stop()` never awaits `startPromise` (avoids start↔stop deadlock).
 * - `start()` may await an in-flight `stopPromise` only *before* creating work.
 * - A monotonic `runId` invalidates in-flight work when stop wins.
 * - IPC `start` returns as soon as the bridge is subscribed — first snapshot is
 *   pumped in the background (never block the renderer on .NET cold start).
 * - Session DTOs sent over IPC strip/limit thumbnails so huge album art cannot
 *   stall Electron structured-clone.
 */

const fs = require('fs');
const path = require('path');

const TIMELINE_COALESCE_MS = 400;
/** Cold .NET spawn / AV scan can take a while; this only gates the background pump. */
const FIRST_SNAPSHOT_TIMEOUT_MS = 20000;
/** Extra attempt after timeout with a fresh SessionManager. */
const FIRST_SNAPSHOT_RETRIES = 1;
/** After JPEG compress, keep a hard ceiling so IPC never freezes. */
const MAX_THUMBNAIL_CHARS = 220000;
/** Longest edge for SMTC album art sent to the renderer. */
const THUMB_MAX_EDGE = 320;
/** JPEG quality for SMTC thumbnails (Apple Music raw data URLs are often 250–400KB). */
const THUMB_JPEG_QUALITY = 78;

function createSystemMediaService({ getMainWindow, execFile, platform, resourcesPath }) {
  let unsubscribe = null;
  let started = false;
  /** Package loaded and usable on this machine (independent of subscription). */
  let available = false;
  let lastError = null;
  let lastSessions = [];
  let lastPushAt = 0;
  let lastFingerprint = '';
  /** @type {typeof import('windows-media-sessions') | null} */
  let mediaSessionsPkg = null;
  /** @type {import('windows-media-sessions').SessionManager | null} */
  let sessionManager = null;
  /** @type {Promise<void> | null} */
  let stopPromise = null;
  /** @type {Promise<object> | null} */
  let startPromise = null;
  /** @type {((err: Error) => void) | null} */
  let onManagerError = null;
  /**
   * Bumped on every stop (and each new start attempt). In-flight start work
   * compares against its captured id and bails instead of resurrecting a
   * torn-down bridge — without awaiting stop (no deadlock).
   */
  let runId = 0;

  function isWindows() {
    return (platform || process.platform) === 'win32';
  }

  /**
   * Packaged Electron cannot spawn .exe from inside asar. Prefer extraResources
   * / asar.unpacked copies, then the normal node_modules path (dev).
   */
  function resolveBackendExe() {
    const res =
      resourcesPath ||
      process.resourcesPath ||
      (typeof process.env.PORTABLE_EXECUTABLE_DIR === 'string'
        ? process.env.PORTABLE_EXECUTABLE_DIR
        : '');
    const candidates = [];
    if (res) {
      candidates.push(path.join(res, 'windows-media-sessions-backend.exe'));
      candidates.push(
        path.join(
          res,
          'app.asar.unpacked',
          'node_modules',
          'windows-media-sessions',
          'bin',
          'win-x64',
          'windows-media-sessions-backend.exe'
        )
      );
    }
    try {
      const pkgRoot = path.dirname(require.resolve('windows-media-sessions/package.json'));
      candidates.push(
        path.join(pkgRoot, 'bin', 'win-x64', 'windows-media-sessions-backend.exe')
      );
    } catch {
      /* package missing */
    }
    if (process.env.WINDOWS_MEDIA_SESSIONS_BACKEND) {
      candidates.unshift(path.resolve(process.env.WINDOWS_MEDIA_SESSIONS_BACKEND));
    }
    for (const candidate of candidates) {
      try {
        if (candidate && fs.existsSync(candidate)) return candidate;
      } catch {
        /* ignore */
      }
    }
    return undefined;
  }

  function loadPackage() {
    if (mediaSessionsPkg) return mediaSessionsPkg;
    if (!isWindows()) {
      available = false;
      lastError = 'System media is only available on Windows.';
      return null;
    }
    try {
      mediaSessionsPkg = require('windows-media-sessions');
      available = true;
      lastError = null;
      return mediaSessionsPkg;
    } catch (err) {
      available = false;
      lastError = err?.message || 'windows-media-sessions unavailable';
      mediaSessionsPkg = null;
      return null;
    }
  }

  function getOrCreateManager() {
    if (sessionManager) return sessionManager;
    const pkg = loadPackage();
    if (!pkg?.createSessionManager) return null;
    const backendPath = resolveBackendExe();
    sessionManager = backendPath
      ? pkg.createSessionManager({ backendPath })
      : pkg.createSessionManager();
    onManagerError = (err) => {
      lastError = err?.message || String(err);
      // Keep available if the package loaded; surface the error to the renderer.
      broadcast(lastSessions);
    };
    try {
      sessionManager.on('error', onManagerError);
    } catch {
      /* ignore */
    }
    return sessionManager;
  }

  async function disposeManager() {
    if (typeof unsubscribe === 'function') {
      try {
        unsubscribe();
      } catch {
        /* ignore */
      }
      unsubscribe = null;
    }
    if (sessionManager) {
      if (onManagerError) {
        try {
          sessionManager.off?.('error', onManagerError);
        } catch {
          /* ignore */
        }
        onManagerError = null;
      }
      try {
        await sessionManager.stop();
      } catch {
        /* ignore */
      }
      // BackendProcess.stopping stays true forever after stop — never reuse.
      sessionManager = null;
    }
  }

  /**
   * Downscale + JPEG-encode SMTC album art (Apple Music often ships 250–400KB PNGs).
   * Uses Electron `nativeImage` when available; falls back to the raw data URL if small.
   * @param {string} dataUrl
   * @returns {string}
   */
  function compressThumbnailDataUrl(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string') return '';
    const raw = dataUrl.trim();
    if (!raw.startsWith('data:')) return '';

    try {
      // Lazy require — keeps this service testable under plain Node.
      // eslint-disable-next-line global-require
      const { nativeImage } = require('electron');
      if (!nativeImage?.createFromDataURL) {
        return raw.length <= MAX_THUMBNAIL_CHARS ? raw : '';
      }
      const image = nativeImage.createFromDataURL(raw);
      if (!image || image.isEmpty()) return '';
      const { width, height } = image.getSize();
      let working = image;
      if (width > THUMB_MAX_EDGE || height > THUMB_MAX_EDGE) {
        const scale = Math.min(THUMB_MAX_EDGE / width, THUMB_MAX_EDGE / height);
        working = image.resize({
          width: Math.max(1, Math.round(width * scale)),
          height: Math.max(1, Math.round(height * scale)),
          quality: 'better',
        });
      }
      const jpeg = working.toJPEG(THUMB_JPEG_QUALITY);
      if (!jpeg || !jpeg.length) return '';
      const out = `data:image/jpeg;base64,${jpeg.toString('base64')}`;
      return out.length <= MAX_THUMBNAIL_CHARS ? out : '';
    } catch {
      return raw.length <= MAX_THUMBNAIL_CHARS ? raw : '';
    }
  }

  /**
   * Limit IPC payload size. Compress art for the primary session so Apple Music
   * / Spotify Desktop covers always reach the tile without freezing structured-clone.
   */
  function sanitizeSessionForIpc(session, includeThumbnail) {
    if (!session || typeof session !== 'object') return null;
    const rawThumb =
      includeThumbnail && typeof session.thumbnail === 'string' ? session.thumbnail : '';
    const thumbnail = rawThumb ? compressThumbnailDataUrl(rawThumb) : '';
    return {
      id: session.id,
      sourceAppUserModelId: session.sourceAppUserModelId || '',
      sourceAppDisplayName: session.sourceAppDisplayName || '',
      title: session.title || '',
      artist: session.artist || '',
      albumTitle: session.albumTitle || '',
      playbackStatus: session.playbackStatus,
      timeline: session.timeline
        ? {
            positionMs: session.timeline.positionMs,
            durationMs: session.timeline.durationMs,
          }
        : undefined,
      controls: session.controls
        ? {
            canPlay: Boolean(session.controls.canPlay),
            canPause: Boolean(session.controls.canPause),
            canSkipNext: Boolean(session.controls.canSkipNext),
            canSkipPrevious: Boolean(session.controls.canSkipPrevious),
          }
        : undefined,
      thumbnail,
    };
  }

  function sanitizeSessionsForIpc(sessions) {
    const list = Array.isArray(sessions) ? sessions : [];
    const statusOf = (s) => String(s?.playbackStatus || '').toLowerCase();
    const playing = list.filter(
      (s) => statusOf(s) === 'playing' || statusOf(s) === 'changing'
    );
    // Prefer playing; else any session that already has art; else first.
    const withArt = list.filter((s) => typeof s?.thumbnail === 'string' && s.thumbnail);
    const thumbTargets =
      playing.length > 0 ? playing : withArt.length > 0 ? withArt.slice(0, 1) : list.slice(0, 1);
    const thumbIds = new Set(thumbTargets.map((s) => s?.id).filter(Boolean));
    return list
      .map((s) => sanitizeSessionForIpc(s, thumbIds.has(s?.id)))
      .filter(Boolean);
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
      started,
      sessions: sessions || [],
    });
  }

  function onSessions(sessions) {
    lastSessions = sanitizeSessionsForIpc(sessions);
    lastError = null;
    available = true;
    const fp = sessionFingerprint(lastSessions);
    const now = Date.now();
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
    if (!started && isWindows() && !mediaSessionsPkg && !lastError) {
      loadPackage();
    }
    return {
      available,
      error: lastError,
      started,
      sessions: lastSessions,
      platform: platform || process.platform,
      backendPath: resolveBackendExe() || null,
    };
  }

  function isCurrentRun(myRun) {
    return myRun === runId;
  }

  /**
   * Background: wait for first snapshot (with one recreate retry).
   * Does not gate the IPC start response.
   * @param {number} myRun
   */
  async function pumpFirstSnapshot(myRun) {
    let lastErr = null;

    for (let attempt = 0; attempt <= FIRST_SNAPSHOT_RETRIES; attempt++) {
      if (!isCurrentRun(myRun)) return;
      if (attempt > 0) {
        await disposeManager();
        if (!isCurrentRun(myRun)) return;
      }

      const manager = getOrCreateManager();
      if (!manager) {
        lastErr = new Error(lastError || 'windows-media-sessions unavailable');
        break;
      }

      if (typeof unsubscribe !== 'function') {
        unsubscribe = manager.onSessionsChanged(onSessions);
      }

      try {
        await manager.waitForReady(FIRST_SNAPSHOT_TIMEOUT_MS);
        if (!isCurrentRun(myRun)) return;
        const sessions = await manager.getAllSessions();
        if (!isCurrentRun(myRun)) return;
        started = true;
        available = true;
        lastError = null;
        onSessions(sessions);
        return;
      } catch (err) {
        if (!isCurrentRun(myRun)) return;
        lastErr = err;
      }
    }

    if (!isCurrentRun(myRun)) return;
    started = false;
    lastError = lastErr?.message || 'Timed out waiting for first backend snapshot';
    available = Boolean(mediaSessionsPkg);
    await disposeManager();
    lastSessions = [];
    lastFingerprint = '';
    lastPushAt = 0;
    broadcast([]);
  }

  async function awaitSettled(promise) {
    if (!promise) return;
    try {
      await promise;
    } catch {
      /* ignore */
    }
  }

  /**
   * Start SMTC subscription.
   * Returns quickly once the manager is created and the change listener is attached.
   * First snapshot is fetched in the background so the renderer never sits on "Starting…".
   */
  async function start() {
    await awaitSettled(stopPromise);

    if (started && sessionManager) return getStatus();

    await awaitSettled(startPromise);
    await awaitSettled(stopPromise);

    if (started && sessionManager) return getStatus();

    if (startPromise) {
      return startPromise;
    }

    const myRun = ++runId;

    const pending = (async () => {
      if (!isCurrentRun(myRun)) {
        return getStatus();
      }

      const pkg = loadPackage();
      if (!pkg) {
        started = false;
        broadcast([]);
        return getStatus();
      }

      const backendPath = resolveBackendExe();
      if (!backendPath) {
        started = false;
        available = Boolean(mediaSessionsPkg);
        lastError =
          'SMTC backend executable not found. Reinstall the app or set WINDOWS_MEDIA_SESSIONS_BACKEND.';
        broadcast([]);
        return getStatus();
      }

      try {
        const manager = getOrCreateManager();
        if (!manager) {
          started = false;
          broadcast([]);
          return getStatus();
        }

        if (typeof unsubscribe !== 'function') {
          unsubscribe = manager.onSessionsChanged(onSessions);
        }

        // Mark subscribed immediately — UI leaves "Starting…" as soon as IPC returns.
        started = true;
        available = true;
        lastError = null;
        broadcast(lastSessions);

        void pumpFirstSnapshot(myRun);

        return getStatus();
      } catch (err) {
        if (!isCurrentRun(myRun)) {
          return getStatus();
        }
        started = false;
        lastError = err?.message || String(err);
        available = Boolean(mediaSessionsPkg);
        await disposeManager();
        lastSessions = [];
        lastFingerprint = '';
        lastPushAt = 0;
        broadcast([]);
        return getStatus();
      }
    })();

    startPromise = pending;

    try {
      return await pending;
    } finally {
      if (startPromise === pending) {
        startPromise = null;
      }
    }
  }

  /**
   * Stop SMTC subscription.
   * Invalidates in-flight starts immediately (runId++) and disposes the manager.
   * Does **not** await startPromise — that was the toggle deadlock.
   */
  async function stop() {
    runId += 1;
    started = false;

    if (stopPromise) return stopPromise;

    stopPromise = (async () => {
      await disposeManager();
      lastSessions = [];
      lastFingerprint = '';
      lastPushAt = 0;
      lastError = null;
      broadcast([]);
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
    resolveBackendExe,
  };
}

module.exports = {
  createSystemMediaService,
};
