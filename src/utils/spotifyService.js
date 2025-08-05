import SpotifyWebApi from 'spotify-web-api-js';

// Spotify API configuration
const SPOTIFY_CLIENT_ID = '0597b1eb9b1e4925934e142c2d0243bb';
// Use custom protocol for Electron app
const SPOTIFY_REDIRECT_URI = 'wee-desktop-launcher://spotify-callback';

// Scopes needed for music control
const SPOTIFY_SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-read-private',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-library-read',
  'user-library-modify',
  'user-top-read',
  'user-read-recently-played'
].join(' ');

class SpotifyService {
  constructor() {
    this.spotifyApi = new SpotifyWebApi();
    this.isAuthenticated = false;
    this.currentUser = null;
    this.currentTrack = null;
    this.isPlaying = false;
    this.deviceId = null;
  }

  // Initialize Spotify service
  async initialize() {
    try {
      // Check if we have a stored access token
      const accessToken = localStorage.getItem('spotify_access_token');
      const refreshToken = localStorage.getItem('spotify_refresh_token');
      
      if (accessToken) {
        this.spotifyApi.setAccessToken(accessToken);
        const isValid = await this.validateToken();
        
        if (isValid) {
          console.log('[SPOTIFY] Restored authentication from stored token');
          return true;
        } else {
          // Token is invalid, try to refresh it
          console.log('[SPOTIFY] Stored token is invalid, attempting refresh...');
          if (refreshToken) {
            const refreshResult = await this.refreshAccessToken(refreshToken);
            if (refreshResult.success) {
              console.log('[SPOTIFY] Successfully refreshed access token');
              return true;
            }
          }
          
          // Clear invalid tokens
          localStorage.removeItem('spotify_access_token');
          localStorage.removeItem('spotify_refresh_token');
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error('[SPOTIFY] Initialization error:', error);
      return false;
    }
  }

  // Validate current token by making a simple API call
  async validateToken() {
    try {
      const accessToken = localStorage.getItem('spotify_access_token');
      if (!accessToken) {
        return false;
      }

      // Try to get user profile to validate token
      const user = await this.spotifyApi.getMe();
      if (user) {
        this.currentUser = user;
        this.isAuthenticated = true;
        console.log('[SPOTIFY] Authenticated as:', user.display_name);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[SPOTIFY] Token validation failed:', error);
      this.isAuthenticated = false;
      return false;
    }
  }

  // Start OAuth flow
  authenticate() {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}&scope=${encodeURIComponent(SPOTIFY_SCOPES)}&show_dialog=true`;
    
    // Open auth URL in default browser
    window.api.openExternal(authUrl);
    
    // Listen for the callback
    window.api.onSpotifyAuthSuccess((data) => {
      this.handleAuthSuccess(data.code);
    });
    
    window.api.onSpotifyAuthError((data) => {
      console.error('[SPOTIFY] Authentication error:', data.error);
    });
  }

  // Handle successful authentication
  async handleAuthSuccess(code) {
    try {
      console.log('[SPOTIFY] Received authorization code');
      const result = await this.exchangeCodeForTokens(code);
      
      if (result.success) {
        this.isAuthenticated = true;
        this.currentUser = result.user;
        console.log('[SPOTIFY] Successfully authenticated as:', result.user.display_name);
        
        // Update the Zustand store
        const { useSpotifyStore } = await import('./useSpotifyStore');
        useSpotifyStore.getState().setAuthenticated(true);
        useSpotifyStore.getState().setCurrentUser(result.user);
        
        return true;
      } else {
        console.error('[SPOTIFY] Authentication failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('[SPOTIFY] Auth success handler error:', error);
      return false;
    }
  }

  // Exchange authorization code for access and refresh tokens
  async exchangeCodeForTokens(code) {
    try {
      // For development, we'll use a simple approach
      // In production, you'd want a backend server for this
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(SPOTIFY_CLIENT_ID + ':9076a45c577f4cdcbf5b03092fa6858f')
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: SPOTIFY_REDIRECT_URI
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Token exchange failed: ${response.status} - ${errorData.error_description || errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      
      // Store tokens
      localStorage.setItem('spotify_access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('spotify_refresh_token', data.refresh_token);
      }
      
      // Set access token for API calls
      this.spotifyApi.setAccessToken(data.access_token);
      
      // Get user profile
      const user = await this.spotifyApi.getMe();
      
      return {
        success: true,
        user: user,
        access_token: data.access_token,
        refresh_token: data.refresh_token
      };
    } catch (error) {
      console.error('[SPOTIFY] Token exchange error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken) {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(SPOTIFY_CLIENT_ID + ':9076a45c577f4cdcbf5b03092fa6858f')
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Token refresh failed: ${response.status} - ${errorData.error_description || errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      
      // Store new access token
      localStorage.setItem('spotify_access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('spotify_refresh_token', data.refresh_token);
      }
      
      // Set access token for API calls
      this.spotifyApi.setAccessToken(data.access_token);
      
      return {
        success: true,
        access_token: data.access_token,
        refresh_token: data.refresh_token
      };
    } catch (error) {
      console.error('[SPOTIFY] Token refresh error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get current playback state
  async getCurrentPlayback() {
    try {
      const playback = await this.spotifyApi.getMyCurrentPlaybackState();
      
      if (playback && playback.item) {
        this.currentTrack = {
          id: playback.item.id,
          name: playback.item.name,
          artist: playback.item.artists[0].name,
          album: playback.item.album.name,
          albumArt: playback.item.album.images[0]?.url,
          duration: playback.item.duration_ms,
          progress: playback.progress_ms,
          isPlaying: playback.is_playing
        };
        this.isPlaying = playback.is_playing;
        this.deviceId = playback.device?.id;
      } else {
        this.currentTrack = null;
        this.isPlaying = false;
      }
      
      return this.currentTrack;
    } catch (error) {
      console.error('[SPOTIFY] Get current playback error:', error);
      return null;
    }
  }

  // Toggle playback (play/pause)
  async togglePlayback() {
    try {
      // Get available devices first
      const devices = await this.spotifyApi.getMyDevices();
      const activeDevice = devices.devices.find(device => device.is_active) || devices.devices[0];
      
      if (!activeDevice) {
        throw new Error('No active device found. Please open Spotify on a device first.');
      }
      
      if (this.isPlaying) {
        await this.spotifyApi.pause({ device_id: activeDevice.id });
      } else {
        await this.spotifyApi.play({ device_id: activeDevice.id });
      }
      
      this.isPlaying = !this.isPlaying;
      return true;
    } catch (error) {
      console.error('[SPOTIFY] Toggle playback error:', error);
      throw error;
    }
  }

  // Skip to next track
  async skipToNext() {
    try {
      const devices = await this.spotifyApi.getMyDevices();
      const activeDevice = devices.devices.find(device => device.is_active) || devices.devices[0];
      
      if (!activeDevice) {
        throw new Error('No active device found. Please open Spotify on a device first.');
      }
      
      await this.spotifyApi.skipToNext({ device_id: activeDevice.id });
      return true;
    } catch (error) {
      console.error('[SPOTIFY] Skip to next error:', error);
      throw error;
    }
  }

  // Skip to previous track
  async skipToPrevious() {
    try {
      const devices = await this.spotifyApi.getMyDevices();
      const activeDevice = devices.devices.find(device => device.is_active) || devices.devices[0];
      
      if (!activeDevice) {
        throw new Error('No active device found. Please open Spotify on a device first.');
      }
      
      await this.spotifyApi.skipToPrevious({ device_id: activeDevice.id });
      return true;
    } catch (error) {
      console.error('[SPOTIFY] Skip to previous error:', error);
      throw error;
    }
  }

  // Seek to position in current track
  async seekToPosition(positionMs) {
    try {
      const devices = await this.spotifyApi.getMyDevices();
      const activeDevice = devices.devices.find(device => device.is_active) || devices.devices[0];
      
      if (!activeDevice) {
        throw new Error('No active device found. Please open Spotify on a device first.');
      }
      
      await this.spotifyApi.seek(positionMs, { device_id: activeDevice.id });
      return true;
    } catch (error) {
      console.error('[SPOTIFY] Seek error:', error);
      throw error;
    }
  }

  // Search for tracks
  async searchTracks(query, limit = 20) {
    try {
      const results = await this.spotifyApi.searchTracks(query, { limit });
      return results.tracks.items;
    } catch (error) {
      console.error('[SPOTIFY] Search tracks error:', error);
      return [];
    }
  }

  // Get user's playlists
  async getUserPlaylists() {
    try {
      const playlists = await this.spotifyApi.getUserPlaylists();
      return playlists.items;
    } catch (error) {
      console.error('[SPOTIFY] Get playlists error:', error);
      return [];
    }
  }

  // Play a specific track
  async playTrack(trackId) {
    try {
      const devices = await this.spotifyApi.getMyDevices();
      const activeDevice = devices.devices.find(device => device.is_active) || devices.devices[0];
      
      if (!activeDevice) {
        throw new Error('No active device found. Please open Spotify on a device first.');
      }
      
      await this.spotifyApi.play({
        uris: [`spotify:track:${trackId}`],
        device_id: activeDevice.id
      });
      return true;
    } catch (error) {
      console.error('[SPOTIFY] Play track error:', error);
      throw error;
    }
  }

  // Play a playlist
  async playPlaylist(playlistId) {
    try {
      const devices = await this.spotifyApi.getMyDevices();
      const activeDevice = devices.devices.find(device => device.is_active) || devices.devices[0];
      
      if (!activeDevice) {
        throw new Error('No active device found. Please open Spotify on a device first.');
      }
      
      await this.spotifyApi.play({
        context_uri: `spotify:playlist:${playlistId}`,
        device_id: activeDevice.id
      });
      return true;
    } catch (error) {
      console.error('[SPOTIFY] Play playlist error:', error);
      throw error;
    }
  }

  // Get user's saved tracks
  async getSavedTracks(limit = 20) {
    try {
      const savedTracks = await this.spotifyApi.getMySavedTracks({ limit });
      return savedTracks.items.map(item => item.track);
    } catch (error) {
      console.error('[SPOTIFY] Get saved tracks error:', error);
      return [];
    }
  }

  // Get user's top tracks
  async getTopTracks(timeRange = 'medium_term', limit = 20) {
    try {
      const topTracks = await this.spotifyApi.getMyTopTracks({ 
        time_range: timeRange, 
        limit 
      });
      return topTracks.items;
    } catch (error) {
      console.error('[SPOTIFY] Get top tracks error:', error);
      return [];
    }
  }

  // Get user's top artists
  async getTopArtists(timeRange = 'medium_term', limit = 20) {
    try {
      const topArtists = await this.spotifyApi.getMyTopArtists({ 
        time_range: timeRange, 
        limit 
      });
      return topArtists.items;
    } catch (error) {
      console.error('[SPOTIFY] Get top artists error:', error);
      return [];
    }
  }

  // Get user's recently played tracks
  async getRecentlyPlayed(limit = 20) {
    try {
      const recentlyPlayed = await this.spotifyApi.getMyRecentlyPlayedTracks({ limit });
      return recentlyPlayed.items.map(item => item.track);
    } catch (error) {
      console.error('[SPOTIFY] Get recently played error:', error);
      return [];
    }
  }

  // Get user profile
  async getUserProfile() {
    try {
      const profile = await this.spotifyApi.getMe();
      return profile;
    } catch (error) {
      console.error('[SPOTIFY] Get user profile error:', error);
      return null;
    }
  }

  // Get available devices
  async getAvailableDevices() {
    try {
      const devices = await this.spotifyApi.getMyDevices();
      return devices.devices;
    } catch (error) {
      console.error('[SPOTIFY] Get devices error:', error);
      return [];
    }
  }

  // Logout and clear stored tokens
  logout() {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.currentTrack = null;
    this.isPlaying = false;
    this.deviceId = null;
    
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    
    console.log('[SPOTIFY] Logged out');
  }
}

// Create and export a singleton instance
const spotifyService = new SpotifyService();
export default spotifyService; 