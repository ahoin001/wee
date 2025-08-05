import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import WToggle from '../../ui/WToggle';
import WButton from '../../ui/WButton';
import WInput from '../../ui/WInput';
import Slider from '../../ui/Slider';
import Text from '../../ui/Text';
import useApiIntegrationsStore from '../../utils/useApiIntegrationsStore';
import useUIStore from '../../utils/useUIStore';
import { useSpotifyStore } from '../../utils/useSpotifyStore';
import useFloatingWidgetStore from '../../utils/useFloatingWidgetStore';
import { formatShortcut, parseShortcut } from '../../utils/keyboardShortcuts';
import { spacing } from '../../ui/tokens';

const ApiIntegrationsSettingsTab = () => {
  const {
    spotify,
    connectSpotify,
    disconnectSpotify,
    toggleSpotifyEnabled,
    updateSpotifyHotkey,
    updateSpotifySettings
  } = useApiIntegrationsStore();

  const { keyboardShortcuts } = useUIStore();
  const { 
    currentUser, 
    topTracks, 
    topArtists, 
    recentlyPlayed,
    loadTopTracks, 
    loadTopArtists, 
    loadRecentlyPlayed, 
    loadUserProfile 
  } = useSpotifyStore();
  const { resetPosition } = useFloatingWidgetStore();
  
  const spotifyShortcut = keyboardShortcuts.find(s => s.id === 'toggle-spotify-widget');

  const [hotkeyInput, setHotkeyInput] = useState(spotify.hotkey);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isEditingHotkey, setIsEditingHotkey] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [activeDataView, setActiveDataView] = useState(null); // 'tracks', 'artists', 'recent'
  const [selectedTimeRange, setSelectedTimeRange] = useState('medium_term'); // 'short_term', 'medium_term', 'long_term'

  // Sync hotkey with keyboard shortcuts system
  useEffect(() => {
    if (spotifyShortcut) {
      const shortcutString = formatShortcut({ 
        key: spotifyShortcut.key, 
        modifier: spotifyShortcut.modifier 
      });
      setHotkeyInput(shortcutString);
    }
  }, [spotifyShortcut]);

  // Handle hotkey input
  const handleHotkeyChange = (e) => {
    setHotkeyInput(e.target.value);
  };

  const handleHotkeyBlur = () => {
    try {
      const parsed = parseShortcut(hotkeyInput);
      if (parsed) {
        updateSpotifyHotkey(hotkeyInput, parsed.key, parsed.modifier);
      } else {
        setHotkeyInput(spotify.hotkey); // Reset to current value
      }
    } catch (error) {
      console.error('Invalid hotkey format:', error);
      setHotkeyInput(spotify.hotkey); // Reset to current value
    }
    setIsEditingHotkey(false);
  };

  const handleHotkeyKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleHotkeyBlur();
    }
  };

  const handleHotkeyFocus = () => {
    setIsEditingHotkey(true);
  };

  // Handle hotkey key down for capturing key combinations
  const handleHotkeyKeyDown = (e) => {
    if (isEditingHotkey) {
      e.preventDefault();
      const key = e.key.toLowerCase();
      const modifiers = [];
      
      if (e.ctrlKey) modifiers.push('ctrl');
      if (e.altKey) modifiers.push('alt');
      if (e.shiftKey) modifiers.push('shift');
      if (e.metaKey) modifiers.push('meta');
      
      const modifier = modifiers.join('+') || 'none';
      const hotkeyString = formatShortcut({ key, modifier });
      
      setHotkeyInput(hotkeyString);
      updateSpotifyHotkey(hotkeyString, key, modifier);
      setIsEditingHotkey(false);
    }
  };

  // Handle Spotify connection
  const handleSpotifyConnection = async () => {
    if (spotify.isConnected) {
      disconnectSpotify();
    } else {
      setIsConnecting(true);
      try {
        await connectSpotify();
      } finally {
        setIsConnecting(false);
      }
    }
  };

  // Handle settings changes
  const handleSettingChange = (setting, value) => {
    updateSpotifySettings({ [setting]: value });
  };

  // Handle popular API features
  const handleLoadTopTracks = async () => {
    setIsLoadingData(true);
    try {
      await loadTopTracks(selectedTimeRange);
      setActiveDataView('tracks');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLoadTopArtists = async () => {
    setIsLoadingData(true);
    try {
      await loadTopArtists(selectedTimeRange);
      setActiveDataView('artists');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLoadRecentlyPlayed = async () => {
    setIsLoadingData(true);
    try {
      await loadRecentlyPlayed();
      setActiveDataView('recent');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLoadUserProfile = async () => {
    setIsLoadingData(true);
    try {
      await loadUserProfile();
    } finally {
      setIsLoadingData(false);
    }
  };

  // Helper function to get time range label
  const getTimeRangeLabel = (timeRange) => {
    switch (timeRange) {
      case 'short_term':
        return 'Last 4 Weeks';
      case 'medium_term':
        return 'Last 6 Months';
      case 'long_term':
        return 'All Time';
      default:
        return 'Last 6 Months';
    }
  };

  return (
    <div style={{ padding: spacing.medium }}>
      <Text variant="h2" style={{ marginBottom: spacing.large }}>
        API Integrations
      </Text>
      
      <Text variant="body" style={{ marginBottom: spacing.large, opacity: 0.8 }}>
        Connect external services to enable floating widgets and enhanced features.
      </Text>

      {/* Spotify Integration */}
      <Card style={{ 
        marginBottom: spacing.large,
        background: 'linear-gradient(135deg, #1DB954 0%, #1ed760 100%)',
        border: '2px solid #1DB954',
        boxShadow: '0 8px 32px rgba(29, 185, 84, 0.3)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: spacing.large,
          padding: spacing.medium,
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)'
        }}>
          {/* Spotify Logo */}
          <div style={{ 
            width: '56px', 
            height: '56px', 
            backgroundColor: '#000000', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.medium,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#1DB954">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <Text variant="h3" style={{ 
              marginBottom: spacing.xsmall, 
              color: '#ffffff',
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>
              Spotify
            </Text>
            <Text variant="caption" style={{ 
              opacity: 0.9, 
              color: '#ffffff',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
            }}>
              {currentUser ? `Connected as ${currentUser.displayName}` : 'Music playback and floating widget'}
            </Text>
          </div>
          <WToggle
            checked={spotify.isEnabled}
            onChange={toggleSpotifyEnabled}
            label="Enable"
          />
        </div>

                 {spotify.isEnabled && (
           <div style={{ 
             paddingTop: spacing.medium, 
             borderTop: '1px solid rgba(255, 255, 255, 0.15)',
             marginTop: spacing.medium
           }}>
             {/* Connection Status Card */}
             <Card style={{
               marginBottom: spacing.medium,
               background: 'rgba(255, 255, 255, 0.1)',
               border: '1px solid rgba(255, 255, 255, 0.2)',
               backdropFilter: 'blur(10px)'
             }}>
               <div style={{ 
                 display: 'flex', 
                 alignItems: 'center', 
                 padding: spacing.medium
               }}>
                 <div style={{ flex: 1 }}>
                   <Text variant="body" style={{ 
                     marginBottom: spacing.xsmall,
                     color: '#ffffff',
                     fontWeight: '600',
                     fontSize: '14px'
                   }}>
                     Connection Status
                   </Text>
                   <Text variant="caption" style={{ 
                     opacity: 0.8,
                     color: '#ffffff',
                     fontSize: '12px'
                   }}>
                     {spotify.isConnected ? '✅ Connected' : '❌ Not connected'}
                   </Text>
                 </div>
                 <WButton
                   onClick={handleSpotifyConnection}
                   disabled={isConnecting}
                   variant={spotify.isConnected ? 'secondary' : 'primary'}
                   size="sm"
                   style={{
                     backgroundColor: spotify.isConnected ? '#ff4444' : '#1DB954',
                     borderColor: spotify.isConnected ? '#ff4444' : '#1DB954',
                     color: '#ffffff'
                   }}
                 >
                   {isConnecting ? 'Connecting...' : (spotify.isConnected ? 'Disconnect' : 'Connect')}
                 </WButton>
               </div>
             </Card>

                         {/* Popular API Features Card */}
             {spotify.isConnected && (
               <Card style={{
                 marginBottom: spacing.medium,
                 background: 'rgba(255, 255, 255, 0.1)',
                 border: '1px solid rgba(255, 255, 255, 0.2)',
                 backdropFilter: 'blur(10px)'
               }}>
                 <div style={{ padding: spacing.medium }}>
                                       <Text variant="body" style={{ 
                      marginBottom: spacing.medium,
                      color: '#ffffff',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      Popular Features
                    </Text>
                    
                    {/* Time Range Selection */}
                    <div style={{ 
                      marginBottom: spacing.medium,
                      padding: spacing.medium,
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <Text variant="caption" style={{ 
                        marginBottom: spacing.small,
                        color: '#ffffff',
                        fontWeight: '600',
                        fontSize: '12px'
                      }}>
                        Time Period
                      </Text>
                      <div style={{ 
                        display: 'flex', 
                        gap: spacing.small,
                        flexWrap: 'wrap'
                      }}>
                        <WButton
                          onClick={() => setSelectedTimeRange('short_term')}
                          variant={selectedTimeRange === 'short_term' ? 'primary' : 'secondary'}
                          size="sm"
                          style={{
                            backgroundColor: selectedTimeRange === 'short_term' ? '#1DB954' : 'rgba(255, 255, 255, 0.1)',
                            borderColor: selectedTimeRange === 'short_term' ? '#1DB954' : 'rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                            fontSize: '11px',
                            padding: '6px 12px'
                          }}
                        >
                          Last 4 Weeks
                        </WButton>
                        <WButton
                          onClick={() => setSelectedTimeRange('medium_term')}
                          variant={selectedTimeRange === 'medium_term' ? 'primary' : 'secondary'}
                          size="sm"
                          style={{
                            backgroundColor: selectedTimeRange === 'medium_term' ? '#1DB954' : 'rgba(255, 255, 255, 0.1)',
                            borderColor: selectedTimeRange === 'medium_term' ? '#1DB954' : 'rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                            fontSize: '11px',
                            padding: '6px 12px'
                          }}
                        >
                          Last 6 Months
                        </WButton>
                        <WButton
                          onClick={() => setSelectedTimeRange('long_term')}
                          variant={selectedTimeRange === 'long_term' ? 'primary' : 'secondary'}
                          size="sm"
                          style={{
                            backgroundColor: selectedTimeRange === 'long_term' ? '#1DB954' : 'rgba(255, 255, 255, 0.1)',
                            borderColor: selectedTimeRange === 'long_term' ? '#1DB954' : 'rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                            fontSize: '11px',
                            padding: '6px 12px'
                          }}
                        >
                          All Time
                        </WButton>
                      </div>
                      <Text variant="caption" style={{ 
                        marginTop: spacing.xsmall,
                        color: '#ffffff',
                        opacity: 0.7,
                        fontSize: '10px'
                      }}>
                        Select time period for Top Tracks and Top Artists
                      </Text>
                    </div>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                      gap: spacing.medium 
                    }}>
                      <WButton
                        onClick={handleLoadTopTracks}
                        disabled={isLoadingData}
                        variant="secondary"
                        size="sm"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                          color: '#ffffff'
                        }}
                      >
                        🎵 Top Tracks
                      </WButton>
                      <WButton
                        onClick={handleLoadTopArtists}
                        disabled={isLoadingData}
                        variant="secondary"
                        size="sm"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                          color: '#ffffff'
                        }}
                      >
                        👤 Top Artists
                      </WButton>
                      <WButton
                        onClick={handleLoadRecentlyPlayed}
                        disabled={isLoadingData}
                        variant="secondary"
                        size="sm"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                          color: '#ffffff'
                        }}
                      >
                        ⏰ Recently Played
                      </WButton>
                      
                    </div>
                                       {isLoadingData && (
                      <Text variant="caption" style={{ 
                        marginTop: spacing.small,
                        color: '#ffffff',
                        opacity: 0.7,
                        fontSize: '11px'
                      }}>
                        Loading data...
                      </Text>
                    )}

                                         {/* Display loaded data */}
                     {!isLoadingData && activeDataView && (
                       <div style={{ marginTop: spacing.large }}>
                         {/* Data View Header */}
                         <div style={{ 
                           display: 'flex', 
                           alignItems: 'center', 
                           justifyContent: 'space-between',
                           marginBottom: spacing.medium,
                           padding: spacing.medium,
                           background: 'rgba(0, 0, 0, 0.4)',
                           borderRadius: '12px',
                           border: '1px solid rgba(255, 255, 255, 0.2)',
                           backdropFilter: 'blur(10px)'
                         }}>
                           <div style={{ display: 'flex', alignItems: 'center' }}>
                             <span style={{ fontSize: '18px', marginRight: spacing.medium }}>🎵</span>
                                                           <Text variant="caption" style={{ 
                                color: '#ffffff',
                                fontWeight: '600',
                                fontSize: '14px'
                              }}>
                                {activeDataView === 'tracks' && `Top Tracks (${topTracks.length}) - ${getTimeRangeLabel(selectedTimeRange)}`}
                                {activeDataView === 'artists' && `Top Artists (${topArtists.length}) - ${getTimeRangeLabel(selectedTimeRange)}`}
                                {activeDataView === 'recent' && `Recently Played (${recentlyPlayed.length})`}
                              </Text>
                           </div>
                           <WButton
                             onClick={() => setActiveDataView(null)}
                             variant="secondary"
                             size="sm"
                             style={{
                               backgroundColor: 'rgba(255, 255, 255, 0.1)',
                               borderColor: 'rgba(255, 255, 255, 0.2)',
                               color: '#ffffff',
                               padding: '4px 12px',
                               fontSize: '11px'
                             }}
                           >
                             ✕ Close
                           </WButton>
                         </div>
                         
                                                   {/* Top Tracks View */}
                          {activeDataView === 'tracks' && topTracks.length > 0 && (
                            <div style={{ 
                              background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.15) 0%, rgba(30, 215, 96, 0.15) 100%)',
                              borderRadius: '12px',
                              padding: spacing.large,
                              border: '1px solid rgba(29, 185, 84, 0.4)',
                              boxShadow: '0 8px 32px rgba(29, 185, 84, 0.2)'
                            }}>
                              {topTracks.slice(0, 10).map((track, index) => (
                                <div key={track.id} style={{ 
                                  display: 'flex', 
                                  alignItems: 'center',
                                  marginBottom: index < 9 ? spacing.large : 0,
                                  padding: spacing.medium,
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  borderRadius: '10px',
                                  transition: 'all 0.3s ease',
                                  cursor: 'pointer',
                                  border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                                  e.target.style.transform = 'translateX(6px) scale(1.02)';
                                  e.target.style.boxShadow = '0 4px 20px rgba(29, 185, 84, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                  e.target.style.transform = 'translateX(0) scale(1)';
                                  e.target.style.boxShadow = 'none';
                                }}
                                >
                                  <div style={{ 
                                    width: '32px', 
                                    height: '32px', 
                                    backgroundColor: '#1DB954', 
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: spacing.medium,
                                    fontSize: '14px',
                                    color: '#000000',
                                    fontWeight: 'bold',
                                    boxShadow: '0 2px 8px rgba(29, 185, 84, 0.4)'
                                  }}>
                                    {index + 1}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ 
                                      color: '#ffffff',
                                      fontSize: '14px',
                                      fontWeight: '600',
                                      marginBottom: '6px',
                                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                                    }}>
                                      {track.name}
                                    </div>
                                    <div style={{ 
                                      color: '#ffffff',
                                      fontSize: '12px',
                                      fontWeight: '500',
                                      opacity: 0.8,
                                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                                    }}>
                                      {track.artists?.[0]?.name || 'Unknown Artist'}
                                    </div>
                                  </div>
                                  <div style={{ 
                                    width: '12px', 
                                    height: '12px', 
                                    backgroundColor: '#1DB954', 
                                    borderRadius: '50%',
                                    opacity: 0.8,
                                    boxShadow: '0 2px 4px rgba(29, 185, 84, 0.4)'
                                  }} />
                                </div>
                              ))}
                            </div>
                          )}

                                                   {/* Top Artists View */}
                          {activeDataView === 'artists' && topArtists.length > 0 && (
                            <div style={{ 
                              background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.15) 0%, rgba(30, 215, 96, 0.15) 100%)',
                              borderRadius: '12px',
                              padding: spacing.large,
                              border: '1px solid rgba(29, 185, 84, 0.4)',
                              boxShadow: '0 8px 32px rgba(29, 185, 84, 0.2)'
                            }}>
                              {topArtists.slice(0, 10).map((artist, index) => (
                                <div key={artist.id} style={{ 
                                  display: 'flex', 
                                  alignItems: 'center',
                                  marginBottom: index < 9 ? spacing.large : 0,
                                  padding: spacing.medium,
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  borderRadius: '10px',
                                  transition: 'all 0.3s ease',
                                  cursor: 'pointer',
                                  border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                                  e.target.style.transform = 'translateX(6px) scale(1.02)';
                                  e.target.style.boxShadow = '0 4px 20px rgba(29, 185, 84, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                  e.target.style.transform = 'translateX(0) scale(1)';
                                  e.target.style.boxShadow = 'none';
                                }}
                                >
                                  <div style={{ 
                                    width: '32px', 
                                    height: '32px', 
                                    backgroundColor: '#1DB954', 
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: spacing.medium,
                                    fontSize: '14px',
                                    color: '#000000',
                                    fontWeight: 'bold',
                                    boxShadow: '0 2px 8px rgba(29, 185, 84, 0.4)'
                                  }}>
                                    {index + 1}
                                  </div>
                                  <div style={{ 
                                    color: '#ffffff',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    flex: 1,
                                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                                  }}>
                                    {artist.name}
                                  </div>
                                  <div style={{ 
                                    width: '12px', 
                                    height: '12px', 
                                    backgroundColor: '#1DB954', 
                                    borderRadius: '50%',
                                    opacity: 0.8,
                                    boxShadow: '0 2px 4px rgba(29, 185, 84, 0.4)'
                                  }} />
                                </div>
                              ))}
                            </div>
                          )}

                                                   {/* Recently Played View */}
                          {activeDataView === 'recent' && recentlyPlayed.length > 0 && (
                            <div style={{ 
                              background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.15) 0%, rgba(30, 215, 96, 0.15) 100%)',
                              borderRadius: '12px',
                              padding: spacing.large,
                              border: '1px solid rgba(29, 185, 84, 0.4)',
                              boxShadow: '0 8px 32px rgba(29, 185, 84, 0.2)'
                            }}>
                              {recentlyPlayed.slice(0, 10).map((track, index) => (
                                <div key={track.id} style={{ 
                                  display: 'flex', 
                                  alignItems: 'center',
                                  marginBottom: index < 9 ? spacing.large : 0,
                                  padding: spacing.medium,
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  borderRadius: '10px',
                                  transition: 'all 0.3s ease',
                                  cursor: 'pointer',
                                  border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                                  e.target.style.transform = 'translateX(6px) scale(1.02)';
                                  e.target.style.boxShadow = '0 4px 20px rgba(29, 185, 84, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                  e.target.style.transform = 'translateX(0) scale(1)';
                                  e.target.style.boxShadow = 'none';
                                }}
                                >
                                  <div style={{ 
                                    width: '32px', 
                                    height: '32px', 
                                    backgroundColor: '#1DB954', 
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: spacing.medium,
                                    fontSize: '14px',
                                    color: '#000000',
                                    fontWeight: 'bold',
                                    boxShadow: '0 2px 8px rgba(29, 185, 84, 0.4)'
                                  }}>
                                    {index + 1}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ 
                                      color: '#ffffff',
                                      fontSize: '14px',
                                      fontWeight: '600',
                                      marginBottom: '6px',
                                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                                    }}>
                                      {track.name}
                                    </div>
                                    <div style={{ 
                                      color: '#ffffff',
                                      fontSize: '12px',
                                      fontWeight: '500',
                                      opacity: 0.8,
                                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                                    }}>
                                      {track.artists?.[0]?.name || 'Unknown Artist'}
                                    </div>
                                  </div>
                                  <div style={{ 
                                    width: '12px', 
                                    height: '12px', 
                                    backgroundColor: '#1DB954', 
                                    borderRadius: '50%',
                                    opacity: 0.8,
                                    boxShadow: '0 2px 4px rgba(29, 185, 84, 0.4)'
                                  }} />
                                </div>
                              ))}
                            </div>
                          )}
                       </div>
                     )}
                  </div>
                </Card>
              )}

                         {/* Hotkey Setting Card */}
             <Card style={{
               marginBottom: spacing.medium,
               background: 'rgba(255, 255, 255, 0.1)',
               border: '1px solid rgba(255, 255, 255, 0.2)',
               backdropFilter: 'blur(10px)'
             }}>
               <div style={{ padding: spacing.medium }}>
                 <Text variant="body" style={{ 
                   marginBottom: spacing.medium,
                   color: '#ffffff',
                   fontWeight: '600',
                   fontSize: '14px'
                 }}>
                   Widget Hotkey
                 </Text>
                 <WInput
                   type="text"
                   value={hotkeyInput}
                   onChange={handleHotkeyChange}
                   onBlur={handleHotkeyBlur}
                   onFocus={handleHotkeyFocus}
                   onKeyPress={handleHotkeyKeyPress}
                   onKeyDown={handleHotkeyKeyDown}
                   placeholder={isEditingHotkey ? "Press a key combination..." : "Click to set hotkey"}
                   style={{ 
                     width: '100%',
                     backgroundColor: 'rgba(255, 255, 255, 0.9)',
                     border: '2px solid rgba(255, 255, 255, 0.3)',
                     color: '#000000',
                     marginBottom: spacing.small
                   }}
                   readOnly={isEditingHotkey}
                 />
                 <Text variant="caption" style={{ 
                   opacity: 0.7, 
                   color: '#ffffff',
                   fontSize: '11px'
                 }}>
                   Press the key combination to show/hide the Spotify widget
                 </Text>
               </div>
             </Card>

                         {/* Widget Settings Card */}
             <Card style={{
               marginBottom: spacing.medium,
               background: 'rgba(255, 255, 255, 0.1)',
               border: '1px solid rgba(255, 255, 255, 0.2)',
               backdropFilter: 'blur(10px)'
             }}>
               <div style={{ padding: spacing.medium }}>
                 <Text variant="body" style={{ 
                   marginBottom: spacing.medium,
                   color: '#ffffff',
                   fontWeight: '600',
                   fontSize: '14px'
                 }}>
                   Widget Settings
                 </Text>
                 
                 <div style={{ marginBottom: spacing.medium }}>
                   <WToggle
                     checked={spotify.settings.dynamicColors}
                     onChange={(checked) => handleSettingChange('dynamicColors', checked)}
                     label="Dynamic Colors"
                   />
                   <Text variant="caption" style={{ 
                     opacity: 0.7, 
                     marginLeft: spacing.small, 
                     marginTop: spacing.xsmall,
                     color: '#ffffff',
                     fontSize: '11px'
                   }}>
                     Extract colors from album art for adaptive theming
                   </Text>
                 </div>

                 <div style={{ marginBottom: spacing.medium }}>
                   <WToggle
                     checked={spotify.settings.useBlurredBackground}
                     onChange={(checked) => handleSettingChange('useBlurredBackground', checked)}
                     label="Blurred Album Art Background"
                   />
                   <Text variant="caption" style={{ 
                     opacity: 0.7, 
                     marginLeft: spacing.small, 
                     marginTop: spacing.xsmall,
                     color: '#ffffff',
                     fontSize: '11px'
                   }}>
                     Use blurred album art instead of gradient background
                   </Text>
                 </div>

                 {spotify.settings.useBlurredBackground && (
                   <div style={{ marginBottom: spacing.medium, marginLeft: spacing.small }}>
                     <Text variant="caption" style={{ 
                       marginBottom: spacing.xsmall,
                       color: '#ffffff',
                       fontSize: '12px'
                     }}>
                       Blur Amount
                     </Text>
                     <Slider
                       value={spotify.settings.blurAmount}
                       onChange={(value) => handleSettingChange('blurAmount', value)}
                       min={0}
                       max={100}
                       step={5}
                     />
                     <Text variant="caption" style={{ 
                       opacity: 0.7, 
                       marginTop: spacing.xsmall,
                       color: '#ffffff',
                       fontSize: '11px'
                     }}>
                       {spotify.settings.blurAmount}% blur
                     </Text>
                   </div>
                 )}

                 <div style={{ marginBottom: spacing.medium }}>
                   <WToggle
                     checked={spotify.settings.autoShowWidget}
                     onChange={(checked) => handleSettingChange('autoShowWidget', checked)}
                     label="Auto-show Widget"
                   />
                   <Text variant="caption" style={{ 
                     opacity: 0.7, 
                     marginLeft: spacing.small, 
                     marginTop: spacing.xsmall,
                     color: '#ffffff',
                     fontSize: '11px'
                   }}>
                     Automatically show widget when playback starts
                   </Text>
                 </div>

                 <div style={{ marginBottom: spacing.medium }}>
                   <Text variant="caption" style={{ 
                     marginBottom: spacing.xsmall,
                     color: '#ffffff',
                     fontWeight: '600',
                     fontSize: '12px'
                   }}>
                     Widget Position
                   </Text>
                   <WButton
                     onClick={resetPosition}
                     variant="secondary"
                     size="sm"
                     style={{
                       backgroundColor: 'rgba(255, 255, 255, 0.2)',
                       borderColor: 'rgba(255, 255, 255, 0.3)',
                       color: '#ffffff'
                     }}
                   >
                     Reset to Center
                   </WButton>
                   <Text variant="caption" style={{ 
                     opacity: 0.7, 
                     marginLeft: spacing.small, 
                     marginTop: spacing.xsmall,
                     color: '#ffffff',
                     fontSize: '11px'
                   }}>
                     Reset widget position to center of screen
                   </Text>
                 </div>

                 <div style={{ marginBottom: spacing.small }}>
                   <Text variant="caption" style={{ 
                     marginBottom: spacing.xsmall,
                     color: '#ffffff',
                     fontWeight: '600',
                     fontSize: '12px'
                   }}>
                     Track Info Panel
                   </Text>
                   <div style={{ marginBottom: spacing.small }}>
                     <Text variant="caption" style={{ 
                       marginBottom: spacing.xsmall,
                       color: '#ffffff',
                       fontSize: '11px'
                     }}>
                       Panel Opacity
                     </Text>
                     <Slider
                       value={spotify.settings.trackInfoPanelOpacity}
                       onChange={(value) => handleSettingChange('trackInfoPanelOpacity', value)}
                       min={0.1}
                       max={1}
                       step={0.1}
                     />
                     <Text variant="caption" style={{ 
                       opacity: 0.7, 
                       marginTop: spacing.xsmall,
                       color: '#ffffff',
                       fontSize: '11px'
                     }}>
                       {Math.round(spotify.settings.trackInfoPanelOpacity * 100)}% opacity
                     </Text>
                   </div>
                   <div>
                     <Text variant="caption" style={{ 
                       marginBottom: spacing.xsmall,
                       color: '#ffffff',
                       fontSize: '11px'
                     }}>
                       Panel Blur
                     </Text>
                     <Slider
                       value={spotify.settings.trackInfoPanelBlur}
                       onChange={(value) => handleSettingChange('trackInfoPanelBlur', value)}
                       min={0}
                       max={30}
                       step={1}
                     />
                     <Text variant="caption" style={{ 
                       opacity: 0.7, 
                       marginTop: spacing.xsmall,
                       color: '#ffffff',
                       fontSize: '11px'
                     }}>
                       {spotify.settings.trackInfoPanelBlur}px blur
                     </Text>
                   </div>
                   <Text variant="caption" style={{ 
                     opacity: 0.7, 
                     marginTop: spacing.small,
                     color: '#ffffff',
                     fontSize: '11px'
                   }}>
                     Control the appearance of the track info panel in the Now Playing view
                   </Text>
                 </div>
               </div>
             </Card>
          </div>
        )}
      </Card>

      {/* Future Integrations Placeholder */}
      <Card style={{ opacity: 0.6 }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: spacing.medium }}>
          <span style={{ fontSize: '24px', marginRight: spacing.medium }}>🔮</span>
          <div style={{ flex: 1 }}>
            <Text variant="h3" style={{ marginBottom: spacing.xsmall }}>More Integrations Coming Soon</Text>
            <Text variant="caption" style={{ opacity: 0.7 }}>
              YouTube Music, Apple Music, and more integrations are planned
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ApiIntegrationsSettingsTab; 