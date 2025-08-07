import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import useApiIntegrationsStore from './useApiIntegrationsStore';

const useFloatingWidgetStore = create(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Widget visibility states
        spotifyWidgetVisible: false,
        systemInfoWidgetVisible: false,
        adminPanelWidgetVisible: false,
        
        // Widget position states - start in center of screen
        spotifyPosition: { x: 100, y: 100 },
        systemInfoPosition: { x: 400, y: 100 },
        adminPanelPosition: { x: 700, y: 100 },
        
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
        
        // Actions for Admin Panel widget
        showAdminPanelWidget: () => {
          set({ adminPanelWidgetVisible: true });
        },
        
        hideAdminPanelWidget: () => {
          set({ adminPanelWidgetVisible: false });
        },
        
        toggleAdminPanelWidget: () => {
          set(state => ({ adminPanelWidgetVisible: !state.adminPanelWidgetVisible }));
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
        
        // Position management for Admin Panel widget
        setAdminPanelPosition: (position) => {
          set({ adminPanelPosition: position });
        },
        
        resetAdminPanelPosition: () => {
          // Calculate center of screen
          const centerX = Math.max(0, (window.innerWidth - 300) / 2);
          const centerY = Math.max(0, (window.innerHeight - 400) / 2);
          set({ adminPanelPosition: { x: centerX, y: centerY } });
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
          const { spotify } = useApiIntegrationsStore.getState();
          
          if (spotify.autoShowWidget) {
            set({ spotifyWidgetVisible: true });
          }
        },
        
        // Handle playback stop - check if auto-hide is enabled
        handlePlaybackStop: () => {
          const { spotify } = useApiIntegrationsStore.getState();
          
          if (spotify.autoHideWidget) {
            set({ spotifyWidgetVisible: false });
          }
        }
      }),
      {
        name: 'floating-widget-storage',
        partialize: (state) => ({
          spotifyPosition: state.spotifyPosition,
          systemInfoPosition: state.systemInfoPosition,
          adminPanelPosition: state.adminPanelPosition
        })
      }
    )
  )
);

// Optimized selectors for better performance
export const useSpotifyWidgetVisibility = () => useFloatingWidgetStore((state) => state.spotifyWidgetVisible);
export const useSystemInfoWidgetVisibility = () => useFloatingWidgetStore((state) => state.systemInfoWidgetVisible);
export const useAdminPanelWidgetVisibility = () => useFloatingWidgetStore((state) => state.adminPanelWidgetVisible);
export const useSpotifyPosition = () => useFloatingWidgetStore((state) => state.spotifyPosition);
export const useSystemInfoPosition = () => useFloatingWidgetStore((state) => state.systemInfoPosition);
export const useAdminPanelPosition = () => useFloatingWidgetStore((state) => state.adminPanelPosition);
export const useWidgetActions = () => useFloatingWidgetStore((state) => ({
  showSpotifyWidget: state.showSpotifyWidget,
  hideSpotifyWidget: state.hideSpotifyWidget,
  toggleSpotifyWidget: state.toggleSpotifyWidget,
  showSystemInfoWidget: state.showSystemInfoWidget,
  hideSystemInfoWidget: state.hideSystemInfoWidget,
  toggleSystemInfoWidget: state.toggleSystemInfoWidget,
  showAdminPanelWidget: state.showAdminPanelWidget,
  hideAdminPanelWidget: state.hideAdminPanelWidget,
  toggleAdminPanelWidget: state.toggleAdminPanelWidget,
  setSpotifyPosition: state.setSpotifyPosition,
  resetSpotifyPosition: state.resetSpotifyPosition,
  setSystemInfoPosition: state.setSystemInfoPosition,
  resetSystemInfoPosition: state.resetSystemInfoPosition,
  setAdminPanelPosition: state.setAdminPanelPosition,
  resetAdminPanelPosition: state.resetAdminPanelPosition,
}));

export default useFloatingWidgetStore; 