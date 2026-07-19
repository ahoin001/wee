/**
 * Single manual-cycle entry point so Settings / App / debug bindings can advance
 * liked wallpapers without mounting a second `useWallpaperCycling` engine.
 */

let manualCycleHandler = null;

/**
 * @param {(() => void) | null} handler
 * @returns {() => void} unregister
 */
export function registerWallpaperCycleManual(handler) {
  manualCycleHandler = typeof handler === 'function' ? handler : null;
  return () => {
    if (manualCycleHandler === handler) {
      manualCycleHandler = null;
    }
  };
}

export function requestWallpaperCycleManual() {
  if (typeof manualCycleHandler === 'function') {
    manualCycleHandler();
  }
}
