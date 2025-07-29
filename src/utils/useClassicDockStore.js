import { create } from 'zustand';

const useClassicDockStore = create((set, get) => ({
  // Classic Dock Button Configurations
  classicDockButtonConfigs: [
    {
      type: 'text',
      text: 'Wii',
      icon: null,
      actionType: 'none',
      action: '',
      useWiiGrayFilter: false,
      useAdaptiveColor: false,
      useGlowEffect: false,
      glowStrength: 20,
      useGlassEffect: false,
      glassOpacity: 0.18,
      glassBlur: 2.5,
      glassBorderOpacity: 0.5,
      glassShineOpacity: 0.7,
      textFont: 'default',
      adminMode: false,
      powerActions: []
    },
    {
      type: 'text',
      text: '',
      icon: null,
      actionType: 'none',
      action: '',
      useWiiGrayFilter: false,
      useAdaptiveColor: false,
      useGlowEffect: false,
      glowStrength: 20,
      useGlassEffect: false,
      glassOpacity: 0.18,
      glassBlur: 2.5,
      glassBorderOpacity: 0.5,
      glassShineOpacity: 0.7,
      textFont: 'default',
      adminMode: false,
      powerActions: []
    }
  ],

  // Accessory Button Configuration
  accessoryButtonConfig: {
    type: 'icon',
    text: '',
    icon: 'default',
    actionType: 'none',
    action: '',
    useWiiGrayFilter: false,
    useAdaptiveColor: false,
    useGlowEffect: false,
    glowStrength: 20,
    useGlassEffect: false,
    glassOpacity: 0.18,
    glassBlur: 2.5,
    glassBorderOpacity: 0.5,
    glassShineOpacity: 0.7,
    textFont: 'default',
    adminMode: false,
    powerActions: []
  },

  // Active button index for PrimaryActionsModal
  activeButtonIndex: null,

  // Actions
  setClassicDockButtonConfigs: (configs) => {
    set({ classicDockButtonConfigs: configs });
  },

  updateClassicDockButtonConfig: (index, config) => {
    const { classicDockButtonConfigs } = get();
    const updatedConfigs = [...classicDockButtonConfigs];
    updatedConfigs[index] = config;
    set({ classicDockButtonConfigs: updatedConfigs });
  },

  setAccessoryButtonConfig: (config) => {
    set({ accessoryButtonConfig: config });
  },

  setActiveButtonIndex: (index) => {
    set({ activeButtonIndex: index });
  },

  // Load configurations from settings
  loadConfigurations: (settings) => {
    if (settings.classicDockButtonConfigs) {
      set({ classicDockButtonConfigs: settings.classicDockButtonConfigs });
    }
    if (settings.accessoryButtonConfig) {
      set({ accessoryButtonConfig: settings.accessoryButtonConfig });
    }
  },

  // Get configurations for persistence
  getConfigurationsForPersistence: () => {
    const { classicDockButtonConfigs, accessoryButtonConfig } = get();
    return {
      classicDockButtonConfigs,
      accessoryButtonConfig
    };
  }
}));

export default useClassicDockStore; 