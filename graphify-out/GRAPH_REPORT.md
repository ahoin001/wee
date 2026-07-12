# Graph Report - wee  (2026-07-12)

## Corpus Check
- 379 files · ~229,410 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1894 nodes · 4251 edges · 145 communities (96 shown, 49 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 54 edges (avg confidence: 0.53)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b1c339f9`
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
- 🖥️ Multi-Monitor Settings Guide
- Animation Audit Playbook
- WallpaperSettingsTab.jsx
- Apple Design
- useChannelOperations.js
- WeePressSurface.jsx
- Spotify Integration Setup Guide
- useAppInitialization.js
- Glossary
- Release Guide
- Electron Development Guidelines
- hubData.js
- Supabase Setup for Community Presets
- useConsolidatedAppStore.js
- [1.9.1] - 2024-01-XX
- README.md
- usePerformanceOptimization.js
- mediaWarmScheduler.js
- SystemInfoWidget.jsx
- UnifiedDockSettingsTab.jsx
- Agent and contributor guide (Wee)
- Performance baselines (Wee)
- Shell spaces and channel grids (Wee)
- Style Architecture Map
- ChannelReorderVfx.jsx
- [Unreleased]
- Primary accent (Wii blue) — theme audit
- Channel editor — follow-ups for review
- Default Sounds for Wee
- WeeModalShell.jsx
- WiiSideNavigation.jsx
- How to Set Up Supabase
- Components Organization
- Features Available
- useBackgroundMusicEffects

## God Nodes (most connected - your core abstractions)
1. `Text()` - 57 edges
2. `WButton` - 43 edges
3. `useWeeMotion()` - 38 edges
4. `scripts` - 32 edges
5. `useMotionFeedback()` - 31 edges
6. `App()` - 29 edges
7. `WeeModalFieldCard()` - 29 edges
8. `createWeeTransition()` - 27 edges
9. `WToggle` - 25 edges
10. `AudioManager` - 24 edges

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

## Communities (145 total, 49 thin omitted)

### Community 0 - "PresetsSettingsTab.jsx"
Cohesion: 0.07
Nodes (58): PresetsCommunityCard, PresetsSaveCurrentCard, PresetsSavedListCard, PresetsSpotifyMatchSection, PRESET_UPDATE_SCOPE_OPTIONS, WorkspaceSwitcherModal(), applyPresetData(), normalizeSettingsShape() (+50 more)

### Community 1 - "useConsolidatedAppStore.js"
Cohesion: 0.12
Nodes (38): base, m, patch, hasPatchSettingsApi(), selectPersistedSlices(), useUnifiedSettingsPersistence(), DEFAULT_CHANNEL_NAVIGATION, CHANNEL_SPACE_KEYS (+30 more)

### Community 2 - "PaginatedChannels.jsx"
Cohesion: 0.29
Nodes (11): ChannelDragOverlayFrame(), ChannelDropTargetMotion(), ChannelReorderVfxPortal(), measureChannelSlotCenter(), channelDragId(), ChannelSlotDnd(), channelSlotId(), parseChannelDnDId() (+3 more)

### Community 3 - "FloatingSpotifyWidget.jsx"
Cohesion: 0.10
Nodes (19): FloatingSpotifyWidget(), SpotifyBrowseView(), SpotifyMiniPlayerBar(), SpotifyPlayerView(), SpotifySettingsView(), SpotifyWidgetChrome(), getGooeyMintPalette(), GOOEY_HUB_CLASSIC_MINT (+11 more)

### Community 4 - "WiiRibbon.jsx"
Cohesion: 0.07
Nodes (19): WiiDock(), adjustColorIntensity(), createColorVariations(), DockParticleSystem, hexToRgb(), Particle, PARTICLE_TYPES, WiiStyleButton() (+11 more)

### Community 6 - "WallpaperSettingsTab.jsx"
Cohesion: 0.14
Nodes (16): GameHubMinimalDock(), SpotifyGradientOverlay(), SpotifyImmersiveOverlay(), WallpaperOverlay(), PerformanceMonitor(), CHANNEL_IDLE_MS, getChannelIdleDurationMs(), WALLPAPER_OVERLAY_COLORS (+8 more)

### Community 7 - "AuraCollectionsSection.jsx"
Cohesion: 0.10
Nodes (32): AuraCollectionsSection(), nextFrame(), preloadGameArt(), shouldIgnoreCollectionCloseTarget(), waitMs(), AuraGameCard, COLLECTION_FLY_PHASE_MS, defaultFlyLayerParent() (+24 more)

### Community 8 - "devDependencies"
Cohesion: 0.05
Nodes (39): autoprefixer, concurrently, cross-env, electron, electron-builder, eslint, @eslint/js, eslint-plugin-react (+31 more)

### Community 9 - "App.jsx"
Cohesion: 0.07
Nodes (38): App(), LazyAdminPanelWidget, LazyClassicWiiDock, LazyFloatingSpotifyWidget, LazyGameHubSpace, LazyMediaHubSpace, LazyPageNavigation, LazyPaginatedChannels (+30 more)

### Community 10 - "SettingsModal.jsx"
Cohesion: 0.08
Nodes (22): DevReactProfiler(), AdvancedSettingsTab, ColorsSettingsTab, GeneralSettingsTab, MonitorSettingsTab, MotionFeedbackSettingsTab, NavigationPillSettingsTab, PresetsSettingsTab (+14 more)

### Community 11 - "AdminPanel.jsx"
Cohesion: 0.18
Nodes (22): AdminPanel(), EMPTY_CUSTOM, AdminPanelWidget(), ActionCommand(), QuickAccessItem(), AuthModal(), ConfirmationModal(), ApiIntegrationsSettingsTab() (+14 more)

### Community 12 - "ChannelModal.jsx"
Cohesion: 0.19
Nodes (10): ChannelModal(), ChannelModalUnifiedPathBlock(), ChannelModalsHost(), ChannelPathSmartSuggestions(), useChannelModalInitialization(), getSmartPathSuggestions(), inferLaunchTypeFromPath(), normalizeChannelPath() (+2 more)

### Community 13 - "scripts"
Cohesion: 0.06
Nodes (32): scripts, build, dev, lint, lint:eslint, make, migrate:media, package (+24 more)

### Community 14 - "ChannelsLayoutSettingsTab.jsx"
Cohesion: 0.29
Nodes (13): clampGooeyIntensity(), createGooeyCloseSpring(), createGooeyModalPanelVariants(), createGooeyOpenSpring(), DEFAULT_GOOEY_PHYSICS, GOOEY_HOVER_MODES, lerp(), mergeGooeyPhysics() (+5 more)

### Community 15 - "WToggle.jsx"
Cohesion: 0.12
Nodes (35): useChannelInteractions(), SOUND_CATEGORY_DESCRIPTIONS, SOUND_CATEGORY_ICONS, ResourceUsageIndicator(), useChannelModalHoverSound(), getRecentLaunchHintTtlMs(), saveUnifiedSoundSettings(), launchWithFeedback() (+27 more)

### Community 16 - "supabase.js"
Cohesion: 0.13
Nodes (18): applyMediaSearchFilters(), createSession(), ensureSession(), generatePresetThumbnail(), getCachedReadResult(), getCommunityPresetUpdates(), getFeaturedPresets(), getPopularMedia() (+10 more)

### Community 17 - "index.js"
Cohesion: 0.07
Nodes (19): UnifiedAppPathCard, UnifiedAppPathSearch(), WeeChannelModal(), PrimaryActionsModal, WeeButton(), WeeChoiceTileGrid(), WeeDescriptionToggleRow(), sizeClasses (+11 more)

### Community 18 - "MediaHubSpace.jsx"
Cohesion: 0.13
Nodes (18): MediaHubDiscoverGrid(), EMPTY_OBJECT, episodesForSeason(), formatImdbRating(), getPosterUrl(), GRID_LIST_PARENT_VARIANTS, MediaHubItemDetail(), MediaHubSpace() (+10 more)

### Community 19 - "WeeModalFieldCard"
Cohesion: 0.20
Nodes (8): CHANNEL_SPACE_OPTIONS, ChannelsLayoutSettingsTab, IDLE_TYPE_ITEMS, KEN_BURNS_EASING_OPTIONS, KEN_BURNS_MODE_OPTIONS, SettingsTabPageHeader(), SettingsToggleFieldCard(), WeeModalFieldCard()

### Community 20 - "managers.js"
Cohesion: 0.26
Nodes (7): markAppLibraryBackgroundPrefetchScheduled(), filterSteamToolEntries(), STEAM_TOOL_APP_IDS, createFloatingWidgetManager(), isRendererActive(), createStoreManagers(), createPerformanceManager()

### Community 22 - "WButton.jsx"
Cohesion: 0.11
Nodes (14): CommunityPresets(), PresetListItem, AuraHubModalFrame(), ImageModal(), GameHubSettingsTab, SecondaryChannelProfilesCard, WorkspacesSettingsTab, buttonVariants (+6 more)

### Community 24 - "Text"
Cohesion: 0.16
Nodes (9): DIRECTION_OPTIONS, DockEffectsModal(), EFFECT_TYPES, statusLabel(), UpdateModal(), Text(), variantMap, WeeCard() (+1 more)

### Community 25 - "GameHubSpace.jsx"
Cohesion: 0.21
Nodes (13): AuraLibrarySection(), GameHubSpace(), smoothstep01(), useMinWidthDockMorph(), orderHubCollectionItems(), sortHubGamesByName(), useHeroMediaCrossfade(), useLaunchFeedback() (+5 more)

### Community 26 - "GameHubGameArtPanel.jsx"
Cohesion: 0.24
Nodes (16): buildHubDisplayMedia(), GameHubGameArtPanel(), readStoredArtSubtab(), ImageSearchModal(), useChannelModalMedia(), clearMediaLibraryCache(), preloadMediaLibrary(), uploadFileToMediaLibraryRow() (+8 more)

### Community 27 - "compilerOptions"
Cohesion: 0.10
Nodes (20): DOM, DOM.Iterable, ES2022, scripts, src, compilerOptions, allowJs, checkJs (+12 more)

### Community 28 - "Channel.jsx"
Cohesion: 0.23
Nodes (10): buildKenBurnsProps(), ChannelMediaPreview(), useChannelAdaptiveEmptyStyle(), useChannelEffectiveState(), useChannelMediaPreview(), KenBurnsImage(), PAN_DIRECTIONS, isGifMediaType() (+2 more)

### Community 29 - "useWeeMotion"
Cohesion: 0.21
Nodes (10): ChannelModalBehaviorTab(), WeeUpdateProgress(), createWeeTransition(), useWeeMotion(), WeeDockSettingsSubtabs(), WeeLayoutActiveDisc(), WeePillFloorShadow(), WeeSegmentedControl() (+2 more)

### Community 30 - "mediaLibraryCache.js"
Cohesion: 0.20
Nodes (16): clearMatchCache(), filterMediaLibraryCache(), findGameMedia(), fuzzyMatch(), getAllMatchingMedia(), getCacheStatus(), getMediaLibraryPage(), getPageCacheKey() (+8 more)

### Community 31 - "weeMotion.js"
Cohesion: 0.18
Nodes (15): GooeyFloatingPanel(), createGameHubMorphLibraryFollowVariants(), createHomeChannelEntranceBandVariants(), createHubEntranceBandVariants(), createHubEntranceFadeVariants(), createHubEntranceOrchestratorVariants(), createMediaHubGridContainerVariants(), createMediaHubGridItemVariants() (+7 more)

### Community 32 - "keyboardShortcuts.js"
Cohesion: 0.20
Nodes (21): renderShortcutKeyChips(), RESERVED_SHORTCUT_CHORDS, ShortcutCaptureControl(), CATEGORY_ICONS, CATEGORY_ORDER, resolveActiveChannelSpaceKey(), checkShortcutConflict(), createDefaultKeyboardShortcuts() (+13 more)

### Community 33 - "Text.jsx"
Cohesion: 0.15
Nodes (12): SettingsWeeSection(), WallpaperCyclingSection(), EASING_OPTIONS, OVERLAY_EFFECT_OPTIONS, SLIDE_DIRECTION_MODE_OPTIONS, SLIDE_DIRECTION_OPTIONS, WALLPAPER_ANIMATIONS, GooeySettingsRow() (+4 more)

### Community 34 - "custom-installer.js"
Cohesion: 0.17
Nodes (11): { app, BrowserWindow, ipcMain, shell, dialog }, createDesktopShortcut(), createStartMenuShortcut(), { exec }, finalizeInstallation(), fs, INSTALL_STEPS, os (+3 more)

### Community 35 - "ChannelModalChannelArtPanel.jsx"
Cohesion: 0.35
Nodes (9): buildCandidateTerms(), buildQueryTokens(), ChannelModalInlineMediaSuggestions(), formatMediaKind(), normalizeText(), rowKey(), rowPublicUrl(), scoreFallbackMedia() (+1 more)

### Community 37 - "dependencies"
Cohesion: 0.18
Nodes (11): better-sqlite3, fast-average-color, fast-deep-equal, jszip, dependencies, better-sqlite3, fast-average-color, fast-deep-equal (+3 more)

### Community 38 - "build"
Cohesion: 0.18
Nodes (11): build, appId, directories, extraFiles, extraResources, productName, publish, win (+3 more)

### Community 39 - "WeeGooeySpacePill.jsx"
Cohesion: 0.13
Nodes (16): LaunchErrorToast(), QUICK_LINKS, getNextSpace(), SPACE_META, WeeGooeySpacePill(), LaunchFeedbackContext, LaunchFeedbackProvider(), createWeeShellRailContainerVariants() (+8 more)

### Community 41 - "package.json"
Cohesion: 0.20
Nodes (9): author, description, main, name, private, repository, type, url (+1 more)

### Community 42 - "ChannelModalSuggestedGames.jsx"
Cohesion: 0.24
Nodes (12): ChannelModalSuggestedGames(), dedupeInstalledAgainstStores(), filterGames(), getSuggestedCarouselKey(), paginateGames(), sortGames(), SOURCE_FILTER, resolveMimeTypeFromMediaLibraryRow() (+4 more)

### Community 43 - "logWarn"
Cohesion: 0.24
Nodes (9): loadButtonConfigs(), SpotifyLiveGradientWallpaper(), NavigationSettingsTab(), formatMessage(), logError(), logWarn(), pruneMediaPageCache(), registerSpotifyGradientSave() (+1 more)

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
Cohesion: 0.24
Nodes (10): ChannelModalChannelArtPanel(), readStoredArtSubtab(), deriveChannelArtSearchQuery(), MediaItem(), MediaLibraryBrowser(), MEDIA_LIBRARY_FILETYPE_OPTIONS, MEDIA_LIBRARY_PAGE_SIZE_OPTIONS, MEDIA_LIBRARY_SORT_OPTIONS (+2 more)

### Community 50 - "applyPrimaryAccentFromHex.js"
Cohesion: 0.06
Nodes (31): 1. First Run Detection, 2. Installation Steps, 3. Shortcut Creation, 4. Completion, Adding New Steps, Best Practices, Common Issues, `custom-installer.js` (+23 more)

### Community 51 - "useChannelInteractions.js"
Cohesion: 0.07
Nodes (25): Aggressive Escalation Triggers, Guidelines, Operating Posture, Part 1 — Findings table (REQUIRED), Part 2 — Verdict (REQUIRED), Remedial Preference Hierarchy, Required Output Format, Reviewing Animations (+17 more)

### Community 52 - "useAppUpdater"
Cohesion: 0.57
Nodes (5): UpdatesSettingsTab(), applyUpdaterStatus(), ensureAppUpdaterListeners(), normalizeReleaseNotes(), useAppUpdater()

### Community 53 - "useHubSpaceEntrance.js"
Cohesion: 0.31
Nodes (8): WiiChannelStrip(), SPACE_SHELL_ENTRANCE_TIERS, createWeeChannelTileItemVariants(), hubEntranceStorageKey(), memoryFullComplete, readTier(), useHubSpaceEntrance(), writeFullComplete()

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

### Community 110 - "🖥️ Multi-Monitor Settings Guide"
Cohesion: 0.08
Nodes (26): **Accessing Monitor Settings**, **Advanced Features**, **Best Practices**, 👨‍💻 For Developers: Running from Source, **Hot-Plugging Support**, **How It Works**, 📥 How to Install (for Users), **Launch Preferences** (+18 more)

### Community 111 - "Animation Audit Playbook"
Cohesion: 0.09
Nodes (21): 1. Purpose & frequency, 2. Easing & duration, 3. Physicality & origin, 4. Interruptibility, 5. Performance, 6. Accessibility, 7. Cohesion & tokens, 8. Missed opportunities (+13 more)

### Community 112 - "WallpaperSettingsTab.jsx"
Cohesion: 0.18
Nodes (16): IsolatedWallpaperBackground, IsolatedWallpaperBackgroundInner(), spaceParallaxBackgroundYPercent(), SpaceWallpaperAppearanceSection(), WallpaperLibrarySection(), WallpaperOverlaySection(), SPACE_WALLPAPER_OPTIONS, useWallpaperSettingsController() (+8 more)

### Community 113 - "Apple Design"
Cohesion: 0.10
Nodes (20): 10. Gesture design details (the "feel" checklist), 11. Frame-level smoothness, 12. Materials & depth — translucency conveys hierarchy, 13. Multimodal feedback — motion + sound + haptics, 14. Reduced motion & accessibility, 15. Typography — optical sizing, tracking, leading, 16. Design foundations — the eight principles, 17. Process (+12 more)

### Community 114 - "useChannelOperations.js"
Cohesion: 0.20
Nodes (16): PageNavigation(), SlideNavigation(), ChannelSpaceContext, ChannelSpaceProvider(), useChannelSpaceKey(), clampPageIndex(), getChannelsPerPage(), getPageBounds() (+8 more)

### Community 115 - "WeePressSurface.jsx"
Cohesion: 0.12
Nodes (15): HUB_MORPH, PLAYFUL_AMPLITUDE, PLAYFUL_SPRINGS, PLAYFUL_VARIANTS, WeeGlassPill, SIZE_CLASS, VARIANT_CLASS, WEE_GOOEY_ICON_PRESS (+7 more)

### Community 116 - "Spotify Integration Setup Guide"
Cohesion: 0.10
Nodes (20): 1. Backend Integration, 2. Real-time Updates, 3. Music-Synced Effects, Common Issues:, Current Limitations, Debug Mode:, Future Enhancements, Next Steps (+12 more)

### Community 117 - "useAppInitialization.js"
Cohesion: 0.19
Nodes (17): buildChannelPatchFromNormalized(), useAppInitialization(), normalizeShellSpaceOrder(), ChannelData, ChannelSettings, normalizeChannelData(), normalizeChannelPayload(), NormalizedChannelPayload (+9 more)

### Community 118 - "Glossary"
Cohesion: 0.11
Nodes (17): Animation Vocabulary, Easing — how speed changes over an animation, Entrances & Exits — how elements appear and disappear, Examples, Feedback & Interaction — responding to the user's actions, Glossary, Instructions, Looping & Ambient Motion — animations that run on their own (+9 more)

### Community 119 - "Release Guide"
Cohesion: 0.11
Nodes (17): 1. Prepare the Release, 1. Update Version, 2. Build and Package, 2. Push the Release, 3. Create GitHub Release, 3. GitHub Actions Will Automatically:, Build Failures, Categories: (+9 more)

### Community 120 - "Electron Development Guidelines"
Cohesion: 0.12
Nodes (16): Auto Updates, Building and Distribution, Content Security Policy, Context Isolation, Core Principles, Electron Development Guidelines, IPC Communication, Main Process (+8 more)

### Community 121 - "hubData.js"
Cohesion: 0.24
Nodes (15): AuraHero(), buildHeroStats(), hoursShort(), applyCustomArtOverrides(), buildDynamicCollections(), buildHubData(), effectiveRecentSeconds(), formatDiskSize() (+7 more)

### Community 122 - "Supabase Setup for Community Presets"
Cohesion: 0.12
Nodes (16): 1. `shared_presets` Table, 2. Storage Buckets, 3. Row Level Security (RLS), Current Status, "Database error" or "RLS policy" Error, Database Setup, For Distribution, Next Steps (+8 more)

### Community 123 - "useConsolidatedAppStore.js"
Cohesion: 0.23
Nodes (9): applyChannelSlotReorder(), channelIdAtIndex(), collectSlots(), moveParallelArrays(), scatterSlots(), snapshotChannelSlotMaps(), DEFAULT_MOTION_FEEDBACK, {
  appLibraryManager,
  unifiedAppManager,
  spotifyManager,
  iconManager,
  navigationManager,
  performanceManager,
  floatingWidgetManager,
} (+1 more)

### Community 124 - "[1.9.1] - 2024-01-XX"
Cohesion: 0.17
Nodes (11): [1.9.1] - 2024-01-XX, [2.7.2] - 2025-01-XX, Added, Added, Changed, Changed, Changelog, Fixed (+3 more)

### Community 125 - "README.md"
Cohesion: 0.18
Nodes (6): Automated, Checks, Modes, Performance Smoke Checklist, PR smell checklist, Documentation

### Community 126 - "usePerformanceOptimization.js"
Cohesion: 0.18
Nodes (5): Channel, VirtualizedChannelList, performanceChecklist, performanceUtils, usePerformanceMonitor()

### Community 127 - "mediaWarmScheduler.js"
Cohesion: 0.29
Nodes (10): collectPrioritizedWarmMediaUrls(), collectWarmMediaUrlsFromStore(), isHttpLike(), warmedUrls, warmImageUrlsOnIdle(), dedupeMerge(), flush(), pendingHigh (+2 more)

### Community 128 - "SystemInfoWidget.jsx"
Cohesion: 0.35
Nodes (8): GLASS_TEST_BTN_STYLE, SystemInfoWidget(), defaultUncontrolledSize(), useFloatingWidgetFrame(), viewportResizeBounds(), clampFloatingWidgetPosition(), getViewportSize(), useFloatingWidgetsState()

### Community 129 - "UnifiedDockSettingsTab.jsx"
Cohesion: 0.33
Nodes (6): DOCK_SUB_TABS, UnifiedDockSettingsTab, CLASSIC_DOCK_THEME_GROUPS, CLASSIC_DOCK_DEFAULT_COLORS, findDockThemePath(), getDockThemeByPath()

### Community 130 - "Agent and contributor guide (Wee)"
Cohesion: 0.22
Nodes (8): Agent and contributor guide (Wee), Always follow, Before you finish a change, Electron, Key files, Motion and modal guardrails, Motion QA checklist, React cleanup guardrails

### Community 131 - "Performance baselines (Wee)"
Cohesion: 0.22
Nodes (8): Baseline capture template (fill before/after each phase), Baseline session log, Example budgets (tune for your machine), How to capture baselines, Motion guardrails (non-negotiable), Native wallpaper helper (decision), Performance baselines (Wee), Scenarios to measure

### Community 132 - "Shell spaces and channel grids (Wee)"
Cohesion: 0.22
Nodes (8): Game Hub, Key files, Saved “workspaces” (full environments), Secondary channel profiles, Shell spaces and channel grids (Wee), Space transitions and channel drag, Three rail destinations, Two live channel surfaces

### Community 133 - "Style Architecture Map"
Cohesion: 0.25
Nodes (8): Anti-Patterns To Avoid, Core Rule, Dynamic Runtime Styling Pattern, Feature Surfaces (Tokenized), Navigation Surfaces, Shared UI Primitives, Style Architecture Map, Token Layers

### Community 134 - "ChannelReorderVfx.jsx"
Cohesion: 0.46
Nodes (6): buildDropMicroSparks(), buildDropParticles(), buildLiftParticles(), DropBurstLayer(), LiftBurstLayer(), randomBetween()

### Community 135 - "[Unreleased]"
Cohesion: 0.29
Nodes (7): Added, Changed, Deprecated, Fixed, Removed, Security, [Unreleased]

### Community 136 - "Primary accent (Wii blue) — theme audit"
Cohesion: 0.29
Nodes (6): Audit notes (remaining drift), Future optional work, Primary accent (Wii blue) — theme audit, Single source of truth, Tailwind, What updates with the ribbon accent

### Community 137 - "Channel editor — follow-ups for review"
Cohesion: 0.33
Nodes (5): Channel editor — follow-ups for review, Items for product or later engineering review, Launch pipeline (`launchApp.cjs`), No automated test coverage, Resolved in this pass

### Community 138 - "Default Sounds for Wee"
Cohesion: 0.33
Nodes (5): Default Sounds for Wee, How to add default sounds, Packaging, Runtime, Sources of truth

### Community 139 - "WeeModalShell.jsx"
Cohesion: 0.53
Nodes (3): FloatingWidgetPresence, useDialogExitPresence(), variantNameFromDefinition()

### Community 140 - "WiiSideNavigation.jsx"
Cohesion: 0.70
Nodes (4): DefaultLeftIcon(), DefaultRightIcon(), rgbToRgba(), WiiSideNavigation()

### Community 141 - "How to Set Up Supabase"
Cohesion: 0.50
Nodes (4): How to Set Up Supabase, Option 1: For Developers (Local Development), Option 2: For Production (Built App), Option 3: Create a Supabase Project

### Community 142 - "Components Organization"
Cohesion: 0.50
Nodes (3): Components Organization, Domains, Usage

### Community 143 - "Features Available"
Cohesion: 0.67
Nodes (3): Features Available, 🔄 What Needs Backend (Future Enhancement):, ✅ What Works Now:

## Knowledge Gaps
- **516 isolated node(s):** `PLAYLISTS`, `SONGS`, `name`, `version`, `main` (+511 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **49 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`, `react`, `cors`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `electron-updater`, `express`, `framer-motion`, `fs-extra`, `fuse.js`, `gifuct-js`, `@headlessui/react`, `lucide-react`, `node-fetch`, `p-queue`, `prop-types`, `@radix-ui/react-context-menu`, `react-dom`, `react-freezeframe-vite`, `react-icons`, `sharp`, `spotify-web-api-js`, `@supabase/supabase-js`, `systeminformation`, `@tanstack/react-virtual`, `vdf`, `windows-shortcuts`, `zustand`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `dependencies`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `lazyNamedExport()` connect `react` to `App.jsx`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **What connects `PLAYLISTS`, `SONGS`, `name` to the rest of the system?**
  _516 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PresetsSettingsTab.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06527682843472317 - nodes in this community are weakly interconnected._
- **Should `useConsolidatedAppStore.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11515151515151516 - nodes in this community are weakly interconnected._
- **Should `FloatingSpotifyWidget.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._