# Primary accent (Wii blue) — theme audit

## Single source of truth

| Layer | Role |
|--------|------|
| **CSS** | `:root` defines `--wii-blue`, `--wii-blue-hover`, `--wii-blue-active` and semantic aliases `--primary`, `--primary-hover`, `--primary-active` (see `src/styles/design-system.css`). |
| **Runtime** | `applyPrimaryAccentFromHex()` in `src/utils/theme/applyPrimaryAccentFromHex.js` writes HSL **components** (space-separated, no `hsl()`) to `document.documentElement` so `hsl(var(--primary))` works everywhere. |
| **User control** | **Settings → Ribbon → Accent / glow color** (`ribbonGlowColor`, default `#0099ff`) drives the same brand color as primary buttons, focus rings, borders, links, and tints — parallel to how dock themes own `dockAccentColor` for hardware chrome. |

## What updates with the ribbon accent

On change (and on theme light/dark toggle), the app sets:

- `--wii-blue` / `--wii-blue-hover` / `--wii-blue-active`
- `--primary` / `--primary-hover` / `--primary-active`
- `--border-accent`, `--text-accent`, `--link`, `--link-hover`
- `--surface-wii-tint` (light: airy wash; dark: muted wash)
- `--scrollbar-thumb-active`

## Tailwind

Use semantic utilities where possible:

- `bg-primary`, `hover:bg-primary-hover`, `border-primary`, `ring-primary`

Legacy `wii-blue` names remain valid and track the same values for backward compatibility.

## Audit notes (remaining drift)

These areas still use **hardcoded** hue or `wii-blue` explicitly; they are acceptable until migrated:

- **Dock** — `dockAccentColor` and Classic Dock themes are a **separate** system (physical plastic / SD card); intentionally not merged with UI primary.
- **Inline styles** — Some modals use `hsl(var(--wii-blue))` in class strings; they still follow runtime updates because `--wii-blue` is set with the accent.
- **Admin / system widgets** — Orange/purple brand tokens (`--admin-widget-*`, `--widget-system-info-*`) stay distinct for recognition.

## Future optional work

- Dedicated **“App accent”** setting in General (duplicate of glow) if ribbon and UI should diverge.
- **Preset** snapshots: include `ribbonGlowColor` explicitly when saving “full theme” presets (already partially present via ribbon snapshot).
