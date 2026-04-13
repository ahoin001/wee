const fs = require('fs');
const path = require('path');

function patchBetween(fileRel, startNeedle, endNeedle, insertLine) {
  const filePath = path.join(__dirname, '..', fileRel);
  let s = fs.readFileSync(filePath, 'utf8');
  const i = s.indexOf(startNeedle);
  const j = s.indexOf(endNeedle);
  if (i === -1 || j === -1) {
    console.error('Markers not found', fileRel, { i, j, startNeedle, endNeedle });
    process.exit(1);
  }
  if (j <= i) {
    console.error('End before start', fileRel);
    process.exit(1);
  }
  s = s.slice(0, i) + insertLine + '\n\n' + s.slice(j);
  fs.writeFileSync(filePath, s);
  console.log('Patched', fileRel, 'lines', s.split(/\r?\n/).length);
}

patchBetween(
  'src/components/ClassicDockSettingsModal.jsx',
  '// Theme groups for collapsible organization',
  'function ClassicDockSettingsModal',
  "import { CLASSIC_DOCK_THEME_GROUPS as THEME_GROUPS } from '../data/dock/classicDockThemeGroups';"
);

patchBetween(
  'src/components/settings/UnifiedDockSettingsTab.jsx',
  '// Theme groups for Classic Dock',
  '// Sub-tab configuration',
  "import { CLASSIC_DOCK_THEME_GROUPS as THEME_GROUPS } from '../../data/dock/classicDockThemeGroups';"
);

patchBetween(
  'src/components/settings/DockSettingsTab.jsx',
  '// Theme groups for collapsible organization',
  'const ColorSettingRow',
  "import { CLASSIC_DOCK_THEME_GROUPS as THEME_GROUPS } from '../../data/dock/classicDockThemeGroups';"
);
