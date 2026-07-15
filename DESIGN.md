---
name: Wee
description: A Wii-inspired living desktop launcher — glass channel plaza with gooey-confident physics.
colors:
  console-cyan: "#4DBFE6"
  console-cyan-hover: "#36B7E2"
  console-cyan-active: "#20AFDF"
  console-tint: "#F0FBFF"
  plaza-white: "#FFFFFF"
  plaza-mist: "#F0F2F5"
  ink: "#2E3138"
  ink-soft: "#676F7E"
  midnight: "#111317"
  midnight-surface: "#1A1D23"
  midnight-ink: "#EFF1F4"
  signal-error: "#EF4444"
  signal-success: "#16A34A"
  signal-warning: "#F59E0B"
typography:
  display:
    fontFamily: "Nunito, Avenir Next, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(1.65rem, 2.6vw, 2.45rem)"
    fontWeight: 900
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Nunito, Avenir Next, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 500
  label:
    fontFamily: "Nunito, Avenir Next, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 600
  kicker:
    fontFamily: "Nunito, Avenir Next, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.69rem"
    fontWeight: 900
    letterSpacing: "0.2em"
rounded:
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "24px"
  control-playful: "1.65rem"
  pill-control: "2rem"
  card-wee: "3rem"
  shell-wee: "4rem"
  pill: "999px"
spacing:
  control-y: "12px"
  control-x: "16px"
  control-x-playful: "1.4rem"
  card-playful: "clamp(1.2rem, 2.2vw, 2rem)"
components:
  button-primary:
    backgroundColor: "{colors.console-cyan}"
    textColor: "{colors.plaza-white}"
    rounded: "{rounded.control-playful}"
    padding: "0.52rem 1.18rem"
  button-primary-hover:
    backgroundColor: "{colors.console-cyan-hover}"
  button-secondary:
    backgroundColor: "{colors.plaza-mist}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control-playful}"
    padding: "0.52rem 1.18rem"
  glass-pill:
    backgroundColor: "#FFFFFFD1"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
---

# Design System: Wee

## 1. Overview

**Creative North Star: "The Channel Plaza"**

Wee's interface is a friendly public square of channels — a wallpaper-backed plaza where glass chrome floats at the edges, calm and compact until touched. Nothing on screen demands attention at rest; everything comes alive on approach. Controls idle as small frosted nubs and discs, then morph their footprint open with a springy, physical reveal when hovered or focused. The personality is playful, polished, and nostalgic: a well-made toy for adults, channeling Wii-era warmth through modern materials rather than pixel-perfect replication.

This system explicitly rejects generic SaaS and dashboard chrome — sterile grids, corporate grays, admin-panel blandness — and Windows utility clutter — dense settings trees, system-tray-app energy. It equally rejects cartoon chaos: springs overshoot softly and settle with weight; they never wobble endlessly. The app runs all day on a user's PC, so restraint is part of the craft: heavy effects gate on visibility, focus, and reduced-motion preferences.

**Key Characteristics:**
- Chrome floats over the wallpaper; the wallpaper is the room, the UI is furniture in it
- Compact → reveal: idle states are small; hover/focus expands footprint, not just opacity
- One motion vocabulary: shared springs (`pillOpen` / `pillClose`), one timing clock per domain
- Semantic HSL tokens everywhere; no scattered hex in components
- Accent appears as soft glow, never hard rings

## 2. Colors

A restrained palette: soft neutrals and glass carry the surface; one heritage cyan marks everything active and alive. Canonical values live as HSL triplets in `src/styles/design-system.css` (referenced as `hsl(var(--token))`); the hex values here are their sRGB equivalents.

### Primary
- **Console Cyan** (#4DBFE6 / `--wii-blue: 195 75% 60%`): The signature accent, a softened descendant of Wii blue — nods to the heritage without naming it. Used for primary actions, active page dots, selection states, focus rings, and hover glows. It is runtime-themable: the ambient accent resolver can retint `--primary` from the wallpaper or ribbon accent, so components must read `hsl(var(--primary))`, never the hex.
- **Console Cyan Hover / Active** (#36B7E2 / #20AFDF): Darkened steps for pressed and hovered fills.
- **Console Tint** (#F0FBFF / `--surface-wii-tint`): Whisper-light cyan wash for resting/disabled chips and tinted wells.

### Neutral
- **Plaza White** (#FFFFFF): Light-mode base surface and modal shells.
- **Plaza Mist** (#F0F2F5 / `--bg-secondary`): Secondary surfaces, input wells, rails.
- **Ink** (#2E3138 / `--text-primary`): Primary text in light mode.
- **Ink Soft** (#676F7E / `--text-secondary`): Secondary text; tertiary steps lighter still.
- **Midnight / Midnight Surface** (#111317 / #1A1D23): Dark-mode base and elevated surfaces — cool, blue-leaning grays, never pure black.
- **Glass** (`--wee-pill-glass`, white at 82% / dark at 88% opacity): The frosted pill fill; always paired with a 4px `--wee-pill-border` ring and `backdrop-blur-xl`.

### Semantic states
- **Signal Error / Success / Warning** (#EF4444 / #16A34A / #F59E0B): State colors with hover and light-tint variants; used only for state, never decoration.

### Named Rules
**The Ambient Accent Rule.** Components never hardcode the brand color. All accent paint flows through `hsl(var(--primary))` / `hsl(var(--ambient-secondary))`, written only by `resolveEffectiveAccent` + the ambient helpers. Sampling wallpaper colors inside feature components is prohibited.

**The Soft Glow Rule.** Interactive emphasis is a diffuse primary-hued glow (`--shadow-hover-glow`, `--filter-hover-glow`), never a hard accent ring (`0 0 0 Npx`) or a one-off colored border.

## 3. Typography

**Display Font:** Nunito (with Avenir Next, Segoe UI fallbacks)
**Body Font:** Nunito (same family)
**Label Font:** Nunito

**Character:** One warm, rounded sans carries the entire interface — friendly at every weight, from 500 body text to 900 heroes. Personality comes from weight, case, and italic, not from font pairing.

### Hierarchy
- **Display** (900, `clamp(1.65rem, 2.6vw, 2.45rem)`, tracking -0.03em): Hub heroes and space titles. Often paired with uppercase italic for the signature "playful hero" voice.
- **Title** (900, ~1rem–1.25rem, uppercase italic, tracking tight): Section titles inside Wee cards and modals (`--wee-text-header`).
- **Body** (500, 15px / `--control-font-size`): Control and content text.
- **Label** (600, 14px): Form labels and helper text (`--text-secondary` / `--text-tertiary`).
- **Kicker / Counter** (900, 0.69rem, uppercase, tracking 0.2em): Compact counters and micro-labels inside chrome pills — small, black-weight, wide-tracked.
- **Caption** (700–800, 11px / `--font-size-caption`): Dense captions, rail tab labels, secondary descriptions. Utility: `.text-caption` or `text-[length:var(--font-size-caption)]`.
- **Micro** (800–900, 10px / `--font-size-micro`): The floor of the ramp — uppercase kickers, pill/tab hints, badge text. Always paired with heavy weight and tracking; never lighter than 700. Utility: `.text-micro` or `text-[length:var(--font-size-micro)]`.

### Named Rules
**The One Family Rule.** Nunito is the only typeface. New surfaces express hierarchy through weight (500→900), size, case, and italic — never by importing a second font.

**The Micro Floor Rule.** Nothing renders below 10px (`--font-size-micro`), and text at 10–11px never relies on `opacity-*` for de-emphasis — use a muted color token (e.g. `--text-tertiary`, `--wee-text-rail-muted`) so contrast stays legible. Arbitrary `text-[9px]` / `text-[0.5625rem]` values are drift.

## 4. Elevation

Depth in Wee is **floating glass**: chrome hovers over the wallpaper like objects on a console screen. Elevation is conveyed by frosted translucency (`backdrop-blur-xl`), soft wide shadows, and a "floor shadow" blur beneath floating pills that stretches as they expand — never by hard borders or stacked flat layers. Dark mode keeps glass reading as glass (cool translucent surfaces), not muddy gray slabs.

### Shadow Vocabulary
- **Soft rest** (`--shadow-soft`: `0 8px 22px -8px rgb(15 36 61 / 0.16)`): Default lift for cards and chrome at rest.
- **Soft hover** (`--shadow-soft-hover`: `0 12px 28px -10px rgb(15 36 61 / 0.22)`): Hover lift, usually paired with the hover glow.
- **Hover glow** (`--shadow-hover-glow`: diffuse `hsl(var(--primary))` halo): Interactive accent emphasis on channels and chrome.
- **Pill shadow** (`--wee-pill-shadow`: `0 20px 50px rgb(0 0 0 / 0.15)`): The floating-glass signature under `WeeGlassPill`.
- **Elevated playful** (`--playful-shadow-elevated`: `0 20px 40px rgb(15 36 61 / 0.2)`): Hero cards and primary buttons.
- **Modal** (`--wee-shadow-modal`: `0 25px 50px -12px rgb(15 23 42 / 0.12)`): Dialog shells.

### Named Rules
**The Floor Shadow Rule.** Floating chrome casts mass on the floor: `WeePillFloorShadow` renders a soft blur beneath the pill that stretches when the pill expands. Depth responds to state; it is not static decoration.

## 5. Components

Component character: **gooey but confident** — soft springs and gentle overshoot, but precise and never mushy. Every interactive element compresses on press (`scale ~0.93`), lifts slightly on hover (`scale ~1.03`, `y -1.5px`), and settles with the shared `press` spring. All primitives live in `src/ui/` (and `src/ui/wee/`); new controls extend them rather than styling raw HTML.

### Buttons (`WButton` / `WeeButton`)
- **Shape:** Playful super-ellipse feel via large radius (`--control-radius-playful`, 1.65rem) with a thick 3px border.
- **Voice:** Uppercase italic, tracking 0.12em, weight 600 — every button label speaks in the signature playful voice.
- **Primary:** Solid `hsl(var(--primary))` fill, white text with subtle text-shadow, elevated playful shadow.
- **Hover / Focus:** Framer spring lift + soft primary glow; 2px primary focus ring with offset.
- **Secondary:** `--surface-secondary` fill, 2px `--border-secondary` border, hover shifts border to primary.
- **Tertiary:** Transparent ghost; hover paints `--state-hover` only.
- **Disabled:** Not a gray slab — a resting Wii-tint chip (`--surface-wii-tint`) with gentle inset gloss.

### Glass Pills (`WeeGlassPill` + `WeePillFloorShadow`) — the signature component
- **Style:** `border-4` ring (`--wee-pill-border`), frosted fill (`--wee-pill-glass`), `backdrop-blur-xl`, `--wee-pill-shadow`.
- **Behavior — Pill Morph Reveal:** idle is a compact nub (~48–56px disc); hover/focus morphs the footprint open (via `createWeeSideNavPeekVariants` / `createWeeShellRailContainerVariants`) with `pillOpen`, closes heavier with `pillClose`. Interruptible mid-morph; reduced motion snaps.
- **Canonical uses:** space rail, edge page nav, Home page indicator.

### Cards / Containers (`WeeCard`, `Card`)
- **Corner Style:** Generous — `--wee-radius-card` (3rem) for Wee cards, `--radius-lg` (18px) for legacy cards.
- **Background:** `--wee-surface-card` / `--surface-primary`; wells use `--wee-surface-well`.
- **Shadow Strategy:** Soft rest → soft hover; border shifts subtly on hover instead of flashy fills.
- **Internal Padding:** Generous (`p-8 md:p-10` on Wee cards; `--playful-card-padding` for playful surfaces).

### Inputs / Fields (`WInput`, `WSelect`, `WToggle`, `WeeSlider`, `WeeSegmentedControl`)
- **Style:** Soft input wells (`--wee-surface-input`), near-flat field borders (`--wee-border-field`), minimal field shadow.
- **Focus:** Primary ring, border shift toward accent.
- **Toggles:** 44×24 track, 20px thumb, spring-animated.
- **Reveal:** A toggle that reveals fields animates the space via `WeeRevealWhen` / `SettingsToggleFieldCard` — grid-rows morph, never height-auto.

### Navigation (page dots, side nav, space rail)
- **Style:** Floating glass chrome at screen edges; dots are 8px white-alpha discs, active dot is `hsl(var(--primary))` with a soft white glow.
- **Idle life:** Side nav buttons tuck mostly off-screen and do a soft repeating peek bounce to signal presence without intruding.
- **States:** Hover scales dot 1.12; active disc slides between siblings via shared `layoutId` spring.
- **Z-order:** Token families only (`--nav-z-index: 1000`, `--side-nav-z-index: 2300`) — never arbitrary 9999s.

### Motion vocabulary (applies to all components)
- Springs come from `WEE_SPRINGS` via `createWeeTransition(intent)` — intents: `press`, `hover`, `pillOpen`, `pillClose`, `modalPanelOpen/Close`, `tab`, `sheet`, `hubEntrance`, `railNudge`, `channelPageFlip`.
- Content height changes use the CSS collapse clock (`--wee-collapse-duration: 420ms`, reduced: 100ms).
- Modals keep exit presence: `isOpen` into `WeeModalShell`, deferred unmount — never `if (!isOpen) return null` on animated trees.
- All playful motion gates through `useMotionFeedback` (OS reduced-motion + user preference); continuous FX gate through `useAnimationActivity`.

## 6. Do's and Don'ts

### Do:
- **Do** reference every color as `hsl(var(--token))`; extend `design-system.css` (light `:root` + `.dark-mode`) when a new color is needed.
- **Do** compose new chrome from `WeeGlassPill` + `WeePillFloorShadow` + `WeeGooeyIconButton`, and new controls from `src/ui/` primitives.
- **Do** drive all springs through `createWeeTransition(intent)` and amplitudes through `PLAYFUL_AMPLITUDE` — one clock per transition domain.
- **Do** animate footprint (width/height morph, `0fr → 1fr` grid rows) when space changes; expansion is physical, not a fade.
- **Do** ship every interactive state: default, hover, focus, active, disabled — disabled as a soft Wii-tint resting chip, not a gray slab.
- **Do** gate playful and continuous motion behind `useMotionFeedback` / `useAnimationActivity`; reduced motion snaps or shortens, never breaks.
- **Do** run `npm run lint` (design-system contract) and `npm run build` after token or Tailwind changes.

### Don't:
- **Don't** produce generic SaaS or dashboard chrome — sterile grids, corporate grays, admin-panel blandness (PRODUCT.md anti-reference, verbatim).
- **Don't** produce Windows utility clutter — dense settings trees, system-tray-app energy (PRODUCT.md anti-reference, verbatim).
- **Don't** add new `#hex` or `rgba()` literals in `src/components/**`; hex belongs only in `src/design/*`, `src/data/**`, and API-required strings.
- **Don't** use hard accent rings (`0 0 0 Npx`) or one-off colored borders for emphasis — soft glow only.
- **Don't** invent parallel timing clocks, ad-hoc spring literals (`stiffness: 500` in a feature file), or Framer `height: 'auto'` collapses.
- **Don't** unmount animated overlays mid-close (`if (!isOpen) return null`) — presence owns exit.
- **Don't** import a second typeface or invent a parallel type scale in feature CSS.
- **Don't** leave always-on heavy blur, particles, or RAF loops ungated — this app runs all day.
- **Don't** attempt pixel-perfect Wii cosplay; channel the warmth through modern glass and springs.
