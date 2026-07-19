# Shell spaces and channel grids (Wee)

How **vertical shell spaces**, **channel grids**, **Media Hub**, and **saved looks** relate.

## Default rail destinations

Canonical order (top → bottom), when Media Hub is **off**:

1. **`home`** — Primary channel grid (casual / default mood strip).
2. **`workspaces`** — Focus: second Home-like channel grid (work / alternate mood). The internal id is retained for persistence compatibility; the product label is **Focus**.
3. **`gamehub`** — Game Hub (no channel grid; separate UI and state).

When **`spaces.mediaHubEnabled`** is true, **`mediahub`** is inserted after Focus and before Game Hub:

`home → workspaces → mediahub → gamehub`

New installs start with Media Hub **off**. When disabled, `MediaHubSpace` is not mounted.

Normalize via `normalizeShellSpaceOrder(order, { mediaHubEnabled })` in [`channelSpaces.js`](../src/utils/channelSpaces.js).

## Two live channel surfaces

| Rail id        | Store / behavior |
|----------------|------------------|
| `home`         | `channels.dataBySpace.home` |
| `workspaces`   | `channels.dataBySpace.workspaces` |

`resolveActiveChannelSpaceKey(activeSpaceId)` returns `'workspaces'` when Focus is active, otherwise `'home'` (including when Media Hub / Game Hub is active — channel nav is hidden there).

Both boards use `PaginatedChannels` + the same board mutation engine (`boardMutation.js`: fixed punch holes, slots-first reorder, `relayoutBoard`).

## Naming (avoid confusion)

| Term | Meaning |
|------|---------|
| **Focus** / rail `workspaces` | Second live channel strip; `workspaces` is only its stable internal id |
| **Presets / Looks** | Shareable atmosphere across spaces/pages; never channel boards |

## Look: wallpaper per space / per page

Per-space appearance lives in `appearanceBySpace.{home\|workspaces\|mediahub\|gamehub}`.

Home and Focus support:

- Space-level wallpaper override, or
- `wallpaperScope: 'perPage'` + `wallpaperByPage[pageIndex]`
- `ribbonScope: 'space' | 'perPage'` + `ribbonByPage[pageIndex]` (lean look fields: color, glass)

Configure in Settings → **Wallpaper** (space/page look + ribbon scope). Dock edits chrome and links back to Wallpaper for scope.

Resolve order: page URL → space override → global `wallpaper.current`. Page flips and space switches crossfade via `useSpaceWallpaperCrossfade` (page uses `CHANNEL_PAGE_FLIP_MS`, space uses shell duration). Ribbon colors tween via `useRibbonLookTransition`.

**Wallpaper match + page flips:** ambient palettes are cached per wallpaper URL (session LRU in `wallpaperAmbientPaletteCache.js`). On flip, a cache hit applies immediately so the ribbon can morph with the wallpaper instead of waiting for a late extract. Paint priority: Spotify match → explicit `ribbonByPage` look → match-from-URL-cache → space/manual. Neighbors are prefetched after settle.

## Grid layout

- Space-level `layout` `{ columns, rows, totalPages, peekPercent }` per board.
- Optional `layoutByPage[pageIndex]` overrides columns/rows (“This page only” in Channels & layout). Strip CSS geometry stays space-level; denser page overrides are stored for settings/occupancy when they match strip density.

## Board mutation

See `src/utils/boardMutation.js`: punched holes are fixed geometry during drag; widgets and channels are first-class movable occupants; layout shrink/grow remaps content instead of silently truncating.

## Presets

Looks capture wallpaper, cycling presentation, ribbon/dock, overlay, theme toggles, and `appearanceBySpace` (including per-page wallpaper/ribbon maps). Applying a Look never replaces `channels.dataBySpace.home` or `channels.dataBySpace.workspaces`.

Legacy `visual+homeChannels` files remain readable for migration, but new saves are visual-only. Community sharing uploads the wallpaper visible at capture time and scrubs private scoped URLs.

## Space transitions and channel drag

- `spaces.isTransitioning` is set when `activeSpaceId` changes and cleared after the space-world slide (`App.jsx` + `spaceShellMotion`).
- Channel drag is disabled while transitioning or while `navigation.isAnimating`.

## Key files

- `src/utils/channelSpaces.js` — shell order, Media Hub flag helpers, channel space data
- `src/utils/boardMutation.js` — reorder / punch / relayout SSOT
- `src/utils/useConsolidatedAppStore.js` — spaces + channel actions
- `src/App.jsx` — space-world track; conditional Media Hub mount
- `src/components/spaces/WeeGooeySpacePill.jsx` — rail
- `src/components/settings/WorkspacesSettingsTab.jsx` — Home Profiles + Show Media Hub
- `src/components/settings/ChannelsLayoutSettingsTab.jsx` — Home/Focus layout + page overrides
- `src/components/settings/WallpaperSettingsTab.jsx` — library + space/page wallpaper + ribbon scope
- `src/hooks/useSpaceWallpaperCrossfade.js` — wallpaper space/page crossfade
- `src/hooks/useRibbonLookTransition.js` — ribbon color tween on look change
- `src/hooks/useWallpaperAmbientColor.js` — wallpaper match → ambient + ribbon (URL LRU)
- `src/utils/theme/wallpaperAmbientPaletteCache.js` — session palette cache for page-flip sync
