# Immersive Sound Mode (Listening Stage)

First-class **Listening Stage** for Now Playing. Full controls live in **Settings → Now Playing, Steam & Widgets → Listening Stage**. A compact copy stays in **Edit Home → Now Playing → Looks**. Default **on**; passive takeover stays opt-in.

## Entry

- Click album art on the Now Playing widget (hero or inline)
- Command palette: Enter / Exit Listening Stage
- Looks: Enter Listening Stage button
- Optional passive takeover after `idleDelaySec` of no clicks or keys while music plays
- **Edit** on the stage opens settings without leaving the stage

## Exit

- Click outside playback controls (dim / cover / empty stage)
- Escape
- Exit button
- Mouse wheel
- Space switch or Home page change
- Opening the command palette, or a channel configure modal
- Settings and Edit Home stay open over the stage so blur, darken, and wait can be changed live

## Prefs (`ui.immersiveSoundMode`)

- `enabled` (default `true`)
- `intensity`: calm | focus | club (glow, cover size, motion — not blur or darken)
- `autoIdle` (default `false`)
- `idleDelaySec` (default `20`, range 5–180)
- `coverBackdrop`
- `overlayBlurPx` (default `24`, range 0–48)
- `boardDim` (default `0.78`, range 0.12–0.92) — overlay darken

Session flag `ui.immersiveSoundModeActive` is transient (`false` | `'manual'` | `'auto'`).
