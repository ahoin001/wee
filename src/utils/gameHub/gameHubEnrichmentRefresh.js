import useConsolidatedAppStore from '../useConsolidatedAppStore';

/**
 * Force-refresh Steam library enrichment now — the one manual-refresh path shared by
 * the Game Hub refresh button and the cache registry. Passive freshness gating lives
 * in GameHubSpace's hydrate effect (`shouldUseWarmEnrichmentCache`).
 *
 * @returns {Promise<{
 *   ok: boolean,
 *   reason?: 'unavailable' | 'network' | 'api',
 *   unavailableCause?: 'missing-steam-id' | 'api-disabled' | 'api-bridge-missing',
 *   statusCode?: string | null,
 *   statusReason?: string | null,
 *   lastError?: string | null,
 * }>}
 */
export async function refreshSteamEnrichmentNow() {
  const store = useConsolidatedAppStore.getState();
  const gameHub = store.gameHub || {};
  const setGameHubState = store.actions.setGameHubState;
  const steamId = gameHub.profile?.steamId;
  const useSteamWebApi = gameHub.profile?.useSteamWebApi !== false;
  const hasBridge = Boolean(window.api?.steam?.getEnrichedGames);

  if (!steamId || !useSteamWebApi || !hasBridge) {
    // Nothing to fetch — invalidate so the next eligible hub visit refetches.
    setGameHubState({ library: { lastSyncedAt: 0 } });
    let unavailableCause = 'api-bridge-missing';
    if (!steamId) unavailableCause = 'missing-steam-id';
    else if (!useSteamWebApi) unavailableCause = 'api-disabled';
    return { ok: false, reason: 'unavailable', unavailableCause };
  }

  setGameHubState({
    library: {
      syncStatus: 'refreshing',
      statusReason: 'Refreshing Steam library…',
      lastError: null,
    },
  });

  try {
    const enriched = await window.api.steam.getEnrichedGames({ steamId });
    const enrichedGames = Array.isArray(enriched?.games) ? enriched.games : [];
    const hasError = Boolean(enriched?.error);
    const statusReason = enriched?.statusReason || enriched?.error || '';
    const lastError = hasError ? enriched.error || statusReason : null;
    setGameHubState({
      library: {
        enrichedGames,
        lastSyncedAt: Date.now(),
        syncStatus: hasError ? 'error' : 'ready',
        statusReason,
        lastError,
        lastEnrichedSteamId: steamId,
      },
    });
    return {
      ok: !hasError,
      reason: hasError ? 'api' : undefined,
      statusCode: enriched?.statusCode || null,
      statusReason: statusReason || null,
      lastError,
    };
  } catch (error) {
    const lastError = error?.message || 'Failed to sync library';
    const statusReason = 'Network or API request failed.';
    setGameHubState({
      library: {
        syncStatus: 'error',
        statusReason,
        lastError,
      },
    });
    return { ok: false, reason: 'network', statusReason, lastError };
  }
}
