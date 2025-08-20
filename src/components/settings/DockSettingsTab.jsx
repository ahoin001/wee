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
  // Use consolidated store for dock settings
  const { dock } = useConsolidatedAppStore();
  const { setDockState } = useConsolidatedAppStore(state => state.actions);
  
  // Local state for expanded groups
  const [expandedGroups, setExpandedGroups] = useState({
    classic: true,
    games: false
  });

  // Apply theme function
  const applyTheme = useCallback((themePath) => {
    const [groupKey, themeKey] = themePath.split('.');
    const group = THEME_GROUPS[groupKey];
    const theme = group?.themes[themeKey];
    if (theme) {
      setDockState(theme.colors);
    }
  }, [setDockState]);

  // Check if current colors match a theme
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

  // Color change handlers
  const handleColorChange = useCallback((key, value) => {
    setDockState({ [key]: value });
  }, [setDockState]);

  // Glass effect handlers
  const handleGlassEnabledChange = useCallback((checked) => {
    setDockState({ glassEnabled: checked });
  }, [setDockState]);

  const handleGlassOpacityChange = useCallback((value) => {
    setDockState({ glassOpacity: value });
  }, [setDockState]);

  const handleGlassBlurChange = useCallback((value) => {
    setDockState({ glassBlur: value });
  }, [setDockState]);

  const handleGlassBorderOpacityChange = useCallback((value) => {
    setDockState({ glassBorderOpacity: value });
  }, [setDockState]);

  const handleGlassShineOpacityChange = useCallback((value) => {
    setDockState({ glassShineOpacity: value });
  }, [setDockState]);

  // Size handlers
  const handleDockScaleChange = useCallback((value) => {
    setDockState({ dockScale: value });
  }, [setDockState]);

  const handleButtonSizeChange = useCallback((value) => {
    setDockState({ buttonSize: value });
  }, [setDockState]);

  const handleSdCardSizeChange = useCallback((value) => {
    setDockState({ sdCardSize: value });
  }, [setDockState]);

  // Particle system handlers
  const handleParticleEnabledChange = useCallback((checked) => {
    setDockState({ particleSystemEnabled: checked });
  }, [setDockState]);

  const handleParticleEffectTypeChange = useCallback((value) => {
    setDockState({ particleEffectType: value });
  }, [setDockState]);

  const handleParticleDirectionChange = useCallback((value) => {
    setDockState({ particleDirection: value });
  }, [setDockState]);

  const handleParticleSpeedChange = useCallback((value) => {
    setDockState({ particleSpeed: value });
  }, [setDockState]);

  const handleParticleCountChange = useCallback((value) => {
    setDockState({ particleCount: value });
  }, [setDockState]);

  const handleParticleSpawnRateChange = useCallback((value) => {
    setDockState({ particleSpawnRate: value });
  }, [setDockState]);

  const handleParticleSizeChange = useCallback((value) => {
    setDockState({ particleSize: value });
  }, [setDockState]);

  const handleParticleGravityChange = useCallback((value) => {
    setDockState({ particleGravity: value });
  }, [setDockState]);

  const handleParticleFadeSpeedChange = useCallback((value) => {
    setDockState({ particleFadeSpeed: value });
  }, [setDockState]);

  const handleParticleSizeDecayChange = useCallback((value) => {
    setDockState({ particleSizeDecay: value });
  }, [setDockState]);

  const handleParticleUseAdaptiveColorChange = useCallback((checked) => {
    setDockState({ particleUseAdaptiveColor: checked });
  }, [setDockState]);

  const handleParticleColorIntensityChange = useCallback((value) => {
    setDockState({ particleColorIntensity: value });
  }, [setDockState]);

  const handleParticleColorVariationChange = useCallback((value) => {
    setDockState({ particleColorVariation: value });
  }, [setDockState]);

  const handleParticleRotationSpeedChange = useCallback((value) => {
    setDockState({ particleRotationSpeed: value });
  }, [setDockState]);

  const handleParticleLifetimeChange = useCallback((value) => {
    setDockState({ particleLifetime: value });
  }, [setDockState]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Text variant="h2" style={{ color: 'hsl(var(--text-primary))', marginBottom: '8px' }}>
        Classic Dock Settings
      </Text>
      
      <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '16px' }}>
        Customize the appearance of the Classic Wii Dock including colors, themes, glass effects, and sizing.
      </Text>

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
                value={dock?.sdCardBodyColor ?? '#B9E1F2'}
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
                {(dock?.sdCardBodyColor ?? '#B9E1F2').toUpperCase()}
              </Text>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', minWidth: '140px' }}>
                Card Border
              </Text>
              <input
                type="color"
                value={dock?.sdCardBorderColor ?? '#33BEED'}
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
                {(dock?.sdCardBorderColor ?? '#33BEED').toUpperCase()}
              </Text>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', minWidth: '140px' }}>
                Label Area
              </Text>
              <input
                type="color"
                value={dock?.sdCardLabelColor ?? 'white'}
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
                {(dock?.sdCardLabelColor ?? 'white').toUpperCase()}
              </Text>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', minWidth: '140px' }}>
                Bottom Section
              </Text>
              <input
                type="color"
                value={dock?.sdCardBottomColor ?? '#31BEED'}
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
                {(dock?.sdCardBottomColor ?? '#31BEED').toUpperCase()}
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
                value={dock?.leftPodBaseColor ?? '#D2D3DA'}
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
                {(dock?.leftPodBaseColor ?? '#D2D3DA').toUpperCase()}
              </Text>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', minWidth: '140px' }}>
                Right Pod Base
              </Text>
              <input
                type="color"
                value={dock?.rightPodBaseColor ?? '#DCDCDF'}
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
                {(dock?.rightPodBaseColor ?? '#DCDCDF').toUpperCase()}
              </Text>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', minWidth: '140px' }}>
                Button Border
              </Text>
              <input
                type="color"
                value={dock?.buttonBorderColor ?? '#22BEF3'}
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
                {(dock?.buttonBorderColor ?? '#22BEF3').toUpperCase()}
              </Text>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', minWidth: '140px' }}>
                Button Icon
              </Text>
              <input
                type="color"
                value={dock?.buttonIconColor ?? '#979796'}
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
                {(dock?.buttonIconColor ?? '#979796').toUpperCase()}
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
              checked={dock?.glassEnabled ?? false}
              onChange={handleGlassEnabledChange}
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
                  onChange={handleGlassOpacityChange}
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
                  onChange={handleGlassBlurChange}
                />
                <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                  {dock?.glassBlur ?? 2.5}px
                </Text>
              </div>
              
              <div>
                <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                  Border Opacity
                </Text>
                <Slider
                  value={dock?.glassBorderOpacity ?? 0.5}
                  min={0.1}
                  max={1}
                  step={0.05}
                  onChange={handleGlassBorderOpacityChange}
                />
                <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                  {Math.round((dock?.glassBorderOpacity ?? 0.5) * 100)}%
                </Text>
              </div>
              
              <div>
                <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                  Shine Opacity
                </Text>
                <Slider
                  value={dock?.glassShineOpacity ?? 0.7}
                  min={0.1}
                  max={1}
                  step={0.05}
                  onChange={handleGlassShineOpacityChange}
                />
                <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                  {Math.round((dock?.glassShineOpacity ?? 0.7) * 100)}%
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
                value={dock?.dockScale ?? 1.0}
                min={0.5}
                max={2.0}
                step={0.05}
                onChange={handleDockScaleChange}
              />
              <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                {Math.round((dock?.dockScale ?? 1.0) * 100)}%
              </Text>
            </div>
            
            <div>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                Button Size
              </Text>
              <Slider
                value={dock?.buttonSize ?? 1.0}
                min={0.5}
                max={1.5}
                step={0.05}
                onChange={handleButtonSizeChange}
              />
              <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                {Math.round((dock?.buttonSize ?? 1.0) * 100)}%
              </Text>
            </div>
            
            <div>
              <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                SD Card Size
              </Text>
              <Slider
                value={dock?.sdCardSize ?? 1.0}
                min={0.5}
                max={2.0}
                step={0.05}
                onChange={handleSdCardSizeChange}
              />
              <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                {Math.round((dock?.sdCardSize ?? 1.0) * 100)}%
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
              checked={dock?.particleSystemEnabled ?? false}
              onChange={handleParticleEnabledChange}
            />
          </div>
          
          {dock?.particleSystemEnabled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Effect Type */}
              <div>
                <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                  Effect Type
                </Text>
                <WSelect
                  value={dock?.particleEffectType ?? 'normal'}
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
                  value={dock?.particleDirection ?? 'upward'}
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
                    Spawn Rate
                  </Text>
                  <Slider
                    value={dock?.particleSpawnRate ?? 60}
                    min={10}
                    max={120}
                    step={5}
                    onChange={handleParticleSpawnRateChange}
                  />
                  <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                    {dock?.particleSpawnRate ?? 60} per second
                  </Text>
                </div>
                
                <div>
                  <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                    Particle Size
                  </Text>
                  <Slider
                    value={dock?.particleSize ?? 3}
                    min={1}
                    max={8}
                    step={0.5}
                    onChange={handleParticleSizeChange}
                  />
                  <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                    {dock?.particleSize ?? 3}px
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
                    Size Decay
                  </Text>
                  <Slider
                    value={dock?.particleSizeDecay ?? 0.02}
                    min={0}
                    max={0.05}
                    step={0.005}
                    onChange={handleParticleSizeDecayChange}
                  />
                  <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))', marginTop: '4px' }}>
                    {dock?.particleSizeDecay ?? 0.02}
                  </Text>
                </div>
                
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

              {/* Color Settings */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text variant="body" style={{ color: 'hsl(var(--text-secondary))' }}>
                    Use Adaptive Colors
                  </Text>
                  <WToggle
                    checked={dock?.particleUseAdaptiveColor ?? false}
                    onChange={handleParticleUseAdaptiveColorChange}
                  />
                </div>
                <Text variant="caption" style={{ color: 'hsl(var(--text-tertiary))' }}>
                  Use dock accent color for particles
                </Text>
              </div>

              {dock?.particleUseAdaptiveColor && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <Text variant="body" style={{ color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                      Color Intensity
                    </Text>
                    <Slider
                      value={dock?.particleColorIntensity ?? 1.0}
                      min={0.5}
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
                      {dock?.particleColorVariation ?? 0.3}
                    </Text>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
});

ClassicDockSettingsTab.displayName = 'ClassicDockSettingsTab';

export default ClassicDockSettingsTab; 