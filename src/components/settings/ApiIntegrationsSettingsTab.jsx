import React, { useState, useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Card from '../../ui/Card';
import Text from '../../ui/Text';
import CollapsibleSection from '../../ui/CollapsibleSection';
import SaveButton from './SaveButton';
import WToggle from '../../ui/WToggle';
import WButton from '../../ui/WButton';
import { AdminPanel } from '../admin';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { logError } from '../../utils/logger';
import {
  ADMIN_WIDGET_CARD_SHADOW,
  ADMIN_WIDGET_GRADIENT,
  CSS_COLOR_PURE_BLACK,
  CSS_COLOR_PURE_WHITE,
  CSS_SPOTIFY_PRIMARY,
  INTEGRATION_PANEL_INSET_BG,
  SPOTIFY_CARD_SHADOW_SOFT,
  SPOTIFY_DEFAULT_GRADIENT,
  SPOTIFY_ICON_FILL,
  SYSTEM_INFO_CARD_SHADOW,
  SYSTEM_INFO_GRADIENT,
} from '../../design/runtimeColorStrings.js';
import './api-integrations-settings.css';

const spotifyBtnClass = (active, isGreen = true) =>
  active
    ? '!bg-red-600 !border-red-600 hover:!bg-red-700 text-white border-solid'
    : isGreen
      ? '!bg-[rgb(var(--spotify-green-rgb))] !border-[rgb(var(--spotify-green-rgb))] hover:!brightness-110 text-white border-solid'
      : '!bg-[hsl(var(--link))] !border-[hsl(var(--link))] hover:!brightness-110 text-white border-solid';

const adminOrangeBtn =
  '!bg-[hsl(var(--state-warning))] !border-[hsl(var(--state-warning))] hover:!brightness-110 text-white border-solid';

const ApiIntegrationsSettingsTab = () => {
  // Use consolidated store
  const { spotify, floatingWidgets } = useConsolidatedAppStore(
    useShallow((state) => ({
      spotify: state.spotify,
      floatingWidgets: state.floatingWidgets,
    }))
  );
  const actions = useConsolidatedAppStore(useShallow((state) => state.actions));
  
  // Local state for admin panel modal
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Get admin panel config from store
  const adminPanelConfig = floatingWidgets.adminPanel.config || { powerActions: [] };

  // Spotify connection handlers
  const handleSpotifyConnect = useCallback(async () => {
    try {
      await actions.spotifyManager.connect();
    } catch (error) {
      logError('ApiIntegrationsSettingsTab', 'Spotify connection error', error);
    }
  }, [actions]);

  const handleSpotifyDisconnect = useCallback(async () => {
    try {
      actions.spotifyManager.disconnect();
    } catch (error) {
      logError('ApiIntegrationsSettingsTab', 'Spotify disconnection error', error);
    }
  }, [actions]);

  // Widget toggle handlers
  const handleToggleSpotifyWidget = useCallback(() => {
    actions.toggleSpotifyWidget();
  }, [actions]);

  const handleToggleSystemInfoWidget = useCallback(() => {
    const isVisible = floatingWidgets.systemInfo.visible;
    actions.setFloatingWidgetsState({
      systemInfo: { ...floatingWidgets.systemInfo, visible: !isVisible }
    });
  }, [actions, floatingWidgets.systemInfo]);

  const handleToggleAdminPanelWidget = useCallback(() => {
    const isVisible = floatingWidgets.adminPanel.visible;
    actions.setFloatingWidgetsState({
      adminPanel: { ...floatingWidgets.adminPanel, visible: !isVisible }
    });
  }, [actions, floatingWidgets.adminPanel]);

  const handleUpdateSystemInfoInterval = useCallback((interval) => {
    actions.setFloatingWidgetsState({
      systemInfo: { ...floatingWidgets.systemInfo, updateInterval: interval }
    });
  }, [actions, floatingWidgets.systemInfo]);

  const handleUpdateSpotifySettings = useCallback((settings) => {
    actions.setFloatingWidgetsState({
      spotify: { 
        ...floatingWidgets.spotify, 
        settings: { ...floatingWidgets.spotify.settings, ...settings }
      }
    });
  }, [actions, floatingWidgets.spotify]);

  // Handle admin panel save
  const handleAdminPanelSave = useCallback((config) => {
    // Use the direct setFloatingWidgetsState action instead of floatingWidgetManager
    actions.setFloatingWidgetsState({
      adminPanel: { 
        ...floatingWidgets.adminPanel, 
        config
      }
    });
  }, [actions, floatingWidgets.adminPanel]);

  // Save API & Widgets settings
  const handleSaveSettings = useCallback(async () => {}, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="mb-6">
        <Text variant="h2" className="text-[hsl(var(--text-primary))] mb-2">
          API & Widgets
      </Text>
        <Text variant="body" className="text-[hsl(var(--text-secondary))]">
          Configure external integrations and floating widgets
      </Text>
      </div>

      {/* Spotify Integration */}
      <CollapsibleSection
        title="Spotify Integration"
        description="Connect to Spotify and configure the floating widget"
        icon={
          <svg width="28" height="28" viewBox="0 0 24 24" fill={SPOTIFY_ICON_FILL}>
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        }
        iconBgColor={CSS_COLOR_PURE_BLACK}
        gradientBg={SPOTIFY_DEFAULT_GRADIENT}
        borderColor={CSS_SPOTIFY_PRIMARY}
        shadowColor={SPOTIFY_CARD_SHADOW_SOFT}
        defaultCollapsed={true}
      >
        <Card className="mb-6 api-integ-glass-card">
          <div className="p-6">
            {/* Widget Enable/Disable Control */}
            <div
              className="flex items-center justify-between mb-6 p-4 rounded-lg"
              style={{ background: INTEGRATION_PANEL_INSET_BG }}
            >
              <div>
                <Text variant="body" className="text-white font-semibold text-sm">
                  Spotify Widget
                </Text>
                <Text variant="caption" className="text-white opacity-70 text-xs">
                  Display current Spotify playback in a floating widget
                </Text>
              </div>
              <div className="flex items-center space-x-3">
                <Text variant="caption" className="text-white">
                  {floatingWidgets.spotify.visible ? 'Enabled' : 'Disabled'}
                </Text>
                <WButton
                  onClick={handleToggleSpotifyWidget}
                  size="sm"
                  variant="primary"
                  className={spotifyBtnClass(floatingWidgets.spotify.visible, true)}
                >
                  {floatingWidgets.spotify.visible ? 'Disable' : 'Enable'}
                </WButton>
              </div>
          </div>

            <Text variant="body" className="mb-6 text-white font-semibold text-sm">
              Widget Settings
            </Text>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Text variant="caption" className="mb-1 text-white font-semibold text-xs">
                  Connection Status
                </Text>
                <div className="space-y-2">
                  <div className={`px-3 py-2 rounded-md text-sm ${
                    spotify.isConnected 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}>
                    {spotify.isConnected ? 'Connected' : 'Disconnected'}
                  </div>
                  {spotify.error && (
                    <div className="px-3 py-2 rounded-md text-sm bg-red-600 text-white">
                      Error: {spotify.error}
                    </div>
                  )}
                  <WButton
                    onClick={spotify.isConnected ? handleSpotifyDisconnect : handleSpotifyConnect}
                    size="sm"
                    disabled={spotify.loading}
                    variant="primary"
                    fullWidth
                    className={spotifyBtnClass(spotify.isConnected, true)}
                  >
                    {spotify.loading ? 'Connecting...' : (spotify.isConnected ? 'Disconnect' : 'Connect to Spotify')}
                  </WButton>
                  {!spotify.isConnected && !spotify.loading && (
                    <Text variant="caption" className="text-white opacity-70 text-xs">
                      Click to authorize with Spotify. You'll be redirected to Spotify to grant permissions.
                    </Text>
                  )}
                </div>
              </div>

              <div>
                <Text variant="caption" className="mb-1 text-white font-semibold text-xs">
                  Widget Status
                </Text>
                <div className="space-y-2">
                  <div className={`px-3 py-2 rounded-md text-sm ${
                    floatingWidgets.spotify.visible 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-500 text-white'
                  }`}>
                    {floatingWidgets.spotify.visible ? 'Visible' : 'Hidden'}
                  </div>
                  {spotify.isConnected && (
                    <WButton
                      onClick={handleToggleSpotifyWidget}
                      size="sm"
                      variant="primary"
                      fullWidth
                      className={spotifyBtnClass(floatingWidgets.spotify.visible, true)}
                    >
                      {floatingWidgets.spotify.visible ? 'Hide Widget' : 'Show Widget'}
                    </WButton>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <Text variant="caption" className="mb-1 text-white font-semibold text-xs">
                Features
              </Text>
              <div className="space-y-3">
                <div className="api-integ-feature-row flex items-center justify-between rounded-md p-3">
                  <div className="flex items-center">
                    <span className="text-sm mr-2">🎵</span>
                    <Text variant="caption" className="text-white text-xs font-medium">
                      Auto-show widget on playback
                    </Text>
                  </div>
                  <WToggle
                    checked={floatingWidgets.spotify.settings.autoShowWidget}
                    onChange={(checked) => handleUpdateSpotifySettings({ autoShowWidget: checked })}
                    containerClassName="wii-toggle-spotify-accent"
                  />
                </div>

                <div className="api-integ-feature-row flex items-center justify-between rounded-md p-3">
                  <div className="flex items-center">
                    <span className="text-sm mr-2">👁️</span>
                    <Text variant="caption" className="text-white text-xs font-medium">
                      Auto-hide widget when stopped
            </Text>
          </div>
          <WToggle
                    checked={floatingWidgets.spotify.settings.autoHideWidget}
                    onChange={(checked) => handleUpdateSpotifySettings({ autoHideWidget: checked })}
                    containerClassName="wii-toggle-spotify-accent"
          />
        </div>

                <div className="api-integ-feature-row flex items-center justify-between rounded-md p-3">
                  <div className="flex items-center">
                    <span className="text-sm mr-2">🎨</span>
                    <Text variant="caption" className="text-white text-xs font-medium">
                      Dynamic colors
                    </Text>
                  </div>
                  <WToggle
                    checked={floatingWidgets.spotify.settings.dynamicColors}
                    onChange={(checked) => handleUpdateSpotifySettings({ dynamicColors: checked })}
                    containerClassName="wii-toggle-spotify-accent"
                  />
                </div>
              </div>
              <Text variant="caption" className="opacity-70 text-white text-[11px] mt-3">
                Configure how the Spotify widget behaves and displays
              </Text>
            </div>
          </div>
        </Card>
      </CollapsibleSection>

      {/* System Info Widget */}
      <CollapsibleSection
        title="System Info Widget"
        description="Real-time system monitoring and performance metrics"
        icon="📊"
        iconBgColor={CSS_COLOR_PURE_WHITE}
        gradientBg={SYSTEM_INFO_GRADIENT}
        borderColor="hsl(var(--link))"
        shadowColor={SYSTEM_INFO_CARD_SHADOW}
        defaultCollapsed={true}
      >
        <Card className="mb-6 api-integ-glass-card">
          <div className="p-6">
            {/* Widget Enable/Disable Control */}
            <div
              className="flex items-center justify-between mb-6 p-4 rounded-lg"
              style={{ background: INTEGRATION_PANEL_INSET_BG }}
            >
              <div>
                <Text variant="body" className="text-white font-semibold text-sm">
                  System Info Widget
                   </Text>
                <Text variant="caption" className="text-white opacity-70 text-xs">
                  Display real-time system information in a floating widget
                   </Text>
                 </div>
              <div className="flex items-center space-x-3">
                <Text variant="caption" className="text-white">
                  {floatingWidgets.systemInfo.visible ? 'Enabled' : 'Disabled'}
                </Text>
                 <WButton
                  onClick={handleToggleSystemInfoWidget}
                   size="sm"
                   variant="primary"
                   className={spotifyBtnClass(floatingWidgets.systemInfo.visible, false)}
                >
                                      {floatingWidgets.systemInfo.visible ? 'Disable' : 'Enable'}
                 </WButton>
              </div>
            </div>

            <Text variant="body" className="mb-6 text-white font-semibold text-sm">
              Widget Settings
            </Text>
            
            <div className="mb-6">
              <Text variant="caption" className="mb-1 text-white font-semibold text-xs">
                Update Interval
              </Text>
              <input
                type="range"
                min="0"
                max="60"
                                  value={floatingWidgets.systemInfo.updateInterval || 0}
                                  onChange={(e) => handleUpdateSystemInfoInterval(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <Text variant="caption" className="opacity-70 mt-1 text-white text-[11px]">
                                  {floatingWidgets.systemInfo.updateInterval === 0 ? 'Off' : `${floatingWidgets.systemInfo.updateInterval} seconds`}
              </Text>
              <Text variant="caption" className="opacity-70 mt-1 text-white text-[11px]">
                Set to 0 to disable automatic updates
              </Text>
            </div>

            <div className="mb-6">
              <Text variant="caption" className="mb-1 text-white font-semibold text-xs">
                Features
              </Text>
              <div className="mb-2 grid gap-2 api-integ-grid-features">
                <div className="api-integ-pill rounded-md p-2">
                  <Text variant="caption" className="text-white text-[11px] font-semibold">
                    📊 CPU & Memory
                  </Text>
                </div>
                <div className="api-integ-pill rounded-md p-2">
                  <Text variant="caption" className="text-white text-[11px] font-semibold">
                    🎮 GPU & Storage
                  </Text>
                </div>
                <div className="api-integ-pill rounded-md p-2">
                  <Text variant="caption" className="text-white text-[11px] font-semibold">
                    🔋 Battery & Power
                  </Text>
                </div>
                <div className="api-integ-pill rounded-md p-2">
                  <Text variant="caption" className="text-white text-[11px] font-semibold">
                    🖥️ Task Manager
                  </Text>
                </div>
              </div>
              <Text variant="caption" className="opacity-70 text-white text-[11px]">
                Click on metrics to open relevant system applications
              </Text>
            </div>
               </div>
             </Card>
      </CollapsibleSection>

      {/* Admin Panel Widget */}
      <CollapsibleSection
        title="Admin Panel Widget"
        description="Windows system actions and quick access menu"
        icon="⚙️"
        iconBgColor={CSS_COLOR_PURE_WHITE}
        gradientBg={ADMIN_WIDGET_GRADIENT}
        borderColor="hsl(var(--state-warning))"
        shadowColor={ADMIN_WIDGET_CARD_SHADOW}
        defaultCollapsed={true}
      >
        <Card className="mb-6 api-integ-glass-card">
          <div className="p-6">
            {/* Widget Enable/Disable Control */}
            <div
              className="flex items-center justify-between mb-6 p-4 rounded-lg"
              style={{ background: INTEGRATION_PANEL_INSET_BG }}
            >
              <div>
                <Text variant="body" className="text-white font-semibold text-sm">
                  Admin Panel Widget
                </Text>
                <Text variant="caption" className="text-white opacity-70 text-xs">
                  Quick access to Windows system tools and settings
                    </Text>
              </div>
              <div className="flex items-center space-x-3">
                <Text variant="caption" className="text-white">
                  {floatingWidgets.adminPanel.visible ? 'Enabled' : 'Disabled'}
                      </Text>
                        <WButton
                  onClick={handleToggleAdminPanelWidget}
                          size="sm"
                          variant="primary"
                          className={
                            floatingWidgets.adminPanel.visible
                              ? '!bg-red-600 !border-red-600 hover:!bg-red-700 text-white border-solid'
                              : adminOrangeBtn
                          }
                >
                                      {floatingWidgets.adminPanel.visible ? 'Disable' : 'Enable'}
                        </WButton>
                      </div>
                    </div>
                    
            <Text variant="body" className="mb-6 text-white font-semibold text-sm">
              Admin Panel Configuration
            </Text>
            
            <div className="mb-6">
              <Text variant="caption" className="mb-1 text-white font-semibold text-xs">
                Quick Access Menu
              </Text>
              <div className="api-integ-admin-inner mb-4 rounded-lg border p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Text variant="caption" className="text-white font-semibold text-sm">
                      Selected Actions
                      </Text>
                    <Text variant="caption" className="text-white opacity-70 text-xs">
                      {adminPanelConfig.powerActions?.length || 0} actions configured
                              </Text>
                           </div>
                           <WButton
                    onClick={() => setShowAdminPanel(true)}
                             size="sm"
                             variant="primary"
                             className={adminOrangeBtn}
                  >
                    Configure Actions
                           </WButton>
                         </div>
                         
                {adminPanelConfig.powerActions && adminPanelConfig.powerActions.length > 0 ? (
                  <div className="grid gap-2 api-integ-grid-actions">
                    {adminPanelConfig.powerActions.slice(0, 6).map((action, index) => (
                      <div key={action.id} className="api-integ-feature-row rounded-md p-3">
                        <div className="flex items-center">
                          <span className="text-sm mr-2">{action.icon}</span>
                          <Text variant="caption" className="text-white text-xs font-medium">
                            {action.name}
                          </Text>
                                    </div>
                                </div>
                              ))}
                    {adminPanelConfig.powerActions.length > 6 && (
                      <div className="api-integ-feature-row rounded-md p-3">
                        <Text variant="caption" className="text-white text-xs font-medium">
                          +{adminPanelConfig.powerActions.length - 6} more actions
                        </Text>
                       </div>
                     )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Text variant="caption" className="text-white opacity-70 text-sm">
                      No actions configured yet
                 </Text>
                    <Text variant="caption" className="text-white opacity-50 text-xs mt-1">
                      Click "Configure Actions" to add Windows system actions
                     </Text>
                   </div>
                 )}
              </div>
                 </div>

            <div className="mb-6">
              <Text variant="caption" className="mb-1 text-white font-semibold text-xs">
                Features
                   </Text>
              <div className="mb-2 grid gap-2 api-integ-grid-features">
                <div className="api-integ-pill rounded-md p-2">
                  <Text variant="caption" className="text-white text-[11px] font-semibold">
                    🔌 Power Management
                   </Text>
                 </div>
                <div className="api-integ-pill rounded-md p-2">
                  <Text variant="caption" className="text-white text-[11px] font-semibold">
                    🛠️ System Tools
                     </Text>
                   </div>
                <div className="api-integ-pill rounded-md p-2">
                  <Text variant="caption" className="text-white text-[11px] font-semibold">
                    🎛️ Settings
                     </Text>
                   </div>
                <div className="api-integ-pill rounded-md p-2">
                  <Text variant="caption" className="text-white text-[11px] font-semibold">
                    📁 File Management
                   </Text>
                 </div>
               </div>
              <Text variant="caption" className="opacity-70 text-white text-[11px]">
                Access Windows system tools and settings through the admin panel
            </Text>
          </div>
        </div>
      </Card>
      </CollapsibleSection>



      {/* Admin Panel Modal */}
      <AdminPanel
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
        onSave={handleAdminPanelSave}
        config={adminPanelConfig}
      />
    </div>
  );
};

export default ApiIntegrationsSettingsTab; 