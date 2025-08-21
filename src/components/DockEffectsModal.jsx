import React, { useState, useEffect } from 'react';
import WBaseModal from './WBaseModal';
import Text from '../ui/Text';
import Button from '../ui/WButton';
import WToggle from '../ui/WToggle';
import Card from '../ui/Card';
import { PARTICLE_TYPES } from './DockParticleSystem';
import './DockEffectsModal.css';

// Helper function to convert hex color to RGB array
const hexToRgb = (hexColor) => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return [r, g, b];
};

const EFFECT_TYPES = [
  { value: 'normal', label: 'Normal Particles', emoji: '✨' },
  { value: 'stars', label: 'Stars', emoji: '⭐' },
  { value: 'paws', label: 'Paws', emoji: '🐾' },
  { value: 'waterDrops', label: 'Water Drops', emoji: '💧' },
  { value: 'sparkles', label: 'Sparkles', emoji: '✨' },
  { value: 'magic', label: 'Magic', emoji: '🔮' },
  { value: 'fireflies', label: 'Fireflies', emoji: '🦟' },
  { value: 'dust', label: 'Dust', emoji: '💨' },
  { value: 'energy', label: 'Energy', emoji: '⚡' }
];

const DIRECTION_OPTIONS = [
  { value: 'upward', label: 'Upward', emoji: '⬆️' },
  { value: 'all', label: 'All Directions', emoji: '🌐' }
];

function DockEffectsModal({ isOpen, onClose, onSettingsChange, settings = {}, ribbonGlowColor = '#0099ff' }) {
  const [localSettings, setLocalSettings] = useState({
    enabled: false,
    effectType: 'normal',
    direction: 'upward',
    speed: 2,
    particleCount: 3,
    spawnRate: 60,
    size: 3,
    gravity: 0.02,
    fadeSpeed: 0.008,
    sizeDecay: 0.02,
    useAdaptiveColor: false,
    customColors: [],
    colorIntensity: 1.0,
    colorVariation: 0.3,
    rotationSpeed: 0.05,
    particleLifetime: 3.0,
    clipPathFollow: false,
    ...settings
  });

  // Update local settings when props change
  useEffect(() => {
    setLocalSettings(prev => ({
      ...prev,
      ...settings
    }));
  }, [settings]);

  const handleSave = () => {
    if (onSettingsChange) {
      onSettingsChange({ particleSettings: localSettings });
    }
    onClose();
  };

  const handleCancel = () => {
    setLocalSettings({
      enabled: false,
      effectType: 'normal',
      direction: 'upward',
      speed: 2,
      particleCount: 3,
      spawnRate: 60,
      size: 3,
      gravity: 0.02,
      fadeSpeed: 0.008,
      sizeDecay: 0.02,
      useAdaptiveColor: false,
      customColors: [],
      colorIntensity: 1.0,
      colorVariation: 0.3,
      rotationSpeed: 0.05,
      particleLifetime: 3.0,
      clipPathFollow: false,
      ...settings
    });
    onClose();
  };

  const updateSetting = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <WBaseModal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Dock Effects Settings"
      size="lg"
    >
      <div className="space-y-6">
        {/* Enable/Disable Effect */}
        <Card>
          <div className="flex items-center justify-between p-4">
            <div>
              <Text size="lg" weight={600} className="text-[hsl(var(--text-primary))]">
                Enable Dock Effects
              </Text>
              <Text size="sm" className="text-[hsl(var(--text-secondary))] mt-1">
                Add magical particle effects to your dock
              </Text>
              {localSettings.enabled && (
                <div className="mt-2 p-2 bg-[hsl(var(--wii-blue))] bg-opacity-10 rounded-lg">
                  <Text size="sm" className="text-[hsl(var(--wii-blue))]">
                    ✨ Effects are currently active! Check your dock to see the magic.
                  </Text>
                </div>
              )}
            </div>
            <WToggle
              checked={localSettings.enabled}
              onChange={(checked) => updateSetting('enabled', checked)}
            />
          </div>
        </Card>

        {localSettings.enabled && (
          <>
            {/* Effect Type Selection */}
            <Card>
              <div className="p-4">
                <Text size="lg" weight={600} className="text-[hsl(var(--text-primary))] mb-4">
                  Effect Type
                </Text>
                <div className="grid grid-cols-2 gap-3">
                  {EFFECT_TYPES.map((effect) => (
                    <button
                      key={effect.value}
                      onClick={() => updateSetting('effectType', effect.value)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        localSettings.effectType === effect.value
                          ? 'border-[hsl(var(--wii-blue))] bg-[hsl(var(--wii-blue))] bg-opacity-10'
                          : 'border-[hsl(var(--border))] hover:border-[hsl(var(--wii-blue))] hover:bg-[hsl(var(--surface-secondary))]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{effect.emoji}</span>
                        <Text size="sm" weight={500} className="text-[hsl(var(--text-primary))]">
                          {effect.label}
                        </Text>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Direction Selection */}
            <Card>
              <div className="p-4">
                <Text size="lg" weight={600} className="text-[hsl(var(--text-primary))] mb-4">
                  Particle Direction
                </Text>
                <div className="grid grid-cols-2 gap-3">
                  {DIRECTION_OPTIONS.map((direction) => (
                    <button
                      key={direction.value}
                      onClick={() => updateSetting('direction', direction.value)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        localSettings.direction === direction.value
                          ? 'border-[hsl(var(--wii-blue))] bg-[hsl(var(--wii-blue))] bg-opacity-10'
                          : 'border-[hsl(var(--border))] hover:border-[hsl(var(--wii-blue))] hover:bg-[hsl(var(--surface-secondary))]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{direction.emoji}</span>
                        <Text size="sm" weight={500} className="text-[hsl(var(--text-primary))]">
                          {direction.label}
                        </Text>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Clip Path Follow Toggle */}
            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Text size="lg" weight={600} className="text-[hsl(var(--text-primary))]">
                      Follow Border Path
                    </Text>
                    <Text size="sm" className="text-[hsl(var(--text-secondary))] mt-1">
                      Particles emit from the dock/ribbon borders instead of the base
                    </Text>
                  </div>
                  <WToggle
                    checked={localSettings.clipPathFollow}
                    onChange={(checked) => updateSetting('clipPathFollow', checked)}
                  />
                </div>
                {localSettings.clipPathFollow && (
                  <div className="mt-3 p-2 bg-[hsl(var(--wii-blue))] bg-opacity-10 rounded-lg">
                    <Text size="sm" className="text-[hsl(var(--wii-blue))]">
                      🌟 Particles will now follow the curved borders of your dock or ribbon!
                    </Text>
                  </div>
                )}
              </div>
            </Card>

            {/* Speed Control */}
            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Text size="lg" weight={600} className="text-[hsl(var(--text-primary))]">
                    Particle Speed
                  </Text>
                  <Text size="sm" className="text-[hsl(var(--text-secondary))]">
                    {localSettings.speed.toFixed(1)}
                  </Text>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={localSettings.speed}
                  onChange={(e) => updateSetting('speed', parseFloat(e.target.value))}
                  className="w-full h-2 bg-[hsl(var(--surface-secondary))] rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-[hsl(var(--text-tertiary))] mt-1">
                  <span>Slow</span>
                  <span>Fast</span>
                </div>
              </div>
            </Card>

            {/* Particle Count */}
            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Text size="lg" weight={600} className="text-[hsl(var(--text-primary))]">
                    Particle Count
                  </Text>
                  <Text size="sm" className="text-[hsl(var(--text-secondary))]">
                    {localSettings.particleCount}
                  </Text>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={localSettings.particleCount}
                  onChange={(e) => updateSetting('particleCount', parseInt(e.target.value))}
                  className="w-full h-2 bg-[hsl(var(--surface-secondary))] rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-[hsl(var(--text-tertiary))] mt-1">
                  <span>Few</span>
                  <span>Many</span>
                </div>
              </div>
            </Card>

            {/* Spawn Rate */}
            <Card>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Text size="lg" weight={600} className="text-[hsl(var(--text-primary))]">
                    Spawn Rate
                  </Text>
                  <Text size="sm" className="text-[hsl(var(--text-secondary))]">
                    {localSettings.spawnRate} particles/sec
                  </Text>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="10"
                  value={localSettings.spawnRate}
                  onChange={(e) => updateSetting('spawnRate', parseInt(e.target.value))}
                  className="w-full h-2 bg-[hsl(var(--surface-secondary))] rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-[hsl(var(--text-tertiary))] mt-1">
                  <span>Slow</span>
                  <span>Fast</span>
                </div>
              </div>
            </Card>

            {/* Preview Section */}
            <Card>
              <div className="p-4">
                <Text size="lg" weight={600} className="text-[hsl(var(--text-primary))] mb-4">
                  Preview
                </Text>
                <div className="bg-[hsl(var(--surface-secondary))] rounded-lg p-4 h-32 flex items-center justify-center">
                  <Text size="sm" className="text-[hsl(var(--text-secondary))] text-center">
                    {localSettings.enabled ? (
                      <>
                        <div className="text-2xl mb-2">
                          {EFFECT_TYPES.find(e => e.value === localSettings.effectType)?.emoji || '✨'}
                        </div>
                        <div>Effect: {EFFECT_TYPES.find(e => e.value === localSettings.effectType)?.label}</div>
                        <div>Direction: {DIRECTION_OPTIONS.find(d => d.value === localSettings.direction)?.label}</div>
                        {localSettings.useAdaptiveColor && (
                          <div className="text-[hsl(var(--wii-blue))]">Adaptive Colors Enabled</div>
                        )}
                      </>
                    ) : (
                      'Enable effects to see preview'
                    )}
                  </Text>
                </div>
              </div>
            </Card>

            {/* Color Settings */}
            <Card>
              <div className="p-4">
                <Text size="lg" weight={600} className="text-[hsl(var(--text-primary))] mb-4">
                  Color Settings
                </Text>
                
                {/* Adaptive Color Toggle */}
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Text size="sm" weight={500} className="text-[hsl(var(--text-primary))]">
                        Adaptive Colors
                      </Text>
                      <Text size="xs" className="text-[hsl(var(--text-secondary))]">
                        Use ribbon glow color for particles
                      </Text>
                    </div>
                    <WToggle
                      checked={localSettings.useAdaptiveColor}
                      onChange={(checked) => updateSetting('useAdaptiveColor', checked)}
                    />
                  </div>
                </div>

                {/* Color Intensity */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Text size="sm" weight={500} className="text-[hsl(var(--text-primary))]">
                      Color Intensity
                    </Text>
                    <Text size="sm" className="text-[hsl(var(--text-secondary))]">
                      {localSettings.colorIntensity.toFixed(1)}
                    </Text>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={localSettings.colorIntensity}
                    onChange={(e) => updateSetting('colorIntensity', parseFloat(e.target.value))}
                    className="w-full h-2 bg-[hsl(var(--surface-secondary))] rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                {/* Color Variation */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Text size="sm" weight={500} className="text-[hsl(var(--text-primary))]">
                      Color Variation
                    </Text>
                    <Text size="sm" className="text-[hsl(var(--text-secondary))]">
                      {localSettings.colorVariation.toFixed(1)}
                    </Text>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={localSettings.colorVariation}
                    onChange={(e) => updateSetting('colorVariation', parseFloat(e.target.value))}
                    className="w-full h-2 bg-[hsl(var(--surface-secondary))] rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                {/* Custom Color Palette */}
                <div>
                  <Text size="sm" weight={500} className="text-[hsl(var(--text-primary))] mb-2">
                    Custom Color Palette
                  </Text>
                  <div className="flex flex-wrap gap-2">
                    {localSettings.customColors.map((color, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => {
                            const newColors = [...localSettings.customColors];
                            newColors[index] = e.target.value;
                            updateSetting('customColors', newColors);
                          }}
                          className="w-8 h-8 rounded border-2 border-[hsl(var(--border))] cursor-pointer"
                        />
                        <button
                          onClick={() => {
                            const newColors = localSettings.customColors.filter((_, i) => i !== index);
                            updateSetting('customColors', newColors);
                          }}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newColors = [...localSettings.customColors, '#ffffff'];
                        updateSetting('customColors', newColors);
                      }}
                      className="px-3 py-1 text-sm border-2 border-dashed border-[hsl(var(--border))] rounded hover:border-[hsl(var(--wii-blue))] text-[hsl(var(--text-secondary))]"
                    >
                      + Add Color
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Advanced Settings */}
            <Card>
              <div className="p-4">
                <Text size="lg" weight={600} className="text-[hsl(var(--text-primary))] mb-4">
                  Advanced Settings
                </Text>
                
                {/* Particle Size */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Text size="sm" weight={500} className="text-[hsl(var(--text-primary))]">
                      Particle Size
                    </Text>
                    <Text size="sm" className="text-[hsl(var(--text-secondary))]">
                      {localSettings.size.toFixed(1)}
                    </Text>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    step="0.1"
                    value={localSettings.size}
                    onChange={(e) => updateSetting('size', parseFloat(e.target.value))}
                    className="w-full h-2 bg-[hsl(var(--surface-secondary))] rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                {/* Gravity */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Text size="sm" weight={500} className="text-[hsl(var(--text-primary))]">
                      Gravity
                    </Text>
                    <Text size="sm" className="text-[hsl(var(--text-secondary))]">
                      {localSettings.gravity.toFixed(3)}
                    </Text>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.1"
                    step="0.001"
                    value={localSettings.gravity}
                    onChange={(e) => updateSetting('gravity', parseFloat(e.target.value))}
                    className="w-full h-2 bg-[hsl(var(--surface-secondary))] rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                {/* Fade Speed */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Text size="sm" weight={500} className="text-[hsl(var(--text-primary))]">
                      Fade Speed
                    </Text>
                    <Text size="sm" className="text-[hsl(var(--text-secondary))]">
                      {localSettings.fadeSpeed.toFixed(3)}
                    </Text>
                  </div>
                  <input
                    type="range"
                    min="0.001"
                    max="0.02"
                    step="0.001"
                    value={localSettings.fadeSpeed}
                    onChange={(e) => updateSetting('fadeSpeed', parseFloat(e.target.value))}
                    className="w-full h-2 bg-[hsl(var(--surface-secondary))] rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                {/* Size Decay */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Text size="sm" weight={500} className="text-[hsl(var(--text-primary))]">
                      Size Decay
                    </Text>
                    <Text size="sm" className="text-[hsl(var(--text-secondary))]">
                      {localSettings.sizeDecay.toFixed(3)}
                    </Text>
                  </div>
                  <input
                    type="range"
                    min="0.001"
                    max="0.05"
                    step="0.001"
                    value={localSettings.sizeDecay}
                    onChange={(e) => updateSetting('sizeDecay', parseFloat(e.target.value))}
                    className="w-full h-2 bg-[hsl(var(--surface-secondary))] rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                {/* Rotation Speed */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Text size="sm" weight={500} className="text-[hsl(var(--text-primary))]">
                      Rotation Speed
                    </Text>
                    <Text size="sm" className="text-[hsl(var(--text-secondary))]">
                      {localSettings.rotationSpeed?.toFixed(2) || '0.05'}
                    </Text>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.2"
                    step="0.01"
                    value={localSettings.rotationSpeed || 0.05}
                    onChange={(e) => updateSetting('rotationSpeed', parseFloat(e.target.value))}
                    className="w-full h-2 bg-[hsl(var(--surface-secondary))] rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                {/* Particle Lifetime */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Text size="sm" weight={500} className="text-[hsl(var(--text-primary))]">
                      Particle Lifetime (seconds)
                    </Text>
                    <Text size="sm" className="text-[hsl(var(--text-secondary))]">
                      {localSettings.particleLifetime?.toFixed(1) || '3.0'}
                    </Text>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.1"
                    value={localSettings.particleLifetime || 3.0}
                    onChange={(e) => updateSetting('particleLifetime', parseFloat(e.target.value))}
                    className="w-full h-2 bg-[hsl(var(--surface-secondary))] rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </div>
    </WBaseModal>
  );
}

export default DockEffectsModal; 