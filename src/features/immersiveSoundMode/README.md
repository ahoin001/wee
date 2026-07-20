# Immersive Sound Mode (Beta)

Self-contained **Listening Stage** experiment. Enable it from **Settings → Beta**.

## Removability

To delete this feature without touching core Now Playing / Color Match / takeover:

1. Delete this folder: `src/features/immersiveSoundMode/`
2. Delete `src/components/settings/BetaSettingsTab.jsx`
3. Remove the `beta` settings tab entry from `src/utils/settingsRegistry.js`
4. Remove the `beta` mapping from `SettingsModal.jsx` and the export from `settings/index.js`
5. Remove the `// BETA: Immersive Sound Mode` block from `App.jsx`
6. Remove `ui.immersiveSoundMode` + `ui.immersiveSoundModeActive` from:
   - `src/utils/useConsolidatedAppStore.js` defaults / reset
   - `src/utils/store/settingsPersistenceContract.js` (`selectPersistedUi`)
7. Remove `--settings-tab-beta` from `src/styles/design-system.css` (optional)

Do **not** need to touch: `NowPlayingSlot`, `reconcileNowPlaying`, Spotify OAuth, Color Match, or legacy Spotify overlays.

## What it does

When enabled and music is playing, enters a full-screen Listening Stage:

- Blurred album-art backdrop (not a faint wash)
- Dimmed home board under a full-screen stage
- Large cover + track metadata + media-key transport
- Intensity presets: Calm / Focus / Club
- Optional auto-enter when Home idle reaches ambient/attract
