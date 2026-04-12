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
- Build the application
- Create a GitHub release
- Upload the installer files
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
npm run make
```

### 3. Create GitHub Release
- Go to GitHub Releases
- Click "Create a new release"
- Set tag to `v1.9.2`
- Add release notes from CHANGELOG.md
- Upload the `.exe` files from `out/` directory

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
- New auto-update system
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

## 🐛 Troubleshooting

### Release Not Appearing
- Check GitHub Actions workflow status
- Verify the tag was pushed correctly
- Ensure the release files were uploaded

### Users Not Getting Updates
- Verify the version number was incremented
- Check that the GitHub release was published (not draft)
- Ensure the auto-updater is configured correctly

### Build Failures
- Check Node.js version (requires 18+)
- Verify all dependencies are installed
- Check for any linting errors 