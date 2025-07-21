# Release Guide

This guide explains how to release a new version of WiiDesktop Launcher.

## 🚀 Quick Release Process

### 1. Prepare the Release
```bash
# Run the release script (this will update version, build, and create a tag)
npm run release 1.9.2
```

### 2. Push the Release
```bash
# Push the tag to trigger GitHub Actions
git push origin v1.9.2
```

### 3. GitHub Actions Will Automatically:
- Build the application using electron-builder
- Create a GitHub release
- Upload the installer and update files (including latest.yml, .exe, etc.)
- Generate release notes

## 📋 Manual Release Process

If you prefer to do it manually:

### 1. Update Version
```bash
# Update package.json version
# Update CHANGELOG.md with new version
```

### 2. Build and Package
```bash
npm run build
npx electron-builder --win --publish never
```

### 3. Create GitHub Release
- Go to GitHub Releases
- Click "Create a new release"
- Set tag to `v1.9.2`
- Add release notes from CHANGELOG.md
- Upload the `.exe` and `latest.yml` files from the `dist/` directory

## 📝 Changelog Guidelines

When adding features or fixes, update the `CHANGELOG.md` file:

### Categories:
- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Features that will be removed
- **Removed**: Features that have been removed
- **Fixed**: Bug fixes
- **Security**: Security vulnerability fixes

### Example:
```markdown
## [Unreleased]

### Added
- New auto-update system (electron-updater)
- Enhanced preset functionality

### Fixed
- Sound volume synchronization issues
- Update modal endless loading
```

## 🔄 User Update Flow

1. **Background Check**: App checks for updates every 24 hours
2. **Notification**: Red badge appears on "Check for Updates" if update available
3. **Manual Check**: Users can click "Check for Updates" anytime
4. **Changelog**: Users see what's new in the update
5. **Download**: Users can download and install the update
6. **Install**: App will prompt to restart and install the update

## 🐛 Troubleshooting

### Release Not Appearing
- Check GitHub Actions workflow status
- Verify the tag was pushed correctly
- Ensure the release files were uploaded

### Users Not Getting Updates
- Verify the version number was incremented
- Check that the GitHub release was published (not draft)
- Ensure the auto-updater is configured correctly in electron.cjs
- Make sure latest.yml and installer files are present in the release

### Build Failures
- Check Node.js version (requires 18+)
- Verify all dependencies are installed
- Check for any linting errors 