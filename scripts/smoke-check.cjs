const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();

const checks = [
  {
    file: 'src/hooks/useAppInitialization.js',
    mustContain: ['electronApi.getUnifiedData', 'if (resolvedSettings.dock)', 'if (resolvedSettings.sounds)'],
  },
  {
    file: 'src/utils/useConsolidatedAppStore.js',
    mustContain: ['setUIState: (updates)', 'setChannelState: (updates)'],
  },
  {
    file: 'src/components/overlays/IsolatedWallpaperBackground.jsx',
    mustContain: ['const IsolatedWallpaperBackground = React.memo', 'useWallpaperCycling'],
  },
  {
    file: 'src/hooks/useChannelModalInitialization.js',
    mustContain: ['export const useChannelModalInitialization', 'preloadMediaLibrary'],
  },
  {
    file: 'src/hooks/useFloatingWidgetFrame.js',
    mustContain: ['export const useFloatingWidgetFrame', 'handleHeaderMouseDown'],
  },
];

const failures = [];

for (const check of checks) {
  const fullPath = path.join(root, check.file);
  if (!fs.existsSync(fullPath)) {
    failures.push(`Missing expected file: ${check.file}`);
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  for (const expected of check.mustContain) {
    if (!content.includes(expected)) {
      failures.push(`Missing "${expected}" in ${check.file}`);
    }
  }
}

if (failures.length) {
  console.error('[smoke-check] Failed');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('[smoke-check] Passed');
