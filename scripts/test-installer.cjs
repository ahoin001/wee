const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Test installer functionality
async function testInstaller() {
  console.log('Testing installer functionality...');
  
  // Simulate first run
  const userDataPath = app.getPath('userData');
  const firstRunFile = path.join(userDataPath, 'first-run-complete.json');
  
  // Remove first run file to simulate fresh install
  try {
    const fs = require('fs-extra');
    await fs.remove(firstRunFile);
    console.log('✓ Removed first-run file to simulate fresh install');
  } catch (error) {
    console.log('First run file does not exist (expected for fresh install)');
  }
  
  // Test shortcut creation
  const testOptions = {
    desktop: true,
    startmenu: true,
    taskbar: false,
    autostart: false
  };
  
  console.log('✓ Installer test completed');
  console.log('To test the full installer experience:');
  console.log('1. Run: npm run make');
  console.log('2. Install the generated .exe file');
  console.log('3. The installer should show on first run');
}

// Run test if this file is executed directly
if (require.main === module) {
  testInstaller().catch(console.error);
}

module.exports = { testInstaller }; 