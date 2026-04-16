/** Max age for persisted Steam enrichment before we block with loading / show “refreshing”. */
export const GAME_HUB_ENRICHMENT_TTL_MS = 30 * 60 * 1000;

/**
 * True when we can show last persisted enrichment immediately and refresh in the background.
 * Requires non-empty enrichedGames, fresh lastSyncedAt, matching Steam id, and API enabled.
 */
export function shouldUseWarmEnrichmentCache(library, profile) {
  const enriched = library?.enrichedGames;
  if (!Array.isArray(enriched) || enriched.length === 0) return false;
  const last = library?.lastSyncedAt;
  if (typeof last !== 'number' || Number.isNaN(last)) return false;
  if (Date.now() - last > GAME_HUB_ENRICHMENT_TTL_MS) return false;
  const sid = profile?.steamId;
  if (!sid) return false;
  const lastSid = library?.lastEnrichedSteamId;
  if (lastSid && String(lastSid) !== String(sid)) return false;
  return true;
}
