# Style Architecture Map

This document is the source-of-truth for where styling decisions should live.

## Core Rule

- Prefer design tokens and shared UI components over inline styles.
- If a style is reused or likely to change globally, put it in tokens/CSS classes.
- Keep runtime-only visuals (dynamic album-art colors, user-selected glass values) as CSS variable overrides, not ad hoc full style objects.

## Token Layers

- `src/styles/design-system.css`
  - Global semantic tokens (color, text, border, shadow, radius, glass).
  - Navigation token family (`--nav-*`, `--side-nav-*`).
  - Control token family (`--control-*`, `--toggle-*`).
  - Accent RGB helpers (`--accent-blue-rgb`, `--accent-cyan-rgb`, `--spotify-green-rgb`, `--spotify-green-secondary-rgb`).
- `src/ui/tokens.js`
  - JS-referenceable token metadata for component/config usage.
  - Mirrors key CSS variable families where runtime code needs references.

## Shared UI Primitives

- `src/ui/Text.jsx`
  - Typography scale + text semantic variants.
- `src/ui/WButton.jsx`
  - Core button variants + motion + shape.
- `src/ui/Card.jsx`
  - Shared card surfaces and Wii variants.
- `src/ui/WInput.jsx`, `src/ui/WSelect.jsx`, `src/ui/WToggle.jsx`, `src/ui/WRadioGroup.jsx`, `src/ui/Slider.jsx`
  - Unified controls using shared control/toggle tokens.
- `src/ui/ScrollArea.jsx`
  - Design-system scrollbar wrapper classes.

## Navigation Surfaces

- `src/components/PageNavigation.css`
- `src/components/WiiPageNavigation.css`
- `src/components/SimplePageNavigation.css`
- `src/components/SlideNavigation.css`
- `src/components/WiiSideNavigation.css`

All should consume `--nav-*` / `--side-nav-*` tokens for spacing, motion, glow, focus, and shell styling.

## Feature Surfaces (Tokenized)

- `src/components/ChannelModal.css`
  - Behavior-tab layout primitives and reusable utility classes.
- `src/components/FloatingSpotifyWidget.css`
  - Spotify shell variables and sidebar/status banner styling variables.
- `src/components/SettingsActionMenu.css`
  - Menu surface variables and cursor palette variables.
- `src/components/WiiRibbon.css`
  - Ribbon local vars that map to global semantic tokens.
- `src/components/DockEffectsModal.css`
  - Dock effects controls consume semantic + accent tokens.

## Dynamic Runtime Styling Pattern

When values are data-driven (album colors, user glass sliders):

1. Set CSS custom properties on a component root in JSX.
2. Let CSS classes consume those vars.
3. Avoid repeated inline style objects per child element.

Example pattern:

```css
.my-surface {
  background: var(--surface-bg);
  border-color: var(--surface-border);
}
```

```jsx
<div className="my-surface" style={{ "--surface-bg": dynamicBg, "--surface-border": dynamicBorder }} />
```

## Anti-Patterns To Avoid

- Repeating literal colors (`#0099ff`, `rgba(...)`) across multiple files.
- Inline `style={{ ... }}` for static layout/spacing/radius/shadows.
- Duplicating transition/easing/radius values across components.
- Local scrollbar styling when `scrollbar-soft`/`scrollbar-hidden` can be reused.
