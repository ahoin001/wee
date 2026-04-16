#!/usr/bin/env node
const { spawnSync } = require('child_process');

function run(command, args, label) {
  console.log(`\n[release] ${label}...`);
  console.log(`[release] > ${command} ${args.join(' ')}`);

  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }
  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }
}

function main() {
  const publish = process.argv.includes('--publish');

  run('npm', ['run', 'build'], 'Building renderer bundle');

  const builderArgs = ['electron-builder'];
  if (!publish) {
    builderArgs.push('--publish', 'never');
  }
  run('npx', builderArgs, publish ? 'Building and publishing release' : 'Building release artifacts');

  console.log('\n[release] Done.');
  if (!publish) {
    console.log('[release] Artifacts are in dist/.');
  }
}

main();
 