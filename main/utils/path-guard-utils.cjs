const path = require('path');

function normalizeRelativePath(input) {
  if (typeof input !== 'string') {
    throw new Error('Path must be a string');
  }
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Path cannot be empty');
  }
  const normalized = trimmed.replace(/\\/g, '/');
  const segments = normalized.split('/').filter(Boolean);
  if (segments.length === 0) {
    throw new Error('Path cannot be empty');
  }
  if (segments.some((segment) => segment === '.' || segment === '..')) {
    throw new Error('Path traversal is not allowed');
  }
  return path.join(...segments);
}

function resolvePathInsideRoot(rootPath, unsafeRelativePath) {
  const rootResolved = path.resolve(rootPath);
  const relativePath = normalizeRelativePath(unsafeRelativePath);
  const resolved = path.resolve(rootResolved, relativePath);
  if (resolved !== rootResolved && !resolved.startsWith(`${rootResolved}${path.sep}`)) {
    throw new Error('Resolved path is outside allowed root');
  }
  return resolved;
}

function relativeFromPrefixedUrl(urlValue, prefix) {
  if (typeof urlValue !== 'string' || !urlValue.startsWith(prefix)) {
    throw new Error('Invalid URL prefix');
  }
  return normalizeRelativePath(urlValue.slice(prefix.length));
}

module.exports = {
  normalizeRelativePath,
  resolvePathInsideRoot,
  relativeFromPrefixedUrl,
};
