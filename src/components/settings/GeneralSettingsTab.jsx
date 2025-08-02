import React, { useCallback } from 'react';
import Card from '../../ui/Card';
import Toggle from '../../ui/Toggle';
import Button from '../../ui/WButton';
import Text from '../../ui/Text';

const GeneralSettingsTab = React.memo(({ 
  localSettings, 
  updateLocalSetting,
  isAnonymous,
  currentUser,
  handleSignUp,
  handleSignIn,
  handleSignOut
}) => {
  // Memoize callback functions to prevent unnecessary re-renders
  const handleImmersivePipChange = useCallback((checked) => {
    updateLocalSetting('general', 'immersivePip', checked);
  }, [updateLocalSetting]);

  const handleStartInFullscreenChange = useCallback((checked) => {
    updateLocalSetting('general', 'startInFullscreen', checked);
  }, [updateLocalSetting]);

  const handleShowPresetsButtonChange = useCallback((checked) => {
    updateLocalSetting('general', 'showPresetsButton', checked);
  }, [updateLocalSetting]);

  const handleStartOnBootChange = useCallback((checked) => {
    updateLocalSetting('general', 'startOnBoot', checked);
  }, [updateLocalSetting]);

  const handleSettingsShortcutChange = useCallback((shortcut) => {
    updateLocalSetting('general', 'settingsShortcut', shortcut);
  }, [updateLocalSetting]);

  const handleClearShortcut = useCallback(() => {
    updateLocalSetting('general', 'settingsShortcut', '');
  }, [updateLocalSetting]);

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
          <Toggle
            checked={localSettings.general?.immersivePip ?? false}
            onChange={handleImmersivePipChange}
          />
        }
        style={{ marginBottom: '20px' }}
      />

      {/* Start in Fullscreen */}
      <Card
        title="Start in Fullscreen"
        separator
        desc="When enabled, the app will start in fullscreen mode. When disabled, it will start in windowed mode."
        headerActions={
          <Toggle
            checked={localSettings.general?.startInFullscreen ?? false}
            onChange={handleStartInFullscreenChange}
          />
        }
        style={{ marginBottom: '20px' }}
      />

      {/* Show Presets Button */}
      <Card
        title="Show Presets Button"
        separator
        desc="When enabled, shows a presets button near the time display that allows quick access to saved appearance presets. Right-click the button to customize its icon."
        headerActions={
          <Toggle
            checked={localSettings.general?.showPresetsButton ?? true}
            onChange={handleShowPresetsButtonChange}
          />
        }
        style={{ marginBottom: '20px' }}
      />

      {/* Launch on Startup */}
      <Card
        title="Launch app when my computer starts"
        separator
        desc="When enabled, the app will launch automatically when your computer starts."
        headerActions={
          <Toggle
            checked={localSettings.general?.startOnBoot ?? false}
            onChange={handleStartOnBootChange}
          />
        }
        style={{ marginBottom: '20px' }}
      />

      {/* Keyboard Shortcut */}
      <Card
        title="Keyboard Shortcut"
        separator
        desc="Set a keyboard shortcut to quickly open the settings modal. Press the keys you want to use for the shortcut."
        actions={
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <label style={{ fontWeight: 500, minWidth: 120 }}>Shortcut</label>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                padding: '8px 12px',
                border: '1px solid hsl(var(--border-primary))',
                borderRadius: '6px',
                background: 'hsl(var(--surface-primary))',
                minWidth: '200px',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              onClick={() => {
                // Start listening for key combination
                const handleKeyDown = (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const keys = [];
                  if (e.ctrlKey) keys.push('Ctrl');
                  if (e.shiftKey) keys.push('Shift');
                  if (e.altKey) keys.push('Alt');
                  if (e.metaKey) keys.push('Cmd');
                  
                  // Add the main key (avoid modifier keys)
                  if (e.key && e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt' && e.key !== 'Meta') {
                    keys.push(e.key.toUpperCase());
                  }
                  
                  if (keys.length > 0) {
                    const shortcut = keys.join(' + ');
                    handleSettingsShortcutChange(shortcut);
                    document.removeEventListener('keydown', handleKeyDown);
                    document.removeEventListener('click', handleClickOutside);
                  }
                };
                
                const handleClickOutside = () => {
                  document.removeEventListener('keydown', handleKeyDown);
                  document.removeEventListener('click', handleClickOutside);
                };
                
                document.addEventListener('keydown', handleKeyDown);
                document.addEventListener('click', handleClickOutside);
                
                // Show visual feedback
                const shortcutElement = document.querySelector('[data-shortcut-input]');
                if (shortcutElement) {
                  shortcutElement.style.background = 'hsl(var(--surface-tertiary))';
                  shortcutElement.textContent = 'Press keys...';
                }
              }}
              data-shortcut-input
              >
                {localSettings.general?.settingsShortcut || 'Click to set shortcut'}
              </div>
              <Button 
                variant="secondary" 
                onClick={handleClearShortcut}
                disabled={!localSettings.general?.settingsShortcut}
              >
                Clear
              </Button>
            </div>
            
            <div style={{ 
              fontSize: '13px', 
              color: 'hsl(var(--text-secondary))', 
              padding: '12px',
              background: 'hsl(var(--surface-secondary))',
              borderRadius: '6px',
              border: '1px solid hsl(var(--border-primary))'
            }}>
              <strong>💡 Tip:</strong> Common shortcuts include Ctrl+Shift+S, Ctrl+, (comma), or F12. 
              The shortcut will work globally when the app is focused.
            </div>
          </div>
        }
        style={{ marginBottom: '20px' }}
      />

      {/* Account Management */}
      <Card
        title="Account Management"
        separator
        desc={isAnonymous 
          ? "You can use all community features without an account! Browse, download, and upload presets anonymously. Create an account to manage your uploads, track favorites, and get a personalized experience."
          : `Signed in as ${currentUser?.email || 'Unknown'}. You can manage your uploads and get a personalized experience.`
        }
        actions={
          <div style={{ marginTop: 16 }}>
            {isAnonymous ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button 
                  variant="primary" 
                  onClick={handleSignUp}
                >
                  Create Account (Optional)
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={handleSignIn}
                >
                  Sign In (Optional)
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Text size="sm" color="hsl(var(--text-secondary))">
                  {currentUser?.email}
                </Text>
                <Button 
                  variant="tertiary" 
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        }
        style={{ marginBottom: '20px' }}
      />

      {/* Fresh Install Restore */}
      <Card
        title="Restore Fresh Install"
        separator
        desc="If you're experiencing issues with the app, you can restore it to a fresh state. This will backup your current data and give you a clean start. Your old data will be preserved in a backup folder."
        actions={
          <div style={{ marginTop: 16 }}>
            <Button 
              variant="primary" 
              onClick={handleFreshInstall}
              style={{
                background: '#dc3545',
                borderColor: '#dc3545',
                color: 'white'
              }}
            >
              🔄 Restore Fresh Install
            </Button>
            <div style={{ 
              fontSize: '13px', 
              color: 'hsl(var(--text-secondary))', 
              marginTop: '8px',
              padding: '12px',
              background: 'hsl(var(--surface-secondary))',
              borderRadius: '6px',
              border: '1px solid hsl(var(--border-primary))'
            }}>
              <strong>⚠️ Warning:</strong> This will backup your current data and give you a completely fresh start. 
              All your current settings, wallpapers, sounds, and channel configurations will be reset to defaults. 
              Your old data will be preserved in a backup folder that you can access later if needed.
            </div>
          </div>
        }
        style={{ marginBottom: '20px' }}
      />
    </div>
  );
});

GeneralSettingsTab.displayName = 'GeneralSettingsTab';

export default GeneralSettingsTab; 