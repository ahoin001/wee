import React, { useState, useCallback, useEffect } from 'react';
import Card from '../../ui/Card';
import WToggle from '../../ui/WToggle';
import Slider from '../../ui/Slider';
import Text from '../../ui/Text';
import WButton from '../../ui/WButton';
import WSelect from '../../ui/WSelect';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';

// Add CSS for pulse animation
const pulseAnimation = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

// Theme groups for Classic Dock
const THEME_GROUPS = {
  classic: {
    name: 'Classic & Modern Themes',
    description: 'Original Wii, gaming-inspired, and contemporary themes',
    themes: {
      default: {
        name: 'Default Wii',
        description: 'Classic Wii dock colors',
        colors: {
          dockBaseGradientStart: '#BDBEC2',
          dockBaseGradientEnd: '#DADDE6',
          dockAccentColor: '#33BEED',
          sdCardBodyColor: '#B9E1F2',
          sdCardBorderColor: '#33BEED',
          sdCardLabelColor: 'white',
          sdCardLabelBorderColor: '#F4F0EE',
          sdCardBottomColor: '#31BEED',
          leftPodBaseColor: '#D2D3DA',
          leftPodAccentColor: '#B6B6BB',
          leftPodDetailColor: '#D7D8DA',
          rightPodBaseColor: '#DCDCDF',
          rightPodAccentColor: '#E4E4E4',
          rightPodDetailColor: '#B6B6BB',
          buttonBorderColor: '#22BEF3',
          buttonGradientStart: '#E0DCDC',
          buttonGradientEnd: '#CBCBCB',
          buttonIconColor: '#979796',
          rightButtonIconColor: '#A4A4A4',
          buttonHighlightColor: 'rgba(255, 255, 255, 0.5)',
        }
      },
      chrome: {
        name: 'Monochrome',
        description: 'Monochrome effect',
        colors: {
          dockBaseGradientStart: '#e5e7eb',
          dockBaseGradientEnd: '#d1d5db',
          dockAccentColor: '#4b5563',
          buttonBorderColor: '#6b7280',
          buttonGradientStart: '#ffffff',
          buttonGradientEnd: '#f9fafb',
          buttonIconColor: '#1f2937',
          buttonHighlightColor: 'rgba(255, 255, 255, 0.6)',
          leftPodBaseColor: '#f3f4f6',
          leftPodAccentColor: '#5A5A82',
          leftPodDetailColor: '#424268',
          rightButtonIconColor: '#00FFFF',
          rightPodBaseColor: '#f9fafb',
          rightPodAccentColor: '#5A5A82',
          rightPodDetailColor: '#424268',
          sdCardBodyColor: '#f3f4f6',
          sdCardBorderColor: '#9ca3af',
          sdCardLabelColor: '#374151',
          sdCardLabelBorderColor: '#e5e7eb',
          sdCardBottomColor: '#6b7280',
        }
      },
      cyberpunk: {
        name: 'Cyberpunk',
        description: 'Cyberpunk esque effect',
        colors: {
          dockBaseGradientStart: '#2C2C40',
          dockBaseGradientEnd: '#1a1a2e',
          dockAccentColor: '#FF00FF',
          sdCardBodyColor: '#1a1a2e',
          sdCardBorderColor: '#00FFFF',
          sdCardLabelColor: '#00FFFF',
          sdCardLabelBorderColor: '#424268',
          sdCardBottomColor: '#00FFFF',
          leftPodBaseColor: '#33334F',
          leftPodAccentColor: '#5A5A82',
          leftPodDetailColor: '#424268',
          rightPodBaseColor: '#33334F',
          rightPodAccentColor: '#5A5A82',
          rightPodDetailColor: '#424268',
          buttonBorderColor: '#00FFFF',
          buttonGradientStart: '#1a1a2e',
          buttonGradientEnd: '#1a1a2e',
          buttonIconColor: '#00FFFF',
          rightButtonIconColor: '#00FFFF',
          buttonHighlightColor: 'rgba(255, 0, 255, 0.4)',
        }
      },
      dark: {
        name: 'Dark Mode',
        description: 'Modern dark theme',
        colors: {
          dockBaseGradientStart: 'rgba(10,10,10,255)',
          dockBaseGradientEnd: 'rgba(20,20,20,255)',
          dockAccentColor: 'rgba(51,185,234,255)',
          sdCardBodyColor: 'rgba(15,15,15,255)',
          sdCardBorderColor: 'rgba(51,185,234,255)',
          sdCardLabelColor: 'rgba(25,25,25,255)',
          sdCardLabelBorderColor: 'rgba(30,30,30,255)',
          sdCardBottomColor: 'rgba(51,185,234,255)',
          leftPodBaseColor: 'rgba(18,18,18,255)',
          leftPodAccentColor: 'rgba(25,25,25,255)',
          leftPodDetailColor: 'rgba(22,22,22,255)',
          rightPodBaseColor: 'rgba(18,18,18,255)',
          rightPodAccentColor: 'rgba(25,25,25,255)',
          rightPodDetailColor: 'rgba(22,22,22,255)',
          buttonBorderColor: 'rgba(51,185,234,255)',
          buttonGradientStart: 'rgba(33,33,33,255)',
          buttonGradientEnd: 'rgba(28,28,28,255)',
          buttonIconColor: 'rgba(38,39,38,255)',
          rightButtonIconColor: 'rgba(38,39,38,255)',
          buttonHighlightColor: 'rgba(51,185,234,255)',
        }
      }
    }
  },
  games: {
    name: 'Gamer Collection',
    description: 'Some gamer type themes',
    themes: {
      kingdomHearts: {
        name: 'Kingdom Hearts',
        description: 'Kingdom Hearts franchise theme',
        colors: {
          dockBaseGradientStart: '#0f172a',
          dockBaseGradientEnd: '#020617',
          dockAccentColor: '#facc15',
          sdCardBodyColor: '#334155',
          sdCardBorderColor: '#facc15',
          sdCardLabelColor: '#fefce8',
          sdCardLabelBorderColor: '#64748b',
          sdCardBottomColor: '#ca8a04',
          leftPodBaseColor: '#1e293b',
          leftPodAccentColor: '#475569',
          leftPodDetailColor: '#334155',
          rightPodBaseColor: '#1e293b',
          rightPodAccentColor: '#475569',
          rightPodDetailColor: '#334155',
          buttonBorderColor: '#fde047',
          buttonGradientStart: '#475569',
          buttonGradientEnd: '#1e293b',
          buttonIconColor: '#fde047',
          rightButtonIconColor: '#fde047',
          buttonHighlightColor: 'rgba(250, 204, 21, 0.3)',
        }
      },
      zelda: {
        name: 'Zelda Green',
        description: 'Zelda Green theme',
        colors: {
          dockBaseGradientStart: '#14532d',
          dockBaseGradientEnd: '#052e16',
          dockAccentColor: '#fde047',
          sdCardBodyColor: '#bbf7d0',
          sdCardBorderColor: '#ca8a04',
          sdCardLabelColor: '#14532d',
          sdCardLabelBorderColor: '#d9f99d',
          sdCardBottomColor: '#84cc16',
          leftPodBaseColor: '#4d7c0f',
          leftPodAccentColor: '#059669',
          leftPodDetailColor: '#065F46',
          rightPodBaseColor: '#4d7c0f',
          rightPodAccentColor: '#059669',
          rightPodDetailColor: '#065F46',
          buttonBorderColor: '#ca8a04',
          buttonGradientStart: '#fefce8',
          buttonGradientEnd: '#fef9c3',
          buttonIconColor: '#166534',
          rightButtonIconColor: '#34D399',
          buttonHighlightColor: 'rgba(254, 252, 232, 0.6)',
        }
      }
    }
  }
};

// Sub-tab configuration
const SUB_TABS = [
  {
    id: 'dock-type',
    label: 'Dock Type',
    icon: '⚓',
    description: 'Choose between Classic and Ribbon docks'
  },
  {
    id: 'classic-dock',
    label: 'Classic Dock',
    icon: '🎮',
    description: 'Customize the Classic Wii Dock appearance'
  },
  {
    id: 'wii-ribbon',
    label: 'Wii Ribbon',
    icon: '🎗️',
    description: 'Customize the Wii Ribbon appearance'
  },
  {
    id: 'animations',
    label: 'Animations',
    icon: '✨',
    description: 'Particle effects and shared animations'
  }
];

const UnifiedDockSettingsTab = React.memo(() => {
  // Use consolidated store for better performance and consistency
  const { dock, ribbon, ui } = useConsolidatedAppStore();
  const { setDockState, setRibbonState, setUIState } = useConsolidatedAppStore(state => state.actions);
  
  // Utility function to save settings to new architecture
  const saveSetting = useCallback(async (category, key, value) => {
    try {
      console.log(`[UnifiedDockSettingsTab] saveSetting called with: ${category}.${key} = ${value}`);
      
      // Update consolidated store
      if (category === 'dock') {
        setDockState({ [key]: value });
      } else if (category === 'ribbon') {
        setRibbonState({ [key]: value });
      } else if (category === 'ui') {
        setUIState({ [key]: value });
      }
      
      // Save to backend for persistence
      if (window.api?.data?.set) {
        await window.api.data.set(`settings.${category}.${key}`, value);
        console.log(`[UnifiedDockSettingsTab] ✅ Successfully saved setting to backend: ${category}.${key} = ${value}`);
      }
      
    } catch (error) {
      console.error(`[UnifiedDockSettingsTab] Failed to save ${category}.${key} setting:`, error);
    }
  }, [setDockState, setRibbonState, setUIState]);
  
  // Local state for sub-tabs and expanded groups
  const [activeSubTab, setActiveSubTab] = useState(() => {
    console.log('[UnifiedDockSettingsTab] Initializing with ui state:', {
      dockSubTab: ui?.dockSubTab,
      classicMode: ui?.classicMode
    });
    
    // Use dockSubTab from UI state if available, otherwise fall back to dock mode
    if (ui?.dockSubTab) {
      console.log('[UnifiedDockSettingsTab] Using dockSubTab from UI state:', ui.dockSubTab);
      return ui.dockSubTab;
    }
    // Automatically set the appropriate sub-tab based on current dock mode
    const fallbackTab = ui?.classicMode ? 'classic-dock' : 'wii-ribbon';
    console.log('[UnifiedDockSettingsTab] Using fallback tab based on classicMode:', fallbackTab);
    return fallbackTab;
  });
  const [expandedGroups, setExpandedGroups] = useState({
    classic: true,
    games: false
  });

  // Clear dockSubTab after component mounts to allow manual tab switching
  React.useEffect(() => {
    console.log('[UnifiedDockSettingsTab] useEffect triggered with ui?.dockSubTab:', ui?.dockSubTab);
    if (ui?.dockSubTab) {
      console.log('[UnifiedDockSettingsTab] Clearing dockSubTab after 100ms delay');
      // Clear the dockSubTab after a short delay to allow the initial tab to be set
      const timer = setTimeout(() => {
        console.log('[UnifiedDockSettingsTab] Clearing dockSubTab now');
        saveSetting('ui', 'dockSubTab', undefined);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [ui?.dockSubTab, saveSetting]);

  // Dock type selection
  const handleDockTypeChange = useCallback((dockType) => {
    saveSetting('ui', 'classicMode', dockType === 'classic');
  }, [saveSetting]);

  // Classic Dock handlers
  const applyTheme = useCallback((themePath) => {
    const [groupKey, themeKey] = themePath.split('.');
    const group = THEME_GROUPS[groupKey];
    const theme = group?.themes[themeKey];
    if (theme) {
      // Update consolidated store with theme colors
      setDockState(theme.colors);
      
      // Save all theme colors to backend
      Object.entries(theme.colors).forEach(([key, value]) => {
        saveSetting('dock', key, value);
      });
    }
  }, [saveSetting, setDockState]);

  const getCurrentTheme = useCallback(() => {
    for (const [groupKey, group] of Object.entries(THEME_GROUPS)) {
      for (const [themeKey, theme] of Object.entries(group.themes)) {
        const themePath = `${groupKey}.${themeKey}`;
        const colors = theme.colors;
        
        if (
          colors.dockBaseGradientStart === dock?.dockBaseGradientStart &&
          colors.dockBaseGradientEnd === dock?.dockBaseGradientEnd &&
          colors.dockAccentColor === dock?.dockAccentColor &&
          colors.sdCardBodyColor === dock?.sdCardBodyColor &&
          colors.sdCardBorderColor === dock?.sdCardBorderColor &&
          colors.sdCardLabelColor === dock?.sdCardLabelColor &&
          colors.sdCardLabelBorderColor === dock?.sdCardLabelBorderColor &&
          colors.sdCardBottomColor === dock?.sdCardBottomColor &&
          colors.leftPodBaseColor === dock?.leftPodBaseColor &&
          colors.leftPodAccentColor === dock?.leftPodAccentColor &&
          colors.leftPodDetailColor === dock?.leftPodDetailColor &&
          colors.rightPodBaseColor === dock?.rightPodBaseColor &&
          colors.rightPodAccentColor === dock?.rightPodAccentColor &&
          colors.rightPodDetailColor === dock?.rightPodDetailColor &&
          colors.buttonBorderColor === dock?.buttonBorderColor &&
          colors.buttonGradientStart === dock?.buttonGradientStart &&
          colors.buttonGradientEnd === dock?.buttonGradientEnd &&
          colors.buttonIconColor === dock?.buttonIconColor &&
          colors.rightButtonIconColor === dock?.rightButtonIconColor &&
          colors.buttonHighlightColor === dock?.buttonHighlightColor
        ) {
          return themePath;
        }
      }
    }
    return null;
  }, [dock]);

  const handleColorChange = useCallback((key, value) => {
    setDockState({ [key]: value });
    saveSetting('dock', key, value);
  }, [saveSetting, setDockState]);

  // Ribbon handlers
  const handleRibbonColorChange = useCallback((e) => {
    setRibbonState({ ribbonColor: e.target.value });
    saveSetting('ribbon', 'ribbonColor', e.target.value);
  }, [saveSetting, setRibbonState]);

  const handleRibbonGlowColorChange = useCallback((e) => {
    setRibbonState({ ribbonGlowColor: e.target.value });
    saveSetting('ribbon', 'ribbonGlowColor', e.target.value);
  }, [saveSetting, setRibbonState]);

  const handleRibbonGlowStrengthChange = useCallback((value) => {
    setRibbonState({ ribbonGlowStrength: value });
    saveSetting('ribbon', 'ribbonGlowStrength', value);
  }, [saveSetting, setRibbonState]);

  const handleRibbonGlowStrengthHoverChange = useCallback((value) => {
    setRibbonState({ ribbonGlowStrengthHover: value });
    saveSetting('ribbon', 'ribbonGlowStrengthHover', value);
  }, [saveSetting, setRibbonState]);

  const handleRibbonDockOpacityChange = useCallback((value) => {
    setRibbonState({ ribbonDockOpacity: value });
    saveSetting('ribbon', 'ribbonDockOpacity', value);
  }, [saveSetting, setRibbonState]);

  const handleGlassWiiRibbonChange = useCallback((checked) => {
    setRibbonState({ glassWiiRibbon: checked });
    saveSetting('ribbon', 'glassWiiRibbon', checked);
  }, [saveSetting, setRibbonState]);

  const handleGlassOpacityChange = useCallback((value) => {
    setRibbonState({ glassOpacity: value });
    saveSetting('ribbon', 'glassOpacity', value);
  }, [saveSetting, setRibbonState]);

  const handleGlassBlurChange = useCallback((value) => {
    setRibbonState({ glassBlur: value });
    saveSetting('ribbon', 'glassBlur', value);
  }, [saveSetting, setRibbonState]);

  const handleGlassBorderOpacityChange = useCallback((value) => {
    setRibbonState({ glassBorderOpacity: value });
    saveSetting('ribbon', 'glassBorderOpacity', value);
  }, [saveSetting, setRibbonState]);

  const handleGlassShineOpacityChange = useCallback((value) => {
    setRibbonState({ glassShineOpacity: value });
    saveSetting('ribbon', 'glassShineOpacity', value);
  }, [saveSetting, setRibbonState]);

  // Animation handlers
  const handleParticleEnabledChange = useCallback((checked) => {
    console.log('[UnifiedDockSettingsTab] 🎯 Particle system enabled changed to:', checked);
    setDockState({ particleSystemEnabled: checked });
    saveSetting('dock', 'particleSystemEnabled', checked);
    console.log('[UnifiedDockSettingsTab] ✅ Particle system setting saved');
  }, [saveSetting, setDockState]);

  const handleParticleEffectTypeChange = useCallback((value) => {
    setDockState({ particleEffectType: value });
    saveSetting('dock', 'particleEffectType', value);
  }, [saveSetting, setDockState]);

  const handleParticleDirectionChange = useCallback((value) => {
    setDockState({ particleDirection: value });
    saveSetting('dock', 'particleDirection', value);
  }, [saveSetting, setDockState]);

  const handleParticleCountChange = useCallback((value) => {
    setDockState({ particleCount: value });
    saveSetting('dock', 'particleCount', value);
  }, [saveSetting, setDockState]);

  const handleParticleSpeedChange = useCallback((value) => {
    setDockState({ particleSpeed: value });
    saveSetting('dock', 'particleSpeed', value);
  }, [saveSetting, setDockState]);

  const handleParticleSizeChange = useCallback((value) => {
    setDockState({ particleSize: value });
    saveSetting('dock', 'particleSize', value);
  }, [saveSetting, setDockState]);

  const handleParticleGravityChange = useCallback((value) => {
    setDockState({ particleGravity: value });
    saveSetting('dock', 'particleGravity', value);
  }, [saveSetting, setDockState]);

  const handleParticleFadeSpeedChange = useCallback((value) => {
    setDockState({ particleFadeSpeed: value });
    saveSetting('dock', 'particleFadeSpeed', value);
  }, [saveSetting, setDockState]);

  const handleParticleUseAdaptiveColorChange = useCallback((checked) => {
    setDockState({ particleUseAdaptiveColor: checked });
    saveSetting('dock', 'particleUseAdaptiveColor', checked);
  }, [saveSetting, setDockState]);

  const handleParticleColorIntensityChange = useCallback((value) => {
    setDockState({ particleColorIntensity: value });
    saveSetting('dock', 'particleColorIntensity', value);
  }, [saveSetting, setDockState]);

  const handleParticleColorVariationChange = useCallback((value) => {
    setDockState({ particleColorVariation: value });
    saveSetting('dock', 'particleColorVariation', value);
  }, [saveSetting, setDockState]);

  const handleParticleRotationSpeedChange = useCallback((value) => {
    setDockState({ particleRotationSpeed: value });
    saveSetting('dock', 'particleRotationSpeed', value);
  }, [saveSetting, setDockState]);

  const handleParticleLifetimeChange = useCallback((value) => {
    setDockState({ particleLifetime: value });
    saveSetting('dock', 'particleLifetime', value);
  }, [saveSetting, setDockState]);

  // Render sub-tab content
  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'dock-type':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Text variant="h3" style={{ color: 'hsl(var(--text-primary))', marginBottom: '16px' }}>
              Choose Your Dock Type
            </Text>
            <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '24px' }}>
              Select between the Classic Wii Dock or the modern Wii Ribbon. Each has its own customization options.
            </Text>
            
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              {/* Classic Dock Option */}
              <Card>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎮</div>
                  <Text variant="h4" style={{ color: 'hsl(var(--text-primary))', marginBottom: '8px' }}>
                    Classic Wii Dock
                  </Text>
                  <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '16px' }}>
                    Authentic Wii-style dock with SD card slot and button pods. Perfect for nostalgia and classic gaming themes.
                  </Text>
                  <WButton
                    variant={ui.classicMode ? 'primary' : 'secondary'}
                    onClick={() => handleDockTypeChange('classic')}
                    style={{ width: '100%' }}
                  >
                    {ui.classicMode ? '✓ Selected' : 'Select Classic Dock'}
                  </WButton>
                </div>
              </Card>

              {/* Wii Ribbon Option */}
              <Card>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎗️</div>
                  <Text variant="h4" style={{ color: 'hsl(var(--text-primary))', marginBottom: '8px' }}>
                    Wii Ribbon
                  </Text>
                  <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '16px' }}>
                    Modern ribbon-style dock with glass effects and customizable buttons. Great for contemporary themes.
                  </Text>
                  <WButton
                    variant={!ui.classicMode ? 'primary' : 'secondary'}
                    onClick={() => handleDockTypeChange('ribbon')}
                    style={{ width: '100%' }}
                  >
                    {!ui.classicMode ? '✓ Selected' : 'Select Wii Ribbon'}
                  </WButton>
                </div>
              </Card>
            </div>
          </div>
        );

      case 'classic-dock':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Text variant="h3" style={{ color: 'hsl(var(--text-primary))', marginBottom: '16px' }}>
              Classic Dock Customization
            </Text>
            <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '16px' }}>
              Customize the appearance of the Classic Wii Dock including colors, themes, glass effects, and sizing.
            </Text>

            {/* Preset Themes */}
            <Card>
              <div style={{ padding: '20px' }}>
                <Text variant="h4" style={{ color: 'hsl(var(--text-primary))', marginBottom: '16px' }}>
                  Preset Themes
                </Text>
                <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '16px' }}>
                  Choose from pre-made themes or customize your own.
                </Text>
                
                {Object.entries(THEME_GROUPS).map(([groupKey, group]) => (
                  <div key={groupKey} style={{ marginBottom: '20px' }}>
                    <div
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        padding: '8px 0'
                      }}
                      onClick={() => setExpandedGroups(prev => ({
                        ...prev,
                        [groupKey]: !prev[groupKey]
                      }))}
                    >
                      <div>
                        <Text variant="h5" style={{ color: 'hsl(var(--text-primary))', marginBottom: '4px' }}>
                          {group.name}
                        </Text>
                        <Text variant="caption" style={{ color: 'hsl(var(--text-secondary))' }}>
                          {group.description}
                        </Text>
                      </div>
                      <div style={{ 
                        transform: expandedGroups[groupKey] ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }}>
                        ▼
                      </div>
                    </div>
                    
                    {expandedGroups[groupKey] && (
                      <div style={{ 
                        display: 'grid', 
                        gap: '12px', 
                        marginTop: '12px',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
                      }}>
                        {Object.entries(group.themes).map(([themeKey, theme]) => {
                          const themePath = `${groupKey}.${themeKey}`;
                          const isSelected = getCurrentTheme() === themePath;
                          
                          return (
                            <button
                              key={themeKey}
                              onClick={() => applyTheme(themePath)}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                textAlign: 'left',
                                padding: '12px',
                                borderRadius: '8px',
                                border: `2px solid ${isSelected ? '#0099ff' : '#e5e7eb'}`,
                                background: isSelected ? '#eff6ff' : 'white',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <Text variant="body" style={{ fontWeight: '600', color: 'hsl(var(--text-primary))' }}>
                                {theme.name}
                              </Text>
                              <Text variant="caption" style={{ color: 'hsl(var(--text-secondary))' }}>
                                {theme.description}
                              </Text>
                              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                <div style={{ 
                                  width: '16px', 
                                  height: '16px', 
                                  borderRadius: '50%', 
                                  border: '1px solid #e5e7eb',
                                  background: theme.colors.dockBaseGradientStart 
                                }} />
                                <div style={{ 
                                  width: '16px', 
                                  height: '16px', 
                                  borderRadius: '50%', 
                                  border: '1px solid #e5e7eb',
                                  background: theme.colors.dockAccentColor 
                                }} />
                                <div style={{ 
                                  width: '16px', 
                                  height: '16px', 
                                  borderRadius: '50%', 
                                  border: '1px solid #e5e7eb',
                                  background: theme.colors.buttonGradientStart 
                                }} />
                                <div style={{ 
                                  width: '16px', 
                                  height: '16px', 
                                  borderRadius: '50%', 
                                  border: '1px solid #e5e7eb',
                                  background: theme.colors.buttonIconColor 
                                }} />
                              </div>
                              {isSelected && (
                                <div style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  width: '16px',
                                  height: '16px',
                                  borderRadius: '50%',
                                  background: '#0099ff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '10px',
                                  fontWeight: 'bold'
                                }}>
                                  ✓
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Dock Base Colors */}
            <Card>
              <div style={{ padding: '20px' }}>
                <Text variant="h4" style={{ color: 'hsl(var(--text-primary))', marginBottom: '16px' }}>
                  Dock Base Colors
                </Text>
                <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '16px' }}>
                  Customize the main dock structure colors.
                </Text>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', minWidth: '140px' }}>
                      Gradient Start
                    </Text>
                    <input
                      type="color"
                      value={dock?.dockBaseGradientStart ?? '#BDBEC2'}
                      onChange={(e) => handleColorChange('dockBaseGradientStart', e.target.value)}
                      style={{
                        width: 50,
                        height: 40,
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer'
                      }}
                    />
                    <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))' }}>
                      {(dock?.dockBaseGradientStart ?? '#BDBEC2').toUpperCase()}
                    </Text>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', minWidth: '140px' }}>
                      Gradient End
                    </Text>
                    <input
                      type="color"
                      value={dock?.dockBaseGradientEnd ?? '#DADDE6'}
                      onChange={(e) => handleColorChange('dockBaseGradientEnd', e.target.value)}
                      style={{
                        width: 50,
                        height: 40,
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer'
                      }}
                    />
                    <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))' }}>
                      {(dock?.dockBaseGradientEnd ?? '#DADDE6').toUpperCase()}
                    </Text>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', minWidth: '140px' }}>
                      Accent Color
                    </Text>
                    <input
                      type="color"
                      value={dock?.dockAccentColor ?? '#33BEED'}
                      onChange={(e) => handleColorChange('dockAccentColor', e.target.value)}
                      style={{
                        width: 50,
                        height: 40,
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer'
                      }}
                    />
                    <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))' }}>
                      {(dock?.dockAccentColor ?? '#33BEED').toUpperCase()}
                    </Text>
                  </div>
                </div>
              </div>
            </Card>

            {/* Glass Effect */}
            <Card>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <Text variant="h4" style={{ color: 'hsl(var(--text-primary))', marginBottom: '8px' }}>
                      Glass Effect
                    </Text>
                    <Text variant="body" style={{ color: 'hsl(var(--text-secondary))' }}>
                      Apply a glass morphism effect to the dock.
                    </Text>
                  </div>
                  <WToggle
                    checked={dock?.glassEnabled ?? false}
                    onChange={(checked) => {
                      setDockState({ glassEnabled: checked });
                      saveSetting('dock', 'glassEnabled', checked);
                    }}
                  />
                </div>
                
                {dock?.glassEnabled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                        Glass Opacity
                      </Text>
                      <Slider
                        value={dock?.glassOpacity ?? 0.18}
                        min={0.05}
                        max={0.5}
                        step={0.01}
                        onChange={(value) => {
                          setDockState({ glassOpacity: value });
                          saveSetting('dock', 'glassOpacity', value);
                        }}
                      />
                      <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                        {Math.round((dock?.glassOpacity ?? 0.18) * 100)}%
                      </Text>
                    </div>
                    
                    <div>
                      <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                        Glass Blur
                      </Text>
                      <Slider
                        value={dock?.glassBlur ?? 2.5}
                        min={0.5}
                        max={8}
                        step={0.1}
                        onChange={(value) => {
                          setDockState({ glassBlur: value });
                          saveSetting('dock', 'glassBlur', value);
                        }}
                      />
                      <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                        {dock?.glassBlur ?? 2.5}px
                      </Text>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        );

      case 'wii-ribbon':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Text variant="h3" style={{ color: 'hsl(var(--text-primary))', marginBottom: '16px' }}>
              Wii Ribbon Customization
            </Text>
            <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '16px' }}>
              Customize the appearance of the Wii Ribbon including colors, glow effects, and glass morphism.
            </Text>

            {/* Ribbon Colors and Effects */}
            <Card>
              <div style={{ padding: '20px' }}>
                <Text variant="h4" style={{ color: 'hsl(var(--text-primary))', marginBottom: '16px' }}>
                  Ribbon Colors & Effects
                </Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', minWidth: '120px' }}>
                      Ribbon Color
                    </Text>
                    <input
                      type="color"
                      value={ribbon?.ribbonColor ?? '#e0e6ef'}
                      onChange={handleRibbonColorChange}
                      style={{
                        width: 50,
                        height: 40,
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer'
                      }}
                    />
                    <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))' }}>
                      {(ribbon?.ribbonColor ?? '#e0e6ef').toUpperCase()}
                    </Text>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', minWidth: '120px' }}>
                      Ribbon Glow Color
                    </Text>
                    <input
                      type="color"
                      value={ribbon?.ribbonGlowColor ?? '#0099ff'}
                      onChange={handleRibbonGlowColorChange}
                      style={{
                        width: 50,
                        height: 40,
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer'
                      }}
                    />
                    <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))' }}>
                      {(ribbon?.ribbonGlowColor ?? '#0099ff').toUpperCase()}
                    </Text>
                  </div>
                  
                  <div>
                    <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                      Glow Strength
                    </Text>
                    <Slider
                      value={ribbon?.ribbonGlowStrength ?? 20}
                      min={0}
                      max={50}
                      step={1}
                      onChange={handleRibbonGlowStrengthChange}
                    />
                    <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                      {ribbon?.ribbonGlowStrength ?? 20}px
                    </Text>
                  </div>
                  
                  <div>
                    <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                      Glow Strength on Hover
                    </Text>
                    <Slider
                      value={ribbon?.ribbonGlowStrengthHover ?? 28}
                      min={0}
                      max={96}
                      step={1}
                      onChange={handleRibbonGlowStrengthHoverChange}
                    />
                    <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                      {ribbon?.ribbonGlowStrengthHover ?? 28}px
                    </Text>
                  </div>
                </div>
              </div>
            </Card>

            {/* Glass Effect */}
            <Card>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <Text variant="h4" style={{ color: 'hsl(var(--text-primary))', marginBottom: '8px' }}>
                      Glass Effect
                    </Text>
                    <Text variant="body" style={{ color: 'hsl(var(--text-secondary))' }}>
                      Add a modern glass morphism effect to the ribbon.
                    </Text>
                  </div>
                  <WToggle
                    checked={ribbon?.glassWiiRibbon ?? false}
                    onChange={handleGlassWiiRibbonChange}
                  />
                </div>
                
                {ribbon?.glassWiiRibbon && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                        Glass Opacity
                      </Text>
                      <Slider
                        value={ribbon?.glassOpacity ?? 0.18}
                        min={0.05}
                        max={0.5}
                        step={0.01}
                        onChange={handleGlassOpacityChange}
                      />
                      <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                        {Math.round((ribbon?.glassOpacity ?? 0.18) * 100)}%
                      </Text>
                    </div>
                    
                    <div>
                      <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                        Glass Blur
                      </Text>
                      <Slider
                        value={ribbon?.glassBlur ?? 2.5}
                        min={0.5}
                        max={10}
                        step={0.5}
                        onChange={handleGlassBlurChange}
                      />
                      <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                        {ribbon?.glassBlur ?? 2.5}px
                      </Text>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        );

      case 'animations':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Text variant="h3" style={{ color: 'hsl(var(--text-primary))', marginBottom: '16px' }}>
              Animation & Particle Effects
            </Text>
            <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '16px' }}>
              Customize particle effects and animations that apply to both dock types.
            </Text>

            {/* Particle System */}
            <Card>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <Text variant="h4" style={{ color: 'hsl(var(--text-primary))', marginBottom: '8px' }}>
                      Particle System
                    </Text>
                    <Text variant="body" style={{ color: 'hsl(var(--text-secondary))' }}>
                      Add floating particles around the dock for visual enhancement.
                    </Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: dock?.particleSystemEnabled ? '#10b981' : '#6b7280',
                      animation: dock?.particleSystemEnabled ? 'pulse 2s infinite' : 'none'
                    }} />
                    <WToggle
                      checked={dock?.particleSystemEnabled ?? false}
                      onChange={handleParticleEnabledChange}
                    />
                  </div>
                </div>
                
                {dock?.particleSystemEnabled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Status indicator */}
                    <div style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{ fontSize: '16px' }}>✨</div>
                      <div>
                        <Text variant="body" style={{ color: '#10b981', fontWeight: '600' }}>
                          Particle System Active
                        </Text>
                        <Text variant="caption" style={{ color: 'hsl(var(--text-secondary))' }}>
                          {dock?.particleEffectType || 'normal'} effect with {dock?.particleCount || 3} particles
                        </Text>
                      </div>
                    </div>
                    
                    <div>
                      <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                        Effect Type
                      </Text>
                      <WSelect
                        value={dock?.particleEffectType ?? 'normal'}
                        onChange={(value) => handleParticleEffectTypeChange(value)}
                        options={[
                          { value: 'normal', label: 'Normal Particles' },
                          { value: 'stars', label: 'Stars' },
                          { value: 'sparkles', label: 'Sparkles' },
                          { value: 'fireflies', label: 'Fireflies' },
                          { value: 'dust', label: 'Dust' },
                          { value: 'clip-path', label: 'Clip Path Followers' },
                          { value: 'energy', label: 'Energy Orbs' },
                          { value: 'magic', label: 'Magic Sparkles' }
                        ]}
                      />
                    </div>
                    
                    <div>
                      <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                        Direction
                      </Text>
                      <WSelect
                        value={dock?.particleDirection ?? 'upward'}
                        onChange={(value) => handleParticleDirectionChange(value)}
                        options={[
                          { value: 'upward', label: 'Upward' },
                          { value: 'downward', label: 'Downward' },
                          { value: 'leftward', label: 'Leftward' },
                          { value: 'rightward', label: 'Rightward' },
                          { value: 'random', label: 'Random' },
                          { value: 'outward', label: 'Outward from Center' },
                          { value: 'inward', label: 'Inward to Center' }
                        ]}
                      />
                    </div>
                    
                    <div>
                      <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                        Particle Count
                      </Text>
                      <Slider
                        value={dock?.particleCount ?? 3}
                        min={1}
                        max={10}
                        step={1}
                        onChange={handleParticleCountChange}
                      />
                      <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                        {dock?.particleCount ?? 3} particles
                      </Text>
                    </div>
                    
                    <div>
                      <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                        Animation Speed
                      </Text>
                      <Slider
                        value={dock?.particleSpeed ?? 2}
                        min={0.5}
                        max={5}
                        step={0.1}
                        onChange={handleParticleSpeedChange}
                      />
                      <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                        {dock?.particleSpeed ?? 2}x speed
                      </Text>
                    </div>
                    
                    <div>
                      <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                        Particle Size
                      </Text>
                      <Slider
                        value={dock?.particleSize ?? 3}
                        min={1}
                        max={10}
                        step={0.5}
                        onChange={handleParticleSizeChange}
                      />
                      <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                        {dock?.particleSize ?? 3}px
                      </Text>
                    </div>
                    
                    <div>
                      <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                        Gravity
                      </Text>
                      <Slider
                        value={dock?.particleGravity ?? 0.02}
                        min={0}
                        max={0.1}
                        step={0.005}
                        onChange={handleParticleGravityChange}
                      />
                      <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                        {dock?.particleGravity ?? 0.02}
                      </Text>
                    </div>
                    
                    <div>
                      <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                        Fade Speed
                      </Text>
                      <Slider
                        value={dock?.particleFadeSpeed ?? 0.008}
                        min={0.001}
                        max={0.02}
                        step={0.001}
                        onChange={handleParticleFadeSpeedChange}
                      />
                      <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                        {dock?.particleFadeSpeed ?? 0.008}
                      </Text>
                    </div>
                    
                    <div>
                      <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                        Particle Lifetime
                      </Text>
                      <Slider
                        value={dock?.particleLifetime ?? 3.0}
                        min={1}
                        max={10}
                        step={0.5}
                        onChange={handleParticleLifetimeChange}
                      />
                      <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                        {dock?.particleLifetime ?? 3.0}s
                      </Text>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Advanced Particle Settings */}
            {dock?.particleSystemEnabled && (
              <Card>
                <div style={{ padding: '20px' }}>
                  <Text variant="h4" style={{ color: 'hsl(var(--text-primary))', marginBottom: '16px' }}>
                    Advanced Particle Settings
                  </Text>
                  <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '16px' }}>
                    Fine-tune particle appearance and behavior.
                  </Text>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '4px' }}>
                          Adaptive Colors
                        </Text>
                        <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))' }}>
                          Particles adapt to dock colors
                        </Text>
                      </div>
                      <WToggle
                        checked={dock?.particleUseAdaptiveColor ?? false}
                        onChange={handleParticleUseAdaptiveColorChange}
                      />
                    </div>
                    
                    {!dock?.particleUseAdaptiveColor && (
                      <>
                        <div>
                          <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                            Color Intensity
                          </Text>
                          <Slider
                            value={dock?.particleColorIntensity ?? 1.0}
                            min={0.1}
                            max={2.0}
                            step={0.1}
                            onChange={handleParticleColorIntensityChange}
                          />
                          <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                            {dock?.particleColorIntensity ?? 1.0}x
                          </Text>
                        </div>
                        
                        <div>
                          <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                            Color Variation
                          </Text>
                          <Slider
                            value={dock?.particleColorVariation ?? 0.3}
                            min={0}
                            max={1}
                            step={0.1}
                            onChange={handleParticleColorVariationChange}
                          />
                          <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                            {Math.round((dock?.particleColorVariation ?? 0.3) * 100)}%
                          </Text>
                        </div>
                      </>
                    )}
                    
                    <div>
                      <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                        Rotation Speed
                      </Text>
                      <Slider
                        value={dock?.particleRotationSpeed ?? 0.05}
                        min={0}
                        max={0.2}
                        step={0.01}
                        onChange={handleParticleRotationSpeedChange}
                      />
                      <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                        {dock?.particleRotationSpeed ?? 0.05}
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Performance & Optimization */}
            <Card>
              <div style={{ padding: '20px' }}>
                <Text variant="h4" style={{ color: 'hsl(var(--text-primary))', marginBottom: '16px' }}>
                  Performance & Optimization
                </Text>
                <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '16px' }}>
                  Tips for optimal performance with particle effects.
                </Text>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    padding: '12px',
                    borderRadius: '6px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  }}>
                    <Text variant="body" style={{ color: '#3b82f6', fontWeight: '600', marginBottom: '4px' }}>
                      💡 Performance Tips
                    </Text>
                    <Text variant="caption" style={{ color: 'hsl(var(--text-secondary))' }}>
                      • Lower particle count for better performance<br/>
                      • Use 'normal' or 'dust' effects for minimal impact<br/>
                      • Disable adaptive colors if not needed<br/>
                      • Higher-end effects like 'energy' use more resources
                    </Text>
                  </div>
                  
                  <div style={{
                    padding: '12px',
                    borderRadius: '6px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.2)'
                  }}>
                    <Text variant="body" style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '4px' }}>
                      ⚡ New Features
                    </Text>
                    <Text variant="caption" style={{ color: 'hsl(var(--text-secondary))' }}>
                      • Clip Path Followers: Particles follow dock shape<br/>
                      • Energy Orbs: Pulsing energy effects<br/>
                      • Magic Sparkles: Enhanced sparkle effects<br/>
                      • Multiple direction options for varied movement
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <style>{pulseAnimation}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Text variant="h2" style={{ color: 'hsl(var(--text-primary))', marginBottom: '8px' }}>
          Dock Settings
        </Text>
      
      <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '16px' }}>
        Customize your dock appearance, choose between Classic and Ribbon styles, and configure animations.
      </Text>

      {/* Sub-tab Navigation */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid hsl(var(--border-primary))',
        marginBottom: '24px'
      }}>
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              color: activeSubTab === tab.id ? 'hsl(var(--text-primary))' : 'hsl(var(--text-secondary))',
              borderBottom: activeSubTab === tab.id ? '2px solid #0099ff' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontWeight: activeSubTab === tab.id ? '600' : '500'
            }}
          >
            <span style={{ fontSize: '16px' }}>{tab.icon}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '14px', fontWeight: 'inherit' }}>{tab.label}</div>
              <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>{tab.description}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Sub-tab Content */}
      {renderSubTabContent()}
    </div>
    </>
  );
});

UnifiedDockSettingsTab.displayName = 'UnifiedDockSettingsTab';

export default UnifiedDockSettingsTab;
