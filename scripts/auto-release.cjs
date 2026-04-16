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

  // Push commit and the new version tag together (required for Build and Release workflow: on.push.tags v*)
  execSync('git push --follow-tags', { stdio: 'inherit' });

  console.log('\nRelease triggered! Check your GitHub Actions for build and release status.');
} catch (err) {
  console.error('Release script failed:', err);
  process.exit(1);
} 