/**
 * Immersive Sound Mode (Beta) — public exports.
 * Delete this folder to remove the feature (see README.md).
 */

export {
  DEFAULT_IMMERSIVE_SOUND_MODE,
  IMMERSIVE_SOUND_INTENSITIES,
  IMMERSIVE_SOUND_INTENSITY_LOOK,
  normalizeImmersiveSoundMode,
  resolveImmersiveSoundLook,
} from './immersiveSoundModePrefs.js';

export {
  selectImmersiveSoundModePrefs,
  selectImmersiveSoundModeActive,
  enterImmersiveSoundMode,
  exitImmersiveSoundMode,
  toggleImmersiveSoundMode,
} from './immersiveSoundModeApi.js';

export { default as ImmersiveSoundModeController } from './ImmersiveSoundModeController.jsx';
export { default as ImmersiveSoundModeStage } from './ImmersiveSoundModeStage.jsx';
export { default as ImmersiveSoundModeSettingsSection } from './ImmersiveSoundModeSettingsSection.jsx';
