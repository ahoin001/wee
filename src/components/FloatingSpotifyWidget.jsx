import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSpotifyState, useFloatingWidgetsState } from '../utils/useConsolidatedAppHooks';
import WToggle from '../ui/WToggle';
import Slider from '../ui/Slider';
import './FloatingSpotifyWidget.css';

const FloatingSpotifyWidget = ({ isVisible, onClose }) => {
  const { spotify, spotifyManager } = useSpotifyState();
  const { floatingWidgets, setFloatingWidgetsState } = useFloatingWidgetsState();
  
  // Debug: Log spotify state
  useEffect(() => {
    console.log('[SpotifyWidget] Spotify state:', {
      isConnected: spotify.isConnected,
      currentTrack: spotify.currentTrack,
      isPlaying: spotify.isPlaying,
      settings: spotify.settings,
      hasAlbumArt: !!spotify.currentTrack?.album?.images?.[0]?.url,
      albumArtUrl: spotify.currentTrack?.album?.images?.[0]?.url,
      progress: spotify.progress,
      duration: spotify.duration
    });
  }, [spotify]);

  // Debug: Log widget visibility
  useEffect(() => {
    console.log('[SpotifyWidget] Widget visibility:', {
      isVisible,
      spotifyWidgetVisible: floatingWidgets.spotify.visible,
      position: floatingWidgets.spotify.position
    });
  }, [isVisible, floatingWidgets.spotify]);

  const {
    isConnected,
    currentTrack,
    isPlaying,
    volume,
    deviceId,
    error,
    loading
  } = spotify;

  // Get spotify widget state from floating widgets
  const spotifyWidget = floatingWidgets.spotify;
  const spotifyPosition = spotifyWidget.position;
  const setSpotifyPosition = (position) => {
    setFloatingWidgetsState({
      spotify: { ...spotifyWidget, position }
    });
  };

  // Get settings with fallbacks
  const getSpotifySettings = () => {
    return {
      dynamicColors: spotify.settings?.dynamicColors ?? true,
      useBlurredBackground: spotify.settings?.useBlurredBackground ?? false,
      blurAmount: spotify.settings?.blurAmount ?? 30,
      autoShowWidget: spotify.settings?.autoShowWidget ?? false,
      visualizerType: spotify.settings?.visualizerType ?? 'bars',
      trackInfoPanelOpacity: spotify.settings?.trackInfoPanelOpacity ?? 0.6,
      trackInfoPanelBlur: spotify.settings?.trackInfoPanelBlur ?? 10
    };
  };

  const spotifySettings = getSpotifySettings();

  // Mock state for compatibility
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playlists, setPlaylists] = useState([]);
  const [savedTracks, setSavedTracks] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [size, setSize] = useState({ width: 350, height: 300 }); // Reduced from 450x400
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

  // Header dragging logic - only allow dragging from header
  const handleHeaderMouseDown = useCallback((e) => {
    // Prevent dragging if clicking on interactive elements
    if (e.target.closest('.page-btn')) return;
    
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
    
    const newWidth = Math.max(200, Math.min(800, resizeStart.width + deltaX)); // Reduced from 550
    const newHeight = Math.max(150, Math.min(600, resizeStart.height + deltaY)); // Reduced from 300
    
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
    console.log('[BACKGROUND UPDATE] Track changed:', currentTrack?.name, 'Album art:', currentTrack?.album?.images?.[0]?.url);
    
    if (currentTrack?.album?.images?.[0]?.url && spotifySettings.dynamicColors && currentPage === 'player') {
      extractColorsFromImage(currentTrack.album.images[0].url).then(result => {
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
  }, [currentTrack?.album?.images?.[0]?.url, spotifySettings.dynamicColors, currentPage]);

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
    
    if (isVisible && currentPage === 'player') {
      console.log('[Visualizer] Starting animation loop');
      animate();
    }
    
    return () => {
      if (animationRef.current) {
        console.log('[Visualizer] Stopping animation loop');
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, currentPage, isPlaying, currentTrack]);

  // Refresh playback state and load data periodically
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      spotifyManager.refreshPlaybackState();
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isVisible, spotifyManager]);

  // Load playlists and saved tracks when browsing page is opened
  useEffect(() => {
    if (isVisible && currentPage === 'browse') {
      const loadData = async () => {
        try {
          console.log('[SpotifyWidget] Loading browse data...');
          
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
          
          console.log('[SpotifyWidget] Browse data loaded:', {
            playlistsCount: playlistsData?.length || 0,
            tracksCount: tracksData?.length || 0
          });
          
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
  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        console.log('[SpotifyWidget] Searching for:', searchQuery);
        
        if (!spotifyManager || !spotifyManager.searchTracks) {
          console.error('[SpotifyWidget] spotifyManager.searchTracks is not available');
          return;
        }
        
        const results = await spotifyManager.searchTracks(searchQuery);
        console.log('[SpotifyWidget] Search results:', results?.length || 0);
        setSearchResults(results || []);
        setActiveTab('search');
      } catch (error) {
        console.error('[SpotifyWidget] Search error:', error);
        setSearchResults([]);
      }
    }
  };

  // Handle play track
  const handlePlayTrack = async (trackId) => {
    try {
      await spotifyManager.playTrack(trackId);
      setCurrentPage('player');
    } catch (error) {
      console.error('Failed to play track:', error);
    }
  };

  // Handle play playlist
  const handlePlayPlaylist = async (playlistId) => {
    try {
      await spotifyManager.playPlaylist(playlistId);
      setCurrentPage('player');
    } catch (error) {
      console.error('Failed to play playlist:', error);
    }
  };

  // Enhanced seeker bar interaction with draggable circle
  const progressBarRef = useRef(null);

  const handleSeekerMove = useCallback((e) => {
    if (!progressBarRef.current || !spotify.duration) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newPosition = Math.floor(spotify.duration * percentage);
    
    if (isSeeking) {
      setSeekPosition(newPosition);
    }
  }, [isSeeking, spotify.duration]);

  const handleSeekerMouseDown = useCallback((e) => {
    if (!spotify.duration) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsSeeking(true);
    handleSeekerMove(e);
  }, [spotify.duration, handleSeekerMove]);

  const handleSeekerMouseUp = useCallback(() => {
    if (!isSeeking) return;
    
    setIsSeeking(false);
    spotifyManager.seekToPosition(seekPosition);
  }, [isSeeking, seekPosition, spotifyManager]);

  // Handle click-to-seek on progress bar
  const handleProgressBarClick = useCallback((e) => {
    if (!spotify.duration || isSeeking) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newPosition = Math.floor(spotify.duration * percentage);
    
    spotifyManager.seekToPosition(newPosition);
  }, [spotify.duration, isSeeking, spotifyManager]);

  // Global mouse event listeners for seeking
  useEffect(() => {
    if (isSeeking) {
      document.addEventListener('mousemove', handleSeekerMove);
      document.addEventListener('mouseup', handleSeekerMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleSeekerMove);
        document.removeEventListener('mouseup', handleSeekerMouseUp);
      };
    }
  }, [isSeeking, handleSeekerMove, handleSeekerMouseUp]);

  // Format time helper function
  const formatTime = (ms) => {
    if (!ms) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Debug: Test widget features
  useEffect(() => {
    window.testSpotifyWidget = () => {
      console.log('[SpotifyWidget] === TESTING WIDGET FEATURES ===');
      console.log('[SpotifyWidget] Current track:', spotify.currentTrack);
      console.log('[SpotifyWidget] Track artists:', spotify.currentTrack?.artists);
      console.log('[SpotifyWidget] Track album:', spotify.currentTrack?.album);
      console.log('[SpotifyWidget] Settings:', spotify.settings);
      console.log('[SpotifyWidget] Progress:', spotify.progress);
      console.log('[SpotifyWidget] Duration:', spotify.duration);
      console.log('[SpotifyWidget] Is playing:', spotify.isPlaying);
      console.log('[SpotifyWidget] Dynamic background:', dynamicBackground);
      console.log('[SpotifyWidget] Blurred background:', blurredBackground);
      console.log('[SpotifyWidget] Dynamic colors:', dynamicColors);
      console.log('[SpotifyWidget] Current page:', currentPage);
      console.log('[SpotifyWidget] Album art URL:', spotify.currentTrack?.album?.images?.[0]?.url);
      console.log('[SpotifyWidget] === END TEST ===');
    };

    window.enableSpotifyFeatures = () => {
      console.log('[SpotifyWidget] Enabling all Spotify features...');
      spotifyManager.updateSpotifySettings({
        dynamicColors: true,
        useBlurredBackground: true,
        blurAmount: 15,
        autoShowWidget: true,
        visualizerType: 'bars',
        trackInfoPanelOpacity: 0.8,
        trackInfoPanelBlur: 15
      });
      console.log('[SpotifyWidget] Features enabled!');
    };

    window.testSpotifyAPI = async () => {
      console.log('[SpotifyWidget] === TESTING SPOTIFY API ===');
      
      try {
        // Test current playback
        const playback = await spotifyManager.refreshPlaybackState();
        console.log('[SpotifyWidget] Playback data:', playback);
        
        if (playback && playback.item) {
          console.log('[SpotifyWidget] ✅ Current track found:', {
            name: playback.item.name,
            artists: playback.item.artists?.map(a => a.name).join(', '),
            album: playback.item.album?.name,
            albumArt: playback.item.album?.images?.[0]?.url,
            duration: playback.duration_ms,
            progress: playback.progress_ms,
            isPlaying: playback.is_playing
          });
        } else {
          console.log('[SpotifyWidget] ⚠️ No active playback found');
        }
        
        // Test user profile
        const profile = await spotifyManager.getUserProfile();
        console.log('[SpotifyWidget] User profile:', profile);
        
        // Test playlists
        const playlists = await spotifyManager.loadPlaylists();
        console.log('[SpotifyWidget] Playlists count:', playlists?.length || 0);
        
        // Test saved tracks
        const savedTracks = await spotifyManager.loadSavedTracks();
        console.log('[SpotifyWidget] Saved tracks count:', savedTracks?.length || 0);
        
      } catch (error) {
        console.error('[SpotifyWidget] API test error:', error);
      }
      
      console.log('[SpotifyWidget] === END API TEST ===');
    };

    window.debugBrowsePage = () => {
      console.log('[SpotifyWidget] === DEBUGGING BROWSE PAGE ===');
      console.log('[SpotifyWidget] Current page:', currentPage);
      console.log('[SpotifyWidget] Is visible:', isVisible);
      console.log('[SpotifyWidget] Spotify manager:', spotifyManager);
      console.log('[SpotifyWidget] Spotify manager functions:', {
        loadPlaylists: !!spotifyManager?.loadPlaylists,
        loadSavedTracks: !!spotifyManager?.loadSavedTracks,
        searchTracks: !!spotifyManager?.searchTracks,
        getUserProfile: !!spotifyManager?.getUserProfile
      });
      console.log('[SpotifyWidget] Current state:', {
        playlists: playlists?.length || 0,
        savedTracks: savedTracks?.length || 0,
        searchResults: searchResults?.length || 0,
        activeTab: activeTab,
        searchQuery: searchQuery
      });
      console.log('[SpotifyWidget] === END BROWSE DEBUG ===');
    };

    window.debugVisualizer = () => {
      console.log('[SpotifyWidget] === DEBUGGING VISUALIZER ===');
      console.log('[SpotifyWidget] Current page:', currentPage);
      console.log('[SpotifyWidget] Is visible:', isVisible);
      console.log('[SpotifyWidget] Is playing:', isPlaying);
      console.log('[SpotifyWidget] Current track:', currentTrack?.name);
      console.log('[SpotifyWidget] Audio data length:', audioData?.length || 0);
      console.log('[SpotifyWidget] Audio data sample:', audioData?.slice(0, 5));
      console.log('[SpotifyWidget] Visualizer type:', spotifySettings.visualizerType);
      console.log('[SpotifyWidget] Animation ref:', !!animationRef.current);
      console.log('[SpotifyWidget] === END VISUALIZER DEBUG ===');
    };

    return () => {
      delete window.testSpotifyWidget;
      delete window.enableSpotifyFeatures;
      delete window.testSpotifyAPI;
      delete window.debugBrowsePage;
      delete window.debugVisualizer;
    };
  }, [spotify.currentTrack, spotify.settings, dynamicBackground, blurredBackground, dynamicColors, currentPage, spotifyManager, playlists, savedTracks, searchResults, activeTab, searchQuery, isPlaying, currentTrack, audioData, spotifySettings.visualizerType, animationRef.current]);

  if (!isVisible) return null;

  // Determine background based on current page
  const getBackground = () => {
    if (currentPage === 'browse' || currentPage === 'settings') {
      return 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)';
    }
    
    if (spotifySettings.useBlurredBackground && currentTrack?.album?.images?.[0]?.url) {
      return `url(${currentTrack.album.images[0].url}) center/cover`;
    }
    
    return dynamicBackground || 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)';
  };

  // Settings handlers
  const handleDynamicColorsToggle = (checked) => {
    console.log('[SpotifyWidget] Toggling dynamic colors:', checked);
    spotifyManager.updateSpotifySettings({ dynamicColors: checked });
  };

  const handleBlurredBackgroundToggle = (checked) => {
    console.log('[SpotifyWidget] Toggling blurred background:', checked);
    spotifyManager.updateSpotifySettings({ useBlurredBackground: checked });
  };

  const handleBlurAmountChange = (value) => {
    console.log('[SpotifyWidget] Changing blur amount:', value);
    spotifyManager.updateSpotifySettings({ blurAmount: value });
  };

  const handleAutoShowWidgetToggle = (checked) => {
    console.log('[SpotifyWidget] Toggling auto show widget:', checked);
    spotifyManager.updateSpotifySettings({ autoShowWidget: checked });
  };

  const handleVisualizerTypeChange = (type) => {
    console.log('[SpotifyWidget] Changing visualizer type:', type);
    spotifyManager.updateSpotifySettings({ visualizerType: type });
  };

  return (
    <div 
      className={`floating-spotify-widget ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
      ref={widgetRef}
      style={{
        left: `${spotifyPosition.x}px`,
        top: `${spotifyPosition.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        background: getBackground(),
        '--glow-primary': spotifySettings.dynamicColors && currentTrack?.album?.images?.[0]?.url && currentPage === 'player' ? dynamicColors.primary : '#1db954',
        '--glow-secondary': spotifySettings.dynamicColors && currentTrack?.album?.images?.[0]?.url && currentPage === 'player' ? dynamicColors.secondary : '#1ed760',
        '--glow-opacity': spotifySettings.dynamicColors && currentTrack?.album?.images?.[0]?.url && currentPage === 'player' ? '0.4' : '0.3',
        '--glow-brightness': spotifySettings.dynamicColors && currentTrack?.album?.images?.[0]?.url && currentPage === 'player' ? '1.1' : '1'
      }}
    >
      {/* Blurred Background Layer - only for player page with album art */}
      {spotifySettings.useBlurredBackground && currentTrack?.album?.images?.[0]?.url && currentPage === 'player' && (
        <div 
          className="blurred-background-layer"
          style={{
            background: `url(${currentTrack.album.images[0].url}) center/cover`,
            filter: `blur(${spotifySettings.blurAmount || 0}px)`,
          }}
        />
      )}

      {/* Visualizer - only show on player page */}
      {currentPage === 'player' && (
        <div className={`visualizer visualizer-${spotifySettings.visualizerType || 'bars'}`}>
          {audioData.map((height, index) => (
            <div
              key={index}
              className={`visualizer-bar visualizer-${spotifySettings.visualizerType || 'bars'}`}
              style={{
                height: spotifySettings.visualizerType === 'circles' ? `${height * 20}px` : `${height * 100}%`,
                width: spotifySettings.visualizerType === 'circles' ? `${height * 20}px` : '4px',
                animationDelay: `${index * 0.1}s`,
                backgroundColor: spotifySettings.dynamicColors && currentTrack?.album?.images?.[0]?.url ? dynamicColors.accent : 'rgba(255, 255, 255, 0.8)',
                opacity: height > 0 ? 1 : 0.3
              }}
            />
          ))}
        </div>
      )}

      {/* Widget Content */}
      <div className="widget-content">
        {/* Header - draggable area */}
        <div className="widget-header" onMouseDown={handleHeaderMouseDown}>
          {/* Header is now just a draggable area */}
        </div>

        {/* Floating Page Navigation - Top Right */}
        <div className="floating-page-navigation-top">
          <div className="">
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
          <div className="player-page">
            {/* Track Info in Modern Card */}
            {currentTrack ? (
              <div 
                className="track-info-card"
                style={{
                  opacity: spotifySettings.trackInfoPanelOpacity,
                  backdropFilter: `blur(${spotifySettings.trackInfoPanelBlur}px)`
                }}
              >
                <div className="track-artwork-large">
                  {currentTrack.album?.images?.[0]?.url ? (
                    <img src={currentTrack.album.images[0].url} alt="Album Art" />
                  ) : (
                    <div className="no-artwork-large">🎵</div>
                  )}
                </div>
                <div className="track-details-modern">
                  <div className="track-title-modern" style={{ color: '#ffffff' }}>{currentTrack.name}</div>
                  <div className="track-artist-modern" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    {currentTrack.artists?.map(artist => artist.name).join(', ')}
                  </div>
                  {currentTrack.album && (
                    <div className="track-album-modern" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{currentTrack.album.name}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="no-track-modern">
                <div className="no-track-icon-large">🎵</div>
                <div className="no-track-text-modern" style={{ color: dynamicColors.text }}>No track playing</div>
                <div className="no-track-subtitle" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Start playing music to see it here</div>
              </div>
            )}

            {/* Enhanced Progress Bar */}
            {currentTrack && (
              <div className={`progress-container-modern ${isSeeking ? 'seeking' : ''}`}>
                <div 
                  ref={progressBarRef}
                  className="progress-bar-modern" 
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                  onClick={handleProgressBarClick}
                >
                  <div 
                    className="progress-fill-modern"
                    style={{
                      width: `${((isSeeking ? seekPosition : (spotify.progress || 0)) / (spotify.duration || 1)) * 100}%`,
                      backgroundColor: '#1db954'
                    }}
                  />
                  <div 
                    className="progress-handle-modern"
                    style={{ 
                      backgroundColor: '#ffffff',
                      left: `${((isSeeking ? seekPosition : (spotify.progress || 0)) / (spotify.duration || 1)) * 100}%`
                    }}
                    onMouseDown={handleSeekerMouseDown}
                  />
                </div>
                <div className="progress-time-modern" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  {formatTime(isSeeking ? seekPosition : (spotify.progress || 0))} / {formatTime(spotify.duration || 0)}
                </div>
              </div>
            )}

            {/* Modern Playback Controls */}
            <div className="playback-controls-modern">
              <button 
                className="control-btn-modern"
                onClick={spotifyManager.skipToPrevious}
                title="Previous Track"
                style={{
                  color: spotifySettings.dynamicColors && currentTrack?.album?.images?.[0]?.url ? dynamicColors.text : '#ffffff',
                  backgroundColor: spotifySettings.dynamicColors && currentTrack?.album?.images?.[0]?.url ? dynamicColors.primary : 'rgba(255, 255, 255, 0.1)',
                  borderColor: spotifySettings.dynamicColors && currentTrack?.album?.images?.[0]?.url ? dynamicColors.accent : 'rgba(255, 255, 255, 0.2)'
                }}
              >
                ⏮
              </button>
              <button 
                className="control-btn-modern play-pause-modern"
                onClick={spotifyManager.togglePlayback}
                title={isPlaying ? 'Pause' : 'Play'}
                style={{
                  color: spotifySettings.dynamicColors && currentTrack?.album?.images?.[0]?.url ? dynamicColors.text : '#000000',
                  backgroundColor: spotifySettings.dynamicColors && currentTrack?.album?.images?.[0]?.url ? dynamicColors.primary : '#1db954',
                  borderColor: spotifySettings.dynamicColors && currentTrack?.album?.images?.[0]?.url ? dynamicColors.accent : '#1db954',
                  transform: 'scale(1.1)'
                }}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button 
                className="control-btn-modern"
                onClick={spotifyManager.skipToNext}
                title="Next Track"
                style={{
                  color: spotifySettings.dynamicColors && currentTrack?.album?.images?.[0]?.url ? dynamicColors.text : '#ffffff',
                  backgroundColor: spotifySettings.dynamicColors && currentTrack?.album?.images?.[0]?.url ? dynamicColors.primary : 'rgba(255, 255, 255, 0.1)',
                  borderColor: spotifySettings.dynamicColors && currentTrack?.album?.images?.[0]?.url ? dynamicColors.accent : 'rgba(255, 255, 255, 0.2)'
                }}
              >
                ⏭
              </button>
            </div>
          </div>
        )}

        {/* Browse Page */}
        {currentPage === 'browse' && (
          <div className="browse-page">
            {/* Modern Search Bar */}
            <div className="search-container-modern">
              <div className="search-bar-modern">
                <input
                  type="text"
                  placeholder="Search songs, artists, or albums..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="search-input-modern"
                  style={{ color: '#000000', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                />
                <button 
                  className="search-btn-modern" 
                  onClick={handleSearch}
                  style={{
                    color: '#000000',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderColor: '#1db954'
                  }}
                >
                  🔍
                </button>
              </div>
            </div>

            {/* Modern Tab Navigation */}
            <div className="tab-navigation-modern">
              <button 
                className={`tab-btn-modern ${activeTab === 'playlists' ? 'active' : ''}`}
                onClick={() => setActiveTab('playlists')}
                style={{
                  color: activeTab === 'playlists' ? '#000000' : '#ffffff',
                  backgroundColor: activeTab === 'playlists' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.2)',
                  borderColor: '#1db954'
                }}
              >
                <span className="tab-icon">📚</span>
                <span className="tab-label">Playlists</span>
              </button>
              <button 
                className={`tab-btn-modern ${activeTab === 'songs' ? 'active' : ''}`}
                onClick={() => setActiveTab('songs')}
                style={{
                  color: activeTab === 'songs' ? '#000000' : '#ffffff',
                  backgroundColor: activeTab === 'songs' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.2)',
                  borderColor: '#1db954'
                }}
              >
                <span className="tab-icon">🎵</span>
                <span className="tab-label">Songs</span>
              </button>
              {searchResults.length > 0 && (
                <button 
                  className={`tab-btn-modern ${activeTab === 'search' ? 'active' : ''}`}
                  onClick={() => setActiveTab('search')}
                  style={{
                    color: activeTab === 'search' ? '#000000' : '#ffffff',
                    backgroundColor: activeTab === 'search' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.2)',
                    borderColor: '#1db954'
                  }}
                >
                  <span className="tab-icon">🔍</span>
                  <span className="tab-label">Search</span>
                </button>
              )}
            </div>

            {/* Content Area */}
            <div className="content-area-modern">
              {spotify.loading ? (
                <div className="loading-modern" style={{ color: '#ffffff' }}>
                  <div className="loading-spinner"></div>
                  <div>Loading...</div>
                </div>
              ) : (
                <>
                  {/* Playlists Tab */}
                  {activeTab === 'playlists' && (
                    <div className="playlists-grid-modern">
                      {playlists.slice(0, 8).map((playlist) => (
                        <div 
                          key={playlist.id} 
                          className="playlist-card-modern"
                          onClick={() => handlePlayPlaylist(playlist.id)}
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                        >
                          <div className="playlist-image-modern">
                            {playlist.images?.[0]?.url ? (
                              <img src={playlist.images[0].url} alt={playlist.name} />
                            ) : (
                              <div className="no-playlist-image-modern">📚</div>
                            )}
                          </div>
                          <div className="playlist-info-modern">
                            <div className="playlist-name-modern" style={{ color: '#ffffff' }}>{playlist.name}</div>
                            <div className="playlist-tracks-modern" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{playlist.tracks?.total || 0} tracks</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Songs Tab */}
                  {activeTab === 'songs' && (
                    <div className="songs-list-modern">
                      {savedTracks.slice(0, 8).map((track) => (
                        <div 
                          key={track.id} 
                          className="song-item-modern"
                          onClick={() => handlePlayTrack(track.id)}
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                        >
                          <div className="song-image-modern">
                            {track.album?.images?.[0]?.url ? (
                              <img src={track.album.images[0].url} alt={track.name} />
                            ) : (
                              <div className="no-song-image-modern">🎵</div>
                            )}
                          </div>
                          <div className="song-info-modern">
                            <div className="song-title-modern" style={{ color: '#ffffff' }}>{track.name}</div>
                            <div className="song-artist-modern" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{track.artists?.[0]?.name || 'Unknown Artist'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Search Tab */}
                  {activeTab === 'search' && (
                    <div className="search-results-modern">
                      {searchResults.slice(0, 8).map((track) => (
                        <div 
                          key={track.id} 
                          className="song-item-modern"
                          onClick={() => handlePlayTrack(track.id)}
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                        >
                          <div className="song-image-modern">
                            {track.album?.images?.[0]?.url ? (
                              <img src={track.album.images[0].url} alt={track.name} />
                            ) : (
                              <div className="no-song-image-modern">🎵</div>
                            )}
                          </div>
                          <div className="song-info-modern">
                            <div className="song-title-modern" style={{ color: '#ffffff' }}>{track.name}</div>
                            <div className="song-artist-modern" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{track.artists?.[0]?.name || 'Unknown Artist'}</div>
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
              <h2 className="settings-title-modern" style={{ color: '#ffffff' }}>Widget Settings</h2>
              <p className="settings-subtitle" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Customize your Spotify widget experience</p>
            </div>
            
            <div className="settings-sections">
              {/* Appearance Section */}
              <div className="settings-section-modern">
                <h3 className="section-title" style={{ color: '#ffffff' }}>🎨 Appearance</h3>
                
                <div className="setting-item-modern">
                  <WToggle
                    checked={spotifySettings.dynamicColors}
                    onChange={handleDynamicColorsToggle}
                    label="Dynamic Colors from Album Art"
                  />
                  <p className="setting-description" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    Automatically adjust colors based on the current track's album art
                  </p>
                </div>
                
                <div className="setting-item-modern">
                  <WToggle
                    checked={spotifySettings.useBlurredBackground}
                    onChange={handleBlurredBackgroundToggle}
                    label="Blurred Album Art Background"
                  />
                  <p className="setting-description" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    Use the current track's album art as a blurred background
                  </p>
                </div>
                
                {spotifySettings.useBlurredBackground && (
                  <div className="setting-item-modern">
                    <div className="setting-label" style={{ color: '#ffffff', marginBottom: 8 }}>Blur Amount</div>
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
                      <span className="slider-value" style={{ color: '#ffffff', fontWeight: 600 }}>
                        {spotifySettings.blurAmount || 0}px
                      </span>
                    </div>
                    <p className="setting-description" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Higher blur makes the album art more blurry. 0px = no blur, 24px = very blurry.
                    </p>
                  </div>
                )}
              </div>

              {/* Behavior Section */}
              <div className="settings-section-modern">
                <h3 className="section-title" style={{ color: '#ffffff' }}>⚡ Behavior</h3>
                
                <div className="setting-item-modern">
                  <WToggle
                    checked={spotifySettings.autoShowWidget}
                    onChange={handleAutoShowWidgetToggle}
                    label="Auto-show Widget on Playback"
                  />
                  <p className="setting-description" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    Automatically show the widget when music starts playing
                  </p>
                </div>
              </div>

              {/* Visualizer Section */}
              <div className="settings-section-modern">
                <h3 className="section-title" style={{ color: '#ffffff' }}>🎵 Visualizer</h3>
                
                <div className="setting-item-modern">
                  <div className="setting-label" style={{ color: '#ffffff', marginBottom: 8 }}>Visualizer Type</div>
                  <div className="visualizer-options-modern">
                    <button
                      className={`visualizer-option-modern ${spotifySettings.visualizerType === 'bars' ? 'active' : ''}`}
                      onClick={() => handleVisualizerTypeChange('bars')}
                      style={{
                        color: spotifySettings.visualizerType === 'bars' ? '#000000' : '#ffffff',
                        backgroundColor: spotifySettings.visualizerType === 'bars' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      Bars
                    </button>
                    <button
                      className={`visualizer-option-modern ${spotifySettings.visualizerType === 'circles' ? 'active' : ''}`}
                      onClick={() => handleVisualizerTypeChange('circles')}
                      style={{
                        color: spotifySettings.visualizerType === 'circles' ? '#000000' : '#ffffff',
                        backgroundColor: spotifySettings.visualizerType === 'circles' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      Circles
                    </button>
                    <button
                      className={`visualizer-option-modern ${spotifySettings.visualizerType === 'waves' ? 'active' : ''}`}
                      onClick={() => handleVisualizerTypeChange('waves')}
                      style={{
                        color: spotifySettings.visualizerType === 'waves' ? '#000000' : '#ffffff',
                        backgroundColor: spotifySettings.visualizerType === 'waves' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      Waves
                    </button>
                  </div>
                </div>
              </div>

              {/* Track Info Panel Section */}
              <div className="settings-section-modern">
                <h3 className="section-title" style={{ color: '#ffffff' }}>📋 Track Info Panel</h3>
                
                <div className="setting-item-modern">
                  <div className="setting-label" style={{ color: '#ffffff', marginBottom: 8 }}>Opacity</div>
                  <div className="slider-container">
                    <Slider
                      value={spotifySettings.trackInfoPanelOpacity}
                      min={0.1}
                      max={1}
                      step={0.1}
                      onChange={(value) => spotifyManager.updateSpotifySettings({ trackInfoPanelOpacity: value })}
                    />
                    <span className="slider-value" style={{ color: '#ffffff', fontWeight: 600 }}>
                      {Math.round(spotifySettings.trackInfoPanelOpacity * 100)}%
                    </span>
                  </div>
                </div>
                
                <div className="setting-item-modern">
                  <div className="setting-label" style={{ color: '#ffffff', marginBottom: 8 }}>Blur</div>
                  <div className="slider-container">
                    <Slider
                      value={spotifySettings.trackInfoPanelBlur}
                      min={0}
                      max={30}
                      step={1}
                      onChange={(value) => spotifyManager.updateSpotifySettings({ trackInfoPanelBlur: value })}
                    />
                    <span className="slider-value" style={{ color: '#ffffff', fontWeight: 600 }}>
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