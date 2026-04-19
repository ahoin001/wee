/**
 * Path helpers for Media Hub local library (renderer-safe, no Node path module).
 */

export function normalizePathSlashes(p) {
  if (!p || typeof p !== 'string') return '';
  return p.replace(/\\/g, '/').replace(/\/+$/, '');
}

export function getParentDirNormalized(filePath) {
  const n = normalizePathSlashes(filePath);
  const i = n.lastIndexOf('/');
  if (i <= 0) return n;
  return n.slice(0, i);
}

/**
 * Relative path from library root to the file's parent directory.
 * `__root__` = file sits directly under the library root.
 */
export function relativeParentKeyFromRoot(rootPath, filePath) {
  const root = normalizePathSlashes(rootPath);
  const parent = getParentDirNormalized(filePath);
  if (!root || !parent) return '__root__';
  const rl = root.toLowerCase();
  const pl = parent.toLowerCase();
  if (pl === rl) return '__root__';
  const prefix = `${rl}/`;
  if (!pl.startsWith(prefix)) return '__root__';
  const rel = parent.slice(root.length).replace(/^\/+/, '');
  return rel || '__root__';
}

export function folderGroupTitle(relKey, rootDisplayName) {
  if (relKey === '__root__') {
    return rootDisplayName ? `In ${rootDisplayName}` : 'In this folder';
  }
  const parts = relKey.split('/').filter(Boolean);
  return parts[parts.length - 1] || relKey;
}

export function folderGroupSubtitle(relKey) {
  if (relKey === '__root__') return '';
  const parts = relKey.split('/').filter(Boolean);
  if (parts.length <= 1) return '';
  return parts.slice(0, -1).join(' / ');
}

/**
 * @param {string} rootPath
 * @param {Array<{ path?: string, name?: string }>} files
 * @returns {{ key: string, title: string, subtitle: string, files: typeof files }[]}
 */
export function groupLocalFilesByFolder(rootPath, files) {
  const rootNorm = normalizePathSlashes(rootPath);
  const segments = rootNorm.split('/').filter(Boolean);
  const rootDisplayName = segments.length ? segments[segments.length - 1] : 'Library';

  const map = new Map();
  for (const file of files) {
    if (!file?.path) continue;
    const key = relativeParentKeyFromRoot(rootPath, file.path);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(file);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' }));
  }
  const keys = [...map.keys()].sort((a, b) => {
    if (a === '__root__') return -1;
    if (b === '__root__') return 1;
    return a.localeCompare(b, undefined, { sensitivity: 'base' });
  });
  return keys.map((key) => ({
    key,
    title: folderGroupTitle(key, rootDisplayName),
    subtitle: folderGroupSubtitle(key),
    files: map.get(key) || [],
  }));
}
