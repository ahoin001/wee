/**
 * One IntersectionObserver per (threshold, rootMargin) option set, shared by every
 * subscriber — a page of tiles costs one observer instead of one per tile.
 * Observers disconnect when their last target unsubscribes.
 */
const pools = new Map();

function getPool(threshold, rootMargin) {
  const key = `${threshold}|${rootMargin}`;
  let pool = pools.get(key);
  if (pool) return pool;

  const callbacks = new Map();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        callbacks.get(entry.target)?.(entry.isIntersecting, entry);
      }
    },
    { threshold, rootMargin }
  );
  pool = { key, observer, callbacks };
  pools.set(key, pool);
  return pool;
}

/**
 * @param {Element} element
 * @param {(isIntersecting: boolean, entry: IntersectionObserverEntry) => void} callback
 * @param {{ threshold?: number, rootMargin?: string }} [options]
 * @returns {() => void} unsubscribe
 */
export function observeIntersection(element, callback, { threshold = 0, rootMargin = '0px' } = {}) {
  if (!element || typeof IntersectionObserver === 'undefined') {
    callback(true);
    return () => {};
  }

  const pool = getPool(threshold, rootMargin);
  pool.callbacks.set(element, callback);
  pool.observer.observe(element);

  return () => {
    pool.observer.unobserve(element);
    pool.callbacks.delete(element);
    if (pool.callbacks.size === 0) {
      pool.observer.disconnect();
      pools.delete(pool.key);
    }
  };
}
