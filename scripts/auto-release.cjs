#!/usr/bin/env node
const { execSync } = require('child_process');

const bump = process.argv[2];
const channel = (process.argv[3] || 'public').toLowerCase();

if (!['patch', 'minor', 'major'].includes(bump) || !['public', 'private'].includes(channel)) {
  console.error('Usage: node scripts/auto-release.cjs [patch|minor|major] [public|private]');
  process.exit(1);
}

try {
  console.log(`Preparing ${channel} ${bump} release...`);

  // Stage all changes
  execSync('git add .', { stdio: 'inherit' });

  // Commit (if there are staged changes)
  try {
    execSync('git diff --cached --quiet || git commit -m "chore: release auto-commit"', { stdio: 'inherit' });
  } catch (e) {
    // No changes to commit
  }

  // Bump version and create tag.
  // private => prerelease tags (vX.Y.Z-private.N)
  // public  => stable tags (vX.Y.Z)
  const versionMode = channel === 'private'
    ? ({ patch: 'prepatch', minor: 'preminor', major: 'premajor' }[bump])
    : bump;
  const extraArgs = channel === 'private' ? '--preid private' : '';
  execSync(`npm version ${versionMode} ${extraArgs}`.trim(), { stdio: 'inherit' });

  // Push commit and the new version tag together (required for Build and Release workflow: on.push.tags v*)
  execSync('git push --follow-tags', { stdio: 'inherit' });

  console.log('\nRelease triggered! Check your GitHub Actions for build and release status.');
} catch (err) {
  console.error('Release script failed:', err);
  process.exit(1);
} 