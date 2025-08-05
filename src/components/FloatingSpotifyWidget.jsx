import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSpotifyStore } from '../utils/useSpotifyStore';
import useApiIntegrationsStore from '../utils/useApiIntegrationsStore';
import useFloatingWidgetStore from '../utils/useFloatingWidgetStore';
import WToggle from '../ui/WToggle';
import Slider from '../ui/Slider';
import './FloatingSpotifyWidget.css';

const FloatingSpotifyWidget = ({ isVisible, onClose }) => {
  const {
    currentTrack,
    isPlaying,
    playlists,
    savedTracks,
    searchResults,
    isLoading,
    togglePlayback,
    skipToNext,
    skipToPrevious,
    seekToPosition,
    refreshPlaybackState,
    searchTracks,
    loadPlaylists,
    loadSavedTracks,
    playTrack,
    playPlaylist
  } = useSpotifyStore();

  const { spotify, updateSpotifySettings } = useApiIntegrationsStore();
  const { spotifyPosition, setSpotifyPosition } = useFloatingWidgetStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [size, setSize] = useState({ width: 280, height: 400 });
  const [audioData, setAudioData] = useState(new Array(32).fill(0));
  const [currentPage, setCurrentPage] = useState('player'); // 'player', 'browse', or 'settings'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('playlists'); // 'playlists', 'songs', 'search'
  const [dynamicBackground, setDynamicBackground] = useState(null);
  const [blurredBackground, setBlurredBackground] = useState(null);
  const [dynamicColors, setDynamicColors] = useState({
    primary: '#1db954',
    secondary: '#1ed760',
    accent: '#ffffff',
    text: '#ffffff',
    textSecondary: '#e0e0e0'
  });
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const widgetRef = useRef(null);
  const animationRef = useRef(null);

  // Simple dragging logic
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.control-btn') || e.target.closest('.page-btn') || e.target.closest('.tab-btn') || e.target.closest('.progress-bar') || e.target.closest('.resize-handle')) return;
    
    setIsDragging(true);
    const rect = widgetRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    setSpotifyPosition({ x: newX, y: newY });
  }, [isDragging, dragOffset, setSpotifyPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Resizing logic
  const handleResizeStart = useCallback((e) => {
    e.stopPropagation();
    setIsResizing(true);
    const rect = widgetRef.current.getBoundingClientRect();
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: rect.width,
      height: rect.height
    });
  }, []);

  const handleResizeMove = useCallback((e) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;
    
    const newWidth = Math.max(250, Math.min(500, resizeStart.width + deltaX));
    const newHeight = Math.max(300, Math.min(600, resizeStart.height + deltaY));
    
    setSize({ width: newWidth, height: newHeight });
  }, [isResizing, resizeStart]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Extract colors from album art using Canvas API with improved contrast
  const extractColorsFromImage = (imageUrl) => {
    return new Promise((resolve) => {
      console.log('[COLOR EXTRACTION] Starting extraction for:', imageUrl);
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          console.log('[COLOR EXTRACTION] Image loaded successfully, dimensions:', img.width, 'x', img.height);
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set canvas size to a reasonable size for processing
          const maxSize = 100;
          const scale = Math.min(maxSize / img.width, maxSize / img.height);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          
          // Draw the image on canvas
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Sample colors from the image with better color detection
          const colors = [];
          const step = 5; // Sample more frequently for better color detection
          
          for (let i = 0; i < data.length; i += step * 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // Only consider non-transparent pixels with sufficient opacity
            // and avoid very dark or very light pixels for better color representation
            if (a > 128 && (r + g + b) > 100 && (r + g + b) < 700) {
              colors.push({ r, g, b });
            }
          }
          
          if (colors.length > 0) {
            // Calculate average color
            const avgColor = colors.reduce((acc, color) => {
              acc.r += color.r;
              acc.g += color.g;
              acc.b += color.b;
              return acc;
            }, { r: 0, g: 0, b: 0 });
            
            avgColor.r = Math.round(avgColor.r / colors.length);
            avgColor.g = Math.round(avgColor.g / colors.length);
            avgColor.b = Math.round(avgColor.b / colors.length);
            
            // Boost color saturation for more vibrant appearance
            const boost = 1.3;
            avgColor.r = Math.min(255, Math.round(avgColor.r * boost));
            avgColor.g = Math.min(255, Math.round(avgColor.g * boost));
            avgColor.b = Math.min(255, Math.round(avgColor.b * boost));
            
            console.log('[COLOR EXTRACTION] Average color:', avgColor);
            
            // Create Apple Music-style color palette
            const primaryColor = `rgb(${avgColor.r}, ${avgColor.g}, ${avgColor.b})`;
            const secondaryColor = `rgb(${Math.max(0, avgColor.r - 40)}, ${Math.max(0, avgColor.g - 40)}, ${Math.max(0, avgColor.b - 40)})`;
            const accentColor = `rgb(${Math.min(255, avgColor.r + 50)}, ${Math.min(255, avgColor.g + 50)}, ${Math.min(255, avgColor.b + 50)})`;
            
            // Improved text color calculation for better contrast
            const brightness = (avgColor.r * 299 + avgColor.g * 587 + avgColor.b * 114) / 1000;
            
            // Use more contrasting colors for text
            let textColor, textSecondaryColor;
            if (brightness > 128) {
              // Light background - use dark text
              textColor = '#000000';
              textSecondaryColor = '#333333';
            } else {
              // Dark background - use light text
              textColor = '#ffffff';
              textSecondaryColor = '#e0e0e0';
            }

            // Create a vibrant gradient using the extracted color
            const gradient = `linear-gradient(135deg, 
              rgba(${avgColor.r}, ${avgColor.g}, ${avgColor.b}, 1) 0%, 
              rgba(${Math.max(0, avgColor.r - 60)}, ${Math.max(0, avgColor.g - 60)}, ${Math.max(0, avgColor.b - 60)}, 0.95) 30%,
              rgba(${Math.max(0, avgColor.r - 120)}, ${Math.max(0, avgColor.g - 120)}, ${Math.max(0, avgColor.b - 120)}, 0.9) 70%,
              rgba(${Math.max(0, avgColor.r - 180)}, ${Math.max(0, avgColor.g - 180)}, ${Math.max(0, avgColor.b - 180)}, 0.85) 100%)`;
            
            // Create blurred background style
            const blurredBackground = `linear-gradient(135deg, 
              rgba(${avgColor.r}, ${avgColor.g}, ${avgColor.b}, 0.8) 0%, 
              rgba(${Math.max(0, avgColor.r - 40)}, ${Math.max(0, avgColor.g - 40)}, ${Math.max(0, avgColor.b - 40)}, 0.6) 100%)`;
            
            console.log('[COLOR EXTRACTION] Created gradient:', gradient);
            console.log('[COLOR EXTRACTION] Created blurred background:', blurredBackground);
            
            resolve({
              gradient,
              blurredBackground,
              colors: {
                primary: primaryColor,
                secondary: secondaryColor,
                accent: accentColor,
                text: textColor,
                textSecondary: textSecondaryColor
              }
            });
          } else {
            console.log('[COLOR EXTRACTION] No valid colors found');
            resolve(null);
          }
        } catch (error) {
          console.error('[COLOR EXTRACTION] Failed to extract colors:', error);
          resolve(null);
        }
      };
      
      img.onerror = (error) => {
        console.error('[COLOR EXTRACTION] Failed to load image:', error);
        resolve(null);
      };
      
      img.src = imageUrl;
    });
  };

  // Update dynamic background when track changes
  useEffect(() => {
    console.log('[BACKGROUND UPDATE] Track changed:', currentTrack?.title, 'Album art:', currentTrack?.albumArt);
    
    if (currentTrack?.albumArt && spotify.settings.dynamicColors && currentPage === 'player') {
      extractColorsFromImage(currentTrack.albumArt).then(result => {
        if (result) {
          console.log('[BACKGROUND UPDATE] Setting dynamic background:', result.gradient);
          console.log('[BACKGROUND UPDATE] Setting blurred background:', result.blurredBackground);
          console.log('[BACKGROUND UPDATE] Setting dynamic colors:', result.colors);
          setDynamicBackground(result.gradient);
          setBlurredBackground(result.blurredBackground);
          setDynamicColors(result.colors);
        }
      });
    } else {
      console.log('[BACKGROUND UPDATE] No album art or dynamic colors disabled, clearing dynamic background');
      setDynamicBackground(null);
      setBlurredBackground(null);
      setDynamicColors({
        primary: '#1db954',
        secondary: '#1ed760',
        accent: '#ffffff',
        text: '#ffffff',
        textSecondary: '#e0e0e0'
      });
    }
  }, [currentTrack?.albumArt, spotify.settings.dynamicColors, currentPage]);

  // Music-synced visualizer
  const updateVisualizer = () => {
    if (!isPlaying || !currentTrack) {
      setAudioData(new Array(32).fill(0));
      return;
    }

    // Simulate audio data based on current playback
    const time = Date.now() * 0.001;
    const newData = new Array(32).fill(0).map((_, i) => {
      const frequency = (i + 1) * 0.1;
      const amplitude = Math.sin(time * frequency) * 0.5 + 0.5;
      const random = Math.random() * 0.3;
      return Math.min(1, amplitude + random);
    });
    
    setAudioData(newData);
  };

  // Animation loop for visualizer
  useEffect(() => {
    const animate = () => {
      updateVisualizer();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    if (isVisible) {
      animate();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, isPlaying, currentTrack]);

  // Refresh playback state and load data periodically
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      refreshPlaybackState();
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isVisible, refreshPlaybackState]);

  // Load playlists and saved tracks when browsing page is opened
  useEffect(() => {
    if (isVisible && currentPage === 'browse') {
      loadPlaylists();
      loadSavedTracks();
    }
  }, [isVisible, currentPage, loadPlaylists, loadSavedTracks]);

  // Global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Global mouse event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Handle search
  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchTracks(searchQuery);
      setActiveTab('search');
    }
  };

  // Handle play track
  const handlePlayTrack = async (trackId) => {
    try {
      await playTrack(trackId);
      setCurrentPage('player');
    } catch (error) {
      console.error('Failed to play track:', error);
    }
  };

  // Handle play playlist
  const handlePlayPlaylist = async (playlistId) => {
    try {
      await playPlaylist(playlistId);
      setCurrentPage('player');
    } catch (error) {
      console.error('Failed to play playlist:', error);
    }
  };

  // Enhanced seeker bar interaction with draggable circle
  const handleSeekerMouseDown = (e) => {
    if (!currentTrack || !currentTrack.duration) return;
    
    setIsSeeking(true);
    handleSeekerMove(e);
  };

  const handleSeekerMove = (e) => {
    if (!isSeeking || !currentTrack || !currentTrack.duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newPosition = Math.floor(currentTrack.duration * percentage);
    
    setSeekPosition(newPosition);
  };

  const handleSeekerMouseUp = () => {
    if (!isSeeking) return;
    
    setIsSeeking(false);
    seekToPosition(seekPosition);
  };

  // Format time helper function
  const formatTime = (ms) => {
    if (!ms) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  // Determine background based on current page
  const getBackground = () => {
    if (currentPage === 'browse' || currentPage === 'settings') {
      return 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)';
    }
    
    if (spotify.settings.useBlurredBackground && currentTrack?.albumArt) {
      return `url(${currentTrack.albumArt}) center/cover, ${blurredBackground || 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)'}`;
    }
    
    return dynamicBackground || 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)';
  };

  // Settings handlers
  const handleDynamicColorsToggle = (checked) => {
    updateSpotifySettings({ dynamicColors: checked });
  };

  const handleBlurredBackgroundToggle = (checked) => {
    updateSpotifySettings({ useBlurredBackground: checked });
  };

  const handleBlurAmountChange = (value) => {
    updateSpotifySettings({ blurAmount: value });
  };

  const handleAutoShowWidgetToggle = (checked) => {
    updateSpotifySettings({ autoShowWidget: checked });
  };

  const handleVisualizerTypeChange = (type) => {
    updateSpotifySettings({ visualizerType: type });
  };

  return (
    <div 
      className={`floating-spotify-widget ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${spotify.settings.useBlurredBackground && currentTrack?.albumArt && currentPage === 'player' ? 'blurred-bg' : ''}`}
      ref={widgetRef}
      style={{
        left: `${spotifyPosition.x}px`,
        top: `${spotifyPosition.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        background: getBackground(),
        '--blur-amount': spotify.settings.useBlurredBackground && currentTrack?.albumArt && currentPage === 'player' ? `${spotify.settings.blurAmount}px` : '20px',
        '--glow-primary': spotify.settings.dynamicColors && currentTrack?.albumArt && currentPage === 'player' ? dynamicColors.primary : '#1db954',
        '--glow-secondary': spotify.settings.dynamicColors && currentTrack?.albumArt && currentPage === 'player' ? dynamicColors.secondary : '#1ed760',
        '--glow-opacity': spotify.settings.dynamicColors && currentTrack?.albumArt && currentPage === 'player' ? '0.4' : '0.3',
        '--glow-brightness': spotify.settings.dynamicColors && currentTrack?.albumArt && currentPage === 'player' ? '1.1' : '1'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Visualizer - only show on player page */}
      {currentPage === 'player' && (
        <div className={`visualizer visualizer-${spotify.settings.visualizerType || 'bars'}`}>
          {audioData.map((height, index) => (
            <div
              key={index}
              className={`visualizer-${spotify.settings.visualizerType || 'bars'}`}
              style={{
                height: spotify.settings.visualizerType === 'circles' ? `${height * 20}px` : `${height * 100}%`,
                width: spotify.settings.visualizerType === 'circles' ? `${height * 20}px` : '4px',
                animationDelay: `${index * 0.1}s`,
                backgroundColor: dynamicColors.accent
              }}
            />
          ))}
        </div>
      )}

      {/* Widget Content */}
      <div className="widget-content">
        {/* Header with page navigation */}
        <div className="widget-header">
          {/* Modern Page Navigation */}
          <div className="page-navigation">
            <button 
              className={`page-btn ${currentPage === 'player' ? 'active' : ''}`}
              onClick={() => setCurrentPage('player')}
              title="Now Playing"
              style={{
                color: currentPage === 'player' ? dynamicColors.text : dynamicColors.textSecondary,
                backgroundColor: currentPage === 'player' ? dynamicColors.primary : 'transparent',
                borderColor: dynamicColors.accent
              }}
            >
              <span className="page-icon">▶</span>
              <span className="page-label">Now Playing</span>
            </button>
            <button 
              className={`page-btn ${currentPage === 'browse' ? 'active' : ''}`}
              onClick={() => setCurrentPage('browse')}
              title="Browse Music"
              style={{
                color: currentPage === 'browse' ? '#000000' : '#ffffff',
                backgroundColor: currentPage === 'browse' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.2)',
                borderColor: '#1db954'
              }}
            >
              <span className="page-icon">📚</span>
              <span className="page-label">Browse</span>
            </button>
            <button 
              className={`page-btn ${currentPage === 'settings' ? 'active' : ''}`}
              onClick={() => setCurrentPage('settings')}
              title="Widget Settings"
              style={{
                color: currentPage === 'settings' ? '#000000' : '#ffffff',
                backgroundColor: currentPage === 'settings' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.2)',
                borderColor: '#1db954'
              }}
            >
              <span className="page-icon">⚙️</span>
              <span className="page-label">Settings</span>
            </button>
          </div>
        </div>

        {/* Player Page */}
        {currentPage === 'player' && (
          <>
            {/* Track Info in Pill */}
            {currentTrack ? (
              <div 
                className="track-info-pill"
                style={{
                  opacity: spotify.settings.trackInfoPanelOpacity,
                  backdropFilter: `blur(${spotify.settings.trackInfoPanelBlur}px)`
                }}
              >
                <div className="track-artwork">
                  {currentTrack.albumArt ? (
                    <img src={currentTrack.albumArt} alt="Album Art" />
                  ) : (
                    <div className="no-artwork">🎵</div>
                  )}
                </div>
                <div className="track-details">
                  <div className="track-title" style={{ color: '#ffffff' }}>{currentTrack.name || currentTrack.title}</div>
                  <div className="track-artist" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{currentTrack.artist}</div>
                  {currentTrack.album && (
                    <div className="track-album" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{currentTrack.album}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="no-track">
                <div className="no-track-icon">🎵</div>
                <div className="no-track-text" style={{ color: dynamicColors.text }}>No track playing</div>
              </div>
            )}

            {/* Enhanced Progress Bar with Draggable Circle */}
            {currentTrack && (
              <div className="progress-container">
                <div 
                  className="progress-bar" 
                  style={{ backgroundColor: dynamicColors.secondary }}
                  onMouseDown={handleSeekerMouseDown}
                  onMouseMove={handleSeekerMove}
                  onMouseUp={handleSeekerMouseUp}
                  onMouseLeave={handleSeekerMouseUp}
                >
                  <div 
                    className="progress-fill"
                    style={{
                      width: `${((isSeeking ? seekPosition : (currentTrack.progress || 0)) / (currentTrack.duration || 1)) * 100}%`,
                      backgroundColor: dynamicColors.primary
                    }}
                  />
                  <div 
                    className="progress-handle"
                    style={{ 
                      backgroundColor: dynamicColors.accent,
                      left: `${((isSeeking ? seekPosition : (currentTrack.progress || 0)) / (currentTrack.duration || 1)) * 100}%`
                    }}
                  />
                </div>
                <div className="progress-time" style={{ color: dynamicColors.textSecondary }}>
                  {formatTime(isSeeking ? seekPosition : (currentTrack.progress || 0))} / {formatTime(currentTrack.duration || 0)}
                </div>
              </div>
            )}

            {/* Playback Controls */}
            <div className="playback-controls">
              <button 
                className="control-btn"
                onClick={skipToPrevious}
                title="Previous Track"
                style={{
                  color: dynamicColors.text,
                  backgroundColor: dynamicColors.primary,
                  borderColor: dynamicColors.accent
                }}
              >
                ⏮
              </button>
              <button 
                className="control-btn play-pause"
                onClick={togglePlayback}
                title={isPlaying ? 'Pause' : 'Play'}
                style={{
                  color: dynamicColors.text,
                  backgroundColor: dynamicColors.primary,
                  borderColor: dynamicColors.accent,
                  transform: 'scale(1.1)'
                }}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button 
                className="control-btn"
                onClick={skipToNext}
                title="Next Track"
                style={{
                  color: dynamicColors.text,
                  backgroundColor: dynamicColors.primary,
                  borderColor: dynamicColors.accent
                }}
              >
                ⏭
              </button>
            </div>
          </>
        )}

        {/* Browse Page */}
        {currentPage === 'browse' && (
          <div className="browse-content">
            {/* Search Bar */}
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search songs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="search-input"
                style={{ color: '#000000', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
              />
              <button 
                className="search-btn" 
                onClick={handleSearch}
                style={{
                  color: '#000000',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderColor: '#1db954'
                }}
              >
                🔍
              </button>
            </div>

            {/* Modern Tab Navigation in Pill */}
            <div className="tab-navigation-pill">
              <button 
                className={`tab-btn ${activeTab === 'playlists' ? 'active' : ''}`}
                onClick={() => setActiveTab('playlists')}
                style={{
                  color: activeTab === 'playlists' ? '#000000' : '#ffffff',
                  backgroundColor: activeTab === 'playlists' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.2)',
                  borderColor: '#1db954'
                }}
              >
                Playlists
              </button>
              <button 
                className={`tab-btn ${activeTab === 'songs' ? 'active' : ''}`}
                onClick={() => setActiveTab('songs')}
                style={{
                  color: activeTab === 'songs' ? '#000000' : '#ffffff',
                  backgroundColor: activeTab === 'songs' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.2)',
                  borderColor: '#1db954'
                }}
              >
                Songs
              </button>
              {searchResults.length > 0 && (
                <button 
                  className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
                  onClick={() => setActiveTab('search')}
                  style={{
                    color: activeTab === 'search' ? '#000000' : '#ffffff',
                    backgroundColor: activeTab === 'search' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.2)',
                    borderColor: '#1db954'
                  }}
                >
                  Search
                </button>
              )}
            </div>

            {/* Content Area */}
            <div className="content-area">
              {isLoading ? (
                <div className="loading" style={{ color: '#ffffff' }}>Loading...</div>
              ) : (
                <>
                  {/* Playlists Tab */}
                  {activeTab === 'playlists' && (
                    <div className="playlists-list">
                      {playlists.slice(0, 8).map((playlist) => (
                        <div 
                          key={playlist.id} 
                          className="playlist-item"
                          onClick={() => handlePlayPlaylist(playlist.id)}
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                        >
                          <div className="playlist-image">
                            {playlist.images?.[0]?.url ? (
                              <img src={playlist.images[0].url} alt={playlist.name} />
                            ) : (
                              <div className="no-playlist-image">📚</div>
                            )}
                          </div>
                          <div className="playlist-info">
                            <div className="playlist-name" style={{ color: '#ffffff' }}>{playlist.name}</div>
                            <div className="playlist-tracks" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{playlist.tracks?.total || 0} tracks</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Songs Tab */}
                  {activeTab === 'songs' && (
                    <div className="songs-list">
                      {savedTracks.slice(0, 8).map((track) => (
                        <div 
                          key={track.id} 
                          className="song-item"
                          onClick={() => handlePlayTrack(track.id)}
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                        >
                          <div className="song-image">
                            {track.album?.images?.[0]?.url ? (
                              <img src={track.album.images[0].url} alt={track.name} />
                            ) : (
                              <div className="no-song-image">🎵</div>
                            )}
                          </div>
                          <div className="song-info">
                            <div className="song-title" style={{ color: '#ffffff' }}>{track.name}</div>
                            <div className="song-artist" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{track.artists?.[0]?.name || 'Unknown Artist'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Search Tab */}
                  {activeTab === 'search' && (
                    <div className="search-results-list">
                      {searchResults.slice(0, 8).map((track) => (
                        <div 
                          key={track.id} 
                          className="song-item"
                          onClick={() => handlePlayTrack(track.id)}
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                        >
                          <div className="song-image">
                            {track.album?.images?.[0]?.url ? (
                              <img src={track.album.images[0].url} alt={track.name} />
                            ) : (
                              <div className="no-song-image">🎵</div>
                            )}
                          </div>
                          <div className="song-info">
                            <div className="song-title" style={{ color: '#ffffff' }}>{track.name}</div>
                            <div className="song-artist" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{track.artists?.[0]?.name || 'Unknown Artist'}</div>
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
          <div className="settings-content">
            <div className="settings-section">
              <h3 className="settings-title" style={{ color: '#ffffff' }}>Widget Appearance</h3>
              
              <div className="setting-item">
                <WToggle
                  checked={spotify.settings.dynamicColors}
                  onChange={handleDynamicColorsToggle}
                  label="Dynamic Colors from Album Art"
                />
              </div>
              
              <div className="setting-item">
                <WToggle
                  checked={spotify.settings.useBlurredBackground}
                  onChange={handleBlurredBackgroundToggle}
                  label="Blurred Album Art Background"
                />
              </div>
              
              {spotify.settings.useBlurredBackground && (
                <div className="setting-item">
                  <Slider
                    label="Blur Amount"
                    value={spotify.settings.blurAmount}
                    min={10}
                    max={50}
                    step={5}
                    onChange={handleBlurAmountChange}
                  />
                </div>
              )}
              
              <div className="setting-item">
                <WToggle
                  checked={spotify.settings.autoShowWidget}
                  onChange={handleAutoShowWidgetToggle}
                  label="Auto-show Widget on Playback"
                />
              </div>

              <div className="setting-item">
                <div style={{ color: '#ffffff', marginBottom: 8 }}>Visualizer Type</div>
                <div className="visualizer-options">
                  <button
                    className={`visualizer-option ${spotify.settings.visualizerType === 'bars' ? 'active' : ''}`}
                    onClick={() => handleVisualizerTypeChange('bars')}
                    style={{
                      color: spotify.settings.visualizerType === 'bars' ? '#000000' : '#ffffff',
                      backgroundColor: spotify.settings.visualizerType === 'bars' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    Bars
                  </button>
                  <button
                    className={`visualizer-option ${spotify.settings.visualizerType === 'circles' ? 'active' : ''}`}
                    onClick={() => handleVisualizerTypeChange('circles')}
                    style={{
                      color: spotify.settings.visualizerType === 'circles' ? '#000000' : '#ffffff',
                      backgroundColor: spotify.settings.visualizerType === 'circles' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    Circles
                  </button>
                  <button
                    className={`visualizer-option ${spotify.settings.visualizerType === 'waves' ? 'active' : ''}`}
                    onClick={() => handleVisualizerTypeChange('waves')}
                    style={{
                      color: spotify.settings.visualizerType === 'waves' ? '#000000' : '#ffffff',
                      backgroundColor: spotify.settings.visualizerType === 'waves' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    Waves
                  </button>
                </div>
              </div>

              <div className="setting-item">
                <div style={{ color: '#ffffff', marginBottom: 8 }}>Track Info Panel</div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ color: '#ffffff', fontSize: '12px', marginBottom: 4 }}>Opacity</div>
                  <Slider
                    value={spotify.settings.trackInfoPanelOpacity}
                    min={0.1}
                    max={1}
                    step={0.1}
                    onChange={(value) => updateSpotifySettings({ trackInfoPanelOpacity: value })}
                  />
                  <div style={{ color: '#ffffff', fontSize: '10px', opacity: 0.8 }}>
                    {Math.round(spotify.settings.trackInfoPanelOpacity * 100)}%
                  </div>
                </div>
                <div>
                  <div style={{ color: '#ffffff', fontSize: '12px', marginBottom: 4 }}>Blur</div>
                  <Slider
                    value={spotify.settings.trackInfoPanelBlur}
                    min={0}
                    max={30}
                    step={1}
                    onChange={(value) => updateSpotifySettings({ trackInfoPanelBlur: value })}
                  />
                  <div style={{ color: '#ffffff', fontSize: '10px', opacity: 0.8 }}>
                    {spotify.settings.trackInfoPanelBlur}px
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
        onMouseDown={handleResizeStart}
        onMouseMove={handleResizeMove}
        onMouseUp={handleResizeEnd}
      >
        ↙
      </div>
    </div>
  );
};

export default FloatingSpotifyWidget; 