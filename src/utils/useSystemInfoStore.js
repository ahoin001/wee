import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';

const useSystemInfoStore = create(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // System information state
        systemInfo: {
          cpu: null,
          gpu: null,
          memory: null,
          storage: [],
          battery: null
        },
        
        // Loading state
        isLoading: false,
        
        // Update interval (in milliseconds)
        updateInterval: 0,
        
        // Actions
        setSystemInfo: (info) => {
          set({ systemInfo: info });
        },
        
        setLoading: (loading) => {
          set({ isLoading: loading });
        },
        
        setUpdateInterval: (interval) => {
          set({ updateInterval: interval });
        },
        
        // Refresh system information
        refreshSystemInfo: async (showLoading = false) => {
          try {
            if (showLoading) {
              set({ isLoading: true });
            }
            
            // Get system information from the main process
            const systemInfo = await window.api?.getSystemInfo?.();
            
            if (systemInfo) {
              set({ systemInfo });
            }
          } catch (error) {
            console.error('Failed to refresh system info:', error);
          } finally {
            if (showLoading) {
              set({ isLoading: false });
            }
          }
        },
        
        // Open task manager
        openTaskManager: async () => {
          try {
            await window.api?.openTaskManager?.();
          } catch (error) {
            console.error('Failed to open task manager:', error);
          }
        },
        
        // Initialize system monitoring
        initializeSystemMonitoring: () => {
          const { refreshSystemInfo, updateInterval } = get();
          
          // Initial refresh
          refreshSystemInfo();
          
          // Set up periodic refresh
          const interval = setInterval(() => {
            refreshSystemInfo();
          }, updateInterval);
          
          // Return cleanup function
          return () => clearInterval(interval);
        }
      }),
      {
        name: 'system-info-storage',
        partialize: (state) => ({
          updateInterval: state.updateInterval
        })
      }
    )
  )
);

// Optimized selectors for better performance
export const useSystemInfo = () => useSystemInfoStore((state) => state.systemInfo);
export const useSystemInfoLoading = () => useSystemInfoStore((state) => state.isLoading);
export const useUpdateInterval = () => useSystemInfoStore((state) => state.updateInterval);
export const useSystemInfoActions = () => useSystemInfoStore((state) => ({
  refreshSystemInfo: state.refreshSystemInfo,
  openTaskManager: state.openTaskManager,
  setUpdateInterval: state.setUpdateInterval
}));

export default useSystemInfoStore; 