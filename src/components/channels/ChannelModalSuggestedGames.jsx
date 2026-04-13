import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import Card from '../../ui/Card';
import Text from '../../ui/Text';
import WButton from '../../ui/WButton';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { getAllMatchingMedia } from '../../utils/mediaLibraryCache';
import { getStoragePublicObjectUrl } from '../../utils/supabase';
import {
  EPIC_SUGGESTED_BADGE_BG,
  PC_APP_SUGGESTED_BADGE_BG,
  STEAM_SUGGESTED_BADGE_BG,
} from '../../design/suggestedGameBadgeColors.js';
import { buildLaunchPathFromSelectedApp } from '../../utils/channelModalFindMatchingApp';
import { resolveMimeTypeFromMediaLibraryRow } from '../../utils/channelMediaType';

const GAMES_PER_PAGE = 6;

/** Suggested list source filter: store games (Steam+Epic) vs PC Start Menu apps */
const SOURCE_FILTER = {
  ALL: 'all',
  GAMES: 'games',
  APPS: 'apps',
};

/** Carousel + media-library row id */
function getSuggestedCarouselKey(game) {
  if (game.source === 'steam') return `steam-${game.appId}`;
  if (game.source === 'epic') return `epic-${String(game.appName || game.id)}`;
  return `exe-${String(game.id || game.path || game.name)}`;
}

/** Avoid duplicate tiles when the same title exists on Steam/Epic and Start Menu */
function dedupeInstalledAgainstStores(installed, steamList, epicList) {
  const steamNames = new Set(
    (steamList || []).map((g) => g.name?.toLowerCase().trim()).filter(Boolean)
  );
  const epicNames = new Set(
    (epicList || []).map((g) => g.name?.toLowerCase().trim()).filter(Boolean)
  );
  const seenPath = new Set();
  return (installed || []).filter((app) => {
    if (!app?.name || !app?.path) return false;
    const n = app.name.toLowerCase().trim();
    if (steamNames.has(n) || epicNames.has(n)) return false;
    const p = String(app.path).toLowerCase();
    if (seenPath.has(p)) return false;
    seenPath.add(p);
    return true;
  });
}

function filterGames(games, searchTerm) {
  if (!searchTerm.trim()) return games;
  const term = searchTerm.toLowerCase();
  return games.filter((game) => game.name.toLowerCase().includes(term));
}

function sortGames(games, order) {
  return [...games].sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    if (order === 'asc') {
      return nameA.localeCompare(nameB);
    }
    return nameB.localeCompare(nameA);
  });
}

function paginateGames(games, page, perPage) {
  const startIndex = page * perPage;
  return games.slice(startIndex, startIndex + perPage);
}

export default function ChannelModalSuggestedGames({
  isOpen,
  path,
  setPath,
  setType,
  setMedia,
  installedApps,
  appsLoading,
  appsError,
  steamGames,
  epicGames,
  steamLoading,
  epicLoading,
  steamError,
  epicError,
  rescanInstalledApps,
  rescanSteamGames,
  rescanEpicGames,
}) {
  const [gamesSearchTerm, setGamesSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState(SOURCE_FILTER.ALL);
  const [gamesPage, setGamesPage] = useState(0);
  const [sortOrder, setSortOrder] = useState('asc');
  const [gamesSectionExpanded, setGamesSectionExpanded] = useState(true);
  /** Index into getAllMatchingMedia() per suggested row (Steam, Epic, PC) */
  const [libraryMediaIndexes, setLibraryMediaIndexes] = useState({});
  const [selectedGameFeedback, setSelectedGameFeedback] = useState(null);

  const showSelectionFeedback = useCallback((gameName, launcher) => {
    setSelectedGameFeedback({
      gameName,
      message: `Added to channel from ${launcher}`,
      timestamp: Date.now(),
    });
    setTimeout(() => setSelectedGameFeedback(null), 3000);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSelectedGameFeedback(null);
      setSourceFilter(SOURCE_FILTER.ALL);
      setGamesSearchTerm('');
      setGamesPage(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setGamesPage(0);
  }, [sourceFilter]);

  const realSteamGames = steamGames || [];
  const realEpicGames = epicGames || [];
  const realInstalledApps = installedApps || [];

  useEffect(() => {
    if (!import.meta.env.DEV || !isOpen) return;
    const steamGameNames = realSteamGames.map((g) => g.name);
    const steamGameAppIds = realSteamGames.map((g) => g.appId);
    const duplicateNames = steamGameNames.filter((name, index) => steamGameNames.indexOf(name) !== index);
    const duplicateAppIds = steamGameAppIds.filter((appId, index) => steamGameAppIds.indexOf(appId) !== index);
    if (duplicateNames.length > 0) {
      console.warn('[ChannelModalSuggestedGames] Duplicate Steam game names:', duplicateNames);
    }
    if (duplicateAppIds.length > 0) {
      console.warn('[ChannelModalSuggestedGames] Duplicate Steam app IDs:', duplicateAppIds);
    }
  }, [isOpen, realSteamGames]);

  const { allGames, sortedGames, paginatedGames, totalGamesPages, filterCounts } = useMemo(() => {
    const uniqueSteamGames = realSteamGames.filter(
      (game, index, self) => index === self.findIndex((g) => g.appId === game.appId)
    );
    const installedSteamGames = uniqueSteamGames.filter((game) => game.installed !== false);
    const installedEpicGames = realEpicGames.filter((game) => game.installed !== false);
    const pcApps = dedupeInstalledAgainstStores(realInstalledApps, installedSteamGames, installedEpicGames);
    const combined = [
      ...installedSteamGames.map((game) => ({
        ...game,
        source: 'steam',
        sourceName: 'Steam',
        badgeColor: STEAM_SUGGESTED_BADGE_BG,
        badgeText: 'S',
      })),
      ...installedEpicGames.map((game) => ({
        ...game,
        source: 'epic',
        sourceName: 'Epic Games',
        badgeColor: EPIC_SUGGESTED_BADGE_BG,
        badgeText: 'E',
      })),
      ...pcApps.map((app) => ({
        ...app,
        source: 'exe',
        sourceName: 'PC App',
        badgeColor: PC_APP_SUGGESTED_BADGE_BG,
        badgeText: 'PC',
      })),
    ];

    const countGames = installedSteamGames.length + installedEpicGames.length;
    const countApps = pcApps.length;
    const filterCounts = {
      all: combined.length,
      games: countGames,
      apps: countApps,
    };

    let bySource = combined;
    if (sourceFilter === SOURCE_FILTER.GAMES) {
      bySource = combined.filter((g) => g.source === 'steam' || g.source === 'epic');
    } else if (sourceFilter === SOURCE_FILTER.APPS) {
      bySource = combined.filter((g) => g.source === 'exe');
    }

    const filteredGames = filterGames(bySource, gamesSearchTerm);
    const sorted = sortGames(filteredGames, sortOrder);
    const paginated = paginateGames(sorted, gamesPage, GAMES_PER_PAGE);
    const totalPages = Math.ceil(sorted.length / GAMES_PER_PAGE);
    return {
      allGames: combined,
      filterCounts,
      sortedGames: sorted,
      paginatedGames: paginated,
      totalGamesPages: totalPages,
    };
  }, [
    realSteamGames,
    realEpicGames,
    realInstalledApps,
    sourceFilter,
    gamesSearchTerm,
    sortOrder,
    gamesPage,
  ]);

  if (!isOpen) {
    return null;
  }

  return (
  <Card 
    title="Suggested Content" 
    separator 
    desc="Quickly add your installed games and apps to this channel. Click any item to auto-fill the path and add its cover art."
  >


    {/* Loading State */}
    {(steamLoading || epicLoading || appsLoading) && (
      <div className="text-center py-8">
        <div className="text-[hsl(var(--text-tertiary))] text-sm">
          <div className="mb-2">⏳</div>
          <div className="font-medium mb-1">
            {steamLoading && epicLoading && appsLoading
              ? 'Scanning games and apps...'
              : appsLoading && !steamLoading && !epicLoading
                ? 'Scanning installed apps...'
              : steamLoading && epicLoading ? 'Scanning games...' :
             steamLoading ? 'Scanning Steam games...' : 
             epicLoading ? 'Scanning Epic games...' : 'Scanning...'}
          </div>
          <div className="text-xs">
            This may take a few moments.
          </div>
        </div>
      </div>
    )}

    {/* Error State */}
    {(steamError || epicError || appsError) && (
      <div className="text-center py-4">
        <div className="text-[hsl(var(--state-error))] text-sm">
          <div className="mb-2">⚠️</div>
          <div className="font-medium mb-1">Some sources could not be scanned</div>
          <div className="text-xs">
            {steamError && <span className="block">Steam: {steamError}</span>}
            {epicError && <span className="block">Epic: {epicError}</span>}
            {appsError && <span className="block">Installed apps: {appsError}</span>}
          </div>
        </div>
      </div>
    )}

    {/* Games Content — show whenever any source produced rows; errors are non-blocking */}
    {!steamLoading && !epicLoading && !appsLoading && allGames.length > 0 && (
      <>
        {/* Unified Games Section */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setGamesSectionExpanded(!gamesSectionExpanded)}
            className="flex items-center gap-2 hover:bg-[hsl(var(--surface-secondary))] px-2 py-1 rounded transition-colors"
          >
            <div className="w-6 h-6 bg-[hsl(var(--primary))] rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">🎮</span>
            </div>
            <Text size="sm" weight={600} className="text-[hsl(var(--text-primary))]">
              Suggested
              {sourceFilter === SOURCE_FILTER.GAMES && ' · Games only'}
              {sourceFilter === SOURCE_FILTER.APPS && ' · PC apps only'}
              {' '}
              ({sortedGames.length}
              {gamesSearchTerm.trim() ? ` match${sortedGames.length !== 1 ? 'es' : ''}` : ` of ${allGames.length}`})
            </Text>
            <span className={`text-[hsl(var(--text-tertiary))] transition-transform duration-200 ${gamesSectionExpanded ? 'rotate-90' : ''}`}>
              ›
            </span>
          </button>
          
          {/* Sort Controls */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors hover:bg-[hsl(var(--surface-secondary))]"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              <span className="text-[hsl(var(--text-secondary))]">Sort:</span>
              <span className="text-[hsl(var(--text-primary))]">
                {sortOrder === 'asc' ? 'A→Z' : 'Z→A'}
              </span>
              <span className="text-[hsl(var(--text-tertiary))]">
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            </button>
            
            <WButton
              variant="secondary"
              size="sm"
              onClick={() => {
                rescanSteamGames();
                rescanEpicGames();
                if (typeof rescanInstalledApps === 'function') rescanInstalledApps();
              }}
              disabled={steamLoading || epicLoading || appsLoading}
            >
              {(steamLoading || epicLoading || appsLoading) ? 'Scanning...' : 'Refresh'}
            </WButton>
          </div>
        </div>
        
        {/* Games Content */}
        {gamesSectionExpanded && (
          <>
            {/* Source filter: games (stores) vs PC apps */}
            <div
              className="mb-3 flex flex-wrap gap-2"
              role="group"
              aria-label="Filter suggested items by source"
            >
              {[
                { key: SOURCE_FILTER.ALL, label: 'All', count: filterCounts.all },
                { key: SOURCE_FILTER.GAMES, label: 'Games', sub: 'Steam & Epic', count: filterCounts.games },
                { key: SOURCE_FILTER.APPS, label: 'PC apps', sub: 'Start Menu', count: filterCounts.apps },
              ].map(({ key, label, sub, count }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSourceFilter(key)}
                  title={sub ? `${label}: ${sub}` : label}
                  className={`inline-flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors ${
                    sourceFilter === key
                      ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--text-on-accent))] shadow-sm'
                      : 'border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))] text-[hsl(var(--text-primary))] hover:border-[hsl(var(--primary))]'
                  }`}
                >
                  <span className="text-xs font-semibold leading-tight">
                    {label}{' '}
                    <span className={sourceFilter === key ? 'opacity-95' : 'text-[hsl(var(--text-secondary))]'}>
                      ({count})
                    </span>
                  </span>
                  {sub && (
                    <span
                      className={`mt-0.5 text-[10px] leading-tight ${
                        sourceFilter === key ? 'opacity-90' : 'text-[hsl(var(--text-tertiary))]'
                      }`}
                    >
                      {sub}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Games Search */}
            <div className="mb-3">
              <input
                type="text"
                placeholder={
                  sourceFilter === SOURCE_FILTER.APPS
                    ? 'Search PC apps…'
                    : sourceFilter === SOURCE_FILTER.GAMES
                      ? 'Search Steam & Epic games…'
                      : 'Search games and apps…'
                }
                value={gamesSearchTerm}
                onChange={(e) => {
                  setGamesSearchTerm(e.target.value);
                  setGamesPage(0); // Reset to first page when searching
                }}
                className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-primary))] text-[hsl(var(--text-primary))] placeholder-[hsl(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
              />
            </div>

            {sortedGames.length === 0 && allGames.length > 0 && (
              <div className="mb-4 rounded-lg border border-dashed border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))] px-4 py-6 text-center">
                <Text size="sm" className="text-[hsl(var(--text-secondary))]">
                  No items match this filter or search. Try another tab, clear the search, or choose All.
                </Text>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <WButton variant="secondary" size="sm" onClick={() => setGamesSearchTerm('')}>
                    Clear search
                  </WButton>
                  <WButton variant="secondary" size="sm" onClick={() => setSourceFilter(SOURCE_FILTER.ALL)}>
                    Show all
                  </WButton>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {paginatedGames.map((game, index) => (
                <div
                  key={getSuggestedCarouselKey(game)}
                  onClick={() => {
                    try {
                      if (game.source === 'steam') {
                        const gameId = game.appId;
                        if (!gameId) {
                          console.error('[ChannelModalSuggestedGames] No valid Steam app ID for game:', game.name);
                          return;
                        }
                        const carouselKey = getSuggestedCarouselKey(game);
                        const allMatchingMedia = getAllMatchingMedia(game.name);
                        const currentIndex = libraryMediaIndexes[carouselKey] || 0;
                        let selectedMedia = null;
                        let coverUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${gameId}/header.jpg`;
                        if (allMatchingMedia.length > 0) {
                          selectedMedia = allMatchingMedia[currentIndex] || allMatchingMedia[0];
                          coverUrl = getStoragePublicObjectUrl('media-library', selectedMedia.file_url);
                        }
                        const steamApp = {
                          id: `steam-${gameId}`,
                          name: game.name,
                          type: 'steam',
                          appId: gameId,
                          path: `steam://rungameid/${gameId}`,
                          icon: coverUrl,
                          source: 'steam',
                          category: 'Steam Game',
                          installed: game.installed,
                          sizeOnDisk: game.sizeOnDisk
                        };
                        useConsolidatedAppStore.getState().unifiedAppManager.setSelectedApp(steamApp);
                        setType('steam');
                        setPath(`steam://rungameid/${gameId}`);
                        setMedia({
                          url: coverUrl,
                          type: selectedMedia ? resolveMimeTypeFromMediaLibraryRow(selectedMedia) : 'image/jpeg',
                          name: `${game.name} Cover`,
                          isSteamGame: true,
                          steamAppId: gameId
                        });
                        showSelectionFeedback(game.name, 'Steam');
                      } else if (game.source === 'epic') {
                        setType('epic');
                        const allMatchingMedia = getAllMatchingMedia(game.name);
                        const carouselKey = getSuggestedCarouselKey(game);
                        const currentIndex = libraryMediaIndexes[carouselKey] || 0;
                        
                        // Determine which media to show (matching media or fallback)
                        let currentMedia = null;
                        let coverUrl = '';
                        if (allMatchingMedia.length > 0) {
                          // Use the current index from carousel
                          currentMedia = allMatchingMedia[currentIndex];
                          coverUrl = getStoragePublicObjectUrl('media-library', currentMedia.file_url);
                        } else {
                          // Fallback to Epic CDN
                          coverUrl = game.image || `https://cdn2.unrealengine.com/${game.appName || game.id}-1200x630-${game.appName || game.id}.jpg`;
                        }
                        
                        // Create Epic app object
                        const epicApp = {
                          id: `epic-${game.appName || game.id}`,
                          name: game.name,
                          type: 'epic',
                          appName: game.appName || game.id,
                          path: `com.epicgames.launcher://apps/${game.appName || game.id}?action=launch&silent=true`,
                          icon: coverUrl,
                          source: 'epic',
                          category: 'Epic Game'
                        };
                        
                        // console.log('[ChannelModal] Created epicApp:', epicApp);
                        
                        // Set the selected app in the unified store
                        useConsolidatedAppStore.getState().unifiedAppManager.setSelectedApp(epicApp);

                        setPath(epicApp.path);

                        // Set the game's cover art as the channel image
                        // Use the currently selected media from carousel, or fallback to first match
                        const selectedMedia = currentMedia || (allMatchingMedia.length > 0 ? allMatchingMedia[0] : null);
                        const finalCoverUrl = selectedMedia 
                          ? getStoragePublicObjectUrl('media-library', selectedMedia.file_url)
                          : coverUrl;
                        
                        // console.log(`[ChannelModal] Setting media for ${game.name}:`, {
                        //   selectedMedia: selectedMedia ? selectedMedia.title : 'None',
                        //   fileType: selectedMedia ? selectedMedia.file_type : 'fallback',
                        //   finalCoverUrl,
                        //   carouselIndex: currentIndex
                        // });
                        
                        setMedia({
                          url: finalCoverUrl,
                          type: selectedMedia ? resolveMimeTypeFromMediaLibraryRow(selectedMedia) : 'image/jpeg',
                          name: `${game.name} Cover`,
                          isEpicGame: true,
                          epicAppName: game.appName || game.id
                        });
                        
                        // Show selection feedback
                        showSelectionFeedback(game.name, 'Epic Games');
                      } else if (game.source === 'exe') {
                        const carouselKey = getSuggestedCarouselKey(game);
                        const allMatchingMedia = getAllMatchingMedia(game.name);
                        const currentIndex = libraryMediaIndexes[carouselKey] || 0;
                        let selectedMedia = null;
                        let coverUrl = '';
                        let mediaType = 'image/png';
                        if (allMatchingMedia.length > 0) {
                          selectedMedia = allMatchingMedia[currentIndex] || allMatchingMedia[0];
                          coverUrl = getStoragePublicObjectUrl('media-library', selectedMedia.file_url);
                          mediaType = resolveMimeTypeFromMediaLibraryRow(selectedMedia);
                        } else if (game.icon) {
                          coverUrl = game.icon;
                        } else {
                          coverUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI0IiBmaWxsPSIjMzQzNDM0Ii8+PHBhdGggZD0iTTEyIDEySDI4VjI4SDEyVjEyWiIgZmlsbD0iIzY2NjY2NiIvPjwvc3ZnPg==';
                        }
                        const exeArgs = typeof game.args === 'string' ? game.args.trim() : '';
                        const exeApp = {
                          id: game.id || `exe-${game.path}`,
                          name: game.name,
                          type: 'exe',
                          path: game.path,
                          args: exeArgs,
                          icon: coverUrl,
                          source: 'exe',
                          category: 'Installed App',
                        };
                        useConsolidatedAppStore.getState().unifiedAppManager.setSelectedApp(exeApp);
                        setType('exe');
                        setPath(buildLaunchPathFromSelectedApp(exeApp));
                        setMedia({
                          url: coverUrl,
                          type: selectedMedia ? resolveMimeTypeFromMediaLibraryRow(selectedMedia) : mediaType,
                          name: `${game.name}`,
                          isInstalledApp: true,
                        });
                        showSelectionFeedback(game.name, 'This PC');
                      }
                    } catch (error) {
                      console.error('[ChannelModalSuggestedGames] Error in game click handler:', error);
                    }
                  }}
                  title={`Replace current channel with ${game.name}`}
                  className="group relative flex flex-col items-center p-3 rounded-lg border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-primary))] hover:bg-[hsl(var(--surface-secondary))] hover:border-[hsl(var(--border-secondary))] transition-all duration-200 cursor-pointer"
                >
                  {/* Game Cover */}
                  <div className="relative w-full aspect-video rounded overflow-hidden mb-2">
                    {game.source === 'steam' ? (
                      (() => {
                        const allMatchingMedia = getAllMatchingMedia(game.name);
                        const carouselKey = getSuggestedCarouselKey(game);
                        const currentIndex = libraryMediaIndexes[carouselKey] || 0;
                        let currentMedia = null;
                        let coverUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appId}/header.jpg`;
                        if (allMatchingMedia.length > 0) {
                          currentMedia = allMatchingMedia[currentIndex];
                          coverUrl = getStoragePublicObjectUrl('media-library', currentMedia.file_url);
                        }
                        return (
                          <div className="relative w-full h-full">
                            {currentMedia && (currentMedia.file_type === 'gif' || currentMedia.file_type === 'video') ? (
                              <video
                                src={coverUrl}
                                alt={`${game.name} cover`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                muted
                                loop
                                autoPlay
                              />
                            ) : (
                              <img
                                src={coverUrl}
                                alt={`${game.name} cover`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                loading={index < 3 ? 'eager' : 'lazy'}
                                onError={(e) => {
                                  e.target.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appId}/header.jpg`;
                                }}
                              />
                            )}
                            {currentMedia && (
                              <div className="absolute top-1 left-1 bg-[hsl(var(--wii-blue))] text-white px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                📚
                              </div>
                            )}
                            {allMatchingMedia.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const newIndex = currentIndex === 0 ? allMatchingMedia.length - 1 : currentIndex - 1;
                                    setLibraryMediaIndexes((prev) => ({ ...prev, [carouselKey]: newIndex }));
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  className="absolute left-1 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white opacity-0 transition-opacity duration-200 hover:bg-black/90 group-hover:opacity-100"
                                >
                                  ‹
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const newIndex = currentIndex === allMatchingMedia.length - 1 ? 0 : currentIndex + 1;
                                    setLibraryMediaIndexes((prev) => ({ ...prev, [carouselKey]: newIndex }));
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  className="absolute right-1 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white opacity-0 transition-opacity duration-200 hover:bg-black/90 group-hover:opacity-100"
                                >
                                  ›
                                </button>
                                <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                  {currentIndex + 1}/{allMatchingMedia.length}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })()
                    ) : game.source === 'epic' ? (
                      // Epic game cover logic with media library integration
                      (() => {
                        // Get all matching media items for this game
                        const allMatchingMedia = getAllMatchingMedia(game.name);
                        const carouselKey = getSuggestedCarouselKey(game);
                        const currentIndex = libraryMediaIndexes[carouselKey] || 0;
                        
                        // Determine which media to show (matching media or fallback)
                        let currentMedia = null;
                        let coverUrl = '';
                        if (allMatchingMedia.length > 0) {
                          // Use the current index from carousel
                          currentMedia = allMatchingMedia[currentIndex];
                          coverUrl = getStoragePublicObjectUrl('media-library', currentMedia.file_url);
                        } else {
                          // Fallback to Epic CDN
                          coverUrl = game.image || `https://cdn2.unrealengine.com/${game.appName || game.id}-1200x630-${game.appName || game.id}.jpg`;
                        }
                        
                        return (
                          <div className="relative w-full h-full">
                            {currentMedia && (currentMedia.file_type === 'gif' || currentMedia.file_type === 'video') ? (
                              // Use video element for GIFs and MP4s
                              <video
                                src={coverUrl}
                                alt={`${game.name} cover`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                muted
                                loop
                                autoPlay
                                onError={(e) => {
                                  // Fallback to a generic game icon if video fails to load
                                  e.target.style.display = 'none';
                                  const fallbackImg = document.createElement('img');
                                  fallbackImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iNCIgZmlsbD0iIzM0MzQzNCIvPgo8cGF0aCBkPSJNMTIgMTJIMjhWMjhIMTJWMjJaIiBmaWxsPSIjNjY2NjY2Ii8+Cjwvc3ZnPgo=';
                                  fallbackImg.className = 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-200';
                                  e.target.parentNode.appendChild(fallbackImg);
                                }}
                              />
                            ) : (
                              // Use img element for static images
                              <img
                                src={coverUrl}
                                alt={`${game.name} cover`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                loading={index < 3 ? "eager" : "lazy"}
                                onError={(e) => {
                                  // Fallback to a generic game icon if cover fails to load
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iNCIgZmlsbD0iIzM0MzQzNCIvPgo8cGF0aCBkPSJNMTIgMTJIMjhWMjhIMTJWMjJaIiBmaWxsPSIjNjY2NjY2Ii8+Cjwvc3ZnPgo=';
                                }}
                              />
                            )}
                            
                            {/* Media Library Badge if using cached media */}
                            {currentMedia && (
                              <div className="absolute top-1 left-1 bg-[hsl(var(--wii-blue))] text-white px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                📚
                              </div>
                            )}
                            
                            {/* Navigation Arrows for Multiple Matches */}
                            {allMatchingMedia.length > 1 && (
                              <>
                                {/* Left Arrow */}
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const newIndex = currentIndex === 0 ? allMatchingMedia.length - 1 : currentIndex - 1;
                                    setLibraryMediaIndexes(prev => ({
                                      ...prev,
                                      [carouselKey]: newIndex
                                    }));
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onMouseUp={(e) => e.stopPropagation()}
                                  className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
                                  title={`Previous media (${currentIndex + 1}/${allMatchingMedia.length})`}
                                >
                                  ‹
                                </button>
                                
                                {/* Right Arrow */}
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const newIndex = currentIndex === allMatchingMedia.length - 1 ? 0 : currentIndex + 1;
                                    setLibraryMediaIndexes(prev => ({
                                      ...prev,
                                      [carouselKey]: newIndex
                                    }));
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onMouseUp={(e) => e.stopPropagation()}
                                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
                                  title={`Next media (${currentIndex + 1}/${allMatchingMedia.length})`}
                                >
                                  ›
                                </button>
                                
                                {/* Media Counter */}
                                <div className="absolute bottom-1 right-1 bg-black/70 text-white px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                  {currentIndex + 1}/{allMatchingMedia.length}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })()
                    ) : game.source === 'exe' ? (
                      (() => {
                        const allMatchingMedia = getAllMatchingMedia(game.name);
                        const carouselKey = getSuggestedCarouselKey(game);
                        const currentIndex = libraryMediaIndexes[carouselKey] || 0;
                        let currentMedia = null;
                        let coverUrl = '';
                        if (allMatchingMedia.length > 0) {
                          currentMedia = allMatchingMedia[currentIndex];
                          coverUrl = getStoragePublicObjectUrl('media-library', currentMedia.file_url);
                        } else {
                          coverUrl = game.icon || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI0IiBmaWxsPSIjMzQzNDM0Ii8+PHBhdGggZD0iTTEyIDEySDI4VjI4SDEyVjEyWiIgZmlsbD0iIzY2NjY2NiIvPjwvc3ZnPg==';
                        }
                        const iconOnly = !currentMedia && !!game.icon;
                        return (
                          <div className="relative h-full w-full">
                            {currentMedia && (currentMedia.file_type === 'gif' || currentMedia.file_type === 'video') ? (
                              <video
                                src={coverUrl}
                                alt={`${game.name}`}
                                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                muted
                                loop
                                autoPlay
                              />
                            ) : (
                              <img
                                src={coverUrl}
                                alt={`${game.name}`}
                                className={
                                  iconOnly
                                    ? 'h-full w-full object-contain bg-[hsl(var(--surface-secondary))] p-6 transition-transform duration-200 group-hover:scale-105'
                                    : 'h-full w-full object-cover transition-transform duration-200 group-hover:scale-105'
                                }
                                loading={index < 3 ? 'eager' : 'lazy'}
                              />
                            )}
                            {currentMedia && (
                              <div className="absolute left-1 top-1 rounded bg-[hsl(var(--wii-blue))] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                📚
                              </div>
                            )}
                            {allMatchingMedia.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const newIndex = currentIndex === 0 ? allMatchingMedia.length - 1 : currentIndex - 1;
                                    setLibraryMediaIndexes((prev) => ({ ...prev, [carouselKey]: newIndex }));
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  className="absolute left-1 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white opacity-0 transition-opacity duration-200 hover:bg-black/90 group-hover:opacity-100"
                                >
                                  ‹
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const newIndex = currentIndex === allMatchingMedia.length - 1 ? 0 : currentIndex + 1;
                                    setLibraryMediaIndexes((prev) => ({ ...prev, [carouselKey]: newIndex }));
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  className="absolute right-1 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white opacity-0 transition-opacity duration-200 hover:bg-black/90 group-hover:opacity-100"
                                >
                                  ›
                                </button>
                                <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                  {currentIndex + 1}/{allMatchingMedia.length}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })()
                    ) : null}
                    
                    {/* Source Badge */}
                    <div className="absolute top-1 right-1 text-white px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: game.badgeColor }}>
                      {game.source === 'steam' ? '🎮' : game.source === 'epic' ? '🎯' : game.badgeText}
                    </div>
                  </div>
                  
                  {/* Game Name */}
                  <div className="text-center">
                    <div className="text-sm font-medium text-[hsl(var(--text-primary))] line-clamp-2 leading-tight">
                      {game.name}
                    </div>
                    <div className="text-xs text-[hsl(var(--text-tertiary))] mt-1">
                      {game.source === 'steam' ? 'Steam Game' : game.source === 'epic' ? 'Epic Game' : game.sourceName}
                    </div>
                  </div>
                  
                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-[hsl(var(--wii-blue)_/_0.1)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                    <div className="bg-[hsl(var(--wii-blue))] text-white px-3 py-1.5 rounded text-sm font-semibold">
                      {path.trim() ? 'Replace Channel' : 'Add to Channel'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Games Pagination */}
            {totalGamesPages > 1 && (
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-[hsl(var(--text-tertiary))]">
                  Page {gamesPage + 1} of {totalGamesPages}
                </div>
                <div className="flex gap-2">
                  <WButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setGamesPage(Math.max(0, gamesPage - 1))}
                    disabled={gamesPage === 0}
                  >
                    Previous
                  </WButton>
                  <WButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setGamesPage(Math.min(totalGamesPages - 1, gamesPage + 1))}
                    disabled={gamesPage === totalGamesPages - 1}
                  >
                    Next
                  </WButton>
                </div>
              </div>
            )}
          </>
        )}
      </>
    )}



    {/* Selection Feedback */}
    {selectedGameFeedback && (
      <div className="fixed top-4 right-4 bg-[hsl(var(--wii-blue))] text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right duration-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            ✓
          </div>
          <div>
            <div className="font-semibold">{selectedGameFeedback.gameName}</div>
            <div className="text-sm opacity-90">{selectedGameFeedback.message}</div>
          </div>
        </div>
      </div>
    )}

    {/* No Content Found Messages */}
    {!steamLoading && !epicLoading && !appsLoading && allGames.length === 0 && (
      <div className="text-center py-8">
        <div className="text-[hsl(var(--text-tertiary))] text-sm">
          <div className="mb-2">🎮</div>
          <div className="font-medium mb-1">No suggested items yet</div>
          <div className="text-xs">
            Install games in Steam or Epic, or ensure Start Menu shortcuts were found by the PC app scan.
            Use Refresh above after fixing launcher or shortcut issues.
          </div>
          <div className="text-xs mt-2 text-[hsl(var(--text-secondary))]">
            Debug: Steam {realSteamGames.length} (installed {realSteamGames.filter((g) => g.installed).length}) · Epic {realEpicGames.length} (installed {realEpicGames.filter((g) => g.installed !== false).length}) · PC scan {realInstalledApps.length}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <WButton
              variant="secondary"
              size="sm"
              onClick={() => {
                localStorage.removeItem('app_cache_steamGames');
                localStorage.removeItem('app_cache_timestamp_steamGames');
                rescanSteamGames();
              }}
              disabled={steamLoading}
            >
              {steamLoading ? 'Scanning...' : 'Rescan Steam'}
            </WButton>
            <WButton
              variant="secondary"
              size="sm"
              onClick={() => {
                localStorage.removeItem('app_cache_epicGames');
                localStorage.removeItem('app_cache_timestamp_epicGames');
                rescanEpicGames();
              }}
              disabled={epicLoading}
            >
              {epicLoading ? 'Scanning...' : 'Rescan Epic'}
            </WButton>
            {typeof rescanInstalledApps === 'function' && (
              <WButton
                variant="secondary"
                size="sm"
                onClick={() => rescanInstalledApps()}
                disabled={appsLoading}
              >
                {appsLoading ? 'Scanning...' : 'Rescan PC apps'}
              </WButton>
            )}
          </div>
        </div>
      </div>
    )}


  </Card>
);
}

ChannelModalSuggestedGames.propTypes = {
  isOpen: PropTypes.bool,
  path: PropTypes.string,
  setPath: PropTypes.func.isRequired,
  setType: PropTypes.func.isRequired,
  setMedia: PropTypes.func.isRequired,
  installedApps: PropTypes.array,
  appsLoading: PropTypes.bool,
  appsError: PropTypes.string,
  steamGames: PropTypes.array,
  epicGames: PropTypes.array,
  steamLoading: PropTypes.bool,
  epicLoading: PropTypes.bool,
  steamError: PropTypes.string,
  epicError: PropTypes.string,
  rescanInstalledApps: PropTypes.func,
  rescanSteamGames: PropTypes.func,
  rescanEpicGames: PropTypes.func,
};

