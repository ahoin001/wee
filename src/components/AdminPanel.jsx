import React, { useState, useEffect, useRef, useCallback } from 'react';
import WBaseModal from './WBaseModal';
import Button from '../ui/WButton';
import WToggle from '../ui/WToggle';
import WInput from '../ui/WInput';
import WSelect from '../ui/WSelect';
import Card from '../ui/Card';
import ActionCommand from './ActionCommand';
import QuickAccessItem from './QuickAccessItem';

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
    // Only initialize from config when the modal first opens and we haven't initialized yet
    if (config && config.powerActions && isOpen && !hasInitializedRef.current) {
      setPowerActions(config.powerActions);
      hasInitializedRef.current = true;
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
    const currentActions = powerActionsRef.current;
    
    // For built-in actions, check by ID. For custom actions, check by name to avoid duplicates
    const existingAction = action.category === 'Custom' 
      ? currentActions.find(pa => pa.name.toLowerCase() === action.name.toLowerCase())
      : currentActions.find(pa => pa.id === action.id);
    
    if (!existingAction) {
      const newPowerActions = [...currentActions, action];
      setPowerActions(newPowerActions);
      setRecentlyAdded(action.id);
      setNotificationMessage(`Added "${action.name}" to quick access menu`);
      setShowNotification(true);
      
      // Clear the highlight after 2 seconds
      setTimeout(() => {
        setRecentlyAdded(null);
      }, 2000);
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
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

  const handleSave = useCallback(() => {
    const currentActions = powerActionsRef.current.map(action => ({
      ...action,
      enabled: action.enabled || false
    }));

    onSave(currentActions);
    onClose();
  }, [powerActionsRef.current, onSave, onClose]);

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
    <WBaseModal
      title="Admin Panel"
      onClose={onClose}
      maxWidth="1400px"
      footerContent={({ handleClose }) => (
        <div className="flex justify-between items-center">
          {/* <div className="flex items-center gap-3">
            <WToggle
              checked={showQuickAccess}
              onChange={setShowQuickAccess}
              label="Show Quick Access"
            />
          </div> */}
          <div className="flex gap-2.5">
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save</Button>
          </div>
        </div>
      )}
    >
      {/* Notification */}
      {showNotification && (
        <div className="fixed top-5 right-5 bg-green-500 text-white px-4 py-3 rounded-md shadow-lg z-[10000] animate-[slideIn_0.3s_ease-out]">
          {notificationMessage}
        </div>
      )}

      <div className="flex gap-5 h-[600px]">
        {/* Left Panel - Action Browser */}
        <div className="flex-1 flex flex-col">
          <Card 
            title="System Actions"
            separator
            desc="Browse and add Windows system actions to your quick access menu."
            className="mb-4"
          />

          {/* Search and Category Filter */}
          <div className="mb-4 space-y-3">
            <WInput
              placeholder="Search actions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <WSelect
              placeholder="All Categories"
              options={[
                { value: 'All', label: 'All Categories' },
                ...categories.map(category => ({ value: category, label: category }))
              ]}
              value={selectedCategory}
              onChange={setSelectedCategory}
            />
          </div>

          {/* Add Custom Action Button */}
          <div className="mb-4">
            <Button
              variant="primary"
              onClick={() => setShowCustomForm(true)}
              fullWidth
            >
              <span>➕</span>
              Add Custom Action
            </Button>
          </div>

          {/* Custom Action Form */}
          {showCustomForm && (
            <div className="mb-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
              <div className="font-semibold mb-3 text-gray-800">
                Add Custom Action
              </div>
              
              <div className="mb-3">
                <WInput
                  label="Action Name"
                  placeholder="e.g., Time & Language Settings"
                  value={customAction.name}
                  onChange={e => handleCustomActionChange('name', e.target.value)}
                  required
                />
              </div>
              
              <div className="mb-3">
                <WInput
                  label="Command"
                  placeholder="e.g., start ms-settings:dateandtime"
                  value={customAction.command}
                  onChange={e => handleCustomActionChange('command', e.target.value)}
                  required
                />
                <div className="text-xs text-gray-600 mt-1">
                  Common commands: <code>start [program]</code>, <code>cmd /c [command]</code>, <code>powershell -Command [script]</code>
                </div>
              </div>
              
              <div className="mb-3">
                <label className="block text-sm mb-1 text-gray-600">
                  Icon
                </label>
                <div className="flex gap-2 flex-wrap">
                  {['⚙️', '🕐', '🔧', '🎛️', '📁', '💻', '🔍', '⚡', '🎮', '🔊', '🌐', '🔒'].map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => handleCustomActionChange('icon', icon)}
                                              className={`text-xl p-2 rounded-md cursor-pointer transition-all duration-200 ${
                          customAction.icon === icon 
                            ? 'border-2 border-blue-500 bg-blue-50' 
                            : 'border border-gray-300 bg-white'
                        }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              
              {customActionError && (
                                <div className="text-red-600 text-sm mb-3 p-2 bg-red-50 rounded border border-red-200">
                  {customActionError}
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddCustomAction}
                  className="bg-green-600 hover:bg-green-700 text-white border-none rounded px-4 py-2 text-sm cursor-pointer font-medium transition-colors duration-200"
                >
                  Add Action
                </button>
                <button
                  type="button"
                  onClick={handleCancelCustomAction}
                  className="bg-gray-500 hover:bg-gray-600 text-white border-none rounded px-4 py-2 text-sm cursor-pointer transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Actions List */}
          <div className="flex-1 overflow-y-auto border border-gray-300 rounded-lg p-2 max-h-[400px]">
            {filteredActions.map(action => {
              const isAdded = powerActions.find(pa => pa.id === action.id);
              const isRecentlyAdded = recentlyAdded === action.id;
              
              return (
                <ActionCommand
                  key={action.id}
                  action={action}
                  isAdded={isAdded}
                  isRecentlyAdded={isRecentlyAdded}
                  onAdd={handleAddAction}
                  onQuickExecute={handleQuickExecute}
                />
              );
            })}
          </div>
        </div>

        {/* Right Panel - Quick Access */}
        <div className="flex-1 flex flex-col">
          <Card 
            title="Quick Access Menu"
            separator
            desc="Actions that will appear in your quick access menu. Drag to reorder."
            className="mb-4"
          />

          <div className="flex-1 border border-[hsl(var(--border-primary))] rounded-lg p-2 bg-[hsl(var(--surface-secondary))] overflow-y-auto max-h-[400px]">
            {powerActions.length === 0 ? (
              <div className="text-center text-[hsl(var(--text-tertiary))] py-10 px-5 italic">
                No actions selected. Click on actions from the left panel to add them here.
              </div>
            ) : (
              powerActions.map((action, index) => (
                <QuickAccessItem
                  key={action.id}
                  action={action}
                  index={index}
                  onRemove={handleRemoveAction}
                  onMoveAction={handleMoveAction}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </WBaseModal>
  );
}

export default AdminPanel; 