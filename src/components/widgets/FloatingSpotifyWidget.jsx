import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Maximize2 } from 'lucide-react';
import { useSpotifyState, useFloatingWidgetsState, useIsDarkMode } from '../../utils/useConsolidatedAppHooks';
import useAnimationActivity from '../../hooks/useAnimationActivity';
import { useFloatingWidgetFrame } from '../../hooks/useFloatingWidgetFrame';
import { usePlaybackSeek } from '../../hooks/usePlaybackSeek';
import { useWeeMotion } from '../../design/weeMotion';
import { buildSpotifyGooeyStyleVars, getSpotifyGooeyShellBackground } from '../../design/spotifyGooeyTokens';
import './FloatingSpotifyWidget.css';
import './spotify/spotify-gooey-widget.css';
import GooeyFloatingPanel from './common/GooeyFloatingPanel';
import SpotifyWidgetChrome from './spotify/SpotifyWidgetChrome';
import SpotifyPlayerView from './spotify/SpotifyPlayerView';
import SpotifyBrowseView from './spotify/SpotifyBrowseView';
import SpotifyMiniPlayerBar from './spotify/SpotifyMiniPlayerBar';
import SpotifySettingsView from './spotify/SpotifySettingsView';
import { extractColorsFromAlbumArt } from '../../utils/extractColorsFromAlbumArt';
import {
  SPOTIFY_WIDGET_DEFAULT_DYNAMIC_COLORS as DEFAULT_DYNAMIC_COLORS,
  getResolvedSpotifyWidgetSettings,
} from '../../utils/spotifyWidgetSettings';
import {
  openSettingsToTab,
  openSpotifyWebApp,
  SETTINGS_TAB_ID,
} from '../../utils/settingsNavigation';
import { CSS_SPOTIFY_PRIMARY, CSS_SPOTIFY_SECONDARY } from '../../design/runtimeColorStrings';
import {
  isSpotifyPremiumUser,
  SPOTIFY_PREMIUM_URL,
  SPOTIFY_WEB_API_PLAYER_DOCS_URL,
} from '../../utils/spotifyTier';

const FloatingSpotifyWidget = ({ isVisible }) => {
  const isDarkMode = useIsDarkMode();
  const { spotify, spotifyManager, setSpotifyState } = useSpotifyState();
  const { floatingWidgets, setFloatingWidgetsState } = useFloatingWidgetsState();
  const { isAppActive, isLowPowerMode, pollIntervalMultiplier } = useAnimationActivity({
    activeFps: 60,
    lowPowerFps: 24,
  });

  const {
    currentTrack,
    currentUser,
    isPlaying,
    isConnected,
    loading: spotifyLoading,
    error: spotifyError,
    playerWebApiForbidden,
  } = spotify;

  const isPremium = isSpotifyPremiumUser(currentUser);
  const isFreeTierConnected = Boolean(isConnected && currentUser && !isPremium);

  const spotifyWidget = floatingWidgets.spotify;
  const spotifyPosition = spotifyWidget.position;
  const spotifySize = spotifyWidget.size ?? { width: 360, height: 440 };
  const setSpotifyPosition = useCallback(
    (position) => {
      setFloatingWidgetsState({
        spotify: { ...spotifyWidget, position },
      });
    },
    [setFloatingWidgetsState, spotifyWidget]
  );
  const setSpotifySize = useCallback(
    (nextSize) => {
      setFloatingWidgetsState({
        spotify: { ...spotifyWidget, size: nextSize },
      });
    },
    [setFloatingWidgetsState, spotifyWidget]
  );

  const spotifySettings = getResolvedSpotifyWidgetSettings(spotify);

  const [playlists, setPlaylists] = useState([]);
  const [savedTracks, setSavedTracks] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  const [currentPage, setCurrentPage] = useState('player');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('playlists');
  const { reducedMotion } = useWeeMotion();
  const [dynamicBackground, setDynamicBackground] = useState(null);
  const [dynamicColors, setDynamicColors] = useState(DEFAULT_DYNAMIC_COLORS);
  const lastTierSyncRef = useRef(0);

  const shouldCancelDrag = useCallback((e) => {
    const t = e.target;
    if (!t || typeof t.closest !== 'function') return false;
    return !!(
      t.closest('.gooey-spotify-resize-handle') ||
      t.closest('button') ||
      t.closest('input') ||
      t.closest('a') ||
      t.closest('[data-no-drag]') ||
      t.closest('.floating-widget-status-cta') ||
      t.closest('textarea')
    );
  }, []);

  const {
    widgetRef,
    size,
    isDragging,
    isResizing,
    handleDragPointerDown,
    handleResizePointerDown,
  } = useFloatingWidgetFrame({
    setPosition: setSpotifyPosition,
    position: spotifyPosition,
    size: spotifySize,
    setSize: setSpotifySize,
    resizable: true,
    minSize: { width: 260, height: 240 },
    shouldCancelDrag,
  });

  const openExternalUrl = useCallback((url) => {
    if (url && window.api?.openExternal) {
      window.api.openExternal(url);
    } else if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  const handleSeekCommit = useCallback(
    (ms) => {
      if (!isPremium) return;
      spotifyManager?.seekToPosition(ms);
    },
    [isPremium, spotifyManager]
  );

  const {
    progressBarRef,
    isSeeking,
    seekPosition,
    handleSeekHandlePointerDown,
    handleProgressBarPointerDown,
  } = usePlaybackSeek({
    durationMs: spotify.duration || 0,
    onCommitSeek: handleSeekCommit,
    disabled: isFreeTierConnected,
  });

  const handleOpenSpotifyIntegrationSettings = useCallback(() => {
    openSettingsToTab(SETTINGS_TAB_ID.API_INTEGRATIONS);
  }, []);

  useEffect(() => {
    if (!isVisible || !isConnected || !spotifyManager?.syncUserProfile) return;
    const now = Date.now();
    if (now - lastTierSyncRef.current < 60000) return;
    lastTierSyncRef.current = now;
    spotifyManager.syncUserProfile();
  }, [isVisible, isConnected, spotifyManager]);

  const allowEnhancedEffects = isAppActive && !isLowPowerMode;
  const effectiveBlurAmount = allowEnhancedEffects
    ? spotifySettings.blurAmount || 0
    : Math.min(spotifySettings.blurAmount || 0, 8);
  const effectiveTrackInfoBlur = allowEnhancedEffects
    ? spotifySettings.trackInfoPanelBlur || 0
    : Math.min(spotifySettings.trackInfoPanelBlur || 0, 6);

  const albumArtUrl = currentTrack?.album?.images?.[0]?.url;
  useEffect(() => {
    if (albumArtUrl && spotifySettings.dynamicColors) {
      extractColorsFromAlbumArt(albumArtUrl).then((result) => {
        if (result) {
          if (currentPage === 'player') {
            setDynamicBackground(result.gradient);
            setDynamicColors(result.colors);
          } else {
            setDynamicBackground(null);
            setDynamicColors(DEFAULT_DYNAMIC_COLORS);
          }
          setSpotifyState({
            extractedColors: result.colors,
          });
        }
      });
    } else {
      setDynamicBackground(null);
      setDynamicColors(DEFAULT_DYNAMIC_COLORS);
      setSpotifyState({
        extractedColors: null,
      });
    }
  }, [albumArtUrl, spotifySettings.dynamicColors, currentPage, setSpotifyState]);

  useEffect(() => {
    if (!isVisible || !isAppActive) return;

    const basePlaybackPollIntervalMs = playerWebApiForbidden
      ? 120000
      : isLowPowerMode
        ? 6000
        : 2000;
    const playbackPollIntervalMs = Math.round(basePlaybackPollIntervalMs * pollIntervalMultiplier);

    const interval = setInterval(() => {
      spotifyManager.refreshPlaybackState();
    }, playbackPollIntervalMs);

    return () => clearInterval(interval);
  }, [
    isVisible,
    isAppActive,
    isLowPowerMode,
    pollIntervalMultiplier,
    playerWebApiForbidden,
    spotifyManager,
  ]);

  useEffect(() => {
    if (isVisible && currentPage === 'browse') {
      const loadData = async () => {
        try {
          if (!spotifyManager?.loadPlaylists || !spotifyManager?.loadSavedTracks) {
            return;
          }
          const [playlistsData, tracksData] = await Promise.all([
            spotifyManager.loadPlaylists().catch(() => []),
            spotifyManager.loadSavedTracks().catch(() => []),
          ]);
          setPlaylists(playlistsData || []);
          setSavedTracks(tracksData || []);
        } catch {
          setPlaylists([]);
          setSavedTracks([]);
        }
      };
      loadData();
    }
  }, [isVisible, currentPage, spotifyManager]);

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        if (!spotifyManager?.searchTracks) return;
        const results = await spotifyManager.searchTracks(searchQuery);
        setSearchResults(results || []);
        setActiveTab('search');
      } catch {
        setSearchResults([]);
      }
    }
  };

  const handlePlayTrack = useCallback(
    async (track) => {
      const id = typeof track === 'string' ? track : track?.id;
      if (!id) return;
      if (!isPremium) {
        const spotifyUrl =
          typeof track === 'object' && track?.external_urls?.spotify
            ? track.external_urls.spotify
            : `https://open.spotify.com/track/${id}`;
        openExternalUrl(spotifyUrl);
        return;
      }
      try {
        await spotifyManager.playTrack(id);
        setCurrentPage('player');
      } catch (error) {
        console.error('Failed to play track:', error);
      }
    },
    [isPremium, openExternalUrl, spotifyManager]
  );

  const handlePlayPlaylist = useCallback(
    async (playlist) => {
      const playlistId = typeof playlist === 'string' ? playlist : playlist?.id;
      if (!playlistId) return;
      if (!isPremium) {
        const url =
          typeof playlist === 'object' && playlist?.external_urls?.spotify
            ? playlist.external_urls.spotify
            : `https://open.spotify.com/playlist/${playlistId}`;
        openExternalUrl(url);
        return;
      }
      try {
        await spotifyManager.playPlaylist(playlistId);
        setCurrentPage('player');
      } catch (error) {
        console.error('Failed to play playlist:', error);
      }
    },
    [isPremium, openExternalUrl, spotifyManager]
  );

  const formatTime = (ms) => {
    if (!ms) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const shellBackground = useMemo(
    () =>
      getSpotifyGooeyShellBackground({
        currentPage,
        dynamicColorsEnabled: spotifySettings.dynamicColors,
        dynamicBackgroundGradient: dynamicBackground,
        hasAlbumArt: Boolean(albumArtUrl),
        dynamicColors,
        isDarkMode,
      }),
    [
      albumArtUrl,
      currentPage,
      dynamicBackground,
      dynamicColors,
      isDarkMode,
      spotifySettings.dynamicColors,
    ]
  );

  const gooeyVars = useMemo(
    () =>
      buildSpotifyGooeyStyleVars({
        dynamicColorsEnabled: spotifySettings.dynamicColors,
        currentPage,
        dynamicColors,
        hasAlbumArt: Boolean(albumArtUrl),
        isDarkMode,
      }),
    [albumArtUrl, currentPage, dynamicColors, isDarkMode, spotifySettings.dynamicColors]
  );

  const handleDynamicColorsToggle = (checked) => {
    spotifyManager.updateSpotifySettings({ dynamicColors: checked });
  };

  const handleBlurredBackgroundToggle = (checked) => {
    spotifyManager.updateSpotifySettings({ useBlurredBackground: checked });
  };

  const handleBlurAmountChange = (value) => {
    spotifyManager.updateSpotifySettings({ blurAmount: value });
  };

  const handleAutoShowWidgetToggle = (checked) => {
    spotifyManager.updateSpotifySettings({ autoShowWidget: checked });
  };

  const handleCloseFloatingWidget = useCallback(() => {
    setFloatingWidgetsState({
      spotify: { ...spotifyWidget, visible: false },
    });
  }, [setFloatingWidgetsState, spotifyWidget]);

  const hasDynamicAlbumColors = Boolean(
    spotifySettings.dynamicColors && currentTrack?.album?.images?.[0]?.url
  );

  const artistLine = currentTrack?.artists?.map((a) => a.name).join(', ') ?? '';

  const tierLabel = isPremium ? 'premium' : isConnected && currentUser ? 'free' : null;

  if (!isVisible) return null;

  return (
    <div
      className={[
        'floating-spotify-widget floating-spotify-widget--gooey',
        isFreeTierConnected ? 'floating-spotify-widget--free-tier' : '',
        isPremium ? 'floating-spotify-widget--premium-tier' : '',
        isDragging ? 'floating-spotify-widget--dragging' : '',
        isResizing ? 'floating-spotify-widget--resizing' : '',
        size.width < 300 ? 'floating-spotify-widget--sm' : size.width < 450 ? 'floating-spotify-widget--md' : 'floating-spotify-widget--lg',
        hasDynamicAlbumColors ? 'floating-spotify-widget--dynamic has-dynamic-colors' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      ref={widgetRef}
      style={{
        left: `${spotifyPosition.x}px`,
        top: `${spotifyPosition.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        ...gooeyVars,
        '--glow-primary':
          spotifySettings.dynamicColors && albumArtUrl && currentPage === 'player'
            ? dynamicColors.primary
            : CSS_SPOTIFY_PRIMARY,
        '--glow-secondary':
          spotifySettings.dynamicColors && albumArtUrl && currentPage === 'player'
            ? dynamicColors.secondary
            : CSS_SPOTIFY_SECONDARY,
        '--spotify-track-info-opacity': spotifySettings.trackInfoPanelOpacity,
        '--spotify-track-info-blur': `${effectiveTrackInfoBlur}px`,
      }}
    >
      <GooeyFloatingPanel
        className="floating-spotify-widget__panel"
        style={{ width: '100%', height: '100%', background: shellBackground }}
        isDragging={isDragging}
        isResizing={isResizing}
        ambientPlaying={Boolean(currentPage === 'player' && isPlaying && currentTrack)}
        ambientOrbAnimated={allowEnhancedEffects && !reducedMotion}
      >
        {spotifySettings.useBlurredBackground &&
          currentTrack?.album?.images?.[0]?.url &&
          currentPage === 'player' && (
            <div
              className="floating-spotify-widget__blurred-art"
              style={{
                background: `url(${currentTrack.album.images[0].url}) center/cover`,
                filter: `blur(${effectiveBlurAmount}px)`,
              }}
            />
          )}

        <div className="floating-spotify-widget__column flex min-h-0 flex-1 flex-col">
          {isConnected && (
            <div
              className="floating-spotify-widget__chrome-drag flex shrink-0 cursor-grab touch-none p-6 pb-4 pt-4 active:cursor-grabbing sm:p-8 sm:pb-4"
              onPointerDown={handleDragPointerDown}
            >
              <SpotifyWidgetChrome
                currentPage={currentPage}
                onNavigatePlayer={() => setCurrentPage('player')}
                onNavigateBrowse={() => setCurrentPage('browse')}
                onNavigateSettings={() => setCurrentPage('settings')}
                searchQuery={searchQuery}
                onSearchChange={(v) => setSearchQuery(v)}
                onSearchSubmit={handleSearch}
                onSearchFocus={() => {
                  if (currentPage === 'player') setCurrentPage('browse');
                }}
                reducedMotion={reducedMotion}
                searchExpanded={searchExpanded}
                onSearchExpandedChange={setSearchExpanded}
                tierLabel={tierLabel || undefined}
              />
            </div>
          )}

          <div className="widget-content wee-spotify-widget__body flex min-h-0 min-w-0 flex-1 flex-col px-6 sm:px-10">
            {(!isConnected || spotifyError) && (
              <div
                className="floating-widget-status-banner floating-widget-status-banner--with-actions"
                role="status"
                aria-live="polite"
              >
                <div className="floating-widget-status-banner__row">
                  <div className="floating-widget-status-banner__text">
                    {!isConnected && (
                      <span>
                        Spotify isn&apos;t connected. Connect your account under Settings → API &amp; Widgets to
                        control playback.
                      </span>
                    )}
                    {isConnected && spotifyError && (
                      <span title={spotifyError}>Playback issue: {spotifyError}</span>
                    )}
                  </div>
                  <div className="floating-widget-status-banner__actions">
                    {!isConnected && (
                      <button
                        type="button"
                        className="floating-widget-status-cta"
                        onClick={handleOpenSpotifyIntegrationSettings}
                      >
                        Connect in Settings
                      </button>
                    )}
                    {isConnected && spotifyError && (
                      <>
                        <button
                          type="button"
                          className="floating-widget-status-cta"
                          onClick={handleOpenSpotifyIntegrationSettings}
                        >
                          Open API &amp; Widgets
                        </button>
                        {/no active device/i.test(String(spotifyError)) ? (
                          <button
                            type="button"
                            className="floating-widget-status-cta floating-widget-status-cta--secondary"
                            onClick={openSpotifyWebApp}
                          >
                            Open Spotify
                          </button>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            {isConnected && spotifyLoading && !currentTrack && (
              <div className="floating-widget-status-banner floating-widget-status-banner--subtle" role="status">
                Syncing playback…
              </div>
            )}

            {isConnected && playerWebApiForbidden && (
              <div className="floating-spotify-widget__player-api-banner" role="status">
                <p className="floating-spotify-widget__player-api-banner__text">
                  Now playing in this widget requires Spotify Premium.
                </p>
                <button
                  type="button"
                  className="floating-spotify-widget__tier-cta floating-spotify-widget__tier-cta--ghost"
                  onClick={() => openExternalUrl(SPOTIFY_WEB_API_PLAYER_DOCS_URL)}
                >
                  Web API docs
                </button>
              </div>
            )}

            {isFreeTierConnected && !playerWebApiForbidden && (
              <div className="floating-spotify-widget__tier-banner" role="status">
                <p className="floating-spotify-widget__tier-banner-title">Spotify Free</p>
                <p className="floating-spotify-widget__tier-banner-copy">
                  Play music in the Spotify app on this device. This widget shows what&apos;s playing here; remote
                  playback control from Wee needs Spotify Premium.
                </p>
                <div className="floating-spotify-widget__tier-banner-actions">
                  <button
                    type="button"
                    className="floating-spotify-widget__tier-cta"
                    onClick={() => openExternalUrl(SPOTIFY_PREMIUM_URL)}
                  >
                    Premium &amp; remote control
                  </button>
                  <button
                    type="button"
                    className="floating-spotify-widget__tier-cta floating-spotify-widget__tier-cta--ghost"
                    onClick={openSpotifyWebApp}
                  >
                    Open Spotify
                  </button>
                </div>
              </div>
            )}

            {isConnected && (
              <div className="relative flex min-h-0 w-full flex-1 flex-col gap-1">
                <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col">
                  <AnimatePresence mode="wait" initial={false}>
                    {currentPage === 'player' && (
                      <m.div
                        key="player"
                        initial={reducedMotion ? false : { opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={reducedMotion ? undefined : { opacity: 0, scale: 1.05 }}
                        transition={{ duration: reducedMotion ? 0.12 : 0.22 }}
                        className="player-page flex min-h-0 min-w-0 flex-1 flex-col"
                      >
                        <SpotifyPlayerView
                          currentTrack={currentTrack}
                          artistLine={artistLine}
                          size={size}
                          isPlaying={isPlaying}
                          isFreeTierConnected={isFreeTierConnected}
                          spotifyProgress={spotify.progress || 0}
                          spotifyDuration={spotify.duration || 0}
                          isSeeking={isSeeking}
                          seekPosition={seekPosition}
                          progressBarRef={progressBarRef}
                          onProgressBarPointerDown={handleProgressBarPointerDown}
                          onSeekHandlePointerDown={handleSeekHandlePointerDown}
                          formatTime={formatTime}
                          onPrevious={() => spotifyManager.skipToPrevious()}
                          onTogglePlay={() => spotifyManager.togglePlayback()}
                          onNext={() => spotifyManager.skipToNext()}
                          reducedMotion={reducedMotion}
                        />
                      </m.div>
                    )}
                    {currentPage === 'browse' && (
                      <m.div
                        key="browse"
                        initial={reducedMotion ? false : { opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reducedMotion ? undefined : { opacity: 0, y: -6 }}
                        transition={{ duration: reducedMotion ? 0.12 : 0.2 }}
                        className="browse-page flex min-h-0 min-w-0 flex-1 flex-col"
                      >
                        <SpotifyBrowseView
                          loading={spotify.loading}
                          isFreeTierConnected={isFreeTierConnected}
                          searchQuery={searchQuery}
                          activeTab={activeTab}
                          onTabPlaylists={() => setActiveTab('playlists')}
                          onTabSongs={() => setActiveTab('songs')}
                          onTabSearch={() => setActiveTab('search')}
                          playlists={playlists}
                          savedTracks={savedTracks}
                          searchResults={searchResults}
                          onPlayPlaylist={handlePlayPlaylist}
                          onPlayTrack={handlePlayTrack}
                          widgetWidth={size.width}
                          reducedMotion={reducedMotion}
                          currentTrackId={currentTrack?.id}
                        />
                      </m.div>
                    )}
                    {currentPage === 'settings' && (
                      <m.div
                        key="settings"
                        initial={reducedMotion ? false : { opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={reducedMotion ? undefined : { opacity: 0, x: -12 }}
                        transition={{ duration: reducedMotion ? 0.12 : 0.2 }}
                        className="flex min-h-0 min-w-0 flex-1 flex-col"
                      >
                        <SpotifySettingsView
                          isFreeTierConnected={isFreeTierConnected}
                          spotifySettings={spotifySettings}
                          spotifyManager={spotifyManager}
                          onDynamicColorsToggle={handleDynamicColorsToggle}
                          onBlurredBackgroundToggle={handleBlurredBackgroundToggle}
                          onBlurAmountChange={handleBlurAmountChange}
                          onAutoShowWidgetToggle={handleAutoShowWidgetToggle}
                          onCloseWidget={handleCloseFloatingWidget}
                          reducedMotion={reducedMotion}
                        />
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {currentPage !== 'player' && currentTrack ? (
                    <SpotifyMiniPlayerBar
                      key="spotify-mini"
                      track={currentTrack}
                      artistLine={artistLine}
                      albumArtUrl={currentTrack?.album?.images?.[0]?.url}
                      isPlaying={isPlaying}
                      onOpenPlayer={() => setCurrentPage('player')}
                      onTogglePlay={() => spotifyManager.togglePlayback()}
                      disabled={isFreeTierConnected}
                      reducedMotion={reducedMotion}
                    />
                  ) : null}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </GooeyFloatingPanel>

      <button
        type="button"
        className="gooey-spotify-resize-handle floating-spotify-widget__resize"
        onPointerDown={handleResizePointerDown}
        aria-label="Resize Spotify widget"
      >
        <Maximize2 size={18} strokeWidth={2.5} className="rotate-45" aria-hidden />
      </button>
    </div>
  );
};

export default FloatingSpotifyWidget;
