# Scene FX Beta

Wallpaper Engine–inspired atmosphere for Wee’s living desktop.

**Off by default.** Master toggle (**Scene effects**) lives on **Settings → Surfaces → Atmosphere**. Each effect has its own toggle.

| Where | Controls |
|-------|----------|
| **Surfaces → Atmosphere** | Master, wallpaper parallax, scene light (vignette/shafts), cursor wake |
| **Beta** | Music bloom only (experimental / subtle) |

## Removability (whole feature)

1. Delete this folder: `src/features/sceneFxBeta/`
2. Remove the `// BETA: Scene FX` import + section from `src/components/settings/BetaSettingsTab.jsx`
3. Remove `SceneFxSurfacesSection` import + mount from `src/components/settings/WallpaperSettingsTab.jsx`
4. Remove the `// BETA: Scene FX` lazy mount block from `src/App.jsx`
5. Remove `ui.sceneFxBeta` from:
   - `src/utils/useConsolidatedAppStore.js` defaults / reset
   - `src/utils/store/settingsPersistenceContract.js` (`selectPersistedUi` + import)
6. Optional: remove the CSS-var transform on `.wallpaper-space-parallax` in `IsolatedWallpaperBackground.jsx` (harmless identity defaults if left)
7. Optional: remove `surfacesSegment` deep-link branch from `src/utils/settingsNavigation.js`

Do **not** need to touch: particle `WallpaperOverlay`, ribbon chrome FX, Spotify immersive, Immersive Sound Mode, ambient accent resolver.

## Removability (one effect)

| Effect | Delete | Also |
|--------|--------|------|
| Parallax | `effects/SceneFxParallax.jsx` | Unmount in `SceneFxBetaRoot.jsx`; drop from prefs + Surfaces section |
| Atmosphere (scene light) | `effects/SceneFxAtmosphere.jsx` + CSS block in `SceneFxBeta.css` | Same |
| Cursor wake | `effects/SceneFxCursorWake.jsx` | Same |
| Music bloom | `effects/SceneFxMusicBloom.jsx` | Unmount in root; drop from Beta section |

## Effects

- **Parallax** — soft cursor offset on the wallpaper shell (CSS vars)
- **Scene light** (store key `atmosphere`) — vignette + drifting light shafts
- **Cursor wake** — click/move ripples (event-driven RAF; resumes via `useRafResumeKick`)
- **Music bloom** — subtle scene wash while Now Playing is active (opt-in, Beta only)

## Leave / return

Decorative RAF effects use `src/hooks/useRafResumeKick.js` (visibility + focus) and must clear RAF handles on cancel. CSS-driven shafts/bloom restart animation on visibility / `shouldAnimate` rising edge.
