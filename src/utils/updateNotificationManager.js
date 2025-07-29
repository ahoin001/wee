import { create } from 'zustand';

const useUpdateNotificationStore = create((set, get) => ({
  // Notification state
  showUpdateBadge: false,
  lastUpdateCheck: null,
  updateAvailable: false,
  updateInfo: null,

  // Actions
  setShowUpdateBadge: (show) => set({ showUpdateBadge: show }),
  setLastUpdateCheck: (timestamp) => set({ lastUpdateCheck: timestamp }),
  setUpdateAvailable: (available, info = null) => set({ 
    updateAvailable: available, 
    updateInfo: info 
  }),

  // Check if we should show the notification badge
  shouldShowUpdateBadge: () => {
    const { showUpdateBadge, updateAvailable, lastUpdateCheck } = get();
    
    // Don't show if no update is available
    if (!updateAvailable) return false;
    
    // Don't show if badge is already showing
    if (showUpdateBadge) return false;
    
    // Check if it's 9pm EST
    const now = new Date();
    const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const currentHour = estTime.getHours();
    const currentMinute = estTime.getMinutes();
    
    // Show notification at 9pm EST (21:00)
    const isNinePM = currentHour === 21 && currentMinute === 0;
    
    // Also check if we haven't shown it today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastCheckDate = lastUpdateCheck ? new Date(lastUpdateCheck) : null;
    const hasShownToday = lastCheckDate && lastCheckDate >= today;
    
    return isNinePM && !hasShownToday;
  },

  // Mark notification as shown for today
  markNotificationShown: () => {
    set({ 
      showUpdateBadge: true, 
      lastUpdateCheck: Date.now() 
    });
  },

  // Reset notification state (called when update is installed or user dismisses)
  resetNotification: () => {
    set({ 
      showUpdateBadge: false, 
      updateAvailable: false, 
      updateInfo: null 
    });
  },

  // Load notification state from localStorage
  loadNotificationState: () => {
    try {
      const saved = localStorage.getItem('updateNotificationState');
      if (saved) {
        const state = JSON.parse(saved);
        set({
          showUpdateBadge: state.showUpdateBadge || false,
          lastUpdateCheck: state.lastUpdateCheck || null,
          updateAvailable: state.updateAvailable || false,
          updateInfo: state.updateInfo || null
        });
      }
    } catch (error) {
      console.warn('Failed to load update notification state:', error);
    }
  },

  // Save notification state to localStorage
  saveNotificationState: () => {
    try {
      const { showUpdateBadge, lastUpdateCheck, updateAvailable, updateInfo } = get();
      const state = {
        showUpdateBadge,
        lastUpdateCheck,
        updateAvailable,
        updateInfo
      };
      localStorage.setItem('updateNotificationState', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save update notification state:', error);
    }
  }
}));

// Helper function to check if current time is 9pm EST
const isNinePMEST = () => {
  const now = new Date();
  const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  return estTime.getHours() === 21 && estTime.getMinutes() === 0;
};

// Helper function to get time until next 9pm EST
const getTimeUntilNinePMEST = () => {
  const now = new Date();
  const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  
  // Calculate next 9pm EST
  const nextNinePM = new Date(estTime);
  nextNinePM.setHours(21, 0, 0, 0);
  
  // If it's already past 9pm today, set to tomorrow
  if (estTime.getHours() >= 21) {
    nextNinePM.setDate(nextNinePM.getDate() + 1);
  }
  
  return nextNinePM.getTime() - now.getTime();
};

// Update notification manager
class UpdateNotificationManager {
  constructor() {
    this.store = useUpdateNotificationStore.getState();
    this.checkInterval = null;
    this.init();
  }

  init() {
    // Load saved state
    this.store.loadNotificationState();
    
    // Start checking for 9pm EST
    this.startDailyCheck();
    
    // Check immediately if it's currently 9pm EST
    if (isNinePMEST()) {
      this.checkForUpdateNotification();
    }
  }

  startDailyCheck() {
    // Clear any existing interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Calculate time until next 9pm EST
    const timeUntilNinePM = getTimeUntilNinePMEST();
    
    // Set initial timeout to next 9pm EST
    setTimeout(() => {
      this.checkForUpdateNotification();
      // Then check every minute to catch 9pm EST
      this.checkInterval = setInterval(() => {
        this.checkForUpdateNotification();
      }, 60 * 1000); // Check every minute
    }, timeUntilNinePM);
  }

  checkForUpdateNotification() {
    if (isNinePMEST()) {
      console.log('[UPDATE-NOTIFICATION] It\'s 9pm EST, checking for update notification');
      
      // Check if we should show the notification badge
      if (this.store.shouldShowUpdateBadge()) {
        console.log('[UPDATE-NOTIFICATION] Showing update notification badge');
        this.store.markNotificationShown();
        this.store.saveNotificationState();
        
        // Trigger the notification badge display
        this.triggerUpdateBadge();
      }
    }
  }

  triggerUpdateBadge() {
    // This will be called by the main app to show the notification badge
    // The actual badge display logic will be in the main App component
    console.log('[UPDATE-NOTIFICATION] Triggering update badge display');
    
    // Set the badge to show
    this.store.setShowUpdateBadge(true);
    this.store.saveNotificationState();
  }

  // Called when an update is available (from the auto-updater)
  onUpdateAvailable(updateInfo) {
    console.log('[UPDATE-NOTIFICATION] Update available:', updateInfo);
    this.store.setUpdateAvailable(true, updateInfo);
    this.store.saveNotificationState();
  }

  // Called when no update is available
  onUpdateNotAvailable() {
    console.log('[UPDATE-NOTIFICATION] No update available');
    this.store.setUpdateAvailable(false);
    this.store.saveNotificationState();
  }

  // Called when user dismisses the notification
  dismissNotification() {
    console.log('[UPDATE-NOTIFICATION] User dismissed notification');
    this.store.resetNotification();
    this.store.saveNotificationState();
  }

  // Called when update is installed
  onUpdateInstalled() {
    console.log('[UPDATE-NOTIFICATION] Update installed, resetting notification');
    this.store.resetNotification();
    this.store.saveNotificationState();
  }

  // Cleanup
  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}

// Create singleton instance
let notificationManager = null;

export const getUpdateNotificationManager = () => {
  if (!notificationManager) {
    notificationManager = new UpdateNotificationManager();
  }
  return notificationManager;
};

export default useUpdateNotificationStore; 