// Utility to deduplicate by appid
export function dedupeByAppId(games) {
  const seen = new Set();
  return games.filter(g => {
    if (seen.has(g.appid)) return false;
    seen.add(g.appid);
    return true;
  });
}

// Utility to deduplicate by key
export function dedupeByKey(games, key) {
  const seen = new Set();
  return games.filter(g => {
    if (seen.has(g[key])) return false;
    seen.add(g[key]);
    return true;
  });
} 