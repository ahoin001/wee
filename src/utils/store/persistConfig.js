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
