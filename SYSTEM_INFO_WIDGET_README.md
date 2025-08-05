# System Info Widget

A comprehensive system monitoring widget for the Wii Desktop Launcher that displays real-time system information in a floating, draggable interface.

## Features

### 📊 System Metrics
- **CPU Usage & Temperature**: Real-time CPU utilization and temperature monitoring
- **Memory Usage**: RAM usage with total, used, and free memory display
- **GPU Information**: GPU usage, temperature, memory, and driver details (when available)
- **Storage**: Per-partition disk usage with visual progress bars
- **Battery**: Battery level, charging status, and estimated time remaining (for laptops)

### 🎨 Interface
- **Three-Page Layout**:
  - **Overview**: Quick system metrics with performance graphs
  - **Detailed**: In-depth information for each component
  - **Settings**: Widget customization options

### 📈 Performance Graphs
- Real-time performance graphs for CPU, Memory, and GPU
- Configurable update intervals (1-10 seconds)
- Toggle-able graph display

### 🎮 Controls
- **Draggable**: Click and drag to move the widget around the screen
- **Resizable**: Drag the resize handle to adjust widget size
- **Keyboard Shortcut**: Press `Ctrl+I` to toggle the widget
- **Task Manager**: Quick access button to open Windows Task Manager

## Usage

### Opening the Widget
1. Press `Ctrl+I` (default keyboard shortcut)
2. The widget will appear in the center of the screen
3. Drag it to your preferred location

### Navigation
- **Overview Tab**: View all system metrics at a glance
- **Detailed Tab**: Click on CPU, Memory, or GPU tabs for detailed information
- **Settings Tab**: Configure update intervals and graph display

### Quick Actions
- **Task Manager**: Click the "🖥️ Task Manager" button to open Windows Task Manager
- **Refresh**: Click the "🔄 Refresh" button to manually update system information

## Technical Details

### System Information Sources
- **CPU**: Uses `systeminformation.currentLoad()` and `systeminformation.cpuTemperature()`
- **Memory**: Uses `systeminformation.mem()` for RAM statistics
- **Storage**: Uses `systeminformation.fsSize()` for disk information
- **GPU**: Uses `systeminformation.graphics()` for GPU details
- **Battery**: Uses `systeminformation.battery()` for battery information

### Performance
- Updates every 2 seconds by default (configurable)
- Efficient data collection with minimal system impact
- Automatic fallback for unavailable metrics

### Compatibility
- **Windows**: Full support for all metrics
- **Linux**: Basic support (some metrics may vary)
- **macOS**: Basic support (some metrics may vary)

## Configuration

### Update Interval
- Range: 1-10 seconds
- Default: 2 seconds
- Adjust in the Settings tab

### Graph Display
- Toggle performance graphs on/off
- Graphs show the last 50 data points
- Smooth animations and color-coded metrics

### Widget Position
- Position is automatically saved
- Widget remembers its last location
- Reset position option available

## Keyboard Shortcuts

| Action | Default Shortcut |
|--------|------------------|
| Toggle System Info Widget | `Ctrl+I` |
| Toggle Spotify Widget | `Ctrl+L` |

## Troubleshooting

### Widget Not Appearing
1. Check if the keyboard shortcut is working (`Ctrl+I`)
2. Verify the widget isn't positioned off-screen
3. Check browser console for any errors

### Missing System Information
- **GPU Info**: Some systems may not provide GPU usage/temperature
- **Battery Info**: Desktop systems won't show battery information
- **Temperature**: May not be available on all systems

### Performance Issues
- Increase the update interval in Settings
- Disable performance graphs if needed
- Close other resource-intensive applications

## Development

### Files
- `src/components/SystemInfoWidget.jsx` - Main widget component
- `src/components/SystemInfoWidget.css` - Widget styling
- `src/utils/useSystemInfoStore.js` - State management
- `electron.cjs` - System information collection

### Dependencies
- `systeminformation` - System metrics collection
- `zustand` - State management
- React hooks for UI management

### Adding New Metrics
1. Add the metric collection in `electron.cjs`
2. Update the store in `useSystemInfoStore.js`
3. Add the display component in `SystemInfoWidget.jsx`
4. Style the new metric in `SystemInfoWidget.css`

## Future Enhancements

- **Network Monitoring**: Network usage and speed
- **Process List**: Top processes by resource usage
- **Custom Alerts**: Notifications for high resource usage
- **Export Data**: Save system information to file
- **Historical Data**: Long-term performance tracking
- **Custom Metrics**: User-defined system information 