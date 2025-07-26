import React, { useState, useEffect, useRef } from 'react';
import BaseModal from './BaseModal';
import Toggle from '../ui/Toggle';

// Power Actions Data
const powerActionsList = [
  // Power Management
  { id: 'shutdown', name: 'Shut Down', command: 'shutdown /s /t 0', icon: '🔌', category: 'Power' },
  { id: 'restart', name: 'Restart', command: 'shutdown /r /t 0', icon: '🔄', category: 'Power' },
  { id: 'sleep', name: 'Sleep', command: 'rundll32.exe powrprof.dll,SetSuspendState 0,1,0', icon: '😴', category: 'Power' },
  { id: 'hibernate', name: 'Hibernate', command: 'shutdown /h', icon: '💤', category: 'Power' },
  { id: 'lock', name: 'Lock Computer', command: 'rundll32.exe user32.dll,LockWorkStation', icon: '🔒', category: 'Power' },

  // System Tools
  { id: 'taskmgr', name: 'Task Manager', command: 'start taskmgr', icon: '⚙️', category: 'System' },
  { id: 'control', name: 'Control Panel', command: 'start control', icon: '🎛️', category: 'System' },
  { id: 'devmgmt', name: 'Device Manager', command: 'start devmgmt.msc', icon: '🔧', category: 'System' },
  { id: 'services', name: 'Services', command: 'start services.msc', icon: '🛠️', category: 'System' },
  { id: 'regedit', name: 'Registry Editor', command: 'start regedit', icon: '📝', category: 'System' },
  { id: 'about', name: 'About Windows', command: 'start ms-settings:about', icon: 'ℹ️', category: 'System' },

  // Command Line Tools
  { id: 'cmd', name: 'Command Prompt', command: 'start cmd', icon: '💻', category: 'Tools' },
  { id: 'powershell', name: 'PowerShell', command: 'start powershell', icon: '⚡', category: 'Tools' },

  // File Management
  { id: 'explorer', name: 'File Explorer', command: 'start explorer', icon: '📁', category: 'File' },
  { id: 'desktop', name: 'Show Desktop', command: 'start explorer shell:::{3080F90D-D7AD-11D9-BD98-0000947B0257}', icon: '🖥️', category: 'File' },
  { id: 'recycle', name: 'Recycle Bin', command: 'start explorer shell:::{645FF040-5081-101B-9F08-00AA002F954E}', icon: '🗑️', category: 'File' },

  // Classic Control Panel Items
  { id: 'network', name: 'Network Connections', command: 'start ncpa.cpl', icon: '🌐', category: 'Settings' },
  { id: 'sound', name: 'Sound Settings', command: 'start mmsys.cpl', icon: '🔊', category: 'Settings' },
  { id: 'display', name: 'Display Settings', command: 'start desk.cpl', icon: '🖼️', category: 'Settings' },
  { id: 'keyboard', name: 'Keyboard Settings', command: 'start main.cpl keyboard', icon: '⌨️', category: 'Settings' },
  { id: 'mouse', name: 'Mouse Settings', command: 'start main.cpl', icon: '🖱️', category: 'Settings' },
  { id: 'system', name: 'System Properties', command: 'start sysdm.cpl', icon: '💻', category: 'Settings' },
  { id: 'users', name: 'User Accounts', command: 'start nusrmgr.cpl', icon: '👤', category: 'Settings' },
  { id: 'firewall', name: 'Windows Firewall', command: 'start firewall.cpl', icon: '🔥', category: 'Security' },

  // Modern Settings (Windows 10/11)
  { id: 'volume-mixer', name: 'Volume Settings', command: 'start ms-settings:sound', icon: '🔊', category: 'Settings' },
  { id: 'update', name: 'Windows Update', command: 'start ms-settings:windowsupdate', icon: '🔄', category: 'Settings' },
  { id: 'privacy', name: 'Privacy Settings', command: 'start ms-settings:privacy', icon: '🔒', category: 'Settings' },
  { id: 'accessibility', name: 'Accessibility Settings', command: 'start ms-settings:easeofaccess', icon: '♿', category: 'Settings' },
  { id: 'gaming', name: 'Gaming Settings', command: 'start ms-settings:gaming-gamebar', icon: '🎮', category: 'Settings' },
  { id: 'notifications', name: 'Notifications', command: 'start ms-settings:notifications', icon: '🔔', category: 'Settings' },
  { id: 'focus', name: 'Focus Assist', command: 'start ms-settings:quiethours', icon: '🎯', category: 'Settings' },
  { id: 'nightlight', name: 'Night Light', command: 'start ms-settings:nightlight', icon: '🌙', category: 'Settings' },
  { id: 'bluetooth', name: 'Bluetooth Settings', command: 'start ms-settings:bluetooth', icon: '📶', category: 'Settings' },
  { id: 'wifi', name: 'Wi-Fi Settings', command: 'start ms-settings:network-wifi', icon: '📡', category: 'Settings' },
  { id: 'storage', name: 'Storage Settings', command: 'start ms-settings:storagesense', icon: '💾', category: 'Settings' },
  { id: 'apps', name: 'Apps & Features', command: 'start ms-settings:appsfeatures', icon: '📱', category: 'Settings' },
  { id: 'defaults', name: 'Default Apps', command: 'start ms-settings:defaultapps', icon: '📋', category: 'Settings' },
  { id: 'language', name: 'Language Settings', command: 'start ms-settings:language', icon: '🌍', category: 'Settings' },
  { id: 'time', name: 'Time & Language', command: 'start ms-settings:dateandtime', icon: '🕐', category: 'Settings' },
  { id: 'region', name: 'Region Settings', command: 'start ms-settings:regionlanguage', icon: '🌎', category: 'Settings' },
  { id: 'search', name: 'Search Settings', command: 'start ms-settings:search', icon: '🔍', category: 'Settings' },
  { id: 'cortana', name: 'Cortana Settings', command: 'start ms-settings:cortana', icon: '🎤', category: 'Settings' },
  { id: 'speech', name: 'Speech Settings', command: 'start ms-settings:speech', icon: '🗣️', category: 'Settings' },
  { id: 'ink', name: 'Pen & Windows Ink', command: 'start ms-settings:pen', icon: '✏️', category: 'Settings' },
  { id: 'touch', name: 'Touch Settings', command: 'start ms-settings:devices-touch', icon: '👆', category: 'Settings' },
  { id: 'printers', name: 'Printers & Scanners', command: 'start ms-settings:printers', icon: '🖨️', category: 'Settings' },
  { id: 'scanners', name: 'Scanners & Cameras', command: 'start ms-settings:scanners', icon: '📷', category: 'Settings' },
  { id: 'phone', name: 'Phone Settings', command: 'start ms-settings:phone', icon: '📞', category: 'Settings' },
  { id: 'project', name: 'Project Settings', command: 'start ms-settings:project', icon: '📽️', category: 'Settings' },
  { id: 'multitask', name: 'Multitasking', command: 'start ms-settings:multitasking', icon: '🔄', category: 'Settings' },
  { id: 'tablet', name: 'Tablet Mode', command: 'start ms-settings:tabletmode', icon: '📱', category: 'Settings' },
];


const categories = [...new Set(powerActionsList.map(action => action.category)), 'Custom'];

function AdminPanel({ isOpen, onClose, onSave, config }) {
  const [powerActions, setPowerActions] = useState(config?.powerActions || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showQuickAccess, setShowQuickAccess] = useState(true);
  const [recentlyAdded, setRecentlyAdded] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customAction, setCustomAction] = useState({
    name: '',
    command: '',
    icon: '⚙️',
    category: 'Custom'
  });
  const [customActionError, setCustomActionError] = useState('');
  
  // Use ref to track powerActions to prevent stale closures
  const powerActionsRef = useRef(powerActions);
  powerActionsRef.current = powerActions;
  
  // Use ref to track if we've initialized from config
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    console.log('AdminPanel useEffect triggered:', { 
      hasConfig: !!config, 
      hasPowerActions: !!(config?.powerActions), 
      isOpen, 
      actionCount: config?.powerActions?.length || 0 
    });
    
    // Only initialize from config when the modal first opens and we haven't initialized yet
    if (config && config.powerActions && isOpen && !hasInitializedRef.current) {
      console.log('AdminPanel setting powerActions from config:', config.powerActions);
      setPowerActions(config.powerActions);
      hasInitializedRef.current = true;
      console.log('AdminPanel loaded with actions:', config.powerActions.length);
    }
    
    // Reset initialization flag when modal closes
    if (!isOpen) {
      hasInitializedRef.current = false;
    }
  }, [config, isOpen]);

  // Get custom actions from powerActions
  const customActions = powerActions.filter(action => action.category === 'Custom');
  
  // Combine built-in actions with custom actions
  const allActions = [...powerActionsList, ...customActions];
  
  const filteredActions = allActions.filter(action => {
    const matchesSearch = action.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         action.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || action.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddAction = (action) => {
    console.log('handleAddAction called with:', action.name);
    const currentActions = powerActionsRef.current;
    console.log('Current actions before adding:', currentActions.length, currentActions.map(a => a.name));
    
    // For built-in actions, check by ID. For custom actions, check by name to avoid duplicates
    const existingAction = action.category === 'Custom' 
      ? currentActions.find(pa => pa.name.toLowerCase() === action.name.toLowerCase())
      : currentActions.find(pa => pa.id === action.id);
    
    if (!existingAction) {
      const newPowerActions = [...currentActions, action];
      console.log('Setting new powerActions:', newPowerActions.length, newPowerActions.map(a => a.name));
      setPowerActions(newPowerActions);
      setRecentlyAdded(action.id);
      setNotificationMessage(`Added "${action.name}" to quick access menu`);
      setShowNotification(true);
      console.log('Added action:', action.name, 'Total actions:', newPowerActions.length, 'Actions:', newPowerActions.map(a => a.name));
      
      // Clear the highlight after 2 seconds
      setTimeout(() => {
        console.log('Clearing recentlyAdded highlight for:', action.id);
        setRecentlyAdded(null);
      }, 2000);
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
    } else {
      console.log('Action already exists:', action.name);
    }
  };

  const handleRemoveAction = (actionId) => {
    const currentActions = powerActionsRef.current;
    setPowerActions(currentActions.filter(pa => pa.id !== actionId));
  };

  const handleMoveAction = (fromIndex, toIndex) => {
    const currentActions = powerActionsRef.current;
    const newActions = [...currentActions];
    const [movedAction] = newActions.splice(fromIndex, 1);
    newActions.splice(toIndex, 0, movedAction);
    setPowerActions(newActions);
  };

  const handleSave = () => {
    const currentActions = powerActionsRef.current;
    console.log('AdminPanel handleSave called');
    console.log('Current actions in ref:', currentActions.length, currentActions.map(a => a.name));
    console.log('Current actions in state:', powerActions.length, powerActions.map(a => a.name));
    console.log('Calling onSave with:', { powerActions: currentActions });
    onSave({ powerActions: currentActions });
    onClose();
  };

  const handleQuickExecute = (action) => {
    if (window.api && window.api.executeCommand) {
      window.api.executeCommand(action.command);
    }
  };

  const handleAddCustomAction = () => {
    setCustomActionError('');
    
    if (!customAction.name.trim()) {
      setCustomActionError('Please enter a name for the action');
      return;
    }
    
    if (!customAction.command.trim()) {
      setCustomActionError('Please enter a command');
      return;
    }
    
    // Check if action with same name already exists
    const existingAction = powerActions.find(pa => pa.name.toLowerCase() === customAction.name.toLowerCase());
    if (existingAction) {
      setCustomActionError('An action with this name already exists');
      return;
    }
    
    // Create new custom action with unique ID
    const newCustomAction = {
      ...customAction,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: customAction.name.trim(),
      command: customAction.command.trim()
    };
    
    // Add to power actions
    const newPowerActions = [...powerActions, newCustomAction];
    setPowerActions(newPowerActions);
    
    // Reset form
    setCustomAction({
      name: '',
      command: '',
      icon: '⚙️',
      category: 'Custom'
    });
    setShowCustomForm(false);
    setCustomActionError('');
    
    // Show success notification
    setNotificationMessage(`Added custom action "${newCustomAction.name}"`);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleCustomActionChange = (field, value) => {
    setCustomAction(prev => ({ ...prev, [field]: value }));
    if (customActionError) setCustomActionError('');
  };

  const handleCancelCustomAction = () => {
    setCustomAction({
      name: '',
      command: '',
      icon: '⚙️',
      category: 'Custom'
    });
    setShowCustomForm(false);
    setCustomActionError('');
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      title="Admin Panel"
      onClose={onClose}
      maxWidth="800px"
      footerContent={({ handleClose }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Toggle
              checked={showQuickAccess}
              onChange={setShowQuickAccess}
              label="Show Quick Access"
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="cancel-button" onClick={handleClose}>Cancel</button>
            <button className="save-button" onClick={handleSave}>Save</button>
          </div>
        </div>
      )}
    >
      {/* Notification */}
      {showNotification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#4caf50',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 10000,
          animation: 'slideIn 0.3s ease-out'
        }}>
          {notificationMessage}
        </div>
      )}

      <div style={{ display: 'flex', gap: 20, height: '600px' }}>
        {/* Left Panel - Action Browser */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="wee-card" style={{ marginBottom: 16 }}>
            <div className="wee-card-header">
              <span className="wee-card-title">System Actions</span>
            </div>
            <div className="wee-card-separator" />
            <div className="wee-card-desc">
              Browse and add Windows system actions to your quick access menu.
            </div>
          </div>

          {/* Search and Category Filter */}
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              className="text-input"
              placeholder="Search actions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', marginBottom: 8 }}
            />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1.5px solid #ccc' }}
            >
              <option value="All">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Add Custom Action Button */}
          <div style={{ marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setShowCustomForm(true)}
              style={{
                width: '100%',
                background: '#0099ff',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 16px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#007acc';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#0099ff';
              }}
            >
              <span>➕</span>
              Add Custom Action
            </button>
          </div>

          {/* Custom Action Form */}
          {showCustomForm && (
            <div style={{ 
              marginBottom: 16, 
              padding: '16px', 
              border: '1px solid #ddd', 
              borderRadius: '8px',
              background: '#f9f9f9'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '12px', color: '#333' }}>
                Add Custom Action
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#666' }}>
                  Action Name *
                </label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="e.g., Time & Language Settings"
                  value={customAction.name}
                  onChange={e => handleCustomActionChange('name', e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#666' }}>
                  Command *
                </label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="e.g., start ms-settings:dateandtime"
                  value={customAction.command}
                  onChange={e => handleCustomActionChange('command', e.target.value)}
                  style={{ width: '100%' }}
                />
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Common commands: <code>start [program]</code>, <code>cmd /c [command]</code>, <code>powershell -Command [script]</code>
                </div>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#666' }}>
                  Icon
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['⚙️', '🕐', '🔧', '🎛️', '📁', '💻', '🔍', '⚡', '🎮', '🔊', '🌐', '🔒'].map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => handleCustomActionChange('icon', icon)}
                      style={{
                        fontSize: '20px',
                        padding: '8px',
                        border: customAction.icon === icon ? '2px solid #0099ff' : '1px solid #ccc',
                        borderRadius: '6px',
                        background: customAction.icon === icon ? '#e6f3ff' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              
              {customActionError && (
                <div style={{ 
                  color: '#dc3545', 
                  fontSize: '13px', 
                  marginBottom: '12px',
                  padding: '8px',
                  background: '#ffeaea',
                  borderRadius: '4px',
                  border: '1px solid #ffcccc'
                }}>
                  {customActionError}
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleAddCustomAction}
                  style={{
                    background: '#28a745',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#218838';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#28a745';
                  }}
                >
                  Add Action
                </button>
                <button
                  type="button"
                  onClick={handleCancelCustomAction}
                  style={{
                    background: '#6c757d',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#5a6268';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#6c757d';
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Actions List */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            border: '1px solid #ddd', 
            borderRadius: 8,
            padding: 8,
            maxHeight: '400px'
          }}>
            {filteredActions.map(action => {
              const isAdded = powerActions.find(pa => pa.id === action.id);
              const isRecentlyAdded = recentlyAdded === action.id;
              
              return (
                <div
                  key={action.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px',
                    margin: '4px 0',
                    background: isRecentlyAdded ? '#e8f5e8' : isAdded ? '#f0f8ff' : '#fff',
                    borderRadius: 6,
                    border: isRecentlyAdded ? '2px solid #4caf50' : isAdded ? '2px solid #0099ff' : '1px solid #e0e0e0',
                    cursor: isAdded ? 'default' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isAdded ? 0.7 : 1
                  }}
                  onClick={() => !isAdded && handleAddAction(action)}
                  onMouseEnter={e => {
                    if (!isAdded) {
                      e.currentTarget.style.background = '#e6f3ff';
                      e.currentTarget.style.border = '1.5px solid #0099ff';
                      e.currentTarget.style.boxShadow = '0 1.5px 6px #0099ff08';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isAdded) {
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.border = '1px solid #e0e0e0';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                <span style={{ fontSize: '20px' }}>{action.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500' }}>{action.name}</div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#666',
                    fontFamily: 'monospace'
                  }}>
                    {action.command}
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#999',
                    marginTop: '2px'
                  }}>
                    {action.category}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickExecute(action);
                  }}
                  style={{
                    background: '#0099ff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#007acc';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#0099ff';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  Run
                </button>
                {isAdded && (
                  <div style={{
                    background: '#4caf50',
                    color: '#fff',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '500'
                  }}>
                    Added
                  </div>
                )}
              </div>
            )})}
          </div>
        </div>

        {/* Right Panel - Quick Access */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="wee-card" style={{ marginBottom: 16 }}>
            <div className="wee-card-header">
              <span className="wee-card-title">Quick Access Menu</span>
            </div>
            <div className="wee-card-separator" />
            <div className="wee-card-desc">
              {showQuickAccess 
                ? "Actions that will appear in your quick access menu. Drag to reorder."
                : "Actions that will appear in your quick access menu. Drag to reorder."
              }
            </div>
          </div>

          <div style={{ 
            flex: 1, 
            border: '1px solid #ddd', 
            borderRadius: 8, 
            padding: 8,
            background: '#f9f9f9',
            overflowY: 'auto',
            maxHeight: '400px'
          }}>
            {powerActions.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#888', 
                padding: '40px 20px',
                fontStyle: 'italic'
              }}>
                No actions selected. Click on actions from the left panel to add them here.
              </div>
            ) : (
              powerActions.map((action, index) => (
                <div
                  key={action.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', index.toString());
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderTop = '2px solid #0099ff';
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.style.borderTop = 'none';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderTop = 'none';
                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    if (fromIndex !== index) {
                      handleMoveAction(fromIndex, index);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    margin: '4px 0',
                    background: '#fff',
                    borderRadius: 6,
                    border: '1px solid #e0e0e0',
                    cursor: 'grab',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#e6f3ff';
                    e.currentTarget.style.border = '1.5px solid #0099ff';
                    e.currentTarget.style.boxShadow = '0 1.5px 6px #0099ff08';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.border = '1px solid #e0e0e0';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{action.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500' }}>{action.name}</div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#666',
                      fontFamily: 'monospace'
                    }}>
                      {action.command}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAction(action.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc3545',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      fontSize: '16px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#ffeaea';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'none';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

export default AdminPanel; 