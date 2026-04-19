/**
 * Wallpaper `current` is stored as `{ url, name?, ... }`. Liked-for-cycling lists are often URL strings.
 * Normalize so UI layers (`IsolatedWallpaperBackground`, space crossfade) always get `.url`.
 *
 * @param {string | { url?: string, name?: string } | null | undefined} entry
 * @param {{ savedWallpapers?: Array<{ url?: string, name?: string }> }} [opts]
 * @returns {{ url: string, name?: string } | null}
 */
export function normalizeWallpaperForStore(entry, opts = {}) {
  if (entry == null || entry === '') return null;

  const saved = opts.savedWallpapers;
  if (typeof entry === 'string') {
    const url = entry;
    if (Array.isArray(saved) && saved.length > 0) {
      const match = saved.find((s) => s && (s.url === url || String(s.url) === url));
      if (match && typeof match === 'object' && match.url) {
        return { ...match, url: match.url };
      }
    }
    return { url };
  }

  if (typeof entry === 'object' && entry.url) {
    return entry;
  }

  return null;
}

/** Stable URL key for comparing liked entries (string or object). */
export function wallpaperEntryUrlKey(entry) {
  if (entry == null) return '';
  if (typeof entry === 'string') return entry;
  return entry.url || '';
}
