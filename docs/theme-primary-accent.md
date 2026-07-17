# Primary accent (Wii blue) — theme audit

## Single source of truth

| Layer | Role |
|--------|------|
| **CSS** | `:root` defines `--wii-blue`, `--wii-blue-hover`, `--wii-blue-active` and semantic aliases `--primary`, `--primary-hover`, `--primary-active` (see `src/styles/design-system.css`). |
| **Runtime** | `applyPrimaryAccentFromHex()` writes HSL **components** to `document.documentElement` so `hsl(var(--primary))` works everywhere. |
| **Resolver** | `resolveEffectiveAccent` (chrome) and `resolveRibbonPaintTarget` (ribbon body) share the same live-match precedence. |

## Live color precedence

Wallpaper Color Match and Now Playing Color Match are **mutually exclusive** in the UI
(enabling one turns the other off). Resolver still keeps a safe order if both ever end up on:

```
Spotify Match → Wallpaper match → Manual ribbon glow → Default blue
```

| Source | When it wins | Needs `dynamicRibbonColorEnabled`? |
|--------|----------------|-------------------------------------|
| Spotify Match | `ui.spotifyMatchEnabled` + album colors | No |
| Wallpaper match | `ui.wallpaperMatchEnabled` + ambient palette | No |
| Manual ribbon glow | Dock / Lock colors | **Yes** — only then glow drives `--primary` |
| Default | `#0099ff` | — |

Wallpaper / Spotify match paint the ribbon from the same seed as Effective accent
(`primary` then `accent` for wallpaper; `accent` then `primary` for Spotify), so the
Quick Menu swatch matches ribbon body + glow. Persist via **Lock this look**, **Save current look**, or a manual Dock color pick (which turns live match off).

## What updates with the effective accent

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

## Key files

| Concern | File |
|---------|------|
| Ribbon paint + Spotify/wallpaper | `src/utils/appearance/resolveEffectiveRibbonLook.js` |
| `--primary` resolver | `src/utils/theme/resolveEffectiveAccent.js` |
| Wallpaper ambient (no ribbon store thrash) | `src/hooks/useWallpaperAmbientColor.js` |
| Manual pick freezes live match | `src/utils/appearance/disableLiveMatchForManualAccent.js` |
