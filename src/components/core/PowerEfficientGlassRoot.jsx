import { usePowerEfficientGlassEffect } from '../../hooks/useAppShellEffects';

/**
 * Leaf host for the root `.wee-power-efficient` class so power-policy changes
 * (focus, battery, low-power) never re-render the App shell.
 */
function PowerEfficientGlassRoot() {
  usePowerEfficientGlassEffect();
  return null;
}

export default PowerEfficientGlassRoot;
