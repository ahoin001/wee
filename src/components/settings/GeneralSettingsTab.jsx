import React, { useCallback } from 'react';
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

  // Save UI settings to backend
  const saveUISettings = useCallback(async (newSettings) => {
    try {
      if (window.api?.settings?.set) {
        const currentSettings = await window.api.settings.get();
        const updatedSettings = {
          ...currentSettings,
          ui: {
            ...currentSettings.ui,
            ...newSettings
          }
        };
        await window.api.settings.set(updatedSettings);
        console.log('[GeneralSettingsTab] UI settings saved to backend:', newSettings);
      }
    } catch (error) {
      console.error('[GeneralSettingsTab] Failed to save UI settings:', error);
    }
  }, []);

  // Memoize callback functions to prevent unnecessary re-renders
  const handleImmersivePipChange = useCallback((checked) => {
    console.log('[GeneralSettingsTab] Immersive PiP changed:', checked);
    setUIState({ immersivePip: checked });
    saveUISettings({ immersivePip: checked });
  }, [setUIState, saveUISettings]);

  const handleStartInFullscreenChange = useCallback((checked) => {
    console.log('[GeneralSettingsTab] Start in Fullscreen changed:', checked);
    setUIState({ startInFullscreen: checked });
    saveUISettings({ startInFullscreen: checked });
    
    // Apply the fullscreen setting immediately if the app is running
    if (window.api?.setFullscreen) {
      window.api.setFullscreen(checked);
    }
  }, [setUIState, saveUISettings]);

  const handleShowPresetsButtonChange = useCallback((checked) => {
    console.log('[GeneralSettingsTab] Show Presets Button changed:', checked);
    setUIState({ showPresetsButton: checked });
    saveUISettings({ showPresetsButton: checked });
  }, [setUIState, saveUISettings]);

  const handleClassicModeChange = useCallback((checked) => {
    console.log('[GeneralSettingsTab] Classic Mode changed:', checked);
    setUIState({ classicMode: checked });
    saveUISettings({ classicMode: checked });
  }, [setUIState, saveUISettings]);

  const handleStartOnBootChange = useCallback((checked) => {
    console.log('[GeneralSettingsTab] Start on Boot changed:', checked);
    setUIState({ startOnBoot: checked });
    saveUISettings({ startOnBoot: checked });
  }, [setUIState, saveUISettings]);

  const handleSettingsShortcutChange = useCallback((shortcut) => {
    console.log('[GeneralSettingsTab] Settings Shortcut changed:', shortcut);
    setUIState({ settingsShortcut: shortcut });
    saveUISettings({ settingsShortcut: shortcut });
  }, [setUIState, saveUISettings]);

  const handleClearShortcut = useCallback(() => {
    console.log('[GeneralSettingsTab] Clearing settings shortcut');
    setUIState({ settingsShortcut: '' });
    saveUISettings({ settingsShortcut: '' });
  }, [setUIState, saveUISettings]);

  const handleCustomCursorChange = useCallback((checked) => {
    console.log('[GeneralSettingsTab] Custom Cursor changed:', checked);
    setUIState({ useCustomCursor: checked });
    saveUISettings({ useCustomCursor: checked });
  }, [setUIState, saveUISettings]);

  const handleCursorStyleChange = useCallback((style) => {
    console.log('[GeneralSettingsTab] Cursor Style changed:', style);
    setUIState({ cursorStyle: style });
    saveUISettings({ cursorStyle: style });
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

      {/* Custom Cursor Settings */}
      <Card
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
      />

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