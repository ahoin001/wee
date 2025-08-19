import React, { useState, useCallback, useEffect } from 'react';
import Card from '../../ui/Card';
import Text from '../../ui/Text';
import WButton from '../../ui/WButton';
import WToggle from '../../ui/WToggle';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { formatShortcut, validateShortcut, checkShortcutConflict, getShortcutsByCategory, DEFAULT_SHORTCUTS } from '../../utils/keyboardShortcuts';

const ShortcutsSettingsTab = React.memo(() => {
  const { ui, actions } = useConsolidatedAppStore();
  
  // Local state for shortcut recording
  const [editingShortcut, setEditingShortcut] = useState(null);
  const [shortcutError, setShortcutError] = useState('');
  const [recordingShortcut, setRecordingShortcut] = useState(false);
  const [currentShortcut, setCurrentShortcut] = useState('');

  // Get keyboard shortcuts from store or use defaults
  const keyboardShortcuts = ui?.keyboardShortcuts || DEFAULT_SHORTCUTS.map(shortcut => ({
    ...shortcut,
    key: shortcut.defaultKey,
    modifier: shortcut.defaultModifier,
    enabled: true
  }));

  // Reserved shortcuts that cannot be changed
  const RESERVED_SHORTCUTS = [
    { key: 'Ctrl+Shift+I', label: 'Developer Tools', description: 'Open browser developer tools' },
    { key: 'Ctrl+Shift+F', label: 'Force Developer Tools', description: 'Force open dev tools (development only)' },
    { key: 'F11', label: 'Toggle Fullscreen', description: 'Switch between windowed and fullscreen' },
    { key: 'Escape', label: 'Settings Action Menu', description: 'Quick settings access' },
  ];

  // Update keyboard shortcut in store
  const updateKeyboardShortcut = useCallback((shortcutId, updates) => {
    const updatedShortcuts = keyboardShortcuts.map(shortcut => 
      shortcut.id === shortcutId ? { ...shortcut, ...updates } : shortcut
    );
    actions.setUIState({ keyboardShortcuts: updatedShortcuts });
  }, [keyboardShortcuts, actions]);

  // Reset all shortcuts to default
  const handleResetShortcuts = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all keyboard shortcuts to default?')) {
      actions.resetKeyboardShortcuts();
    }
  }, [actions]);

  // Handle shortcut editing
  const handleEditShortcut = useCallback((shortcut) => {
    setEditingShortcut(shortcut);
    setShortcutError('');
    setRecordingShortcut(true);
    setCurrentShortcut('');
  }, []);

  // Handle saving shortcut
  const handleSaveShortcut = useCallback((shortcutId, updates) => {
    // Validate the shortcut
    const validation = validateShortcut(updates);
    if (!validation.valid) {
      setShortcutError(validation.error);
      return;
    }

    // Check for conflicts
    const conflict = checkShortcutConflict(updates, keyboardShortcuts);
    if (conflict.hasConflict) {
      setShortcutError(`Conflict with "${conflict.conflictingShortcut.name}"`);
      return;
    }

    // Update the shortcut
    updateKeyboardShortcut(shortcutId, updates);
    setEditingShortcut(null);
    setShortcutError('');
    setRecordingShortcut(false);
    setCurrentShortcut('');
  }, [keyboardShortcuts, updateKeyboardShortcut]);

  // Handle canceling edit
  const handleCancelEditShortcut = useCallback(() => {
    setEditingShortcut(null);
    setShortcutError('');
    setRecordingShortcut(false);
    setCurrentShortcut('');
  }, []);

  // Handle toggling shortcut
  const handleToggleShortcut = useCallback((shortcutId) => {
    const shortcut = keyboardShortcuts.find(s => s.id === shortcutId);
    if (shortcut) {
      updateKeyboardShortcut(shortcutId, { enabled: !shortcut.enabled });
    }
  }, [keyboardShortcuts, updateKeyboardShortcut]);

  // Handle key recording
  useEffect(() => {
    if (!recordingShortcut) return;

    const handleKeyDown = (event) => {
      event.preventDefault();
      
      const key = event.key.toLowerCase();
      const modifier = event.ctrlKey ? 'ctrl' : 
                      event.altKey ? 'alt' : 
                      event.shiftKey ? 'shift' : 
                      event.metaKey ? 'meta' : 'none';
      
      // Check if it's a reserved shortcut
      const shortcutString = formatShortcut({ key, modifier });
      if (RESERVED_SHORTCUTS.some(reserved => reserved.key === shortcutString)) {
        setCurrentShortcut('⚠️ Reserved shortcut - cannot use');
        setTimeout(() => {
          setRecordingShortcut(false);
          setEditingShortcut(null);
          setCurrentShortcut('');
        }, 2000);
        return;
      }

      setCurrentShortcut(shortcutString);
      
      // Auto-save after a short delay
      setTimeout(() => {
        if (editingShortcut) {
          handleSaveShortcut(editingShortcut.id, { key, modifier });
        }
      }, 500);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [recordingShortcut, editingShortcut, handleSaveShortcut]);

  // Render shortcut key display
  const renderShortcutKey = (shortcut) => {
    if (!shortcut || !shortcut.enabled) return null;
    
    const shortcutString = formatShortcut(shortcut);
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] rounded text-xs font-mono font-medium">
        {shortcutString.split('+').map((key, index) => (
          <React.Fragment key={index}>
            <span className="px-1 py-0.5 bg-[hsl(var(--accent-foreground))] text-[hsl(var(--accent))] rounded text-xs">
              {key}
            </span>
            {index < shortcutString.split('+').length - 1 && <span>+</span>}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Group shortcuts by category
  const groupedShortcuts = getShortcutsByCategory(keyboardShortcuts);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <Text variant="h2" className="text-[hsl(var(--text-primary))] mb-3">
          🎹 Keyboard Shortcuts
        </Text>
        <Text variant="body" className="text-[hsl(var(--text-secondary))] max-w-2xl mx-auto">
          Configure keyboard shortcuts for quick access to app features and widgets. 
          Click on any shortcut to customize it to your preference.
        </Text>
      </div>

      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div></div>
        <WButton
          variant="secondary"
          onClick={handleResetShortcuts}
          size="sm"
        >
          🔄 Reset to Default
        </WButton>
      </div>

      {/* Error Display */}
      {shortcutError && (
        <Card className="border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10">
          <div className="p-4">
            <Text variant="body" className="text-[hsl(var(--destructive))]">
              ⚠️ {shortcutError}
            </Text>
          </div>
        </Card>
      )}

      {/* Configurable Shortcuts by Category */}
      {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
        <Card key={category} className="overflow-hidden">
          <div className="bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--accent))]/80 p-4">
            <Text variant="h3" className="text-[hsl(var(--accent-foreground))] font-semibold">
              {category}
            </Text>
          </div>
          
          <div className="p-6">
            <div className="grid gap-4">
              {shortcuts.map((shortcut) => (
                <div key={shortcut.id} className="group">
                  {/* Main Shortcut Row */}
                  <div className="flex items-center justify-between p-4 bg-[hsl(var(--surface-secondary))] rounded-lg border border-[hsl(var(--border-primary))] hover:border-[hsl(var(--accent))] transition-all duration-200">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-2xl">{shortcut.icon}</div>
                      <div className="flex-1">
                        <Text variant="body" className="font-semibold text-[hsl(var(--text-primary))] mb-1">
                          {shortcut.name}
                        </Text>
                        <Text variant="caption" className="text-[hsl(var(--text-secondary))]">
                          {shortcut.description}
                        </Text>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Current Shortcut Display */}
                      {shortcut.enabled && !editingShortcut && (
                        <div className="flex items-center gap-2">
                          {renderShortcutKey(shortcut)}
                        </div>
                      )}
                      
                      {/* Recording Display */}
                      {recordingShortcut && editingShortcut?.id === shortcut.id && (
                        <div className="flex items-center gap-2" data-recording-shortcut="true">
                          <Text variant="caption" className="text-[hsl(var(--accent))]">
                            Recording:
                          </Text>
                          <div className="px-2 py-1 bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] rounded text-xs font-mono animate-pulse">
                            {currentShortcut || 'Press keys...'}
                          </div>
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {editingShortcut?.id === shortcut.id ? (
                          <WButton
                            variant="secondary"
                            size="sm"
                            onClick={handleCancelEditShortcut}
                            className="min-w-[60px]"
                          >
                            ❌ Cancel
                          </WButton>
                        ) : (
                          <>
                            <WButton
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEditShortcut(shortcut)}
                              disabled={!shortcut.enabled}
                              className="min-w-[60px]"
                            >
                              ✏️ Edit
                            </WButton>
                            <WToggle
                              checked={shortcut.enabled}
                              onChange={() => handleToggleShortcut(shortcut.id)}
                              label=""
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}

      {/* Reserved Shortcuts */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-[hsl(var(--destructive))] to-[hsl(var(--destructive))]/80 p-4">
          <Text variant="h3" className="text-[hsl(var(--destructive-foreground))] font-semibold">
            🔒 Reserved Shortcuts
          </Text>
        </div>
        <div className="p-6">
          <Text variant="body" className="text-[hsl(var(--text-secondary))] mb-6">
            These shortcuts are reserved by the system and cannot be changed:
          </Text>
          
          <div className="grid gap-3">
            {RESERVED_SHORTCUTS.map((shortcut) => (
              <div key={shortcut.key} className="flex items-center justify-between p-4 bg-[hsl(var(--surface-secondary))] rounded-lg border border-[hsl(var(--border-primary))]">
                <div className="flex items-center gap-4">
                  <div className="text-xl">🔒</div>
                  <div>
                    <Text variant="body" className="font-medium text-[hsl(var(--text-primary))]">
                      {shortcut.label}
                    </Text>
                    <Text variant="caption" className="text-[hsl(var(--text-secondary))]">
                      {shortcut.description}
                    </Text>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] rounded text-xs font-mono font-medium">
                    {shortcut.key.split('+').map((key, index) => (
                      <React.Fragment key={index}>
                        <span className="px-1 py-0.5 bg-[hsl(var(--destructive-foreground))] text-[hsl(var(--destructive))] rounded text-xs">
                          {key}
                        </span>
                        {index < shortcut.key.split('+').length - 1 && <span>+</span>}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="px-2 py-1 bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] rounded text-xs font-medium">
                    Reserved
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Help Section */}
      <Card className="bg-gradient-to-r from-[hsl(var(--accent))]/10 to-[hsl(var(--accent))]/5 border-[hsl(var(--accent))]/20">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="text-2xl">💡</div>
            <div>
              <Text variant="h4" className="text-[hsl(var(--text-primary))] mb-2">
                Tips for Setting Shortcuts
              </Text>
              <div className="space-y-2 text-sm text-[hsl(var(--text-secondary))]">
                <p>• Use combinations like <code className="bg-[hsl(var(--surface-secondary))] px-1 rounded">Ctrl + Shift + A</code> for unique shortcuts</p>
                <p>• Avoid conflicts with system shortcuts like <code className="bg-[hsl(var(--surface-secondary))] px-1 rounded">Ctrl + C</code></p>
                <p>• Function keys (F1-F12) work well for quick access</p>
                <p>• You can use <code className="bg-[hsl(var(--surface-secondary))] px-1 rounded">Alt</code>, <code className="bg-[hsl(var(--surface-secondary))] px-1 rounded">Ctrl</code>, <code className="bg-[hsl(var(--surface-secondary))] px-1 rounded">Shift</code>, and <code className="bg-[hsl(var(--surface-secondary))] px-1 rounded">Cmd</code> (Mac) keys</p>
                <p>• Toggle shortcuts on/off using the switch next to each shortcut</p>
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
