<img width="1609" height="1010" alt="image" src="https://github.com/user-attachments/assets/9f366428-036e-4ef2-97a4-a4162e5955af" />

# WiiDesktop Launcher

Transform your Windows desktop into a nostalgic and functional masterpiece with WiiDesktop Launcher! This custom application replicates the beloved visual experience of the classic Nintendo Wii home screen, allowing you to launch your favorite apps, games, and websites from beautiful, interactive "channel" tiles.

## ✨ Main Features

WiiDesktop Launcher is built for ultimate personalization. Nearly every aspect of the UI can be tailored to your liking, creating a desktop experience that is uniquely yours.

* **🎨 Easy Wallpaper Customization!**
  * Easily change your background to any image you like.
  * Save your favorite wallpapers directly in the app, making it simple to switch between them.
  * Adjust the wallpaper's transparency for the perfect look, or enable the "liquid glass" effect for the bottom ribbon to see it through the UI.

* **🎵 Full Sound Customization**
  * Personalize your experience by setting custom sounds for channel clicks, hovers, and even the application's startup chime.
  * Set your own background music to create the perfect ambiance.

* **🚀 Quick & Easy Channel Creation**
  * Make new channels in seconds. Use the built-in image finder to search a community-driven database for the perfect thumbnail, or upload your own.
  * Add paths to local `.exe` files or website URLs in one simple menu to get your channels up and running instantly.

* **⚙️ Customizable UI Buttons**
  * Change the text or icons of the primary buttons on the bottom ribbon to fit your style or needs.

* **🎬 Control Channel Animations**
  * You have control over interactive behaviors. Choose to have channel animations (GIFs and MP4s) play constantly or only when you hover over them to save resources and reduce distractions.

* **💙 Beautiful Wii-like UI**
  * A beautifully crafted interface that pays homage to the classic Wii design, complete with a dynamic, interactive bottom ribbon and a clean, grid-based layout for your channels.

* **🖥️ Multi-Monitor Support**
  * Full support for dual and multi-monitor setups with automatic detection and management.
  * Set different wallpapers for each monitor for a truly personalized experience.
  * Monitor-specific settings and preferences that persist across sessions.
  * Easy switching between monitors with dedicated controls and preferences.

## 📥 How to Install (for Users)

1. **Download the Latest Release:**
   * Go to the [**Releases Page**](https://github.com/ahoin001/wee/releases) of this repository.
* Under the latest version, find the "Assets" section and click on the `WeeDesktopLauncher-Setup-x.x.x.exe` file to download it.

2. **Run the Installer:**
   * Once downloaded, double-click the `.exe` file.
   * Windows might show a security warning. If it does, click **"More info"** and then **"Run anyway"**.
   * The application will install and launch automatically. You can find it in your Start Menu or on your Desktop.

## 👨‍💻 For Developers: Running from Source

If you'd like to contribute or run the app in a development environment, follow these steps.

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/ahoin001/wee.git
   ```

2. **Set up Supabase (Optional - for Community Presets):**
   If you want to use the community preset sharing features, you'll need to set up Supabase:
   
   - Create a `.env` file in the project root with:
     ```bash
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```
   - See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed setup instructions

## 🖥️ Multi-Monitor Settings Guide

WiiDesktop Launcher includes comprehensive multi-monitor support, allowing you to customize your experience across all connected displays.

### **Accessing Monitor Settings**

1. **Open Settings**: Right-click on the Wii ribbon or use the settings button
2. **Navigate to Monitor Tab**: Click on the "🖥️ Monitor" tab in the settings sidebar
3. **Open Monitor Settings**: Click "📺 Open Monitor Settings" to access the full monitor management interface

### **Monitor Detection & Management**

The app automatically detects all connected monitors and provides detailed information for each:

* **Monitor Information**: Resolution, position, and status (Primary/Current)
* **Real-time Updates**: Automatically detects when monitors are added, removed, or reconfigured
* **Visual Indicators**: Clear labeling shows which monitor is primary and which is currently active

### **Monitor Switching**

#### **Quick Actions**
* **Move to Primary**: Instantly move the launcher to your primary monitor
* **Move to Secondary**: Switch to the first secondary monitor
* **Move Here**: Click on any detected monitor to move the launcher there
* **Refresh**: Update monitor detection if changes aren't reflected

#### **Launch Preferences**
Configure where the launcher should appear when starting:

* **Primary Monitor**: Always start on the primary display
* **Secondary Monitor**: Always start on the first secondary display
* **Last Used Monitor**: Remember and return to the last monitor you used
* **Specific Monitor**: Choose a particular monitor by ID
* **Remember Last Used**: Toggle to save monitor preferences across sessions

### **Monitor-Specific Wallpapers**

One of the most powerful features is the ability to set different wallpapers for each monitor:

#### **Setting Monitor Wallpapers**
1. **Open Monitor Settings**: Go to Settings → Monitor → "📺 Open Monitor Settings"
2. **Find Monitor Section**: Scroll to "Monitor-Specific Settings"
3. **Select Monitor**: Each monitor will have its own settings card
4. **Set Wallpaper**: Click "Set Wallpaper" to choose an image for that specific monitor
5. **Clear Wallpaper**: Use "Clear" to remove the monitor-specific wallpaper

#### **How It Works**
* **Automatic Switching**: When you move between monitors, the wallpaper automatically changes to that monitor's specific wallpaper
* **Persistent Storage**: Each monitor's wallpaper is saved and remembered
* **Fallback Behavior**: If no monitor-specific wallpaper is set, the app uses the global wallpaper
* **Opacity & Blur**: Monitor-specific wallpapers support the same opacity and blur settings as global wallpapers

### **Monitor-Specific Settings**

Beyond wallpapers, each monitor can have its own settings:

* **Theme Settings**: Different themes per monitor (future feature)
* **Color Schemes**: Monitor-specific color preferences (future feature)
* **Custom Configurations**: Save monitor-specific UI preferences

### **Advanced Features**

#### **Hot-Plugging Support**
* **Automatic Detection**: When you connect or disconnect monitors, the app automatically detects the changes
* **Real-time Updates**: Monitor list updates immediately when configuration changes
* **Graceful Handling**: The app handles monitor changes smoothly without requiring restarts

#### **Monitor Metrics**
* **Resolution Changes**: Automatically adapts to resolution changes
* **Position Tracking**: Knows which monitor the launcher is currently on
* **Bounds Management**: Handles monitor positioning and overlapping

### **Troubleshooting**

#### **Monitor Not Detected**
* **Check Connections**: Ensure the monitor is properly connected
* **Refresh Detection**: Click "Refresh" in the monitor settings
* **Restart App**: If issues persist, restart the application

#### **Wallpaper Not Switching**
* **Check Monitor Settings**: Ensure a wallpaper is set for the target monitor
* **Verify Monitor ID**: Make sure you're setting wallpaper for the correct monitor
* **Clear and Reset**: Try clearing the wallpaper and setting it again

#### **Performance Issues**
* **Reduce Wallpaper Quality**: Use smaller image files for better performance
* **Disable Animations**: Turn off wallpaper cycling if experiencing lag
* **Monitor Count**: Very high monitor counts may impact performance

### **Best Practices**

#### **Wallpaper Management**
* **Consistent Themes**: Use wallpapers with similar themes for a cohesive look
* **Resolution Matching**: Use wallpapers that match each monitor's resolution
* **File Size**: Keep wallpaper files under 10MB for optimal performance

#### **Monitor Configuration**
* **Primary Setup**: Designate your main monitor as primary for consistent behavior
* **Remember Preferences**: Enable "Remember last used monitor" for convenience
* **Regular Updates**: Refresh monitor detection after major display changes

### **Technical Details**

The multi-monitor system uses:
* **Electron Screen API**: For monitor detection and management
* **Zustand State Management**: For monitor state and preferences
* **Persistent Storage**: Monitor-specific data is saved to local storage
* **Real-time Events**: Monitor changes trigger immediate UI updates

This comprehensive multi-monitor support ensures that WiiDesktop Launcher provides a seamless and personalized experience across all your displays! 🎮✨
