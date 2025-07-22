#!/usr/bin/env node
const { execSync } = require('child_process');

const bump = process.argv[2];
if (!['patch', 'minor', 'major'].includes(bump)) {
  console.error('Usage: node scripts/auto-release.cjs [patch|minor|major]');
  process.exit(1);
}

try {
  // Stage all changes
  execSync('git add .', { stdio: 'inherit' });

  // Commit (if there are staged changes)
  try {
    execSync('git diff --cached --quiet || git commit -m "chore: release auto-commit"', { stdio: 'inherit' });
  } catch (e) {
    // No changes to commit
  }

  // Bump version and create tag
  execSync(`npm version ${bump}`, { stdio: 'inherit' });

  // Push commit and tags
  execSync('git push', { stdio: 'inherit' });
  execSync('git push --tags', { stdio: 'inherit' });

  console.log('\nRelease triggered! Check your GitHub Actions for build and release status.');
} catch (err) {
  console.error('Release script failed:', err);
  process.exit(1);
} 