const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const path = require('path');

async function checkUpdateStatus() {
  try {
    console.log('🔍 Checking auto-update configuration...');
    
    // Check if app is packaged
    const isPackaged = process.env.NODE_ENV === 'production' || process.env.ELECTRON_IS_DEV === '0';
    console.log(`📦 App is packaged: ${isPackaged}`);
    
    // Check current version
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log(`📋 Current version: ${packageJson.version}`);
    
    // Check if app-update.yml exists in the expected location
    const appPath = process.resourcesPath || process.execPath;
    const updateYmlPath = path.join(appPath, 'app-update.yml');
    console.log(`📁 Looking for app-update.yml at: ${updateYmlPath}`);
    
    if (fs.existsSync(updateYmlPath)) {
      console.log('✅ app-update.yml found!');
      const updateYml = fs.readFileSync(updateYmlPath, 'utf8');
      console.log('📄 Contents:');
      console.log(updateYml);
    } else {
      console.log('❌ app-update.yml not found!');
      console.log('💡 This file should be generated during the publishing process.');
    }
    
    // Check auto-updater configuration
    console.log('\n⚙️ Auto-updater configuration:');
    console.log(`- Auto download: ${autoUpdater.autoDownload}`);
    console.log(`- Auto install on quit: ${autoUpdater.autoInstallOnAppQuit}`);
    console.log(`- Allow downgrade: ${autoUpdater.allowDowngrade}`);
    console.log(`- Allow prerelease: ${autoUpdater.allowPrerelease}`);
    
    // Try to check for updates
    console.log('\n🔄 Checking for updates...');
    try {
      const result = await autoUpdater.checkForUpdates();
      console.log('✅ Update check completed successfully');
      console.log('📊 Result:', result);
    } catch (error) {
      console.error('❌ Update check failed:', error.message);
      console.log('💡 This might be expected if no updates are available or if the app-update.yml is missing.');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkUpdateStatus(); 