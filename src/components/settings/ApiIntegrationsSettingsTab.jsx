import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import WToggle from '../../ui/WToggle';
import WButton from '../../ui/WButton';
import WInput from '../../ui/WInput';
import Slider from '../../ui/Slider';
import Text from '../../ui/Text';
import CollapsibleSection from '../../ui/CollapsibleSection';
import useApiIntegrationsStore from '../../utils/useApiIntegrationsStore';
import useUIStore from '../../utils/useUIStore';
import { useSpotifyStore } from '../../utils/useSpotifyStore';
import useFloatingWidgetStore from '../../utils/useFloatingWidgetStore';
import useSystemInfoStore from '../../utils/useSystemInfoStore';
import { formatShortcut, parseShortcut } from '../../utils/keyboardShortcuts';

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
  const { updateInterval, setUpdateInterval } = useSystemInfoStore();
  
  const spotifyShortcut = keyboardShortcuts.find(s => s.id === 'toggle-spotify-widget');
  const systemInfoShortcut = keyboardShortcuts.find(s => s.id === 'toggle-system-info-widget');

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

  // Spotify icon component
  const SpotifyIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="#1DB954">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );

  return (
    <div className="p-6">
      <Text variant="h2" className="mb-8">
        API & Widgets
      </Text>
      
      <Text variant="body" className="mb-8 opacity-80">
        Connect external services to enable floating widgets and enhanced features.
      </Text>

      {/* Spotify Integration */}
      <CollapsibleSection
        title="Spotify"
        description={currentUser ? `Connected as ${currentUser.displayName}` : 'Music playback and floating widget'}
        icon={<SpotifyIcon />}
        iconBgColor="#000000"
        gradientBg="linear-gradient(135deg, #1DB954 0%, #1ed760 100%)"
        borderColor="#1DB954"
        shadowColor="rgba(29, 185, 84, 0.3)"
        isEnabled={spotify.isEnabled}
        onToggle={toggleSpotifyEnabled}
      >
        {/* Connection Status Card */}
        <Card className="mb-6" style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="flex items-center p-6">
            <div className="flex-1">
              <Text variant="body" className="mb-1 text-white font-semibold text-sm">
                Connection Status
              </Text>
              <Text variant="caption" className="text-white text-xs opacity-80">
                {spotify.isConnected ? '✅ Connected' : '❌ Not connected'}
              </Text>
            </div>
            <WButton
              onClick={handleSpotifyConnection}
              disabled={isConnecting}
              variant={spotify.isConnected ? 'secondary' : 'primary'}
              size="sm"
              className={`${
                spotify.isConnected
                  ? 'bg-[#ff4444] border-[#ff4444]'
                  : 'bg-[#1DB954] border-[#1DB954]'
              } text-white`}
            >
              {isConnecting ? 'Connecting...' : (spotify.isConnected ? 'Disconnect' : 'Connect')}
            </WButton>
          </div>
        </Card>

        {/* Popular API Features Card */}
        {spotify.isConnected && (
          <Card className="mb-6" style={{
          background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
            <div className="p-6">
              <Text variant="body" className="mb-6 text-white font-semibold text-sm">
                Popular Features
              </Text>
              
              {/* Time Range Selection */}
              <div className="mb-6 p-6 rounded-lg border" style={{
                background: 'rgba(0, 0, 0, 0.2)',
                borderColor: 'rgba(255, 255, 255, 0.1)'
              }}>
                <Text variant="caption" className="mb-2 text-white font-semibold text-xs">
                  Time Period
                </Text>
                <div className="flex flex-wrap gap-2">
                  <WButton
                    onClick={() => setSelectedTimeRange('short_term')}
                    variant={selectedTimeRange === 'short_term' ? 'primary' : 'secondary'}
                    size="sm"
                    className={`${
                      selectedTimeRange === 'short_term'
                        ? 'bg-[#1DB954] border-[#1DB954]'
                        : 'bg-white/10 border-white/20'
                    } text-white text-[11px] px-3 py-1.5`}
                  >
                    Last 4 Weeks
                  </WButton>
                  <WButton
                    onClick={() => setSelectedTimeRange('medium_term')}
                    variant={selectedTimeRange === 'medium_term' ? 'primary' : 'secondary'}
                    size="sm"
                    className={`${
                      selectedTimeRange === 'medium_term'
                        ? 'bg-[#1DB954] border-[#1DB954]'
                        : 'bg-white/10 border-white/20'
                    } text-white text-[11px] px-3 py-1.5`}
                  >
                    Last 6 Months
                  </WButton>
                  <WButton
                    onClick={() => setSelectedTimeRange('long_term')}
                    variant={selectedTimeRange === 'long_term' ? 'primary' : 'secondary'}
                    size="sm"
                    className={`${
                      selectedTimeRange === 'long_term'
                        ? 'bg-[#1DB954] border-[#1DB954]'
                        : 'bg-white/10 border-white/20'
                    } text-white text-[11px] px-3 py-1.5`}
                  >
                    All Time
                  </WButton>
          </div>
                <Text variant="caption" className="mt-1 text-white opacity-70 text-[10px]">
                  Select time period for Top Tracks and Top Artists
                </Text>
              </div>
              
              <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <WButton
                  onClick={handleLoadTopTracks}
                  disabled={isLoadingData}
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 border-white/30 text-white"
                >
                  🎵 Top Tracks
                </WButton>
                <WButton
                  onClick={handleLoadTopArtists}
                  disabled={isLoadingData}
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 border-white/30 text-white"
                >
                  👤 Top Artists
                </WButton>
                <WButton
                  onClick={handleLoadRecentlyPlayed}
                  disabled={isLoadingData}
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 border-white/30 text-white"
                >
                  ⏰ Recently Played
                </WButton>
              </div>
              {isLoadingData && (
                <Text variant="caption" className="mt-2 text-white opacity-70 text-[11px]">
                  Loading data...
                </Text>
              )}

              {/* Display loaded data */}
              {!isLoadingData && activeDataView && (
                <div className="mt-8">
                  {/* Data View Header */}
                  <div className="flex items-center justify-between mb-6 p-6 rounded-xl border" style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <div className="flex items-center">
                      <span className="text-[18px] mr-6">🎵</span>
                      <Text variant="caption" className="text-white font-semibold text-[14px]">
                        {activeDataView === 'tracks' && `Top Tracks (${topTracks.length}) - ${getTimeRangeLabel(selectedTimeRange)}`}
                        {activeDataView === 'artists' && `Top Artists (${topArtists.length}) - ${getTimeRangeLabel(selectedTimeRange)}`}
                        {activeDataView === 'recent' && `Recently Played (${recentlyPlayed.length})`}
                      </Text>
                    </div>
                    <WButton
                      onClick={() => setActiveDataView(null)}
                      variant="secondary"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white px-3 py-1 text-[11px]"
                    >
                      ✕ Close
                    </WButton>
                  </div>
                  
                  {/* Top Tracks View */}
                  {activeDataView === 'tracks' && topTracks.length > 0 && (
                    <div className="rounded-xl p-8" style={{
                      background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.15) 0%, rgba(30, 215, 96, 0.15) 100%)',
                      border: '1px solid rgba(29, 185, 84, 0.4)',
                      boxShadow: '0 8px 32px rgba(29, 185, 84, 0.2)'
                    }}>
                      {topTracks.slice(0, 10).map((track, index) => (
                        <div
                          key={track.id}
                          className="flex items-center mb-8 last:mb-0 p-6 rounded-lg cursor-pointer transition-all"
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                            e.currentTarget.style.transform = 'translateX(6px) scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(29, 185, 84, 0.3)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.transform = 'translateX(0) scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div className="w-8 h-8 flex items-center justify-center rounded-full mr-6 font-bold" style={{
                            backgroundColor: '#1DB954',
                            color: '#000000',
                            fontSize: '14px',
                            boxShadow: '0 2px 8px rgba(29, 185, 84, 0.4)'
                          }}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-semibold text-[14px] mb-1" style={{
                              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                            }}>
                              {track.name}
                            </div>
                            <div className="text-white text-[12px] font-medium opacity-80" style={{
                              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                            }}>
                              {track.artists?.[0]?.name || 'Unknown Artist'}
                            </div>
                          </div>
                          <div className="w-3 h-3 rounded-full opacity-80" style={{
                            backgroundColor: '#1DB954',
                            boxShadow: '0 2px 4px rgba(29, 185, 84, 0.4)'
                          }} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Top Artists View */}
                  {activeDataView === 'artists' && topArtists.length > 0 && (
                    <div className="rounded-xl p-8" style={{
                      background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.15) 0%, rgba(30, 215, 96, 0.15) 100%)',
                      border: '1px solid rgba(29, 185, 84, 0.4)',
                      boxShadow: '0 8px 32px rgba(29, 185, 84, 0.2)'
                    }}>
                      {topArtists.slice(0, 10).map((artist, index) => (
                        <div
                          key={artist.id}
                          className="flex items-center mb-8 last:mb-0 p-6 rounded-lg cursor-pointer transition-all"
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                            e.currentTarget.style.transform = 'translateX(6px) scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(29, 185, 84, 0.3)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.transform = 'translateX(0) scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div className="w-8 h-8 flex items-center justify-center rounded-full mr-6 font-bold" style={{
                            backgroundColor: '#1DB954',
                            color: '#000000',
                            fontSize: '14px',
                            boxShadow: '0 2px 8px rgba(29, 185, 84, 0.4)'
                          }}>
                            {index + 1}
                          </div>
                          <div className="text-white font-semibold text-[14px] flex-1" style={{
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                          }}>
                            {artist.name}
                          </div>
                          <div className="w-3 h-3 rounded-full opacity-80" style={{
                            backgroundColor: '#1DB954',
                            boxShadow: '0 2px 4px rgba(29, 185, 84, 0.4)'
                          }} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recently Played View */}
                  {activeDataView === 'recent' && recentlyPlayed.length > 0 && (
                    <div className="rounded-xl p-8" style={{
                      background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.15) 0%, rgba(30, 215, 96, 0.15) 100%)',
                      border: '1px solid rgba(29, 185, 84, 0.4)',
                      boxShadow: '0 8px 32px rgba(29, 185, 84, 0.2)'
                    }}>
                      {recentlyPlayed.slice(0, 10).map((track, index) => (
                        <div
                          key={track.id}
                          className="flex items-center mb-8 last:mb-0 p-6 rounded-lg cursor-pointer transition-all"
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                            e.currentTarget.style.transform = 'translateX(6px) scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(29, 185, 84, 0.3)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.transform = 'translateX(0) scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div className="w-8 h-8 flex items-center justify-center rounded-full mr-6 font-bold" style={{
                            backgroundColor: '#1DB954',
                            color: '#000000',
                            fontSize: '14px',
                            boxShadow: '0 2px 8px rgba(29, 185, 84, 0.4)'
                          }}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-semibold text-[14px] mb-1" style={{
                              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                            }}>
                              {track.name}
                            </div>
                            <div className="text-white text-[12px] font-medium opacity-80" style={{
                              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                            }}>
                              {track.artists?.[0]?.name || 'Unknown Artist'}
                            </div>
                          </div>
                          <div className="w-3 h-3 rounded-full opacity-80" style={{
                            backgroundColor: '#1DB954',
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
        <Card className="mb-6" style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="p-6">
            <Text variant="body" className="mb-6 text-white font-semibold text-sm">
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
              className="w-full mb-2"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: '#000000'
              }}
              readOnly={isEditingHotkey}
            />
            <Text variant="caption" className="opacity-70 text-white text-[11px]">
              Press the key combination to show/hide the Spotify widget
            </Text>
          </div>
        </Card>

        {/* Widget Settings Card */}
        <Card className="mb-6" style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="p-6">
            <Text variant="body" className="mb-6 text-white font-semibold text-sm">
              Widget Settings
            </Text>
            
            <div className="mb-6">
              <WToggle
                checked={spotify.settings.dynamicColors}
                onChange={(checked) => handleSettingChange('dynamicColors', checked)}
                label="Dynamic Colors"
              />
              <Text variant="caption" className="opacity-70 ml-2 mt-1 text-white text-[11px]">
                Extract colors from album art for adaptive theming
              </Text>
            </div>

            <div className="mb-6">
              <WToggle
                checked={spotify.settings.useBlurredBackground}
                onChange={(checked) => handleSettingChange('useBlurredBackground', checked)}
                label="Blurred Album Art Background"
              />
              <Text variant="caption" className="opacity-70 ml-2 mt-1 text-white text-[11px]">
                Use blurred album art instead of gradient background
              </Text>
            </div>

            {spotify.settings.useBlurredBackground && (
              <div className="mb-6 ml-2">
                <Text variant="caption" className="mb-1 text-white text-[12px]">
                  Blur Amount
                </Text>
                <Slider
                  value={spotify.settings.blurAmount}
                  onChange={(value) => handleSettingChange('blurAmount', value)}
                  min={0}
                  max={100}
                  step={5}
                />
                <Text variant="caption" className="opacity-70 mt-1 text-white text-[11px]">
                  {spotify.settings.blurAmount}% blur
                </Text>
              </div>
            )}

            <div className="mb-6">
              <WToggle
                checked={spotify.settings.autoShowWidget}
                onChange={(checked) => handleSettingChange('autoShowWidget', checked)}
                label="Auto-show Widget"
              />
              <Text variant="caption" className="opacity-70 ml-2 mt-1 text-white text-[11px]">
                Automatically show widget when playback starts
              </Text>
            </div>

            <div className="mb-6">
              <Text variant="caption" className="mb-1 text-white font-semibold text-[12px]">
                Widget Position
              </Text>
              <WButton
                onClick={resetPosition}
                variant="secondary"
                size="sm"
                className="bg-white/20 border-white/30 text-white"
              >
                Reset to Center
              </WButton>
              <Text variant="caption" className="opacity-70 ml-2 mt-1 text-white text-[11px]">
                Reset widget position to center of screen
              </Text>
            </div>

            <div className="mb-2">
              <Text variant="caption" className="mb-1 text-white font-semibold text-[12px]">
                Track Info Panel
              </Text>
              <div className="mb-2">
                <Text variant="caption" className="mb-1 text-white text-[11px]">
                  Panel Opacity
                </Text>
                <Slider
                  value={spotify.settings.trackInfoPanelOpacity}
                  onChange={(value) => handleSettingChange('trackInfoPanelOpacity', value)}
                  min={0.1}
                  max={1}
                  step={0.1}
                />
                <Text variant="caption" className="opacity-70 mt-1 text-white text-[11px]">
                  {Math.round(spotify.settings.trackInfoPanelOpacity * 100)}% opacity
                </Text>
              </div>
              <div>
                <Text variant="caption" className="mb-1 text-white text-[11px]">
                  Panel Blur
                </Text>
                <Slider
                  value={spotify.settings.trackInfoPanelBlur}
                  onChange={(value) => handleSettingChange('trackInfoPanelBlur', value)}
                  min={0}
                  max={30}
                  step={1}
                />
                <Text variant="caption" className="opacity-70 mt-1 text-white text-[11px]">
                  {spotify.settings.trackInfoPanelBlur}px blur
                </Text>
              </div>
              <Text variant="caption" className="opacity-70 mt-2 text-white text-[11px]">
                Control the appearance of the track info panel in the Now Playing view
              </Text>
            </div>
          </div>
        </Card>
      </CollapsibleSection>

      {/* System Info Widget */}
      <CollapsibleSection
        title="System Info Widget"
        description="Real-time system monitoring and performance metrics"
        icon="📊"
        iconBgColor="#ffffff"
        gradientBg="linear-gradient(135deg, #2196F3 0%, #1976D2 100%)"
        borderColor="#2196F3"
        shadowColor="rgba(33, 150, 243, 0.3)"
        isEnabled={true}
        onToggle={() => {}}
      >
        {/* Widget Settings Card */}
        <Card className="mb-6" style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="p-6">
            <Text variant="body" className="mb-6 text-white font-semibold text-sm">
              Widget Settings
            </Text>
            
            <div className="mb-6">
              <Text variant="caption" className="mb-1 text-white font-semibold text-xs">
                Update Interval
              </Text>
              <Slider
                value={updateInterval / 1000}
                onChange={(value) => setUpdateInterval(value * 1000)}
                min={0}
                max={10}
                step={1}
              />
              <Text variant="caption" className="opacity-70 mt-1 text-white text-[11px]">
                {updateInterval === 0 ? 'Off' : `${updateInterval / 1000} seconds`}
              </Text>
              <Text variant="caption" className="opacity-70 mt-1 text-white text-[11px]">
                Set to 0 to disable automatic updates
              </Text>
            </div>

            <div className="mb-6">
              <Text variant="caption" className="mb-1 text-white font-semibold text-xs">
                Widget Hotkey
              </Text>
              <WInput
                type="text"
                value={systemInfoShortcut ? formatShortcut({ 
                  key: systemInfoShortcut.key, 
                  modifier: systemInfoShortcut.modifier 
                }) : 'Ctrl+I'}
                onChange={() => {}}
                placeholder="Hotkey"
                className="w-full mb-2"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  color: '#000000'
                }}
                readOnly
              />
              <Text variant="caption" className="opacity-70 text-white text-[11px]">
                Press the key combination to show/hide the System Info widget
              </Text>
            </div>

            <div className="mb-2">
              <Text variant="caption" className="mb-1 text-white font-semibold text-xs">
                Features
              </Text>
              <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                <div className="p-2 rounded-md" style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <Text variant="caption" className="text-white text-[11px] font-semibold">
                    📊 CPU & Memory
                  </Text>
                </div>
                <div className="p-2 rounded-md" style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <Text variant="caption" className="text-white text-[11px] font-semibold">
                    🎮 GPU & Storage
                  </Text>
                </div>
                <div className="p-2 rounded-md" style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <Text variant="caption" className="text-white text-[11px] font-semibold">
                    🔋 Battery & Power
                  </Text>
                </div>
                <div className="p-2 rounded-md" style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <Text variant="caption" className="text-white text-[11px] font-semibold">
                    🖥️ Task Manager
                  </Text>
                </div>
              </div>
              <Text variant="caption" className="opacity-70 text-white text-[11px]">
                Click on metrics to open relevant system applications
              </Text>
            </div>
          </div>
        </Card>
      </CollapsibleSection>

      {/* Future Integrations Placeholder */}
      <Card className="opacity-60">
        <div className="flex items-center p-6">
          <span className="text-[24px] mr-6">🔮</span>
          <div className="flex-1">
            <Text variant="h3" className="mb-1">More Integrations Coming Soon</Text>
            <Text variant="caption" className="opacity-70">
              YouTube Music, Apple Music, and more integrations are planned
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ApiIntegrationsSettingsTab; 
            <Text variant="h3" className="mb-1 text-white font-bold" style={{
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>
              Spotify
            </Text>
            <Text variant="caption" className="text-white" style={{
              opacity: 0.9, 
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
          <div className="pt-6 mt-6 border-t" style={{ borderTopColor: 'rgba(255, 255, 255, 0.15)' }}>
             {/* Connection Status Card */}
            <Card className="mb-6" style={{
               background: 'rgba(255, 255, 255, 0.1)',
               border: '1px solid rgba(255, 255, 255, 0.2)',
               backdropFilter: 'blur(10px)'
             }}>
              <div className="flex items-center p-6">
                <div className="flex-1">
                  <Text variant="body" className="mb-1 text-white font-semibold text-sm">
                     Connection Status
                   </Text>
                  <Text variant="caption" className="text-white text-xs opacity-80">
                     {spotify.isConnected ? '✅ Connected' : '❌ Not connected'}
                   </Text>
                 </div>
                 <WButton
                   onClick={handleSpotifyConnection}
                   disabled={isConnecting}
                   variant={spotify.isConnected ? 'secondary' : 'primary'}
                   size="sm"
                  className={`${
                    spotify.isConnected
                      ? 'bg-[#ff4444] border-[#ff4444]'
                      : 'bg-[#1DB954] border-[#1DB954]'
                  } text-white`}
                 >
                   {isConnecting ? 'Connecting...' : (spotify.isConnected ? 'Disconnect' : 'Connect')}
                 </WButton>
               </div>
             </Card>

                         {/* Popular API Features Card */}
             {spotify.isConnected && (
              <Card className="mb-6" style={{
                 background: 'rgba(255, 255, 255, 0.1)',
                 border: '1px solid rgba(255, 255, 255, 0.2)',
                 backdropFilter: 'blur(10px)'
               }}>
                <div className="p-6">
                  <Text variant="body" className="mb-6 text-white font-semibold text-sm">
                      Popular Features
                    </Text>
                    
                    {/* Time Range Selection */}
                  <div className="mb-6 p-6 rounded-lg border" style={{
                      background: 'rgba(0, 0, 0, 0.2)',
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                  }}>
                    <Text variant="caption" className="mb-2 text-white font-semibold text-xs">
                        Time Period
                      </Text>
                    <div className="flex flex-wrap gap-2">
                        <WButton
                          onClick={() => setSelectedTimeRange('short_term')}
                          variant={selectedTimeRange === 'short_term' ? 'primary' : 'secondary'}
                          size="sm"
                        className={`${
                          selectedTimeRange === 'short_term'
                            ? 'bg-[#1DB954] border-[#1DB954]'
                            : 'bg-white/10 border-white/20'
                        } text-white text-[11px] px-3 py-1.5`}
                        >
                          Last 4 Weeks
                        </WButton>
                        <WButton
                          onClick={() => setSelectedTimeRange('medium_term')}
                          variant={selectedTimeRange === 'medium_term' ? 'primary' : 'secondary'}
                          size="sm"
                        className={`${
                          selectedTimeRange === 'medium_term'
                            ? 'bg-[#1DB954] border-[#1DB954]'
                            : 'bg-white/10 border-white/20'
                        } text-white text-[11px] px-3 py-1.5`}
                        >
                          Last 6 Months
                        </WButton>
                        <WButton
                          onClick={() => setSelectedTimeRange('long_term')}
                          variant={selectedTimeRange === 'long_term' ? 'primary' : 'secondary'}
                          size="sm"
                        className={`${
                          selectedTimeRange === 'long_term'
                            ? 'bg-[#1DB954] border-[#1DB954]'
                            : 'bg-white/10 border-white/20'
                        } text-white text-[11px] px-3 py-1.5`}
                        >
                          All Time
                        </WButton>
                      </div>
                    <Text variant="caption" className="mt-1 text-white opacity-70 text-[10px]">
                        Select time period for Top Tracks and Top Artists
                      </Text>
                    </div>
                    
                  <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                      <WButton
                        onClick={handleLoadTopTracks}
                        disabled={isLoadingData}
                        variant="secondary"
                        size="sm"
                      className="bg-white/20 border-white/30 text-white"
                      >
                        🎵 Top Tracks
                      </WButton>
                      <WButton
                        onClick={handleLoadTopArtists}
                        disabled={isLoadingData}
                        variant="secondary"
                        size="sm"
                      className="bg-white/20 border-white/30 text-white"
                      >
                        👤 Top Artists
                      </WButton>
                      <WButton
                        onClick={handleLoadRecentlyPlayed}
                        disabled={isLoadingData}
                        variant="secondary"
                        size="sm"
                      className="bg-white/20 border-white/30 text-white"
                      >
                        ⏰ Recently Played
                      </WButton>
                    </div>
                                       {isLoadingData && (
                    <Text variant="caption" className="mt-2 text-white opacity-70 text-[11px]">
                        Loading data...
                      </Text>
                    )}

                                         {/* Display loaded data */}
                     {!isLoadingData && activeDataView && (
                    <div className="mt-8">
                         {/* Data View Header */}
                      <div className="flex items-center justify-between mb-6 p-6 rounded-xl border" style={{
                           background: 'rgba(0, 0, 0, 0.4)',
                           border: '1px solid rgba(255, 255, 255, 0.2)',
                           backdropFilter: 'blur(10px)'
                         }}>
                        <div className="flex items-center">
                          <span className="text-[18px] mr-6">🎵</span>
                          <Text variant="caption" className="text-white font-semibold text-[14px]">
                                {activeDataView === 'tracks' && `Top Tracks (${topTracks.length}) - ${getTimeRangeLabel(selectedTimeRange)}`}
                                {activeDataView === 'artists' && `Top Artists (${topArtists.length}) - ${getTimeRangeLabel(selectedTimeRange)}`}
                                {activeDataView === 'recent' && `Recently Played (${recentlyPlayed.length})`}
                              </Text>
                           </div>
                           <WButton
                             onClick={() => setActiveDataView(null)}
                             variant="secondary"
                             size="sm"
                          className="bg-white/10 border-white/20 text-white px-3 py-1 text-[11px]"
                           >
                             ✕ Close
                           </WButton>
                         </div>
                         
                                                   {/* Top Tracks View */}
                          {activeDataView === 'tracks' && topTracks.length > 0 && (
                        <div className="rounded-xl p-8" style={{
                              background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.15) 0%, rgba(30, 215, 96, 0.15) 100%)',
                              border: '1px solid rgba(29, 185, 84, 0.4)',
                              boxShadow: '0 8px 32px rgba(29, 185, 84, 0.2)'
                            }}>
                              {topTracks.slice(0, 10).map((track, index) => (
                            <div
                              key={track.id}
                              className="flex items-center mb-8 last:mb-0 p-6 rounded-lg cursor-pointer transition-all"
                              style={{
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                                e.currentTarget.style.transform = 'translateX(6px) scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 4px 20px rgba(29, 185, 84, 0.3)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.transform = 'translateX(0) scale(1)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <div className="w-8 h-8 flex items-center justify-center rounded-full mr-6 font-bold" style={{
                                    backgroundColor: '#1DB954', 
                                    color: '#000000',
                                fontSize: '14px',
                                    boxShadow: '0 2px 8px rgba(29, 185, 84, 0.4)'
                                  }}>
                                    {index + 1}
                                  </div>
                              <div className="flex-1">
                                <div className="text-white font-semibold text-[14px] mb-1" style={{
                                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                                    }}>
                                      {track.name}
                                    </div>
                                <div className="text-white text-[12px] font-medium opacity-80" style={{
                                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                                    }}>
                                      {track.artists?.[0]?.name || 'Unknown Artist'}
                                    </div>
                                  </div>
                              <div className="w-3 h-3 rounded-full opacity-80" style={{
                                    backgroundColor: '#1DB954', 
                                    boxShadow: '0 2px 4px rgba(29, 185, 84, 0.4)'
                                  }} />
                                </div>
                              ))}
                            </div>
                          )}

                                                   {/* Top Artists View */}
                          {activeDataView === 'artists' && topArtists.length > 0 && (
                        <div className="rounded-xl p-8" style={{
                              background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.15) 0%, rgba(30, 215, 96, 0.15) 100%)',
                              border: '1px solid rgba(29, 185, 84, 0.4)',
                              boxShadow: '0 8px 32px rgba(29, 185, 84, 0.2)'
                            }}>
                              {topArtists.slice(0, 10).map((artist, index) => (
                            <div
                              key={artist.id}
                              className="flex items-center mb-8 last:mb-0 p-6 rounded-lg cursor-pointer transition-all"
                              style={{
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                                e.currentTarget.style.transform = 'translateX(6px) scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 4px 20px rgba(29, 185, 84, 0.3)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.transform = 'translateX(0) scale(1)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <div className="w-8 h-8 flex items-center justify-center rounded-full mr-6 font-bold" style={{
                                    backgroundColor: '#1DB954', 
                                    color: '#000000',
                                fontSize: '14px',
                                    boxShadow: '0 2px 8px rgba(29, 185, 84, 0.4)'
                                  }}>
                                    {index + 1}
                                  </div>
                              <div className="text-white font-semibold text-[14px] flex-1" style={{
                                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                                  }}>
                                    {artist.name}
                                  </div>
                              <div className="w-3 h-3 rounded-full opacity-80" style={{
                                    backgroundColor: '#1DB954', 
                                    boxShadow: '0 2px 4px rgba(29, 185, 84, 0.4)'
                                  }} />
                                </div>
                              ))}
                            </div>
                          )}

                                                   {/* Recently Played View */}
                          {activeDataView === 'recent' && recentlyPlayed.length > 0 && (
                        <div className="rounded-xl p-8" style={{
                              background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.15) 0%, rgba(30, 215, 96, 0.15) 100%)',
                              border: '1px solid rgba(29, 185, 84, 0.4)',
                              boxShadow: '0 8px 32px rgba(29, 185, 84, 0.2)'
                            }}>
                              {recentlyPlayed.slice(0, 10).map((track, index) => (
                            <div
                              key={track.id}
                              className="flex items-center mb-8 last:mb-0 p-6 rounded-lg cursor-pointer transition-all"
                              style={{
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                                e.currentTarget.style.transform = 'translateX(6px) scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 4px 20px rgba(29, 185, 84, 0.3)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.transform = 'translateX(0) scale(1)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <div className="w-8 h-8 flex items-center justify-center rounded-full mr-6 font-bold" style={{
                                    backgroundColor: '#1DB954', 
                                    color: '#000000',
                                fontSize: '14px',
                                    boxShadow: '0 2px 8px rgba(29, 185, 84, 0.4)'
                                  }}>
                                    {index + 1}
                                  </div>
                              <div className="flex-1">
                                <div className="text-white font-semibold text-[14px] mb-1" style={{
                                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                                    }}>
                                      {track.name}
                                    </div>
                                <div className="text-white text-[12px] font-medium opacity-80" style={{
                                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                                    }}>
                                      {track.artists?.[0]?.name || 'Unknown Artist'}
                                    </div>
                                  </div>
                              <div className="w-3 h-3 rounded-full opacity-80" style={{
                                    backgroundColor: '#1DB954', 
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
            <Card className="mb-6" style={{
               background: 'rgba(255, 255, 255, 0.1)',
               border: '1px solid rgba(255, 255, 255, 0.2)',
               backdropFilter: 'blur(10px)'
             }}>
              <div className="p-6">
                <Text variant="body" className="mb-6 text-white font-semibold text-sm">
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
                  className="w-full mb-2"
                   style={{ 
                     backgroundColor: 'rgba(255, 255, 255, 0.9)',
                     border: '2px solid rgba(255, 255, 255, 0.3)',
                    color: '#000000'
                   }}
                   readOnly={isEditingHotkey}
                 />
                <Text variant="caption" className="opacity-70 text-white text-[11px]">
                   Press the key combination to show/hide the Spotify widget
                 </Text>
               </div>
             </Card>

                         {/* Widget Settings Card */}
            <Card className="mb-6" style={{
               background: 'rgba(255, 255, 255, 0.1)',
               border: '1px solid rgba(255, 255, 255, 0.2)',
               backdropFilter: 'blur(10px)'
             }}>
              <div className="p-6">
                <Text variant="body" className="mb-6 text-white font-semibold text-sm">
                   Widget Settings
                 </Text>
                 
                <div className="mb-6">
                   <WToggle
                     checked={spotify.settings.dynamicColors}
                     onChange={(checked) => handleSettingChange('dynamicColors', checked)}
                     label="Dynamic Colors"
                   />
                  <Text variant="caption" className="opacity-70 ml-2 mt-1 text-white text-[11px]">
                     Extract colors from album art for adaptive theming
                   </Text>
                 </div>

                <div className="mb-6">
                   <WToggle
                     checked={spotify.settings.useBlurredBackground}
                     onChange={(checked) => handleSettingChange('useBlurredBackground', checked)}
                     label="Blurred Album Art Background"
                   />
                  <Text variant="caption" className="opacity-70 ml-2 mt-1 text-white text-[11px]">
                     Use blurred album art instead of gradient background
                   </Text>
                 </div>

                 {spotify.settings.useBlurredBackground && (
                  <div className="mb-6 ml-2">
                    <Text variant="caption" className="mb-1 text-white text-[12px]">
                       Blur Amount
                     </Text>
                     <Slider
                       value={spotify.settings.blurAmount}
                       onChange={(value) => handleSettingChange('blurAmount', value)}
                       min={0}
                       max={100}
                       step={5}
                     />
                    <Text variant="caption" className="opacity-70 mt-1 text-white text-[11px]">
                       {spotify.settings.blurAmount}% blur
                     </Text>
                   </div>
                 )}

                <div className="mb-6">
                   <WToggle
                     checked={spotify.settings.autoShowWidget}
                     onChange={(checked) => handleSettingChange('autoShowWidget', checked)}
                     label="Auto-show Widget"
                   />
                  <Text variant="caption" className="opacity-70 ml-2 mt-1 text-white text-[11px]">
                     Automatically show widget when playback starts
                   </Text>
                 </div>

                <div className="mb-6">
                  <Text variant="caption" className="mb-1 text-white font-semibold text-[12px]">
                     Widget Position
                   </Text>
                   <WButton
                     onClick={resetPosition}
                     variant="secondary"
                     size="sm"
                    className="bg-white/20 border-white/30 text-white"
                   >
                     Reset to Center
                   </WButton>
                  <Text variant="caption" className="opacity-70 ml-2 mt-1 text-white text-[11px]">
                     Reset widget position to center of screen
                   </Text>
                 </div>

                <div className="mb-2">
                  <Text variant="caption" className="mb-1 text-white font-semibold text-[12px]">
                     Track Info Panel
                   </Text>
                  <div className="mb-2">
                    <Text variant="caption" className="mb-1 text-white text-[11px]">
                       Panel Opacity
                     </Text>
                     <Slider
                       value={spotify.settings.trackInfoPanelOpacity}
                       onChange={(value) => handleSettingChange('trackInfoPanelOpacity', value)}
                       min={0.1}
                       max={1}
                       step={0.1}
                     />
                    <Text variant="caption" className="opacity-70 mt-1 text-white text-[11px]">
                       {Math.round(spotify.settings.trackInfoPanelOpacity * 100)}% opacity
                     </Text>
                   </div>
                   <div>
                    <Text variant="caption" className="mb-1 text-white text-[11px]">
                       Panel Blur
                     </Text>
                     <Slider
                       value={spotify.settings.trackInfoPanelBlur}
                       onChange={(value) => handleSettingChange('trackInfoPanelBlur', value)}
                       min={0}
                       max={30}
                       step={1}
                     />
                    <Text variant="caption" className="opacity-70 mt-1 text-white text-[11px]">
                       {spotify.settings.trackInfoPanelBlur}px blur
                     </Text>
                   </div>
                  <Text variant="caption" className="opacity-70 mt-2 text-white text-[11px]">
                     Control the appearance of the track info panel in the Now Playing view
                   </Text>
                 </div>
               </div>
             </Card>
          </div>
        )}
      </Card>

      {/* System Info Widget */}
      <Card className="mb-8" style={{
        background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
        border: '2px solid #2196F3',
        boxShadow: '0 8px 32px rgba(33, 150, 243, 0.3)'
      }}>
        <div className="flex items-center mb-8 p-6 rounded-xl" style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          {/* System Info Icon */}
          <div className="w-14 h-14 flex items-center justify-center rounded-xl mr-6" style={{
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
          }}>
            <span className="text-[28px]">📊</span>
          </div>
          <div className="flex-1">
            <Text variant="h3" className="mb-1 text-white font-bold" style={{
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>
              System Info Widget
            </Text>
            <Text variant="caption" className="text-white" style={{
              opacity: 0.9,
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
            }}>
              Real-time system monitoring and performance metrics
            </Text>
          </div>
          <WToggle
            checked={true}
            onChange={() => {}}
            label="Enabled"
          />
        </div>

        <div className="pt-6 mt-6 border-t" style={{ borderTopColor: 'rgba(255, 255, 255, 0.15)' }}>
          {/* Widget Settings Card */}
          <Card className="mb-6" style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <div className="p-6">
              <Text variant="body" className="mb-6 text-white font-semibold text-sm">
                Widget Settings
              </Text>
              
              <div className="mb-6">
                <Text variant="caption" className="mb-1 text-white font-semibold text-xs">
                  Update Interval
                </Text>
                <Slider
                  value={updateInterval / 1000}
                  onChange={(value) => setUpdateInterval(value * 1000)}
                  min={0}
                  max={10}
                  step={1}
                />
                <Text variant="caption" className="opacity-70 mt-1 text-white text-[11px]">
                  {updateInterval === 0 ? 'Off' : `${updateInterval / 1000} seconds`}
                </Text>
                <Text variant="caption" className="opacity-70 mt-1 text-white text-[11px]">
                  Set to 0 to disable automatic updates
                </Text>
              </div>

              <div className="mb-6">
                <Text variant="caption" className="mb-1 text-white font-semibold text-xs">
                  Widget Hotkey
                </Text>
                <WInput
                  type="text"
                  value={systemInfoShortcut ? formatShortcut({ 
                    key: systemInfoShortcut.key, 
                    modifier: systemInfoShortcut.modifier 
                  }) : 'Ctrl+I'}
                  onChange={() => {}}
                  placeholder="Hotkey"
                  className="w-full mb-2"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    color: '#000000'
                  }}
                  readOnly
                />
                <Text variant="caption" className="opacity-70 text-white text-[11px]">
                  Press the key combination to show/hide the System Info widget
                </Text>
              </div>

              <div className="mb-2">
                <Text variant="caption" className="mb-1 text-white font-semibold text-xs">
                  Features
                </Text>
                <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                  <div className="p-2 rounded-md" style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <Text variant="caption" className="text-white text-[11px] font-semibold">
                      📊 CPU & Memory
                    </Text>
                  </div>
                  <div className="p-2 rounded-md" style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <Text variant="caption" className="text-white text-[11px] font-semibold">
                      🎮 GPU & Storage
                    </Text>
                  </div>
                  <div className="p-2 rounded-md" style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <Text variant="caption" className="text-white text-[11px] font-semibold">
                      🔋 Battery & Power
                    </Text>
                  </div>
                  <div className="p-2 rounded-md" style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <Text variant="caption" className="text-white text-[11px] font-semibold">
                      🖥️ Task Manager
                    </Text>
                  </div>
                </div>
                <Text variant="caption" className="opacity-70 text-white text-[11px]">
                  Click on metrics to open relevant system applications
                </Text>
              </div>
            </div>
          </Card>
        </div>
      </Card>

      {/* Future Integrations Placeholder */}
      <Card className="opacity-60">
        <div className="flex items-center p-6">
          <span className="text-[24px] mr-6">🔮</span>
          <div className="flex-1">
            <Text variant="h3" className="mb-1">More Integrations Coming Soon</Text>
            <Text variant="caption" className="opacity-70">
              YouTube Music, Apple Music, and more integrations are planned
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ApiIntegrationsSettingsTab; 