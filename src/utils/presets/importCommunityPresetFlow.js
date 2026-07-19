import { PRESET_SCOPE_VISUAL } from './presetScopes';
import { createPresetId } from './presetIds';
import { normalizeWallpaperCurrentShape } from '../presetSharing';

function normalizeCommunitySettings(presetSettings) {
  if (!presetSettings || typeof presetSettings !== 'object') return presetSettings;

  const hasOldStructure =
    presetSettings.timeColor !== undefined ||
    presetSettings.enableTimePill !== undefined ||
    presetSettings.ribbonColor !== undefined ||
    presetSettings.glassWiiRibbon !== undefined ||
    presetSettings.wallpaperOpacity !== undefined;

  if (hasOldStructure) {
    return {
      time: {
        color: presetSettings.timeColor,
        enablePill: presetSettings.enableTimePill,
        pillBlur: presetSettings.timePillBlur,
        pillOpacity: presetSettings.timePillOpacity,
        font: presetSettings.timeFont,
      },
      ribbon: {
        ribbonColor: presetSettings.ribbonColor,
        ribbonGlowColor: presetSettings.ribbonGlowColor,
        ribbonGlowStrength: presetSettings.ribbonGlowStrength,
        ribbonGlowStrengthHover: presetSettings.ribbonGlowStrengthHover,
        glassWiiRibbon: presetSettings.glassWiiRibbon,
        glassOpacity: presetSettings.glassOpacity,
        glassBlur: presetSettings.glassBlur,
        glassBorderOpacity: presetSettings.glassBorderOpacity,
        glassShineOpacity: presetSettings.glassShineOpacity,
        ribbonButtonConfigs: presetSettings.ribbonButtonConfigs,
        recentRibbonColors: presetSettings.recentRibbonColors,
        recentRibbonGlowColors: presetSettings.recentRibbonGlowColors,
      },
      wallpaper: {
        current: presetSettings.wallpaper,
        opacity: presetSettings.wallpaperOpacity,
        blur: presetSettings.wallpaperBlur,
        cycleWallpapers: presetSettings.cycleWallpapers,
        cycleInterval: presetSettings.cycleInterval,
        cycleAnimation: presetSettings.cycleAnimation,
        savedWallpapers: presetSettings.savedWallpapers,
        likedWallpapers: presetSettings.likedWallpapers,
        slideDirection: presetSettings.slideDirection,
        slideDuration: presetSettings.slideDuration,
        slideEasing: presetSettings.slideEasing,
        slideRandomDirection: presetSettings.slideRandomDirection,
        crossfadeDuration: presetSettings.crossfadeDuration,
        crossfadeEasing: presetSettings.crossfadeEasing,
      },
      ui: {
        presetsButtonConfig: presetSettings.presetsButtonConfig,
      },
    };
  }

  if (!presetSettings.wallpaper && presetSettings.current) {
    return {
      wallpaper: normalizeWallpaperCurrentShape(presetSettings),
      ribbon: presetSettings.ribbon || {},
      time: presetSettings.time || {},
      overlay: presetSettings.overlay || {},
      ui: presetSettings.ui || {},
      dock: presetSettings.dock,
      appearanceBySpace: presetSettings.appearanceBySpace,
    };
  }

  if (presetSettings.wallpaper) {
    presetSettings = {
      ...presetSettings,
      wallpaper: normalizeWallpaperCurrentShape(presetSettings.wallpaper),
    };
  }

  return presetSettings;
}

/**
 * Import downloaded community preset(s) into local storage.
 * @returns {Promise<{ imported: number, errors: string[], skippedMax?: boolean }>}
 */
export async function importCommunityPresetFlow(presetData, { getPresets, setPresets, savePresetsToBackend }) {
  const presetsToImport = Array.isArray(presetData) ? presetData : [presetData];
  const result = { imported: 0, errors: [], skippedMax: false };

  for (let index = 0; index < presetsToImport.length; index++) {
    const preset = presetsToImport[index];
    if (!preset?.settings) {
      console.warn('[importCommunityPresetFlow] Skipping preset without settings:', preset?.name);
      result.errors.push(`Skipped “${preset?.name || 'preset'}”: missing settings.`);
      continue;
    }
    let presetSettings = preset.settings;

    if (presetSettings && typeof presetSettings === 'object') {
      presetSettings = normalizeCommunitySettings(presetSettings);
    }

    if (preset.wallpaper?.data) {
      try {
        const wd = preset.wallpaper.data;
        if (wd instanceof ArrayBuffer || wd.byteLength > 0) {
          const uint8Array = new Uint8Array(wd);
          const binaryString = Array.from(uint8Array, (byte) => String.fromCharCode(byte)).join('');
          const base64Data = btoa(binaryString);
          const fileName = preset.wallpaper.fileName || `community-wallpaper-${Date.now()}.jpg`;
          const mimeType = preset.wallpaper.mimeType || 'image/jpeg';

          if (window.api?.wallpapers?.saveFile) {
            const saveResult = await window.api.wallpapers.saveFile({
              filename: fileName,
              data: base64Data,
              mimeType,
            });

            if (saveResult.success && presetSettings) {
              if (!presetSettings.wallpaper || typeof presetSettings.wallpaper !== 'object') {
                presetSettings.wallpaper = {};
              }
              presetSettings.wallpaper = normalizeWallpaperCurrentShape(presetSettings.wallpaper, {
                url: saveResult.url,
                name: fileName,
                mimeType,
                source: 'community',
              });
            }
          }
        }
      } catch (error) {
        console.error(`[importCommunityPresetFlow] Wallpaper error preset ${index}:`, error);
        result.errors.push(`Wallpaper save failed for “${preset.name}”.`);
      }
    } else if (presetSettings?.wallpaper) {
      presetSettings.wallpaper = normalizeWallpaperCurrentShape(presetSettings.wallpaper);
    }

    const convertedPreset = {
      id: createPresetId(),
      name: preset.name,
      data: presetSettings,
      captureScope: PRESET_SCOPE_VISUAL,
      includesHomeChannels: false,
      shareable: true,
      timestamp: new Date().toISOString(),
      isCommunity: true,
      communityId: preset.id,
      communityRootId: preset.rootPresetId || preset.parentPresetId || preset.id,
      communityVersion: preset.version || 1,
    };

    const updated = [...getPresets(), convertedPreset];
    setPresets(updated);
    await savePresetsToBackend(updated);
    result.imported += 1;
  }

  return result;
}
