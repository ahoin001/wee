# Immersive Sound Mode (Listening Stage)

First-class **Listening Stage** for Now Playing. Controls live in **Edit Home → Now Playing → Looks**. Default **on**; auto-idle stays opt-in.

## Entry

- Click album art on the Now Playing widget (hero or inline)
- Command palette: Enter / Exit Listening Stage
- Looks: Enter Listening Stage button
- Optional auto-enter when Home idle reaches ambient/attract

## Exit

- Click outside playback controls (dim / cover / empty stage)
- Escape
- Exit button
- Mouse wheel
- Space switch or Home page change
- Opening settings, command palette, or arrange mode

## Prefs (`ui.immersiveSoundMode`)

- `enabled` (default `true`)
- `intensity`: calm | focus | club
- `autoIdle` (default `false`)
- `coverBackdrop`
- `boardDim`

Session flag `ui.immersiveSoundModeActive` is transient (`false` | `'manual'` | `'auto'`).
