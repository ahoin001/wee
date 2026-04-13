import React from 'react';
import { useSpotifyStore } from '../utils/useSpotifyStore';
import Card from '../ui/Card';
import Text from '../ui/Text';
import WButton from '../ui/WButton';
import './spotify-test-channel.css';

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
    <div className="spotify-test-root">
      <Card>
        <Text variant="h2" className="spotify-test-title">
          🎵 Spotify Integration Test
        </Text>
        
        {error && (
          <Text variant="body" className="spotify-test-error">
            Error: {error}
          </Text>
        )}
        
        {!isAuthenticated ? (
          <div>
            <Text variant="body" className="spotify-test-body">
              Connect your Spotify account to start controlling your music.
            </Text>
            <WButton 
              onClick={authenticate}
              variant="primary"
              className="spotify-test-btn-spotify"
            >
              Connect Spotify Account
            </WButton>
          </div>
        ) : (
          <div>
            <Text variant="h3" className="mb-2.5 block">
              Welcome, {currentUser?.display_name || 'User'}!
            </Text>
            
            {currentTrack ? (
              <div className="mb-5">
                <Text variant="h4" className="mb-2.5 block">
                  Now Playing:
                </Text>
                <div className="flex items-center gap-4">
                  {currentTrack.albumArt && (
                    <img 
                      src={currentTrack.albumArt} 
                      alt="Album Art" 
                      className="spotify-test-album-art"
                    />
                  )}
                  <div>
                    <Text variant="body" className="font-bold">
                      {currentTrack.title}
                    </Text>
                    <Text variant="body" className="spotify-test-muted">
                      {currentTrack.artist} • {currentTrack.album}
                    </Text>
                  </div>
                </div>
              </div>
            ) : (
              <Text variant="body" className="spotify-test-body spotify-test-muted">
                No track currently playing
              </Text>
            )}
            
            <div className="spotify-test-controls">
              <WButton 
                onClick={togglePlayback}
                variant="secondary"
                className="spotify-test-btn-spotify text-white"
              >
                {isPlaying ? '⏸️ Pause' : '▶️ Play'}
              </WButton>
              
              <WButton 
                onClick={skipToPrevious}
                variant="secondary"
                className="spotify-test-btn-dark"
              >
                ⏮️ Previous
              </WButton>
              
              <WButton 
                onClick={skipToNext}
                variant="secondary"
                className="spotify-test-btn-dark"
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
