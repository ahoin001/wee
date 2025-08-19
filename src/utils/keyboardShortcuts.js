// Default keyboard shortcuts configuration
export const DEFAULT_SHORTCUTS = [
  {
    id: 'open-settings-modal',
    name: 'Open Settings',
    description: 'Open the main settings modal',
    defaultKey: 's',
    defaultModifier: 'ctrl',
    action: 'openSettingsModal',
    category: 'Navigation',
    icon: '⚙️'
  },
  {
    id: 'open-settings-channels-tab',
    name: 'Open Channels Settings',
    description: 'Open settings modal to channels tab',
    defaultKey: 'c',
    defaultModifier: 'ctrl',
    action: 'openSettingsModal',
    actionParams: { tab: 'channels' },
    category: 'Settings',
    icon: '📺'
  },
  {
    id: 'open-settings-wallpaper-tab',
    name: 'Open Wallpaper Settings',
    description: 'Open settings modal to wallpaper tab',
    defaultKey: 'w',
    defaultModifier: 'ctrl',
    action: 'openSettingsModal',
    actionParams: { tab: 'wallpaper' },
    category: 'Settings',
    icon: '🖼️'
  },
  {
    id: 'open-settings-sounds-tab',
    name: 'Open Sound Settings',
    description: 'Open settings modal to sounds tab',
    defaultKey: 'o',
    defaultModifier: 'ctrl',
    action: 'openSettingsModal',
    actionParams: { tab: 'sounds' },
    category: 'Settings',
    icon: '🔊'
  },
  {
    id: 'open-settings-dock-tab',
    name: 'Open Dock Settings',
    description: 'Open settings modal to dock tab',
    defaultKey: 'd',
    defaultModifier: 'ctrl',
    action: 'openSettingsModal',
    actionParams: { tab: 'dock' },
    category: 'Settings',
    icon: '⚓'
  },
  {
    id: 'open-settings-time-tab',
    name: 'Open Time Settings',
    description: 'Open settings modal to time tab',
    defaultKey: 't',
    defaultModifier: 'ctrl',
    action: 'openSettingsModal',
    actionParams: { tab: 'time' },
    category: 'Settings',
    icon: '🕐'
  },
  {
    id: 'open-settings-themes-tab',
    name: 'Open Themes Settings',
    description: 'Open settings modal to themes tab',
    defaultKey: 'p',
    defaultModifier: 'ctrl',
    action: 'openSettingsModal',
    actionParams: { tab: 'themes' },
    category: 'Settings',
    icon: '🎨'
  },
  {
    id: 'open-settings-shortcuts-tab',
    name: 'Open Shortcuts Settings',
    description: 'Open settings modal to shortcuts tab',
    defaultKey: 'k',
    defaultModifier: 'ctrl',
    action: 'openSettingsModal',
    actionParams: { tab: 'shortcuts' },
    category: 'Settings',
    icon: '⌨️'
  },
  {
    id: 'toggle-spotify-widget',
    name: 'Toggle Spotify Widget',
    description: 'Show or hide the Spotify floating widget',
    defaultKey: 'l',
    defaultModifier: 'ctrl',
    action: 'toggleSpotifyWidget',
    category: 'Widgets',
    icon: '🎵'
  },
  {
    id: 'toggle-system-info-widget',
    name: 'Toggle System Info Widget',
    description: 'Show or hide the system information floating widget',
    defaultKey: 'i',
    defaultModifier: 'ctrl',
    action: 'toggleSystemInfoWidget',
    category: 'Widgets',
    icon: '📊'
  },
  {
    id: 'toggle-admin-panel-widget',
    name: 'Toggle Admin Panel Widget',
    description: 'Show or hide the admin panel floating widget',
    defaultKey: 'a',
    defaultModifier: 'ctrl',
    action: 'toggleAdminPanelWidget',
    category: 'Widgets',
    icon: '🔧'
  },
  {
    id: 'toggle-performance-monitor',
    name: 'Toggle Performance Monitor',
    description: 'Show or hide the performance monitoring widget',
    defaultKey: 'm',
    defaultModifier: 'ctrl',
    action: 'togglePerformanceMonitor',
    category: 'Widgets',
    icon: '📈'
  },
  {
    id: 'next-page',
    name: 'Next Page',
    description: 'Navigate to next page of channels',
    defaultKey: 'arrowright',
    defaultModifier: 'none',
    action: 'nextPage',
    category: 'Navigation',
    icon: '➡️'
  },
  {
    id: 'prev-page',
    name: 'Previous Page',
    description: 'Navigate to previous page of channels',
    defaultKey: 'arrowleft',
    defaultModifier: 'none',
    action: 'prevPage',
    category: 'Navigation',
    icon: '⬅️'
  },
  {
    id: 'toggle-dock',
    name: 'Toggle Dock',
    description: 'Show or hide the dock/ribbon',
    defaultKey: 'b',
    defaultModifier: 'ctrl',
    action: 'toggleDock',
    category: 'Interface',
    icon: '📱'
  },
  {
    id: 'toggle-dark-mode',
    name: 'Toggle Dark Mode',
    description: 'Switch between light and dark themes',
    defaultKey: 'n',
    defaultModifier: 'ctrl',
    action: 'toggleDarkMode',
    category: 'Interface',
    icon: '🌙'
  },
  {
    id: 'toggle-custom-cursor',
    name: 'Toggle Custom Cursor',
    description: 'Enable/disable Wii-style custom cursor',
    defaultKey: 'u',
    defaultModifier: 'ctrl',
    action: 'toggleCustomCursor',
    category: 'Interface',
    icon: '👆'
  },
  {
    id: 'toggle-settings-menu',
    name: 'Toggle Settings Menu',
    description: 'Open or close the settings action menu',
    defaultKey: 'Escape',
    defaultModifier: 'none',
    action: 'toggleSettingsMenu',
    category: 'Navigation',
    icon: '⚙️'
  }
];

// Helper function to format shortcut display
export const formatShortcut = (shortcut) => {
  const { key, modifier } = shortcut;
  
  if (modifier === 'none') {
    return key;
  }
  
  const modifierText = modifier === 'ctrl' ? 'Ctrl' : 
                       modifier === 'alt' ? 'Alt' : 
                       modifier === 'shift' ? 'Shift' : 
                       modifier === 'meta' ? 'Meta' : '';
  
  return `${modifierText}+${key.toUpperCase()}`;
};

// Helper function to parse shortcut string
export const parseShortcut = (shortcutString) => {
  if (!shortcutString) return { key: '', modifier: 'none' };
  
  const parts = shortcutString.toLowerCase().split('+');
  
  if (parts.length === 1) {
    return { key: parts[0], modifier: 'none' };
  }
  
  const modifier = parts[0];
  const key = parts[1];
  
  return { key, modifier };
};

// Helper function to validate shortcut
export const validateShortcut = (shortcut) => {
  const { key, modifier } = shortcut;
  
  if (!key) return { valid: false, error: 'Key is required' };
  
  // Valid modifiers
  const validModifiers = ['none', 'ctrl', 'alt', 'shift', 'meta'];
  if (!validModifiers.includes(modifier)) {
    return { valid: false, error: 'Invalid modifier' };
  }
  
  // Valid keys (basic validation)
  const validKeys = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12',
    'escape', 'enter', 'space', 'tab', 'backspace', 'delete',
    'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
    'home', 'end', 'pageup', 'pagedown'
  ];
  
  if (!validKeys.includes(key.toLowerCase())) {
    return { valid: false, error: 'Invalid key' };
  }
  
  return { valid: true };
};

// Helper function to check for shortcut conflicts
export const checkShortcutConflict = (shortcut, existingShortcuts) => {
  const { key, modifier } = shortcut;
  
  const conflict = existingShortcuts.find(existing => 
    existing.id !== shortcut.id && 
    existing.key === key && 
    existing.modifier === modifier
  );
  
  if (conflict) {
    return { 
      hasConflict: true, 
      conflictingShortcut: conflict 
    };
  }
  
  return { hasConflict: false };
};

// Helper function to get shortcut categories
export const getShortcutCategories = () => {
  const categories = [...new Set(DEFAULT_SHORTCUTS.map(s => s.category))];
  return categories;
};

// Helper function to get shortcuts by category
export const getShortcutsByCategory = (shortcuts) => {
  // ✅ DATA LAYER: Add proper null/undefined checks
  if (!shortcuts || !Array.isArray(shortcuts)) {
    console.warn('getShortcutsByCategory: shortcuts is not a valid array:', shortcuts);
    return {};
  }
  
  const categories = getShortcutCategories();
  const grouped = {};
  
  categories.forEach(category => {
    grouped[category] = shortcuts.filter(s => s.category === category);
  });
  
  return grouped;
};

// Shortcut action handler
export const executeShortcutAction = (action, actionParams = {}) => {
  console.log('[ShortcutHandler] Executing action:', action, actionParams);
  
  switch (action) {
    case 'openSettingsModal':
      // Open settings modal with optional tab parameter
      if (window.openSettingsModal) {
        window.openSettingsModal(actionParams.tab);
      } else {
        console.warn('[ShortcutHandler] openSettingsModal function not available');
      }
      break;
      
    case 'toggleSpotifyWidget':
      // Toggle Spotify widget
      if (window.toggleSpotifyWidget) {
        window.toggleSpotifyWidget();
      } else {
        console.warn('[ShortcutHandler] toggleSpotifyWidget function not available');
      }
      break;
      
    case 'toggleSystemInfoWidget':
      // Toggle System Info widget
      if (window.toggleSystemInfoWidget) {
        window.toggleSystemInfoWidget();
      } else {
        console.warn('[ShortcutHandler] toggleSystemInfoWidget function not available');
      }
      break;
      
    case 'toggleAdminPanelWidget':
      // Toggle Admin Panel widget
      if (window.toggleAdminPanelWidget) {
        window.toggleAdminPanelWidget();
      } else {
        console.warn('[ShortcutHandler] toggleAdminPanelWidget function not available');
      }
      break;
      
    case 'togglePerformanceMonitor':
      // Toggle Performance Monitor widget
      if (window.togglePerformanceMonitor) {
        window.togglePerformanceMonitor();
      } else {
        console.warn('[ShortcutHandler] togglePerformanceMonitor function not available');
      }
      break;
      
    case 'nextPage':
      // Navigate to next page
      if (window.nextPage) {
        window.nextPage();
      } else {
        console.warn('[ShortcutHandler] nextPage function not available');
      }
      break;
      
    case 'prevPage':
      // Navigate to previous page
      if (window.prevPage) {
        window.prevPage();
      } else {
        console.warn('[ShortcutHandler] prevPage function not available');
      }
      break;
      
    case 'toggleDock':
      // Toggle dock visibility
      if (window.toggleDock) {
        window.toggleDock();
      } else {
        console.warn('[ShortcutHandler] toggleDock function not available');
      }
      break;
      
    case 'toggleDarkMode':
      // Toggle dark mode
      if (window.toggleDarkMode) {
        window.toggleDarkMode();
      } else {
        console.warn('[ShortcutHandler] toggleDarkMode function not available');
      }
      break;
      
    case 'toggleCustomCursor':
      // Toggle custom cursor
      if (window.toggleCustomCursor) {
        window.toggleCustomCursor();
      } else {
        console.warn('[ShortcutHandler] toggleCustomCursor function not available');
      }
      break;
      
    case 'toggleSettingsMenu':
      // Toggle settings action menu
      if (window.toggleSettingsMenu) {
        window.toggleSettingsMenu();
      } else {
        console.warn('[ShortcutHandler] toggleSettingsMenu function not available');
      }
      break;
      
    default:
      console.warn('[ShortcutHandler] Unknown action:', action);
  }
};

// Global shortcut handler that can be called from anywhere
export const handleGlobalShortcut = (key, modifier, shortcuts) => {
  if (!shortcuts || !Array.isArray(shortcuts)) {
    console.log('[ShortcutHandler] No shortcuts available');
    return false;
  }
  
  console.log('[ShortcutHandler] Looking for shortcut:', { key, modifier, totalShortcuts: shortcuts.length });
  
  // Find the shortcut that matches the key combination
  const shortcut = shortcuts.find(s => 
    s.enabled && 
    s.key === key && 
    s.modifier === modifier
  );
  
  if (shortcut) {
    console.log('[ShortcutHandler] Triggered shortcut:', shortcut.name);
    executeShortcutAction(shortcut.action, shortcut.actionParams);
    return true;
  }
  
  console.log('[ShortcutHandler] No matching shortcut found');
  return false;
};