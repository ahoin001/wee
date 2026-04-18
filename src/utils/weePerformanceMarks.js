/**
 * Dev-only Performance API marks for tuning hot paths (settings tabs, channel paging, Game Hub).
 * No-ops in production to avoid measurement overhead.
 */

const DEV = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

function safeMark(name) {
  if (!DEV || typeof performance === 'undefined' || typeof performance.mark !== 'function') return;
  try {
    performance.mark(name);
  } catch {
    /* ignore duplicate mark names in StrictMode double-mount */
  }
}

function safeMeasure(name, start, end) {
  if (!DEV || typeof performance === 'undefined' || typeof performance.measure !== 'function') return;
  try {
    performance.measure(name, start, end);
  } catch {
    /* missing marks */
  }
}

/**
 * Bracket an async/sync operation with measure (dev only).
 * @param {string} label
 * @param {() => Promise<unknown> | unknown} fn
 */
export async function weeMeasureAsync(label, fn) {
  if (!DEV) return fn();
  const start = `wee:${label}:start`;
  const end = `wee:${label}:end`;
  safeMark(start);
  try {
    const out = await fn();
    safeMark(end);
    safeMeasure(`wee:${label}`, start, end);
    return out;
  } catch (e) {
    safeMark(end);
    throw e;
  }
}

/** Settings modal switched tab (rail id). */
export function weeMarkSettingsTab(tabId) {
  if (!DEV) return;
  const name = `wee:settings-tab:${tabId}`;
  safeMark(name);
  if (typeof console !== 'undefined' && console.debug) {
    console.debug('[perf] settings tab', tabId);
  }
}

/** Wii channel grid page index changed. */
export function weeMarkChannelPage(pageIndex) {
  if (!DEV) return;
  safeMark(`wee:channels-page:${pageIndex}`);
}

/** Game Hub library rendered with this many games (sampled). */
export function weeMarkGameHubLibrary(gameCount) {
  if (!DEV) return;
  safeMark(`wee:gamehub-library:${gameCount}`);
}
