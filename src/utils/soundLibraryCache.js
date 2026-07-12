/**
 * In-memory sound library cache — single hydrate path for playback hot paths.
 * Catalog SOT remains savedSounds.json via api.sounds.*; this avoids IPC on every hover/click.
 */

let library = null;
let hydratePromise = null;
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => {
    try {
      fn(library);
    } catch {
      /* ignore subscriber errors */
    }
  });
}

export function getSoundLibrarySync() {
  return library;
}

export function subscribeSoundLibrary(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function hydrateSoundLibrary({ force = false } = {}) {
  if (!force && library) return library;
  if (!force && hydratePromise) return hydratePromise;

  hydratePromise = (async () => {
    try {
      if (!window.api?.sounds?.getLibrary) {
        library = library || {
          backgroundMusic: [],
          channelClick: [],
          channelHover: [],
        };
        return library;
      }
      const next = await window.api.sounds.getLibrary();
      library = sanitizeLibrary(next);
      notify();
      return library;
    } catch {
      library = library || {
        backgroundMusic: [],
        channelClick: [],
        channelHover: [],
      };
      return library;
    } finally {
      hydratePromise = null;
    }
  })();

  return hydratePromise;
}

function sanitizeLibrary(raw) {
  const base = {
    backgroundMusic: [],
    channelClick: [],
    channelHover: [],
  };
  if (!raw || typeof raw !== 'object') return base;
  for (const key of Object.keys(base)) {
    if (Array.isArray(raw[key])) base[key] = raw[key];
  }
  return base;
}

/** Replace cache after a successful library mutation (add/remove/update/reorder). */
export function setSoundLibraryCache(next) {
  library = sanitizeLibrary(next);
  notify();
  return library;
}

export async function refreshSoundLibrary() {
  return hydrateSoundLibrary({ force: true });
}

export function findEnabledSound(category) {
  const lib = getSoundLibrarySync();
  if (!lib?.[category]) return null;
  return lib[category].find((s) => s.enabled) || null;
}

export function getEnabledBackgroundTracks() {
  const lib = getSoundLibrarySync();
  const tracks = Array.isArray(lib?.backgroundMusic) ? lib.backgroundMusic : [];
  return tracks.filter((s) => s.enabled);
}
