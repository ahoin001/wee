/**
 * Quick node assert for iPhone-style channel slot reorder.
 * Run: node scripts/test/channel-reorder.cjs
 */
const assert = require('node:assert/strict');
const path = require('node:path');

// channelReorder.js is ESM — evaluate via dynamic import.
async function loadReorder() {
  const modPath = path.join(__dirname, '../../src/utils/channelReorder.js');
  return import(`file:///${modPath.replace(/\\/g, '/')}`);
}

async function run() {
  const { applyChannelSlotReorder, snapshotChannelSlotMaps } = await loadReorder();

  // Empty target: move filled 4 → empty 0 (splice). Between slots shift.
  const base = {
    configuredChannels: {
      'channel-4': { path: 'B', media: 'x' },
      'channel-2': { path: 'C' },
    },
    channelConfigs: {
      'channel-4': { zoom: 2 },
      'channel-2': { zoom: 1 },
    },
  };

  const toEmpty = applyChannelSlotReorder({
    fromIndex: 4,
    toIndex: 0,
    totalChannels: 12,
    ...base,
  });
  assert.equal(toEmpty.configuredChannels['channel-0']?.path, 'B');
  assert.equal(toEmpty.configuredChannels['channel-4'], undefined);
  // channel-2 shifts right when inserting before it? from 4 to 0:
  // remove idx4, insert at 0 → former 0..3 shift right, former 2 → 3
  assert.equal(toEmpty.configuredChannels['channel-3']?.path, 'C');
  assert.equal(toEmpty.configuredChannels['channel-2'], undefined);

  // Filled → filled: 5 into 1, shift down
  const filled = {
    configuredChannels: {
      'channel-1': { path: 'A' },
      'channel-5': { path: 'E' },
      'channel-6': { path: 'F' },
    },
    channelConfigs: {},
  };
  const insert = applyChannelSlotReorder({
    fromIndex: 5,
    toIndex: 1,
    totalChannels: 12,
    ...filled,
  });
  assert.equal(insert.configuredChannels['channel-1']?.path, 'E');
  assert.equal(insert.configuredChannels['channel-2']?.path, 'A');
  assert.equal(insert.configuredChannels['channel-5'], undefined);
  assert.equal(insert.configuredChannels['channel-6']?.path, 'F');

  // Cross-page: last page → first page
  const cross = applyChannelSlotReorder({
    fromIndex: 13,
    toIndex: 2,
    totalChannels: 36,
    configuredChannels: { 'channel-13': { path: 'P2' }, 'channel-2': { path: 'P1' } },
    channelConfigs: {},
  });
  assert.equal(cross.configuredChannels['channel-2']?.path, 'P2');
  assert.equal(cross.configuredChannels['channel-3']?.path, 'P1');

  const snap = snapshotChannelSlotMaps(base.configuredChannels, base.channelConfigs);
  assert.notEqual(snap.configuredChannels, base.configuredChannels);
  assert.deepEqual(snap.configuredChannels, base.configuredChannels);

  console.log('[channel-reorder] OK');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
