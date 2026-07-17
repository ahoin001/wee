# Graph Report - wee  (2026-07-17)

## Corpus Check
- 483 files · ~323,454 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2713 nodes · 6338 edges · 198 communities (143 shown, 55 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 85 edges (avg confidence: 0.53)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0e8e4436`
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
- WiiRibbonComponent
- framer-motion
- 6. Styling advice by UI type
- spaceAppearance.js
- gifuct-js
- @headlessui/react
- lucide-react
- HomeWidgetGlassControls.jsx
- p-queue
- prop-types
- @radix-ui/react-context-menu
- experience-roadmap-invariants.mjs
- react-freezeframe-vite
- CommandPalette.jsx
- sharp
- spotify-web-api-js
- useAppActivity
- saveFrozenSpotifyLookPreset.js
- @tanstack/react-virtual
- settingsRegistry.js
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
- soundPlayback.js
- Glossary
- Release Guide
- Electron Development Guidelines
- hubData.js
- Supabase Setup for Community Presets
- react-dom
- [1.9.1] - 2024-01-XX
- README.md
- mediaWarmCache.js
- nowPlayingShape.js
- cacheDomains.js
- UnifiedDockSettingsTab.jsx
- Agent and contributor guide (Wee)
- Performance baselines (Wee)
- Shell spaces and channel grids (Wee)
- Style Architecture Map
- WiiDesktop Launcher
- useActivityInterval
- Primary accent (Wii blue) — theme audit
- Channel editor — follow-ups for review
- Default Sounds for Wee
- settingsRegistry.js
- WiiSideNavigation.jsx
- How to Set Up Supabase
- Components Organization
- Features Available
- useBackgroundMusicEffects
- CORE DIRECTIVE: AWWWARDS-LEVEL DESIGN ENGINEERING
- 11. COMPONENT EXECUTION GUIDELINES
- 18. EXTRA CREATIVITY & IMPLEMENTATION EDGE
- ChannelsLayoutSettingsTab.jsx
- buildPresetSnapshot.js
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
- WiiDesktop Launcher
- 7. DIAL DEFINITIONS (Technical Reference)
- 15. DEFAULT SITE PACKS
- 20. EXAMPLE INTERPRETATIONS
- ApiIntegrationsSettingsTab.jsx
- WiiSideNavigation.jsx
- Database Setup
- WorkspaceSwitcherModal.jsx
- SpotifyBrowseView.jsx
- 1. THE THREE DIALS (Core Configuration)
- mediaHubStremio.js
- weePerformanceMarks.js
- jszip
- HomeSlot.jsx
- sharp
- jszip
- systeminformation
- uuid
- useFloatingWidgetFrame
- vdf
- windows-media-sessions
- tailwind-variants
- HomeWidgetGlassControls.jsx
- STEAM_CDN_CAPSULE
- WiiSideNavigation.jsx
- fast-deep-equal
- mediaHubStremio.js
- react
- SystemInfoWidget.jsx
- react-icons
- README.md

## God Nodes (most connected - your core abstractions)
1. `Text()` - 53 edges
2. `createWeeTransition()` - 51 edges
3. `useMotionFeedback()` - 51 edges
4. `useWeeMotion()` - 44 edges
5. `WButton` - 40 edges
6. `scripts` - 35 edges
7. `App()` - 34 edges
8. `AudioManager` - 27 edges
9. `useChannelOperations()` - 27 edges
10. `WeeModalFieldCard()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `syncWallpaperDataFileFromStore()` --references--> `p-queue`  [EXTRACTED]
  src/hooks/useWallpaperDataFileSync.js → package.json
- `flushDebouncedSettingsWrites()` --references--> `p-queue`  [EXTRACTED]
  src/utils/electronApi.js → package.json
- `lazyNamedExport()` --references--> `react`  [EXTRACTED]
  src/App.jsx → package.json
- `WiiRibbonComponent()` --references--> `react`  [EXTRACTED]
  src/components/dock/WiiRibbon.jsx → package.json
- `SteamGamesShelf()` --references--> `react`  [EXTRACTED]
  src/components/home-grid/SteamGamesShelf.jsx → package.json

## Import Cycles
- 4-file cycle: `src/components/app-library/CommunityPresets.jsx -> src/components/modals/index.js -> src/components/modals/PrimaryActionsModal.jsx -> src/components/app-library/index.js -> src/components/app-library/CommunityPresets.jsx`

## Communities (198 total, 55 thin omitted)

### Community 0 - "PresetsSettingsTab.jsx"
Cohesion: 0.19
Nodes (18): AuraCollectionsSection(), nextFrame(), preloadGameArt(), shouldIgnoreCollectionCloseTarget(), waitMs(), COLLECTION_FLY_PHASE_MS, CollectionShelfContextMenu(), GameHubRenameCollectionDialog() (+10 more)

### Community 1 - "useConsolidatedAppStore.js"
Cohesion: 0.21
Nodes (13): SpaceWallpaperAppearanceSection(), WallpaperCyclingSection(), WallpaperLibrarySection(), WallpaperOverlaySection(), EASING_OPTIONS, OVERLAY_EFFECT_OPTIONS, SLIDE_DIRECTION_MODE_OPTIONS, SLIDE_DIRECTION_OPTIONS (+5 more)

### Community 2 - "PaginatedChannels.jsx"
Cohesion: 0.17
Nodes (27): PageNavigation(), SlideNavigation(), applyPageLayoutOverrideToSpaceData(), applyLayoutChangeToSpaceData(), buildPageLayoutOverridePatch(), CHANNEL_LAYOUT_LIMITS, channelIdAtIndex(), clampInt() (+19 more)

### Community 3 - "FloatingSpotifyWidget.jsx"
Cohesion: 0.16
Nodes (19): alignItemsClass(), ClockSlot(), formatClockDate(), formatClockTime(), ClockWidgetSettings(), HomeWidgetShell, EMPTY_RECENT_LAUNCHES, LAUNCH_TYPE_FALLBACK_ICONS (+11 more)

### Community 4 - "WiiRibbon.jsx"
Cohesion: 0.22
Nodes (28): WiiChannelStrip(), createWeeChannelTileItemVariants(), useHomeSlotResize(), applyRelayoutToSpaceData(), applySlotsToSpaceData(), assertBoardInvariants(), cloneSlot(), cloneSlots() (+20 more)

### Community 6 - "WallpaperSettingsTab.jsx"
Cohesion: 0.27
Nodes (7): getGooeyMintPalette(), GOOEY_HUB_CLASSIC_MINT, GOOEY_HUB_DAYLIGHT_MINT, buildSpotifyGooeyStyleVars(), getSpotifyGooeyShellBackground(), glowFromPrimary(), SPOTIFY_WIDGET_DEFAULT_DYNAMIC_COLORS

### Community 7 - "AuraCollectionsSection.jsx"
Cohesion: 0.12
Nodes (19): MediaHubDiscoverGrid(), EMPTY_OBJECT, episodesForSeason(), formatImdbRating(), getPosterUrl(), GRID_LIST_PARENT_VARIANTS, MediaHubItemDetail(), MediaHubSpace() (+11 more)

### Community 8 - "devDependencies"
Cohesion: 0.06
Nodes (35): autoprefixer, cross-env, electron, electron-builder, eslint, @eslint/js, eslint-plugin-react, eslint-plugin-react-hooks (+27 more)

### Community 9 - "App.jsx"
Cohesion: 0.08
Nodes (32): App(), LazyAdminPanelWidget, LazyClassicWiiDock, LazyCommandPalette, LazyGameHubSpace, LazyHomePageIndicator, LazyMediaHubSpace, LazyPageNavigation (+24 more)

### Community 10 - "SettingsModal.jsx"
Cohesion: 0.10
Nodes (15): DevReactProfiler(), GeneralSettingsTab, MonitorSettingsTab, NavigationPillSettingsTab, PresetsSettingsTab, SettingsActionMenu, SETTINGS_TAB_COMPONENTS, SETTINGS_TAB_IDS (+7 more)

### Community 11 - "AdminPanel.jsx"
Cohesion: 0.06
Nodes (49): SpotifyTakeoverController(), formatLastRefreshed(), SCOPE_LABELS, SettingsDataCachesCard(), SettingsModal(), actionStamps, clearAllCacheDomains(), clearCacheDomain() (+41 more)

### Community 12 - "ChannelModal.jsx"
Cohesion: 0.26
Nodes (15): clampGooeyIntensity(), createGooeyCloseSpring(), createGooeyModalPanelVariants(), createGooeyOpenSpring(), DEFAULT_GOOEY_PHYSICS, lerp(), mergeGooeyPhysics(), normalizeGooeyHoverMode() (+7 more)

### Community 13 - "scripts"
Cohesion: 0.06
Nodes (35): scripts, build, dev, lint, lint:eslint, make, migrate:media, package (+27 more)

### Community 14 - "ChannelsLayoutSettingsTab.jsx"
Cohesion: 0.19
Nodes (9): ChannelModal(), ChannelModalUnifiedPathBlock(), ChannelModalsHost(), useChannelModalInitialization(), getSmartPathSuggestions(), inferLaunchTypeFromPath(), normalizeChannelPath(), validateChannelPath() (+1 more)

### Community 15 - "WToggle.jsx"
Cohesion: 0.18
Nodes (11): computeSpaceRailContentHeight(), getNextSpace(), maxSpaceRailViewportHeight(), SPACE_META, SPACE_RAIL_LAYOUT, truncateRailLabel(), WeeGooeySpacePill(), createWeeShellRailContainerVariants() (+3 more)

### Community 16 - "supabase.js"
Cohesion: 0.12
Nodes (23): SpotifyLiveGradientWallpaper(), formatMessage(), logError(), logWarn(), registerSpotifyGradientSave(), SPOTIFY_SCOPES, createSession(), downloadMedia() (+15 more)

### Community 17 - "index.js"
Cohesion: 0.24
Nodes (13): GameHubSpace(), smoothstep01(), useMinWidthDockMorph(), orderHubCollectionItems(), sortHubGamesByName(), useHeroMediaCrossfade(), createGameHubMorphLibraryFollowVariants(), createHubEntranceBandVariants() (+5 more)

### Community 18 - "MediaHubSpace.jsx"
Cohesion: 0.16
Nodes (9): AdvancedSettingsTab, INTEGRATION_SUBTABS, ColorsSettingsTab, GameHubSettingsTab, NavigationSettingsTab, SettingsTabPageHeader(), SettingsWeeSection(), WorkspacesSettingsTab (+1 more)

### Community 19 - "WeeModalFieldCard"
Cohesion: 0.23
Nodes (15): applyAmbientEntry(), resolveBoardTotalPages(), useWallpaperAmbientColor(), applyAmbientRoleTokens(), DEFAULT_AMBIENT_COLOR, extractImagePalette(), quantizeKey(), rgbComponentsToHex() (+7 more)

### Community 20 - "managers.js"
Cohesion: 0.20
Nodes (20): ChannelModalChannelArtPanel(), readStoredArtSubtab(), buildHubDisplayMedia(), GameHubGameArtPanel(), readStoredArtSubtab(), MediaItem(), ImageSearchModal(), useChannelModalMedia() (+12 more)

### Community 24 - "Text"
Cohesion: 0.06
Nodes (36): 10. QA for “does this feel like Wee chrome?”, 1. What this style *is*, 2. Canonical surfaces (study these first), 3. Pill Morph Reveal (the pattern), 4. Motion system, 5. Materials & color, 6. Styling advice by UI type, 7. Building a new experience in this style (+28 more)

### Community 25 - "GameHubSpace.jsx"
Cohesion: 0.11
Nodes (30): matchHomeSlotSizePreset(), EMPTY_FRIENDS_PLAYING, FriendListRow(), friendStatusLabel(), isFriendInGame(), isFriendOnline(), PERSONA_STATUS, SteamFriendsSlot() (+22 more)

### Community 26 - "GameHubGameArtPanel.jsx"
Cohesion: 0.15
Nodes (27): renderShortcutKeyChips(), RESERVED_SHORTCUT_CHORDS, ShortcutCaptureControl(), CATEGORY_ICONS, CATEGORY_ORDER, ensureChannelBoardForArrange(), isChannelBoardSpaceId(), toggleHomeBoardArrange() (+19 more)

### Community 27 - "compilerOptions"
Cohesion: 0.10
Nodes (20): DOM, DOM.Iterable, ES2022, scripts, src, compilerOptions, allowJs, checkJs (+12 more)

### Community 28 - "Channel.jsx"
Cohesion: 0.17
Nodes (10): AuraGameCard, AuraLibrarySection(), EMPTY_CUSTOM_ART, EMPTY_FAVORITE_IDS, EMPTY_WEE_COLLECTIONS, GameCardContextMenu(), GameHubNewCollectionDialog(), GameHubTileDialogsContext (+2 more)

### Community 29 - "useWeeMotion"
Cohesion: 0.09
Nodes (14): CommunityPresets(), PresetListItem, SecondaryChannelProfilesCard, SteamIntegrationSettings, Text(), variantMap, buttonVariants, variantSecondarySurface (+6 more)

### Community 30 - "mediaLibraryCache.js"
Cohesion: 0.13
Nodes (24): MEDIA_LIBRARY_FILETYPE_OPTIONS, MEDIA_LIBRARY_PAGE_SIZE_OPTIONS, MEDIA_LIBRARY_SORT_OPTIONS, clearMatchCache(), filterMediaLibraryCache(), findGameMedia(), fuzzyMatch(), getAllMatchingMedia() (+16 more)

### Community 31 - "weeMotion.js"
Cohesion: 0.11
Nodes (26): HomeBoardArrangeBar(), HomeSlot(), legacyChannelConfigFromSlot(), WIDGET_SLOT_COMPONENTS, homeSlotKindHasWidgetSettings(), getHomeSlotKind(), getHomeSlotSizePreset(), GLANCE_TILE_SIZE_PRESETS (+18 more)

### Community 32 - "keyboardShortcuts.js"
Cohesion: 0.15
Nodes (18): ClassicWiiDock(), IsolatedWallpaperBackground, IsolatedWallpaperBackgroundInner(), spaceParallaxBackgroundYPercent(), ClassicDockLivePreview(), EMPTY_RIBBON_BUTTON_CONFIGS, RibbonLivePreview(), SettingsLivePreviewFrame() (+10 more)

### Community 33 - "Text.jsx"
Cohesion: 0.27
Nodes (10): ChannelDragOverlayFrame(), ChannelDropTargetMotion(), ChannelReorderVfxPortal(), channelDragId(), ChannelSlotDnd(), channelSlotId(), parseChannelDnDId(), WEE_SPRINGS (+2 more)

### Community 34 - "custom-installer.js"
Cohesion: 0.17
Nodes (11): { app, BrowserWindow, ipcMain, shell, dialog }, createDesktopShortcut(), createStartMenuShortcut(), { exec }, finalizeInstallation(), fs, INSTALL_STEPS, os (+3 more)

### Community 35 - "ChannelModalChannelArtPanel.jsx"
Cohesion: 0.07
Nodes (40): getRibbonChromeEffectDefaults(), getRibbonChromeEffectMeta(), getRibbonChromeEffectOptions(), isRibbonChromeEffectId(), isRibbonChromeGlassSoftMode(), isRibbonNeonColorMode(), META_BY_ID, normalizeRibbonChromeEffectId() (+32 more)

### Community 36 - "PerformanceMonitor"
Cohesion: 0.20
Nodes (9): Anti-Patterns Verdict, Critique: Wee Home Channel Grid (`src/components/home-grid` + channel strip), Design Health Score, Minor Observations, Overall Impression, Persona Red Flags, Priority Issues, Questions to Consider (+1 more)

### Community 37 - "dependencies"
Cohesion: 0.06
Nodes (66): PresetsCommunityCard, PresetsSaveCurrentCard, PresetsSavedListCard, PRESET_UPDATE_SCOPE_OPTIONS, WorkspaceSwitcherModal(), applyPresetData(), normalizeSettingsShape(), appearanceForSpace() (+58 more)

### Community 38 - "build"
Cohesion: 0.15
Nodes (13): build, appId, asarUnpack, directories, extraFiles, extraResources, productName, publish (+5 more)

### Community 39 - "WeeGooeySpacePill.jsx"
Cohesion: 0.39
Nodes (11): defaultFlyLayerParent(), flyOutBlockingMs(), flyWallClockMs(), mountFlyer(), runFlyInAnimations(), runFlyOutAnimations(), setFlyerBaseRect(), setFlyerTransformTo() (+3 more)

### Community 40 - "AuthService"
Cohesion: 0.29
Nodes (10): collectPrioritizedWarmMediaUrls(), collectWarmMediaUrlsFromStore(), isHttpLike(), warmedUrls, warmImageUrlsOnIdle(), dedupeMerge(), flush(), pendingHigh (+2 more)

### Community 41 - "package.json"
Cohesion: 0.20
Nodes (9): author, description, main, name, private, repository, type, url (+1 more)

### Community 42 - "ChannelModalSuggestedGames.jsx"
Cohesion: 0.16
Nodes (10): UnifiedAppPathCard, UnifiedAppPathSearch(), ChannelPathSmartSuggestions(), MediaLibraryBrowser(), PrimaryActionsModal, WeeButton(), WeeSectionEyebrow(), WeeSegmentedControl() (+2 more)

### Community 43 - "logWarn"
Cohesion: 0.33
Nodes (10): mergeSpaceScopedRibbonFields(), captureSpaceAppearanceFromState(), GLOBAL_UI_MATCH_KEYS, mergeLiveStateFromSpaceAppearance(), mergeSpaceScopedWallpaperFields(), SPACE_IDS, SPACE_SCOPED_WALLPAPER_KEYS, stripGlobalMatchUi() (+2 more)

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
Cohesion: 0.46
Nodes (7): easeSpaceShell(), lerp(), lerpHex(), parseHexRgb(), RIBBON_PAGE_TRANSITION_MS, toHex(), useRibbonLookTransition()

### Community 50 - "applyPrimaryAccentFromHex.js"
Cohesion: 0.06
Nodes (31): 1. First Run Detection, 2. Installation Steps, 3. Shortcut Creation, 4. Completion, Adding New Steps, Best Practices, Common Issues, `custom-installer.js` (+23 more)

### Community 51 - "useChannelInteractions.js"
Cohesion: 0.07
Nodes (25): Aggressive Escalation Triggers, Guidelines, Operating Posture, Part 1 — Findings table (REQUIRED), Part 2 — Verdict (REQUIRED), Remedial Preference Hierarchy, Required Output Format, Reviewing Animations (+17 more)

### Community 52 - "useAppUpdater"
Cohesion: 0.39
Nodes (6): WeeUpdateProgress(), UpdatesSettingsTab(), applyUpdaterStatus(), ensureAppUpdaterListeners(), normalizeReleaseNotes(), useAppUpdater()

### Community 53 - "useHubSpaceEntrance.js"
Cohesion: 0.23
Nodes (13): CHANNEL_IDLE_MS, getChannelIdleDurationMs(), getInitialActivity(), getInitialMainWindowActivity(), useAppActivity(), useHomeIdleExperience(), usePowerPolicy(), useRendererMediaPowerState() (+5 more)

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
Cohesion: 0.14
Nodes (9): react, react, lazyNamedExport(), Channel, VirtualizedChannelList, createOptimizedComponent(), performanceChecklist, performanceUtils (+1 more)

### Community 72 - "cors"
Cohesion: 0.15
Nodes (27): applyChannelSlotReorder(), channelIdAtIndex(), collectSlots(), moveParallelArrays(), scatterSlots(), buildChannelPayload(), channelToConfiguredEntry(), channelToKenBurnsEntry() (+19 more)

### Community 73 - "@dnd-kit/core"
Cohesion: 0.18
Nodes (12): GameHubMinimalDock(), SpotifyGradientOverlay(), SpotifyImmersiveOverlay(), WallpaperOverlay(), PerformanceMonitor(), WALLPAPER_OVERLAY_COLORS, useActivityInterval(), useAnimationActivity() (+4 more)

### Community 74 - "@dnd-kit/sortable"
Cohesion: 0.39
Nodes (7): buildDropMicroSparks(), buildDropParticles(), buildLiftParticles(), DropBurstLayer(), LiftBurstLayer(), measureChannelSlotCenter(), randomBetween()

### Community 75 - "@dnd-kit/utilities"
Cohesion: 0.23
Nodes (8): HomeWidgetGlassControls(), normalizeChannelSpaceKey(), DEFAULT_HOME_WIDGET_GLASS, homeWidgetGlassCssVars(), normalizeHomeWidgetGlass(), {
  appLibraryManager,
  unifiedAppManager,
  spotifyManager,
  iconManager,
  navigationManager,
  performanceManager,
  floatingWidgetManager,
}, patchHomeChannelSpace(), patchSecondaryChannelSpace()

### Community 76 - "electron-updater"
Cohesion: 0.37
Nodes (10): WeatherSlot(), useHomeWeather(), celsiusToFahrenheit(), describeWmoWeatherCode(), fetchOpenMeteoForecast(), formatHomeWeatherTemp(), formatHomeWeatherWind(), HOME_WEATHER_FALLBACK_COORDS (+2 more)

### Community 77 - "WiiRibbonComponent"
Cohesion: 0.16
Nodes (6): GooeySettingsRow(), SpotifyBrowseView(), SpotifyMiniPlayerBar(), SpotifyPlayerView(), SpotifySettingsView(), SpotifyWidgetChrome()

### Community 78 - "framer-motion"
Cohesion: 0.29
Nodes (7): Added, Changed, Deprecated, Fixed, Removed, Security, [Unreleased]

### Community 79 - "6. Styling advice by UI type"
Cohesion: 0.24
Nodes (15): AuraHero(), buildHeroStats(), hoursShort(), applyCustomArtOverrides(), buildDynamicCollections(), buildHubData(), effectiveRecentSeconds(), formatDiskSize() (+7 more)

### Community 80 - "spaceAppearance.js"
Cohesion: 0.40
Nodes (5): 👨‍💻 For Developers: Running from Source, 📥 How to Install (for Users), ✨ Main Features, Project layout, WiiDesktop Launcher

### Community 81 - "gifuct-js"
Cohesion: 0.26
Nodes (7): markAppLibraryBackgroundPrefetchScheduled(), filterSteamToolEntries(), STEAM_TOOL_APP_IDS, createFloatingWidgetManager(), isRendererActive(), createStoreManagers(), createPerformanceManager()

### Community 82 - "@headlessui/react"
Cohesion: 0.08
Nodes (14): WeeChannelModal(), ImageModal(), WeeChoiceTileGrid(), readCollapseDurationMs(), WeeContentCollapse(), sizeClasses, WeeEmphasisText(), WeeModalRail() (+6 more)

### Community 83 - "lucide-react"
Cohesion: 0.15
Nodes (12): HUB_MORPH, PLAYFUL_AMPLITUDE, PLAYFUL_SPRINGS, PLAYFUL_VARIANTS, SIZE_CLASS, VARIANT_CLASS, WEE_GOOEY_ICON_PRESS, WeeGooeyIconButton (+4 more)

### Community 85 - "p-queue"
Cohesion: 0.36
Nodes (6): CASUAL_EXE_NAMES, GAME_PATH_MARKERS, getAutoPerformancePauseHint(), isIntensiveLaunchTarget(), PERFORMANCE_PAUSE_MODES, resolveChannelPerformancePause()

### Community 86 - "prop-types"
Cohesion: 0.06
Nodes (70): base, m, patch, buildChannelPatchFromNormalized(), useAppInitialization(), hasPatchSettingsApi(), selectPersistedSlices(), useUnifiedSettingsPersistence() (+62 more)

### Community 87 - "@radix-ui/react-context-menu"
Cohesion: 0.10
Nodes (17): ChannelsLayoutSettingsTab, KEN_BURNS_EASING_OPTIONS, KEN_BURNS_MODE_OPTIONS, LAYOUT_SUB_TABS, CHROME_EFFECT_OPTIONS, MotionFeedbackSettingsTab, SettingsToggleFieldCard(), SOUND_CATEGORY_DESCRIPTIONS (+9 more)

### Community 88 - "experience-roadmap-invariants.mjs"
Cohesion: 0.17
Nodes (15): HomeWidgetSettingsPanel(), NowPlayingWidgetSettings(), STEAM_KIND_IDS, SteamWidgetSettings(), WeatherWidgetSettings(), DEFAULT_HOME_CLOCK_WIDGET, HOME_CLOCK_ALIGN, HOME_CLOCK_DATE_STACK (+7 more)

### Community 91 - "sharp"
Cohesion: 0.43
Nodes (6): SPACE_SHELL_ENTRANCE_TIERS, hubEntranceStorageKey(), memoryFullComplete, readTier(), useHubSpaceEntrance(), writeFullComplete()

### Community 92 - "spotify-web-api-js"
Cohesion: 0.11
Nodes (17): 1. Meta Information & Core Directive, 2. THE "ABSOLUTE ZERO" DIRECTIVE (STRICT ANTI-PATTERNS), 3. THE CREATIVE VARIANCE ENGINE, 4. HAPTIC MICRO-AESTHETICS (COMPONENT MASTERY), 5. MOTION CHOREOGRAPHY (FLUID DYNAMICS), 6. PERFORMANCE GUARDRAILS, 7. EXECUTION PROTOCOL, 8. PRE-OUTPUT CHECKLIST (+9 more)

### Community 93 - "useAppActivity"
Cohesion: 0.27
Nodes (10): LaunchErrorToast(), LaunchFeedbackContext, LaunchFeedbackProvider(), setLaunchCinematic(), buildLaunchErrorReport(), getLaunchErrorPresentation(), openExternalUrl(), openSettingsToDockSubtab() (+2 more)

### Community 94 - "saveFrozenSpotifyLookPreset.js"
Cohesion: 0.20
Nodes (18): MANUAL, SPOTIFY, WALLPAPER_PALETTE, useWallpaperSettingsController(), hasExplicitPageRibbonLook(), normalizeRibbonByPage(), normalizeRibbonScope(), pickRibbonLook() (+10 more)

### Community 95 - "@tanstack/react-virtual"
Cohesion: 0.12
Nodes (16): 10. SECTION RHYTHM RULE, 12. DENSITY & SPACING DISCIPLINE, 14. IMAGE / MEDIA DIRECTION, 16. MULTI-IMAGE CONSISTENCY RULE, 17. CLARITY CHECK, 19. RESPONSE BEHAVIOR, 1. ACTIVE BASELINE CONFIGURATION, 21. FINAL GOAL (+8 more)

### Community 96 - "settingsRegistry.js"
Cohesion: 0.22
Nodes (12): WiiDock(), createHomeChannelEntranceBandVariants(), createHubEntranceOrchestratorVariants(), createMediaHubGridContainerVariants(), createMediaHubGridItemVariants(), createMediaHubShellBandVariants(), getWeeDockBarEntrance(), isFirstVisitTier() (+4 more)

### Community 110 - "🖥️ Multi-Monitor Settings Guide"
Cohesion: 0.10
Nodes (21): **Accessing Monitor Settings**, **Advanced Features**, **Best Practices**, **Hot-Plugging Support**, **How It Works**, **Launch Preferences**, **Monitor Configuration**, **Monitor Detection & Management** (+13 more)

### Community 111 - "Animation Audit Playbook"
Cohesion: 0.09
Nodes (21): 1. Purpose & frequency, 2. Easing & duration, 3. Physicality & origin, 4. Interruptibility, 5. Performance, 6. Accessibility, 7. Cohesion & tokens, 8. Missed opportunities (+13 more)

### Community 112 - "WallpaperSettingsTab.jsx"
Cohesion: 0.39
Nodes (7): usePrimaryAccentThemeEffect(), adjustL(), applyPrimaryAccentFromHex(), fmt(), hexToRgb(), rgbToHslComponents(), resolveEffectiveAccent()

### Community 113 - "Apple Design"
Cohesion: 0.10
Nodes (20): 10. Gesture design details (the "feel" checklist), 11. Frame-level smoothness, 12. Materials & depth — translucency conveys hierarchy, 13. Multimodal feedback — motion + sound + haptics, 14. Reduced motion & accessibility, 15. Typography — optical sizing, tracking, leading, 16. Design foundations — the eight principles, 17. Process (+12 more)

### Community 114 - "useChannelOperations.js"
Cohesion: 0.13
Nodes (15): Appendix B - Canonical Sources (read these before reinventing), Apple Liquid Glass (Apple platforms only), Atlassian, Bootstrap, Carbon, Fluent UI, GOV.UK, Material Web (+7 more)

### Community 115 - "WeePressSurface.jsx"
Cohesion: 0.16
Nodes (27): AdminPanel(), EMPTY_CUSTOM, AdminPanelWidget(), ActionCommand(), QuickAccessItem(), AdminQuickAccessSlot(), layoutCellsForPreset(), splitActionsByCapacity() (+19 more)

### Community 116 - "Spotify Integration Setup Guide"
Cohesion: 0.09
Nodes (23): 1. Backend Integration, 2. Real-time Updates, 3. Music-Synced Effects, Common Issues:, Current Limitations, Debug Mode:, Features Available, Future Enhancements (+15 more)

### Community 117 - "soundPlayback.js"
Cohesion: 0.06
Nodes (51): CHANNEL_ANIMATION_STYLES, buildKenBurnsProps(), ChannelMediaPreview(), useChannelAdaptiveEmptyStyle(), useChannelEffectiveState(), useChannelInteractions(), clearMp4PosterCache(), mp4PosterCache (+43 more)

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

### Community 124 - "[1.9.1] - 2024-01-XX"
Cohesion: 0.17
Nodes (11): [1.9.1] - 2024-01-XX, [2.7.2] - 2025-01-XX, Added, Added, Changed, Changed, Changelog, Fixed (+3 more)

### Community 125 - "README.md"
Cohesion: 0.18
Nodes (6): Automated, Checks, Modes, Performance Smoke Checklist, PR smell checklist, Documentation

### Community 126 - "mediaWarmCache.js"
Cohesion: 0.33
Nodes (5): AuraHubModalFrame(), GameHubManageCollectionsDialog(), FloatingWidgetPresence, useDialogExitPresence(), variantNameFromDefinition()

### Community 127 - "nowPlayingShape.js"
Cohesion: 0.70
Nodes (4): looksLikeBareUsername(), looksLikeVanityProfileUrl(), parseSteamId64(), validateSteamId64Input()

### Community 128 - "cacheDomains.js"
Cohesion: 0.57
Nodes (5): defaultUncontrolledSize(), useFloatingWidgetFrame(), viewportResizeBounds(), clampFloatingWidgetPosition(), getViewportSize()

### Community 129 - "UnifiedDockSettingsTab.jsx"
Cohesion: 0.32
Nodes (10): buildCandidateTerms(), buildQueryTokens(), ChannelModalInlineMediaSuggestions(), deriveChannelArtSearchQuery(), formatMediaKind(), normalizeText(), rowKey(), rowPublicUrl() (+2 more)

### Community 130 - "Agent and contributor guide (Wee)"
Cohesion: 0.04
Nodes (44): Agent and contributor guide (Wee), Always follow, Before you finish a change, Content resize cohesion (expand / collapse / list close), Design Context, Electron, Key files, Motion and modal guardrails (+36 more)

### Community 131 - "Performance baselines (Wee)"
Cohesion: 0.22
Nodes (8): Baseline capture template (fill before/after each phase), Baseline session log, Example budgets (tune for your machine), How to capture baselines, Motion guardrails (non-negotiable), Native wallpaper helper (decision), Performance baselines (Wee), Scenarios to measure

### Community 132 - "Shell spaces and channel grids (Wee)"
Cohesion: 0.18
Nodes (10): Board mutation, Default rail destinations, Grid layout, Key files, Look: wallpaper per space / per page, Naming (avoid confusion), Presets, Shell spaces and channel grids (Wee) (+2 more)

### Community 133 - "Style Architecture Map"
Cohesion: 0.25
Nodes (8): Anti-Patterns To Avoid, Core Rule, Dynamic Runtime Styling Pattern, Feature Surfaces (Tokenized), Navigation Surfaces, Shared UI Primitives, Style Architecture Map, Token Layers

### Community 135 - "useActivityInterval"
Cohesion: 0.14
Nodes (13): DEFAULT_BUTTON_CONFIGS, formatDate(), formatTime(), RibbonMiniature(), useHostWidth(), LazyPrimaryActionsModal, WiiRibbon, WiiStyleButton() (+5 more)

### Community 136 - "Primary accent (Wii blue) — theme audit"
Cohesion: 0.25
Nodes (7): Audit notes (remaining drift), Key files, Live color precedence, Primary accent (Wii blue) — theme audit, Single source of truth, Tailwind, What updates with the effective accent

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

### Community 149 - "buildPresetSnapshot.js"
Cohesion: 0.25
Nodes (11): ChannelModalSuggestedGames(), dedupeInstalledAgainstStores(), filterGames(), getSuggestedCarouselKey(), paginateGames(), sortGames(), SOURCE_FILTER, buildLaunchPathFromSelectedApp() (+3 more)

### Community 150 - "9. AI TELLS (Forbidden Patterns)"
Cohesion: 0.25
Nodes (8): 9.A Visual & CSS, 9. AI TELLS (Forbidden Patterns), 9.B Typography, 9.C Layout & Spacing, 9.D Content & Data ("Jane Doe" Effect), 9.E External Resources & Components, 9.F Production-Test Tells (banned outright), 9.G EM-DASH BAN (the single most-violated Tell)

### Community 151 - "8. ANTI-AI-SLOP RULES"
Cohesion: 0.25
Nodes (8): 8. ANTI-AI-SLOP RULES, Carousel / marquee slop (layout), Content slop, Data / KPI slop, Density slop, Layout slop, Typography slop, Visual slop

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

### Community 165 - "7. DIAL DEFINITIONS (Technical Reference)"
Cohesion: 0.50
Nodes (4): 7. DIAL DEFINITIONS (Technical Reference), DESIGN_VARIANCE (Level 1-10), MOTION_INTENSITY (Level 1-10), VISUAL_DENSITY (Level 1-10)

### Community 166 - "15. DEFAULT SITE PACKS"
Cohesion: 0.50
Nodes (4): 12-section pack, 15. DEFAULT SITE PACKS, 4-section pack, 8-section pack

### Community 167 - "20. EXAMPLE INTERPRETATIONS"
Cohesion: 0.50
Nodes (4): 20. EXAMPLE INTERPRETATIONS, Example 1, Example 2, Example 3

### Community 169 - "WiiSideNavigation.jsx"
Cohesion: 0.17
Nodes (17): ChannelModalBehaviorTab(), GameHubControlsPill(), HomePageIndicator(), statusLabel(), UpdateModal(), LayoutStepper(), createWeeSideNavPeekVariants(), createWeeSideNavShellMotion() (+9 more)

### Community 171 - "WorkspaceSwitcherModal.jsx"
Cohesion: 0.13
Nodes (15): better-sqlite3, cors, framer-motion, fuse.js, lucide-react, dependencies, better-sqlite3, cors (+7 more)

### Community 182 - "useFloatingWidgetFrame"
Cohesion: 0.31
Nodes (7): DOCK_SUB_TABS, normalizeDockSubTab(), UnifiedDockSettingsTab, CLASSIC_DOCK_THEME_GROUPS, CLASSIC_DOCK_DEFAULT_COLORS, findDockThemePath(), getDockThemeByPath()

### Community 203 - "react"
Cohesion: 0.26
Nodes (12): WiiRibbonComponent(), PrimaryActionsModalComponent(), analyzeIconTransparency(), clampSampleSize(), clearTintedIconCache(), getTintedIconCacheSize(), getTintedIconUrl(), loadImageElement() (+4 more)

## Knowledge Gaps
- **834 isolated node(s):** `PLAYLISTS`, `SONGS`, `name`, `version`, `main` (+829 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **55 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `WorkspaceSwitcherModal.jsx` to `WiiDesktop Launcher`, `Features Available`, `ChannelsLayoutSettingsTab.jsx`, `cacheDomains.js`, `WiiDesktop Launcher`, `ApiIntegrationsSettingsTab.jsx`, `package.json`, `1. THE THREE DIALS (Core Configuration)`, `mediaHubStremio.js`, `weePerformanceMarks.js`, `jszip`, `HomeSlot.jsx`, `sharp`, `jszip`, `systeminformation`, `uuid`, `vdf`, `windows-media-sessions`, `HomeWidgetGlassControls.jsx`, `react`, `WiiSideNavigation.jsx`, `fast-deep-equal`, `mediaHubStremio.js`, `react-icons`, `CommandPalette.jsx`, `windows-shortcuts`, `zustand`, `react-dom`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `GameHubSpace.jsx`, `WorkspaceSwitcherModal.jsx`, `react`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Why does `WiiRibbonComponent()` connect `react` to `settingsRegistry.js`, `Text.jsx`, `keyboardShortcuts.js`, `ChannelModalChannelArtPanel.jsx`, `useActivityInterval`, `WiiSideNavigation.jsx`, `SettingsModal.jsx`, `supabase.js`, `MediaLibraryBrowser.jsx`, `WeeModalFieldCard`, `WeePressSurface.jsx`, `soundPlayback.js`, `prop-types`, `GameHubSpace.jsx`, `react`, `useAppActivity`, `saveFrozenSpotifyLookPreset.js`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **What connects `PLAYLISTS`, `SONGS`, `name` to the rest of the system?**
  _834 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useConsolidatedAppHooks.js` be split into smaller, more focused modules?**
  _Cohesion score 0.03636363636363636 - nodes in this community are weakly interconnected._
- **Should `AuraCollectionsSection.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12433862433862433 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._