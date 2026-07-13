/**
 * Dock ambient particle catalog — single source of truth for effect types
 * and emission directions (Animations settings + DockParticleSystem).
 */

export const PARTICLE_EFFECT_TYPES = [
  'normal',
  'stars',
  'paws',
  'waterDrops',
  'sparkles',
  'magic',
  'fireflies',
  'dust',
  'energy',
];

export const PARTICLE_DIRECTIONS = [
  'upward',
  'downward',
  'leftward',
  'rightward',
  'random',
  'outward',
  'inward',
  'all',
];

/** @type {Record<string, { id: string, label: string }>} */
const TYPE_META = {
  normal: { id: 'normal', label: 'Normal particles' },
  stars: { id: 'stars', label: 'Stars' },
  paws: { id: 'paws', label: 'Paws' },
  waterDrops: { id: 'waterDrops', label: 'Water drops' },
  sparkles: { id: 'sparkles', label: 'Sparkles' },
  magic: { id: 'magic', label: 'Magic sparkles' },
  fireflies: { id: 'fireflies', label: 'Fireflies' },
  dust: { id: 'dust', label: 'Dust' },
  energy: { id: 'energy', label: 'Energy orbs' },
};

/** @type {Record<string, { id: string, label: string }>} */
const DIRECTION_META = {
  upward: { id: 'upward', label: 'Upward' },
  downward: { id: 'downward', label: 'Downward' },
  leftward: { id: 'leftward', label: 'Leftward' },
  rightward: { id: 'rightward', label: 'Rightward' },
  random: { id: 'random', label: 'Random' },
  outward: { id: 'outward', label: 'Outward from center' },
  inward: { id: 'inward', label: 'Inward to center' },
  all: { id: 'all', label: 'All directions' },
};

export function getParticleEffectTypeOptions() {
  return PARTICLE_EFFECT_TYPES.map((id) => ({
    value: id,
    label: TYPE_META[id].label,
  }));
}

export function getParticleDirectionOptions() {
  return PARTICLE_DIRECTIONS.map((id) => ({
    value: id,
    label: DIRECTION_META[id].label,
  }));
}

export function isParticleEffectType(id) {
  return PARTICLE_EFFECT_TYPES.includes(id);
}

export function isParticleDirection(id) {
  return PARTICLE_DIRECTIONS.includes(id);
}
