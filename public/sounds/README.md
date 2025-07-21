# Default Sounds for WiiDesktop Launcher

This directory contains the default sound files for the WiiDesktop Launcher application.

## How to Add Default Sounds

1. **Place your sound files in this directory** with the following naming convention:
   - `wii-click-1.mp3`, `wii-click-2.mp3`, `wii-click-3.mp3` (for channel click sounds)
   - `wii-hover-1.mp3`, `wii-hover-2.mp3`, `wii-hover-3.mp3` (for channel hover sounds)
   - `wii-menu-music.mp3`, `wii-channel-music.mp3`, `wii-ambient-music.mp3` (for background music)
   - `wii-startup-1.mp3`, `wii-startup-2.mp3`, `wii-startup-3.mp3` (for startup sounds)

2. **Supported audio formats**: MP3, WAV, OGG, M4A

3. **File size recommendations**:
   - Click/Hover sounds: 50KB - 200KB each
   - Background music: 1MB - 5MB each
   - Startup sounds: 100KB - 500KB each

4. **Volume levels** (can be adjusted in the app):
   - Click sounds: Default 50% volume
   - Hover sounds: Default 30% volume
   - Background music: Default 40% volume
   - Startup sounds: Default 60% volume

## Automatic Loading

When you first open the Sound Settings modal, the app will automatically:
- Load any default sound files found in this directory
- Add them to the "Saved Sounds" section for each sound type
- Make them available for selection

## Customization

You can:F
- Replace the default files with your own sounds (keep the same filenames)
- Add additional sound files and they will be available in the app
- Adjust volume levels and enable/disable sounds in the Sound Settings modal

## Example File Structure

```
public/sounds/
├── README.md
├── wii-click-1.mp3
├── wii-click-2.mp3
├── wii-click-3.mp3
├── wii-hover-1.mp3
├── wii-hover-2.mp3
├── wii-hover-3.mp3
├── wii-menu-music.mp3
├── wii-channel-music.mp3
├── wii-ambient-music.mp3
├── wii-startup-1.mp3
├── wii-startup-2.mp3
└── wii-startup-3.mp3
```

## Notes

- The app will only load these sounds on first run or if no saved sounds exist
- You can still add custom sounds through the file picker in the app
- Default sounds are marked with a special flag and can be distinguished from user-added sounds 