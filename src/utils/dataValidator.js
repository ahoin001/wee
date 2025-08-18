import { performanceUtils } from './usePerformanceMonitor.jsx';

// Data validation utilities
export class DataValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  // Clear validation state
  clear() {
    this.errors = [];
    this.warnings = [];
  }

  // Add validation error
  addError(field, message, value = null) {
    this.errors.push({
      field,
      message,
      value,
      timestamp: Date.now()
    });
  }

  // Add validation warning
  addWarning(field, message, value = null) {
    this.warnings.push({
      field,
      message,
      value,
      timestamp: Date.now()
    });
  }

  // Get validation results
  getResults() {
    return {
      isValid: this.errors.length === 0,
      errors: [...this.errors],
      warnings: [...this.warnings],
      errorCount: this.errors.length,
      warningCount: this.warnings.length
    };
  }

  // Validate settings object
  validateSettings(settings) {
    return performanceUtils.measure('validateSettings', () => {
      this.clear();

      if (!settings || typeof settings !== 'object') {
        this.addError('settings', 'Settings must be an object');
        return this.getResults();
      }

      // Validate time settings
      if (settings.timeColor !== undefined) {
        this.validateColor('timeColor', settings.timeColor);
      }
      if (settings.timeFormat24hr !== undefined) {
        this.validateBoolean('timeFormat24hr', settings.timeFormat24hr);
      }
      if (settings.enableTimePill !== undefined) {
        this.validateBoolean('enableTimePill', settings.enableTimePill);
      }
      if (settings.timePillBlur !== undefined) {
        this.validateNumber('timePillBlur', settings.timePillBlur, 0, 20);
      }
      if (settings.timePillOpacity !== undefined) {
        this.validateNumber('timePillOpacity', settings.timePillOpacity, 0, 1);
      }

      // Validate ribbon settings
      if (settings.ribbonColor !== undefined) {
        this.validateColor('ribbonColor', settings.ribbonColor);
      }
      if (settings.ribbonGlowColor !== undefined) {
        this.validateColor('ribbonGlowColor', settings.ribbonGlowColor);
      }
      if (settings.ribbonGlowStrength !== undefined) {
        this.validateNumber('ribbonGlowStrength', settings.ribbonGlowStrength, 0, 100);
      }
      if (settings.ribbonGlowStrengthHover !== undefined) {
        this.validateNumber('ribbonGlowStrengthHover', settings.ribbonGlowStrengthHover, 0, 100);
      }

      // Validate general settings
      if (settings.channelAutoFadeTimeout !== undefined) {
        this.validateNumber('channelAutoFadeTimeout', settings.channelAutoFadeTimeout, 0, 10000);
      }
      if (settings.startOnBoot !== undefined) {
        this.validateBoolean('startOnBoot', settings.startOnBoot);
      }
      if (settings.immersivePip !== undefined) {
        this.validateBoolean('immersivePip', settings.immersivePip);
      }
      if (settings.showDock !== undefined) {
        this.validateBoolean('showDock', settings.showDock);
      }
      if (settings.classicMode !== undefined) {
        this.validateBoolean('classicMode', settings.classicMode);
      }
      if (settings.glassWiiRibbon !== undefined) {
        this.validateBoolean('glassWiiRibbon', settings.glassWiiRibbon);
      }
      if (settings.glassOpacity !== undefined) {
        this.validateNumber('glassOpacity', settings.glassOpacity, 0, 1);
      }
      if (settings.glassBlur !== undefined) {
        this.validateNumber('glassBlur', settings.glassBlur, 0, 50);
      }
      if (settings.glassBorderOpacity !== undefined) {
        this.validateNumber('glassBorderOpacity', settings.glassBorderOpacity, 0, 1);
      }
      if (settings.glassShineOpacity !== undefined) {
        this.validateNumber('glassShineOpacity', settings.glassShineOpacity, 0, 1);
      }
      if (settings.animatedOnHover !== undefined) {
        this.validateBoolean('animatedOnHover', settings.animatedOnHover);
      }
      if (settings.startInFullscreen !== undefined) {
        this.validateBoolean('startInFullscreen', settings.startInFullscreen);
      }
      if (settings.useCustomCursor !== undefined) {
        this.validateBoolean('useCustomCursor', settings.useCustomCursor);
      }

      return this.getResults();
    });
  }

  // Validate wallpaper settings
  validateWallpaperSettings(wallpaperSettings) {
    return performanceUtils.measure('validateWallpaperSettings', () => {
      this.clear();

      if (!wallpaperSettings || typeof wallpaperSettings !== 'object') {
        this.addError('wallpaperSettings', 'Wallpaper settings must be an object');
        return this.getResults();
      }

      if (wallpaperSettings.wallpaperOpacity !== undefined) {
        this.validateNumber('wallpaperOpacity', wallpaperSettings.wallpaperOpacity, 0, 1);
      }
      if (wallpaperSettings.cycleWallpapers !== undefined) {
        this.validateBoolean('cycleWallpapers', wallpaperSettings.cycleWallpapers);
      }
      if (wallpaperSettings.cycleInterval !== undefined) {
        this.validateNumber('cycleInterval', wallpaperSettings.cycleInterval, 1, 3600);
      }
      if (wallpaperSettings.cycleAnimation !== undefined) {
        this.validateEnum('cycleAnimation', wallpaperSettings.cycleAnimation, [
          'fade', 'slide', 'zoom', 'ken-burns', 'dissolve', 'wipe'
        ]);
      }
      if (wallpaperSettings.crossfadeDuration !== undefined) {
        this.validateNumber('crossfadeDuration', wallpaperSettings.crossfadeDuration, 0.1, 10);
      }
      if (wallpaperSettings.crossfadeEasing !== undefined) {
        this.validateEnum('crossfadeEasing', wallpaperSettings.crossfadeEasing, [
          'ease-out', 'ease-in', 'ease-in-out', 'linear'
        ]);
      }
      if (wallpaperSettings.slideRandomDirection !== undefined) {
        this.validateBoolean('slideRandomDirection', wallpaperSettings.slideRandomDirection);
      }
      if (wallpaperSettings.slideDuration !== undefined) {
        this.validateNumber('slideDuration', wallpaperSettings.slideDuration, 0.1, 10);
      }
      if (wallpaperSettings.slideEasing !== undefined) {
        this.validateEnum('slideEasing', wallpaperSettings.slideEasing, [
          'ease-out', 'ease-in', 'ease-in-out', 'linear'
        ]);
      }

      // Validate wallpaper arrays
      if (wallpaperSettings.savedWallpapers !== undefined) {
        this.validateWallpaperArray('savedWallpapers', wallpaperSettings.savedWallpapers);
      }
      if (wallpaperSettings.likedWallpapers !== undefined) {
        this.validateWallpaperArray('likedWallpapers', wallpaperSettings.likedWallpapers);
      }

      return this.getResults();
    });
  }

  // Validate channel data
  validateChannelData(channelData) {
    return performanceUtils.measure('validateChannelData', () => {
      this.clear();

      if (!channelData || typeof channelData !== 'object') {
        this.addError('channelData', 'Channel data must be an object');
        return this.getResults();
      }

      // Validate channels object
      if (channelData.channels) {
        if (typeof channelData.channels !== 'object') {
          this.addError('channels', 'Channels must be an object');
        } else {
          Object.entries(channelData.channels).forEach(([channelId, channelConfig]) => {
            this.validateChannelConfig(channelId, channelConfig);
          });
        }
      }

      // Validate channel settings
      if (channelData.settings) {
        if (typeof channelData.settings !== 'object') {
          this.addError('channelSettings', 'Channel settings must be an object');
        }
      }

      return this.getResults();
    });
  }

  // Validate individual channel config
  validateChannelConfig(channelId, config) {
    if (!config || typeof config !== 'object') {
      this.addError(`channels.${channelId}`, 'Channel config must be an object');
      return;
    }

    // Validate required fields
    if (config.type !== undefined) {
      this.validateEnum(`channels.${channelId}.type`, config.type, [
        'media', 'app', 'url', 'folder', 'steam', 'spotify'
      ]);
    }

    if (config.title !== undefined && typeof config.title !== 'string') {
      this.addError(`channels.${channelId}.title`, 'Title must be a string');
    }

    if (config.path !== undefined && typeof config.path !== 'string') {
      this.addError(`channels.${channelId}.path`, 'Path must be a string');
    }

    if (config.media !== undefined && typeof config.media !== 'string') {
      this.addError(`channels.${channelId}.media`, 'Media must be a string');
    }

    // Validate optional fields
    if (config.hoverSound !== undefined && typeof config.hoverSound !== 'string') {
      this.addError(`channels.${channelId}.hoverSound`, 'Hover sound must be a string');
    }

    if (config.asAdmin !== undefined) {
      this.validateBoolean(`channels.${channelId}.asAdmin`, config.asAdmin);
    }
  }

  // Validate preset data
  validatePresetData(presetData) {
    return performanceUtils.measure('validatePresetData', () => {
      this.clear();

      if (!presetData || typeof presetData !== 'object') {
        this.addError('presetData', 'Preset data must be an object');
        return this.getResults();
      }

      // Validate required fields
      if (!presetData.name || typeof presetData.name !== 'string') {
        this.addError('name', 'Preset name is required and must be a string');
      }

      if (presetData.timestamp !== undefined && typeof presetData.timestamp !== 'number') {
        this.addError('timestamp', 'Timestamp must be a number');
      }

      if (presetData.version !== undefined && typeof presetData.version !== 'string') {
        this.addError('version', 'Version must be a string');
      }

      // Validate data object
      if (presetData.data) {
        const settingsValidation = this.validateSettings(presetData.data);
        if (!settingsValidation.isValid) {
          this.errors.push(...settingsValidation.errors);
          this.warnings.push(...settingsValidation.warnings);
        }
      }

      // Validate channel data if present
      if (presetData.data?.channelData) {
        const channelValidation = this.validateChannelData(presetData.data.channelData);
        if (!channelValidation.isValid) {
          this.errors.push(...channelValidation.errors);
          this.warnings.push(...channelValidation.warnings);
        }
      }

      return this.getResults();
    });
  }

  // Validate color value
  validateColor(field, value) {
    if (typeof value !== 'string') {
      this.addError(field, 'Color must be a string');
      return;
    }

    // Check for valid color formats
    const colorRegex = /^(#[0-9A-Fa-f]{3,6}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)|hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\))$/;
    
    if (!colorRegex.test(value)) {
      this.addError(field, `Invalid color format: ${value}`);
    }
  }

  // Validate number value
  validateNumber(field, value, min = null, max = null) {
    if (typeof value !== 'number' || isNaN(value)) {
      this.addError(field, 'Value must be a valid number');
      return;
    }

    if (min !== null && value < min) {
      this.addError(field, `Value must be at least ${min}`);
    }

    if (max !== null && value > max) {
      this.addError(field, `Value must be at most ${max}`);
    }
  }

  // Validate boolean value
  validateBoolean(field, value) {
    if (typeof value !== 'boolean') {
      this.addError(field, 'Value must be a boolean');
    }
  }

  // Validate enum value
  validateEnum(field, value, allowedValues) {
    if (!allowedValues.includes(value)) {
      this.addError(field, `Value must be one of: ${allowedValues.join(', ')}`);
    }
  }

  // Validate wallpaper array
  validateWallpaperArray(field, wallpapers) {
    if (!Array.isArray(wallpapers)) {
      this.addError(field, 'Wallpapers must be an array');
      return;
    }

    wallpapers.forEach((wallpaper, index) => {
      if (!wallpaper || typeof wallpaper !== 'object') {
        this.addError(`${field}[${index}]`, 'Wallpaper must be an object');
        return;
      }

      if (wallpaper.url !== undefined && typeof wallpaper.url !== 'string') {
        this.addError(`${field}[${index}].url`, 'Wallpaper URL must be a string');
      }

      if (wallpaper.name !== undefined && typeof wallpaper.name !== 'string') {
        this.addError(`${field}[${index}].name`, 'Wallpaper name must be a string');
      }

      if (wallpaper.type !== undefined && typeof wallpaper.type !== 'string') {
        this.addError(`${field}[${index}].type`, 'Wallpaper type must be a string');
      }
    });
  }

  // Validate URL
  validateUrl(field, url) {
    if (typeof url !== 'string') {
      this.addError(field, 'URL must be a string');
      return;
    }

    try {
      new URL(url);
    } catch (error) {
      this.addError(field, `Invalid URL format: ${url}`);
    }
  }

  // Validate file path
  validateFilePath(field, path) {
    if (typeof path !== 'string') {
      this.addError(field, 'File path must be a string');
      return;
    }

    // Basic path validation (can be enhanced for specific OS)
    if (path.length === 0) {
      this.addError(field, 'File path cannot be empty');
    }

    // Check for invalid characters (basic check)
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(path)) {
      this.addError(field, 'File path contains invalid characters');
    }
  }
}

// Create singleton instance
const dataValidator = new DataValidator();

// Export utility functions
export const validateSettings = (settings) => dataValidator.validateSettings(settings);
export const validateWallpaperSettings = (wallpaperSettings) => dataValidator.validateWallpaperSettings(wallpaperSettings);
export const validateChannelData = (channelData) => dataValidator.validateChannelData(channelData);
export const validatePresetData = (presetData) => dataValidator.validatePresetData(presetData);

// Export the validator instance
export default dataValidator;
