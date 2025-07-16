const path = require('path');

// Simulate the sound URL generation logic
function testSoundUrls() {
  console.log('Testing sound URL generation...');
  
  // Test filenames
  const testFiles = [
    'wii-click-1.mp3',
    'wii-hover-1.mp3', 
    'wii-menu-music.mp3',
    'wii-startup-1.mp3'
  ];
  
  console.log('\nSimulating production sound URLs:');
  testFiles.forEach(filename => {
    const soundPath = path.join(__dirname, 'dist', 'sounds', filename);
    const fileUrl = `file://${soundPath}`;
    console.log(`${filename}: ${fileUrl}`);
  });
  
  console.log('\nSimulating development sound URLs:');
  testFiles.forEach(filename => {
    const devUrl = `/sounds/${filename}`;
    console.log(`${filename}: ${devUrl}`);
  });
  
  console.log('\nTest completed!');
}

testSoundUrls(); 