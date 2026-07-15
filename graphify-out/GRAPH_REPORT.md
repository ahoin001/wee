# Graph Report - wee  (2026-07-15)

## Corpus Check
- 444 files · ~298,404 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2494 nodes · 5567 edges · 187 communities (133 shown, 54 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 74 edges (avg confidence: 0.54)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2d9980f4`
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
- CORE DIRECTIVE: AWWWARDS-LEVEL DESIGN ENGINEERING
- 11. COMPONENT EXECUTION GUIDELINES
- 18. EXTRA CREATIVITY & IMPLEMENTATION EDGE
- ChannelsLayoutSettingsTab.jsx
- iconTinting.js
- 9. AI TELLS (Forbidden Patterns)
- 8. ANTI-AI-SLOP RULES
- cacheDomains.js
- APPENDICES - Real Source-Backed Reference Material
- 11. REDESIGN PROTOCOL
- 3. DEFAULT ARCHITECTURE & CONVENTIONS
- 6. PERFORMANCE & ACCESSIBILITY GUARDRAILS
- Full-Output Enforcement
- 13. COLOR & MATERIAL RULES
- 4. HERO MINIMALISM RULES
- 5. IMAGE COUNT & PAGE SLICING
- 12. THE BLOCK LIBRARY (Contract - Implementations Land Here Iteratively)
- 5. CONTEXT-AWARE PROACTIVITY
- 8. DARK MODE PROTOCOL
- 1. THE THREE DIALS (Core Configuration)
- 7. DIAL DEFINITIONS (Technical Reference)
- 15. DEFAULT SITE PACKS
- 20. EXAMPLE INTERPRETATIONS
- ChannelModalImageSection.jsx
- classicDockThemeDefaults.js
- Database Setup
- ChannelModalImageSection.jsx
- SpotifyBrowseView.jsx
- fast-average-color
- Future Enhancements
- eslint
- fast-deep-equal
- fast-deep-equal
- jszip
- jszip
- @types/react
- uuid
- wait-on
- 6. Styling advice by UI type
- 4. Motion system
- spotify-web-api-js
- @tanstack/react-virtual

## God Nodes (most connected - your core abstractions)
1. `Text()` - 58 edges
2. `createWeeTransition()` - 44 edges
3. `useMotionFeedback()` - 43 edges
4. `WButton` - 43 edges
5. `useWeeMotion()` - 41 edges
6. `scripts` - 33 edges
7. `App()` - 33 edges
8. `WeeModalFieldCard()` - 28 edges
9. `AudioManager` - 27 edges
10. `useAppActivity()` - 25 edges

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

## Communities (187 total, 54 thin omitted)

### Community 0 - "PresetsSettingsTab.jsx"
Cohesion: 0.06
Nodes (61): PresetsCommunityCard, PresetsSaveCurrentCard, PresetsSavedListCard, PresetsSpotifyMatchSection, PRESET_UPDATE_SCOPE_OPTIONS, WorkspaceSwitcherModal(), applyPresetData(), normalizeSettingsShape() (+53 more)

### Community 1 - "useConsolidatedAppStore.js"
Cohesion: 0.08
Nodes (56): base, m, patch, buildChannelPatchFromNormalized(), useAppInitialization(), hasPatchSettingsApi(), selectPersistedSlices(), useUnifiedSettingsPersistence() (+48 more)

### Community 2 - "PaginatedChannels.jsx"
Cohesion: 0.19
Nodes (11): PaginatedChannelsInner, ChannelSpaceContext, ChannelSpaceProvider(), toggleHomeBoardArrange(), useHomeBoardArrange(), applyChannelSlotReorder(), collectSlots(), moveParallelArrays() (+3 more)

### Community 3 - "FloatingSpotifyWidget.jsx"
Cohesion: 0.22
Nodes (8): ChannelModal(), ChannelModalUnifiedPathBlock(), useChannelModalInitialization(), getSmartPathSuggestions(), inferLaunchTypeFromPath(), normalizeChannelPath(), validateChannelPath(), useAppLibraryState()

### Community 6 - "WallpaperSettingsTab.jsx"
Cohesion: 0.05
Nodes (46): GameHubMinimalDock(), SpotifyGradientOverlay(), SpotifyImmersiveOverlay(), WallpaperOverlay(), FloatingSpotifyWidget(), PerformanceMonitor(), SpotifyBrowseView(), SpotifyMiniPlayerBar() (+38 more)

### Community 7 - "AuraCollectionsSection.jsx"
Cohesion: 0.05
Nodes (69): AuraCollectionsSection(), nextFrame(), preloadGameArt(), shouldIgnoreCollectionCloseTarget(), waitMs(), AuraGameCard, AuraHubModalFrame(), COLLECTION_FLY_PHASE_MS (+61 more)

### Community 8 - "devDependencies"
Cohesion: 0.06
Nodes (33): autoprefixer, concurrently, cross-env, electron, electron-builder, @eslint/js, eslint-plugin-react, eslint-plugin-react-hooks (+25 more)

### Community 9 - "App.jsx"
Cohesion: 0.07
Nodes (34): App(), LazyAdminPanelWidget, LazyClassicWiiDock, LazyCommandPalette, LazyFloatingSpotifyWidget, LazyGameHubSpace, LazyHomePageIndicator, LazyMediaHubSpace (+26 more)

### Community 10 - "SettingsModal.jsx"
Cohesion: 0.10
Nodes (25): DevReactProfiler(), ChannelsLayoutSettingsTab, ColorsSettingsTab, GameHubSettingsTab, GeneralSettingsTab, MonitorSettingsTab, MotionFeedbackSettingsTab, NavigationPillSettingsTab (+17 more)

### Community 11 - "AdminPanel.jsx"
Cohesion: 0.22
Nodes (8): adjustColorIntensity(), createColorVariations(), hexToRgb(), PARTICLE_TYPES, cubicPoint(), sampleRibbonTopEdgeForCanvas(), sampleRibbonTopEdgePoints(), PARTICLE_EFFECT_PALETTES

### Community 12 - "ChannelModal.jsx"
Cohesion: 0.29
Nodes (10): collectPrioritizedWarmMediaUrls(), collectWarmMediaUrlsFromStore(), isHttpLike(), warmedUrls, warmImageUrlsOnIdle(), dedupeMerge(), flush(), pendingHigh (+2 more)

### Community 13 - "scripts"
Cohesion: 0.06
Nodes (33): scripts, build, dev, lint, lint:eslint, make, migrate:media, package (+25 more)

### Community 14 - "ChannelsLayoutSettingsTab.jsx"
Cohesion: 0.26
Nodes (9): IDLE_EXPERIENCE_MODES, IDLE_PERSONALITY_PACKS, matchIdlePersonality(), normalizeIdleExperienceSettings(), LAUNCH_FEEDBACK_MODES, normalizeLaunchFeedbackMode(), deriveLaunchLabel(), normalizeRecentLaunchEntry() (+1 more)

### Community 15 - "WToggle.jsx"
Cohesion: 0.13
Nodes (31): DefaultLeftIcon(), DefaultRightIcon(), rgbToRgba(), WiiSideNavigation(), useChannelModalHoverSound(), WeeGooeySideNavButton, saveUnifiedSoundSettings(), findEnabledSound() (+23 more)

### Community 16 - "supabase.js"
Cohesion: 0.10
Nodes (28): CommunityPresets(), SpotifyLiveGradientWallpaper(), NavigationSettingsTab(), formatMessage(), logError(), logWarn(), registerSpotifyGradientSave(), SPOTIFY_SCOPES (+20 more)

### Community 17 - "index.js"
Cohesion: 0.08
Nodes (17): PresetListItem, UnifiedAppPathCard, UnifiedAppPathSearch(), ChannelPathSmartSuggestions(), ImageModal(), PrimaryActionsModal, WeeUpdateProgress(), WeeButton() (+9 more)

### Community 18 - "MediaHubSpace.jsx"
Cohesion: 0.11
Nodes (20): MediaHubDiscoverGrid(), EMPTY_OBJECT, episodesForSeason(), formatImdbRating(), getPosterUrl(), GRID_LIST_PARENT_VARIANTS, MediaHubItemDetail(), MediaHubSpace() (+12 more)

### Community 19 - "WeeModalFieldCard"
Cohesion: 0.13
Nodes (8): DIRECTION_OPTIONS, EFFECT_TYPE_OPTIONS, SettingsToggleFieldCard(), DOCK_SUB_TABS, variantMap, WeeSectionEyebrow(), findDockThemePath(), getDockThemeByPath()

### Community 20 - "managers.js"
Cohesion: 0.26
Nodes (7): markAppLibraryBackgroundPrefetchScheduled(), filterSteamToolEntries(), STEAM_TOOL_APP_IDS, createFloatingWidgetManager(), isRendererActive(), createStoreManagers(), createPerformanceManager()

### Community 22 - "WButton.jsx"
Cohesion: 0.16
Nodes (11): HUB_MORPH, PLAYFUL_AMPLITUDE, PLAYFUL_SPRINGS, PLAYFUL_VARIANTS, SIZE_CLASS, VARIANT_CLASS, WEE_GOOEY_ICON_PRESS, WeeGooeyIconButton (+3 more)

### Community 24 - "Text"
Cohesion: 0.13
Nodes (15): 10. QA for “does this feel like Wee chrome?”, 1. What this style *is*, 2. Canonical surfaces (study these first), 3. Pill Morph Reveal (the pattern), 7. Building a new experience in this style, 8. Anti-patterns (break the feel), 9. File map, Checklist (+7 more)

### Community 25 - "GameHubSpace.jsx"
Cohesion: 0.21
Nodes (14): AuraLibrarySection(), GameHubSpace(), smoothstep01(), useMinWidthDockMorph(), orderHubCollectionItems(), sortHubGamesByName(), useHeroMediaCrossfade(), createGameHubMorphLibraryFollowVariants() (+6 more)

### Community 26 - "GameHubGameArtPanel.jsx"
Cohesion: 0.14
Nodes (16): CHANNEL_ANIMATION_STYLES, buildKenBurnsProps(), ChannelMediaPreview(), ChannelModalsHost(), useChannelAdaptiveEmptyStyle(), useChannelEffectiveState(), clearMp4PosterCache(), mp4PosterCache (+8 more)

### Community 27 - "compilerOptions"
Cohesion: 0.10
Nodes (20): DOM, DOM.Iterable, ES2022, scripts, src, compilerOptions, allowJs, checkJs (+12 more)

### Community 28 - "Channel.jsx"
Cohesion: 0.21
Nodes (19): PageNavigation(), SlideNavigation(), applyLayoutChangeToSpaceData(), CHANNEL_LAYOUT_LIMITS, channelIdAtIndex(), clampInt(), clampPageIndex(), getChannelsPerPage() (+11 more)

### Community 29 - "useWeeMotion"
Cohesion: 0.25
Nodes (10): BoardLivePreview(), LayoutStepper(), createWeeSideNavShellMotion(), createWeeTransition(), getWeeStatusPillEntrance(), WeeGlassPill, WeeGooeyStatusPill(), WeePillFloorShadow() (+2 more)

### Community 30 - "mediaLibraryCache.js"
Cohesion: 0.22
Nodes (15): filterMediaLibraryCache(), findGameMedia(), fuzzyMatch(), getAllMatchingMedia(), getCacheStatus(), getMediaLibraryPage(), getPageCacheKey(), inFlightMediaPageRequests (+7 more)

### Community 31 - "weeMotion.js"
Cohesion: 0.21
Nodes (10): computeSpaceRailContentHeight(), getNextSpace(), maxSpaceRailViewportHeight(), SPACE_META, SPACE_RAIL_LAYOUT, WeeGooeySpacePill(), createWeeShellRailContainerVariants(), createWeeShellRailItemVariants() (+2 more)

### Community 32 - "keyboardShortcuts.js"
Cohesion: 0.20
Nodes (21): channelIdAtIndex(), buildChannelPayload(), channelToConfiguredEntry(), channelToKenBurnsEntry(), createAdminQuickAccessSlot(), createChannelSlotFromLegacy(), createEmptyChannelSlot(), createHomeWidgetSlot() (+13 more)

### Community 33 - "Text.jsx"
Cohesion: 0.22
Nodes (11): SpaceWallpaperAppearanceSection(), WallpaperCyclingSection(), WallpaperOverlaySection(), EASING_OPTIONS, OVERLAY_EFFECT_OPTIONS, SLIDE_DIRECTION_MODE_OPTIONS, SLIDE_DIRECTION_OPTIONS, SPACE_WALLPAPER_OPTIONS (+3 more)

### Community 34 - "custom-installer.js"
Cohesion: 0.17
Nodes (11): { app, BrowserWindow, ipcMain, shell, dialog }, createDesktopShortcut(), createStartMenuShortcut(), { exec }, finalizeInstallation(), fs, INSTALL_STEPS, os (+3 more)

### Community 35 - "ChannelModalChannelArtPanel.jsx"
Cohesion: 0.32
Nodes (10): buildCandidateTerms(), buildQueryTokens(), ChannelModalInlineMediaSuggestions(), deriveChannelArtSearchQuery(), formatMediaKind(), normalizeText(), rowKey(), rowPublicUrl() (+2 more)

### Community 36 - "PerformanceMonitor"
Cohesion: 0.20
Nodes (9): Anti-Patterns Verdict, Critique: Wee Home Channel Grid (`src/components/home-grid` + channel strip), Design Health Score, Minor Observations, Overall Impression, Persona Red Flags, Priority Issues, Questions to Consider (+1 more)

### Community 37 - "dependencies"
Cohesion: 0.23
Nodes (11): GooeyFloatingPanel(), createHomeChannelEntranceBandVariants(), createHubEntranceOrchestratorVariants(), createMediaHubGridContainerVariants(), createMediaHubGridItemVariants(), createMediaHubShellBandVariants(), isFirstVisitTier(), MEDIA_HUB_STAGGER (+3 more)

### Community 38 - "build"
Cohesion: 0.18
Nodes (11): build, appId, directories, extraFiles, extraResources, productName, publish, win (+3 more)

### Community 39 - "WeeGooeySpacePill.jsx"
Cohesion: 0.17
Nodes (14): ClassicWiiDock(), IsolatedWallpaperBackground, IsolatedWallpaperBackgroundInner(), spaceParallaxBackgroundYPercent(), ClassicDockLivePreview(), RibbonLivePreview(), SettingsLivePreviewFrame(), useWallpaperSettingsController() (+6 more)

### Community 40 - "AuthService"
Cohesion: 0.21
Nodes (15): formatLastRefreshed(), SCOPE_LABELS, SettingsDataCachesCard(), actionStamps, clearAllCacheDomains(), clearCacheDomain(), domains, domainsSnapshot (+7 more)

### Community 41 - "package.json"
Cohesion: 0.20
Nodes (9): author, description, main, name, private, repository, type, url (+1 more)

### Community 42 - "ChannelModalSuggestedGames.jsx"
Cohesion: 0.24
Nodes (12): ChannelModalSuggestedGames(), dedupeInstalledAgainstStores(), filterGames(), getSuggestedCarouselKey(), paginateGames(), sortGames(), SOURCE_FILTER, resolveMimeTypeFromMediaLibraryRow() (+4 more)

### Community 43 - "logWarn"
Cohesion: 0.25
Nodes (17): renderShortcutKeyChips(), RESERVED_SHORTCUT_CHORDS, ShortcutCaptureControl(), CATEGORY_ICONS, CATEGORY_ORDER, checkShortcutConflict(), createDefaultKeyboardShortcuts(), DEFAULT_SHORTCUTS (+9 more)

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
Cohesion: 0.23
Nodes (9): AdvancedSettingsTab, QUICK_LINKS, DEFAULT_GLASS, SIDE_NAV_STYLE_OPTIONS, SettingsTabPageHeader(), SettingsWeeSection(), WallpaperLibrarySection(), Text() (+1 more)

### Community 50 - "applyPrimaryAccentFromHex.js"
Cohesion: 0.09
Nodes (22): Best Practices, Common Issues, `custom-installer.js`, Debug Mode, Development Testing, Features, Files, Future Enhancements (+14 more)

### Community 51 - "useChannelInteractions.js"
Cohesion: 0.07
Nodes (25): Aggressive Escalation Triggers, Guidelines, Operating Posture, Part 1 — Findings table (REQUIRED), Part 2 — Verdict (REQUIRED), Remedial Preference Hierarchy, Required Output Format, Reviewing Animations (+17 more)

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
Cohesion: 0.16
Nodes (18): usePrimaryAccentThemeEffect(), albumArtPaletteCache, clearAlbumArtPaletteCache(), extractColorsFromAlbumArt(), getAlbumArtPaletteCacheSize(), adjustL(), applyPrimaryAccentFromHex(), fmt() (+10 more)

### Community 72 - "cors"
Cohesion: 0.13
Nodes (15): better-sqlite3, cors, framer-motion, fuse.js, lucide-react, dependencies, better-sqlite3, cors (+7 more)

### Community 73 - "@dnd-kit/core"
Cohesion: 0.38
Nodes (5): WeeChannelModal(), WEE_VARIANTS, WeeModalRail(), WeeModalRailItem(), WeeModalRailSection()

### Community 78 - "framer-motion"
Cohesion: 0.23
Nodes (15): NowPlayingSlot(), SpotifyTakeoverController(), buildCommandCatalog(), channelTitleFromSlot(), COMMAND_GROUPS, EXCLUDED_SHORTCUT_IDS, fuzzyScore(), scoreCommand() (+7 more)

### Community 80 - "fuse.js"
Cohesion: 0.19
Nodes (13): ChannelModalBehaviorTab(), useChannelInteractions(), useChannelSpaceKey(), enterSessionAwayIfIntensive(), useSessionPowerSync(), getRecentLaunchHintTtlMs(), CASUAL_EXE_NAMES, GAME_PATH_MARKERS (+5 more)

### Community 81 - "gifuct-js"
Cohesion: 0.33
Nodes (6): 5. Materials & color, Dynamic runtime colors, Glass chrome tokens, Interactive glow, Semantic color (always), Wee surface radii (settings / modals / cards)

### Community 83 - "lucide-react"
Cohesion: 0.19
Nodes (13): WiiDock(), DockParticleSystem, LazyPrimaryActionsModal, WiiRibbon, WiiRibbonComponent(), WiiStyleButton(), PrimaryActionsModalComponent(), getWeeDockBarEntrance() (+5 more)

### Community 86 - "prop-types"
Cohesion: 0.24
Nodes (15): AuraHero(), buildHeroStats(), hoursShort(), applyCustomArtOverrides(), buildDynamicCollections(), buildHubData(), effectiveRecentSeconds(), formatDiskSize() (+7 more)

### Community 87 - "@radix-ui/react-context-menu"
Cohesion: 0.40
Nodes (5): 1. First Run Detection, 2. Installation Steps, 3. Shortcut Creation, 4. Completion, How It Works

### Community 92 - "spotify-web-api-js"
Cohesion: 0.11
Nodes (17): 1. Meta Information & Core Directive, 2. THE "ABSOLUTE ZERO" DIRECTIVE (STRICT ANTI-PATTERNS), 3. THE CREATIVE VARIANCE ENGINE, 4. HAPTIC MICRO-AESTHETICS (COMPONENT MASTERY), 5. MOTION CHOREOGRAPHY (FLUID DYNAMICS), 6. PERFORMANCE GUARDRAILS, 7. EXECUTION PROTOCOL, 8. PRE-OUTPUT CHECKLIST (+9 more)

### Community 93 - "@supabase/supabase-js"
Cohesion: 0.27
Nodes (10): useWallpaperAmbientColor(), captureSpaceAppearanceFromState(), mergeLiveStateFromSpaceAppearance(), SPACE_IDS, syncActiveSpaceAppearanceCapture(), WALLPAPER_TRANSIENT_KEYS, resolveDisplayWallpaperUrl(), runSceneTransition() (+2 more)

### Community 95 - "@tanstack/react-virtual"
Cohesion: 0.12
Nodes (16): 10. SECTION RHYTHM RULE, 12. DENSITY & SPACING DISCIPLINE, 14. IMAGE / MEDIA DIRECTION, 16. MULTI-IMAGE CONSISTENCY RULE, 17. CLARITY CHECK, 19. RESPONSE BEHAVIOR, 1. ACTIVE BASELINE CONFIGURATION, 21. FINAL GOAL (+8 more)

### Community 110 - "🖥️ Multi-Monitor Settings Guide"
Cohesion: 0.08
Nodes (26): **Accessing Monitor Settings**, **Advanced Features**, **Best Practices**, 👨‍💻 For Developers: Running from Source, **Hot-Plugging Support**, **How It Works**, 📥 How to Install (for Users), **Launch Preferences** (+18 more)

### Community 111 - "Animation Audit Playbook"
Cohesion: 0.09
Nodes (21): 1. Purpose & frequency, 2. Easing & duration, 3. Physicality & origin, 4. Interruptibility, 5. Performance, 6. Accessibility, 7. Cohesion & tokens, 8. Missed opportunities (+13 more)

### Community 113 - "Apple Design"
Cohesion: 0.10
Nodes (20): 10. Gesture design details (the "feel" checklist), 11. Frame-level smoothness, 12. Materials & depth — translucency conveys hierarchy, 13. Multimodal feedback — motion + sound + haptics, 14. Reduced motion & accessibility, 15. Typography — optical sizing, tracking, leading, 16. Design foundations — the eight principles, 17. Process (+12 more)

### Community 114 - "useChannelOperations.js"
Cohesion: 0.13
Nodes (15): Appendix B - Canonical Sources (read these before reinventing), Apple Liquid Glass (Apple platforms only), Atlassian, Bootstrap, Carbon, Fluent UI, GOV.UK, Material Web (+7 more)

### Community 115 - "WeePressSurface.jsx"
Cohesion: 0.10
Nodes (40): AdminPanel(), EMPTY_CUSTOM, AdminPanelWidget(), ActionCommand(), QuickAccessItem(), AdminQuickAccessSlot(), splitActionsByCapacity(), HomeBoardArrangeBar() (+32 more)

### Community 116 - "Spotify Integration Setup Guide"
Cohesion: 0.09
Nodes (23): 1. Backend Integration, 2. Real-time Updates, 3. Music-Synced Effects, Common Issues:, Current Limitations, Debug Mode:, Features Available, Future Enhancements (+15 more)

### Community 117 - "useAppInitialization.js"
Cohesion: 0.21
Nodes (12): LaunchErrorToast(), LAUNCH_TYPE_FALLBACK_ICONS, RecentlyUsedSlot(), CommandPalette(), LaunchFeedbackContext, LaunchFeedbackProvider(), setLaunchCinematic(), useLaunchFeedback() (+4 more)

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
Cohesion: 0.14
Nodes (14): 2. THE COMBINATORIAL VARIATION ENGINE, Background Character, Background Mode (per-section), Composition Anchor (per-section), CTA Variation, Hero Architecture, Hero Scale (per-page), Motion-Implied Language (+6 more)

### Community 122 - "Supabase Setup for Community Presets"
Cohesion: 0.10
Nodes (20): 1. `shared_presets` Table, 2. Storage Buckets, 3. Row Level Security (RLS), Current Status, "Database error" or "RLS policy" Error, Database Setup, For Distribution, How to Set Up Supabase (+12 more)

### Community 123 - "useConsolidatedAppStore.js"
Cohesion: 0.18
Nodes (20): elementCanScrollVertically(), getNextSpaceId(), isTypingTarget(), useWheelNavigation(), DEFAULT_CHANNEL_NAVIGATION, CHANNEL_SPACE_KEYS, createDefaultChannelSpaceData(), getChannelDataSlice() (+12 more)

### Community 124 - "[1.9.1] - 2024-01-XX"
Cohesion: 0.11
Nodes (18): [1.9.1] - 2024-01-XX, [2.7.2] - 2025-01-XX, Added, Added, Added, Changed, Changed, Changed (+10 more)

### Community 125 - "README.md"
Cohesion: 0.18
Nodes (6): Automated, Checks, Modes, Performance Smoke Checklist, PR smell checklist, Documentation

### Community 126 - "usePerformanceOptimization.js"
Cohesion: 0.23
Nodes (12): getRibbonChromeEffectDefaults(), getRibbonChromeEffectMeta(), getRibbonChromeEffectOptions(), isRibbonChromeEffectId(), isRibbonChromeGlassSoftMode(), META_BY_ID, RIBBON_CHROME_EFFECTS, RIBBON_CHROME_GLASS_SOFT_MODES (+4 more)

### Community 127 - "mediaWarmScheduler.js"
Cohesion: 0.50
Nodes (4): Adding New Steps, Customization, Modifying Shortcuts, Styling Changes

### Community 128 - "SystemInfoWidget.jsx"
Cohesion: 0.08
Nodes (16): IDLE_TYPE_ITEMS, KEN_BURNS_EASING_OPTIONS, KEN_BURNS_MODE_OPTIONS, CHROME_EFFECT_OPTIONS, SOUND_CATEGORY_DESCRIPTIONS, SOUND_CATEGORY_ICONS, ResourceUsageIndicator(), GLASS_TEST_BTN_STYLE (+8 more)

### Community 129 - "UnifiedDockSettingsTab.jsx"
Cohesion: 0.29
Nodes (7): HomePageIndicator(), statusLabel(), UpdateModal(), createWeeSideNavPeekVariants(), useWeeMotion(), WeeDockSettingsSubtabs(), WeeLayoutActiveDisc()

### Community 130 - "Agent and contributor guide (Wee)"
Cohesion: 0.04
Nodes (44): Agent and contributor guide (Wee), Always follow, Before you finish a change, Content resize cohesion (expand / collapse / list close), Design Context, Electron, Key files, Motion and modal guardrails (+36 more)

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
Cohesion: 0.27
Nodes (6): DEFAULT_BUTTON_CONFIGS, formatDate(), formatTime(), RibbonMiniature(), useHostWidth(), DEFAULT_TIME_COLOR_HEX

### Community 136 - "Primary accent (Wii blue) — theme audit"
Cohesion: 0.29
Nodes (6): Audit notes (remaining drift), Future optional work, Primary accent (Wii blue) — theme audit, Single source of truth, Tailwind, What updates with the ribbon accent

### Community 137 - "Channel editor — follow-ups for review"
Cohesion: 0.33
Nodes (5): Channel editor — follow-ups for review, Items for product or later engineering review, Launch pipeline (`launchApp.cjs`), No automated test coverage, Resolved in this pass

### Community 138 - "Default Sounds for Wee"
Cohesion: 0.33
Nodes (5): Default Sounds for Wee, How to add default sounds, Packaging, Runtime, Sources of truth

### Community 140 - "WiiSideNavigation.jsx"
Cohesion: 0.17
Nodes (12): 4.10 Quotes & Testimonials, 4.11 Page Theme Lock (Light / Dark Mode Consistency), 4.1 Typography, 4.2 Color Calibration, 4.3 Layout Diversification, 4.4 Materiality, Shadows, Cards, 4.5 Interactive UI States, 4.6 Data & Form Patterns (+4 more)

### Community 141 - "How to Set Up Supabase"
Cohesion: 0.13
Nodes (15): 0.A Read these signals first, 0.B Output a one-line "Design Read" before generating, 0. BRIEF INFERENCE (Read the Room Before Anything Else), 0.C If the brief is ambiguous, ask one question, do not guess, 0.D Anti-Default Discipline, 13. OUT OF SCOPE, 14. FINAL PRE-FLIGHT CHECK, 1.A Dial Inference (design read → dial values) (+7 more)

### Community 142 - "Components Organization"
Cohesion: 0.50
Nodes (3): Components Organization, Domains, Usage

### Community 144 - "useBackgroundMusicEffects"
Cohesion: 0.20
Nodes (10): 10. REFERENCE VOCABULARY (Pattern Names the Agent Should Know), Animation Library Choice, Cards & Containers, Galleries & Media, Hero Paradigms, Layout & Grids, Micro-Interactions & Effects, Navigation & Menus (+2 more)

### Community 145 - "CORE DIRECTIVE: AWWWARDS-LEVEL DESIGN ENGINEERING"
Cohesion: 0.20
Nodes (9): 1. PYTHON-DRIVEN TRUE RANDOMIZATION (BREAKING THE LOOP), 2. AIDA STRUCTURE & SPACING, 3. HERO ARCHITECTURE & THE 2-LINE IRON RULE, 4. THE GAPLESS BENTO GRID, 5. ADVANCED GSAP MOTION & HOVER PHYSICS, 6. COMPONENT ARSENAL & CREATIVITY, 7. CONTENT, ASSETS & STRICT BANS, 8. MANDATORY PRE-FLIGHT <design_plan> (+1 more)

### Community 146 - "11. COMPONENT EXECUTION GUIDELINES"
Cohesion: 0.22
Nodes (9): 11. COMPONENT EXECUTION GUIDELINES, 3D Cascading Card Deck, Diagonal Staggered Square Masonry, Hover-Accordion Slice Layout, Off-Grid Editorial Layout, Pristine Gapless Bento Grid, Product UI Panel Stack, Turning Polaroid Arc (+1 more)

### Community 147 - "18. EXTRA CREATIVITY & IMPLEMENTATION EDGE"
Cohesion: 0.22
Nodes (9): 18. EXTRA CREATIVITY & IMPLEMENTATION EDGE, Composition variety check, Conversion focus, Cross-section contrast, CTA specificity, Cultural / tonal alignment, Data-viz restraint, Image variety inside one comp (+1 more)

### Community 149 - "iconTinting.js"
Cohesion: 0.31
Nodes (8): analyzeIconTransparency(), clampSampleSize(), clearTintedIconCache(), getTintedIconCacheSize(), loadImageElement(), tintedIconCache, tintImageUrlWithOverwrite(), tintImageWithOverwrite()

### Community 150 - "9. AI TELLS (Forbidden Patterns)"
Cohesion: 0.25
Nodes (8): 9.A Visual & CSS, 9. AI TELLS (Forbidden Patterns), 9.B Typography, 9.C Layout & Spacing, 9.D Content & Data ("Jane Doe" Effect), 9.E External Resources & Components, 9.F Production-Test Tells (banned outright), 9.G EM-DASH BAN (the single most-violated Tell)

### Community 151 - "8. ANTI-AI-SLOP RULES"
Cohesion: 0.25
Nodes (8): 8. ANTI-AI-SLOP RULES, Carousel / marquee slop (layout), Content slop, Data / KPI slop, Density slop, Layout slop, Typography slop, Visual slop

### Community 152 - "cacheDomains.js"
Cohesion: 0.32
Nodes (4): cache, clearCachedSteamClientLibrary(), refreshSteamEnrichmentNow(), clearSupabaseReadCache()

### Community 153 - "APPENDICES - Real Source-Backed Reference Material"
Cohesion: 0.29
Nodes (6): APPENDICES - Real Source-Backed Reference Material, Appendix A - Install Commands per Design System, Appendix C - Apple Liquid Glass: Honest Web Approximation, Safer web approximation skeleton, What is NOT official, What is official

### Community 154 - "11. REDESIGN PROTOCOL"
Cohesion: 0.29
Nodes (7): 11.A Detect the Mode (first action), 11.B Audit Before Touching, 11.C Preservation Rules, 11.D Modernisation Levers (priority order), 11.E Decision Tree: Targeted Evolution vs Full Redesign, 11.F What Never Changes Silently, 11. REDESIGN PROTOCOL

### Community 155 - "3. DEFAULT ARCHITECTURE & CONVENTIONS"
Cohesion: 0.29
Nodes (7): 3.A Stack, 3.B State, 3.C Icons, 3.D Emoji Policy, 3. DEFAULT ARCHITECTURE & CONVENTIONS, 3.E Responsiveness & Layout Mechanics, 3.F Dependency Verification (mandatory)

### Community 156 - "6. PERFORMANCE & ACCESSIBILITY GUARDRAILS"
Cohesion: 0.29
Nodes (7): 6.A Hardware Acceleration, 6.B Reduced Motion (mandatory), 6.C Dark Mode (mandatory for any consumer-facing page), 6.D Core Web Vitals Targets, 6.E DOM Cost, 6.F Z-Index Restraint, 6. PERFORMANCE & ACCESSIBILITY GUARDRAILS

### Community 157 - "Full-Output Enforcement"
Cohesion: 0.29
Nodes (6): Banned Output Patterns, Baseline, Execution Process, Full-Output Enforcement, Handling Long Outputs, Quick Check

### Community 158 - "13. COLOR & MATERIAL RULES"
Cohesion: 0.29
Nodes (7): 13. COLOR & MATERIAL RULES, Background Confidence Rule, Background-image harmony, Gradient Discipline, Materiality, Palette Discipline, Strong guidance

### Community 159 - "4. HERO MINIMALISM RULES"
Cohesion: 0.29
Nodes (7): 4. HERO MINIMALISM RULES, Absolute Hero Rules, Graphic Restraint, Headline Rule, Hero Composition Bias, Pre-output check, Typography Execution

### Community 160 - "5. IMAGE COUNT & PAGE SLICING"
Cohesion: 0.33
Nodes (6): 5. IMAGE COUNT & PAGE SLICING, Continuity Rule, Counting rule, Format, Section size variety, THIS IS THE PRIMARY OUTPUT RULE

### Community 161 - "12. THE BLOCK LIBRARY (Contract - Implementations Land Here Iteratively)"
Cohesion: 0.40
Nodes (5): 12.A File Location, 12.B Required Frontmatter, 12.C Required Body Sections, 12.D Block-Library Discipline, 12. THE BLOCK LIBRARY (Contract - Implementations Land Here Iteratively)

### Community 162 - "5. CONTEXT-AWARE PROACTIVITY"
Cohesion: 0.40
Nodes (5): 5.A Sticky-Stack - Canonical Skeleton, 5.B Horizontal-Pan - Canonical Skeleton, 5.C Scroll-Reveal Stagger - Canonical Skeleton (lighter alternative), 5. CONTEXT-AWARE PROACTIVITY, 5.D Forbidden Animation Patterns

### Community 163 - "8. DARK MODE PROTOCOL"
Cohesion: 0.40
Nodes (5): 8.A Token Strategy (pick one, stick to it), 8.B Do Not Prescribe Specific Colors Here, 8.C Default Mode, 8.D Test in Both Modes Before Finishing, 8. DARK MODE PROTOCOL

### Community 164 - "1. THE THREE DIALS (Core Configuration)"
Cohesion: 0.34
Nodes (11): WiiChannelStrip(), createWeeChannelTileItemVariants(), isSlotHidden(), applySlotSpan(), buildOccupancyMap(), canPlaceSpan(), clampSpanToPage(), getFootprintIndices() (+3 more)

### Community 165 - "7. DIAL DEFINITIONS (Technical Reference)"
Cohesion: 0.50
Nodes (4): 7. DIAL DEFINITIONS (Technical Reference), DESIGN_VARIANCE (Level 1-10), MOTION_INTENSITY (Level 1-10), VISUAL_DENSITY (Level 1-10)

### Community 166 - "15. DEFAULT SITE PACKS"
Cohesion: 0.50
Nodes (4): 12-section pack, 15. DEFAULT SITE PACKS, 4-section pack, 8-section pack

### Community 167 - "20. EXAMPLE INTERPRETATIONS"
Cohesion: 0.50
Nodes (4): 20. EXAMPLE INTERPRETATIONS, Example 1, Example 2, Example 3

### Community 171 - "ChannelModalImageSection.jsx"
Cohesion: 0.11
Nodes (10): SecondaryChannelProfilesCard, SettingsActionMenu, GooeySettingsRow(), buttonVariants, variantSecondarySurface, WButton, VARIANT_MAP, WeeCard() (+2 more)

### Community 172 - "SpotifyBrowseView.jsx"
Cohesion: 0.14
Nodes (27): ChannelModalChannelArtPanel(), readStoredArtSubtab(), buildHubDisplayMedia(), GameHubGameArtPanel(), readStoredArtSubtab(), MediaItem(), MediaLibraryBrowser(), ImageSearchModal() (+19 more)

### Community 174 - "Future Enhancements"
Cohesion: 0.28
Nodes (8): DIRECTION_META, getParticleDirectionOptions(), getParticleEffectTypeOptions(), isParticleDirection(), isParticleEffectType(), PARTICLE_DIRECTIONS, PARTICLE_EFFECT_TYPES, TYPE_META

### Community 177 - "fast-deep-equal"
Cohesion: 0.13
Nodes (9): react, react, lazyNamedExport(), Channel, VirtualizedChannelList, createOptimizedComponent(), performanceChecklist, performanceUtils (+1 more)

### Community 188 - "6. Styling advice by UI type"
Cohesion: 0.25
Nodes (8): 6. Styling advice by UI type, Animations (decision tree), Containers / surfaces, Heroes / hub spaces, Icons, Inputs & controls, Layouts, Text

### Community 190 - "4. Motion system"
Cohesion: 0.29
Nodes (7): 4. Motion system, Amplitudes (do not hardcode), Content resize (not Pill Morph), Core spring family (chrome), Intent cheat sheet, Modal presence, Ownership split

## Knowledge Gaps
- **798 isolated node(s):** `PLAYLISTS`, `SONGS`, `name`, `version`, `main` (+793 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **54 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `cors` to `[Unreleased]`, `WeeModalShell.jsx`, `ChannelsLayoutSettingsTab.jsx`, `package.json`, `fast-average-color`, `fast-deep-equal`, `fast-deep-equal`, `jszip`, `jszip`, `uuid`, `spotify-web-api-js`, `@tanstack/react-virtual`, `@dnd-kit/utilities`, `electron-updater`, `express`, `fs-extra`, `@headlessui/react`, `node-fetch`, `p-queue`, `react-dom`, `react-freezeframe-vite`, `react-icons`, `sharp`, `systeminformation`, `vdf`, `windows-shortcuts`, `zustand`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `react` connect `fast-deep-equal` to `cors`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `lazyNamedExport()` connect `fast-deep-equal` to `App.jsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `PLAYLISTS`, `SONGS`, `name` to the rest of the system?**
  _798 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PresetsSettingsTab.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06360759493670887 - nodes in this community are weakly interconnected._
- **Should `useConsolidatedAppStore.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `useConsolidatedAppHooks.js` be split into smaller, more focused modules?**
  _Cohesion score 0.03571428571428571 - nodes in this community are weakly interconnected._