/**
 * UNUSED — not wired to Zustand `persist()` middleware.
 * Canonical prefs persistence is `unified-data.json` via
 * `useUnifiedSettingsPersistence` + `settingsPersistenceContract.js`.
 * Do not revive this as a second SSOT.
 */
export const CONSOLIDATED_STORE_PERSIST_NAME = 'consolidated-app-store';

export const partializeConsolidatedState = (state) => ({
  ui: state.ui,
  ribbon: state.ribbon,
  wallpaper: state.wallpaper,
  overlay: state.overlay,
  time: state.time,
  channels: state.channels,
  dock: state.dock,
  monitors: state.monitors,
  spotify: state.spotify,
  presets: state.presets,
  floatingWidgets: state.floatingWidgets,
});
