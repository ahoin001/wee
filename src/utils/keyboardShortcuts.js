// Default keyboard shortcuts configuration
export const DEFAULT_SHORTCUTS = [
  {
    id: 'open-app-shortcuts-modal',
    name: 'Open App Shortcuts Modal',
    description: 'Open the app shortcuts management modal',
    defaultKey: 'a',
    defaultModifier: 'ctrl',
    action: 'openAppShortcutsModal',
    category: 'Modals',
    icon: '📱'
  },
  {
    id: 'open-channel-settings-modal',
    name: 'Open Channel Settings Modal',
    description: 'Open the channel settings modal',
    defaultKey: 'v',
    defaultModifier: 'ctrl',
    action: 'openChannelSettingsModal',
    category: 'Modals',
    icon: '⚙️'
  },
  {
    id: 'open-general-settings-modal',
    name: 'Open General Settings Modal',
    description: 'Open the general settings modal',
    defaultKey: '',
    defaultModifier: 'none',
    action: 'openGeneralSettingsModal',
    category: 'Modals',
    icon: '⚙️'
  },
  {
    id: 'open-presets-modal',
    name: 'Open Presets Modal',
    description: 'Open the presets management modal',
    defaultKey: 'p',
    defaultModifier: 'ctrl',
    action: 'openPresetsModal',
    category: 'Modals',
    icon: '🎨'
  },
  {
    id: 'open-primary-actions-modal',
    name: 'Open Primary Actions Modal',
    description: 'Open the primary actions configuration modal',
    defaultKey: '',
    defaultModifier: 'none',
    action: 'openPrimaryActionsModal',
    category: 'Modals',
    icon: '⚙️'
  },
  {
    id: 'open-ribbon-settings-modal',
    name: 'Open Ribbon Settings Modal',
    description: 'Open the ribbon customization settings modal',
    defaultKey: '',
    defaultModifier: 'none',
    action: 'openRibbonSettingsModal',
    category: 'Modals',
    icon: '🎨'
  },
  {
    id: 'open-sound-modal',
    name: 'Open Sound Modal',
    description: 'Open the sound settings modal',
    defaultKey: 's',
    defaultModifier: 'ctrl',
    action: 'openSoundModal',
    category: 'Modals',
    icon: '🔊'
  },
  {
    id: 'open-time-settings-modal',
    name: 'Open Time Settings Modal',
    description: 'Open the time and date settings modal',
    defaultKey: '',
    defaultModifier: 'none',
    action: 'openTimeSettingsModal',
    category: 'Modals',
    icon: '🕐'
  },
  {
    id: 'open-update-modal',
    name: 'Open Update Modal',
    description: 'Open the app update modal',
    defaultKey: '',
    defaultModifier: 'none',
    action: 'openUpdateModal',
    category: 'Modals',
    icon: '🔄'
  },
  {
    id: 'open-wallpaper-modal',
    name: 'Open Wallpaper Modal',
    description: 'Open the wallpaper settings modal',
    defaultKey: 'w',
    defaultModifier: 'ctrl',
    action: 'openWallpaperModal',
    category: 'Modals',
    icon: '🖼️'
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
    id: 'toggle-settings-menu',
    name: 'Toggle Settings Menu',
    description: 'Open or close the settings menu',
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
  const categories = getShortcutCategories();
  const grouped = {};
  
  categories.forEach(category => {
    grouped[category] = shortcuts.filter(s => s.category === category);
  });
  
  return grouped;
};