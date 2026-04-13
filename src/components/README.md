# Components Organization

This folder now uses domain folders and barrels to keep related components together.

## Domains

- `core/`  
  Error boundary, splash, and base modal primitives.

- `navigation/`  
  Channel paging, navigation, and side navigation.

- `dock/`  
  Ribbon/dock rendering and dock visual effects.

- `overlays/`  
  Wallpaper and Spotify visual overlays.

- `widgets/`  
  Floating widgets and performance panel components.

- `admin/`  
  Admin panel UI and the floating admin widget.

- `audio/`  
  Sound management modal/content and shared sound UI logic.

- `app-library/`  
  Unified app path cards, presets list UI, and action command rows.

- `modals/`  
  Reusable modal flows (auth, confirmation, image search, updates).

- `settings/`  
  Settings modal and per-tab settings components (`settings/index.js` barrel).

- `channels/`  
  Channel layout primitives (`channels/index.js` barrel).

## Usage

Prefer importing through domain barrels for new code, for example:

- `import { ErrorBoundary } from './components/core';`
- `import { WallpaperOverlay } from './components/overlays';`
- `import { PaginatedChannels } from './components/navigation';`
- `import { AdminPanelWidget } from './components/admin';`
