# Default Sounds for Wee

Bundled default audio for the Sounds settings tab (`Settings → Sounds`).

## Sources of truth

| Domain | Store |
|--------|--------|
| Enables / volumes / BGM loop + playlist mode | `settings.sounds` in unified-data (Zustand) |
| Catalog (files, per-track enable/volume/liked/order) | `savedSounds.json` via `api.sounds.*` |
| Per-channel hover override | Channel config `hoverSound` |

Do **not** store BGM enable/loop/playlist flags in the library JSON.

## How to add default sounds

1. Place files here with these names (optional packaging assets):
   - `wii-click-1.mp3` — channel click
   - `wii-hover-1.mp3` — channel hover
   - `wii-menu-music.mp3` — background music
2. Supported formats: MP3, WAV, OGG, M4A, AAC
3. Size guidance: click/hover ~50–200KB; BGM ~1–5MB

## Runtime

On first launch the main process copies defaults into the user sounds directory and seeds the library catalog. Manage enablement, volume, and playlist order in **Settings → Sounds**. Channel-specific hover overrides are configured on each channel’s Behavior tab.

## Packaging

Ship the listed `.mp3` files with the app resources (`public/sounds`) so first-run copy succeeds. Missing binaries are logged; the catalog entry may still exist without a playable file.
