const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function release() {
  try {
    console.log('🚀 Starting release process...');
    
    // Check if we're in the right directory
    if (!fs.existsSync('package.json')) {
      throw new Error('package.json not found. Please run this script from the project root.');
    }
    
    // Read current version
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const currentVersion = packageJson.version;
    
    console.log(`📦 Current version: ${currentVersion}`);
    
    // Build the app
    console.log('🔨 Building app...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Package the app
    console.log('📦 Packaging app...');
    execSync('npm run package', { stdio: 'inherit' });
    
    // Publish to GitHub
    console.log('🚀 Publishing to GitHub...');
    execSync('npm run publish', { stdio: 'inherit' });
    
    console.log('✅ Release completed successfully!');
    console.log(`📋 Version ${currentVersion} has been published to GitHub.`);
    console.log('🔗 Users will now be able to auto-update to this version.');
    
  } catch (error) {
    console.error('❌ Release failed:', error.message);
    process.exit(1);
  }
}

release(); 