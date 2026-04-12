const { app } = require('electron');
const path = require('path');
const fs = require('fs').promises;

// Mock the app paths for testing
const userDataPath = path.join(__dirname, 'userdata');
const savedSoundsPath = path.join(userDataPath, 'saved-sounds.json');

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

// Helper: Load sound library (defaults + user sounds)
async function loadSoundLibrary() {
  try {
    // Load saved sound library
    let savedLibrary;
    try {
      const data = await fs.readFile(savedSoundsPath, 'utf-8');
      savedLibrary = JSON.parse(data);
    } catch (error) {
      console.log('No saved sound library found, creating initial one...');
      savedLibrary = null;
    }
    
    if (!savedLibrary) {
      // Create initial library with defaults
      const initialLibrary = {};
      
      for (const soundType of SOUND_TYPES) {
        initialLibrary[soundType] = DEFAULT_SOUNDS[soundType].map(sound => ({
          ...sound,
          url: `userdata://sounds/${sound.filename}`,
          enabled: soundType === 'startup' ? false : true
        }));
      }
      
      // Save initial library
      await fs.mkdir(path.dirname(savedSoundsPath), { recursive: true });
      await fs.writeFile(savedSoundsPath, JSON.stringify(initialLibrary, null, 2));
      console.log('[SOUNDS] Created initial sound library with defaults');
      return initialLibrary;
    }
    
    return savedLibrary;
  } catch (error) {
    console.error('[SOUNDS] Error loading sound library:', error);
    return {};
  }
}

async function testSoundLibrary() {
  console.log('Testing sound library initialization...\n');
  
  const library = await loadSoundLibrary();
  
  console.log('Sound Library Structure:');
  for (const soundType of SOUND_TYPES) {
    console.log(`\n${soundType}:`);
    const sounds = library[soundType] || [];
    sounds.forEach(sound => {
      console.log(`  - ${sound.name} (enabled: ${sound.enabled}, isDefault: ${sound.isDefault})`);
    });
  }
  
  // Check specific conditions
  console.log('\n--- Verification ---');
  
  const startupSounds = library.startup || [];
  const enabledStartup = startupSounds.filter(s => s.enabled);
  console.log(`Startup sounds enabled: ${enabledStartup.length} (should be 0 by default)`);
  
  const backgroundMusic = library.backgroundMusic || [];
  const enabledBackground = backgroundMusic.filter(s => s.enabled);
  console.log(`Background music enabled: ${enabledBackground.length} (should be 1 by default)`);
  
  const channelClick = library.channelClick || [];
  const enabledClick = channelClick.filter(s => s.enabled);
  console.log(`Channel click enabled: ${enabledClick.length} (should be 1 by default)`);
  
  const channelHover = library.channelHover || [];
  const enabledHover = channelHover.filter(s => s.enabled);
  console.log(`Channel hover enabled: ${enabledHover.length} (should be 1 by default)`);
  
  console.log('\nTest completed!');
}

// Run the test
testSoundLibrary().catch(console.error); 