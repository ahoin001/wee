#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Update Check Functionality...\n');

// Check current version
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log(`📦 Current Version: ${packageJson.version}`);

// Check repository configuration
console.log(`🔗 Repository: ${packageJson.repository.url}`);
console.log(`🏗️  Build Config:`);
console.log(`   - App ID: ${packageJson.build.appId}`);
console.log(`   - Product Name: ${packageJson.build.productName}`);
console.log(`   - Publish Config:`, packageJson.build.publish[0]);

// Check if latest.yml would be generated
console.log('\n📋 Checking electron-builder configuration...');
try {
  const result = execSync('npx electron-builder --help', { encoding: 'utf8' });
  console.log('✅ electron-builder is available');
} catch (error) {
  console.log('❌ electron-builder not available');
}

// Check GitHub repository
console.log('\n🌐 Checking GitHub repository...');
try {
  const repoUrl = packageJson.repository.url.replace('.git', '');
  console.log(`Repository URL: ${repoUrl}`);
  console.log(`Releases URL: ${repoUrl}/releases`);
  console.log(`Latest Release: ${repoUrl}/releases/latest`);
} catch (error) {
  console.log('❌ Error checking repository:', error.message);
}

// Check for existing releases
console.log('\n📊 Checking for existing releases...');
try {
  const releasesUrl = `${packageJson.repository.url.replace('.git', '')}/releases`;
  console.log(`Releases page: ${releasesUrl}`);
  console.log('Note: Check this URL manually to see if releases exist');
} catch (error) {
  console.log('❌ Error checking releases:', error.message);
}

console.log('\n✅ Update check test completed!');
console.log('\n📝 Next steps:');
console.log('1. Verify that releases exist on GitHub');
console.log('2. Check that latest.yml files are present in releases');
console.log('3. Test the update check in the app');
console.log('4. Check console logs for any errors'); 