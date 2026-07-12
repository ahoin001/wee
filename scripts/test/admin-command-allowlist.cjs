/**
 * Keep shared allowlist and renderer mirror in sync.
 */
const shared = require('../../shared/admin-command-allowlist.cjs');
const fs = require('fs');
const path = require('path');

const rendererSrc = fs.readFileSync(
  path.join(__dirname, '../../src/utils/adminPanelCommands.js'),
  'utf8'
);

const samples = [
  ['start notepad', true],
  ['start calc', true],
  ['start ms-settings:sound', true],
  ['start ms-settings:network-wifi', true],
  ['shutdown /s /t 0', true],
  ['powershell -Command Get-Process', false],
  ['cmd /c echo hi', false],
  ['start evilthing', false],
  ['start notepad; rm -rf', false],
];

let failed = 0;
for (const [command, expectOk] of samples) {
  const result = shared.validateAdminCommand(command);
  if (Boolean(result.ok) !== expectOk) {
    console.error(`FAIL validateAdminCommand(${JSON.stringify(command)}) =>`, result);
    failed += 1;
  }
}

const requiredTargets = ['notepad', 'calc', 'snippingtool', 'perfmon'];
for (const target of requiredTargets) {
  if (!shared.ALLOWED_SIMPLE_START_TARGETS.has(target)) {
    console.error(`FAIL missing allowlist target: ${target}`);
    failed += 1;
  }
  if (!rendererSrc.includes(`'${target}'`)) {
    console.error(`FAIL renderer mirror missing target: ${target}`);
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`[admin-command-allowlist] ${failed} failure(s)`);
  process.exit(1);
}

console.log('[admin-command-allowlist] OK');
