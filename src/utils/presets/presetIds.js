function randomToken() {
  return Math.random().toString(36).slice(2, 10);
}

export function createPresetId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `preset-${crypto.randomUUID()}`;
  }
  return `preset-${Date.now().toString(36)}-${randomToken()}`;
}

export function ensurePresetId(preset) {
  if (!preset || typeof preset !== 'object') return preset;
  if (typeof preset.id === 'string' && preset.id.trim()) return preset;
  return {
    ...preset,
    id: createPresetId(),
  };
}

