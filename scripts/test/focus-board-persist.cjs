/**
 * Focus / workspaces board persistence invariants.
 * Stale secondaryChannelProfiles must not revive cleared Focus slots on migrate/hydrate/save.
 *
 * Run: npx vite-node scripts/test/focus-board-persist.cjs
 */
const assert = require('node:assert/strict');
const path = require('node:path');

async function load() {
  const spacesPath = path.join(__dirname, '../../src/utils/channelSpaces.js');
  const contractPath = path.join(__dirname, '../../src/utils/store/settingsPersistenceContract.js');
  const mergePath = path.join(__dirname, '../../shared/settings-patch-merge.cjs');
  const spaces = await import(`file:///${spacesPath.replace(/\\/g, '/')}`);
  const contract = await import(`file:///${contractPath.replace(/\\/g, '/')}`);
  const { mergeSettingsPatch } = require(mergePath);
  return { ...spaces, ...contract, mergeSettingsPatch };
}

function clearedFocusBoard() {
  return {
    layout: { mode: 'wii', columns: 4, rows: 3, totalPages: 1 },
    navigation: { currentPage: 0, totalPages: 1, isAnimating: false },
    configuredChannels: {},
    channelConfigs: {},
    slotMeta: {},
    slots: [
      {
        kind: 'channel',
        hidden: false,
        colSpan: 1,
        rowSpan: 1,
        channel: null,
      },
      {
        kind: 'channel',
        hidden: false,
        colSpan: 1,
        rowSpan: 1,
        channel: null,
      },
    ],
  };
}

function staleProfileBoard() {
  return {
    layout: { mode: 'wii', columns: 4, rows: 3, totalPages: 1 },
    navigation: { currentPage: 0, totalPages: 1 },
    configuredChannels: {
      'channel-0': {
        path: 'C:\\\\Games\\\\OldApp.exe',
        media: { url: 'file:///old-art.png', type: 'image/png' },
      },
    },
    channelConfigs: {},
    slotMeta: {},
    slots: [
      {
        kind: 'channel',
        hidden: false,
        colSpan: 1,
        rowSpan: 1,
        channel: {
          path: 'C:\\\\Games\\\\OldApp.exe',
          media: { url: 'file:///old-art.png', type: 'image/png' },
        },
      },
    ],
  };
}

async function run() {
  const {
    migrateLegacyChannelsToDataBySpace,
    migrateLegacySecondaryChannelProfiles,
    mergeChannelsSlice,
    buildSettingsSnapshotFromStore,
    mergeSettingsPatch,
  } = await load();

  // --- 1. Cleared workspaces + stale profiles → workspaces wins ---
  const diskLike = {
    dataBySpace: {
      home: clearedFocusBoard(),
      workspaces: clearedFocusBoard(),
    },
    secondaryChannelProfiles: {
      focus1: {
        id: 'focus1',
        name: 'Stale Focus',
        channelSpace: staleProfileBoard(),
      },
    },
    activeSecondaryChannelProfileId: 'focus1',
  };

  const migrated = migrateLegacySecondaryChannelProfiles(diskLike);
  assert.equal(
    migrated.dataBySpace.workspaces.configuredChannels?.['channel-0'],
    undefined,
    'migrate must not revive cleared Focus configuredChannels from stale profiles'
  );
  assert.equal(
    migrated.dataBySpace.workspaces.slots?.[0]?.channel,
    null,
    'migrate must keep cleared Focus slot empty'
  );

  const viaDataBySpace = migrateLegacyChannelsToDataBySpace(diskLike);
  assert.equal(
    viaDataBySpace.dataBySpace.workspaces.slots?.[0]?.channel,
    null,
    'migrateLegacyChannelsToDataBySpace must prefer workspaces over profiles'
  );

  // --- 2. Profiles-only (no workspaces) still seeds Focus once ---
  const profilesOnly = {
    secondaryChannelProfiles: {
      focus1: {
        id: 'focus1',
        name: 'Legacy Focus',
        channelSpace: staleProfileBoard(),
      },
    },
    activeSecondaryChannelProfileId: 'focus1',
  };
  const seeded = migrateLegacyChannelsToDataBySpace(profilesOnly);
  assert.equal(
    seeded.dataBySpace.workspaces.configuredChannels?.['channel-0']?.path,
    'C:\\\\Games\\\\OldApp.exe',
    'profiles-only hydrate must still seed Focus once'
  );

  // --- 3. mergeChannelsSlice hydrate path (boot) ---
  const defaults = {
    dataBySpace: {
      home: clearedFocusBoard(),
      workspaces: clearedFocusBoard(),
    },
  };
  const afterHydrate = mergeChannelsSlice(defaults, diskLike);
  assert.equal(
    afterHydrate.dataBySpace.workspaces.slots?.[0]?.channel,
    null,
    'mergeChannelsSlice must not resurrect Focus from profiles when workspaces present'
  );
  assert.equal(afterHydrate.secondaryChannelProfiles, undefined);
  assert.equal(afterHydrate.activeSecondaryChannelProfileId, undefined);

  // --- 4. Persist snapshot tombstones profile keys ---
  const snapshot = buildSettingsSnapshotFromStore({ channels: diskLike });
  assert.equal(
    snapshot.channels.secondaryChannelProfiles,
    null,
    'selectPersistedChannels must tombstone secondaryChannelProfiles'
  );
  assert.equal(
    snapshot.channels.activeSecondaryChannelProfileId,
    null,
    'selectPersistedChannels must tombstone activeSecondaryChannelProfileId'
  );
  assert.equal(
    snapshot.channels.dataBySpace.workspaces.slots?.[0]?.channel,
    null,
    'persisted Focus board must stay cleared'
  );

  // --- 5. Main merge applies tombstones onto disk ghosts ---
  const diskBase = {
    channels: {
      secondaryChannelProfiles: diskLike.secondaryChannelProfiles,
      activeSecondaryChannelProfileId: 'focus1',
      dataBySpace: {
        home: clearedFocusBoard(),
        workspaces: staleProfileBoard(),
      },
    },
  };
  const afterSave = mergeSettingsPatch(diskBase, { channels: snapshot.channels });
  assert.equal(afterSave.channels.secondaryChannelProfiles, null);
  assert.equal(afterSave.channels.activeSecondaryChannelProfileId, null);
  assert.equal(
    afterSave.channels.dataBySpace.workspaces.slots?.[0]?.channel,
    null,
    'patched disk must keep cleared Focus slots'
  );

  console.log('focus-board-persist: all assertions passed');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
