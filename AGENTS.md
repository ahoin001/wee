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
