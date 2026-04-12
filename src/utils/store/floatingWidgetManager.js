export const createFloatingWidgetManager = (getStore) => ({
  showSpotifyWidget() {
    const store = getStore();
    store.actions.setFloatingWidgetsState({
      spotify: { ...store.floatingWidgets.spotify, visible: true },
    });
  },
  hideSpotifyWidget() {
    const store = getStore();
    store.actions.setFloatingWidgetsState({
      spotify: { ...store.floatingWidgets.spotify, visible: false },
    });
  },
  setSpotifyWidgetPosition(position) {
    const store = getStore();
    store.actions.setFloatingWidgetsState({
      spotify: { ...store.floatingWidgets.spotify, position },
    });
  },
  showSystemInfoWidget() {
    const store = getStore();
    store.actions.setFloatingWidgetsState({
      systemInfo: { ...store.floatingWidgets.systemInfo, visible: true },
    });
  },
  hideSystemInfoWidget() {
    const store = getStore();
    store.actions.setFloatingWidgetsState({
      systemInfo: { ...store.floatingWidgets.systemInfo, visible: false },
    });
  },
  setSystemInfoWidgetPosition(position) {
    const store = getStore();
    store.actions.setFloatingWidgetsState({
      systemInfo: { ...store.floatingWidgets.systemInfo, position },
    });
  },
  showAdminPanelWidget() {
    const store = getStore();
    store.actions.setFloatingWidgetsState({
      adminPanel: { ...store.floatingWidgets.adminPanel, visible: true },
    });
  },
  hideAdminPanelWidget() {
    const store = getStore();
    store.actions.setFloatingWidgetsState({
      adminPanel: { ...store.floatingWidgets.adminPanel, visible: false },
    });
  },
  setAdminPanelWidgetPosition(position) {
    const store = getStore();
    store.actions.setFloatingWidgetsState({
      adminPanel: { ...store.floatingWidgets.adminPanel, position },
    });
  },
  showPerformanceMonitorWidget() {
    const store = getStore();
    store.actions.setFloatingWidgetsState({
      performanceMonitor: { ...store.floatingWidgets.performanceMonitor, visible: true },
    });
  },
  hidePerformanceMonitorWidget() {
    const store = getStore();
    store.actions.setFloatingWidgetsState({
      performanceMonitor: { ...store.floatingWidgets.performanceMonitor, visible: false },
    });
  },
  setPerformanceMonitorWidgetPosition(position) {
    const store = getStore();
    store.actions.setFloatingWidgetsState({
      performanceMonitor: { ...store.floatingWidgets.performanceMonitor, position },
    });
  },
  toggleSystemInfoWidget() {
    const store = getStore();
    const isVisible = store.floatingWidgets.systemInfo.visible;
    store.actions.setFloatingWidgetsState({
      systemInfo: { ...store.floatingWidgets.systemInfo, visible: !isVisible },
    });
  },
  toggleAdminPanelWidget() {
    const store = getStore();
    const isVisible = store.floatingWidgets.adminPanel.visible;
    store.actions.setFloatingWidgetsState({
      adminPanel: { ...store.floatingWidgets.adminPanel, visible: !isVisible },
    });
  },
  togglePerformanceMonitorWidget() {
    const store = getStore();
    const isVisible = store.floatingWidgets.performanceMonitor.visible;
    store.actions.setFloatingWidgetsState({
      performanceMonitor: { ...store.floatingWidgets.performanceMonitor, visible: !isVisible },
    });
  },
  updateSystemInfoData(data) {
    const store = getStore();
    store.actions.setFloatingWidgetsState({
      systemInfo: {
        ...store.floatingWidgets.systemInfo,
        data,
        isLoading: false,
        error: null,
        lastUpdated: Date.now(),
      },
    });
  },
  setSystemInfoLoading(isLoading) {
    const store = getStore();
    store.actions.setFloatingWidgetsState({
      systemInfo: {
        ...store.floatingWidgets.systemInfo,
        isLoading,
        error: isLoading ? null : store.floatingWidgets.systemInfo.error,
      },
    });
  },
  setSystemInfoError(error) {
    const store = getStore();
    store.actions.setFloatingWidgetsState({
      systemInfo: { ...store.floatingWidgets.systemInfo, error, isLoading: false },
    });
  },
  updateSystemInfoInterval(interval) {
    const store = getStore();
    store.actions.setFloatingWidgetsState({
      systemInfo: { ...store.floatingWidgets.systemInfo, updateInterval: interval },
    });
  },
  async fetchSystemInfo() {
    const store = getStore();
    const systemInfoWidget = store.floatingWidgets.systemInfo;
    if (!systemInfoWidget.visible) {
      return;
    }
    store.actions.floatingWidgetManager.setSystemInfoLoading(true);
    try {
      const response = await window.api.getSystemInfo();
      if (response && response.success && response.data) {
        store.actions.floatingWidgetManager.updateSystemInfoData(response.data);
        return;
      }
      console.error('[Store] API call failed:', response);
      const errorMessage = response?.error || 'Failed to fetch system info';
      store.actions.floatingWidgetManager.setSystemInfoError(errorMessage);
    } catch (error) {
      console.error('[Store] Failed to fetch system info:', error);
      store.actions.floatingWidgetManager.setSystemInfoError(`Failed to fetch: ${error.message}`);
    }
  },
  updateAdminPanelConfig(config) {
    const store = getStore();
    store.actions.setFloatingWidgetsState({
      adminPanel: { ...store.floatingWidgets.adminPanel, config },
    });
  },
  addPowerAction(action) {
    const store = getStore();
    const currentConfig = store.floatingWidgets.adminPanel.config;
    const newPowerActions = [...currentConfig.powerActions, action];
    store.actions.floatingWidgetManager.updateAdminPanelConfig({
      ...currentConfig,
      powerActions: newPowerActions,
    });
  },
  removePowerAction(actionId) {
    const store = getStore();
    const currentConfig = store.floatingWidgets.adminPanel.config;
    const newPowerActions = currentConfig.powerActions.filter((pa) => pa.id !== actionId);
    store.actions.floatingWidgetManager.updateAdminPanelConfig({
      ...currentConfig,
      powerActions: newPowerActions,
    });
  },
  updatePowerAction(actionId, updatedAction) {
    const store = getStore();
    const currentConfig = store.floatingWidgets.adminPanel.config;
    const newPowerActions = currentConfig.powerActions.map((pa) => (
      pa.id === actionId ? updatedAction : pa
    ));
    store.actions.floatingWidgetManager.updateAdminPanelConfig({
      ...currentConfig,
      powerActions: newPowerActions,
    });
  },
  executePowerAction(action) {
    if (window.api?.executeCommand) {
      window.api.executeCommand(action.command);
    }
  },
});
