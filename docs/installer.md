# WeeDesktopLauncher Custom Installer

This directory contains the custom installer for WeeDesktopLauncher, providing a fun and interactive installation experience.

## Features

### 🎮 Interactive Installation Experience
- **Welcome Screen**: Introduces the app with animated features list
- **Installation Options**: Let users choose where to create shortcuts
- **Progress Animation**: Visual feedback during installation
- **Completion Celebration**: Confetti animation when installation is complete

### 📁 Shortcut Options
Users can choose to create shortcuts in:
- **Desktop**: Quick access from desktop
- **Start Menu**: Traditional Windows start menu integration
- **Taskbar**: Pin to Windows taskbar for easy access
- **Auto-start**: Launch automatically when Windows starts

### 🎨 Visual Design
- **Modern UI**: Gradient backgrounds and smooth animations
- **Responsive**: Adapts to different screen sizes
- **Accessible**: Clear text and intuitive navigation
- **Fun Elements**: Emojis, animations, and confetti effects

## Files

### `installer.html`
The main installer interface with:
- Step-by-step navigation
- Animated transitions
- Progress tracking
- User option selection

### `custom-installer.js`
Backend installer logic with:
- Shortcut creation functions
- Installation progress simulation
- User preference handling
- Auto-start configuration

### `test-installer.cjs`
Testing utilities for:
- Verifying installer functionality
- Simulating fresh installations
- Debugging shortcut creation

## How It Works

### 1. First Run Detection
The installer checks for a `first-run-complete.json` file in the user data directory. If this file doesn't exist, it shows the installer.

### 2. Installation Steps
1. **Welcome**: Introduces the app and its features
2. **Options**: User selects shortcut preferences
3. **Progress**: Shows installation progress with animations
4. **Complete**: Celebration screen with launch option

### 3. Shortcut Creation
Uses PowerShell commands to create Windows shortcuts:
- Desktop shortcuts via WScript.Shell
- Start menu integration
- Taskbar pinning via Shell.Application
- Auto-start via Electron's login item settings

### 4. Completion
After installation, a `first-run-complete.json` file is created to prevent the installer from showing again.

## Testing

### Development Testing
```bash
npm run test-installer
```

### Production Testing
1. Build the app: `npm run make`
2. Install the generated `.exe` file
3. The installer should appear on first run

## Customization

### Adding New Steps
1. Update the `INSTALL_STEPS` array in `custom-installer.js`
2. Add corresponding HTML generation in `installer.html`
3. Handle step logic in the IPC handlers

### Modifying Shortcuts
Edit the shortcut creation functions:
- `createDesktopShortcut()`
- `createStartMenuShortcut()`
- `pinToTaskbar()`
- `setupAutoStart()`

### Styling Changes
Modify the CSS in `installer.html` to change:
- Colors and gradients
- Animations and transitions
- Layout and spacing
- Typography

## Best Practices

### User Experience
- Keep installation steps simple and clear
- Provide visual feedback for all actions
- Allow users to go back and change options
- Make the process fun and engaging

### Technical Considerations
- Handle errors gracefully
- Provide fallbacks for shortcut creation
- Clean up temporary files
- Log installation activities for debugging

### Security
- Validate all user inputs
- Use secure paths for file operations
- Limit file system access to necessary directories
- Follow Windows security best practices

## Troubleshooting

### Common Issues
1. **Installer doesn't show**: Check if `first-run-complete.json` exists
2. **Shortcuts not created**: Verify PowerShell execution permissions
3. **Auto-start not working**: Check Windows startup settings
4. **Animation issues**: Ensure CSS animations are supported

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` before running the installer.

## Future Enhancements

### Planned Features
- [ ] Installation progress with real file operations
- [ ] Custom themes and branding options
- [ ] Multi-language support
- [ ] Installation analytics
- [ ] Uninstaller integration

### Potential Improvements
- [ ] Silent installation mode
- [ ] Custom installation directory
- [ ] Component selection (optional features)
- [ ] Installation verification
- [ ] Rollback functionality 