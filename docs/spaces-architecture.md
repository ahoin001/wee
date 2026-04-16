# Shell spaces and channel grids (Wee)

This document describes how **vertical shell spaces**, **channel grids**, and **saved environments** relate to each other.

## Three rail destinations

The left **space rail** has three fixed destinations (canonical order, top → bottom):

1. **`workspaces`** — Second channel grid slot (swappable **channel layouts**).
2. **`home`** — Primary channel grid (always present, default for everyone).
3. **`gamehub`** — Game Hub (no channel grid; separate UI and state).

**Home is the middle panel** in the vertical “space world” track. The second grid sits above Home; Game Hub sits below.

## Two live channel surfaces

Only **two** channel grids exist in the shell:

| Rail id        | Store / behavior |
|----------------|------------------|
| `home`         | `channels.dataBySpace.home` |
| `workspaces`   | `channels.secondaryChannelProfiles[activeSecondaryChannelProfileId].channelSpace` |

`channels.dataBySpace.workspaces` is a **mirror** of the active secondary profile’s `channelSpace` so persistence merges stay backward compatible.

## Secondary channel profiles

Users can save up to **3** named **channel layouts** for the second space (`MAX_SAVED_WORKSPACES` in `workspaceConstants.js`). Only **one** layout is active at a time (`channels.activeSecondaryChannelProfileId`). Switching the active layout changes which grid data the `workspaces` shell space reads and writes.

- **UI:** Settings → Workspaces → **Second space channel layouts**.
- **Rail label:** The `workspaces` rail button shows the **active layout name** (truncated) or “Second”.

## Saved “workspaces” (full environments)

Separate from the above: **Settings → Workspaces → Workspace manager** saves **full app snapshots** (wallpaper, theme, ribbon, entire `channels` object, sounds, etc.) as `workspaces.items` with `activeWorkspaceId`. That feature is unchanged; it is **not** the same as secondary channel profiles, though both use the same `MAX_SAVED_WORKSPACES` cap for simplicity.

## Space transitions and channel drag

- `spaces.isTransitioning` is set **true** when `activeSpaceId` changes and cleared after the space-world slide duration (`App.jsx` + `spaceWorldDurationMs`).
- Channel tile drag/reorder is disabled while `spaces.isTransitioning` or while page navigation is animating (`navigation.isAnimating`).

## Game Hub

Game Hub does not use `PaginatedChannels` or secondary profiles. Its state lives under `gameHub` and should not be affected by channel layout switching.

## Key files

- `src/utils/channelSpaces.js` — `DEFAULT_SHELL_SPACE_ORDER`, `normalizeShellSpaceOrder`, `getSecondaryChannelSpaceData`, migration helpers.
- `src/utils/useConsolidatedAppStore.js` — `secondaryChannelProfiles`, `activeSecondaryChannelProfileId`, `patchSecondaryChannelSpace`, `spaces.isTransitioning`, new profile actions.
- `src/App.jsx` — rail order, space-world transform, transition flag effect.
- `src/components/spaces/SpaceRail.jsx` — rail order and secondary layout label.
- `src/components/settings/SecondaryChannelProfilesCard.jsx` — manage secondary layouts.
