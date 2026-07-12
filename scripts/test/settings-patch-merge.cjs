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

  // Reorder: emptied slots are omitted from the patch map — must replace, not deep-merge.
  const channelBase = {
    channels: {
      dataBySpace: {
        home: {
          configuredChannels: {
            'channel-0': { path: 'A' },
            'channel-4': { path: 'B' },
          },
          channelConfigs: {
            'channel-0': { zoom: 1 },
            'channel-4': { zoom: 2 },
          },
        },
      },
    },
  };
  const reorderPatch = {
    channels: {
      dataBySpace: {
        home: {
          configuredChannels: {
            'channel-0': { path: 'B' },
          },
          channelConfigs: {
            'channel-0': { zoom: 2 },
          },
        },
      },
    },
  };
  const afterReorder = mergeSettingsPatch(channelBase, reorderPatch);
  assert.deepEqual(afterReorder.channels.dataBySpace.home.configuredChannels, {
    'channel-0': { path: 'B' },
  });
  assert.deepEqual(afterReorder.channels.dataBySpace.home.channelConfigs, {
    'channel-0': { zoom: 2 },
  });

  // Empty {} must not wipe populated slot maps (partial/bad saves).
  const emptyWipe = mergeSettingsPatch(channelBase, {
    channels: {
      dataBySpace: {
        home: {
          configuredChannels: {},
          channelConfigs: {},
        },
      },
    },
  });
  assert.deepEqual(
    emptyWipe.channels.dataBySpace.home.configuredChannels,
    channelBase.channels.dataBySpace.home.configuredChannels
  );

  // slotMeta also replaces wholesale (punch-hole clears must stick).
  const metaBase = {
    channels: {
      dataBySpace: {
        home: {
          slotMeta: {
            'channel-2': { hidden: true },
            'channel-5': { hidden: true },
          },
        },
      },
    },
  };
  const metaPatch = {
    channels: {
      dataBySpace: {
        home: {
          slotMeta: {
            'channel-2': { hidden: true },
          },
        },
      },
    },
  };
  const afterMeta = mergeSettingsPatch(metaBase, metaPatch);
  assert.deepEqual(afterMeta.channels.dataBySpace.home.slotMeta, {
    'channel-2': { hidden: true },
  });
}

run();
console.log('[settings-patch-merge] OK');
