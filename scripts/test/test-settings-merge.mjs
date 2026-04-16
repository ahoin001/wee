/**
 * Regression: slot-keyed channel maps must not deep-merge with disk (stale keys).
 * Run: node scripts/test/test-settings-merge.mjs
 */
import { mergeCanonicalSettings } from '../../src/utils/store/settingsPersistenceContract.js';

const base = {
  channels: {
    data: {
      configuredChannels: {
        'channel-0': { a: 1 },
        'channel-5': { b: 2 },
      },
      channelConfigs: { 'channel-5': { k: 1 } },
      navigation: { currentPage: 0 },
    },
  },
};

const patch = {
  channels: {
    data: {
      configuredChannels: { 'channel-2': { b: 2 } },
      channelConfigs: {},
      navigation: { currentPage: 1 },
    },
  },
};

const m = mergeCanonicalSettings(base, patch);
const slice = m.channels.dataBySpace.home;
const cc = slice.configuredChannels;
const cf = slice.channelConfigs;

if (cc['channel-5'] !== undefined) {
  throw new Error('stale channel-5 in configuredChannels');
}
if (cc['channel-2']?.b !== 2) {
  throw new Error('expected moved payload at channel-2');
}
if (cf['channel-5'] !== undefined) {
  throw new Error('stale channel-5 in channelConfigs');
}
if (Object.keys(cf).length !== 0) {
  throw new Error('expected empty channelConfigs from patch');
}
if (slice.navigation.currentPage !== 1) {
  throw new Error('navigation should deep-merge');
}

console.log('test-settings-merge: ok');
