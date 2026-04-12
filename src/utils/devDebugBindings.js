import useConsolidatedAppStore from './useConsolidatedAppStore';
import { electronApi } from './electronApi';

export const registerDevDebugBindings = ({
  openDevTools,
  wallpaper,
  isCycling,
  cycleToNextWallpaper,
}) => {
  window.openDevTools = openDevTools;

  window.forceDevTools = () => {
    electronApi.forceDevTools().then((result) => {
      console.log('[DEBUG] Force DevTools result:', result);
    });
  };

  window.testPresetFunctions = () => {
    console.log('[DEBUG] Store snapshot:', useConsolidatedAppStore.getState());
  };

  window.testChannelOperations = () => {
    const { channels } = useConsolidatedAppStore.getState();
    console.log('[DEBUG] Channel state:', channels);
  };

  window.testWallpaperPersistence = async () => {
    const [backendWallpaper, backendSettings] = await Promise.all([
      electronApi.getWallpapers(),
      electronApi.getSettings(),
    ]);
    console.log('[DEBUG] Current wallpaper state:', useConsolidatedAppStore.getState().wallpaper);
    console.log('[DEBUG] Backend wallpaper data:', backendWallpaper);
    console.log('[DEBUG] Backend settings data:', backendSettings);
  };

  window.debugWallpaperCycling = () => {
    console.log('[DEBUG] Cycling settings:', {
      cycleWallpapers: wallpaper.cycleWallpapers,
      cycleInterval: wallpaper.cycleInterval,
      cycleAnimation: wallpaper.cycleAnimation,
      likedWallpapersCount: wallpaper.likedWallpapers?.length,
      isCycling,
    });
  };

  window.cycleToNextWallpaper = () => {
    cycleToNextWallpaper();
  };

  window.debugDevTools = async () => {
    const openResult = await electronApi.openDevTools();
    const forceResult = await electronApi.forceDevTools();
    console.log('[DEBUG] DevTools open result:', openResult);
    console.log('[DEBUG] DevTools force result:', forceResult);
  };

  window.testDevTools = window.debugDevTools;

  return () => {
    delete window.openDevTools;
    delete window.forceDevTools;
    delete window.testPresetFunctions;
    delete window.testChannelOperations;
    delete window.testWallpaperPersistence;
    delete window.debugWallpaperCycling;
    delete window.cycleToNextWallpaper;
    delete window.debugDevTools;
    delete window.testDevTools;
  };
};
