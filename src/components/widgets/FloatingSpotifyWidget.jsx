import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { useSpotifyState, useFloatingWidgetsState } from '../../utils/useConsolidatedAppHooks';
import useAnimationActivity from '../../hooks/useAnimationActivity';
import { useFloatingWidgetFrame } from '../../hooks/useFloatingWidgetFrame';
import { usePlaybackSeek } from '../../hooks/usePlaybackSeek';
import { useWeeMotion } from '../../design/weeMotion';
import './FloatingSpotifyWidget.css';
import './spotify/wee-spotify-widget.css';
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
import {
  CSS_COLOR_PURE_WHITE,
  CSS_COLOR_PURE_WHITE_90,
  CSS_SPOTIFY_PRIMARY,
  CSS_SPOTIFY_SECONDARY,
  SPOTIFY_DEFAULT_GRADIENT,
} from '../../design/runtimeColorStrings';
import {
  isSpotifyPremiumUser,
  SPOTIFY_PREMIUM_URL,
  SPOTIFY_WEB_API_PLAYER_DOCS_URL,
} from '../../utils/spotifyTier';

const FloatingSpotifyWidget = ({ isVisible }) => {
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

  // Get spotify widget state from floating widgets
  const spotifyWidget = floatingWidgets.spotify;
  const spotifyPosition = spotifyWidget.position;
  const spotifySize = spotifyWidget.size ?? { width: 360, height: 440 };
  const setSpotifyPosition = useCallback((position) => {
    setFloatingWidgetsState({
      spotify: { ...spotifyWidget, position }
    });
  }, [setFloatingWidgetsState, spotifyWidget]);
  const setSpotifySize = useCallback((nextSize) => {
    setFloatingWidgetsState({
      spotify: { ...spotifyWidget, size: nextSize }
    });
  }, [setFloatingWidgetsState, spotifyWidget]);

  const spotifySettings = getResolvedSpotifyWidgetSettings(spotify);

  const [playlists, setPlaylists] = useState([]);
  const [savedTracks, setSavedTracks] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  const [audioData, setAudioData] = useState(new Array(32).fill(0));
  const [currentPage, setCurrentPage] = useState('player'); // 'player', 'browse', or 'settings'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('playlists'); // 'playlists', 'songs', 'search'
  const { reducedMotion } = useWeeMotion();
  const [dynamicBackground, setDynamicBackground] = useState(null);
  const [dynamicColors, setDynamicColors] = useState(DEFAULT_DYNAMIC_COLORS);
  const lastVisualizerFrameRef = useRef(0);
  const visualizerLoopActiveRef = useRef(false);
  const lastTierSyncRef = useRef(0);
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

  const allowEnhancedVisualizerEffects = isAppActive && !isLowPowerMode;
  const visualizerFrameThrottleMs = isLowPowerMode ? 120 : 48;
  const effectiveBlurAmount = allowEnhancedVisualizerEffects
    ? (spotifySettings.blurAmount || 0)
    : Math.min(spotifySettings.blurAmount || 0, 8);
  const effectiveTrackInfoBlur = allowEnhancedVisualizerEffects
    ? (spotifySettings.trackInfoPanelBlur || 0)
    : Math.min(spotifySettings.trackInfoPanelBlur || 0, 6);

  // Update dynamic background when track changes
  const albumArtUrl = currentTrack?.album?.images?.[0]?.url;
  useEffect(() => {
    if (albumArtUrl && spotifySettings.dynamicColors) {
      extractColorsFromAlbumArt(albumArtUrl).then(result => {
        if (result) {
          // Set local state for widget - only show dynamic background on player page
          if (currentPage === 'player') {
            setDynamicBackground(result.gradient);
            setDynamicColors(result.colors);
          } else {
            // Keep default colors for widget display on other pages
            setDynamicBackground(null);
            setDynamicColors(DEFAULT_DYNAMIC_COLORS);
          }
          
          // 🚀 SHARE COLORS GLOBALLY: Save extracted colors to global Spotify state for WiiRibbon
          setSpotifyState({ 
            extractedColors: result.colors 
          });
        }
      });
    } else {
      setDynamicBackground(null);
      setDynamicColors(DEFAULT_DYNAMIC_COLORS);
      
      // Clear global extracted colors
      setSpotifyState({ 
        extractedColors: null 
      });
    }
  }, [albumArtUrl, spotifySettings.dynamicColors, currentPage, setSpotifyState]);

  // Enhanced music-synced visualizer with engaging animations and effects
  const updateVisualizer = useCallback(() => {
    if (!isPlaying || !currentTrack) {
      setAudioData(new Array(32).fill(0));
      return;
    }

    const time = Date.now() * 0.001;
    const trackProgress = (spotify.progress || 0) / (spotify.duration || 1);
    
    // Create engaging audio data with multiple animation layers
    const newData = new Array(32).fill(0).map((_, i) => {
      // Base frequency with more variation
      const baseFreq = (i + 1) * 0.2;
      
      // Multiple frequency layers for rich animation
      const freq1 = Math.sin(time * baseFreq) * 0.5;
      const freq2 = Math.sin(time * baseFreq * 1.5) * 0.3;
      const freq3 = Math.sin(time * baseFreq * 0.7) * 0.4;
      const freq4 = Math.cos(time * baseFreq * 0.3) * 0.2;
      
      // Create pulsing beat pattern
      const beatPulse = Math.sin(trackProgress * Math.PI * 12 + i * 0.3) * 0.15;
      const beatPulse2 = Math.sin(trackProgress * Math.PI * 6 + i * 0.1) * 0.1;
      
      // Add wave-like motion
      const waveMotion = Math.sin(time * 0.8 + i * 0.2) * 0.1;
      
      // Create frequency-specific effects
      let amplitude = freq1 + freq2 + freq3 + freq4 + beatPulse + beatPulse2 + waveMotion;
      
      // Enhanced frequency-dependent animations
      if (i < 6) {
        // Bass frequencies - powerful, slow pulsing
        const bassPulse = Math.sin(time * 0.3 + i * 0.5) * 0.3;
        const bassWave = Math.sin(time * 0.1 + i * 0.2) * 0.2;
        amplitude = (amplitude * 0.6 + bassPulse + bassWave) * 1.5;
      } else if (i < 16) {
        // Mid frequencies - rhythmic, dynamic
        const midRhythm = Math.sin(time * 1.5 + i * 0.4) * 0.25;
        const midPulse = Math.sin(time * 0.8 + i * 0.3) * 0.15;
        amplitude = (amplitude * 0.8 + midRhythm + midPulse) * 1.2;
      } else {
        // Treble frequencies - fast, detailed, sparkly
        const trebleSparkle = Math.sin(time * 3.0 + i * 0.6) * 0.2;
        const trebleWave = Math.sin(time * 2.2 + i * 0.4) * 0.15;
        amplitude = (amplitude * 0.7 + trebleSparkle + trebleWave) * 0.9;
      }
      
      // Add some controlled randomness for organic feel
      const organicRandom = (Math.random() - 0.5) * 0.1;
      amplitude += organicRandom;
      
      // Create dynamic peaks and valleys
      const peakPattern = Math.sin(time * 2.5 + i * 0.8) * 0.1;
      amplitude += peakPattern;
      
      // Ensure amplitude is within bounds with smooth limiting
      return Math.max(0, Math.min(1, amplitude));
    });
    
    setAudioData(newData);
  }, [isPlaying, currentTrack, spotify.progress, spotify.duration]);

  // Optimized animation loop for visualizer (single RAF chain + cancel flag)
  useEffect(() => {
    if (
      !isVisible ||
      !isAppActive ||
      currentPage !== 'player' ||
      !isPlaying ||
      spotifySettings.visualizerType === 'off'
    ) {
      return undefined;
    }
    let rafId = 0;
    visualizerLoopActiveRef.current = true;

    const animate = (timestamp) => {
      if (!visualizerLoopActiveRef.current) return;
      const ts = Number.isFinite(timestamp) ? timestamp : performance.now();
      if (ts - lastVisualizerFrameRef.current >= visualizerFrameThrottleMs) {
        updateVisualizer();
        lastVisualizerFrameRef.current = ts;
      }
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => {
      visualizerLoopActiveRef.current = false;
      cancelAnimationFrame(rafId);
    };
  }, [
    isVisible,
    isAppActive,
    currentPage,
    isPlaying,
    updateVisualizer,
    visualizerFrameThrottleMs,
    spotifySettings.visualizerType,
  ]);

  // Refresh playback state periodically (slow when Web API player is forbidden — avoids 403 / parse noise)
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

  // Load playlists and saved tracks when browsing page is opened
  useEffect(() => {
    if (isVisible && currentPage === 'browse') {
      const loadData = async () => {
        try {
          // Check if spotifyManager is available
          if (!spotifyManager) {
            console.error('[SpotifyWidget] spotifyManager is not available');
            return;
          }

          // Check if required functions exist
          if (!spotifyManager.loadPlaylists || !spotifyManager.loadSavedTracks) {
            console.error('[SpotifyWidget] Required spotifyManager functions are missing:', {
              hasLoadPlaylists: !!spotifyManager.loadPlaylists,
              hasLoadSavedTracks: !!spotifyManager.loadSavedTracks
            });
            return;
          }

          const [playlistsData, tracksData] = await Promise.all([
            spotifyManager.loadPlaylists().catch(error => {
              console.error('[SpotifyWidget] Failed to load playlists:', error);
              return [];
            }),
            spotifyManager.loadSavedTracks().catch(error => {
              console.error('[SpotifyWidget] Failed to load saved tracks:', error);
              return [];
            })
          ]);
          
          setPlaylists(playlistsData || []);
          setSavedTracks(tracksData || []);
        } catch (error) {
          console.error('[SpotifyWidget] Error loading browse data:', error);
          setPlaylists([]);
          setSavedTracks([]);
        }
      };
      loadData();
    }
  }, [isVisible, currentPage, spotifyManager]);

  // Handle search
  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        if (!spotifyManager || !spotifyManager.searchTracks) {
          console.error('[SpotifyWidget] spotifyManager.searchTracks is not available');
          return;
        }
        
        const results = await spotifyManager.searchTracks(searchQuery);
        setSearchResults(results || []);
        setActiveTab('search');
      } catch (error) {
        console.error('[SpotifyWidget] Search error:', error);
        setSearchResults([]);
      }
    }
  };

  // Handle play track (Free tier: open in Spotify app / web instead of API playback)
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

  // Format time helper function
  const formatTime = (ms) => {
    if (!ms) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  // Determine background based on current page with enhanced Spotify color strategy
  const getBackground = () => {
    // Apply Spotify colors consistently across all pages when available
    if (spotifySettings.dynamicColors && dynamicColors && Object.keys(dynamicColors).length > 0) {
      if (currentPage === 'player' && dynamicBackground) {
        return dynamicBackground;
      } else if (currentPage === 'player' && spotifySettings.useBlurredBackground && currentTrack?.album?.images?.[0]?.url) {
        return `url(${currentTrack.album.images[0].url}) center/cover`;
      } else {
        // Use Spotify colors for gradient on all pages
        return `linear-gradient(135deg, ${dynamicColors.primary} 0%, ${dynamicColors.secondary} 100%)`;
      }
    }
    
    // Fallback to default colors
    if (currentPage === 'browse' || currentPage === 'settings') {
      return SPOTIFY_DEFAULT_GRADIENT;
    }
    
    if (spotifySettings.useBlurredBackground && currentTrack?.album?.images?.[0]?.url) {
      return `url(${currentTrack.album.images[0].url}) center/cover`;
    }
    
    return dynamicBackground || SPOTIFY_DEFAULT_GRADIENT;
  };

  // Settings handlers
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

  const handleVisualizerTypeChange = (type) => {
    spotifyManager.updateSpotifySettings({ visualizerType: type });
  };

  const hasDynamicAlbumColors = Boolean(
    spotifySettings.dynamicColors && currentTrack?.album?.images?.[0]?.url
  );

  const getVisualizerOptionClass = (type) =>
    `visualizer-option-modern ${spotifySettings.visualizerType === type ? 'active visualizer-option-modern-active' : 'visualizer-option-modern-inactive'}`;

  const artistLine = currentTrack?.artists?.map((a) => a.name).join(', ') ?? '';

  return (
    <div 
      className={`floating-spotify-widget floating-spotify-widget--wee-playful ${
        currentPage === 'player' &&
        spotifySettings.visualizerType &&
        spotifySettings.visualizerType !== 'off'
          ? 'floating-spotify-widget--player'
          : ''
      } ${isFreeTierConnected ? 'floating-spotify-widget--free-tier' : ''} ${isPremium ? 'floating-spotify-widget--premium-tier' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${size.width < 300 ? 'small-widget' : size.width < 450 ? 'medium-widget' : 'large-widget'} ${hasDynamicAlbumColors ? 'has-dynamic-colors' : ''}`}
      ref={widgetRef}
      style={{
        left: `${spotifyPosition.x}px`,
        top: `${spotifyPosition.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        background: getBackground(),
        '--glow-primary': spotifySettings.dynamicColors && currentTrack?.album?.images?.[0]?.url && currentPage === 'player' ? dynamicColors.primary : CSS_SPOTIFY_PRIMARY,
        '--glow-secondary': spotifySettings.dynamicColors && currentTrack?.album?.images?.[0]?.url && currentPage === 'player' ? dynamicColors.secondary : CSS_SPOTIFY_SECONDARY,
        '--glow-opacity': spotifySettings.dynamicColors && currentTrack?.album?.images?.[0]?.url && currentPage === 'player' ? '0.4' : '0.3',
        '--glow-brightness': spotifySettings.dynamicColors && currentTrack?.album?.images?.[0]?.url && currentPage === 'player' ? '1.1' : '1',
        '--spotify-dyn-primary': dynamicColors.primary || CSS_SPOTIFY_PRIMARY,
        '--spotify-dyn-accent': dynamicColors.accent || CSS_COLOR_PURE_WHITE,
        '--spotify-dyn-text': dynamicColors.text || CSS_COLOR_PURE_WHITE,
        '--spotify-track-info-opacity': spotifySettings.trackInfoPanelOpacity,
        '--spotify-track-info-blur': `${effectiveTrackInfoBlur}px`
      }}
    >
      {/* Blurred Background Layer - only for player page with album art */}
      {spotifySettings.useBlurredBackground && currentTrack?.album?.images?.[0]?.url && currentPage === 'player' && (
        <div 
          className="blurred-background-layer"
          style={{
            background: `url(${currentTrack.album.images[0].url}) center/cover`,
            filter: `blur(${effectiveBlurAmount}px)`,
          }}
        />
      )}

      {/* Title bar: drag handle only (playback controls stay interactive) */}
      <div className="floating-spotify-widget__chrome">
        <button
          type="button"
          className="floating-spotify-widget__drag-handle"
          onPointerDown={handleDragPointerDown}
          aria-label="Move Spotify widget"
        >
          <span className="floating-spotify-widget__grip" aria-hidden />
          <span className="floating-spotify-widget__brand">Spotify</span>
          {isPremium ? (
            <span className="floating-spotify-widget__tier-pill floating-spotify-widget__tier-pill--premium">
              Premium
            </span>
          ) : isConnected && currentUser ? (
            <span className="floating-spotify-widget__tier-pill floating-spotify-widget__tier-pill--free">
              Free
            </span>
          ) : null}
        </button>
      </div>

      {/* Visualizer (player page only, optional — default off for CPU) — not a drag surface */}
      {currentPage === 'player' &&
        spotifySettings.visualizerType &&
        spotifySettings.visualizerType !== 'off' && (
        <div 
          className={`visualizer-header visualizer-${spotifySettings.visualizerType || 'bars'}`}
        >
          {audioData.map((height, index) => {
            // Calculate responsive dimensions based on widget size
            const isSmallWidget = size.width < 300;
            const barCount = isSmallWidget ? 16 : 32;
            const barWidth = isSmallWidget ? 3 : 4;
            const maxHeight = isSmallWidget ? 30 : 40;
            
            // Skip bars if we have too many for small widgets
            if (isSmallWidget && index >= barCount) return null;
            
            // Create engaging visual effects based on amplitude
            // Enhanced visualizer styles based on type with Spotify color strategy
            let visualizerStyle = {};
            
            switch (spotifySettings.visualizerType) {
              case 'circles': {
                const circleSize = Math.max(8, height * 25);
                visualizerStyle = {
                  width: `${circleSize}px`,
                  height: `${circleSize}px`,
                  borderRadius: '50%',
                  transform: `scale(${0.3 + height * 0.7}) rotate(${height * 360}deg)`,
                  boxShadow: allowEnhancedVisualizerEffects && height > 0.3 ? 
                    `0 0 ${height * 15}px ${height * 8}px ${dynamicColors.accent || CSS_COLOR_PURE_WHITE}` : 'none',
                  filter: allowEnhancedVisualizerEffects && height > 0.6 ? 'blur(0.3px)' : 'none',
                  animation: allowEnhancedVisualizerEffects && height > 0.5 ? 'pulse 0.5s ease-in-out infinite alternate' : 'none'
                };
                break;
              }
              case 'waves': {
                visualizerStyle = {
                  width: `${barWidth}px`,
                  height: `${height * maxHeight}px`,
                  borderRadius: `${barWidth}px`,
                  transform: `scaleY(${0.2 + height * 0.8}) scaleX(${0.8 + height * 0.4})`,
                  filter: allowEnhancedVisualizerEffects && height > 0.5 ? `blur(${height * 0.8}px)` : 'none',
                  boxShadow: allowEnhancedVisualizerEffects && height > 0.4 ? 
                    `0 0 ${height * 12}px ${height * 4}px ${dynamicColors.accent || CSS_COLOR_PURE_WHITE}` : 'none',
                  animation: allowEnhancedVisualizerEffects && height > 0.6 ? 'wave 0.8s ease-in-out infinite' : 'none'
                };
                break;
              }
              case 'sparkle': {
                const sparkleSize = Math.max(4, height * 20);
                visualizerStyle = {
                  width: `${sparkleSize}px`,
                  height: `${sparkleSize}px`,
                  borderRadius: '50%',
                  transform: `scale(${0.2 + height * 0.8}) rotate(${height * 720 + index * 45}deg)`,
                  boxShadow: allowEnhancedVisualizerEffects && height > 0.2 ? 
                    `0 0 ${height * 20}px ${height * 6}px ${dynamicColors.accent || CSS_COLOR_PURE_WHITE}` : 'none',
                  filter: allowEnhancedVisualizerEffects && height > 0.5 ? 'blur(0.2px)' : 'none',
                  animation: allowEnhancedVisualizerEffects && height > 0.4 ? `sparkle ${0.4 + height * 0.6}s ease-in-out infinite` : 'none',
                  background: `radial-gradient(circle, ${dynamicColors.accent || CSS_COLOR_PURE_WHITE} 0%, transparent 70%)`
                };
                break;
              }
              default: { // bars
                const barHeight = height * maxHeight;
                visualizerStyle = {
                  width: `${barWidth}px`,
                  height: `${barHeight}px`,
                  borderRadius: `${barWidth / 2}px`,
                  transform: `scaleY(${0.1 + height * 0.9}) scaleX(${0.9 + height * 0.2})`,
                  boxShadow: allowEnhancedVisualizerEffects && height > 0.3 ? 
                    `0 0 ${height * 12}px ${height * 3}px ${dynamicColors.accent || CSS_COLOR_PURE_WHITE}` : 'none',
                  filter: allowEnhancedVisualizerEffects && height > 0.7 ? 'blur(0.2px)' : 'none',
                  animation: allowEnhancedVisualizerEffects && height > 0.5 ? `barPulse ${0.3 + height * 0.4}s ease-in-out infinite alternate` : 'none',
                  background: height > 0.6 ? 
                    `linear-gradient(180deg, ${dynamicColors.accent || CSS_COLOR_PURE_WHITE} 0%, ${dynamicColors.primary || CSS_SPOTIFY_PRIMARY} 100%)` :
                    (spotifySettings.dynamicColors && currentTrack?.album?.images?.[0]?.url 
                      ? dynamicColors.accent 
                      : CSS_COLOR_PURE_WHITE_90)
                };
                break;
              }
            }
            
            return (
              <div
                key={index}
                className={`visualizer-bar visualizer-${spotifySettings.visualizerType || 'bars'}`}
                style={{
                  ...visualizerStyle,
                  animationDelay: `${index * 0.03}s`,
                  opacity: height > 0 ? 0.6 + height * 0.4 : 0.15,
                  transition: allowEnhancedVisualizerEffects
                    ? 'all 0.08s cubic-bezier(0.4, 0, 0.2, 1)'
                    : 'transform 0.16s linear, opacity 0.16s linear',
                  zIndex: Math.floor(height * 10)
                }}
              />
            );
          })}
        </div>
      )}

      <div className="wee-spotify-widget__shell">
        {isConnected && (
          <SpotifyWidgetChrome
            currentPage={currentPage}
            onNavigatePlayer={() => setCurrentPage('player')}
            onNavigateBrowse={() => setCurrentPage('browse')}
            onNavigateSettings={() => setCurrentPage('settings')}
            searchQuery={searchQuery}
            onSearchChange={(v) => setSearchQuery(v)}
            onSearchFocus={() => {
              if (currentPage === 'player') setCurrentPage('browse');
            }}
            reducedMotion={reducedMotion}
            searchExpanded={searchExpanded}
            onSearchExpandedChange={setSearchExpanded}
          />
        )}

        <div className="widget-content wee-spotify-widget__body">
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
          <div className="flex min-h-0 w-full flex-1 flex-col gap-1">
            <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col">
            <AnimatePresence mode="wait" initial={false}>
              {currentPage === 'player' && (
                <m.div
                  key="player"
                  initial={reducedMotion ? false : { opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reducedMotion ? undefined : { opacity: 0, scale: 1.01 }}
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
                  initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: reducedMotion ? 0.12 : 0.2 }}
                  className="browse-page flex min-h-0 min-w-0 flex-1 flex-col"
                >
                  <SpotifyBrowseView
                    loading={spotify.loading}
                    isFreeTierConnected={isFreeTierConnected}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onSearchSubmit={handleSearch}
                    activeTab={activeTab}
                    onTabPlaylists={() => setActiveTab('playlists')}
                    onTabSongs={() => setActiveTab('songs')}
                    onTabSearch={() => setActiveTab('search')}
                    playlists={playlists}
                    savedTracks={savedTracks}
                    searchResults={searchResults}
                    onPlayPlaylist={handlePlayPlaylist}
                    onPlayTrack={handlePlayTrack}
                    gridWide={size.width > 520}
                    reducedMotion={reducedMotion}
                  />
                </m.div>
              )}
              {currentPage === 'settings' && (
                <m.div
                  key="settings"
                  initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
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
                    onVisualizerTypeChange={handleVisualizerTypeChange}
                    getVisualizerOptionClass={getVisualizerOptionClass}
                  />
                </m.div>
              )}
            </AnimatePresence>
            </div>

            {currentPage !== 'player' && currentTrack && (
              <SpotifyMiniPlayerBar
                track={currentTrack}
                artistLine={artistLine}
                albumArtUrl={currentTrack?.album?.images?.[0]?.url}
                isPlaying={isPlaying}
                onOpenPlayer={() => setCurrentPage('player')}
                onTogglePlay={() => spotifyManager.togglePlayback()}
                disabled={isFreeTierConnected}
                reducedMotion={reducedMotion}
              />
            )}
          </div>
        )}
      </div>
      </div>

      {/* Resize Handle */}
      <div 
        className="resize-handle"
        onPointerDown={handleResizePointerDown}
        aria-label="Resize Spotify widget"
      >
        ↙
      </div>
    </div>
  );
};

export default FloatingSpotifyWidget; 
