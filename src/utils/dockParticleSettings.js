/**
 * Canonical mapping between `dock.particle*` store keys and DockParticleSystem props.
 */

export function toDockParticleProps(dock = {}) {
  return {
    enabled: Boolean(dock.particleSystemEnabled),
    effectType: dock.particleEffectType || 'normal',
    direction: dock.particleDirection || 'upward',
    speed: dock.particleSpeed ?? 2,
    particleCount: dock.particleCount ?? 3,
    spawnRate: dock.particleSpawnRate ?? 60,
    clipPathFollow: Boolean(dock.particleClipPathFollow ?? dock.clipPathFollow),
    settings: {
      size: dock.particleSize ?? 3,
      gravity: dock.particleGravity ?? 0.02,
      fadeSpeed: dock.particleFadeSpeed ?? 0.008,
      sizeDecay: dock.particleSizeDecay ?? 0.02,
      useAdaptiveColor: Boolean(dock.particleUseAdaptiveColor),
      customColors: Array.isArray(dock.particleCustomColors) ? dock.particleCustomColors : [],
      colorIntensity: dock.particleColorIntensity ?? 1.0,
      colorVariation: dock.particleColorVariation ?? 0.3,
      rotationSpeed: dock.particleRotationSpeed ?? 0.05,
      particleLifetime: dock.particleLifetime ?? 3.0,
    },
  };
}
