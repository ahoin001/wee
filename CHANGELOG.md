# Changelog

All notable changes to WiiDesktop Launcher will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New features that have been added

### Changed
- Changes in existing functionality

### Deprecated
- Features that will be removed in upcoming releases

### Removed
- Features that have been removed

### Fixed
- Bug fixes

### Security
- Security vulnerability fixes

---

## [2.7.2] - 2025-01-XX

### Added
- Unified Appearance Settings Modal with sidebar navigation
- Dark mode support for all UI components including modals and forms
- Componentized PresetListItem with dark mode styling
- Enhanced Toggle component with improved disabled state visibility
- Design system integration across all modals and components

### Changed
- Replaced all custom toggle switches with unified Toggle component
- Updated PresetsModal to use design system colors and components
- Improved dark mode text contrast and card styling
- Enhanced modal navigation with scalable sidebar pattern
- Consolidated channel grid styles for better responsiveness

### Fixed
- **Critical**: Fixed wallpapers and channels not loading on startup after PC restart
- Fixed duplicate getDefaultSettings() function in electron.cjs
- Fixed wallpapers data structure mismatch causing empty wallpaper lists
- Fixed channel configurations not persisting across app restarts
- Fixed toggle component visibility in disabled state (dark mode)
- Fixed double scrolling issue in AppearanceSettingsModal
- Fixed immersivePip state variable not defined error
- Fixed sound modal not opening when ClassicWiiDock is active

### Security
- Enhanced error handling and debugging for data persistence issues

---

## [1.9.1] - 2024-01-XX

### Added
- Auto-update system with background checking
- Update notification badges
- Enhanced update modal with changelog support
- Sound settings in presets
- Channel data in presets
- Improved preset system with visual indicators

### Changed
- Moved "Check for Updates" from General Settings to main settings menu
- Enhanced update modal UI with better error handling
- Improved sound volume synchronization
- Better memory management and performance optimizations

### Fixed
- Sound volume changes not taking effect immediately
- Sound stopping after saving volume changes
- Volume reverting on window focus
- Preset system not properly saving/restoring channel data
- Update modal opening automatically on app start
- Endless loading spinner in update check

### Security
- Enhanced event listener cleanup to prevent memory leaks 