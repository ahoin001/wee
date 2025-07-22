# 🧪 Testing the Installer and Launcher

This guide explains how to test the Electron app and its installer both locally (development) and as a packaged production build.

---

## 1. Local Development Testing

### Build and Run in Dev Mode
1. Install dependencies (if you haven't):
   ```sh
   npm install
   ```
2. Start the app in development mode:
   ```sh
   npm run dev
   ```
   - This runs the Vite dev server and launches Electron.
   - Hot reload is enabled for fast iteration.
3. Test all features:
   - Launch channels, open modals, change settings, etc.
   - Check for errors in the terminal and browser console.

---

## 2. Production Build Testing (Locally)

### Build the App
1. Build the frontend:
   ```sh
   npm run build
   ```
2. Package the app (Windows, x64):
   ```sh
   npx electron-builder --win --x64 --publish never
   ```
   - This creates an installer `.exe` and update files in the `dist/` folder.

### Test the Installer
1. Locate the installer in `dist/` (e.g., `WeeDesktopLauncher-Setup-x.x.x.exe`).
2. Run the installer:
   - Follow the prompts to install the app.
   - Launch the app from the Start Menu or Desktop shortcut.
3. Test the installed app:
   - Ensure all features work as expected.
   - Check for missing assets, update issues, or errors.

---

## 3. Production Release Testing (GitHub Release)

1. After a release, download the installer from the GitHub Releases page.
2. Install and run the app as above.
3. Test auto-update:
   - If you publish a new release, the app should detect and offer to update.
   - Test the update flow by installing an older version, then releasing a new one.

---

## 4. Troubleshooting

- If the app doesn't start, check the logs in the terminal and `%APPDATA%/WeeDesktopLauncher/logs` (or similar).
- For missing assets, verify the `dist/` folder contents and packaging config.
- For update issues, check the GitHub Releases page for the correct files (`latest.yml`, `.exe`).

---

**Tip:** Always test both the dev and production builds before publishing a release! 