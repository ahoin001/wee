# Agent and contributor guide (Wee)

This project uses **Cursor rules** in `.cursor/rules/` as the source of truth for how to implement changes.

## Always follow

1. **Design system** — `.cursor/rules/design-system.mdc`  
   Tokens in `src/styles/design-system.css`, no new scattered hex/rgba in components, use `src/ui/` and `src/design/` helpers. Interactive hover glow uses `--shadow-hover-glow` / `--filter-hover-glow` (no hard accent rings).

2. **No ad-hoc drift** — `.cursor/rules/No-one-offs-or-ad-hoc-code.mdc`  
   Prefer systematic, tokenized, reusable approaches.

3. **Architecture-first robustness** — `.cursor/rules/architecture-first-robustness.mdc`  
   Extend existing systems (state, persistence, motion, UI primitives) before adding new paths; optimize for long-term maintainability and performance.

4. **Motion and layout cohesion** — `.cursor/rules/motion-and-layout-cohesion.mdc`  
   Content morph (`WeeContentCollapse` / `WeeRevealWhen` / `WeeMorphStack`), modal presence, `createWeeTransition`, reduced-motion / low-power gates.

## Before you finish a change

- `npm run lint` — design-system contract (required for token/Tailwind work).
- `npm run build` — ensure the app still builds.

## Motion and modal guardrails

- Treat modal lifecycle as a single source of truth:
  - `src/components/core/WBaseModal.jsx`
  - `src/ui/wee/WeeModalShell.jsx`
  - `src/hooks/useDialogExitPresence.js`
- Do not add `if (!isOpen) return null` in animated modal/dialog components; pass `isOpen` to the shared shell and let deferred unmount handle exits.
- Do not parent-unmount animated overlays/menus while they are closing; keep them mounted and toggle `isOpen`.
- Do not introduce parallel timing clocks for the same transition domain (shell switch, hub entrance, modal close). Extend existing orchestrators instead.
- Prefer `createWeeTransition(intent)` / `useWeeMotion().createTransition(intent)` from `src/design/weeMotion.js` over ad-hoc spring literals. Amplitudes stay in `src/design/playfulMotion.js`; spring timing for shared intents lives in `WEE_SPRINGS`.
- Gate playful motion with `useMotionFeedback` (respects OS reduced-motion + `ui.motionFeedback`).

### Pill Morph Reveal (canonical shell pattern)

Compact glass control → fluid expand on hover/focus using `WeeGlassPill` + `pillOpen` / `pillClose`. Reference implementations:

| Surface | Helper | Notes |
|---------|--------|--------|
| Space rail (vertical) | `createWeeShellRailContainerVariants` | `WeeGooeySpacePill` |
| Home page edge nav (horizontal) | `createWeeSideNavPeekVariants` | `WeeGooeySideNavButton` (`variant="wee"`) |

- Do **not** invent one-off width/height springs for peeks or expanding chrome — extend these helpers.
- Icon press inside morph shells uses `WEE_GOOEY_ICON_PRESS` + `createWeeTransition('press')` (`WeeGooeyIconButton`).
- Classic slide peeks (`variant="classic"`) are a preserved legacy path; new work defaults to Wee morph.

## Motion QA checklist

- Rapidly switch `home ↔ mediahub ↔ gamehub` and verify no half-entry flashes.
- Open/close settings and quick menu repeatedly; verify close animation always plays.
- Test first-open lazy paths (settings/modal/menu) for fallback continuity (no blank pop frame).
- Verify reduced-motion mode still enters/exits cleanly without lingering mounted overlays.

### Content resize cohesion (expand / collapse / list close)

When UI height changes (channel art tools, settings sections, disclosure panels):

1. **Animate the space, not only the paint** — use CSS `grid-template-rows: 0fr → 1fr` via `WeeContentCollapse` / `WeeSettingsCollapsibleSection`. Do not rely on opacity/scale alone for large panels.
2. **One clock per transition domain** — helper copy, tools, and previews share the same open/close duration family; no hard `?: null` beside an animated sibling.
3. **Presence owns exit** — never parent-unmount animated children mid-close (`if (!isOpen) return null` on animated trees).
4. **Intent match** — accordion/collapse ≠ `tab` spring; prefer `--wee-collapse-*` tokens (or `createWeeTransition` for springs).
5. **Gate with reduced motion** — shorten or snap height; never leave a stuck expanding grid.
6. **No parallel collapse APIs** — reuse `WeeContentCollapse`; do not invent Framer `height: 'auto'` inside modal scroll.

**Compose**

| Need | Use |
|------|-----|
| Accordion with icon header | `WeeSettingsCollapsibleSection` |
| Controlled height show/hide | `WeeContentCollapse` |
| Toggle / condition reveals fields | `WeeRevealWhen` |
| Toggle card with nested controls | `SettingsToggleFieldCard` (auto-reveals when `checked`) |
| Sibling gap with collapse | `WeeMorphStack` |
| Lighter titled disclosure | `WeeSettingsDisclosure` |
| Same-footprint view swap | `AnimatePresence` + `tabTransition` |
| Heavy collapsed trees | `keepMounted={false}` (unmount after close morph) |
| Avoid | `height: 'auto'`, fade-only exits for large panels, hard `?: null` mounts |

Timing source: `--wee-collapse-duration`, `--wee-collapse-duration-reduced`, `--wee-collapse-ease` in `src/styles/design-system.css`. Full rules: `.cursor/rules/motion-and-layout-cohesion.mdc`.

## React cleanup guardrails

- Prefer selector-driven store reads (`useConsolidatedAppStore(selector)` + `useShallow`) over broad slice subscriptions.
- Keep imperative `getState()` reads limited to event handlers/one-shot effects; avoid render-adjacent polling reads.
- For periodic work, prefer `useActivityInterval` so visibility/focus/low-power behavior stays centralized.
- Keep feature components as composition shells; move heavy domain logic into focused hooks with stable inputs.
- Preserve existing motion choreography; optimize implementation cost only (no removal of core gooey/spring interactions).
- When adding new persistence paths, mirror settings patch semantics via `shared/settings-patch-merge.cjs`.

## Key files

| Area | Location |
|------|----------|
| CSS variables (light/dark) | `src/styles/design-system.css` |
| Ambient / wallpaper accents | `ui.wallpaperMatchEnabled` + `resolveEffectiveAccent` → `--primary*` / `--ambient-secondary` |
| JS color strings for inline styles | `src/design/runtimeColorStrings.js` |
| Dock defaults | `src/design/classicDockThemeDefaults.js` |
| Dock preset *data* (hex allowed) | `src/data/dock/classicDockThemeGroups.js` |
| UI primitives | `src/ui/` |
| Home grid slots (SSOT) | `src/utils/homeGridSlots.js` — `slots[]` is canonical, `configuredChannels`/`channelConfigs`/`slotMeta` are projections synced via `syncSpaceDataFromLegacyMaps` |
| Home grid tile switcher | `src/components/home-grid/` — `HomeSlot` dispatches via `slotKindRegistry.js` (`HOME_SLOT_KINDS`); first widget kind is `adminQuickAccess` (`AdminQuickAccessSlot`). Size presets live in `homeSlotSizePresets.js`; span occupancy in `homeGridOccupancy.js` |
| Admin Quick Access (Home) | Shared actions SSOT: `floatingWidgets.adminPanel.config` + `normalizeAdminPanelConfig` / `executeAdminCommand`. Place/resize/remove in Live Board Studio (`HomeBoardArrangeBar`) |
| Live Board Studio (arrange Home) | `ui.homeBoardArrangeMode` / `ui.homeBoardPunchMode` / `ui.homeBoardSelectedSlotIndex` (transient) via `useHomeBoardArrange`; toolbar `HomeBoardArrangeBar`; entry via right-click on the Home grid or Settings → Channel & layout → Arrange on Home |

## Electron

- Main/preload: `electron.cjs`, `preload.cjs` — follow existing IPC and security patterns when touching them.
