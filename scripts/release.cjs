#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function checkSounds() {
  const soundsDir = path.join(__dirname, '../public/sounds');
  if (!fs.existsSync(soundsDir)) {
    console.error('[Release] ERROR: public/sounds/ directory does not exist!');
    process.exit(1);
  }
  const required = [
    'wii-click-1.mp3',
    'wii-hover-1.mp3',
    'wii-menu-music.mp3',
    'wii-startup-1.mp3'
  ];
  let missing = false;
  for (const file of required) {
    if (!fs.existsSync(path.join(soundsDir, file))) {
      console.error(`[Release] ERROR: Missing sound file: ${file}`);
      missing = true;
    }
  }
  if (missing) {
    process.exit(1);
  }
}

console.log('\n[Release] Building Vite app...');
execSync('npm run build', { stdio: 'inherit' });

console.log('\n[Release] Checking sound assets...');
checkSounds();

console.log('\n[Release] Packaging app with electron-builder...');
execSync('npx electron-builder --win --x64', { stdio: 'inherit' });

console.log('\n[Release] Build and packaging complete! Check the dist/ folder for your installer and unpacked app.'); 