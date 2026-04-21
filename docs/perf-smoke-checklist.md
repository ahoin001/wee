# Performance Smoke Checklist

Run this checklist after changes to app shell, wallpaper transitions, ribbon, or floating widgets.

## Modes

1. Active window, low-power OFF
2. Active window, low-power ON
3. Background/unfocused, low-power OFF
4. Background/unfocused, low-power ON

## Checks

- `FloatingSpotifyWidget` visualizer updates smoothly when active and slows down in low-power mode.
- `FloatingSpotifyWidget` playback polling pauses when app is not active.
- `DockParticleSystem` runs while active, reduces intensity in low-power mode, and pauses when inactive.
- Wallpaper cycling does not trigger channel re-renders or UI stalls.
- Ribbon interactions remain responsive when toggling low-power mode.

## Automated

- Run `npm run test:smoke`.
- Run `npm run build`.
- Run `npm run test:settings-patch-merge`.

## PR smell checklist

- No new broad store subscriptions to full slices when only a few fields are needed.
- No new ad-hoc `setInterval` loops for UI polling; use `useActivityInterval`.
- No render-adjacent `getState()` loops when a selector-based subscription is expected.
- Large feature components move domain logic to focused hooks/components instead of growing monoliths.
