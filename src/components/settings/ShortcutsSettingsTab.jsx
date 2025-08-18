import React, { useState, useCallback } from 'react';
import Card from '../../ui/Card';
import Text from '../../ui/Text';
import WButton from '../../ui/WButton';
import WToggle from '../../ui/WToggle';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';

const ShortcutsSettingsTab = React.memo(() => {
  const { ui, actions } = useConsolidatedAppStore();
  
  // Local state for shortcut recording
  const [recordingShortcut, setRecordingShortcut] = useState(false);
  const [currentShortcut, setCurrentShortcut] = useState('');
  const [recordingFor, setRecordingFor] = useState('');

  // Reserved shortcuts that cannot be changed
  const RESERVED_SHORTCUTS = [
    'Ctrl+Shift+I', // Developer Tools
    'Ctrl+Shift+F', // Force Developer Tools
    'F11', // Toggle Fullscreen
    'Escape', // Settings Action Menu
  ];

  // Available shortcuts for configuration
  const CONFIGURABLE_SHORTCUTS = [
    {
      id: 'settingsShortcut',
      label: 'Open Settings Modal',
      description: 'Quick access to main settings',
      current: ui.settingsShortcut || 'Not set'
    },
    {
      id: 'spotifyWidgetShortcut',
      label: 'Toggle Spotify Widget',
      description: 'Show/hide Spotify floating widget',
      current: ui.spotifyWidgetShortcut || 'Not set'
    },
    {
      id: 'systemInfoWidgetShortcut',
      label: 'Toggle System Info Widget',
      description: 'Show/hide system information widget',
      current: ui.systemInfoWidgetShortcut || 'Not set'
    },
    {
      id: 'adminPanelWidgetShortcut',
      label: 'Toggle Admin Panel Widget',
      description: 'Show/hide admin panel widget',
      current: ui.adminPanelWidgetShortcut || 'Not set'
    },
    {
      id: 'performanceMonitorShortcut',
      label: 'Toggle Performance Monitor',
      description: 'Show/hide performance monitoring widget',
      current: ui.performanceMonitorShortcut || 'Not set'
    },
    {
      id: 'nextPageShortcut',
      label: 'Next Channel Page',
      description: 'Navigate to next page of channels',
      current: ui.nextPageShortcut || 'Right Arrow'
    },
    {
      id: 'prevPageShortcut',
      label: 'Previous Channel Page',
      description: 'Navigate to previous page of channels',
      current: ui.prevPageShortcut || 'Left Arrow'
    },
    {
      id: 'toggleDockShortcut',
      label: 'Toggle Dock Visibility',
      description: 'Show/hide the bottom dock/ribbon',
      current: ui.toggleDockShortcut || 'Not set'
    },
    {
      id: 'toggleDarkModeShortcut',
      label: 'Toggle Dark Mode',
      description: 'Switch between light and dark themes',
      current: ui.toggleDarkModeShortcut || 'Not set'
    },
    {
      id: 'toggleCustomCursorShortcut',
      label: 'Toggle Custom Cursor',
      description: 'Enable/disable Wii-style custom cursor',
      current: ui.toggleCustomCursorShortcut || 'Not set'
    }
  ];

  // Handle shortcut recording
  const handleStartRecording = useCallback((shortcutId) => {
    setRecordingShortcut(true);
    setRecordingFor(shortcutId);
    setCurrentShortcut('');
    
    // Listen for key combinations
    const handleKeyDown = (event) => {
      event.preventDefault();
      
      const keys = [];
      if (event.ctrlKey) keys.push('Ctrl');
      if (event.altKey) keys.push('Alt');
      if (event.shiftKey) keys.push('Shift');
      if (event.metaKey) keys.push('Cmd');
      
      // Add the main key
      if (event.key !== 'Control' && event.key !== 'Alt' && event.key !== 'Shift' && event.key !== 'Meta') {
        keys.push(event.key.toUpperCase());
      }
      
      if (keys.length > 0) {
        const shortcut = keys.join(' + ');
        
        // Check if shortcut is reserved
        if (RESERVED_SHORTCUTS.includes(shortcut)) {
          setCurrentShortcut('Reserved shortcut - cannot use');
          setTimeout(() => {
            setRecordingShortcut(false);
            setRecordingFor('');
            setCurrentShortcut('');
          }, 2000);
          document.removeEventListener('keydown', handleKeyDown);
          return;
        }
        
        setCurrentShortcut(shortcut);
        setRecordingShortcut(false);
        setRecordingFor('');
        
        // Save the shortcut
        actions.setUIState({ [shortcutId]: shortcut });
        
        // Remove event listener
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
  }, [actions]);

  const handleClearShortcut = useCallback((shortcutId) => {
    actions.setUIState({ [shortcutId]: '' });
  }, [actions]);

  const handleToggleShortcut = useCallback((shortcutId, enabled) => {
    if (!enabled) {
      actions.setUIState({ [shortcutId]: '' });
    }
  }, [actions]);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Text variant="h2" className="text-[hsl(var(--text-primary))] mb-2">
          Keyboard Shortcuts
        </Text>
        <Text variant="body" className="text-[hsl(var(--text-secondary))]">
          Configure keyboard shortcuts for quick access to app features and widgets
        </Text>
      </div>

      {/* Configurable Shortcuts */}
      <Card>
        <div className="p-6">
          <Text variant="h3" className="text-[hsl(var(--text-primary))] mb-4">
            Customizable Shortcuts
          </Text>
          
          <div className="space-y-4">
            {CONFIGURABLE_SHORTCUTS.map((shortcut) => {
              const currentValue = ui[shortcut.id] || '';
              const isEnabled = !!currentValue;
              
              return (
                <div key={shortcut.id} className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-[hsl(var(--surface-secondary))] rounded-lg">
                    <div className="flex-1">
                      <Text variant="body" className="font-semibold text-[hsl(var(--text-primary))]">
                        {shortcut.label}
                      </Text>
                      <Text variant="caption" className="text-[hsl(var(--text-secondary))]">
                        {shortcut.description}
                      </Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <WToggle
                        checked={isEnabled}
                        onChange={(enabled) => handleToggleShortcut(shortcut.id, enabled)}
                        label=""
                      />
                    </div>
                  </div>

                  {isEnabled && (
                    <div className="flex items-center justify-between p-4 bg-[hsl(var(--surface-tertiary))] rounded-lg">
                      <div>
                        <Text variant="body" className="font-medium text-[hsl(var(--text-primary))]">
                          Current Shortcut
                        </Text>
                        <Text variant="caption" className="text-[hsl(var(--text-secondary))] font-mono">
                          {currentValue}
                        </Text>
                      </div>
                      <div className="flex gap-2">
                        <WButton
                          variant="secondary"
                          size="sm"
                          onClick={() => handleStartRecording(shortcut.id)}
                          disabled={recordingShortcut}
                        >
                          {recordingShortcut && recordingFor === shortcut.id ? 'Recording...' : 'Change'}
                        </WButton>
                        <WButton
                          variant="secondary"
                          size="sm"
                          onClick={() => handleClearShortcut(shortcut.id)}
                        >
                          Clear
                        </WButton>
                      </div>
                    </div>
                  )}

                  {recordingShortcut && recordingFor === shortcut.id && (
                    <div className="p-4 bg-[hsl(var(--accent))] rounded-lg">
                      <Text variant="body" className="text-center text-[hsl(var(--accent-foreground))]">
                        {currentShortcut || 'Press a key combination to set the shortcut...'}
                      </Text>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Reserved Shortcuts */}
      <Card>
        <div className="p-6">
          <Text variant="h3" className="text-[hsl(var(--text-primary))] mb-4">
            Reserved Shortcuts
          </Text>
          <Text variant="body" className="text-[hsl(var(--text-secondary))] mb-4">
            These shortcuts are reserved by the system and cannot be changed:
          </Text>
          
          <div className="space-y-3">
            {RESERVED_SHORTCUTS.map((shortcut) => (
              <div key={shortcut} className="flex items-center justify-between p-3 bg-[hsl(var(--surface-secondary))] rounded-lg">
                <div>
                  <Text variant="body" className="font-medium text-[hsl(var(--text-primary))]">
                    {shortcut}
                  </Text>
                </div>
                <div className="text-sm text-[hsl(var(--text-tertiary))] font-mono">
                  Reserved
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Built-in Shortcuts */}
      <Card>
        <div className="p-6">
          <Text variant="h3" className="text-[hsl(var(--text-primary))] mb-4">
            Built-in Shortcuts
          </Text>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[hsl(var(--surface-secondary))] rounded-lg">
              <div>
                <Text variant="body" className="font-medium text-[hsl(var(--text-primary))]">
                  Open Settings Action Menu
                </Text>
                <Text variant="caption" className="text-[hsl(var(--text-secondary))]">
                  Quick settings access
                </Text>
              </div>
              <div className="text-sm text-[hsl(var(--text-secondary))] font-mono">
                Escape
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-[hsl(var(--surface-secondary))] rounded-lg">
              <div>
                <Text variant="body" className="font-medium text-[hsl(var(--text-primary))]">
                  Toggle Fullscreen
                </Text>
                <Text variant="caption" className="text-[hsl(var(--text-secondary))]">
                  Switch between windowed and fullscreen
                </Text>
              </div>
              <div className="text-sm text-[hsl(var(--text-secondary))] font-mono">
                F11
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-[hsl(var(--surface-secondary))] rounded-lg">
              <div>
                <Text variant="body" className="font-medium text-[hsl(var(--text-primary))]">
                  Developer Tools
                </Text>
                <Text variant="caption" className="text-[hsl(var(--text-secondary))]">
                  Open browser developer tools
                </Text>
              </div>
              <div className="text-sm text-[hsl(var(--text-secondary))] font-mono">
                Ctrl+Shift+I
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-[hsl(var(--surface-secondary))] rounded-lg">
              <div>
                <Text variant="body" className="font-medium text-[hsl(var(--text-primary))]">
                  Force Developer Tools
                </Text>
                <Text variant="caption" className="text-[hsl(var(--text-secondary))]">
                  Force open dev tools (development only)
                </Text>
              </div>
              <div className="text-sm text-[hsl(var(--text-secondary))] font-mono">
                Ctrl+Shift+F
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation Shortcuts */}
      <Card>
        <div className="p-6">
          <Text variant="h3" className="text-[hsl(var(--text-primary))] mb-4">
            Navigation Shortcuts
          </Text>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[hsl(var(--surface-secondary))] rounded-lg">
              <div>
                <Text variant="body" className="font-medium text-[hsl(var(--text-primary))]">
                  Next Page
                </Text>
                <Text variant="caption" className="text-[hsl(var(--text-secondary))]">
                  Navigate to next channel page
                </Text>
              </div>
              <div className="text-sm text-[hsl(var(--text-secondary))] font-mono">
                Right Arrow
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-[hsl(var(--surface-secondary))] rounded-lg">
              <div>
                <Text variant="body" className="font-medium text-[hsl(var(--text-primary))]">
                  Previous Page
                </Text>
                <Text variant="caption" className="text-[hsl(var(--text-secondary))]">
                  Navigate to previous channel page
                </Text>
              </div>
              <div className="text-sm text-[hsl(var(--text-secondary))] font-mono">
                Left Arrow
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-[hsl(var(--surface-secondary))] rounded-lg">
              <div>
                <Text variant="body" className="font-medium text-[hsl(var(--text-primary))]">
                  Mouse Wheel Navigation
                </Text>
                <Text variant="caption" className="text-[hsl(var(--text-secondary))]">
                  Use mouse wheel side buttons to navigate
                </Text>
              </div>
              <div className="text-sm text-[hsl(var(--text-secondary))] font-mono">
                Mouse Wheel
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
});

ShortcutsSettingsTab.displayName = 'ShortcutsSettingsTab';

export default ShortcutsSettingsTab;
