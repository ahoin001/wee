import { useCallback } from 'react';
import { useSettings, useChannels, useWallpapers, useSounds, useRibbonSettings, useTimeSettings, useChannelSettings } from './dataAccess';
import { performanceUtils } from './usePerformanceMonitor.jsx';

// Advanced preset management hook
export const usePresetManager = () => {
  const { settings, updateSetting } = useSettings();
  const { channels, updateChannel, clearChannels } = useChannels();
  const { wallpapers, updateWallpaperSetting } = useWallpapers();
  const { sounds, updateSoundSetting } = useSounds();
  const { ribbonSettings, updateRibbonSetting } = useRibbonSettings();
  const { timeSettings, updateTimeSetting } = useTimeSettings();
  const { channelSettings, updateChannelSetting } = useChannelSettings();

  // Apply a preset to the current app state
  const applyPreset = useCallback(async (preset) => {
    return performanceUtils.measureAsync('applyPreset', async () => {
      console.log('[PresetManager] Applying preset:', preset.name);
      
      try {
        const data = preset.data || preset.settings || {};
        
        // Apply time settings
        if (data.timeColor !== undefined) {
          updateTimeSetting('color', data.timeColor);
        }
        if (data.enableTimePill !== undefined) {
          updateTimeSetting('enablePill', data.enableTimePill);
        }
        if (data.timePillBlur !== undefined) {
          updateTimeSetting('pillBlur', data.timePillBlur);
        }
        if (data.timePillOpacity !== undefined) {
          updateTimeSetting('pillOpacity', data.timePillOpacity);
        }

        // Apply ribbon settings
        if (data.ribbonColor !== undefined) {
          updateRibbonSetting('ribbonColor', data.ribbonColor);
        }
        if (data.ribbonGlowColor !== undefined) {
          updateRibbonSetting('ribbonGlowColor', data.ribbonGlowColor);
        }
        if (data.ribbonGlowStrength !== undefined) {
          updateRibbonSetting('ribbonGlowStrength', data.ribbonGlowStrength);
        }
        if (data.ribbonGlowStrengthHover !== undefined) {
          updateRibbonSetting('ribbonGlowStrengthHover', data.ribbonGlowStrengthHover);
        }
        if (data.recentRibbonColors !== undefined) {
          updateRibbonSetting('recentRibbonColors', data.recentRibbonColors);
        }
        if (data.recentRibbonGlowColors !== undefined) {
          updateRibbonSetting('recentRibbonGlowColors', data.recentRibbonGlowColors);
        }
        if (data.ribbonButtonConfigs !== undefined) {
          updateRibbonSetting('ribbonButtonConfigs', data.ribbonButtonConfigs);
        }

        // Apply general settings
        if (data.channelAutoFadeTimeout !== undefined) {
          updateSetting('channelAutoFadeTimeout', data.channelAutoFadeTimeout);
        }
        if (data.presetsButtonConfig !== undefined) {
          updateSetting('presetsButtonConfig', data.presetsButtonConfig);
        }
        if (data.showPresetsButton !== undefined) {
          updateSetting('showPresetsButton', data.showPresetsButton);
        }
        if (data.startOnBoot !== undefined) {
          updateSetting('startOnBoot', data.startOnBoot);
        }
        if (data.immersivePip !== undefined) {
          updateSetting('immersivePip', data.immersivePip);
        }
        if (data.showDock !== undefined) {
          updateSetting('showDock', data.showDock);
        }
        if (data.classicMode !== undefined) {
          updateSetting('classicMode', data.classicMode);
        }
        if (data.glassWiiRibbon !== undefined) {
          updateSetting('glassWiiRibbon', data.glassWiiRibbon);
        }
        if (data.glassOpacity !== undefined) {
          updateSetting('glassOpacity', data.glassOpacity);
        }
        if (data.glassBlur !== undefined) {
          updateSetting('glassBlur', data.glassBlur);
        }
        if (data.glassBorderOpacity !== undefined) {
          updateSetting('glassBorderOpacity', data.glassBorderOpacity);
        }
        if (data.glassShineOpacity !== undefined) {
          updateSetting('glassShineOpacity', data.glassShineOpacity);
        }
        if (data.animatedOnHover !== undefined) {
          updateSetting('animatedOnHover', data.animatedOnHover);
        }
        if (data.startInFullscreen !== undefined) {
          updateSetting('startInFullscreen', data.startInFullscreen);
        }
        if (data.useCustomCursor !== undefined) {
          updateSetting('useCustomCursor', data.useCustomCursor);
        }

        // Apply wallpaper settings
        if (data.wallpaper !== undefined) {
          updateWallpaperSetting('wallpaper', data.wallpaper);
        }
        if (data.wallpaperOpacity !== undefined) {
          updateWallpaperSetting('wallpaperOpacity', data.wallpaperOpacity);
        }
        if (data.cycleWallpapers !== undefined) {
          updateWallpaperSetting('cycleWallpapers', data.cycleWallpapers);
        }
        if (data.cycleInterval !== undefined) {
          updateWallpaperSetting('cycleInterval', data.cycleInterval);
        }
        if (data.cycleAnimation !== undefined) {
          updateWallpaperSetting('cycleAnimation', data.cycleAnimation);
        }
        if (data.crossfadeDuration !== undefined) {
          updateWallpaperSetting('crossfadeDuration', data.crossfadeDuration);
        }
        if (data.crossfadeEasing !== undefined) {
          updateWallpaperSetting('crossfadeEasing', data.crossfadeEasing);
        }
        if (data.slideRandomDirection !== undefined) {
          updateWallpaperSetting('slideRandomDirection', data.slideRandomDirection);
        }
        if (data.slideDuration !== undefined) {
          updateWallpaperSetting('slideDuration', data.slideDuration);
        }
        if (data.slideEasing !== undefined) {
          updateWallpaperSetting('slideEasing', data.slideEasing);
        }
        if (data.savedWallpapers !== undefined) {
          updateWallpaperSetting('savedWallpapers', data.savedWallpapers);
        }
        if (data.likedWallpapers !== undefined) {
          updateWallpaperSetting('likedWallpapers', data.likedWallpapers);
        }

        // Apply sound settings
        if (data.soundSettings !== undefined) {
          updateSoundSetting('soundSettings', data.soundSettings);
        }

        // Apply channel data if present
        if (data.channelData) {
          console.log('[PresetManager] Applying channel data from preset');
          await applyChannelData(data.channelData);
        }

        // Apply sound library if present
        if (data.soundLibrary) {
          console.log('[PresetManager] Applying sound library from preset');
          await applySoundLibrary(data.soundLibrary);
        }

        console.log('[PresetManager] Preset applied successfully');
        return { success: true, message: 'Preset applied successfully' };
        
      } catch (error) {
        console.error('[PresetManager] Error applying preset:', error);
        return { success: false, error: error.message };
      }
    });
  }, [updateSetting, updateChannel, updateWallpaperSetting, updateSoundSetting, updateRibbonSetting, updateTimeSetting, updateChannelSetting]);

  // Apply channel data from preset
  const applyChannelData = useCallback(async (channelData) => {
    return performanceUtils.measureAsync('applyChannelData', async () => {
      try {
        // Clear existing channels first
        await clearChannels();
        
        // Apply new channel data
        if (channelData.channels) {
          for (const [channelId, channelConfig] of Object.entries(channelData.channels)) {
            await updateChannel(channelId, channelConfig);
          }
        }
        
        // Apply channel settings
        if (channelData.settings) {
          for (const [key, value] of Object.entries(channelData.settings)) {
            updateChannelSetting(key, value);
          }
        }
        
        console.log('[PresetManager] Channel data applied successfully');
      } catch (error) {
        console.error('[PresetManager] Error applying channel data:', error);
        throw error;
      }
    });
  }, [clearChannels, updateChannel, updateChannelSetting]);

  // Apply sound library from preset
  const applySoundLibrary = useCallback(async (soundLibrary) => {
    return performanceUtils.measureAsync('applySoundLibrary', async () => {
      try {
        // Update sound library through the sounds API
        if (window.api?.sounds?.setLibrary) {
          await window.api.sounds.setLibrary(soundLibrary);
        } else {
          // Fallback to direct setting update
          updateSoundSetting('soundLibrary', soundLibrary);
        }
        
        console.log('[PresetManager] Sound library applied successfully');
      } catch (error) {
        console.error('[PresetManager] Error applying sound library:', error);
        throw error;
      }
    });
  }, [updateSoundSetting]);

  // Create a preset from current app state
  const createPreset = useCallback(async (name, options = {}) => {
    return performanceUtils.measureAsync('createPreset', async () => {
      const {
        includeChannels = false,
        includeSounds = false,
        includeWallpapers = true,
        includeSettings = true
      } = options;

      try {
        const presetData = {
          name,
          timestamp: Date.now(),
          version: '1.0.0'
        };

        // Include settings
        if (includeSettings) {
          presetData.data = {
            ...settings,
            ...timeSettings,
            ...ribbonSettings,
            ...wallpapers,
            ...sounds
          };
        }

        // Include channels
        if (includeChannels) {
          presetData.data = {
            ...presetData.data,
            channelData: {
              channels: channels,
              settings: channelSettings
            }
          };
        }

        // Include sounds
        if (includeSounds) {
          try {
            const soundLibrary = await window.api?.sounds?.getLibrary?.();
            if (soundLibrary) {
              presetData.data.soundLibrary = soundLibrary;
            }
          } catch (error) {
            console.warn('[PresetManager] Could not include sound library:', error);
          }
        }

        console.log('[PresetManager] Preset created:', presetData);
        return presetData;
        
      } catch (error) {
        console.error('[PresetManager] Error creating preset:', error);
        throw error;
      }
    });
  }, [settings, timeSettings, ribbonSettings, wallpapers, sounds, channels, channelSettings]);

  // Save a preset
  const savePreset = useCallback(async (name, options = {}) => {
    return performanceUtils.measureAsync('savePreset', async () => {
      try {
        const presetData = await createPreset(name, options);
        
        // Save to presets API
        if (window.api?.presets?.save) {
          await window.api.presets.save(name, presetData);
        } else {
          // Fallback to settings API
          const currentPresets = settings.presets || {};
          currentPresets[name] = presetData;
          updateSetting('presets', currentPresets);
        }
        
        console.log('[PresetManager] Preset saved successfully:', name);
        return { success: true, preset: presetData };
        
      } catch (error) {
        console.error('[PresetManager] Error saving preset:', error);
        return { success: false, error: error.message };
      }
    });
  }, [createPreset, settings, updateSetting]);

  // Delete a preset
  const deletePreset = useCallback(async (name) => {
    return performanceUtils.measureAsync('deletePreset', async () => {
      try {
        // Delete from presets API
        if (window.api?.presets?.delete) {
          await window.api.presets.delete(name);
        } else {
          // Fallback to settings API
          const currentPresets = settings.presets || {};
          delete currentPresets[name];
          updateSetting('presets', currentPresets);
        }
        
        console.log('[PresetManager] Preset deleted successfully:', name);
        return { success: true };
        
      } catch (error) {
        console.error('[PresetManager] Error deleting preset:', error);
        return { success: false, error: error.message };
      }
    });
  }, [settings, updateSetting]);

  // Update an existing preset
  const updatePreset = useCallback(async (name, options = {}) => {
    return performanceUtils.measureAsync('updatePreset', async () => {
      try {
        // Check if preset exists
        const existingPresets = settings.presets || {};
        if (!existingPresets[name]) {
          throw new Error(`Preset "${name}" does not exist`);
        }
        
        // Create new preset data
        const presetData = await createPreset(name, options);
        
        // Update the preset
        existingPresets[name] = {
          ...existingPresets[name],
          ...presetData,
          lastUpdated: Date.now()
        };
        
        updateSetting('presets', existingPresets);
        
        console.log('[PresetManager] Preset updated successfully:', name);
        return { success: true, preset: existingPresets[name] };
        
      } catch (error) {
        console.error('[PresetManager] Error updating preset:', error);
        return { success: false, error: error.message };
      }
    });
  }, [createPreset, settings, updateSetting]);

  // Rename a preset
  const renamePreset = useCallback(async (oldName, newName) => {
    return performanceUtils.measureAsync('renamePreset', async () => {
      try {
        const currentPresets = settings.presets || {};
        
        if (!currentPresets[oldName]) {
          throw new Error(`Preset "${oldName}" does not exist`);
        }
        
        if (currentPresets[newName]) {
          throw new Error(`Preset "${newName}" already exists`);
        }
        
        // Move preset to new name
        currentPresets[newName] = {
          ...currentPresets[oldName],
          name: newName,
          lastRenamed: Date.now()
        };
        
        delete currentPresets[oldName];
        updateSetting('presets', currentPresets);
        
        console.log('[PresetManager] Preset renamed successfully:', oldName, '->', newName);
        return { success: true };
        
      } catch (error) {
        console.error('[PresetManager] Error renaming preset:', error);
        return { success: false, error: error.message };
      }
    });
  }, [settings, updateSetting]);

  // Import presets
  const importPresets = useCallback(async (importedPresets) => {
    return performanceUtils.measureAsync('importPresets', async () => {
      try {
        const currentPresets = settings.presets || {};
        const importedCount = 0;
        const skippedCount = 0;
        
        for (const [name, presetData] of Object.entries(importedPresets)) {
          if (currentPresets[name]) {
            // Skip existing presets
            skippedCount++;
            continue;
          }
          
          currentPresets[name] = {
            ...presetData,
            importedAt: Date.now()
          };
          importedCount++;
        }
        
        updateSetting('presets', currentPresets);
        
        console.log('[PresetManager] Presets imported successfully:', { importedCount, skippedCount });
        return { success: true, importedCount, skippedCount };
        
      } catch (error) {
        console.error('[PresetManager] Error importing presets:', error);
        return { success: false, error: error.message };
      }
    });
  }, [settings, updateSetting]);

  // Reorder presets
  const reorderPresets = useCallback(async (reorderedPresets) => {
    return performanceUtils.measureAsync('reorderPresets', async () => {
      try {
        const currentPresets = settings.presets || {};
        const newPresets = {};
        
        // Reorder based on the provided array
        reorderedPresets.forEach(name => {
          if (currentPresets[name]) {
            newPresets[name] = currentPresets[name];
          }
        });
        
        // Add any remaining presets that weren't in the reorder array
        Object.keys(currentPresets).forEach(name => {
          if (!newPresets[name]) {
            newPresets[name] = currentPresets[name];
          }
        });
        
        updateSetting('presets', newPresets);
        
        console.log('[PresetManager] Presets reordered successfully');
        return { success: true };
        
      } catch (error) {
        console.error('[PresetManager] Error reordering presets:', error);
        return { success: false, error: error.message };
      }
    });
  }, [settings, updateSetting]);

  // Export presets
  const exportPresets = useCallback(async (presetNames = null) => {
    return performanceUtils.measureAsync('exportPresets', async () => {
      try {
        const currentPresets = settings.presets || {};
        const presetsToExport = {};
        
        if (presetNames) {
          // Export specific presets
          presetNames.forEach(name => {
            if (currentPresets[name]) {
              presetsToExport[name] = currentPresets[name];
            }
          });
        } else {
          // Export all presets
          Object.assign(presetsToExport, currentPresets);
        }
        
        const exportData = {
          version: '1.0.0',
          exportedAt: Date.now(),
          presets: presetsToExport
        };
        
        console.log('[PresetManager] Presets exported successfully');
        return { success: true, data: exportData };
        
      } catch (error) {
        console.error('[PresetManager] Error exporting presets:', error);
        return { success: false, error: error.message };
      }
    });
  }, [settings]);

  // Get preset by name
  const getPreset = useCallback((name) => {
    const currentPresets = settings.presets || {};
    return currentPresets[name] || null;
  }, [settings]);

  // Get all presets
  const getAllPresets = useCallback(() => {
    return settings.presets || {};
  }, [settings]);

  return {
    // Core operations
    applyPreset,
    createPreset,
    savePreset,
    deletePreset,
    updatePreset,
    renamePreset,
    importPresets,
    reorderPresets,
    exportPresets,
    
    // Utility functions
    getPreset,
    getAllPresets,
    
    // Current state
    presets: settings.presets || {}
  };
};

export default usePresetManager;
