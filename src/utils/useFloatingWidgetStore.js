import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import useApiIntegrationsStore from './useApiIntegrationsStore';

const useFloatingWidgetStore = create(
  persist(
    (set, get) => ({
      // Widget visibility state
      isVisible: false,
      
      // Widget position state - start in center of screen
      position: { x: 100, y: 100 },
      
      // Actions
      showWidget: () => {
        set({ isVisible: true });
      },
      
      hideWidget: () => {
        set({ isVisible: false });
      },
      
      toggleWidget: () => {
        set(state => ({ isVisible: !state.isVisible }));
      },
      
      // Position management
      setPosition: (position) => {
        set({ position });
      },
      
      resetPosition: () => {
        // Calculate center of screen
        const centerX = Math.max(0, (window.innerWidth - 280) / 2);
        const centerY = Math.max(0, (window.innerHeight - 400) / 2);
        set({ position: { x: centerX, y: centerY } });
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
        isVisible: state.isVisible,
        position: state.position
      })
    }
  )
);

export default useFloatingWidgetStore; 