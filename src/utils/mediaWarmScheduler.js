/**
 * Coalesces startup + post-prefetch image warms into one idle flush (high-priority URLs first).
 */

import { warmImageUrlsOnIdle } from './mediaWarmCache.js';

const pendingHigh = [];
const pendingNormal = [];
let capHigh = 0;
let capNormal = 0;
let pendingChunkSize = 6;
let flushScheduled = false;

function dedupeMerge(arr) {
  const seen = new Set();
  const out = [];
  for (const u of arr) {
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

function flush() {
  flushScheduled = false;
  const high = dedupeMerge(pendingHigh).slice(0, capHigh || 24);
  const normal = dedupeMerge(pendingNormal).slice(0, capNormal || 48);
  pendingHigh.length = 0;
  pendingNormal.length = 0;
  capHigh = 0;
  capNormal = 0;

  const seen = new Set(high);
  const merged = [...high];
  for (const u of normal) {
    if (!seen.has(u)) {
      seen.add(u);
      merged.push(u);
    }
  }
  if (merged.length === 0) return;
  warmImageUrlsOnIdle(merged, { max: merged.length, chunkSize: pendingChunkSize });
}

/**
 * @param {{ urls: string[], max?: number, chunkSize?: number, tier?: 'high' | 'normal' }} opts
 */
export function scheduleMediaWarmPass(opts) {
  if (typeof window === 'undefined' || !opts || !Array.isArray(opts.urls) || opts.urls.length === 0) {
    return;
  }
  const tier = opts.tier === 'high' ? 'high' : 'normal';
  const max = opts.max ?? 48;
  if (opts.chunkSize != null) {
    pendingChunkSize = Math.max(1, opts.chunkSize);
  }

  if (tier === 'high') {
    pendingHigh.push(...opts.urls);
    capHigh = Math.max(capHigh, max);
  } else {
    pendingNormal.push(...opts.urls);
    capNormal = Math.max(capNormal, max);
  }

  if (flushScheduled) return;
  flushScheduled = true;

  const run = () => flush();
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: 15000 });
  } else {
    window.setTimeout(run, 400);
  }
}
