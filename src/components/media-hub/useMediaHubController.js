import { useCallback } from 'react';

export function useMediaHubController(setMediaHubState) {
  const updateUi = useCallback((patch) => {
    setMediaHubState({ ui: patch });
  }, [setMediaHubState]);

  const clearSelection = useCallback(() => {
    updateUi({
      selectedItemId: null,
      launchFallbackMessage: '',
      selectedSeriesSeason: null,
      selectedSeriesEpisode: null,
    });
  }, [updateUi]);

  const selectLocalItem = useCallback((itemId) => {
    updateUi({
      selectedItemId: itemId,
      launchFallbackMessage: '',
    });
  }, [updateUi]);

  return {
    updateUi,
    clearSelection,
    selectLocalItem,
  };
}

export default useMediaHubController;
