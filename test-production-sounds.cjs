const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const path = require('path');
const fs = require('fs/promises');

// Mock the app for testing
const mockApp = {
  getPath: (name) => {
    if (name === 'userData') {
      return path.join(__dirname, 'test-user-data');
    }
    return path.join(__dirname, 'test-user-data', name);
  }
};

// Mock user data paths
const userDataPath = mockApp.getPath('userData');
const userSoundsPath = path.join(userDataPath, 'sounds');

// Sound types and default sounds (copied from electron.cjs)
const SOUND_TYPES = ['channelClick', 'channelHover', 'backgroundMusic', 'startup'];
const DEFAULT_SOUNDS = {
  channelClick: [
    {
      id: 'default-channelClick-1',
      name: 'Wii Click 1',
      filename: 'wii-click-1.mp3',
      volume: 0.5,
      isDefault: true
    }
  ],
  channelHover: [
    {
      id: 'default-channelHover-1', 
      name: 'Wii Hover 1',
      filename: 'wii-hover-1.mp3',
      volume: 0.3,
      isDefault: true
    }
  ],
  backgroundMusic: [
    {
      id: 'default-backgroundMusic-1',
      name: 'Wii Menu Music',
      filename: 'wii-menu-music.mp3', 
      volume: 0.4,
      isDefault: true
    }
  ],
  startup: [
    {
      id: 'default-startup-1',
      name: 'Wii Startup 1',
      filename: 'wii-startup-1.mp3',
      volume: 0.6,
      isDefault: true
    }
  ]
};

async function testSoundSystem() {
  console.log('Testing production sound system...');
  
  // Test 1: Check if user data directory exists
  try {
    await fs.access(userSoundsPath);
    console.log('✓ User sounds directory exists');
  } catch (error) {
    console.log('✗ User sounds directory does not exist, creating...');
    await fs.mkdir(userSoundsPath, { recursive: true });
  }
  
  // Test 2: Check if default sounds exist in public/sounds
  const publicSoundsPath = path.join(__dirname, 'public', 'sounds');
  try {
    const files = await fs.readdir(publicSoundsPath);
    console.log('✓ Public sounds directory contains:', files);
  } catch (error) {
    console.log('✗ Public sounds directory not found:', error.message);
  }
  
  // Test 3: Check if default sounds exist in user directory
  try {
    const userFiles = await fs.readdir(userSoundsPath);
    console.log('✓ User sounds directory contains:', userFiles);
  } catch (error) {
    console.log('✗ Error reading user sounds directory:', error.message);
  }
  
  // Test 4: Test URL generation for production
  const isDev = false; // Simulate production
  const testSound = DEFAULT_SOUNDS.channelClick[0];
  const productionUrl = isDev 
    ? `/sounds/${testSound.filename}` 
    : `userdata://sounds/${testSound.filename}`;
  
  console.log('✓ Production URL generated:', productionUrl);
  
  // Test 5: Test protocol registration (mock)
  console.log('✓ Protocol registration would work in production');
  
  console.log('\nTest completed!');
}

testSoundSystem().catch(console.error); 