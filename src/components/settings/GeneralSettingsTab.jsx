import React, { useCallback, useEffect } from 'react';
import Card from '../../ui/Card';
import WToggle from '../../ui/WToggle';
import Button from '../../ui/WButton';
import Text from '../../ui/Text';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';

const GeneralSettingsTab = React.memo(() => {
  // Use consolidated store
  const { ui } = useConsolidatedAppStore();
  const { setUIState } = useConsolidatedAppStore(state => state.actions);

  console.log('[GeneralSettingsTab] UI state:', ui);

  // Load auto-launch state and settings shortcut on component mount
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        // Load auto-launch state
        if (window.api?.getAutoLaunch) {
          const isAutoLaunchEnabled = await window.api.getAutoLaunch();
          console.log('[GeneralSettingsTab] Current auto-launch state:', isAutoLaunchEnabled);
          // Update the UI state to reflect the actual system setting
          setUIState({ startOnBoot: isAutoLaunchEnabled });
        }

        // Load settings from unified data
        if (window.api?.data?.get) {
          const currentData = await window.api.data.get();
          const appearanceSettings = currentData.settings?.appearance || {};
          const systemSettings = currentData.settings?.system || {};
          const dockSettings = currentData.settings?.dock || {};
          
          console.log('[GeneralSettingsTab] Loaded settings from unified data:', {
            appearance: appearanceSettings,
            system: systemSettings,
            dock: dockSettings
          });
          
          // Update UI state with all relevant settings
          setUIState({
            immersivePip: appearanceSettings.immersivePip ?? false,
            startInFullscreen: appearanceSettings.startInFullscreen ?? false,
            showPresetsButton: appearanceSettings.showPresetsButton ?? true,
            useCustomCursor: appearanceSettings.useCustomCursor ?? true,
            cursorStyle: appearanceSettings.cursorStyle ?? 'classic',
            settingsShortcut: systemSettings.settingsShortcut || '',
            classicMode: dockSettings.classicMode ?? false,
            showDock: dockSettings.showDock ?? true,
          });
        }
      } catch (error) {
        console.error('[GeneralSettingsTab] Failed to load initial state:', error);
      }
    };

    loadInitialState();
  }, [setUIState]);

  // Save UI settings to backend using unified data API
  const saveUISettings = useCallback(async (newSettings, category = 'appearance') => {
    try {
      if (window.api?.data?.get && window.api?.data?.set) {
        const currentData = await window.api.data.get();
        const updatedData = {
          ...currentData,
          settings: {
            ...currentData.settings,
            [category]: {
              ...currentData.settings?.[category],
              ...newSettings
            }
          }
        };
        await window.api.data.set(updatedData);
        console.log(`[GeneralSettingsTab] ${category} settings saved to unified data:`, newSettings);
      } else if (window.api?.settings?.set) {
        // Fallback to legacy API
        const currentSettings = await window.api.settings.get();
        const updatedSettings = {
          ...currentSettings,
          ui: {
            ...currentSettings.ui,
            ...newSettings
          }
        };
        await window.api.settings.set(updatedSettings);
        console.log('[GeneralSettingsTab] UI settings saved to legacy backend:', newSettings);
      }
    } catch (error) {
      console.error('[GeneralSettingsTab] Failed to save UI settings:', error);
    }
  }, []);

  // Memoize callback functions to prevent unnecessary re-renders
  const handleImmersivePipChange = useCallback((checked) => {
    console.log('[GeneralSettingsTab] Immersive PiP changed:', checked);
    setUIState({ immersivePip: checked });
    saveUISettings({ immersivePip: checked }, 'appearance');
  }, [setUIState, saveUISettings]);

  const handleStartInFullscreenChange = useCallback(async (checked) => {
    console.log('[GeneralSettingsTab] Start in Fullscreen changed:', checked);
    setUIState({ startInFullscreen: checked });
    saveUISettings({ startInFullscreen: checked }, 'appearance');
  }, [setUIState, saveUISettings]);

  const handleShowPresetsButtonChange = useCallback((checked) => {
    console.log('[GeneralSettingsTab] Show Presets Button changed:', checked);
    setUIState({ showPresetsButton: checked });
    saveUISettings({ showPresetsButton: checked }, 'appearance');
  }, [setUIState, saveUISettings]);

  const handleClassicModeChange = useCallback((checked) => {
    console.log('[GeneralSettingsTab] Classic Mode changed:', checked);
    setUIState({ classicMode: checked });
    saveUISettings({ classicMode: checked }, 'dock');
  }, [setUIState, saveUISettings]);

  const handleShowDockChange = useCallback((checked) => {
    console.log('[GeneralSettingsTab] Show Dock changed:', checked);
    setUIState({ showDock: checked });
    saveUISettings({ showDock: checked }, 'dock');
  }, [setUIState, saveUISettings]);

  const handleStartOnBootChange = useCallback(async (checked) => {
    console.log('[GeneralSettingsTab] Start on Boot changed:', checked);
    try {
      // Use the dedicated auto-launch API
      if (window.api?.setAutoLaunch) {
        await window.api.setAutoLaunch(checked);
        console.log('[GeneralSettingsTab] Auto-launch setting updated:', checked);
      }
      // Also update the UI state for consistency
      setUIState({ startOnBoot: checked });
    } catch (error) {
      console.error('[GeneralSettingsTab] Failed to update auto-launch setting:', error);
    }
  }, [setUIState]);

  const handleSettingsShortcutChange = useCallback(async (shortcut) => {
    console.log('[GeneralSettingsTab] Settings Shortcut changed:', shortcut);
    setUIState({ settingsShortcut: shortcut });
    saveUISettings({ settingsShortcut: shortcut }, 'system');
  }, [setUIState, saveUISettings]);

  const handleClearShortcut = useCallback(async () => {
    console.log('[GeneralSettingsTab] Clearing settings shortcut');
    setUIState({ settingsShortcut: '' });
    saveUISettings({ settingsShortcut: '' }, 'system');
  }, [setUIState, saveUISettings]);

  const handleCustomCursorChange = useCallback((checked) => {
    console.log('[GeneralSettingsTab] Custom Cursor changed:', checked);
    setUIState({ useCustomCursor: checked });
    saveUISettings({ useCustomCursor: checked }, 'appearance');
  }, [setUIState, saveUISettings]);

  const handleCursorStyleChange = useCallback((style) => {
    console.log('[GeneralSettingsTab] Cursor Style changed:', style);
    setUIState({ cursorStyle: style });
    saveUISettings({ cursorStyle: style }, 'appearance');
  }, [setUIState, saveUISettings]);

  const handleFreshInstall = useCallback(async () => {
    if (window.confirm('Are you sure you want to restore to a fresh install? This will backup your current data and give you a clean start. Your old data will be preserved in a backup folder.')) {
      try {
        // Trigger fresh install through the backend
        if (window.api && window.api.getFreshInstallInfo) {
          // First, get current info to show backup location
          const currentInfo = await window.api.getFreshInstallInfo();
          
          // Show confirmation with backup location
          const backupLocation = currentInfo.backupLocation;
          const confirmMessage = backupLocation 
            ? `Your current data will be backed up to:\n${backupLocation}\n\nProceed with fresh install?`
            : 'Proceed with fresh install?';
          
          if (window.confirm(confirmMessage)) {
            // Trigger the fresh install by calling the backend
            // We'll use a special IPC call to trigger the fresh install
            if (window.api && window.api.triggerFreshInstall) {
              await window.api.triggerFreshInstall();
              alert('Fresh install completed! The app will restart with a clean state. Your old data has been backed up.');
              // Reload the app to apply the fresh install
              window.location.reload();
            } else {
              alert('Fresh install feature not available. Please restart the app manually.');
            }
          }
        } else {
          alert('Fresh install feature not available. Please restart the app manually.');
        }
      } catch (error) {
        alert('Error during fresh install: ' + error.message);
      }
    }
  }, []);

  return (
    <div>
      {/* Immersive PiP */}
      <Card
        title="Immersive Picture in Picture mode"
        separator
        desc="When enabled, video overlays will use immersive PiP mode for a more cinematic experience."
        headerActions={
          <WToggle
            checked={ui.immersivePip ?? false}
            onChange={handleImmersivePipChange}
          />
        }
        className="mb-5"
      />

      {/* Start in Fullscreen */}
      <Card
        title="Start in Fullscreen"
        separator
        desc="When enabled, the app will start in fullscreen mode. When disabled, it will start in windowed mode."
        headerActions={
          <WToggle
            checked={ui.startInFullscreen ?? false}
            onChange={handleStartInFullscreenChange}
          />
        }
        className="mb-5"
      />

      {/* Show Presets Button */}
      <Card
        title="Show Presets Button"
        separator
        desc="When enabled, shows a presets button near the time display that allows quick access to saved appearance presets. Right-click the button to customize its icon."
        headerActions={
          <WToggle
            checked={ui.showPresetsButton ?? true}
            onChange={handleShowPresetsButtonChange}
          />
        }
        className="mb-5"
      />

      {/* Show Dock */}
      <Card
        title="Show Dock"
        separator
        desc="When enabled, shows the dock at the bottom of the screen. When disabled, the dock will be hidden."
        headerActions={
          <WToggle
            checked={ui.showDock ?? true}
            onChange={handleShowDockChange}
          />
        }
        className="mb-5"
      />

      {/* Custom Cursor Settings */}
      {/* <Card
        title="Custom Wii Cursor"
        separator
        desc="Enable a custom Wii-inspired cursor and choose from different styles."
        headerActions={
          <WToggle
            checked={ui.useCustomCursor ?? true}
            onChange={handleCustomCursorChange}
          />
        }
        actions={
          ui.useCustomCursor && (
            <div className="mt-4">
              <div className="flex items-center gap-3 mb-4">
                <Text variant="body" className="font-medium min-w-20">Style</Text>
                <div className="flex items-center gap-2">
                  {[
                    { value: 'classic', label: 'Classic', desc: 'Authentic Wii style with pulsing glow' },
                    { value: 'minimal', label: 'Minimal', desc: 'Simple and clean design' },
                    { value: 'glowing', label: 'Glowing', desc: 'Bright glowing effect' },
                    { value: 'retro', label: 'Retro', desc: 'Vintage gaming aesthetic' }
                  ].map((style) => (
                    <button
                      key={style.value}
                      onClick={() => handleCursorStyleChange(style.value)}
                      className={`
                        px-3 py-2 rounded-md border transition-all duration-200 text-sm font-medium
                        ${ui.cursorStyle === style.value
                          ? 'bg-[hsl(var(--wii-blue))] text-white border-[hsl(var(--wii-blue))] shadow-[0_0_8px_rgba(0,153,255,0.3)]'
                          : 'bg-[hsl(var(--surface-primary))] text-[hsl(var(--text-primary))] border-[hsl(var(--border-primary))] hover:bg-[hsl(var(--surface-secondary))] hover:border-[hsl(var(--wii-blue))]'
                        }
                      `}
                      title={style.desc}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
              <Text variant="caption" className="p-3 bg-[hsl(var(--surface-secondary))] rounded-md border border-[hsl(var(--border-primary))]">
                <strong>🎯 Cursor Styles:</strong> Choose from different Wii-inspired cursor designs. 
                The cursor will automatically adapt to light and dark modes.
              </Text>
            </div>
          )
        }
        className="mb-5"
      /> */}

      {/* Launch on Startup */}
      <Card
        title="Launch app when my computer starts"
        separator
        desc="When enabled, the app will launch automatically when your computer starts."
        headerActions={
          <WToggle
            checked={ui.startOnBoot ?? false}
            onChange={handleStartOnBootChange}
          />
        }
        className="mb-5"
      />

      {/* Settings Shortcut */}
      {/* <Card
        title="Settings Keyboard Shortcut"
        separator
        desc="Set a custom keyboard shortcut to quickly open the settings menu. Leave empty to disable."
        actions={
          <div className="mt-4">
            <div className="flex items-center gap-3 mb-4">
              <Text variant="body" className="font-medium min-w-20">Shortcut</Text>
              <input
                type="text"
                value={ui.settingsShortcut || ''}
                onChange={(e) => handleSettingsShortcutChange(e.target.value)}
                placeholder="e.g., Ctrl+Shift+S"
                className="flex-1 px-3 py-2 bg-[hsl(var(--surface-primary))] border border-[hsl(var(--border-primary))] rounded-md text-[hsl(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--wii-blue))] focus:border-transparent"
              />
              <Button
                variant="secondary"
                onClick={handleClearShortcut}
                className="px-3 py-2"
              >
                Clear
              </Button>
            </div>
            <Text variant="caption" className="p-3 bg-[hsl(var(--surface-secondary))] rounded-md border border-[hsl(var(--border-primary))]">
              <strong>⌨️ Keyboard Shortcuts:</strong> Set a custom shortcut to quickly access settings. 
              Use standard key combinations like Ctrl+Shift+S, Alt+S, or F12. 
              The shortcut will work globally when the app is running.
            </Text>
          </div>
        }
        className="mb-5"
      /> */}

      {/* Fresh Install Restore */}
      <Card
        title="Restore Fresh Install"
        separator
        desc="If you're experiencing issues with the app, you can restore it to a fresh state. This will backup your current data and give you a clean start. Your old data will be preserved in a backup folder."
        actions={
          <div className="mt-4">
            <Button 
              variant="primary" 
              onClick={handleFreshInstall}
              className="bg-red-600 border-red-600 text-white hover:bg-red-700 hover:border-red-700"
            >
              🔄 Restore Fresh Install
            </Button>
            <Text variant="caption" className="mt-2 p-3 bg-[hsl(var(--surface-secondary))] rounded-md border border-[hsl(var(--border-primary))]">
              <strong>⚠️ Warning:</strong> This will backup your current data and give you a completely fresh start. 
              All your current settings, wallpapers, sounds, and channel configurations will be reset to defaults. 
              Your old data will be preserved in a backup folder that you can access later if needed.
            </Text>
          </div>
        }
        className="mb-5"
      />
    </div>
  );
});

GeneralSettingsTab.displayName = 'GeneralSettingsTab';

export default GeneralSettingsTab; 