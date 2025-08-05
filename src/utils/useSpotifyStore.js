import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import spotifyService from './spotifyService';
import useFloatingWidgetStore from './useFloatingWidgetStore';

export const useSpotifyStore = create(
  persist(
    (set, get) => ({
      // State
      isAuthenticated: false,
      currentUser: null,
      currentTrack: null,
      isPlaying: false,
      playlists: [],
      savedTracks: [],
      searchResults: [],
      topTracks: [],
      topArtists: [],
      recentlyPlayed: [],
      isLoading: false,
      error: null,
      
      // Actions
      setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
      setCurrentUser: (user) => set({ currentUser: user }),
      setCurrentTrack: (track) => set({ currentTrack: track }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setPlaylists: (playlists) => set({ playlists }),
      setSavedTracks: (tracks) => set({ savedTracks: tracks }),
      setSearchResults: (results) => set({ searchResults: results }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      
      // Initialize Spotify
      initialize: async () => {
        set({ isLoading: true, error: null });
        try {
          const isAuthenticated = await spotifyService.initialize();
          set({ isAuthenticated });
          
          if (isAuthenticated) {
            const user = spotifyService.currentUser;
            set({ currentUser: user });
            
            // Get initial data
            await get().refreshPlaybackState();
            await get().loadPlaylists();
            await get().loadSavedTracks();
          }
        } catch (error) {
          set({ error: error.message });
          console.error('[SPOTIFY STORE] Initialization error:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Authenticate with Spotify
      authenticate: async () => {
        set({ isLoading: true, error: null });
        try {
          spotifyService.authenticate();
        } catch (error) {
          set({ error: error.message });
          console.error('[SPOTIFY STORE] Authentication error:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Refresh current playback state
      refreshPlaybackState: async () => {
        try {
          const track = await spotifyService.getCurrentPlayback();
          const isPlaying = spotifyService.isPlaying;
          
          set({ 
            currentTrack: track,
            isPlaying: isPlaying
          });
        } catch (error) {
          console.error('[SPOTIFY STORE] Refresh playback error:', error);
        }
      },
      
      // Toggle play/pause
      togglePlayback: async () => {
        try {
          const wasPlaying = get().isPlaying;
          await spotifyService.togglePlayback();
          await get().refreshPlaybackState();
          
          // Check if we started playing and should auto-show widget
          const newState = get();
          if (!wasPlaying && newState.isPlaying) {
            const floatingWidgetStore = useFloatingWidgetStore.getState();
            floatingWidgetStore.handlePlaybackStart();
          }
        } catch (error) {
          set({ error: error.message });
          console.error('[SPOTIFY STORE] Toggle playback error:', error);
        }
      },
      
      // Skip to next track
      skipToNext: async () => {
        try {
          await spotifyService.skipToNext();
          await get().refreshPlaybackState();
        } catch (error) {
          set({ error: error.message });
          console.error('[SPOTIFY STORE] Skip next error:', error);
        }
      },
      
      // Skip to previous track
      skipToPrevious: async () => {
        try {
          await spotifyService.skipToPrevious();
          await get().refreshPlaybackState();
        } catch (error) {
          set({ error: error.message });
          console.error('[SPOTIFY STORE] Skip previous error:', error);
        }
      },
      
      // Seek to position in current track
      seekToPosition: async (positionMs) => {
        try {
          await spotifyService.seekToPosition(positionMs);
          await get().refreshPlaybackState();
        } catch (error) {
          set({ error: error.message });
          console.error('[SPOTIFY STORE] Seek error:', error);
        }
      },
      
      // Search tracks
      searchTracks: async (query) => {
        if (!query.trim()) {
          set({ searchResults: [] });
          return;
        }
        
        set({ isLoading: true });
        try {
          const results = await spotifyService.searchTracks(query);
          set({ searchResults: results });
        } catch (error) {
          set({ error: error.message });
          console.error('[SPOTIFY STORE] Search error:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Load user playlists
      loadPlaylists: async () => {
        try {
          const playlists = await spotifyService.getUserPlaylists();
          set({ playlists });
        } catch (error) {
          console.error('[SPOTIFY STORE] Load playlists error:', error);
        }
      },
      
      // Load saved tracks
      loadSavedTracks: async () => {
        try {
          const tracks = await spotifyService.getSavedTracks();
          set({ savedTracks: tracks });
        } catch (error) {
          console.error('[SPOTIFY STORE] Load saved tracks error:', error);
        }
      },

      // Load top tracks
      loadTopTracks: async (timeRange = 'medium_term') => {
        try {
          const tracks = await spotifyService.getTopTracks(timeRange);
          set({ topTracks: tracks });
        } catch (error) {
          console.error('[SPOTIFY STORE] Load top tracks error:', error);
        }
      },

      // Load top artists
      loadTopArtists: async (timeRange = 'medium_term') => {
        try {
          const artists = await spotifyService.getTopArtists(timeRange);
          set({ topArtists: artists });
        } catch (error) {
          console.error('[SPOTIFY STORE] Load top artists error:', error);
        }
      },

      // Load recently played
      loadRecentlyPlayed: async () => {
        try {
          const tracks = await spotifyService.getRecentlyPlayed();
          set({ recentlyPlayed: tracks });
        } catch (error) {
          console.error('[SPOTIFY STORE] Load recently played error:', error);
        }
      },

      // Load user profile
      loadUserProfile: async () => {
        try {
          const profile = await spotifyService.getUserProfile();
          set({ currentUser: profile });
        } catch (error) {
          console.error('[SPOTIFY STORE] Load user profile error:', error);
        }
      },

      // Play a track
      playTrack: async (trackId) => {
        try {
          await spotifyService.playTrack(trackId);
          await get().refreshPlaybackState();
          
          // Auto-show widget if enabled
          const newState = get();
          if (newState.isPlaying) {
            const floatingWidgetStore = useFloatingWidgetStore.getState();
            floatingWidgetStore.handlePlaybackStart();
          }
        } catch (error) {
          set({ error: error.message });
          console.error('[SPOTIFY STORE] Play track error:', error);
        }
      },
      
      // Play a playlist
      playPlaylist: async (playlistId) => {
        try {
          await spotifyService.playPlaylist(playlistId);
          await get().refreshPlaybackState();
          
          // Auto-show widget if enabled
          const newState = get();
          if (newState.isPlaying) {
            const floatingWidgetStore = useFloatingWidgetStore.getState();
            floatingWidgetStore.handlePlaybackStart();
          }
        } catch (error) {
          set({ error: error.message });
          console.error('[SPOTIFY STORE] Play playlist error:', error);
        }
      },
      
      // Logout
      logout: () => {
        spotifyService.logout();
        set({
          isAuthenticated: false,
          currentUser: null,
          currentTrack: null,
          isPlaying: false,
          playlists: [],
          savedTracks: [],
          searchResults: [],
          error: null
        });
      },
      
      // Clear error
      clearError: () => set({ error: null })
    }),
    {
      name: 'spotify-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser
      })
    }
  )
);

// Make store available globally for spotifyService
if (typeof window !== 'undefined') {
  window.spotifyStore = useSpotifyStore.getState();
  console.log('[SPOTIFY STORE] Store made available globally:', window.spotifyStore);
} 