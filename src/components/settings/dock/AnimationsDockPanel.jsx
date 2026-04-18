import React from 'react';
import PropTypes from 'prop-types';
import { Info, Sparkles, Zap } from 'lucide-react';
import Text from '../../../ui/Text';
import Slider from '../../../ui/Slider';
import WSelect from '../../../ui/WSelect';
import WToggle from '../../../ui/WToggle';
import { WeeModalFieldCard, WeeSettingsCollapsibleSection } from '../../../ui/wee';

function AnimationsDockPanel({
  dock,
  onParticleEnabledChange,
  onParticleEffectTypeChange,
  onParticleDirectionChange,
  onParticleClipPathFollowChange,
  onParticleCountChange,
  onParticleSpeedChange,
  onParticleSizeChange,
  onParticleGravityChange,
  onParticleFadeSpeedChange,
  onParticleLifetimeChange,
  onParticleUseAdaptiveColorChange,
  onParticleColorIntensityChange,
  onParticleColorVariationChange,
  onParticleRotationSpeedChange,
}) {
  const enabled = dock?.particleSystemEnabled ?? false;

  return (
    <div className="flex flex-col gap-6">
      <WeeSettingsCollapsibleSection
        icon={Sparkles}
        title="Particle system"
        description="Ambient particles around the dock — works with Classic or Ribbon."
        defaultOpen
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
          <div className="surface-row-between mb-4">
            <div>
              <Text variant="h4" className="surface-title !mb-1">
                Particles
              </Text>
              <Text variant="body" className="text-secondary">
                Floating accents along the dock edge.
              </Text>
            </div>
            <div className="surface-row">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  enabled ? 'bg-[hsl(var(--state-success))] wee-settings-pulse-dot' : 'bg-[hsl(var(--text-tertiary))]'
                }`}
                aria-hidden
              />
              <WToggle checked={enabled} onChange={onParticleEnabledChange} />
            </div>
          </div>

          {enabled ? (
            <div className="surface-controls">
              <div className="surface-soft-panel border-[hsl(var(--state-success)/0.28)] bg-[hsl(var(--state-success)/0.1)] surface-row">
                <span className="text-base" aria-hidden>
                  ✨
                </span>
                <div>
                  <Text variant="body" className="font-semibold text-[hsl(var(--state-success))]">
                    Particles active
                  </Text>
                  <Text variant="caption" className="text-secondary">
                    {(dock?.particleEffectType || 'normal')} · {dock?.particleCount ?? 3} particles
                  </Text>
                </div>
              </div>

              <div>
                <Text variant="body" className="mb-2 text-secondary">
                  Effect type
                </Text>
                <WSelect
                  value={dock?.particleEffectType ?? 'normal'}
                  onChange={onParticleEffectTypeChange}
                  options={[
                    { value: 'normal', label: 'Normal particles' },
                    { value: 'stars', label: 'Stars' },
                    { value: 'sparkles', label: 'Sparkles' },
                    { value: 'fireflies', label: 'Fireflies' },
                    { value: 'dust', label: 'Dust' },
                    { value: 'energy', label: 'Energy orbs' },
                    { value: 'magic', label: 'Magic sparkles' },
                  ]}
                />
              </div>

              <div>
                <Text variant="body" className="mb-2 text-secondary">
                  Direction
                </Text>
                <WSelect
                  value={dock?.particleDirection ?? 'upward'}
                  onChange={onParticleDirectionChange}
                  options={[
                    { value: 'upward', label: 'Upward' },
                    { value: 'downward', label: 'Downward' },
                    { value: 'leftward', label: 'Leftward' },
                    { value: 'rightward', label: 'Rightward' },
                    { value: 'random', label: 'Random' },
                    { value: 'outward', label: 'Outward from center' },
                    { value: 'inward', label: 'Inward to center' },
                  ]}
                />
              </div>

              <div className="surface-row-between">
                <div>
                  <Text variant="body" className="text-secondary">
                    Follow border path
                  </Text>
                  <Text variant="caption" className="text-tertiary !mt-0">
                    Emit from dock / ribbon outline
                  </Text>
                </div>
                <WToggle checked={dock?.particleClipPathFollow ?? false} onChange={onParticleClipPathFollowChange} />
              </div>

              <div>
                <Text variant="body" className="mb-2 text-secondary">
                  Particle count
                </Text>
                <Slider value={dock?.particleCount ?? 3} min={1} max={10} step={1} onChange={onParticleCountChange} />
                <Text variant="caption" className="surface-caption">
                  {dock?.particleCount ?? 3} particles
                </Text>
              </div>

              <div>
                <Text variant="body" className="mb-2 text-secondary">
                  Animation speed
                </Text>
                <Slider value={dock?.particleSpeed ?? 2} min={0.5} max={5} step={0.1} onChange={onParticleSpeedChange} />
                <Text variant="caption" className="surface-caption">
                  {dock?.particleSpeed ?? 2}× speed
                </Text>
              </div>

              <div>
                <Text variant="body" className="mb-2 text-secondary">
                  Particle size
                </Text>
                <Slider value={dock?.particleSize ?? 3} min={1} max={10} step={0.5} onChange={onParticleSizeChange} />
                <Text variant="caption" className="surface-caption">
                  {dock?.particleSize ?? 3}px
                </Text>
              </div>

              <div>
                <Text variant="body" className="mb-2 text-secondary">
                  Gravity
                </Text>
                <Slider
                  value={dock?.particleGravity ?? 0.02}
                  min={0}
                  max={0.1}
                  step={0.005}
                  onChange={onParticleGravityChange}
                />
                <Text variant="caption" className="surface-caption">
                  {dock?.particleGravity ?? 0.02}
                </Text>
              </div>

              <div>
                <Text variant="body" className="mb-2 text-secondary">
                  Fade speed
                </Text>
                <Slider
                  value={dock?.particleFadeSpeed ?? 0.008}
                  min={0.001}
                  max={0.02}
                  step={0.001}
                  onChange={onParticleFadeSpeedChange}
                />
                <Text variant="caption" className="surface-caption">
                  {dock?.particleFadeSpeed ?? 0.008}
                </Text>
              </div>

              <div>
                <Text variant="body" className="mb-2 text-secondary">
                  Lifetime
                </Text>
                <Slider
                  value={dock?.particleLifetime ?? 3.0}
                  min={1}
                  max={10}
                  step={0.5}
                  onChange={onParticleLifetimeChange}
                />
                <Text variant="caption" className="surface-caption">
                  {dock?.particleLifetime ?? 3.0}s
                </Text>
              </div>
            </div>
          ) : null}
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>

      {enabled ? (
        <WeeSettingsCollapsibleSection
          icon={Zap}
          title="Advanced particles"
          description="Color adaptation and rotation when particles are on."
          defaultOpen={false}
        >
          <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-6">
            <div className="surface-controls">
              <div className="surface-row-between">
                <div>
                  <Text variant="body" className="mb-1 text-secondary">
                    Adaptive colors
                  </Text>
                  <Text variant="caption" className="text-tertiary">
                    Tint from dock colors
                  </Text>
                </div>
                <WToggle
                  checked={dock?.particleUseAdaptiveColor ?? false}
                  onChange={onParticleUseAdaptiveColorChange}
                />
              </div>

              {!dock?.particleUseAdaptiveColor ? (
                <>
                  <div>
                    <Text variant="body" className="mb-2 text-secondary">
                      Color intensity
                    </Text>
                    <Slider
                      value={dock?.particleColorIntensity ?? 1.0}
                      min={0.1}
                      max={2.0}
                      step={0.1}
                      onChange={onParticleColorIntensityChange}
                    />
                    <Text variant="caption" className="surface-caption">
                      {dock?.particleColorIntensity ?? 1.0}×
                    </Text>
                  </div>
                  <div>
                    <Text variant="body" className="mb-2 text-secondary">
                      Color variation
                    </Text>
                    <Slider
                      value={dock?.particleColorVariation ?? 0.3}
                      min={0}
                      max={1}
                      step={0.1}
                      onChange={onParticleColorVariationChange}
                    />
                    <Text variant="caption" className="surface-caption">
                      {Math.round((dock?.particleColorVariation ?? 0.3) * 100)}%
                    </Text>
                  </div>
                </>
              ) : null}

              <div>
                <Text variant="body" className="mb-2 text-secondary">
                  Rotation speed
                </Text>
                <Slider
                  value={dock?.particleRotationSpeed ?? 0.05}
                  min={0}
                  max={0.2}
                  step={0.01}
                  onChange={onParticleRotationSpeedChange}
                />
                <Text variant="caption" className="surface-caption">
                  {dock?.particleRotationSpeed ?? 0.05}
                </Text>
              </div>
            </div>
          </WeeModalFieldCard>
        </WeeSettingsCollapsibleSection>
      ) : null}

      <WeeSettingsCollapsibleSection
        icon={Info}
        title="Performance & tips"
        description="Getting smooth motion on lower-end GPUs."
        defaultOpen={false}
      >
        <div className="flex flex-col gap-3">
          <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--primary)/0.22)] bg-[hsl(var(--surface-wii-tint)/0.45)] p-4">
            <Text variant="body" className="mb-2 font-semibold text-[hsl(var(--primary))]">
              Performance tips
            </Text>
            <Text variant="caption" className="text-secondary">
              Lower particle count for busy scenes. “Normal” and “dust” are lighter than “energy”. Turn off adaptive
              colors if you don’t need tinting.
            </Text>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[hsl(var(--state-warning)/0.35)] bg-[hsl(var(--state-warning)/0.08)] p-4">
            <Text variant="body" className="mb-2 font-semibold text-[hsl(var(--state-warning))]">
              Features
            </Text>
            <Text variant="caption" className="text-secondary">
              Border path follow, energy orbs, magic sparkles, and multi-direction motion are available in the controls
              above.
            </Text>
          </div>
        </div>
      </WeeSettingsCollapsibleSection>
    </div>
  );
}

AnimationsDockPanel.propTypes = {
  dock: PropTypes.object,
  onParticleEnabledChange: PropTypes.func.isRequired,
  onParticleEffectTypeChange: PropTypes.func.isRequired,
  onParticleDirectionChange: PropTypes.func.isRequired,
  onParticleClipPathFollowChange: PropTypes.func.isRequired,
  onParticleCountChange: PropTypes.func.isRequired,
  onParticleSpeedChange: PropTypes.func.isRequired,
  onParticleSizeChange: PropTypes.func.isRequired,
  onParticleGravityChange: PropTypes.func.isRequired,
  onParticleFadeSpeedChange: PropTypes.func.isRequired,
  onParticleLifetimeChange: PropTypes.func.isRequired,
  onParticleUseAdaptiveColorChange: PropTypes.func.isRequired,
  onParticleColorIntensityChange: PropTypes.func.isRequired,
  onParticleColorVariationChange: PropTypes.func.isRequired,
  onParticleRotationSpeedChange: PropTypes.func.isRequired,
};

export default React.memo(AnimationsDockPanel);
