import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSpotifyState, useFloatingWidgetsState } from '../../utils/useConsolidatedAppHooks';
import useAnimationActivity from '../../hooks/useAnimationActivity';
import { useFloatingWidgetFrame } from '../../hooks/useFloatingWidgetFrame';
import { usePlaybackSeek } from '../../hooks/usePlaybackSeek';
import WToggle from '../../ui/WToggle';
import Slider from '../../ui/Slider';
import SpotifyScrollLabel from '../../ui/SpotifyScrollLabel';
import './FloatingSpotifyWidget.css';
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
  const [activeTab, setActiveTab] = useState('playlists'); // 'playlists', 'songs', 'search'
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
    if (!isVisible || !isAppActive || currentPage !== 'player' || !isPlaying) {
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
  }, [isVisible, isAppActive, currentPage, isPlaying, updateVisualizer, visualizerFrameThrottleMs]);

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
      className={`floating-spotify-widget ${currentPage === 'player' ? 'floating-spotify-widget--player' : ''} ${isFreeTierConnected ? 'floating-spotify-widget--free-tier' : ''} ${isPremium ? 'floating-spotify-widget--premium-tier' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${size.width < 300 ? 'small-widget' : size.width < 450 ? 'medium-widget' : 'large-widget'} ${hasDynamicAlbumColors ? 'has-dynamic-colors' : ''}`}
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

      {/* Visualizer (player page only) — not a drag surface */}
      {currentPage === 'player' && (
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

              {/* Widget Content */}
        <div className="widget-content">

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

        {/* Right Sidebar Navigation - Peek button style */}
        <div className="sidebar-navigation-right">
          <div className="sidebar-peek-button">
            <span className="peek-icon">☰</span>
          </div>
          <div className="sidebar-menu">
            <button 
              className={`sidebar-btn ${currentPage === 'player' ? 'active' : ''}`}
              onClick={() => setCurrentPage('player')}
              title="Now Playing"
            >
              <span className="sidebar-icon">▶</span>
              <span className="sidebar-label">Now Playing</span>
            </button>
            <button 
              className={`sidebar-btn ${currentPage === 'browse' ? 'active sidebar-btn-dark-active' : ''}`}
              onClick={() => setCurrentPage('browse')}
              title="Browse Music"
            >
              <span className="sidebar-icon">📚</span>
              <span className="sidebar-label">Browse</span>
            </button>
            <button 
              className={`sidebar-btn ${currentPage === 'settings' ? 'active sidebar-btn-dark-active' : ''}`}
              onClick={() => setCurrentPage('settings')}
              title="Widget Settings"
            >
              <span className="sidebar-icon">⚙️</span>
              <span className="sidebar-label">Settings</span>
            </button>
          </div>
        </div>

        {/* Player Page */}
        {currentPage === 'player' && (
          <div className="player-page">
            {/* Track Info in Modern Card */}
            {currentTrack ? (
              <div 
                className={`track-info-card ${size.width < 300 ? 'flex-col items-center text-center' : 'flex-row items-start text-left'}`}
              >
                <div 
                  className={`track-artwork-large ${size.width < 300 ? 'w-20 h-20 mb-3' : 'w-30 h-30'}`}
                >
                  {currentTrack.album?.images?.[0]?.url ? (
                    <img src={currentTrack.album.images[0].url} alt="Album Art" />
                  ) : (
                    <div className="no-artwork-large">🎵</div>
                  )}
                </div>
                <div className="track-details-modern">
                  <SpotifyScrollLabel
                    text={currentTrack.name}
                    className={`track-title-modern spotify-scroll-label--title ${size.width < 300 ? 'spotify-scroll-label--compact' : ''}`}
                  />
                  <SpotifyScrollLabel
                    text={artistLine}
                    className={`track-artist-modern spotify-scroll-label--artist ${size.width < 300 ? 'spotify-scroll-label--compact' : ''}`}
                  />
                  {currentTrack.album && (
                    <SpotifyScrollLabel
                      text={currentTrack.album.name}
                      className={`track-album-modern spotify-scroll-label--album ${size.width < 300 ? 'spotify-scroll-label--compact' : ''}`}
                    />
                  )}
                </div>

                {/* Progress Bar and Controls for Small Widgets */}
                {size.width < 300 && currentTrack && (
                  <div className="w-full mt-4 space-y-3">
                    {/* Progress Bar */}
                    <div
                      className={`progress-container-modern ${isSeeking ? 'seeking' : ''} ${isFreeTierConnected ? 'progress-container-modern--free-readonly' : ''}`}
                    >
                      <div 
                        ref={progressBarRef}
                        className="progress-bar-modern bg-white/20" 
                        onPointerDown={handleProgressBarPointerDown}
                      >
                        <div 
                          className="progress-fill-modern bg-[rgb(var(--spotify-green-rgb))]"
                          style={{
                            width: `${((isSeeking ? seekPosition : (spotify.progress || 0)) / (spotify.duration || 1)) * 100}%`
                          }}
                        />
                        <div 
                          className="progress-handle-modern bg-white"
                          style={{ 
                            left: `${((isSeeking ? seekPosition : (spotify.progress || 0)) / (spotify.duration || 1)) * 100}%`
                          }}
                          onPointerDown={handleSeekHandlePointerDown}
                        />
                      </div>
                      <div className="progress-time-modern text-white/80 text-xs">
                        {formatTime(isSeeking ? seekPosition : (spotify.progress || 0))} / {formatTime(spotify.duration || 0)}
                      </div>
                    </div>

                    {/* Playback Controls */}
                    <div className="playback-controls-modern justify-center gap-2">
                      <button 
                        type="button"
                        className="control-btn-modern spotify-playback-btn w-9 h-9 text-sm"
                        disabled={isFreeTierConnected}
                        onClick={spotifyManager.skipToPrevious}
                        title={isFreeTierConnected ? 'Use Spotify app or upgrade to Premium for controls' : 'Previous track'}
                      >
                        ⏮
                      </button>
                      <button 
                        type="button"
                        className="control-btn-modern play-pause-modern spotify-playback-btn spotify-playback-btn-play scale-110 w-12 h-12 text-lg"
                        disabled={isFreeTierConnected}
                        onClick={spotifyManager.togglePlayback}
                        title={isFreeTierConnected ? 'Use Spotify app or upgrade to Premium for controls' : (isPlaying ? 'Pause' : 'Play')}
                      >
                        {isPlaying ? '⏸' : '▶'}
                      </button>
                      <button 
                        type="button"
                        className="control-btn-modern spotify-playback-btn w-9 h-9 text-sm"
                        disabled={isFreeTierConnected}
                        onClick={spotifyManager.skipToNext}
                        title={isFreeTierConnected ? 'Use Spotify app or upgrade to Premium for controls' : 'Next track'}
                      >
                        ⏭
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="no-track-modern">
                <div className="no-track-icon-large">🎵</div>
                <div className="no-track-text-modern text-white">No track playing</div>
                <div className="no-track-subtitle text-white/60">Start playing music to see it here</div>
              </div>
            )}

            {/* Progress Bar and Controls for Larger Widgets */}
            {size.width >= 300 && currentTrack && (
              <>
                {/* Enhanced Progress Bar */}
                <div
                  className={`progress-container-modern ${isSeeking ? 'seeking' : ''} mt-4 ${isFreeTierConnected ? 'progress-container-modern--free-readonly' : ''}`}
                >
                  <div 
                    ref={progressBarRef}
                    className="progress-bar-modern bg-white/20" 
                    onPointerDown={handleProgressBarPointerDown}
                  >
                    <div 
                      className="progress-fill-modern bg-[rgb(var(--spotify-green-rgb))]"
                      style={{
                        width: `${((isSeeking ? seekPosition : (spotify.progress || 0)) / (spotify.duration || 1)) * 100}%`
                      }}
                    />
                    <div 
                      className="progress-handle-modern bg-white"
                      style={{ 
                        left: `${((isSeeking ? seekPosition : (spotify.progress || 0)) / (spotify.duration || 1)) * 100}%`
                      }}
                      onPointerDown={handleSeekHandlePointerDown}
                    />
                  </div>
                  <div className="progress-time-modern text-white/80 text-xs">
                    {formatTime(isSeeking ? seekPosition : (spotify.progress || 0))} / {formatTime(spotify.duration || 0)}
                  </div>
                </div>

                {/* Modern Playback Controls */}
                <div className="playback-controls-modern justify-center gap-3">
                  <button 
                    type="button"
                    className="control-btn-modern spotify-playback-btn w-11 h-11 text-base"
                    disabled={isFreeTierConnected}
                    onClick={spotifyManager.skipToPrevious}
                    title={isFreeTierConnected ? 'Use Spotify app or upgrade to Premium for controls' : 'Previous track'}
                  >
                    ⏮
                  </button>
                  <button 
                    type="button"
                    className="control-btn-modern play-pause-modern spotify-playback-btn spotify-playback-btn-play scale-110 w-14 h-14 text-xl"
                    disabled={isFreeTierConnected}
                    onClick={spotifyManager.togglePlayback}
                    title={isFreeTierConnected ? 'Use Spotify app or upgrade to Premium for controls' : (isPlaying ? 'Pause' : 'Play')}
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>
                  <button 
                    type="button"
                    className="control-btn-modern spotify-playback-btn w-11 h-11 text-base"
                    disabled={isFreeTierConnected}
                    onClick={spotifyManager.skipToNext}
                    title={isFreeTierConnected ? 'Use Spotify app or upgrade to Premium for controls' : 'Next track'}
                  >
                    ⏭
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Browse Page */}
        {currentPage === 'browse' && (
          <div className="browse-page">
            {isFreeTierConnected ? (
              <p className="floating-spotify-widget__browse-free-hint">Tap a row to open in Spotify. Premium unlocks playback from Wee.</p>
            ) : null}
            {/* Modern Search Bar */}
            <div className="search-container-modern">
              <div className="search-bar-modern">
                <input
                  type="text"
                  placeholder="Search songs, artists, or albums..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="search-input-modern text-black bg-white/95"
                />
                <button 
                  className="search-btn-modern text-black bg-white/95 border-white/40"
                  onClick={handleSearch}
                >
                  🔍
                </button>
              </div>
            </div>

            {/* Modern Tab Navigation */}
            <div className="tab-navigation-modern">
              <button 
                className={`tab-btn-modern ${activeTab === 'playlists' ? 'active' : ''} ${activeTab === 'playlists' ? 'text-black bg-white/95' : 'text-white bg-white/20'} border-white/40`}
                onClick={() => setActiveTab('playlists')}
              >
                <span className="tab-icon">📚</span>
                <span className="tab-label">Playlists</span>
              </button>
              <button 
                className={`tab-btn-modern ${activeTab === 'songs' ? 'active' : ''} ${activeTab === 'songs' ? 'text-black bg-white/95' : 'text-white bg-white/20'} border-white/40`}
                onClick={() => setActiveTab('songs')}
              >
                <span className="tab-icon">🎵</span>
                <span className="tab-label">Songs</span>
              </button>
              {searchResults.length > 0 && (
                <button 
                  className={`tab-btn-modern ${activeTab === 'search' ? 'active' : ''} ${activeTab === 'search' ? 'text-black bg-white/95' : 'text-white bg-white/20'} border-white/40`}
                  onClick={() => setActiveTab('search')}
                >
                  <span className="tab-icon">🔍</span>
                  <span className="tab-label">Search</span>
                </button>
              )}
            </div>

            {/* Content Area */}
            <div className="content-area-modern">
              {spotify.loading ? (
                <div className="loading-modern text-white">
                  <div className="loading-spinner"></div>
                  <div>Loading...</div>
                </div>
              ) : (
                <>
                  {/* Playlists Tab */}
                  {activeTab === 'playlists' && (
                    <div className="playlists-grid-modern">
                      {playlists.length === 0 && (
                        <div className="browse-empty-modern text-white/70 text-sm text-center py-6">
                          No playlists loaded. Check your connection or try again later.
                        </div>
                      )}
                      {playlists.slice(0, 8).map((playlist) => (
                        <div 
                          key={playlist.id} 
                          className="playlist-card-modern bg-white/10"
                          onClick={() => handlePlayPlaylist(playlist)}
                        >
                          <div className="playlist-image-modern">
                            {playlist.images?.[0]?.url ? (
                              <img src={playlist.images[0].url} alt={playlist.name} />
                            ) : (
                              <div className="no-playlist-image-modern">📚</div>
                            )}
                          </div>
                          <div className="playlist-info-modern">
                            <div className="playlist-name-modern text-white">{playlist.name}</div>
                            <div className="playlist-tracks-modern text-white/80">{playlist.tracks?.total || 0} tracks</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Songs Tab */}
                  {activeTab === 'songs' && (
                    <div className="songs-list-modern">
                      {savedTracks.length === 0 && (
                        <div className="browse-empty-modern text-white/70 text-sm text-center py-6">
                          No saved tracks yet.
                        </div>
                      )}
                      {savedTracks.slice(0, 8).map((track) => (
                        <div 
                          key={track.id} 
                          className="song-item-modern bg-white/10"
                          onClick={() => handlePlayTrack(track)}
                        >
                          <div className="song-image-modern">
                            {track.album?.images?.[0]?.url ? (
                              <img src={track.album.images[0].url} alt={track.name} />
                            ) : (
                              <div className="no-song-image-modern">🎵</div>
                            )}
                          </div>
                          <div className="song-info-modern">
                            <div className="song-title-modern text-white">{track.name}</div>
                            <div className="song-artist-modern text-white/80">{track.artists?.[0]?.name || 'Unknown Artist'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Search Tab */}
                  {activeTab === 'search' && (
                    <div className="search-results-modern">
                      {searchResults.length === 0 && searchQuery.trim() && (
                        <div className="browse-empty-modern text-white/70 text-sm text-center py-6">
                          No results. Try different keywords.
                        </div>
                      )}
                      {searchResults.slice(0, 8).map((track) => (
                        <div 
                          key={track.id} 
                          className="song-item-modern bg-white/10"
                          onClick={() => handlePlayTrack(track)}
                        >
                          <div className="song-image-modern">
                            {track.album?.images?.[0]?.url ? (
                              <img src={track.album.images[0].url} alt={track.name} />
                            ) : (
                              <div className="no-song-image-modern">🎵</div>
                            )}
                          </div>
                          <div className="song-info-modern">
                            <div className="song-title-modern text-white">{track.name}</div>
                            <div className="song-artist-modern text-white/80">{track.artists?.[0]?.name || 'Unknown Artist'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Settings Page */}
        {currentPage === 'settings' && (
          <div className="settings-page">
            <div className="settings-header">
              <h2 className="settings-title-modern text-white">Widget Settings</h2>
              <p className="settings-subtitle text-white/70">Customize your Spotify widget experience</p>
            </div>

            {isFreeTierConnected ? (
              <div className="floating-spotify-widget__settings-tier-note" role="note">
                <strong className="floating-spotify-widget__settings-tier-note-title">Spotify Free</strong>
                <p>
                  Appearance options below apply to this widget. Playback control from Wee requires Spotify
                  Premium; on Free, use the Spotify app and keep this widget for now playing.
                </p>
              </div>
            ) : null}
            
            <div className="settings-sections">
              {/* Appearance Section */}
              <div className="settings-section-modern">
                <h3 className="section-title text-white">🎨 Appearance</h3>
                
                <div className="setting-item-modern">
                  <WToggle
                    checked={spotifySettings.dynamicColors}
                    onChange={handleDynamicColorsToggle}
                    label="Dynamic Colors from Album Art"
                  />
                  <p className="setting-description text-white/60">
                    Automatically adjust colors based on the current track's album art
                  </p>
                </div>
                
                <div className="setting-item-modern">
                  <WToggle
                    checked={spotifySettings.useBlurredBackground}
                    onChange={handleBlurredBackgroundToggle}
                    label="Blurred Album Art Background"
                  />
                  <p className="setting-description text-white/60">
                    Use the current track's album art as a blurred background
                  </p>
                </div>
                
                {spotifySettings.useBlurredBackground && (
                  <div className="setting-item-modern">
                    <div className="setting-label text-white mb-2">Blur Amount</div>
                    <div className="slider-container">
                      <input
                        type="range"
                        min="0"
                        max="24"
                        step="0.5"
                        value={spotifySettings.blurAmount || 0}
                        onChange={e => handleBlurAmountChange(Number(e.target.value))}
                        className="blur-slider"
                      />
                      <span className="slider-value text-white font-semibold">
                        {spotifySettings.blurAmount || 0}px
                      </span>
                    </div>
                    <p className="setting-description text-white/60">
                      Higher blur makes the album art more blurry. 0px = no blur, 24px = very blurry.
                    </p>
                  </div>
                )}
              </div>

              {/* Behavior Section */}
              <div className="settings-section-modern">
                <h3 className="section-title text-white">⚡ Behavior</h3>
                
                <div className="setting-item-modern">
                  <WToggle
                    checked={spotifySettings.autoShowWidget}
                    onChange={handleAutoShowWidgetToggle}
                    label="Auto-show Widget on Playback"
                  />
                  <p className="setting-description text-white/60">
                    Automatically show the widget when music starts playing
                  </p>
                </div>
              </div>

              {/* Visualizer Section */}
              <div className="settings-section-modern">
                <h3 className="section-title text-white">🎵 Visualizer</h3>
                
                <div className="setting-item-modern">
                  <div className="setting-label text-white mb-2">Visualizer Type</div>
                  <div className="visualizer-options-modern">
                    <button
                      className={getVisualizerOptionClass('bars')}
                      onClick={() => handleVisualizerTypeChange('bars')}
                    >
                      Bars
                    </button>
                    <button
                      className={getVisualizerOptionClass('circles')}
                      onClick={() => handleVisualizerTypeChange('circles')}
                    >
                      Circles
                    </button>
                    <button
                      className={getVisualizerOptionClass('waves')}
                      onClick={() => handleVisualizerTypeChange('waves')}
                    >
                      Waves
                    </button>
                    <button
                      className={getVisualizerOptionClass('sparkle')}
                      onClick={() => handleVisualizerTypeChange('sparkle')}
                    >
                      Sparkle
                    </button>
                  </div>
                </div>
              </div>



              {/* Track Info Panel Section */}
              <div className="settings-section-modern">
                <h3 className="section-title text-white">📋 Track Info Panel</h3>
                
                <div className="setting-item-modern">
                  <div className="setting-label text-white mb-2">Opacity</div>
                  <div className="slider-container">
                    <Slider
                      value={spotifySettings.trackInfoPanelOpacity}
                      min={0.1}
                      max={1}
                      step={0.1}
                      onChange={(value) => spotifyManager.updateSpotifySettings({ trackInfoPanelOpacity: value })}
                    />
                    <span className="slider-value text-white font-semibold">
                      {Math.round(spotifySettings.trackInfoPanelOpacity * 100)}%
                    </span>
                  </div>
                </div>
                
                <div className="setting-item-modern">
                  <div className="setting-label text-white mb-2">Blur</div>
                  <div className="slider-container">
                    <Slider
                      value={spotifySettings.trackInfoPanelBlur}
                      min={0}
                      max={30}
                      step={1}
                      onChange={(value) => spotifyManager.updateSpotifySettings({ trackInfoPanelBlur: value })}
                    />
                    <span className="slider-value text-white font-semibold">
                      {spotifySettings.trackInfoPanelBlur}px
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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
