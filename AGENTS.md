# Agent and contributor guide (Wee)

This project uses **Cursor rules** in `.cursor/rules/` as the source of truth for how to implement changes.

## Always follow

1. **Design system** — `.cursor/rules/design-system.mdc`  
   Tokens in `src/styles/design-system.css`, no new scattered hex/rgba in components, use `src/ui/` and `src/design/` helpers.

2. **No ad-hoc drift** — `.cursor/rules/No-one-offs-or-ad-hoc-code.mdc`  
   Prefer systematic, tokenized, reusable approaches.

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

## Motion QA checklist

- Rapidly switch `home ↔ mediahub ↔ gamehub` and verify no half-entry flashes.
- Open/close settings and quick menu repeatedly; verify close animation always plays.
- Test first-open lazy paths (settings/modal/menu) for fallback continuity (no blank pop frame).
- Verify reduced-motion mode still enters/exits cleanly without lingering mounted overlays.

## Key files

| Area | Location |
|------|----------|
| CSS variables (light/dark) | `src/styles/design-system.css` |
| JS color strings for inline styles | `src/design/runtimeColorStrings.js` |
| Dock defaults | `src/design/classicDockThemeDefaults.js` |
| Dock preset *data* (hex allowed) | `src/data/dock/classicDockThemeGroups.js` |
| UI primitives | `src/ui/` |

## Electron

- Main/preload: `electron.cjs`, `preload.cjs` — follow existing IPC and security patterns when touching them.
