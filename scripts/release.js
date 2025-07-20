#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get version from command line argument
const newVersion = process.argv[2];

if (!newVersion) {
  console.error('Usage: node scripts/release.js <version>');
  console.error('Example: node scripts/release.js 1.9.2');
  process.exit(1);
}

// Validate version format
if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error('Version must be in format: x.y.z');
  process.exit(1);
}

console.log(`🚀 Preparing release for version ${newVersion}...`);

try {
  // Update package.json
  const packagePath = path.join(__dirname, '..', 'package.json');
  const package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const oldVersion = package.version;
  package.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(package, null, 2) + '\n');
  console.log(`✅ Updated package.json: ${oldVersion} → ${newVersion}`);

  // Update CHANGELOG.md
  const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
  let changelog = fs.readFileSync(changelogPath, 'utf8');
  
  // Replace [Unreleased] with the new version
  const today = new Date().toISOString().split('T')[0];
  changelog = changelog.replace(
    '## [Unreleased]',
    `## [Unreleased]\n\n## [${newVersion}] - ${today}`
  );
  
  fs.writeFileSync(changelogPath, changelog);
  console.log(`✅ Updated CHANGELOG.md with version ${newVersion}`);

  // Build the application
  console.log('🔨 Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Package the application
  console.log('📦 Packaging application...');
  execSync('npm run make', { stdio: 'inherit' });

  // Create git tag
  console.log(`🏷️  Creating git tag v${newVersion}...`);
  execSync(`git add .`, { stdio: 'inherit' });
  execSync(`git commit -m "Release version ${newVersion}"`, { stdio: 'inherit' });
  execSync(`git tag v${newVersion}`, { stdio: 'inherit' });

  console.log('\n🎉 Release preparation complete!');
  console.log('\nNext steps:');
  console.log(`1. Push the tag: git push origin v${newVersion}`);
  console.log('2. GitHub Actions will automatically create a release');
  console.log('3. Users will be notified of the update');

} catch (error) {
  console.error('❌ Error during release preparation:', error.message);
  process.exit(1);
} 