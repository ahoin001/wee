const assert = require('node:assert/strict');
const { mergeSettingsPatch } = require('../../shared/settings-patch-merge.cjs');

function run() {
  const base = {
    ui: { isDarkMode: false, lowPowerMode: false },
    channels: {
      settings: { kenBurnsEnabled: false, animatedOnHover: false },
      dataBySpace: { home: { channels: [{ id: '1' }] } },
    },
  };
  const patch = {
    ui: { lowPowerMode: true },
    channels: {
      settings: { animatedOnHover: true },
    },
  };

  const merged = mergeSettingsPatch(base, patch);
  assert.equal(merged.ui.isDarkMode, false);
  assert.equal(merged.ui.lowPowerMode, true);
  assert.equal(merged.channels.settings.kenBurnsEnabled, false);
  assert.equal(merged.channels.settings.animatedOnHover, true);
  assert.deepEqual(merged.channels.dataBySpace, base.channels.dataBySpace);

  const replacePatch = { ui: { keyboardShortcuts: ['ctrl+k'] } };
  const replaced = mergeSettingsPatch(base, replacePatch);
  assert.deepEqual(replaced.ui.keyboardShortcuts, ['ctrl+k']);

  const skipUndefined = mergeSettingsPatch(base, { ui: { isDarkMode: undefined } });
  assert.equal(skipUndefined.ui.isDarkMode, false);
}

run();
console.log('[settings-patch-merge] OK');
