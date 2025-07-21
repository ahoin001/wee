#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');

// 1. Read version from package.json
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = pkg.version;
const tag = `v${version}`;

console.log(`\n[Release] Building app for version ${version}...`);
execSync('npm run build', { stdio: 'inherit' });

console.log(`\n[Release] Creating git tag: ${tag}`);
try {
  execSync(`git tag ${tag}`);
  console.log(`[Release] Tag ${tag} created.`);
} catch (e) {
  console.error(`[Release] Failed to create tag: ${e.message}`);
  process.exit(1);
}

console.log(`\n[Release] Pushing tag ${tag} to origin...`);
try {
  execSync(`git push origin ${tag}`, { stdio: 'inherit' });
  console.log(`[Release] Tag ${tag} pushed to origin.`);
} catch (e) {
  console.error(`[Release] Failed to push tag: ${e.message}`);
  process.exit(1);
}

console.log(`\n[Release] Done! GitHub Actions will now build and publish the release.`); 