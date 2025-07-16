const fs = require('fs/promises');
const path = require('path');

// Simulate the user data path
const userDataPath = path.join(process.cwd(), 'test-user-data');
const settingsPath = path.join(userDataPath, 'settings.json');

async function testSoundSettings() {
  console.log('Testing sound settings persistence...');
  
  // Ensure test directory exists
  try {
    await fs.mkdir(userDataPath, { recursive: true });
  } catch (err) {
    // Directory might already exist
  }
  
  // Test sound settings
  const testSettings = {
    channelClick: {
      enabled: true,
      file: { url: '/sounds/wii-click-1.mp3', name: 'Wii Click 1' },
      volume: 0.5
    },
    channelHover: {
      enabled: true,
      file: { url: '/sounds/wii-hover-1.mp3', name: 'Wii Hover 1' },
      volume: 0.3
    },
    backgroundMusic: {
      enabled: true,
      file: { url: '/sounds/wii-menu-music.mp3', name: 'Wii Menu Music' },
      volume: 0.4,
      loopMode: 'single',
      playlist: []
    },
    startup: {
      enabled: true,
      file: { url: '/sounds/wii-startup-1.mp3', name: 'Wii Startup 1' },
      volume: 0.6
    }
  };
  
  console.log('Saving test sound settings:');
  console.log(JSON.stringify(testSettings, null, 2));
  await fs.writeFile(settingsPath, JSON.stringify(testSettings, null, 2));
  
  // Test reading back the settings
  console.log('\nReading back sound settings...');
  const data = await fs.readFile(settingsPath, 'utf-8');
  const loadedSettings = JSON.parse(data);
  console.log('Loaded settings:', JSON.stringify(loadedSettings, null, 2));
  
  // Verify the settings match
  const settingsMatch = JSON.stringify(testSettings) === JSON.stringify(loadedSettings);
  console.log('\nSettings match:', settingsMatch ? '✅ YES' : '❌ NO');
  
  // Test accessing specific sound settings
  console.log('\nTesting specific sound access:');
  console.log(`Channel Click: ${loadedSettings.channelClick?.enabled ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`Channel Hover: ${loadedSettings.channelHover?.enabled ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`Background Music: ${loadedSettings.backgroundMusic?.enabled ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`Startup: ${loadedSettings.startup?.enabled ? '✅ Enabled' : '❌ Disabled'}`);
  
  // Cleanup
  await fs.unlink(settingsPath);
  await fs.rmdir(userDataPath);
  
  console.log('\nTest completed!');
}

testSoundSettings().catch(console.error); 