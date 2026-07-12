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

/** Map DockEffectsModal local (short) keys → flat `dock.particle*` patch. */
export function dockParticlePatchFromModalLocal(local = {}) {
  return {
    particleSystemEnabled: Boolean(local.enabled),
    particleEffectType: local.effectType || 'normal',
    particleDirection: local.direction || 'upward',
    particleSpeed: local.speed ?? 2,
    particleCount: local.particleCount ?? 3,
    particleSpawnRate: local.spawnRate ?? 60,
    particleSize: local.size ?? 3,
    particleGravity: local.gravity ?? 0.02,
    particleFadeSpeed: local.fadeSpeed ?? 0.008,
    particleSizeDecay: local.sizeDecay ?? 0.02,
    particleUseAdaptiveColor: Boolean(local.useAdaptiveColor),
    particleCustomColors: Array.isArray(local.customColors) ? local.customColors : [],
    particleColorIntensity: local.colorIntensity ?? 1.0,
    particleColorVariation: local.colorVariation ?? 0.3,
    particleRotationSpeed: local.rotationSpeed ?? 0.05,
    particleLifetime: local.particleLifetime ?? 3.0,
    particleClipPathFollow: Boolean(local.clipPathFollow),
  };
}

/** Map flat `dock.particle*` → DockEffectsModal local shape. */
export function dockParticleModalLocalFromDock(dock = {}) {
  return {
    enabled: Boolean(dock.particleSystemEnabled),
    effectType: dock.particleEffectType || 'normal',
    direction: dock.particleDirection || 'upward',
    speed: dock.particleSpeed ?? 2,
    particleCount: dock.particleCount ?? 3,
    spawnRate: dock.particleSpawnRate ?? 60,
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
    clipPathFollow: Boolean(dock.particleClipPathFollow),
  };
}
