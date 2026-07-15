/**
 * Cache domain registrations — every user-facing cache registers here once, at module
 * init. Import this module for its side effect (App bootstraps it); consumers then act
 * only through `cacheRegistry.js` so refresh buttons, palette commands, and the
 * Settings "Data & caches" card share one path.
 */
import { registerCacheDomain } from './cacheRegistry';
import useConsolidatedAppStore from './useConsolidatedAppStore';
import {
  clearMediaLibraryCache,
  getCacheStatus as getMediaLibraryCacheStatus,
} from './mediaLibraryCache';
import { clearSupabaseReadCache } from './supabase';
import { refreshSoundLibrary } from './soundLibraryCache';
import { clearCachedSteamClientLibrary } from './gameHub/gameHubClientLibraryCache';
import { refreshSteamEnrichmentNow } from './gameHub/gameHubEnrichmentRefresh';
import { clearAlbumArtPaletteCache } from './extractColorsFromAlbumArt';
import { clearTintedIconCache } from './iconTinting';
import { clearMp4PosterCache } from '../components/channels/hooks/useChannelMediaPreview';

const getStore = () => useConsolidatedAppStore.getState();

registerCacheDomain({
  id: 'app-library',
  label: 'Apps & games library',
  description: 'Installed apps, Steam, Epic, and Microsoft Store scans.',
  scope: 'disk',
  palette: true,
  refresh: () => getStore().appLibraryManager?.refreshAllApps?.(),
  clear: () => getStore().appLibraryManager?._clearCache?.(),
});

registerCacheDomain({
  id: 'game-enrichment',
  label: 'Steam library details',
  description: 'Playtime, artwork, and metadata for your Game Hub library.',
  scope: 'persisted',
  palette: true,
  getLastRefreshedAt: () => getStore().gameHub?.library?.lastSyncedAt ?? null,
  refresh: () => refreshSteamEnrichmentNow(),
  clear: () => {
    clearCachedSteamClientLibrary();
    // Invalidate the warm window so the next Game Hub visit refetches.
    getStore().actions.setGameHubState({ library: { lastSyncedAt: 0 } });
  },
});

registerCacheDomain({
  id: 'media-catalog',
  label: 'Media Hub catalog',
  description: 'Discover catalog, stream lists, and series metadata.',
  scope: 'persisted',
  palette: true,
  getLastRefreshedAt: () => {
    const catalogCache = getStore().mediaHub?.sources?.catalogCache || {};
    let latest = null;
    for (const entry of Object.values(catalogCache)) {
      const ts = Number(entry?.fetchedAt);
      if (Number.isFinite(ts) && ts > 0 && (latest === null || ts > latest)) latest = ts;
    }
    return latest;
  },
  clear: () => getStore().actions.clearMediaHubCatalogCaches(),
});

registerCacheDomain({
  id: 'community-content',
  label: 'Community presets & media',
  description: 'Shared presets and the community media library.',
  scope: 'session',
  palette: true,
  getLastRefreshedAt: () => getMediaLibraryCacheStatus().lastUpdated ?? null,
  clear: () => {
    clearSupabaseReadCache();
    clearMediaLibraryCache();
  },
});

registerCacheDomain({
  id: 'sound-library',
  label: 'Sound library',
  description: 'Click, hover, and background-music catalog.',
  scope: 'session',
  // Playback hot paths read this cache synchronously, so "clear" re-hydrates instead
  // of leaving a null library behind.
  refresh: () => refreshSoundLibrary(),
  clear: () => refreshSoundLibrary(),
});

registerCacheDomain({
  id: 'ambient-palette',
  label: 'Wallpaper ambient palette',
  description: 'Accent colors sampled from your wallpaper.',
  scope: 'persisted',
  clear: () => {
    const { ui, actions } = getStore();
    const ambient = ui?.ambientColor;
    if (!ambient?.cachedForUrl) return;
    // Dropping cachedForUrl makes useWallpaperAmbientColor re-extract on next pass.
    actions.setUIState({ ambientColor: { ...ambient, cachedForUrl: null } });
  },
});

registerCacheDomain({
  id: 'derived-visuals',
  label: 'Derived visuals',
  description: 'Album-art palettes, tinted icons, and video tile posters.',
  scope: 'session',
  clear: () => {
    clearAlbumArtPaletteCache();
    clearTintedIconCache();
    clearMp4PosterCache();
  },
});
