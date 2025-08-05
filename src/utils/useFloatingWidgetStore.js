import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import useApiIntegrationsStore from './useApiIntegrationsStore';

const useFloatingWidgetStore = create(
  persist(
    (set, get) => ({
      // Widget visibility states
      spotifyWidgetVisible: false,
      systemInfoWidgetVisible: false,
      
      // Widget position states - start in center of screen
      spotifyPosition: { x: 100, y: 100 },
      systemInfoPosition: { x: 400, y: 100 },
      
      // Actions for Spotify widget
      showSpotifyWidget: () => {
        set({ spotifyWidgetVisible: true });
      },
      
      hideSpotifyWidget: () => {
        set({ spotifyWidgetVisible: false });
      },
      
      toggleSpotifyWidget: () => {
        set(state => ({ spotifyWidgetVisible: !state.spotifyWidgetVisible }));
      },
      
      // Actions for System Info widget
      showSystemInfoWidget: () => {
        set({ systemInfoWidgetVisible: true });
      },
      
      hideSystemInfoWidget: () => {
        set({ systemInfoWidgetVisible: false });
      },
      
      toggleSystemInfoWidget: () => {
        set(state => ({ systemInfoWidgetVisible: !state.systemInfoWidgetVisible }));
      },
      
      // Legacy support for backward compatibility
      get isVisible() {
        return get().spotifyWidgetVisible;
      },
      
      showWidget: () => {
        set({ spotifyWidgetVisible: true });
      },
      
      hideWidget: () => {
        set({ spotifyWidgetVisible: false });
      },
      
      toggleWidget: () => {
        set(state => ({ spotifyWidgetVisible: !state.spotifyWidgetVisible }));
      },
      
      // Position management for Spotify widget
      setSpotifyPosition: (position) => {
        set({ spotifyPosition: position });
      },
      
      resetSpotifyPosition: () => {
        // Calculate center of screen
        const centerX = Math.max(0, (window.innerWidth - 280) / 2);
        const centerY = Math.max(0, (window.innerHeight - 400) / 2);
        set({ spotifyPosition: { x: centerX, y: centerY } });
      },
      
      // Position management for System Info widget
      setSystemInfoPosition: (position) => {
        set({ systemInfoPosition: position });
      },
      
      resetSystemInfoPosition: () => {
        // Calculate center of screen
        const centerX = Math.max(0, (window.innerWidth - 320) / 2);
        const centerY = Math.max(0, (window.innerHeight - 450) / 2);
        set({ systemInfoPosition: { x: centerX, y: centerY } });
      },
      
      // Legacy support for backward compatibility
      get position() {
        return get().spotifyPosition;
      },
      
      setPosition: (position) => {
        set({ spotifyPosition: position });
      },
      
      resetPosition: () => {
        // Calculate center of screen
        const centerX = Math.max(0, (window.innerWidth - 280) / 2);
        const centerY = Math.max(0, (window.innerHeight - 400) / 2);
        set({ spotifyPosition: { x: centerX, y: centerY } });
      },
      
      // Handle playback start - check if auto-show is enabled for any integration
      handlePlaybackStart: () => {
        const apiStore = useApiIntegrationsStore.getState();
        const spotifySettings = apiStore.spotify.settings;
        
        if (spotifySettings.autoShowWidget && apiStore.spotify.isEnabled && apiStore.spotify.isConnected) {
          set({ isVisible: true });
        }
      },
      
      // Get widget settings for a specific integration
      getWidgetSettings: (integrationName) => {
        const apiStore = useApiIntegrationsStore.getState();
        return apiStore.getIntegrationSettings(integrationName);
      },
      
      // Check if widget should be shown for an integration
      shouldShowWidget: (integrationName) => {
        const apiStore = useApiIntegrationsStore.getState();
        const integration = apiStore[integrationName];
        
        return integration?.isEnabled && integration?.isConnected && integration?.settings?.autoShowWidget;
      }
    }),
    {
      name: 'floating-widget-storage',
      partialize: (state) => ({
        spotifyWidgetVisible: state.spotifyWidgetVisible,
        systemInfoWidgetVisible: state.systemInfoWidgetVisible,
        spotifyPosition: state.spotifyPosition,
        systemInfoPosition: state.systemInfoPosition
      })
    }
  )
);

export default useFloatingWidgetStore; 