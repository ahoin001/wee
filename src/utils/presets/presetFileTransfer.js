/**
 * Versioned local `.wee-preset` export/import for visual (Look) presets.
 *
 * File format (JSON):
 * {
 *   format: 'wee-preset',
 *   formatVersion: 1,
 *   exportedAt: ISO string,
 *   preset: { name, data, captureScope: 'visual', thumbnailDataUrl? }
 * }
 *
 * Export is always sanitized to visual-only via `toVisualOnlyPreset` — Home channel
 * layouts and machine-specific app paths never leave the machine through this path.
 */

import { toVisualOnlyPreset } from './presetThemeData.js';
import { createPresetId } from './presetIds.js';

export const WEE_PRESET_FILE_FORMAT = 'wee-preset';
export const WEE_PRESET_FILE_VERSION = 1;
export const WEE_PRESET_FILE_EXTENSION = '.wee-preset';

/** Build the serializable file payload from a saved preset (visual-only). */
export function buildPresetFilePayload(preset) {
  const visual = toVisualOnlyPreset(preset);
  if (!visual) return null;
  return {
    format: WEE_PRESET_FILE_FORMAT,
    formatVersion: WEE_PRESET_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    preset: {
      name: visual.name || 'Wee look',
      data: visual.data,
      captureScope: visual.captureScope,
      thumbnailDataUrl: visual.thumbnailDataUrl || null,
      thumbnailComposition: visual.thumbnailComposition,
    },
  };
}

function safeFileName(name) {
  const base = String(name || 'wee-look')
    .trim()
    .replace(/[^a-z0-9-_ ]/gi, '')
    .replace(/\s+/g, '-')
    .slice(0, 48);
  return `${base || 'wee-look'}${WEE_PRESET_FILE_EXTENSION}`;
}

/**
 * Export a preset as a downloadable `.wee-preset` file.
 * @returns {{ ok: boolean, error?: string }}
 */
export function exportPresetToFile(preset) {
  const payload = buildPresetFilePayload(preset);
  if (!payload) return { ok: false, error: 'Preset could not be exported.' };

  try {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = safeFileName(payload.preset.name);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // Give the download a beat before revoking.
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error?.message || 'Export failed.' };
  }
}

/**
 * Parse and validate a `.wee-preset` file's text content.
 * @param {string} text
 * @returns {{ ok: true, preset: object, meta: { formatVersion: number, exportedAt: string | null } } | { ok: false, error: string }}
 */
export function parsePresetFile(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Not a valid preset file (could not read JSON).' };
  }

  if (!parsed || typeof parsed !== 'object' || parsed.format !== WEE_PRESET_FILE_FORMAT) {
    return { ok: false, error: 'Not a Wee preset file.' };
  }

  const fileVersion = Number(parsed.formatVersion) || 0;
  if (fileVersion > WEE_PRESET_FILE_VERSION) {
    return {
      ok: false,
      error: `This preset file needs a newer version of Wee (file v${fileVersion}, supported up to v${WEE_PRESET_FILE_VERSION}).`,
    };
  }

  const rawPreset = parsed.preset;
  if (!rawPreset || typeof rawPreset !== 'object' || !rawPreset.data || typeof rawPreset.data !== 'object') {
    return { ok: false, error: 'Preset file is missing look data.' };
  }

  // Force visual-only regardless of file claims (defense against tampered files).
  const visual = toVisualOnlyPreset({
    id: createPresetId(),
    name: typeof rawPreset.name === 'string' && rawPreset.name.trim() ? rawPreset.name.trim() : 'Imported look',
    data: rawPreset.data,
    thumbnailDataUrl:
      typeof rawPreset.thumbnailDataUrl === 'string' && rawPreset.thumbnailDataUrl.startsWith('data:image/')
        ? rawPreset.thumbnailDataUrl
        : null,
    thumbnailComposition:
      rawPreset.thumbnailComposition === 'hideBoard' ? 'hideBoard' : 'showBoard',
    timestamp: new Date().toISOString(),
  });
  if (!visual) {
    return { ok: false, error: 'Preset file could not be normalized.' };
  }

  return {
    ok: true,
    preset: visual,
    meta: {
      formatVersion: fileVersion,
      exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : null,
    },
  };
}
