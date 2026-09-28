/**
 * Serialize heavy filesystem / shell scans so concurrent IPC calls do not peak disk/CPU together.
 * Only real scans queue here — cache hits bypass the chain via `runCacheFirst`.
 */

let chain = Promise.resolve();

function runExclusive(fn) {
  const next = chain.then(() => fn());
  chain = next.catch(() => {});
  return next;
}

/**
 * Return `peek()` immediately when it yields a value; otherwise queue `fn` behind other scans.
 * @template T
 * @param {() => T | null | undefined} peek
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
function runCacheFirst(peek, fn) {
  try {
    const hit = typeof peek === 'function' ? peek() : null;
    if (hit != null) return Promise.resolve(hit);
  } catch {
    /* fall through to a real scan */
  }
  return runExclusive(fn);
}

module.exports = {
  runExclusive,
  runCacheFirst,
};
