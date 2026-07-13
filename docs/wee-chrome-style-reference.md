# Wee Chrome Style & Motion Reference

A practical reference for building UI that feels like the **space rail**, **side nav buttons**, and **Home page indicator** — the gooey glass chrome that peeks, morphs, and settles with shared physics.

Use this when designing or implementing new chrome, overlays, controls, or playful surfaces. For token *placement* (where CSS lives), also see [style-architecture-map.md](./style-architecture-map.md). Agent guardrails live in `AGENTS.md` and `.cursor/rules/`.

---

## 1. What this style *is*

These surfaces share one design language:

| Quality | How it shows up |
|--------|------------------|
| **Glass mass** | Thick border (`border-4`), frosted fill, soft drop shadow, optional floor blur |
| **Compact → reveal** | Idle is a small nub/disc; hover/focus expands footprint (not just opacity) |
| **Spring, not tween** | Open is bouncier (`pillOpen`); close is heavier (`pillClose`) |
| **One clock per domain** | Peeks, presses, modals, and collapses each own a shared timing family |
| **Accent, not neon** | Primary hue via soft glow (`--shadow-hover-glow`); no hard rings |
| **Interruptible** | Hover off mid-expand reverses cleanly; reduced-motion snaps short |
| **Presence owns exit** | Closing chrome stays mounted until the exit spring finishes |

**Feel target:** friendly Wii-era physicality — soft overshoot, clear weight, readable idle state — without cartoon chaos or dashboard chrome.

---

## 2. Canonical surfaces (study these first)

| Surface | File | Morph helper | Axis |
|---------|------|--------------|------|
| Space rail | `src/components/spaces/WeeGooeySpacePill.jsx` | `createWeeShellRailContainerVariants` | Vertical (height) |
| Edge page nav | `src/ui/wee/WeeGooeySideNavButton.jsx` | `createWeeSideNavPeekVariants` + `createWeeSideNavShellMotion` | Horizontal (width) + idle tuck/peek |
| Home page dots | `src/components/home-grid/HomePageIndicator.jsx` | `createWeeSideNavPeekVariants` | Horizontal (width) |

Shared building blocks:

| Piece | Role |
|-------|------|
| `WeeGlassPill` | Canonical glass shell (`--wee-pill-*`, `backdrop-blur-xl`, `border-4`) |
| `WeePillFloorShadow` | Soft “mass on the floor” blur that stretches when expanded |
| `WeeGooeyIconButton` | Icon press inside morph shells (`WEE_GOOEY_ICON_PRESS` + `press` intent) |
| `useWeeMotion()` | Resolved `pillOpen` / `pillClose` / `pillSurfacePress` (respects reduced motion) |
| `useMotionFeedback()` | User prefs + OS reduced-motion gates |

**Rule:** New compact→expand chrome extends these helpers. Do not invent parallel width/height springs.

---

## 3. Pill Morph Reveal (the pattern)

### Recipe

```jsx
const { pillOpen, pillClose } = useWeeMotion();
const reducedMotion = Boolean(osReduced || !gooey?.enabled);
const revealed = (hovered || focused) && !disabled;

const variants = createWeeSideNavPeekVariants(sideOrNull, {
  compactSize: 56,       // idle footprint
  expandedWidth: 156,    // open footprint
  expandedHeight: 64,
  pillClose,
  pillOpen,
  reducedMotion,
});

<div className="relative">
  <WeePillFloorShadow expanded={revealed} reducedMotion={reducedMotion} />
  <WeeGlassPill
    motion
    initial={false}
    animate={revealed ? 'open' : 'closed'}
    variants={variants}
    className="relative z-10 overflow-hidden rounded-full"
  >
    {/* compact content when closed; richer content when open */}
  </WeeGlassPill>
</div>
```

### Vertical twin (space rail)

Use `createWeeShellRailContainerVariants(expandedHeight, pillClose, pillOpen)` — closed ≈ 80×80 / r40, open ≈ width 90 / taller height / r45.

### Idle life (side nav only)

`createWeeSideNavShellMotion` adds a tucked idle + soft repeating peek bounce (`PLAYFUL_AMPLITUDE.sideNavIdleTuckPx` / `sideNavIdlePeekPx`). Morph open still lives on the glass pill; the shell only handles on/off-screen settle.

### Content swap inside the pill

- Prefer keeping structure simple: compact label/icon ↔ expanded controls.
- Stagger children with `createWeeShellRailItemVariants` when a list appears on open.
- Icon presses use `WeeGooeyIconButton`, not ad-hoc `whileTap` scales.

---

## 4. Motion system

### Ownership split

| Concern | Source of truth |
|---------|-----------------|
| Spring timing / intents | `src/design/weeMotion.js` → `WEE_SPRINGS`, `createWeeTransition(intent)` |
| Amplitudes (px, scale, tuck) | `src/design/playfulMotion.js` → `PLAYFUL_AMPLITUDE` |
| Content height morph (forms, settings) | CSS `--wee-collapse-*` via `WeeContentCollapse` / friends |
| User + OS gates | `useMotionFeedback()` |
| Continuous FX / RAF | `useAnimationActivity` (visibility, focus, low-power) |

### Core spring family (chrome)

| Key | Character | Typical use |
|-----|-----------|-------------|
| `pillOpen` | Stiffer, livelier (400 / 20 / 0.8) | Expand, modal open, status enter |
| `pillClose` | Heavier settle (300 / 25 / 1) | Collapse, modal close, floor shadow |
| `pillSurfacePress` | Soft press release | Hover/tap chrome |
| `railNudge` | Gentle settle | Side-nav tuck, classic peek |

Prefer **semantic intents** over raw spring keys:

```js
createWeeTransition('press')
createWeeTransition('pillOpen')
createWeeTransition('modalPanelClose')
createWeeTransition('tab')
```

### Intent cheat sheet

| Intent | When |
|--------|------|
| `press` / `hover` | Icon / surface tap feedback |
| `pillOpen` / `pillClose` | Morph footprint |
| `modalPanelOpen` / `modalPanelClose` | Dialog shell (same family as pills) |
| `tab` | Same-footprint view swap |
| `sheet` | Floating gooey panels |
| `hubEntrance` / `hubRevisit` / `homeEntrance` | Space entry choreography |
| `railNudge` | Soft chrome nudge |
| `channelPageFlip` | Page pan (duration-locked to layout clock) |

### Amplitudes (do not hardcode)

```js
PLAYFUL_AMPLITUDE.pressScale      // ~0.93
PLAYFUL_AMPLITUDE.hoverScale     // ~1.03
PLAYFUL_AMPLITUDE.hoverLiftY     // ~-1.5
PLAYFUL_AMPLITUDE.sideNavIdleTuckPx  // 40
PLAYFUL_AMPLITUDE.sideNavIdlePeekPx  // 14
```

Icon chrome inside rails uses `WEE_GOOEY_ICON_PRESS` (hover ~1.12, tap ~0.92, playful rotate on ghost rows).

### Content resize (not Pill Morph)

When **layout height** changes (settings sections, toggle→fields):

| Need | Use |
|------|-----|
| Accordion + icon header | `WeeSettingsCollapsibleSection` |
| Controlled show/hide | `WeeContentCollapse` |
| Toggle reveals fields | `WeeRevealWhen` / `SettingsToggleFieldCard` |
| Sibling gap with collapse | `WeeMorphStack` |
| Same footprint swap | `AnimatePresence` + `tab` transition |

Animate **space** (`0fr → 1fr`), not opacity alone. One `--wee-collapse-*` clock. Never Framer `height: 'auto'` for large panels.

### Modal presence

- Pass `isOpen` into `WeeModalShell` / shared shells.
- Use `useDialogExitPresence` — never `if (!isOpen) return null` on animated trees.
- Parent keeps overlays mounted while closing; toggle `isOpen` only.

---

## 5. Materials & color

### Glass chrome tokens

```css
/* design-system.css — light + .dark-mode overrides */
--wee-pill-glass
--wee-pill-border
--wee-pill-shadow
--wee-pill-floor
```

`WeeGlassPill` applies:

- `border-4 border-[hsl(var(--wee-pill-border))]`
- `bg-[hsl(var(--wee-pill-glass))]`
- `shadow-[var(--wee-pill-shadow)]`
- `backdrop-blur-xl`

### Wee surface radii (settings / modals / cards)

| Token | Use |
|-------|-----|
| `--wee-radius-shell` | Modal outer shell (~4rem) |
| `--wee-radius-card` | Cards / wells (~3rem) |
| `--wee-radius-pill` | Pill controls (~2rem) |
| `--wee-radius-rail-item` | Rail items |
| `--radius-pill` / `rounded-full` | True capsules (page indicator, icon discs) |

### Semantic color (always)

- Text: `--text-primary` / `--text-secondary` / `--text-tertiary`
- Surfaces: `--surface-*`, `--wee-surface-card`, `--wee-surface-input`
- Borders: `--border-*`, `--wee-border-card`, `--wee-border-field`
- Accent: `hsl(var(--primary))` — never sample wallpaper in feature components
- Ambient: write via `resolveEffectiveAccent` / ambient helpers; read `--ambient-secondary`

### Interactive glow

```css
box-shadow: var(--shadow-soft-hover), var(--shadow-hover-glow);
/* or utility */ .shadow-hover-glow
filter: var(--filter-hover-glow);
```

**Avoid:** hard accent rings (`0 0 0 Npx`), one-off blue borders, scattered `#hex` / `rgba()` in `src/components/**`.

### Dynamic runtime colors

Set CSS vars on a root; classes consume them — do not fan out inline style objects per child.

---

## 6. Styling advice by UI type

### Layouts

- One clear composition per viewport; chrome floats over content (space rail / side nav / page indicator pattern).
- Use dock clearance tokens (e.g. `--channel-dock-clearance`) so floating chrome clears the ribbon.
- Prefer absolute edge placement + `pointer-events` wrappers (`pointer-events-none` shell, `pointer-events-auto` hit target) for overlay chrome.
- Keep z-index in token families (`--nav-z-index`, `--side-nav-z-index`) — do not invent random 9999s.

### Containers / surfaces

| Intent | Prefer |
|--------|--------|
| Glass chrome / floating control | `WeeGlassPill` |
| Grouped settings / form card | `WeeCard` (`tone="panel"` or `"well"`) |
| Modal frame | `WeeModalShell` + rail primitives |
| Generic elevated card | `Card` only if already in that feature path; new Wee UI → `WeeCard` |

Generous padding on Wee cards (`p-8 md:p-10` default). Soft hover border shift, not flashy fills.

### Inputs & controls

Prefer `src/ui/` first:

| Control | Component |
|---------|-----------|
| Button | `WButton` / `WeeButton` |
| Text / number | `WInput` |
| Select | `WSelect` |
| Toggle | `WToggle` / `WeeToggle` |
| Slider | `Slider` / `WeeSlider` |
| Segmented | `WeeSegmentedControl` |
| Choice tiles | `WeeChoiceTileGrid` |

Use `--control-*` / `--toggle-*` tokens. Playful radius via `--control-radius-playful` when matching gooey chrome; otherwise `--control-radius`.

### Text

Use `Text` variants (`h1`–`h4`, `p`, `label`, `desc`, `help`, `caption`).

Wee chrome typography habits:

- Compact counters: small, `font-black`, `uppercase`, `tracking-wide`, `--text-secondary`
- Section titles in Wee cards: `font-black uppercase italic tracking-tight` + `--wee-text-header`
- Help / secondary: `Text variant="help"` / `--text-tertiary`
- Active dots / accents: `bg-[hsl(var(--primary))]`

Do not invent parallel type scales in feature CSS.

### Icons

- Lucide (or existing icon set) inside `WeeGooeyIconButton` for rail/chrome.
- Size via button size (`sm` / `md` / `lg`) — keep hit targets ≥ ~40px for floating chrome.
- Active state: `WeeLayoutActiveDisc` via `active` + `layoutId` (shared layout spring between siblings).
- Color: `--text-tertiary` idle → `--text-primary` hover; solid variants use `--text-on-accent`.

### Heroes / hub spaces

- Entrance uses hub intents (`hubEntrance`, `homeEntrance`, revisit gooey) — extend `weeMotion`, do not fork.
- Scroll-linked morph amplitudes: `HUB_MORPH` in `playfulMotion.js`.
- Hero should feel like one composition with wallpaper/ambient accent, not a card stack.

### Animations (decision tree)

```
Is footprint changing (compact ↔ expanded)?
  → Pill Morph Reveal (WeeGlassPill + peek/rail variants)

Is content height changing inside a panel?
  → WeeContentCollapse / WeeRevealWhen / WeeMorphStack

Is it a modal/dialog?
  → WeeModalShell + modalPanel* intents + exit presence

Is it a same-size view swap?
  → AnimatePresence + createWeeTransition('tab')

Is it a press/hover micro-interaction?
  → createWeeTransition('press') + PLAYFUL_AMPLITUDE / WEE_GOOEY_ICON_PRESS

Is it continuous / always-on FX?
  → Gate with useAnimationActivity; prefer idle peek over constant heavy blur
```

---

## 7. Building a new experience in this style

### Checklist

1. **Identify the owner system** — chrome morph, content collapse, modal, or press. Extend it.
2. **Compose primitives** — `WeeGlassPill` + floor shadow + gooey icon button before custom CSS.
3. **Drive motion with intents** — `useWeeMotion` / `createWeeTransition`; amplitudes from `playfulMotion`.
4. **Tokenize paint** — `hsl(var(--…))` / Tailwind arbitrary values against tokens.
5. **Gate motion** — `useMotionFeedback` (and `useReducedMotion` where appropriate).
6. **Keep presence** — mount through exit; toggle `isOpen` / `revealed`.
7. **Verify** — rapid hover toggle, reduced motion, dark mode, accent from wallpaper/primary.

### Minimal new floating control

```jsx
import { useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { createWeeSideNavPeekVariants, useWeeMotion } from '../design/weeMotion';
import { WeeGlassPill, WeePillFloorShadow } from '../ui/wee';

function WeePeekChip({ label, children }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotion();
  const { pillOpen, pillClose } = useWeeMotion();
  const revealed = hovered || focused;
  const variants = createWeeSideNavPeekVariants(null, {
    compactSize: 48,
    expandedWidth: 160,
    expandedHeight: 48,
    pillClose,
    pillOpen,
    reducedMotion,
  });

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <WeePillFloorShadow expanded={revealed} reducedMotion={reducedMotion} />
      <WeeGlassPill
        motion
        as="button"
        type="button"
        initial={false}
        animate={revealed ? 'open' : 'closed'}
        variants={variants}
        className="relative z-10 flex items-center justify-center overflow-hidden rounded-full px-3"
      >
        {revealed ? children : (
          <span className="text-[10px] font-black uppercase tracking-wide text-[hsl(var(--text-secondary))]">
            {label}
          </span>
        )}
      </WeeGlassPill>
    </div>
  );
}
```

### Vertical rail of actions

Mirror `WeeGooeySpacePill`: container variants + staggered `WeeGooeyIconButton` rows + shared `layoutId` active disc.

---

## 8. Anti-patterns (break the feel)

| Don't | Do instead |
|-------|------------|
| One-off `stiffness: 500` literals in features | `createWeeTransition(intent)` |
| Opacity-only expand for large chrome | Morph width/height via peek/rail helpers |
| `height: 'auto'` Framer collapses | `WeeContentCollapse` + `--wee-collapse-*` |
| `if (!open) return null` on animated overlays | Keep mounted; pass `isOpen` |
| Hard accent outline rings | `--shadow-hover-glow` / `--filter-hover-glow` |
| Hex/rgba in component styling | Tokens in `design-system.css` or `runtimeColorStrings.js` |
| Parallel peek CSS + Framer clocks | One spring family per domain |
| Always-on heavy blur/particles | Idle peek + activity gates |
| Raw `<button>` with custom glass CSS | `WeeGlassPill` / `WeeGooeyIconButton` / `WButton` |

---

## 9. File map

| Area | Path |
|------|------|
| Springs, intents, morph helpers | `src/design/weeMotion.js` |
| Amplitudes | `src/design/playfulMotion.js` |
| Gooey intensity physics | `src/design/gooeyPhysics.js` |
| Tokens (light/dark) | `src/styles/design-system.css` |
| Wee UI barrel | `src/ui/wee/index.js` |
| Glass pill / floor / icon / side nav | `src/ui/wee/WeeGlassPill.jsx`, `WeePillFloorShadow.jsx`, `WeeGooeyIconButton.jsx`, `WeeGooeySideNavButton.jsx` |
| Space rail | `src/components/spaces/WeeGooeySpacePill.jsx` |
| Page indicator | `src/components/home-grid/HomePageIndicator.jsx` |
| Motion prefs hook | `src/hooks/useMotionFeedback.js` |
| Shared Text / Button / inputs | `src/ui/Text.jsx`, `WButton.jsx`, … |
| Style placement map | `docs/style-architecture-map.md` |
| Agent rules | `AGENTS.md`, `.cursor/rules/design-system.mdc`, `motion-and-layout-cohesion.mdc` |

---

## 10. QA for “does this feel like Wee chrome?”

- [ ] Idle state is compact and readable without hover
- [ ] Hover/focus expands **footprint** with `pillOpen`; leave uses `pillClose`
- [ ] Rapid hover on/off does not stick mid-morph
- [ ] Press feels soft (`press` / `WEE_GOOEY_ICON_PRESS`), not snappy CSS-only
- [ ] Glass uses `--wee-pill-*` (or documented sibling tokens)
- [ ] Glow uses soft primary glow, not hard rings
- [ ] Reduced motion / motionFeedback-off shortens or snaps cleanly
- [ ] Dark mode tokens still read as glass, not muddy gray slabs
- [ ] No second timing clock fighting the same interaction

---

*This document describes the living system encoded in code. When code and this doc disagree, update the doc to match the canonical implementations above.*
