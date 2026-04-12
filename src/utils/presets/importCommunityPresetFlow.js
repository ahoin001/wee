import { SPOTIFY_MATCH_PRESET_NAME } from './spotifyMatchPreset';

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
      wallpaper: presetSettings,
      ribbon: presetSettings.ribbon || {},
      time: presetSettings.time || {},
      overlay: presetSettings.overlay || {},
      ui: presetSettings.ui || {},
    };
  }

  return presetSettings;
}

/**
 * Import downloaded community preset(s) into local storage.
 */
export async function importCommunityPresetFlow(presetData, { getPresets, setPresets, savePresetsToBackend }) {
  const presetsToImport = Array.isArray(presetData) ? presetData : [presetData];

  for (let index = 0; index < presetsToImport.length; index++) {
    const preset = presetsToImport[index];
    if (!preset?.settings) {
      console.warn('[importCommunityPresetFlow] Skipping preset without settings:', preset?.name);
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

            if (saveResult.success && presetSettings?.wallpaper) {
              presetSettings.wallpaper.url = saveResult.url;
              presetSettings.wallpaper.name = fileName;
            }
          }
        }
      } catch (error) {
        console.error(`[importCommunityPresetFlow] Wallpaper error preset ${index}:`, error);
      }
    }

    const convertedPreset = {
      name: preset.name,
      data: presetSettings,
      timestamp: new Date().toISOString(),
      isCommunity: true,
      communityId: preset.id,
      communityRootId: preset.rootPresetId || preset.parentPresetId || preset.id,
      communityVersion: preset.version || 1,
    };

    const customCount = getPresets().filter((p) => p.name !== SPOTIFY_MATCH_PRESET_NAME).length;
    if (customCount >= 5) {
      console.warn('[importCommunityPresetFlow] Max custom presets reached');
      return;
    }

    const updated = [...getPresets(), convertedPreset];
    setPresets(updated);
    await savePresetsToBackend(updated);
  }
}
