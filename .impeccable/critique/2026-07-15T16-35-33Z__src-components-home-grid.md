---
target: home channel grid
total_score: 25
p0_count: 1
p1_count: 2
timestamp: 2026-07-15T16-35-33Z
slug: src-components-home-grid
---
Method: dual-agent (A: design review sub-agent · B: detector sub-agent)

# Critique: Wee Home Channel Grid (`src/components/home-grid` + channel strip)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Blocked size-preset feedback appears only after a failed click, via dimming + `title` tooltip |
| 2 | Match System / Real World | 3 | "Punch holes" is opaque until you're in the mode; "Tap" diction in a mouse-first desktop app |
| 3 | User Control and Freedom | 2 | No undo for widget removal or channel reorder anywhere |
| 4 | Consistency and Standards | 2 | Right-click = Configure on tiles but Arrange on gaps; hint says "drag to reorder" while drag is disabled; hard rings violate own Soft Glow Rule |
| 5 | Error Prevention | 3 | Destructive admin commands confirmed; invalid spans blocked by `canPlaceSpan` |
| 6 | Recognition Rather Than Recall | 2 | Arrange entry, page shortcuts (1–9, Home/End, mouse buttons), punch mode all invisible until known; channel titles hidden |
| 7 | Flexibility and Efficiency | 3 | Rich pointer fast paths; zero keyboard path in arrange mode, no arrange shortcut |
| 8 | Aesthetic and Minimalist Design | 3 | Resting plaza is excellent; arrange-bar density and 20-animation zoo pull it down |
| 9 | Error Recovery | 3 | Launch errors detailed, unsupported-media notice, image → icon fallback chain |
| 10 | Help and Documentation | 1 | No onboarding, no first-run hints, no shortcut reference; one contextual hint line total |
| **Total** | | **25/40** | **Acceptable — significant improvements needed** |

## Anti-Patterns Verdict

**Pass — this does not read as AI-generated.** The compact-nub → springy-footprint-morph chrome is a signature pattern, colors flow through semantic HSL tokens, glass is purposeful, and there is no gradient text, side-stripe decoration, or ghost-card filler.

**LLM assessment** found three self-inflicted exceptions: (1) hard accent rings in arrange/selection chrome (`ring-2 ring-[hsl(var(--primary))]` in `AdminQuickAccessSlot.jsx` L201–205; `0 0 0 2px` box-shadows + hard outline in `PaginatedChannels.css` L235–243) — an explicit violation of the project's own Soft Glow Rule; (2) `border-radius: 32px` hardcoded on the default `.channel` (`Channel.css` L6), off the token scale; (3) a 20-item ad-hoc idle-animation zoo (`Channel.jsx` L236, ~250 lines of one-off keyframes in `Channel.css` L343–590) that bypasses the `createWeeTransition` vocabulary — the "noisy gadget" extreme PRODUCT.md warns against.

**Deterministic scan** (exit code 2): 14 advisory findings, all one rule — font size off the DESIGN.md type ramp — across 4 files. 9 are false positives from a systemic 10px "kicker" convention that DESIGN.md (0.69rem) never absorbed; 5 are true positives: two 9px one-offs, two 10px-bold text buttons, and a 12px raw `<select>` in HomeBoardSwitcher. No color, shadow, or motion rules fired — corroborating the strong token discipline the design review found. Browser visualization skipped: no dev server running; the Electron renderer requires preload APIs.

Where the two assessments agree: the micro-typography floor (9–10px black-weight uppercase labels) is both a detector cluster and a persona-level legibility red flag. The detector caught the raw `<select>` element the design review missed; the design review caught the hard rings, the animation zoo, and every interaction-level issue the detector cannot see.

## Overall Impression

The resting surface is genuinely excellent — a calm wallpaper plaza with floating glass chrome and an engineered launch choreography that delivers the brand. The problem is everything that happens when a user tries to *do* something beyond clicking a tile: the flagship flow is keyboard-broken, and the customization system (the product's #2 success metric) hides behind a right-click that tiles themselves swallow. The single biggest opportunity: make Live Board Studio discoverable and coherent — pick one manipulation philosophy and teach it on the board itself.

## What's Working

1. **The compact→reveal chrome family is a real design system, not decoration.** `HomePageIndicator` and `WeeGooeySideNavButton` share one variant factory, one spring pair, and a floor shadow that stretches with the morph — footprint physically expands rather than fading. This is why the surface passes the slop check.
2. **Restraint is implemented, not aspirational.** Decorative video pauses on blur/low-power, idle detection throttled to 200ms, focus-recede deliberately avoids GPU-churning sibling effects. "Built for all-day sessions" is visible in the code.
3. **The slot architecture earns the arrange feature.** Slots-as-SSOT with kind registry, span occupancy, and placement validation compose punch holes, spanning widgets, and cross-page drag without mega-conditionals; arrange-bar hint copy is contextual per state.

## Priority Issues

**[P0] Channels cannot be launched by keyboard and have no accessible names.**
Why it matters: PRODUCT.md declares launching channels a fully keyboard-navigable core flow; this is the flagship interaction, broken for keyboard and screen-reader users. Tiles are `div`s with `role="button"` + `tabIndex={0}` but no `onKeyDown` (`Channel.jsx` L293–303), and every tile announces as "Channel media, button" (`ChannelMediaPreview.jsx` L79/L89/L180).
Fix: handle Enter/Space in `Channel.jsx` routing to `handleTileClick`; derive `aria-label` from the channel title (empty tiles: "Add a channel"). Also fix the invisible focus state: `.channel--gooey-motion:not(.channel--gooey-glow):focus` renders identically to rest (`Channel.css` L53–56); add `:focus-visible` styling.
Suggested command: `$impeccable harden`

**[P1] The arrange-mode hint instructs an action the mode disables.**
Why it matters: the bar says "drag tiles to reorder" (`HomeBoardArrangeBar.jsx` L54) but `ChannelSlotDnd` is disabled during arrange (`PaginatedChannels.jsx` L900–907). Users follow the instruction and nothing moves — trust-eroding at the exact moment of empowerment.
Fix: enable drag-reorder inside arrange mode (arguably where it most belongs) or correct the copy; settle the mode's manipulation philosophy.
Suggested command: `$impeccable clarify` (copy) or `$impeccable shape` (mode philosophy)

**[P1] Arrange mode is nearly undiscoverable; right-click is inconsistent.**
Why it matters: the "Arrange Home board" context menu hangs off the grid container, but tiles swallow right-click for the Configure modal (`useChannelInteractions.js` L114–119) — so the entry point is only reachable in gaps and margins. No shortcut binds `toggleArrange`; the Settings path is three levels deep. The product's self-expression story depends on users finding this.
Fix: unify tile right-click into one context menu (Configure / Arrange board / Punch this slot); bind a keyboard shortcut; add a one-time hint.
Suggested command: `$impeccable onboard`

**[P2] HomePageIndicator is keyboard-unreachable and its ARIA is wrong.**
Why it matters: dots render only when revealed; nothing is focusable when collapsed; the compact counter is `aria-hidden` — screen readers get a `role="tablist"` containing zero tabs, forever (`HomePageIndicator.jsx` L33/L77/L99).
Fix: make the pill focusable (focus-within expands), use `role="group"` with buttons carrying `aria-current="page"`, expose the counter.
Suggested command: `$impeccable harden`

**[P2] Selection/arrange emphasis contradicts the design system (hard rings).**
Why it matters: three hard-ring treatments where the system mandates soft glow — the exact "parallel one-off emphasis" drift the repo polices elsewhere.
Fix: add a shared selection-glow token in `design-system.css`; consume it in `AdminQuickAccessSlot.jsx` and `PaginatedChannels.css`.
Suggested command: `$impeccable polish`

**[P3] Idle auto-fade ignores keyboard activity.**
`bumpGridActivity` wires only pointer events (`PaginatedChannels.jsx` L947–951); keyboard users paging with arrows watch the grid fade to 30% opacity mid-use.
Suggested command: `$impeccable polish`

## Persona Red Flags

**Alex (impatient power user):** real fast paths exist (arrows, 1–9, Home/End, mouse back/forward, edge-hold cross-page drag) but none are documented anywhere in the UI — source-diving required. No shortcut toggles arrange mode. No bulk punch (one click per tile, no "hide page"). Tried to drag in arrange mode because the hint said to; nothing moved.

**Sam (accessibility-dependent):** cannot launch anything — walkthrough ends at step one (P0). Focused tiles can have zero visible focus indicator; page indicator invisible to her; arrange mode is 100% mouse (slot selection via `onClickCapture`); 9–10px black-weight uppercase micro-labels sit below the legibility floor and below the system's own 0.69rem kicker spec.

**Nova (customization enthusiast, project persona):** punch holes — the best show-off feature — is buried behind an undiscoverable mode and a 10px label. Resize is trial-and-error: blocked presets dim only after a failed click, reason lives in a tooltip, no ghost preview. The widget story is one item deep (`HOME_SLOT_KINDS` has exactly `channel` and `adminQuickAccess`). No path from the arrange bar to saving/sharing the board as a preset — self-expression ends at arranging.

## Minor Observations

- Empty channels are clickable but declare `cursor: default` (`Channel.css` L163) — affordance contradicts behavior; and with `adaptiveEmptyChannels` defaulting true, the "+" invitation is suppressed (`Channel.css` L167), so a first-run user faces tinted blobs with no visible way to add anything.
- `KenBurnsImage` hardcodes `borderRadius: '12px'` vs the wii tile's 14px — a 2px corner mismatch on the most-viewed element.
- `Channel.css` dead weight: mobile media query in a desktop Electron app, Spotify modal styles, unused `.channel-context-*`, `channel-title` styled then `display: none`.
- `Channel.propTypes.animationStyle` allows 7 values; the code implements 20.
- `WiiSideNavigation.jsx` L87–89: raw `rgba(...)` literals (incl. magic `rgba(31, 38, 135, 0.37)`) in a component file, against the repo color rule.
- Magic layout constants: `bottom: calc(... - 2.55rem)` (`HomePageIndicator.jsx` L57), `z-[2350]` (`HomeBoardArrangeBar.jsx` L61) vs token z-families.
- Input-verb vocabulary unsettled: "Tap" in the arrange hint, "Right-click" in side-nav tooltips.
- Detector true positives: two 9px one-offs, two 10px-bold text buttons, 12px raw `<select>` in HomeBoardSwitcher; the 10px kicker convention should either be tokenized or corrected to the 0.69rem spec.

## Questions to Consider

1. If a new user never right-clicks the empty space between tiles, do they ever meet the app's core self-expression feature? The board itself could teach — long-hover jiggle, a first-run coach mark, or an edit nub in the chrome.
2. The Wii grid was legible because every channel had a visible name banner; Wee hides titles entirely. At 12 similar art tiles per page, is pure-art recognition worth the recall burden for the "everyday launcher" persona?
3. Is Live Board Studio a direct-manipulation surface or an edit mode? Drag lives outside the mode, selection-and-buttons inside it, and the hint promises both. Committing to one philosophy resolves the P1 contradiction and the discoverability problem at once.
4. Why is the most "Windows utility" artifact in the app — an admin command pad — the flagship board's only widget? A clock, now-playing, or weather tile would sell the "living desktop" story harder than shutdown buttons.
