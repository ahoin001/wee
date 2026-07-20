# Scene FX Beta

Wallpaper Engine–inspired atmosphere for Wee’s living desktop. Enable from **Settings → Beta → Scene FX**.

**Off by default.** Master toggle gates the whole feature; each effect has its own toggle.

## Removability (whole feature)

1. Delete this folder: `src/features/sceneFxBeta/`
2. Remove the `// BETA: Scene FX` import + section from `src/components/settings/BetaSettingsTab.jsx`
3. Remove the `// BETA: Scene FX` lazy mount block from `src/App.jsx`
4. Remove `ui.sceneFxBeta` from:
   - `src/utils/useConsolidatedAppStore.js` defaults / reset
   - `src/utils/store/settingsPersistenceContract.js` (`selectPersistedUi` + import)
5. Optional: remove the CSS-var transform on `.wallpaper-space-parallax` in `IsolatedWallpaperBackground.jsx` (harmless identity defaults if left)

Do **not** need to touch: particle `WallpaperOverlay`, ribbon chrome FX, Spotify immersive, Immersive Sound Mode, ambient accent resolver.

## Removability (one effect)

| Effect | Delete | Also |
|--------|--------|------|
| Parallax | `effects/SceneFxParallax.jsx` | Unmount in `SceneFxBetaRoot.jsx`; drop `parallax` from prefs/catalog/settings |
| Atmosphere | `effects/SceneFxAtmosphere.jsx` + CSS block in `SceneFxBeta.css` | Same |
| Cursor wake | `effects/SceneFxCursorWake.jsx` | Same |
| Music bloom | `effects/SceneFxMusicBloom.jsx` | Same |

## Effects

- **Parallax** — soft cursor offset on the wallpaper shell (CSS vars)
- **Atmosphere** — vignette + drifting light shafts
- **Cursor wake** — click/move ripples (event-driven)
- **Music bloom** — subtle scene wash while Now Playing is active (opt-in)
