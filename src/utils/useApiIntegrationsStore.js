import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useSpotifyStore } from './useSpotifyStore';

const useApiIntegrationsStore = create(
  persist(
    (set, get) => ({
      // API Integration States
      spotify: {
        isConnected: false,
        isEnabled: false,
        hotkey: 'Ctrl+Shift+S',
        hotkeyKey: 's',
        hotkeyModifier: 'ctrl+shift',
        settings: {
          dynamicColors: true,
          useBlurredBackground: false,
          blurAmount: 30,
          autoShowWidget: false,
          visualizerType: 'bars',
          trackInfoPanelOpacity: 0.6,
          trackInfoPanelBlur: 10
        }
      },
      
      // Actions
      connectSpotify: async () => {
        try {
          const spotifyStore = useSpotifyStore.getState();
          await spotifyStore.authenticate();
          
          set(state => ({
            spotify: {
              ...state.spotify,
              isConnected: true
            }
          }));
          
          return true;
        } catch (error) {
          console.error('[API INTEGRATIONS] Spotify connection failed:', error);
          return false;
        }
      },
      
      disconnectSpotify: () => {
        const spotifyStore = useSpotifyStore.getState();
        spotifyStore.logout();
        
        set(state => ({
          spotify: {
            ...state.spotify,
            isConnected: false
          }
        }));
      },
      
      toggleSpotifyEnabled: () => {
        set(state => ({
          spotify: {
            ...state.spotify,
            isEnabled: !state.spotify.isEnabled
          }
        }));
      },
      
      updateSpotifyHotkey: (hotkey, key, modifier) => {
        set(state => ({
          spotify: {
            ...state.spotify,
            hotkey,
            hotkeyKey: key,
            hotkeyModifier: modifier
          }
        }));
        
        // Sync with keyboard shortcuts system
        try {
          const uiStore = require('./useUIStore').default;
          uiStore.getState().updateKeyboardShortcut('toggle-spotify-widget', {
            key: key,
            modifier: modifier
          });
        } catch (error) {
          console.warn('[API INTEGRATIONS] Failed to sync with keyboard shortcuts:', error);
        }
      },
      
      updateSpotifySettings: (settings) => {
        set(state => ({
          spotify: {
            ...state.spotify,
            settings: {
              ...state.spotify.settings,
              ...settings
            }
          }
        }));
      },
      
      // Initialize API connections on app start
      initializeConnections: async () => {
        const state = get();
        
        if (state.spotify.isEnabled && state.spotify.isConnected) {
          try {
            const spotifyStore = useSpotifyStore.getState();
            await spotifyStore.initialize();
            
            // Update connection status based on initialization result
            set(state => ({
              spotify: {
                ...state.spotify,
                isConnected: spotifyStore.isAuthenticated
              }
            }));
          } catch (error) {
            console.error('[API INTEGRATIONS] Failed to initialize Spotify:', error);
            set(state => ({
              spotify: {
                ...state.spotify,
                isConnected: false
              }
            }));
          }
        }
        
        // Sync Spotify hotkey with keyboard shortcuts system
        try {
          const uiStore = require('./useUIStore').default;
          uiStore.getState().updateKeyboardShortcut('toggle-spotify-widget', {
            key: state.spotify.hotkeyKey,
            modifier: state.spotify.hotkeyModifier
          });
        } catch (error) {
          console.warn('[API INTEGRATIONS] Failed to sync hotkey on initialization:', error);
        }
      },
      
      // Get all enabled integrations
      getEnabledIntegrations: () => {
        const state = get();
        const enabled = [];
        
        if (state.spotify.isEnabled) {
          enabled.push({
            name: 'spotify',
            label: 'Spotify',
            icon: '🎵',
            isConnected: state.spotify.isConnected,
            hotkey: state.spotify.hotkey,
            settings: state.spotify.settings
          });
        }
        
        return enabled;
      },
      
      // Check if an integration is available
      isIntegrationAvailable: (integrationName) => {
        const state = get();
        return state[integrationName]?.isEnabled || false;
      },
      
      // Get integration settings
      getIntegrationSettings: (integrationName) => {
        const state = get();
        return state[integrationName]?.settings || {};
      }
    }),
    {
      name: 'api-integrations-storage',
      partialize: (state) => ({
        spotify: state.spotify
      })
    }
  )
);

export default useApiIntegrationsStore; 