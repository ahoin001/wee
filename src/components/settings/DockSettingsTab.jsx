import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../ui/Card';
import WToggle from '../../ui/WToggle';
import Slider from '../../ui/Slider';
import Text from '../../ui/Text';
import WButton from '../../ui/WButton';
import WSelect from '../../ui/WSelect';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';

// Theme groups for collapsible organization
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
    description:'Some gamer type themes',
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

const ClassicDockSettingsTab = React.memo(() => {
  // Use legacy settings system to work with SettingsModal
  const [localDockSettings, setLocalDockSettings] = useState({});
  
  // Load dock settings from legacy system on component mount
  useEffect(() => {
    const loadDockSettings = () => {
      try {
        // Load from legacy window.settings system
        const legacySettings = window.settings || {};
        const dockSettings = legacySettings.dockSettings || {};
        
        console.log('[DockSettingsTab] Loading dock settings from legacy system:', dockSettings);
        setLocalDockSettings(dockSettings);
      } catch (error) {
        console.error('[DockSettingsTab] Failed to load dock settings:', error);
      }
    };
    
    loadDockSettings();
  }, []);
  
  // Utility function to save dock setting to legacy system
  const saveDockSetting = useCallback((key, value) => {
    try {
      console.log(`[DockSettingsTab] saveDockSetting called with: ${key} = ${value}`);
      
      // Update local state
      setLocalDockSettings(prev => ({
        ...prev,
        [key]: value
      }));
      
      // Update legacy window.settings system
      if (!window.settings) {
        window.settings = {};
      }
      if (!window.settings.dockSettings) {
        window.settings.dockSettings = {};
      }
      window.settings.dockSettings[key] = value;
      
      // Dispatch custom event to notify components of settings change
      window.dispatchEvent(new CustomEvent('settingsChanged', {
        detail: { type: 'dockSettings', key, value }
      }));
      
      console.log(`[DockSettingsTab] ✅ Successfully saved setting: ${key} = ${value}`);
      console.log('[DockSettingsTab] 📁 Updated window.settings.dockSettings:', window.settings.dockSettings);
      console.log('[DockSettingsTab] 📡 Custom event dispatched with detail:', { type: 'dockSettings', key, value });
      
    } catch (error) {
      console.error(`[DockSettingsTab] Failed to save ${key} setting:`, error);
    }
  }, []);
  
  // Local state for expanded groups
  const [expandedGroups, setExpandedGroups] = useState({
    classic: true,
    games: false
  });

  // Debug: Monitor dock state changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DockSettingsTab] Local dock settings changed:', {
        particleSystemEnabled: localDockSettings?.particleSystemEnabled,
        particleEffectType: localDockSettings?.particleEffectType,
        particleDirection: localDockSettings?.particleDirection,
        particleSpeed: localDockSettings?.particleSpeed,
        particleCount: localDockSettings?.particleCount
      });
      console.log('[DockSettingsTab] Full local dock settings:', localDockSettings);
    }
  }, [localDockSettings?.particleSystemEnabled, localDockSettings?.particleEffectType, localDockSettings?.particleDirection, localDockSettings?.particleSpeed, localDockSettings?.particleCount, localDockSettings]);

  // Debug: Log when component mounts
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DockSettingsTab] Component mounted, current local dock settings:', localDockSettings);
    }
  }, []);

  // Apply theme function with immediate save
  const applyTheme = useCallback((themePath) => {
    const [groupKey, themeKey] = themePath.split('.');
    const group = THEME_GROUPS[groupKey];
    const theme = group?.themes[themeKey];
    if (theme) {
      // Update local state with theme colors
      setLocalDockSettings(prev => ({
        ...prev,
        ...theme.colors
      }));
      
      // Save all theme colors to legacy system immediately
      try {
        if (!window.settings) {
          window.settings = {};
        }
        if (!window.settings.dockSettings) {
          window.settings.dockSettings = {};
        }
        
        // Update window.settings with theme colors
        Object.entries(theme.colors).forEach(([key, value]) => {
          window.settings.dockSettings[key] = value;
        });
        
        console.log('[DockSettingsTab] Theme applied and saved to legacy system:', theme.colors);
      } catch (error) {
        console.error('[DockSettingsTab] Failed to save theme:', error);
      }
    }
  }, []);

  // Check if current colors match a theme
  const getCurrentTheme = useCallback(() => {
    for (const [groupKey, group] of Object.entries(THEME_GROUPS)) {
      for (const [themeKey, theme] of Object.entries(group.themes)) {
        const themePath = `${groupKey}.${themeKey}`;
        const colors = theme.colors;
        
        if (
          colors.dockBaseGradientStart === localDockSettings?.dockBaseGradientStart &&
          colors.dockBaseGradientEnd === localDockSettings?.dockBaseGradientEnd &&
          colors.dockAccentColor === localDockSettings?.dockAccentColor &&
          colors.sdCardBodyColor === localDockSettings?.sdCardBodyColor &&
          colors.sdCardBorderColor === localDockSettings?.sdCardBorderColor &&
          colors.sdCardLabelColor === localDockSettings?.sdCardLabelColor &&
          colors.sdCardLabelBorderColor === localDockSettings?.sdCardLabelBorderColor &&
          colors.sdCardBottomColor === localDockSettings?.sdCardBottomColor &&
          colors.leftPodBaseColor === localDockSettings?.leftPodBaseColor &&
          colors.leftPodAccentColor === localDockSettings?.leftPodAccentColor &&
          colors.leftPodDetailColor === localDockSettings?.leftPodDetailColor &&
          colors.rightPodBaseColor === localDockSettings?.rightPodBaseColor &&
          colors.rightPodAccentColor === localDockSettings?.rightPodAccentColor &&
          colors.rightPodDetailColor === localDockSettings?.rightPodDetailColor &&
          colors.buttonBorderColor === localDockSettings?.buttonBorderColor &&
          colors.buttonGradientStart === localDockSettings?.buttonGradientStart &&
          colors.buttonGradientEnd === localDockSettings?.buttonGradientEnd &&
          colors.buttonIconColor === localDockSettings?.buttonIconColor &&
          colors.rightButtonIconColor === localDockSettings?.rightButtonIconColor &&
          colors.buttonHighlightColor === localDockSettings?.buttonHighlightColor
        ) {
          return themePath;
        }
      }
    }
    return null;
  }, [localDockSettings]);

  // Color change handlers with immediate save
  const handleColorChange = useCallback((key, value) => {
    setLocalDockSettings(prev => ({ ...prev, [key]: value }));
    saveDockSetting(key, value);
  }, [saveDockSetting]);

  // Glass effect handlers with immediate save
  const handleGlassEnabledChange = useCallback((checked) => {
    setLocalDockSettings(prev => ({ ...prev, glassEnabled: checked }));
    saveDockSetting('glassEnabled', checked);
  }, [saveDockSetting]);

  const handleGlassOpacityChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, glassOpacity: value }));
    saveDockSetting('glassOpacity', value);
  }, [saveDockSetting]);

  const handleGlassBlurChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, glassBlur: value }));
    saveDockSetting('glassBlur', value);
  }, [saveDockSetting]);

  const handleGlassBorderOpacityChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, glassBorderOpacity: value }));
    saveDockSetting('glassBorderOpacity', value);
  }, [saveDockSetting]);

  const handleGlassShineOpacityChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, glassShineOpacity: value }));
    saveDockSetting('glassShineOpacity', value);
  }, [saveDockSetting]);

  // Size handlers with immediate save
  const handleDockScaleChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, dockScale: value }));
    saveDockSetting('dockScale', value);
  }, [saveDockSetting]);

  const handleButtonSizeChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, buttonSize: value }));
    saveDockSetting('buttonSize', value);
  }, [saveDockSetting]);

  const handleSdCardSizeChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, sdCardSize: value }));
    saveDockSetting('sdCardSize', value);
  }, [saveDockSetting]);

  // Particle system handlers with immediate save
  const handleParticleEnabledChange = useCallback((checked) => {
    console.log('[DockSettingsTab] 🎯 Particle system enabled changed to:', checked);
    console.log('[DockSettingsTab] Current local dock settings before update:', localDockSettings);
    setLocalDockSettings(prev => ({ ...prev, particleSystemEnabled: checked }));
    console.log('[DockSettingsTab] Local dock settings updated, new value should be:', checked);
    saveDockSetting('particleSystemEnabled', checked);
    console.log('[DockSettingsTab] ✅ Save completed for particleSystemEnabled:', checked);
    console.log('[DockSettingsTab] 📡 Custom event dispatched to notify components');
  }, [saveDockSetting, localDockSettings]);

  const handleParticleEffectTypeChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, particleEffectType: value }));
    saveDockSetting('particleEffectType', value);
  }, [saveDockSetting]);

  const handleParticleDirectionChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, particleDirection: value }));
    saveDockSetting('particleDirection', value);
  }, [saveDockSetting]);

  const handleParticleSpeedChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, particleSpeed: value }));
    saveDockSetting('particleSpeed', value);
  }, [saveDockSetting]);

  const handleParticleCountChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, particleCount: value }));
    saveDockSetting('particleCount', value);
  }, [saveDockSetting]);

  const handleParticleSpawnRateChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, particleSpawnRate: value }));
    saveDockSetting('particleSpawnRate', value);
  }, [saveDockSetting]);

  const handleParticleSizeChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, particleSize: value }));
    saveDockSetting('particleSize', value);
  }, [saveDockSetting]);

  const handleParticleGravityChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, particleGravity: value }));
    saveDockSetting('particleGravity', value);
  }, [saveDockSetting]);

  const handleParticleFadeSpeedChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, particleFadeSpeed: value }));
    saveDockSetting('particleFadeSpeed', value);
  }, [saveDockSetting]);

  const handleParticleSizeDecayChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, particleSizeDecay: value }));
    saveDockSetting('particleSizeDecay', value);
  }, [saveDockSetting]);

  const handleParticleUseAdaptiveColorChange = useCallback((checked) => {
    setLocalDockSettings(prev => ({ ...prev, particleUseAdaptiveColor: checked }));
    saveDockSetting('particleUseAdaptiveColor', checked);
  }, [saveDockSetting]);

  const handleParticleColorIntensityChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, particleColorIntensity: value }));
    saveDockSetting('particleColorIntensity', value);
  }, [saveDockSetting]);

  const handleParticleColorVariationChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, particleColorVariation: value }));
    saveDockSetting('particleColorVariation', value);
  }, [saveDockSetting]);

  const handleParticleRotationSpeedChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, particleRotationSpeed: value }));
    saveDockSetting('particleRotationSpeed', value);
  }, [saveDockSetting]);

  const handleParticleLifetimeChange = useCallback((value) => {
    setLocalDockSettings(prev => ({ ...prev, particleLifetime: value }));
    saveDockSetting('particleLifetime', value);
  }, [saveDockSetting]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Text variant="h2" style={{ color: 'hsl(var(--text-primary))', marginBottom: '8px' }}>
        Classic Dock Settings
      </Text>
      
      <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '16px' }}>
        Customize the appearance of the Classic Wii Dock including colors, themes, glass effects, and sizing.
      </Text>
      
      {/* Debug Test Button */}
      {process.env.NODE_ENV === 'development' && (
        <Card>
          <div style={{ padding: '20px' }}>
            <Text variant="h3" style={{ color: 'hsl(var(--text-primary))', marginBottom: '16px' }}>
              Debug: Particle System Test
            </Text>
            <WButton
              onClick={() => {
                setLocalDockSettings(prev => ({
                  ...prev,
                  particleSystemEnabled: true,
                  particleEffectType: 'stars',
                  particleCount: 10,
                  particleSpeed: 3
                }));
                saveDockSetting('particleSystemEnabled', true);
                saveDockSetting('particleEffectType', 'stars');
                saveDockSetting('particleCount', 10);
                saveDockSetting('particleSpeed', 3);
                console.log('[DockSettingsTab] Debug: Enabled particle system with stars');
              }}
              style={{ marginRight: '10px' }}
            >
              Enable Stars (Debug)
            </WButton>
            <WButton
              onClick={() => {
                setLocalDockSettings(prev => ({
                  ...prev,
                  particleSystemEnabled: false
                }));
                saveDockSetting('particleSystemEnabled', false);
                console.log('[DockSettingsTab] Debug: Disabled particle system');
              }}
            >
              Disable Particles (Debug)
            </WButton>
            <WButton
              onClick={async () => {
                console.log('[DockSettingsTab] Debug: Testing API...');
                try {
                  if (window.api?.data?.get) {
                    const data = await window.api.data.get();
                    console.log('[DockSettingsTab] Debug: API test successful:', data);
                    console.log('[DockSettingsTab] Debug: Dock settings from API:', data?.settings?.dock);
                  } else {
                    console.error('[DockSettingsTab] Debug: API not available');
                  }
                } catch (error) {
                  console.error('[DockSettingsTab] Debug: API test failed:', error);
                }
              }}
              style={{ marginTop: '10px', width: '100%' }}
            >
              Test API (Debug)
            </WButton>
            <WButton
              onClick={async () => {
                console.log('[DockSettingsTab] Debug: Testing save and load...');
                try {
                  // First, save a test value
                  saveDockSetting('particleSystemEnabled', true);
                  console.log('[DockSettingsTab] Debug: Saved test value');
                  
                  // Then, load it back from window.settings
                  const loadedValue = window.settings?.dockSettings?.particleSystemEnabled;
                  console.log('[DockSettingsTab] Debug: Loaded value from window.settings:', loadedValue);
                } catch (error) {
                  console.error('[DockSettingsTab] Debug: Save/load test failed:', error);
                }
              }}
              style={{ marginTop: '10px', width: '100%' }}
            >
              Test Save/Load (Debug)
            </WButton>
            <WButton
              onClick={async () => {
                console.log('[DockSettingsTab] Debug: Testing current state...');
                try {
                  // Check current local state
                  console.log('[DockSettingsTab] Debug: Current local dock settings:', localDockSettings);
                  
                  // Check window.settings state
                  console.log('[DockSettingsTab] Debug: window.settings:', window.settings);
                  console.log('[DockSettingsTab] Debug: window.settings.dockSettings:', window.settings?.dockSettings);
                  
                  // Check if they match
                  const windowEnabled = window.settings?.dockSettings?.particleSystemEnabled;
                  const localEnabled = localDockSettings?.particleSystemEnabled;
                  console.log('[DockSettingsTab] Debug: window.settings enabled:', windowEnabled, 'Local enabled:', localEnabled);
                  console.log('[DockSettingsTab] Debug: States match:', windowEnabled === localEnabled);
                } catch (error) {
                  console.error('[DockSettingsTab] Debug: State test failed:', error);
                }
              }}
              style={{ marginTop: '10px', width: '100%' }}
            >
              Test Current State (Debug)
            </WButton>
            <WButton
              onClick={async () => {
                console.log('[DockSettingsTab] Debug: Testing setLocalDockSettings action...');
                try {
                  // Test the setLocalDockSettings action directly
                  console.log('[DockSettingsTab] Debug: Before setLocalDockSettings, particleSystemEnabled:', localDockSettings?.particleSystemEnabled);
                  
                  setLocalDockSettings(prev => ({ ...prev, particleSystemEnabled: true }));
                  saveDockSetting('particleSystemEnabled', true);
                  
                  // Check if it was updated
                  setTimeout(() => {
                    console.log('[DockSettingsTab] Debug: After setLocalDockSettings, particleSystemEnabled:', localDockSettings?.particleSystemEnabled);
                    console.log('[DockSettingsTab] Debug: window.settings.dockSettings:', window.settings?.dockSettings);
                  }, 100);
                  
                } catch (error) {
                  console.error('[DockSettingsTab] Debug: setLocalDockSettings test failed:', error);
                }
              }}
              style={{ marginTop: '10px', width: '100%' }}
            >
              Test setLocalDockSettings (Debug)
            </WButton>
          </div>
        </Card>
      )}

      {/* Preset Themes */}
      <Card>
        <div style={{ padding: '20px' }}>
          <Text variant="h3" style={{ color: 'hsl(var(--text-primary))', marginBottom: '16px' }}>
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
                  <Text variant="h4" style={{ color: 'hsl(var(--text-primary))', marginBottom: '4px' }}>
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
          <Text variant="h3" style={{ color: 'hsl(var(--text-primary))', marginBottom: '16px' }}>
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
                value={localDockSettings?.dockBaseGradientStart ?? '#BDBEC2'}
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
                {(localDockSettings?.dockBaseGradientStart ?? '#BDBEC2').toUpperCase()}
              </Text>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', minWidth: '140px' }}>
                Gradient End
              </Text>
              <input
                type="color"
                value={localDockSettings?.dockBaseGradientEnd ?? '#DADDE6'}
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
                {(localDockSettings?.dockBaseGradientEnd ?? '#DADDE6').toUpperCase()}
              </Text>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', minWidth: '140px' }}>
                Accent Color
              </Text>
              <input
                type="color"
                value={localDockSettings?.dockAccentColor ?? '#33BEED'}
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
                {(localDockSettings?.dockAccentColor ?? '#33BEED').toUpperCase()}
              </Text>
            </div>
          </div>
        </div>
      </Card>

      {/* SD Card Colors */}
      <Card>
        <div style={{ padding: '20px' }}>
          <Text variant="h3" style={{ color: 'hsl(var(--text-primary))', marginBottom: '16px' }}>
            SD Card Colors
          </Text>
          <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '16px' }}>
            Customize the SD card appearance.
          </Text>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', minWidth: '140px' }}>
                Card Body
              </Text>
              <input
                type="color"
                value={localDockSettings?.sdCardBodyColor ?? '#B9E1F2'}
                onChange={(e) => handleColorChange('sdCardBodyColor', e.target.value)}
                style={{
                  width: 50,
                  height: 40,
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              />
              <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))' }}>
                {(localDockSettings?.sdCardBodyColor ?? '#B9E1F2').toUpperCase()}
              </Text>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', minWidth: '140px' }}>
                Card Border
              </Text>
              <input
                type="color"
                value={localDockSettings?.sdCardBorderColor ?? '#33BEED'}
                onChange={(e) => handleColorChange('sdCardBorderColor', e.target.value)}
                style={{
                  width: 50,
                  height: 40,
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              />
              <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))' }}>
                {(localDockSettings?.sdCardBorderColor ?? '#33BEED').toUpperCase()}
              </Text>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', minWidth: '140px' }}>
                Label Area
              </Text>
              <input
                type="color"
                value={localDockSettings?.sdCardLabelColor ?? 'white'}
                onChange={(e) => handleColorChange('sdCardLabelColor', e.target.value)}
                style={{
                  width: 50,
                  height: 40,
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              />
              <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))' }}>
                {(localDockSettings?.sdCardLabelColor ?? 'white').toUpperCase()}
              </Text>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', minWidth: '140px' }}>
                Bottom Section
              </Text>
              <input
                type="color"
                value={localDockSettings?.sdCardBottomColor ?? '#31BEED'}
                onChange={(e) => handleColorChange('sdCardBottomColor', e.target.value)}
                style={{
                  width: 50,
                  height: 40,
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              />
              <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))' }}>
                {(localDockSettings?.sdCardBottomColor ?? '#31BEED').toUpperCase()}
              </Text>
            </div>
          </div>
        </div>
      </Card>

      {/* Button Pod Colors */}
      <Card>
        <div style={{ padding: '20px' }}>
          <Text variant="h3" style={{ color: 'hsl(var(--text-primary))', marginBottom: '16px' }}>
            Button Pod Colors
          </Text>
          <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '16px' }}>
            Customize the button pod appearance.
          </Text>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', minWidth: '140px' }}>
                Left Pod Base
              </Text>
              <input
                type="color"
                value={localDockSettings?.leftPodBaseColor ?? '#D2D3DA'}
                onChange={(e) => handleColorChange('leftPodBaseColor', e.target.value)}
                style={{
                  width: 50,
                  height: 40,
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              />
              <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))' }}>
                {(localDockSettings?.leftPodBaseColor ?? '#D2D3DA').toUpperCase()}
              </Text>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', minWidth: '140px' }}>
                Right Pod Base
              </Text>
              <input
                type="color"
                value={localDockSettings?.rightPodBaseColor ?? '#DCDCDF'}
                onChange={(e) => handleColorChange('rightPodBaseColor', e.target.value)}
                style={{
                  width: 50,
                  height: 40,
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              />
              <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))' }}>
                {(localDockSettings?.rightPodBaseColor ?? '#DCDCDF').toUpperCase()}
              </Text>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', minWidth: '140px' }}>
                Button Border
              </Text>
              <input
                type="color"
                value={localDockSettings?.buttonBorderColor ?? '#22BEF3'}
                onChange={(e) => handleColorChange('buttonBorderColor', e.target.value)}
                style={{
                  width: 50,
                  height: 40,
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              />
              <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))' }}>
                {(localDockSettings?.buttonBorderColor ?? '#22BEF3').toUpperCase()}
              </Text>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', minWidth: '140px' }}>
                Button Icon
              </Text>
              <input
                type="color"
                value={localDockSettings?.buttonIconColor ?? '#979796'}
                onChange={(e) => handleColorChange('buttonIconColor', e.target.value)}
                style={{
                  width: 50,
                  height: 40,
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              />
              <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))' }}>
                {(localDockSettings?.buttonIconColor ?? '#979796').toUpperCase()}
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
              <Text variant="h3" style={{ color: 'hsl(var(--text-primary))', marginBottom: '8px' }}>
                Glass Effect
              </Text>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))' }}>
                Apply a glass morphism effect to the dock.
              </Text>
            </div>
            <WToggle
              checked={localDockSettings?.glassEnabled ?? false}
              onChange={handleGlassEnabledChange}
            />
          </div>
          
          {localDockSettings?.glassEnabled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                  Glass Opacity
                </Text>
                <Slider
                  value={localDockSettings?.glassOpacity ?? 0.18}
                  min={0.05}
                  max={0.5}
                  step={0.01}
                  onChange={handleGlassOpacityChange}
                />
                <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                  {Math.round((localDockSettings?.glassOpacity ?? 0.18) * 100)}%
                </Text>
              </div>
              
              <div>
                <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                  Glass Blur
                </Text>
                <Slider
                  value={localDockSettings?.glassBlur ?? 2.5}
                  min={0.5}
                  max={8}
                  step={0.1}
                  onChange={handleGlassBlurChange}
                />
                <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                  {localDockSettings?.glassBlur ?? 2.5}px
                </Text>
              </div>
              
              <div>
                <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                  Border Opacity
                </Text>
                <Slider
                  value={localDockSettings?.glassBorderOpacity ?? 0.5}
                  min={0.1}
                  max={1}
                  step={0.05}
                  onChange={handleGlassBorderOpacityChange}
                />
                <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                  {Math.round((localDockSettings?.glassBorderOpacity ?? 0.5) * 100)}%
                </Text>
              </div>
              
              <div>
                <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                  Shine Opacity
                </Text>
                <Slider
                  value={localDockSettings?.glassShineOpacity ?? 0.7}
                  min={0.1}
                  max={1}
                  step={0.05}
                  onChange={handleGlassShineOpacityChange}
                />
                <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                  {Math.round((localDockSettings?.glassShineOpacity ?? 0.7) * 100)}%
                </Text>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Size Settings */}
      <Card>
        <div style={{ padding: '20px' }}>
          <Text variant="h3" style={{ color: 'hsl(var(--text-primary))', marginBottom: '16px' }}>
            Size Settings
          </Text>
          <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '16px' }}>
            Adjust the height of dock elements. The dock maintains full width while scaling height.
          </Text>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                Dock Height
              </Text>
              <Slider
                value={localDockSettings?.dockScale ?? 1.0}
                min={0.5}
                max={2.0}
                step={0.05}
                onChange={handleDockScaleChange}
              />
              <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                {Math.round((localDockSettings?.dockScale ?? 1.0) * 100)}%
              </Text>
            </div>
            
            <div>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                Button Size
              </Text>
              <Slider
                value={localDockSettings?.buttonSize ?? 1.0}
                min={0.5}
                max={1.5}
                step={0.05}
                onChange={handleButtonSizeChange}
              />
              <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                {Math.round((localDockSettings?.buttonSize ?? 1.0) * 100)}%
              </Text>
            </div>
            
            <div>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                SD Card Size
              </Text>
              <Slider
                value={localDockSettings?.sdCardSize ?? 1.0}
                min={0.5}
                max={2.0}
                step={0.05}
                onChange={handleSdCardSizeChange}
              />
              <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                {Math.round((localDockSettings?.sdCardSize ?? 1.0) * 100)}%
              </Text>
            </div>
          </div>
        </div>
      </Card>

      {/* Particle System */}
      <Card>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <Text variant="h3" style={{ color: 'hsl(var(--text-primary))', marginBottom: '8px' }}>
                Particle System
              </Text>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))' }}>
                Add magical particle effects around the dock for visual enhancement.
              </Text>
            </div>
            <WToggle
              checked={localDockSettings?.particleSystemEnabled ?? false}
              onChange={handleParticleEnabledChange}
            />
          </div>
          
          {localDockSettings?.particleSystemEnabled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Effect Type */}
              <div>
                <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                  Effect Type
                </Text>
                <WSelect
                  value={localDockSettings?.particleEffectType ?? 'normal'}
                  onChange={handleParticleEffectTypeChange}
                  options={[
                    { value: 'normal', label: '✨ Normal Particles' },
                    { value: 'stars', label: '⭐ Stars' },
                    { value: 'paws', label: '🐾 Paws' },
                    { value: 'waterDrops', label: '💧 Water Drops' },
                    { value: 'sparkles', label: '✨ Sparkles' },
                    { value: 'magic', label: '🔮 Magic' },
                    { value: 'fireflies', label: '🦟 Fireflies' },
                    { value: 'dust', label: '💨 Dust' }
                  ]}
                />
              </div>

              {/* Direction */}
              <div>
                <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                  Direction
                </Text>
                <WSelect
                  value={localDockSettings?.particleDirection ?? 'upward'}
                  onChange={handleParticleDirectionChange}
                  options={[
                    { value: 'upward', label: '⬆️ Upward' },
                    { value: 'all', label: '🌐 All Directions' }
                  ]}
                />
              </div>

              {/* Basic Settings */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                    Particle Speed
                  </Text>
                  <Slider
                    value={localDockSettings?.particleSpeed ?? 2}
                    min={0.5}
                    max={5}
                    step={0.1}
                    onChange={handleParticleSpeedChange}
                  />
                  <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                    {localDockSettings?.particleSpeed ?? 2}x speed
                  </Text>
                </div>
                
                <div>
                  <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                    Particle Count
                  </Text>
                  <Slider
                    value={localDockSettings?.particleCount ?? 3}
                    min={1}
                    max={10}
                    step={1}
                    onChange={handleParticleCountChange}
                  />
                  <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                    {localDockSettings?.particleCount ?? 3} particles
                  </Text>
                </div>
                
                <div>
                  <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                    Spawn Rate
                  </Text>
                  <Slider
                    value={localDockSettings?.particleSpawnRate ?? 60}
                    min={10}
                    max={120}
                    step={5}
                    onChange={handleParticleSpawnRateChange}
                  />
                  <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                    {localDockSettings?.particleSpawnRate ?? 60} per second
                  </Text>
                </div>
                
                <div>
                  <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                    Particle Size
                  </Text>
                  <Slider
                    value={localDockSettings?.particleSize ?? 3}
                    min={1}
                    max={8}
                    step={0.5}
                    onChange={handleParticleSizeChange}
                  />
                  <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                    {localDockSettings?.particleSize ?? 3}px
                  </Text>
                </div>
              </div>

              {/* Physics Settings */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                    Gravity
                  </Text>
                  <Slider
                    value={localDockSettings?.particleGravity ?? 0.02}
                    min={0}
                    max={0.1}
                    step={0.005}
                    onChange={handleParticleGravityChange}
                  />
                  <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                    {localDockSettings?.particleGravity ?? 0.02}
                  </Text>
                </div>
                
                <div>
                  <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                    Fade Speed
                  </Text>
                  <Slider
                    value={localDockSettings?.particleFadeSpeed ?? 0.008}
                    min={0.001}
                    max={0.02}
                    step={0.001}
                    onChange={handleParticleFadeSpeedChange}
                  />
                  <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                    {localDockSettings?.particleFadeSpeed ?? 0.008}
                  </Text>
                </div>
                
                <div>
                  <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                    Size Decay
                  </Text>
                  <Slider
                    value={localDockSettings?.particleSizeDecay ?? 0.02}
                    min={0}
                    max={0.05}
                    step={0.005}
                    onChange={handleParticleSizeDecayChange}
                  />
                  <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                    {localDockSettings?.particleSizeDecay ?? 0.02}
                  </Text>
                </div>
                
                <div>
                  <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                    Rotation Speed
                  </Text>
                  <Slider
                    value={localDockSettings?.particleRotationSpeed ?? 0.05}
                    min={0}
                    max={0.2}
                    step={0.01}
                    onChange={handleParticleRotationSpeedChange}
                  />
                  <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                    {localDockSettings?.particleRotationSpeed ?? 0.05}
                  </Text>
                </div>
              </div>

              {/* Color Settings */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text variant="body" style={{ color: 'hsl(var(--text-secondary))' }}>
                    Use Adaptive Colors
                  </Text>
                  <WToggle
                    checked={localDockSettings?.particleUseAdaptiveColor ?? false}
                    onChange={handleParticleUseAdaptiveColorChange}
                  />
                </div>
                <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))' }}>
                  Use dock accent color for particles
                </Text>
              </div>

              {localDockSettings?.particleUseAdaptiveColor && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                      Color Intensity
                    </Text>
                    <Slider
                      value={localDockSettings?.particleColorIntensity ?? 1.0}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      onChange={handleParticleColorIntensityChange}
                    />
                    <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                      {localDockSettings?.particleColorIntensity ?? 1.0}x
                    </Text>
                  </div>
                  
                  <div>
                    <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                      Color Variation
                    </Text>
                    <Slider
                      value={localDockSettings?.particleColorVariation ?? 0.3}
                      min={0}
                      max={1}
                      step={0.1}
                      onChange={handleParticleColorVariationChange}
                    />
                    <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                      {localDockSettings?.particleColorVariation ?? 0.3}
                    </Text>
                  </div>
                </div>
              )}
              
              {/* Save Button for Particle System */}
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid hsl(var(--border))' }}>
                <WButton
                  onClick={async () => {
                    try {
                      if (window.api?.data?.get && window.api?.data?.set) {
                        const currentData = await window.api.data.get();
                        const updatedData = {
                          ...currentData,
                          settings: {
                            ...currentData.settings,
                            dock: {
                              ...currentData.settings?.dock,
                              particleSystemEnabled: localDockSettings?.particleSystemEnabled ?? false,
                              particleEffectType: localDockSettings?.particleEffectType ?? 'normal',
                              particleDirection: localDockSettings?.particleDirection ?? 'upward',
                              particleSpeed: localDockSettings?.particleSpeed ?? 2,
                              particleCount: localDockSettings?.particleCount ?? 3,
                              particleSpawnRate: localDockSettings?.particleSpawnRate ?? 60,
                              particleSize: localDockSettings?.particleSize ?? 3,
                              particleGravity: localDockSettings?.particleGravity ?? 0.02,
                              particleFadeSpeed: localDockSettings?.particleFadeSpeed ?? 0.008,
                              particleSizeDecay: localDockSettings?.particleSizeDecay ?? 0.02,
                              particleUseAdaptiveColor: localDockSettings?.particleUseAdaptiveColor ?? false,
                              particleColorIntensity: localDockSettings?.particleColorIntensity ?? 1.0,
                              particleColorVariation: localDockSettings?.particleColorVariation ?? 0.3,
                              particleRotationSpeed: localDockSettings?.particleRotationSpeed ?? 0.05,
                              particleLifetime: localDockSettings?.particleLifetime ?? 3.0
                            }
                          }
                        };
                        await window.api.data.set(updatedData);
                        console.log('[DockSettingsTab] Particle system settings saved to backend');
                      }
                    } catch (error) {
                      console.error('[DockSettingsTab] Failed to save particle system settings:', error);
                    }
                  }}
                  style={{ width: '100%' }}
                >
                  Save Particle System Settings
                </WButton>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
});

ClassicDockSettingsTab.displayName = 'ClassicDockSettingsTab';

export default ClassicDockSettingsTab; 