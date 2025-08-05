import React from 'react';
import { useSpotifyStore } from '../utils/useSpotifyStore';
import Card from '../ui/Card';
import Text from '../ui/Text';
import WButton from '../ui/WButton';

const SpotifyTestChannel = () => {
  const { 
    isAuthenticated, 
    currentUser, 
    currentTrack, 
    isPlaying, 
    authenticate, 
    togglePlayback, 
    skipToNext, 
    skipToPrevious,
    error 
  } = useSpotifyStore();

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <Card>
        <Text variant="h2" style={{ color: '#1db954', marginBottom: '20px' }}>
          🎵 Spotify Integration Test
        </Text>
        
        {error && (
          <Text variant="body" style={{ color: '#ff4444', marginBottom: '20px' }}>
            Error: {error}
          </Text>
        )}
        
        {!isAuthenticated ? (
          <div>
            <Text variant="body" style={{ marginBottom: '20px' }}>
              Connect your Spotify account to start controlling your music.
            </Text>
            <WButton 
              onClick={authenticate}
              variant="primary"
              style={{ backgroundColor: '#1db954', borderColor: '#1db954' }}
            >
              Connect Spotify Account
            </WButton>
          </div>
        ) : (
          <div>
            <Text variant="h3" style={{ marginBottom: '10px' }}>
              Welcome, {currentUser?.display_name || 'User'}!
            </Text>
            
            {currentTrack ? (
              <div style={{ marginBottom: '20px' }}>
                <Text variant="h4" style={{ marginBottom: '10px' }}>
                  Now Playing:
                </Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {currentTrack.albumArt && (
                    <img 
                      src={currentTrack.albumArt} 
                      alt="Album Art" 
                      style={{ width: '60px', height: '60px', borderRadius: '8px' }}
                    />
                  )}
                  <div>
                    <Text variant="body" style={{ fontWeight: 'bold' }}>
                      {currentTrack.title}
                    </Text>
                    <Text variant="body" style={{ color: '#888' }}>
                      {currentTrack.artist} • {currentTrack.album}
                    </Text>
                  </div>
                </div>
              </div>
            ) : (
              <Text variant="body" style={{ marginBottom: '20px', color: '#888' }}>
                No track currently playing
              </Text>
            )}
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <WButton 
                onClick={togglePlayback}
                variant="secondary"
                style={{ backgroundColor: '#1db954', borderColor: '#1db954', color: 'white' }}
              >
                {isPlaying ? '⏸️ Pause' : '▶️ Play'}
              </WButton>
              
              <WButton 
                onClick={skipToPrevious}
                variant="secondary"
                style={{ backgroundColor: '#333', borderColor: '#333', color: 'white' }}
              >
                ⏮️ Previous
              </WButton>
              
              <WButton 
                onClick={skipToNext}
                variant="secondary"
                style={{ backgroundColor: '#333', borderColor: '#333', color: 'white' }}
              >
                ⏭️ Next
              </WButton>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SpotifyTestChannel; 