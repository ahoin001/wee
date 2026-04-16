/**
 * Steam app IDs that are tools/redistributables, not games — hide from library UI.
 * 228980 = Steamworks Common Redistributables (VC++ runtimes, etc.)
 * Keep in sync with main/services/game-source-service.cjs (STEAM_TOOL_APP_IDS).
 */
export const STEAM_TOOL_APP_IDS = new Set(['228980']);

export function filterSteamToolEntries(games) {
  if (!Array.isArray(games)) return [];
  return games.filter((g) => {
    const id = String(g.appId ?? g.appid ?? '').trim();
    if (!id) return true;
    return !STEAM_TOOL_APP_IDS.has(id);
  });
}
