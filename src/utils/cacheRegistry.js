/**
 * Cache domain registry — single owner for user-facing "refresh / clear cache" actions.
 *
 * Each cache in the app registers a domain here (see `cacheDomains.js`). The registry
 * then powers every affordance from one path — in-place refresh buttons, command palette
 * refresh commands, and the Settings "Data & caches" card — so there are no parallel
 * refresh implementations.
 *
 * Domain contract:
 * {
 *   id: string,                    // stable id (palette command ids derive from it)
 *   label: string,                 // user-facing name
 *   description: string,           // one-liner shown in Settings
 *   scope: 'session' | 'persisted' | 'disk',
 *   palette?: boolean,             // expose as its own command palette entry
 *   getLastRefreshedAt?: () => number | null,  // preferred over registry stamp
 *   refresh?: () => void | Promise<unknown>,   // active refetch; falls back to clear()
 *   clear: () => void | Promise<unknown>,      // drop cached data (next consumer refetches)
 * }
 */

const domains = new Map();
/** Registry-side "last refreshed" stamps for domains without getLastRefreshedAt. */
const actionStamps = new Map();
const listeners = new Set();
/** Memoized list snapshot — stable reference between notifies (useSyncExternalStore contract). */
let domainsSnapshot = [];

function notify() {
  domainsSnapshot = [...domains.values()];
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore subscriber errors */
    }
  });
}

/**
 * @param {object} domain — see contract above
 * @returns {() => void} dispose
 */
export function registerCacheDomain(domain) {
  if (!domain || typeof domain.id !== 'string' || typeof domain.clear !== 'function') {
    throw new Error('cacheRegistry: domain requires an id and a clear()');
  }
  domains.set(domain.id, domain);
  notify();
  return () => {
    if (domains.get(domain.id) === domain) {
      domains.delete(domain.id);
      notify();
    }
  };
}

/** Registration order — stable snapshot reference until the registry changes. */
export function listCacheDomains() {
  return domainsSnapshot;
}

export function getCacheDomain(id) {
  return domains.get(id) ?? null;
}

/** @returns {number | null} epoch ms of the last known refresh for a domain */
export function getCacheDomainLastRefreshedAt(id) {
  const domain = domains.get(id);
  if (!domain) return null;
  if (typeof domain.getLastRefreshedAt === 'function') {
    const ts = domain.getLastRefreshedAt();
    if (Number.isFinite(ts) && ts > 0) return ts;
  }
  return actionStamps.get(id) ?? null;
}

/**
 * Actively refresh a domain (refetch when it supports it, otherwise clear so the
 * next consumer refetches). Never throws — refresh actions are best-effort UI.
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function refreshCacheDomain(id) {
  const domain = domains.get(id);
  if (!domain) return { ok: false, error: `Unknown cache domain: ${id}` };
  try {
    await (typeof domain.refresh === 'function' ? domain.refresh() : domain.clear());
    actionStamps.set(id, Date.now());
    notify();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error?.message || 'Refresh failed' };
  }
}

/** @returns {Promise<{ ok: boolean, error?: string }>} */
export async function clearCacheDomain(id) {
  const domain = domains.get(id);
  if (!domain) return { ok: false, error: `Unknown cache domain: ${id}` };
  try {
    await domain.clear();
    actionStamps.delete(id);
    notify();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error?.message || 'Clear failed' };
  }
}

/**
 * Clear every registered domain (Settings "Clear all caches" / palette action).
 * @returns {Promise<{ ok: boolean, failed: string[] }>}
 */
export async function clearAllCacheDomains() {
  const failed = [];
  for (const domain of domains.values()) {
    try {
      await domain.clear();
      actionStamps.delete(domain.id);
    } catch {
      failed.push(domain.id);
    }
  }
  notify();
  return { ok: failed.length === 0, failed };
}

/** Subscribe to registry changes (registration + refresh/clear stamps). */
export function subscribeCacheDomains(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
