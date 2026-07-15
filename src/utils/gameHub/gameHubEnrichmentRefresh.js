import useConsolidatedAppStore from '../useConsolidatedAppStore';

/**
 * Force-refresh Steam library enrichment now — the one manual-refresh path shared by
 * the Game Hub refresh button and the cache registry. Passive freshness gating lives
 * in GameHubSpace's hydrate effect (`shouldUseWarmEnrichmentCache`).
 */
export async function refreshSteamEnrichmentNow() {
  const store = useConsolidatedAppStore.getState();
  const gameHub = store.gameHub || {};
  const setGameHubState = store.actions.setGameHubState;
  const steamId = gameHub.profile?.steamId;
  const useSteamWebApi = gameHub.profile?.useSteamWebApi !== false;

  if (!steamId || !useSteamWebApi || !window.api?.steam?.getEnrichedGames) {
    // Nothing to fetch — invalidate so the next eligible hub visit refetches.
    setGameHubState({ library: { lastSyncedAt: 0 } });
    return { ok: false, reason: 'unavailable' };
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
    setGameHubState({
      library: {
        enrichedGames,
        lastSyncedAt: Date.now(),
        syncStatus: hasError ? 'error' : 'ready',
        statusReason: enriched?.statusReason || enriched?.error || '',
        lastError: hasError ? enriched.error : null,
        lastEnrichedSteamId: steamId,
      },
    });
    return { ok: !hasError };
  } catch (error) {
    setGameHubState({
      library: {
        syncStatus: 'error',
        statusReason: 'Network or API request failed.',
        lastError: error?.message || 'Failed to sync library',
      },
    });
    return { ok: false, reason: 'network' };
  }
}
