# Graph Report - .  (2026-07-12)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1548 nodes · 3828 edges · 110 communities (63 shown, 47 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.53)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cdb34ad8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- PresetsSettingsTab.jsx
- useConsolidatedAppStore.js
- PaginatedChannels.jsx
- FloatingSpotifyWidget.jsx
- WiiRibbon.jsx
- WallpaperSettingsTab.jsx
- AuraCollectionsSection.jsx
- devDependencies
- App.jsx
- SettingsModal.jsx
- AdminPanel.jsx
- ChannelModal.jsx
- scripts
- ChannelsLayoutSettingsTab.jsx
- WToggle.jsx
- supabase.js
- index.js
- MediaHubSpace.jsx
- WeeModalFieldCard
- managers.js
- SpotifyService
- WButton.jsx
- AudioManager
- Text
- GameHubSpace.jsx
- GameHubGameArtPanel.jsx
- compilerOptions
- Channel.jsx
- useWeeMotion
- mediaLibraryCache.js
- weeMotion.js
- keyboardShortcuts.js
- Text.jsx
- custom-installer.js
- ChannelModalChannelArtPanel.jsx
- PerformanceMonitor
- dependencies
- build
- WeeGooeySpacePill.jsx
- AuthService
- package.json
- ChannelModalSuggestedGames.jsx
- logWarn
- hub-modal-overhaul-reference.jsx
- files
- tokens.js
- ErrorBoundary
- mediaHubLocalUtils.js
- MediaLibraryBrowser.jsx
- applyPrimaryAccentFromHex.js
- useChannelInteractions.js
- useAppUpdater
- useHubSpaceEntrance.js
- useWallpaperDataFileSync.js
- soundquest-prototype.jsx
- test-media-library.js
- test-tags-upload.js
- test-update-check.js
- react
- debug-buckets.js
- debug-storage-detailed.js
- check-bucket-names.js
- create-supabase-buckets.js
- test-anon-key.js
- test-complete-upload.js
- test-storage-direct.js
- test-supabase.js
- test-supabase-buckets.js
- test-upload.js
- supabase.generated.ts
- cors
- @dnd-kit/core
- @dnd-kit/sortable
- @dnd-kit/utilities
- electron-updater
- express
- framer-motion
- fs-extra
- fuse.js
- gifuct-js
- @headlessui/react
- lucide-react
- node-fetch
- p-queue
- prop-types
- @radix-ui/react-context-menu
- react-dom
- react-freezeframe-vite
- react-icons
- sharp
- spotify-web-api-js
- @supabase/supabase-js
- systeminformation
- @tanstack/react-virtual
- vdf
- windows-shortcuts
- zustand
- ScrollArea.jsx
- COLLECTION_FLY_OUT_MS
- CHANNEL_IDLE_EASE
- supabaseSpoke

## God Nodes (most connected - your core abstractions)
1. `Text()` - 58 edges
2. `WButton` - 44 edges
3. `useWeeMotion()` - 39 edges
4. `scripts` - 32 edges
5. `useMotionFeedback()` - 32 edges
6. `App()` - 30 edges
7. `WeeModalFieldCard()` - 29 edges
8. `WToggle` - 26 edges
9. `createWeeTransition()` - 24 edges
10. `SpotifyService` - 24 edges

## Surprising Connections (you probably didn't know these)
- `syncWallpaperDataFileFromStore()` --references--> `p-queue`  [EXTRACTED]
  src/hooks/useWallpaperDataFileSync.js → package.json
- `flushDebouncedSettingsWrites()` --references--> `p-queue`  [EXTRACTED]
  src/utils/electronApi.js → package.json
- `lazyNamedExport()` --references--> `react`  [EXTRACTED]
  src/App.jsx → package.json
- `createOptimizedComponent()` --references--> `react`  [EXTRACTED]
  src/utils/usePerformanceOptimization.js → package.json
- `ChannelModal()` --indirect_call--> `preloadMediaLibrary()`  [INFERRED]
  src/components/channels/ChannelModal.jsx → src/utils/mediaLibraryCache.js

## Import Cycles
- 4-file cycle: `src/components/app-library/CommunityPresets.jsx -> src/components/modals/index.js -> src/components/modals/PrimaryActionsModal.jsx -> src/components/app-library/index.js -> src/components/app-library/CommunityPresets.jsx`

## Communities (110 total, 47 thin omitted)

### Community 0 - "PresetsSettingsTab.jsx"
Cohesion: 0.06
Nodes (61): PresetsCommunityCard, PresetsSaveCurrentCard, PresetsSavedListCard, PresetsSpotifyMatchSection, PRESET_UPDATE_SCOPE_OPTIONS, SecondaryChannelProfilesCard, WorkspaceSwitcherModal(), WInput (+53 more)

### Community 1 - "useConsolidatedAppStore.js"
Cohesion: 0.06
Nodes (65): base, m, patch, PageNavigation(), SlideNavigation(), WiiSideNavIconPress(), WiiSideNavigation(), useChannelSpaceKey() (+57 more)

### Community 2 - "PaginatedChannels.jsx"
Cohesion: 0.05
Nodes (55): Channel, AuraHubModalFrame(), ChannelDragOverlayFrame(), ChannelDropTargetMotion(), buildDropMicroSparks(), buildDropParticles(), buildLiftParticles(), ChannelReorderVfxPortal() (+47 more)

### Community 3 - "FloatingSpotifyWidget.jsx"
Cohesion: 0.06
Nodes (43): LaunchErrorToast(), AuraHero(), buildHeroStats(), hoursShort(), applyCustomArtOverrides(), buildDynamicCollections(), buildHubData(), effectiveRecentSeconds() (+35 more)

### Community 4 - "WiiRibbon.jsx"
Cohesion: 0.06
Nodes (25): WiiDock(), adjustColorIntensity(), createColorVariations(), DockParticleSystem, hexToRgb(), Particle, PARTICLE_TYPES, WiiStyleButton() (+17 more)

### Community 6 - "WallpaperSettingsTab.jsx"
Cohesion: 0.07
Nodes (36): GameHubMinimalDock(), IsolatedWallpaperBackground, IsolatedWallpaperBackgroundInner(), spaceParallaxBackgroundYPercent(), SpotifyGradientOverlay(), SpotifyImmersiveOverlay(), WallpaperOverlay(), SpaceWallpaperAppearanceSection() (+28 more)

### Community 7 - "AuraCollectionsSection.jsx"
Cohesion: 0.10
Nodes (32): AuraCollectionsSection(), nextFrame(), preloadGameArt(), shouldIgnoreCollectionCloseTarget(), waitMs(), AuraGameCard, COLLECTION_FLY_PHASE_MS, defaultFlyLayerParent() (+24 more)

### Community 8 - "devDependencies"
Cohesion: 0.05
Nodes (39): autoprefixer, concurrently, cross-env, electron, electron-builder, eslint, @eslint/js, eslint-plugin-react (+31 more)

### Community 9 - "App.jsx"
Cohesion: 0.08
Nodes (33): App(), LazyAdminPanelWidget, LazyClassicWiiDock, LazyFloatingSpotifyWidget, LazyGameHubSpace, LazyMediaHubSpace, LazyPageNavigation, LazyPaginatedChannels (+25 more)

### Community 10 - "SettingsModal.jsx"
Cohesion: 0.08
Nodes (30): DevReactProfiler(), AdvancedSettingsTab, ChannelsLayoutSettingsTab, ColorsSettingsTab, GameHubSettingsTab, GeneralSettingsTab, MonitorSettingsTab, MotionFeedbackSettingsTab (+22 more)

### Community 11 - "AdminPanel.jsx"
Cohesion: 0.13
Nodes (28): AdminPanel(), EMPTY_CUSTOM, AdminPanelWidget(), ActionCommand(), QuickAccessItem(), AuthModal(), ConfirmationModal(), ApiIntegrationsSettingsTab() (+20 more)

### Community 12 - "ChannelModal.jsx"
Cohesion: 0.11
Nodes (19): ChannelModal(), ChannelModalUnifiedPathBlock(), ChannelPathSmartSuggestions(), WeeChannelModal(), useChannelModalHoverSound(), useChannelModalInitialization(), WeeModalRail(), WeeModalRailItem() (+11 more)

### Community 13 - "scripts"
Cohesion: 0.06
Nodes (32): scripts, build, dev, lint, lint:eslint, make, migrate:media, package (+24 more)

### Community 14 - "ChannelsLayoutSettingsTab.jsx"
Cohesion: 0.09
Nodes (10): CHANNEL_SPACE_OPTIONS, IDLE_TYPE_ITEMS, KEN_BURNS_EASING_OPTIONS, KEN_BURNS_MODE_OPTIONS, SettingsToggleFieldCard(), GLASS_TEST_BTN_STYLE, GOOEY_HOVER_MODES, Slider() (+2 more)

### Community 15 - "WToggle.jsx"
Cohesion: 0.12
Nodes (10): SoundManagementContent, SOUND_CATEGORIES, SoundManagementCore, SettingsActionMenu, SOUND_CATEGORY_DESCRIPTIONS, SOUND_CATEGORY_ICONS, ResourceUsageIndicator(), GooeySettingsRow() (+2 more)

### Community 16 - "supabase.js"
Cohesion: 0.12
Nodes (24): CommunityPresets(), loadButtonConfigs(), NavigationSettingsTab(), logError(), applyMediaSearchFilters(), createSession(), downloadPreset(), ensureSession() (+16 more)

### Community 17 - "index.js"
Cohesion: 0.13
Nodes (11): UnifiedAppPathCard, UnifiedAppPathSearch(), PrimaryActionsModal, WeeButton(), WeeChoiceTileGrid(), WeeDescriptionToggleRow(), WeeHelpLinkButton(), WeeHelpParagraph() (+3 more)

### Community 18 - "MediaHubSpace.jsx"
Cohesion: 0.13
Nodes (18): MediaHubDiscoverGrid(), EMPTY_OBJECT, episodesForSeason(), formatImdbRating(), getPosterUrl(), GRID_LIST_PARENT_VARIANTS, MediaHubItemDetail(), MediaHubSpace() (+10 more)

### Community 19 - "WeeModalFieldCard"
Cohesion: 0.22
Nodes (6): QUICK_LINKS, SettingsTabPageHeader(), SettingsWeeSection(), CATEGORY_ICONS, CATEGORY_ORDER, WeeModalFieldCard()

### Community 20 - "managers.js"
Cohesion: 0.14
Nodes (17): markAppLibraryBackgroundPrefetchScheduled(), collectPrioritizedWarmMediaUrls(), collectWarmMediaUrlsFromStore(), isHttpLike(), warmedUrls, warmImageUrlsOnIdle(), dedupeMerge(), flush() (+9 more)

### Community 22 - "WButton.jsx"
Cohesion: 0.14
Nodes (8): PresetListItem, buttonVariants, variantSecondarySurface, WButton, VARIANT_MAP, sizeClasses, WeeEmphasisText(), WRadioGroup()

### Community 23 - "AudioManager"
Cohesion: 0.15
Nodes (3): ChannelModalBehaviorTab(), AudioManager, waitForAudioReady()

### Community 24 - "Text"
Cohesion: 0.15
Nodes (8): DIRECTION_OPTIONS, DockEffectsModal(), EFFECT_TYPES, ImageModal(), WeeUpdateProgress(), Text(), WeeCard(), WeeModalShell()

### Community 25 - "GameHubSpace.jsx"
Cohesion: 0.15
Nodes (17): AuraLibrarySection(), GameHubSpace(), smoothstep01(), useMinWidthDockMorph(), orderHubCollectionItems(), sortHubGamesByName(), useHeroMediaCrossfade(), useLaunchFeedback() (+9 more)

### Community 26 - "GameHubGameArtPanel.jsx"
Cohesion: 0.23
Nodes (17): buildHubDisplayMedia(), GameHubGameArtPanel(), readStoredArtSubtab(), ImageSearchModal(), useChannelModalMedia(), clearMatchCache(), clearMediaLibraryCache(), preloadMediaLibrary() (+9 more)

### Community 27 - "compilerOptions"
Cohesion: 0.10
Nodes (20): DOM, DOM.Iterable, ES2022, scripts, src, compilerOptions, allowJs, checkJs (+12 more)

### Community 28 - "Channel.jsx"
Cohesion: 0.20
Nodes (11): buildKenBurnsProps(), ChannelMediaPreview(), ChannelModalsHost(), useChannelAdaptiveEmptyStyle(), useChannelEffectiveState(), useChannelMediaPreview(), KenBurnsImage(), PAN_DIRECTIONS (+3 more)

### Community 29 - "useWeeMotion"
Cohesion: 0.16
Nodes (13): statusLabel(), UpdateModal(), createWeeTransition(), useWeeMotion(), WeeDockSettingsSubtabs(), SIZE_CLASS, VARIANT_CLASS, WEE_GOOEY_ICON_PRESS (+5 more)

### Community 30 - "mediaLibraryCache.js"
Cohesion: 0.18
Nodes (18): MEDIA_LIBRARY_SORT_OPTIONS, useMediaLibraryBrowser(), filterMediaLibraryCache(), findGameMedia(), fuzzyMatch(), getAllMatchingMedia(), getCacheStatus(), getMediaLibraryPage() (+10 more)

### Community 31 - "weeMotion.js"
Cohesion: 0.18
Nodes (16): WiiChannelStrip(), SPACE_SHELL_ENTRANCE_TIERS, createGameHubMorphLibraryFollowVariants(), createHomeChannelEntranceBandVariants(), createHubEntranceBandVariants(), createHubEntranceFadeVariants(), createHubEntranceOrchestratorVariants(), createMediaHubGridContainerVariants() (+8 more)

### Community 32 - "keyboardShortcuts.js"
Cohesion: 0.25
Nodes (17): renderShortcutKeyChips(), RESERVED_SHORTCUT_CHORDS, ShortcutCaptureControl(), checkShortcutConflict(), createDefaultKeyboardShortcuts(), DEFAULT_SHORTCUTS, executeShortcutAction(), formatShortcut() (+9 more)

### Community 33 - "Text.jsx"
Cohesion: 0.23
Nodes (8): EASING_OPTIONS, OVERLAY_EFFECT_OPTIONS, SLIDE_DIRECTION_MODE_OPTIONS, SLIDE_DIRECTION_OPTIONS, WALLPAPER_ANIMATIONS, variantMap, WeeSpaceRailPillButton(), WSelect()

### Community 34 - "custom-installer.js"
Cohesion: 0.17
Nodes (11): { app, BrowserWindow, ipcMain, shell, dialog }, createDesktopShortcut(), createStartMenuShortcut(), { exec }, finalizeInstallation(), fs, INSTALL_STEPS, os (+3 more)

### Community 35 - "ChannelModalChannelArtPanel.jsx"
Cohesion: 0.27
Nodes (12): ChannelModalChannelArtPanel(), readStoredArtSubtab(), buildCandidateTerms(), buildQueryTokens(), ChannelModalInlineMediaSuggestions(), deriveChannelArtSearchQuery(), formatMediaKind(), normalizeText() (+4 more)

### Community 37 - "dependencies"
Cohesion: 0.18
Nodes (11): better-sqlite3, fast-average-color, fast-deep-equal, jszip, dependencies, better-sqlite3, fast-average-color, fast-deep-equal (+3 more)

### Community 38 - "build"
Cohesion: 0.18
Nodes (11): build, appId, directories, extraFiles, extraResources, productName, publish, win (+3 more)

### Community 39 - "WeeGooeySpacePill.jsx"
Cohesion: 0.25
Nodes (6): getNextSpace(), SPACE_META, WeeGooeySpacePill(), createWeeShellRailContainerVariants(), createWeeShellRailItemVariants(), getWeeShellChromeEntrance()

### Community 41 - "package.json"
Cohesion: 0.20
Nodes (9): author, description, main, name, private, repository, type, url (+1 more)

### Community 42 - "ChannelModalSuggestedGames.jsx"
Cohesion: 0.33
Nodes (8): ChannelModalSuggestedGames(), dedupeInstalledAgainstStores(), filterGames(), getSuggestedCarouselKey(), paginateGames(), sortGames(), SOURCE_FILTER, resolveMimeTypeFromMediaLibraryRow()

### Community 43 - "logWarn"
Cohesion: 0.33
Nodes (5): SpotifyLiveGradientWallpaper(), formatMessage(), logWarn(), registerSpotifyGradientSave(), SPOTIFY_SCOPES

### Community 44 - "hub-modal-overhaul-reference.jsx"
Cohesion: 0.20
Nodes (3): MOCK_LIBRARY, MOCK_SUGGESTIONS, SPACES

### Community 45 - "files"
Cohesion: 0.22
Nodes (9): files, dist/**/*, electron.cjs, launchApp.cjs, main/**/*, preload.cjs, public/sounds/**/*, scripts/load-env.cjs (+1 more)

### Community 46 - "tokens.js"
Cohesion: 0.25
Nodes (7): colors, fontSizes, navigation, radii, scrollbar, shadows, spacing

### Community 48 - "mediaHubLocalUtils.js"
Cohesion: 0.62
Nodes (6): folderGroupSubtitle(), folderGroupTitle(), getParentDirNormalized(), groupLocalFilesByFolder(), normalizePathSlashes(), relativeParentKeyFromRoot()

### Community 49 - "MediaLibraryBrowser.jsx"
Cohesion: 0.33
Nodes (5): MediaItem(), MediaLibraryBrowser(), MEDIA_LIBRARY_FILETYPE_OPTIONS, MEDIA_LIBRARY_PAGE_SIZE_OPTIONS, downloadMedia()

### Community 50 - "applyPrimaryAccentFromHex.js"
Cohesion: 0.48
Nodes (6): usePrimaryAccentThemeEffect(), adjustL(), applyPrimaryAccentFromHex(), fmt(), hexToRgb(), rgbToHslComponents()

### Community 51 - "useChannelInteractions.js"
Cohesion: 0.60
Nodes (3): useChannelInteractions(), getRecentLaunchHintTtlMs(), launchWithFeedback()

### Community 52 - "useAppUpdater"
Cohesion: 0.60
Nodes (5): UpdatesSettingsTab(), applyUpdaterStatus(), ensureAppUpdaterListeners(), normalizeReleaseNotes(), useAppUpdater()

### Community 53 - "useHubSpaceEntrance.js"
Cohesion: 0.60
Nodes (5): hubEntranceStorageKey(), memoryFullComplete, readTier(), useHubSpaceEntrance(), writeFullComplete()

### Community 54 - "useWallpaperDataFileSync.js"
Cohesion: 0.60
Nodes (5): pickWallpaperFileSlice(), selectWallpaperDomain(), syncWallpaperDataFileFromStore(), useWallpaperDataFileSync(), wallpaperFileWriteQueue

### Community 56 - "test-media-library.js"
Cohesion: 0.40
Nodes (3): { createClient }, supabase, { v4: uuidv4 }

### Community 57 - "test-tags-upload.js"
Cohesion: 0.40
Nodes (3): { createClient }, supabase, { v4: uuidv4 }

### Community 58 - "test-update-check.js"
Cohesion: 0.40
Nodes (4): { execSync }, fs, packageJson, path

### Community 59 - "react"
Cohesion: 0.50
Nodes (4): react, react, lazyNamedExport(), createOptimizedComponent()

## Knowledge Gaps
- **281 isolated node(s):** `PLAYLISTS`, `SONGS`, `name`, `version`, `main` (+276 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **47 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`, `react`, `cors`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `electron-updater`, `express`, `framer-motion`, `fs-extra`, `fuse.js`, `gifuct-js`, `@headlessui/react`, `lucide-react`, `node-fetch`, `p-queue`, `prop-types`, `@radix-ui/react-context-menu`, `react-dom`, `react-freezeframe-vite`, `react-icons`, `sharp`, `spotify-web-api-js`, `@supabase/supabase-js`, `systeminformation`, `@tanstack/react-virtual`, `vdf`, `windows-shortcuts`, `zustand`?**
  _High betweenness centrality (0.180) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `dependencies`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Why does `lazyNamedExport()` connect `react` to `App.jsx`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **What connects `PLAYLISTS`, `SONGS`, `name` to the rest of the system?**
  _281 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PresetsSettingsTab.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06358543417366946 - nodes in this community are weakly interconnected._
- **Should `useConsolidatedAppStore.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06138841078600115 - nodes in this community are weakly interconnected._
- **Should `PaginatedChannels.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05389942788316772 - nodes in this community are weakly interconnected._