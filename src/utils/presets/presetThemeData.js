export function toThemeOnlyPreset(preset) {
  if (!preset || typeof preset !== 'object') return null;
  const data = preset.data && typeof preset.data === 'object' ? { ...preset.data } : {};
  delete data.channels;
  delete data.channelData;
  return {
    ...preset,
    data,
  };
}

export function sanitizePresetCollection(presets) {
  if (!Array.isArray(presets)) return { presets: [], changed: false };
  let changed = false;
  const sanitized = presets.map((preset) => {
    const next = toThemeOnlyPreset(preset);
    if (!next) return preset;
    if (preset?.data?.channels !== undefined || preset?.data?.channelData !== undefined) {
      changed = true;
    }
    return next;
  });
  return { presets: sanitized, changed };
}
