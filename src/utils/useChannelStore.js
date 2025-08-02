import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useChannelStore = create(
  persist(
    (set, get) => ({
      // Channel data - single source of truth
      channels: {}, // { channelId: { media, path, type, title, hoverSound, asAdmin, animatedOnHover, kenBurnsEnabled, kenBurnsMode } }
      
      // Persistent default user channel setup (survives app restarts)
      userDefaultChannels: {}, // User's default channel setup that persists across app restarts
      
      // Temporary backup for current session
      userChannelBackup: null, // Stores user's original channel setup for current session
      isBackupStale: false, // Tracks if backup is outdated
      
      // Modal state
      modalState: {
        isOpen: false,
        channelId: null,
        currentMedia: null,
        currentPath: '',
        currentType: 'exe',
        currentHoverSound: null,
        currentAsAdmin: false,
        currentAnimatedOnHover: undefined,
        currentKenBurnsEnabled: undefined,
        currentKenBurnsMode: undefined
      },
      
      // Actions
      setChannel: (channelId, channelData) => 
        set(state => {
          if (channelData === null) {
            // If channelData is null, delete the channel
            const newChannels = { ...state.channels };
            delete newChannels[channelId];
            
            // Also update the persistent default channels
            const newDefaultChannels = { ...state.userDefaultChannels };
            delete newDefaultChannels[channelId];
            
            return { 
              channels: newChannels,
              userDefaultChannels: newDefaultChannels,
              isBackupStale: true // Mark backup as stale when user makes changes
            };
          } else {
            // Otherwise, set the channel data
            const newChannels = { ...state.channels, [channelId]: channelData };
            
            // Also update the persistent default channels
            const newDefaultChannels = { ...state.userDefaultChannels, [channelId]: channelData };
            
            return {
              channels: newChannels,
              userDefaultChannels: newDefaultChannels,
              isBackupStale: true // Mark backup as stale when user makes changes
            };
          }
        }),
      
      // Backup user's current channel setup for current session
      backupUserChannels: () => 
        set(state => ({
          userChannelBackup: { ...state.channels },
          isBackupStale: false
        })),
      
      // Restore user's persistent default channel setup
      restoreUserChannels: () => 
        set(state => {
          // First try to restore from persistent default channels
          if (Object.keys(state.userDefaultChannels).length > 0) {
            console.log('[ChannelStore] Restoring from persistent default channels');
            return { channels: { ...state.userDefaultChannels } };
          }
          // Fallback to session backup if no persistent default
          else if (state.userChannelBackup) {
            console.log('[ChannelStore] Restoring from session backup');
            return { channels: { ...state.userChannelBackup } };
          }
          console.log('[ChannelStore] No backup available, keeping current state');
          return state; // No backup available, keep current state
        }),
      
      // Check if user has a persistent default setup
      hasUserBackup: () => {
        const state = get();
        return Object.keys(state.userDefaultChannels).length > 0 || state.userChannelBackup !== null;
      },
      
      // Clear session backup (when user explicitly resets or clears all)
      clearUserBackup: () => 
        set({ userChannelBackup: null, isBackupStale: false }),
      
      // Clear persistent default channels (when user explicitly resets)
      clearUserDefaultChannels: () => 
        set({ userDefaultChannels: {} }),
      
      // Set channel visibility (for layout management)
      setChannelVisibility: (channelId, isVisible) => 
        set(state => {
          const channel = state.channels[channelId];
          if (channel) {
            return {
              channels: {
                ...state.channels,
                [channelId]: {
                  ...channel,
                  isVisible: isVisible
                }
              }
            };
          }
          return state;
        }),
      
      // Initialize persistent default channels from current channels (called on app start)
      initializeUserDefaultChannels: () => 
        set(state => {
          // Only initialize if we don't already have default channels and we have current channels
          if (Object.keys(state.userDefaultChannels).length === 0 && Object.keys(state.channels).length > 0) {
            console.log('[ChannelStore] Initializing persistent default channels from current channels');
            return { userDefaultChannels: { ...state.channels } };
          }
          return state;
        }),
      
      // Modal actions
      openChannelModal: (channelId) => {
        const channels = get().channels;
        const channelConfig = channels[channelId] || {};
        
        set(state => ({
          modalState: {
            isOpen: true,
            channelId,
            currentMedia: channelConfig.media || null,
            currentPath: channelConfig.path || '',
            currentType: channelConfig.type || 'exe',
            currentHoverSound: channelConfig.hoverSound || null,
            currentAsAdmin: channelConfig.asAdmin || false,
            currentAnimatedOnHover: channelConfig.animatedOnHover,
            currentKenBurnsEnabled: channelConfig.kenBurnsEnabled,
            currentKenBurnsMode: channelConfig.kenBurnsMode
          }
        }));
      },
      
      closeChannelModal: () => 
        set(state => ({
          modalState: {
            ...state.modalState,
            isOpen: false,
            channelId: null
          }
        })),
      
      updateChannelModal: (updates) =>
        set(state => ({
          modalState: {
            ...state.modalState,
            ...updates
          }
        })),
      
      clearChannel: (channelId) =>
        set(state => {
          const newChannels = { ...state.channels };
          delete newChannels[channelId];
          
          // Also update the persistent default channels
          const newDefaultChannels = { ...state.userDefaultChannels };
          delete newDefaultChannels[channelId];
          
          return { 
            channels: newChannels,
            userDefaultChannels: newDefaultChannels
          };
        }),
      
      setChannelsFromPreset: (presetData) => {
        console.log('[ChannelStore] Setting channels from preset:', presetData);
        
        // If this is the first time applying a preset with channel data, backup current user channels
        const state = get();
        if (!state.userChannelBackup && !Object.keys(state.userDefaultChannels).length && (presetData.channels || presetData.channelData)) {
          console.log('[ChannelStore] First preset with channel data - backing up user channels');
          get().backupUserChannels();
        }
        
        if (presetData.channels && presetData.mediaMap && presetData.appPathMap) {
          // Handle old preset format
          const channelData = {};
          presetData.channels.forEach(channel => {
            const media = presetData.mediaMap[channel.id];
            const path = presetData.appPathMap[channel.id];
            
            if (media || path) {
              channelData[channel.id] = {
                media: media || null,
                path: path || null,
                type: media?.type || (path?.endsWith('.exe') ? 'exe' : 'url'),
                title: media?.name || null,
                hoverSound: channel.hoverSound || null,
                animatedOnHover: channel.animatedOnHover,
                kenBurnsEnabled: channel.kenBurnsEnabled,
                kenBurnsMode: channel.kenBurnsMode,
                asAdmin: channel.asAdmin || false
              };
            }
          });
          console.log('[ChannelStore] Applied old format preset with channel data');
          set({ channels: channelData });
        } else if (presetData.channelData) {
          // Handle new clean preset format
          console.log('[ChannelStore] Applied new format preset with channel data');
          set({ channels: presetData.channelData });
        } else {
          // No channel data in preset - restore user's persistent default channels
          console.log('[ChannelStore] No channel data in preset - restoring user default channels');
          get().restoreUserChannels();
        }
      },
      
      clearAllChannels: () => set({ 
        channels: {},
        userDefaultChannels: {},
        userChannelBackup: null,
        isBackupStale: false
      }),
      
      // Computed selectors
      getChannelConfig: (channelId) => get().channels[channelId] || null,
      
      isChannelEmpty: (channelId) => {
        const config = get().channels[channelId];
        return !config || (!config.media && !config.path);
      },
      
      getConfiguredChannels: () => {
        const channels = get().channels;
        return Object.entries(channels).filter(([id, config]) => 
          config && (config.media || config.path)
        );
      },
      
      // Helper to get all channel data in the format expected by components
      getChannelDataForComponents: () => {
        const channels = get().channels;
        const mediaMap = {};
        const appPathMap = {};
        const channelConfigs = {};
        
        Object.entries(channels).forEach(([channelId, config]) => {
          // Skip null or undefined configs
          if (!config) return;
          
          if (config.media) {
            mediaMap[channelId] = config.media;
          }
          if (config.path) {
            appPathMap[channelId] = config.path;
          }
          channelConfigs[channelId] = config;
        });
        
        return { mediaMap, appPathMap, channelConfigs };
      },
      
      // Get total number of configured channels
      getConfiguredChannelCount: () => {
        const channels = get().channels;
        return Object.values(channels).filter(config => 
          config && (config.media || config.path)
        ).length;
      },
      
      // Get highest configured channel index
      getHighestConfiguredIndex: () => {
        const channels = get().channels;
        let highestIndex = -1;
        
        Object.keys(channels).forEach(channelId => {
          const match = channelId.match(/channel-(\d+)/);
          if (match) {
            const index = parseInt(match[1]);
            const config = channels[channelId];
            if (config && (config.media || config.path)) {
              highestIndex = Math.max(highestIndex, index);
            }
          }
        });
        
        return highestIndex;
      }
    }),
    {
      name: 'channel-storage',
      // Custom serialization if needed for complex data
      serialize: (state) => JSON.stringify(state),
      deserialize: (str) => JSON.parse(str),
    }
  )
);

export default useChannelStore; 