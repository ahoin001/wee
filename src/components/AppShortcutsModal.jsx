import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import Card from '../ui/Card';
import Text from '../ui/Text';
import Button from '../ui/Button';
import ChannelModal from './ChannelModal';
import useUIStore from '../utils/useUIStore';
import { formatShortcut, validateShortcut, checkShortcutConflict, getShortcutsByCategory } from '../utils/keyboardShortcuts';
import './BaseModal.css';

function AppShortcutsModal({ isOpen, onClose }) {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingChannel, setEditingChannel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'type', 'date'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  
  // Keyboard shortcuts state
  const [activeTab, setActiveTab] = useState('app'); // 'app' or 'keyboard'
  const [editingShortcut, setEditingShortcut] = useState(null);
  const [shortcutError, setShortcutError] = useState('');
  
  // Get keyboard shortcuts from store
  const { 
    keyboardShortcuts, 
    updateKeyboardShortcut, 
    resetKeyboardShortcuts 
  } = useUIStore();

  // Load channels from settings
  useEffect(() => {
    if (isOpen) {
      loadChannels();
    }
  }, [isOpen]);

  const loadChannels = async () => {
    setLoading(true);
    try {
      const channelsData = await window.api.channels.get();
      setChannels(channelsData.channels || []);
    } catch (error) {
      console.error('Failed to load channels:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort channels
  const filteredAndSortedChannels = channels
    .filter(channel => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        channel.name?.toLowerCase().includes(query) ||
        channel.path?.toLowerCase().includes(query) ||
        channel.type?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'type':
          aValue = a.type || '';
          bValue = b.type || '';
          break;
        case 'date':
          aValue = a.createdAt || 0;
          bValue = b.createdAt || 0;
          break;
        default:
          aValue = a.name || '';
          bValue = b.name || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleEditChannel = (channel) => {
    setEditingChannel(channel);
  };

  const handleSaveChannel = async (channelId, channelData) => {
    try {
      const channelsData = await window.api.channels.get();
      const updatedChannels = channelsData.channels.map(channel => 
        channel.id === channelId ? { ...channel, ...channelData } : channel
      );
      
      await window.api.channels.set({
        ...channelsData,
        channels: updatedChannels
      });
      
      setChannels(updatedChannels);
      setEditingChannel(null);
    } catch (error) {
      console.error('Failed to save channel:', error);
    }
  };

  const handleDeleteChannel = async (channelId) => {
    if (!window.confirm('Are you sure you want to delete this app shortcut?')) {
      return;
    }

    try {
      const channelsData = await window.api.channels.get();
      const updatedChannels = channelsData.channels.filter(channel => channel.id !== channelId);
      
      await window.api.channels.set({
        ...channelsData,
        channels: updatedChannels
      });
      
      setChannels(updatedChannels);
    } catch (error) {
      console.error('Failed to delete channel:', error);
    }
  };

  const handleTestChannel = async (channel) => {
    if (window.api && window.api.executeCommand) {
      try {
        await window.api.executeCommand(channel.path);
      } catch (error) {
        console.error('Failed to execute command:', error);
      }
    }
  };

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

  const getChannelIcon = (channel) => {
    if (channel.media?.url) {
      return (
        <img 
          src={channel.media.url} 
          alt={channel.name}
          style={{ 
            width: 32, 
            height: 32, 
            objectFit: 'cover', 
            borderRadius: 4,
            border: '1px solid #e0e0e0'
          }}
        />
      );
    }
    
    // Default icons based on type
    const typeIcons = {
      exe: '💻',
      url: '🌐',
      steam: '🎮',
      epic: '🎮',
      microsoftstore: '🏪'
    };
    
    return <span style={{ fontSize: '24px' }}>{typeIcons[channel.type] || '📱'}</span>;
  };

  const getChannelTypeLabel = (type) => {
    const typeLabels = {
      exe: 'Application',
      url: 'Website',
      steam: 'Steam Game',
      epic: 'Epic Game',
      microsoftstore: 'Microsoft Store'
    };
    return typeLabels[type] || type;
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

  if (editingChannel) {
    return (
      <ChannelModal
        channelId={editingChannel.id}
        onClose={() => setEditingChannel(null)}
        onSave={handleSaveChannel}
        currentMedia={editingChannel.media}
        currentPath={editingChannel.path}
        currentType={editingChannel.type}
        currentHoverSound={editingChannel.hoverSound}
        currentAsAdmin={editingChannel.asAdmin}
        currentAnimatedOnHover={editingChannel.animatedOnHover}
        currentKenBurnsEnabled={editingChannel.kenBurnsEnabled}
        currentKenBurnsMode={editingChannel.kenBurnsMode}
      />
    );
  }

  if (!isOpen) return null;

    return (
    <BaseModal
      title="Shortcuts Management"
      onClose={onClose}
      maxWidth="1200px"
    >
      <div style={{ padding: '20px' }}>
        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #ddd',
          marginBottom: 20
        }}>
          <button
            onClick={() => setActiveTab('app')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: activeTab === 'app' ? '#0099ff' : 'transparent',
              color: activeTab === 'app' ? '#fff' : '#666',
              cursor: 'pointer',
              borderBottom: activeTab === 'app' ? '2px solid #0099ff' : 'none',
              fontWeight: activeTab === 'app' ? '600' : '400'
            }}
          >
            📱 App Shortcuts ({channels.length})
          </button>
          <button
            onClick={() => setActiveTab('keyboard')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: activeTab === 'keyboard' ? '#0099ff' : 'transparent',
              color: activeTab === 'keyboard' ? '#fff' : '#666',
              cursor: 'pointer',
              borderBottom: activeTab === 'keyboard' ? '2px solid #0099ff' : 'none',
              fontWeight: activeTab === 'keyboard' ? '600' : '400'
            }}
          >
            ⌨️ Keyboard Shortcuts ({keyboardShortcuts.length})
          </button>
        </div>

        {/* App Shortcuts Tab */}
        {activeTab === 'app' && (
          <>
            {/* Search and Sort Controls */}
            <div style={{ 
              display: 'flex', 
              gap: 12, 
              marginBottom: 20,
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <input
                  type="text"
                  placeholder="Search app shortcuts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: '14px'
                }}
              >
                <option value="name">Sort by Name</option>
                <option value="type">Sort by Type</option>
                <option value="date">Sort by Date</option>
              </select>
              
              <Button
                variant="secondary"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                style={{ padding: '8px 12px' }}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>

            {/* App Shortcuts List */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Text>Loading app shortcuts...</Text>
              </div>
            ) : filteredAndSortedChannels.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Text color="#666">
                  {searchQuery ? 'No shortcuts found matching your search.' : 'No app shortcuts configured yet.'}
                </Text>
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gap: 12,
                maxHeight: '500px',
                overflowY: 'auto'
              }}>
                {filteredAndSortedChannels.map((channel) => (
                  <Card key={channel.id} style={{ padding: '16px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 16 
                    }}>
                      {/* Channel Icon */}
                      <div style={{ flexShrink: 0 }}>
                        {getChannelIcon(channel)}
                      </div>
                      
                      {/* Channel Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text weight={600} size="lg" style={{ marginBottom: 4 }}>
                          {channel.name || 'Unnamed Shortcut'}
                        </Text>
                        <Text color="#666" size="sm" style={{ marginBottom: 2 }}>
                          Type: {getChannelTypeLabel(channel.type)}
                        </Text>
                        <Text color="#888" size="sm" style={{ 
                          fontFamily: 'monospace',
                          wordBreak: 'break-all'
                        }}>
                          {channel.path}
                        </Text>
                      </div>
                      
                      {/* Actions */}
                      <div style={{ 
                        display: 'flex', 
                        gap: 8,
                        flexShrink: 0
                      }}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleTestChannel(channel)}
                          title="Test shortcut"
                        >
                          ▶️ Test
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEditChannel(channel)}
                          title="Edit shortcut"
                        >
                          ✏️ Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteChannel(channel.id)}
                          title="Delete shortcut"
                        >
                          🗑️ Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Keyboard Shortcuts Tab */}
        {activeTab === 'keyboard' && (
          <>
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
          </>
        )}
      </div>
    </BaseModal>
  );
}

AppShortcutsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AppShortcutsModal; 