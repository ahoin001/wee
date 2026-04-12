import React, { useState } from 'react';
import PropTypes from 'prop-types';
import WBaseModal from './WBaseModal';
import Card from '../ui/Card';
import Text from '../ui/Text';
import Button from '../ui/WButton';
import { useUIState } from '../utils/useConsolidatedAppHooks';
import { formatShortcut, validateShortcut, checkShortcutConflict, getShortcutsByCategory } from '../utils/keyboardShortcuts';
import './settings-modal-forms.css';


function AppShortcutsModal({ isOpen, onClose }) {
  // Keyboard shortcuts state
  const [editingShortcut, setEditingShortcut] = useState(null);
  const [shortcutError, setShortcutError] = useState('');
  
  // ✅ DATA LAYER: Get keyboard shortcuts from consolidated store with proper fallbacks
  const { ui } = useUIState();
  const keyboardShortcuts = ui?.keyboardShortcuts || [];
  const updateKeyboardShortcut = ui?.updateKeyboardShortcut || (() => {});
  const resetKeyboardShortcuts = ui?.resetKeyboardShortcuts || (() => {});



  // Keyboard shortcut handlers
  const handleEditShortcut = (shortcut) => {
    setEditingShortcut(shortcut);
    setShortcutError('');
  };

  const handleSaveShortcut = (shortcutId, updates) => {
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
  };

  const handleCancelEditShortcut = () => {
    setEditingShortcut(null);
    setShortcutError('');
  };

  const handleToggleShortcut = (shortcutId) => {
    const shortcut = keyboardShortcuts.find(s => s.id === shortcutId);
    if (shortcut) {
      updateKeyboardShortcut(shortcutId, { enabled: !shortcut.enabled });
    }
  };

  const handleResetShortcuts = () => {
    if (window.confirm('Are you sure you want to reset all keyboard shortcuts to default?')) {
      resetKeyboardShortcuts();
    }
  };



  // Keyboard shortcut input component
  const ShortcutInput = ({ shortcut, onSave, onCancel }) => {
    const [key, setKey] = useState(shortcut.key);
    const [modifier, setModifier] = useState(shortcut.modifier);

    const handleSave = () => {
      onSave(shortcut.id, { key, modifier });
    };

    const handleKeyDown = (e) => {
      e.preventDefault();
      const newKey = e.key.toLowerCase();
      const newModifier = e.ctrlKey ? 'ctrl' : 
                         e.altKey ? 'alt' : 
                         e.shiftKey ? 'shift' : 
                         e.metaKey ? 'meta' : 'none';
      
      setKey(newKey);
      setModifier(newModifier);
    };

    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={formatShortcut({ key, modifier })}
          onKeyDown={handleKeyDown}
          onFocus={(e) => e.target.select()}
          placeholder="Press a key combination..."
          className="min-w-[120px] rounded border border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-primary))] px-2 py-1 font-mono text-xs text-[hsl(var(--text-primary))]"
          readOnly
        />
        <Button size="sm" onClick={handleSave}>Save</Button>
        <Button size="sm" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    );
  };



  if (!isOpen) return null;

    return (
    <WBaseModal
      title="Keyboard Shortcuts"
      onClose={onClose}
      maxWidth="1200px"
    >
      <div className="p-5">
        {/* Header Actions */}
        <div className="mb-5 flex items-center justify-between">
          <Text size="lg" weight={600}>Keyboard Shortcuts</Text>
          <Button
            variant="secondary"
            onClick={handleResetShortcuts}
            size="sm"
          >
            🔄 Reset to Default
          </Button>
        </div>

        {/* Error Display */}
        {shortcutError && (
          <div className="modal-error-banner" role="alert">
            {shortcutError}
          </div>
        )}

        {/* Keyboard Shortcuts List */}
        <div className="grid max-h-[500px] gap-3 overflow-y-auto">
          {(() => {
            // ✅ DATA LAYER: Add safety check for keyboard shortcuts
            if (!keyboardShortcuts || keyboardShortcuts.length === 0) {
              return (
                <div className="p-5 text-center text-[hsl(var(--text-secondary))]">
                  No keyboard shortcuts available
                </div>
              );
            }
            
            // Group shortcuts by category and sort alphabetically
            const groupedShortcuts = getShortcutsByCategory(keyboardShortcuts);
            const sortedCategories = Object.keys(groupedShortcuts).sort();
            
            return sortedCategories.map(category => (
              <div key={category}>
                <Text 
                  weight={600} 
                  size="md" 
                  className="mb-2 border-b border-[hsl(var(--border-primary))] pb-2 text-[hsl(var(--text-secondary))]"
                >
                  {category}
                </Text>
                <div className="mb-4 grid gap-2">
                  {groupedShortcuts[category]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((shortcut) => (
                    <Card key={shortcut.id} className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Shortcut Icon */}
                        <div className="shrink-0">
                          <span className="text-2xl">{shortcut.icon}</span>
                        </div>
                        
                        {/* Shortcut Info */}
                        <div className="min-w-0 flex-1">
                          <Text weight={600} size="lg" className="mb-1 block">
                            {shortcut.name}
                          </Text>
                          <Text size="sm" className="block text-[hsl(var(--text-secondary))]">
                            {shortcut.description}
                          </Text>
                        </div>
                        
                        {/* Shortcut Key */}
                        <div className="flex shrink-0 items-center gap-2">
                          {editingShortcut?.id === shortcut.id ? (
                            <ShortcutInput
                              shortcut={shortcut}
                              onSave={handleSaveShortcut}
                              onCancel={handleCancelEditShortcut}
                            />
                          ) : (
                            <>
                              <div
                                className={`min-w-[80px] rounded border px-2 py-1 text-center font-mono text-xs ${
                                  shortcut.enabled
                                    ? 'border-[hsl(var(--wii-blue))] bg-[hsl(var(--wii-blue)/0.12)] text-[hsl(var(--wii-blue))]'
                                    : 'border-[hsl(var(--border-primary))] bg-[hsl(var(--surface-secondary))] text-[hsl(var(--text-tertiary))]'
                                }`}
                              >
                                {formatShortcut(shortcut)}
                              </div>
                              
                              {/* Actions */}
                              <div className="flex gap-1">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleEditShortcut(shortcut)}
                                  title="Edit shortcut"
                                  disabled={!shortcut.enabled}
                                >
                                  ✏️
                                </Button>
                                <Button
                                  variant={shortcut.enabled ? "danger" : "primary"}
                                  size="sm"
                                  onClick={() => handleToggleShortcut(shortcut.id)}
                                  title={shortcut.enabled ? "Disable shortcut" : "Enable shortcut"}
                                >
                                  {shortcut.enabled ? '🔴' : '🟢'}
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    </WBaseModal>
  );
}

AppShortcutsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AppShortcutsModal;
