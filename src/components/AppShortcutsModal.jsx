import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import WBaseModal from './WBaseModal';
import Card from '../ui/Card';
import Text from '../ui/Text';
import Button from '../ui/WButton';
import useUIStore from '../utils/useUIStore';
import { formatShortcut, validateShortcut, checkShortcutConflict, getShortcutsByCategory } from '../utils/keyboardShortcuts';
import './BaseModal.css';

function AppShortcutsModal({ isOpen, onClose }) {
  // Keyboard shortcuts state
  const [editingShortcut, setEditingShortcut] = useState(null);
  const [shortcutError, setShortcutError] = useState('');
  
  // Get keyboard shortcuts from store
  const { 
    keyboardShortcuts, 
    updateKeyboardShortcut, 
    resetKeyboardShortcuts 
  } = useUIStore();



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
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          value={formatShortcut({ key, modifier })}
          onKeyDown={handleKeyDown}
          onFocus={(e) => e.target.select()}
          placeholder="Press a key combination..."
          style={{
            padding: '4px 8px',
            border: '1px solid #ddd',
            borderRadius: 4,
            fontSize: '12px',
            fontFamily: 'monospace',
            minWidth: 120
          }}
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
      <div style={{ padding: '20px' }}>
        {/* Header Actions */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20
        }}>
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
          <div style={{ 
            padding: '8px 12px', 
            background: '#ffeaea', 
            border: '1px solid #ffcccc',
            borderRadius: 4,
            color: '#dc3545',
            marginBottom: 16
          }}>
            {shortcutError}
          </div>
        )}

        {/* Keyboard Shortcuts List */}
        <div style={{ 
          display: 'grid', 
          gap: 12,
          maxHeight: '500px',
          overflowY: 'auto'
        }}>
          {keyboardShortcuts.map((shortcut) => (
            <Card key={shortcut.id} style={{ padding: '16px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 16 
              }}>
                {/* Shortcut Icon */}
                <div style={{ flexShrink: 0 }}>
                  <span style={{ fontSize: '24px' }}>{shortcut.icon}</span>
                </div>
                
                {/* Shortcut Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text weight={600} size="lg" style={{ marginBottom: 4 }}>
                    {shortcut.name}
                  </Text>
                  <br />
                  <Text color="#666" size="sm" style={{ marginBottom: 2 }}>
                    {shortcut.description}
                  </Text>
                  <Text color="#888" size="sm">
                    Category: {shortcut.category}
                  </Text>
                </div>
                
                {/* Shortcut Key */}
                <div style={{ 
                  display: 'flex', 
                  gap: 8,
                  flexShrink: 0,
                  alignItems: 'center'
                }}>
                  {editingShortcut?.id === shortcut.id ? (
                    <ShortcutInput
                      shortcut={shortcut}
                      onSave={handleSaveShortcut}
                      onCancel={handleCancelEditShortcut}
                    />
                  ) : (
                    <>
                      <div style={{
                        padding: '4px 8px',
                        background: shortcut.enabled ? '#e6f3ff' : '#f5f5f5',
                        border: `1px solid ${shortcut.enabled ? '#0099ff' : '#ddd'}`,
                        borderRadius: 4,
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: shortcut.enabled ? '#0099ff' : '#999',
                        minWidth: 80,
                        textAlign: 'center'
                      }}>
                        {formatShortcut(shortcut)}
                      </div>
                      
                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 4 }}>
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
    </WBaseModal>
  );
}

AppShortcutsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AppShortcutsModal; 