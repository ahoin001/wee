import { create } from 'zustand';

const useAppLibraryStore = create((set, get) => ({
  // Installed Apps
  installedApps: [],
  appsLoading: false,
  appsError: '',
  fetchInstalledApps: async () => {
    console.log('[Zustand] fetchInstalledApps called');
    set({ appsLoading: true, appsError: '' });
    try {
      const api = window.api?.apps;
      const apps = await api?.getInstalled();
      console.log('[Zustand] fetchInstalledApps result:', apps);
      set({ installedApps: apps || [], appsLoading: false });
    } catch (err) {
      console.log('[Zustand] fetchInstalledApps error:', err);
      set({ installedApps: [], appsLoading: false, appsError: err?.message || 'Failed to scan apps.' });
    }
  },
  rescanInstalledApps: async () => {
    set({ appsLoading: true, appsError: '' });
    try {
      const api = window.api?.apps;
      const apps = await api?.rescanInstalled();
      console.log('[Zustand] rescanInstalledApps result:', apps);
      set({ installedApps: apps || [], appsLoading: false });
    } catch (err) {
      console.log('[Zustand] rescanInstalledApps error:', err);
      set({ installedApps: [], appsLoading: false, appsError: err?.message || 'Failed to rescan apps.' });
    }
  },

  // Steam Games
  steamGames: [],
  steamLoading: false,
  steamError: '',
  fetchSteamGames: async (customSteamPath) => {
    console.log('[Zustand] fetchSteamGames called', customSteamPath);
    set({ steamLoading: true, steamError: '' });
    try {
      const api = window.api?.steam;
      const args = customSteamPath ? { customPath: customSteamPath } : undefined;
      const result = await api?.getInstalledGames(args);
      console.log('[Zustand] fetchSteamGames result:', result);
      if (result?.error) {
        set({ steamGames: [], steamLoading: false, steamError: result.error });
      } else {
        set({ steamGames: result?.games || [], steamLoading: false });
      }
    } catch (err) {
      console.log('[Zustand] fetchSteamGames error:', err);
      set({ steamGames: [], steamLoading: false, steamError: err?.message || 'Failed to scan Steam games.' });
    }
  },
  rescanSteamGames: async (customSteamPath) => {
    await get().fetchSteamGames(customSteamPath);
  },

  // Epic Games
  epicGames: [],
  epicLoading: false,
  epicError: '',
  fetchEpicGames: async () => {
    console.log('[Zustand] fetchEpicGames called');
    set({ epicLoading: true, epicError: '' });
    try {
      const api = window.api?.epic;
      const result = await api?.getInstalledGames();
      console.log('[Zustand] fetchEpicGames result:', result);
      if (result?.error) {
        set({ epicGames: [], epicLoading: false, epicError: result.error });
      } else {
        set({ epicGames: result?.games || [], epicLoading: false });
      }
    } catch (err) {
      console.log('[Zustand] fetchEpicGames error:', err);
      set({ epicGames: [], epicLoading: false, epicError: err?.message || 'Failed to scan Epic games.' });
    }
  },
  rescanEpicGames: async () => {
    await get().fetchEpicGames();
  },

  // UWP Apps
  uwpApps: [],
  uwpLoading: false,
  uwpError: '',
  fetchUwpApps: async () => {
    console.log('[Zustand] fetchUwpApps called');
    set({ uwpLoading: true, uwpError: '' });
    try {
      const api = window.api?.uwp;
      const apps = await api?.listApps();
      console.log('[Zustand] fetchUwpApps result:', apps);
      set({ uwpApps: apps || [], uwpLoading: false });
    } catch (err) {
      console.log('[Zustand] fetchUwpApps error:', err);
      set({ uwpApps: [], uwpLoading: false, uwpError: err?.message || 'Failed to scan Microsoft Store apps.' });
    }
  },
  rescanUwpApps: async () => {
    await get().fetchUwpApps();
  },
}));

export default useAppLibraryStore; 