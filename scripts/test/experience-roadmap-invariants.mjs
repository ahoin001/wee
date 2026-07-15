/**
 * Focused invariants for the Wee experience roadmap data flows:
 * bounded recent-launch history, idle experience normalization, Now Playing
 * takeover gating, launch feedback modes, and versioned .wee-preset files.
 * Run with: npm run test:experience
 */

import assert from 'node:assert/strict';
import {
  MAX_RECENT_LAUNCHES,
  deriveLaunchLabel,
  normalizeRecentLaunchEntry,
  recordRecentLaunchEntry,
  sanitizeRecentLaunches,
} from '../../src/utils/recentLaunches.js';
import {
  IDLE_EXPERIENCE_MODES,
  matchIdlePersonality,
  IDLE_PERSONALITY_PACKS,
  normalizeIdleExperienceSettings,
} from '../../src/utils/idleExperience.js';
import {
  normalizeNowPlayingExperience,
  selectSpotifyImmersiveActive,
  selectSpotifyTakeoverActive,
} from '../../src/utils/spotifyTakeover.js';
import {
  DEFAULT_LAUNCH_FEEDBACK_MODE,
  LAUNCH_FEEDBACK_MODES,
  normalizeLaunchFeedbackMode,
} from '../../src/utils/launchCinematic.js';
import {
  WEE_PRESET_FILE_VERSION,
  buildPresetFilePayload,
  parsePresetFile,
} from '../../src/utils/presets/presetFileTransfer.js';
import {
  clearAlbumArtPaletteCache,
  extractColorsFromAlbumArt,
  getAlbumArtPaletteCacheSize,
} from '../../src/utils/extractColorsFromAlbumArt.js';
import {
  clearTintedIconCache,
  getTintedIconCacheSize,
  getTintedIconUrl,
} from '../../src/utils/iconTinting.js';
import {
  MEDIA_HUB_PERSISTED_CACHE_MAX_ENTRIES,
  pruneKeyedCacheForPersistence,
} from '../../src/utils/store/persistedCachePrune.js';
import {
  clearAllCacheDomains,
  getCacheDomainLastRefreshedAt,
  listCacheDomains,
  refreshCacheDomain,
  registerCacheDomain,
} from '../../src/utils/cacheRegistry.js';

function test(name, fn) {
  try {
    fn();
    console.log(`PASS: ${name}`);
  } catch (error) {
    console.error(`FAIL: ${name}`);
    throw error;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`PASS: ${name}`);
  } catch (error) {
    console.error(`FAIL: ${name}`);
    throw error;
  }
}

// —— Recent launches: bounded, deduped, sanitized ——

test('recordRecentLaunchEntry dedupes by launchType+path and bumps count', () => {
  let list = recordRecentLaunchEntry([], { path: 'C:/Games/game.exe', launchType: 'exe' });
  list = recordRecentLaunchEntry(list, { path: 'C:/Games/GAME.exe', launchType: 'exe' });
  assert.equal(list.length, 1);
  assert.equal(list[0].count, 2);
});

test('recordRecentLaunchEntry stays bounded at MAX_RECENT_LAUNCHES', () => {
  let list = [];
  for (let i = 0; i < MAX_RECENT_LAUNCHES + 5; i += 1) {
    list = recordRecentLaunchEntry(list, { path: `C:/apps/app-${i}.exe` });
  }
  assert.equal(list.length, MAX_RECENT_LAUNCHES);
  // Newest entry first.
  assert.equal(list[0].path, `C:/apps/app-${MAX_RECENT_LAUNCHES + 4}.exe`);
});

test('normalizeRecentLaunchEntry rejects empty paths and oversized icons', () => {
  assert.equal(normalizeRecentLaunchEntry({ path: '   ' }), null);
  assert.equal(normalizeRecentLaunchEntry(null), null);
  const entry = normalizeRecentLaunchEntry({ path: 'C:/a.exe', icon: 'x'.repeat(5000) });
  assert.equal(entry.icon, null);
});

test('sanitizeRecentLaunches drops malformed rows and enforces bound', () => {
  const dirty = [null, 'nope', { path: '' }, { path: 'C:/ok.exe' }, ...Array.from({ length: 20 }, (_, i) => ({ path: `p${i}` }))];
  const clean = sanitizeRecentLaunches(dirty);
  assert.ok(clean.length <= MAX_RECENT_LAUNCHES);
  assert.ok(clean.every((e) => typeof e.path === 'string' && e.path));
  assert.deepEqual(sanitizeRecentLaunches('garbage'), []);
});

test('deriveLaunchLabel uses file stem for apps and hostname for URLs', () => {
  assert.equal(deriveLaunchLabel('C:/Games/Cool Game.exe', 'exe'), 'Cool Game');
  assert.equal(deriveLaunchLabel('https://www.example.com/watch', 'url'), 'example.com');
});

// —— Idle experience: mode normalization + legacy migration ——

test('normalizeIdleExperienceSettings migrates legacy split toggles', () => {
  assert.equal(normalizeIdleExperienceSettings({}).mode, 'off');
  assert.equal(normalizeIdleExperienceSettings({ autoFadeTimeout: 10 }).mode, 'subtle');
  assert.equal(normalizeIdleExperienceSettings({ idleAnimationEnabled: true }).mode, 'subtle');
});

test('normalizeIdleExperienceSettings clamps delays and honors canonical mode', () => {
  const idle = normalizeIdleExperienceSettings({
    idleExperienceMode: 'attract',
    autoFadeTimeout: 9999,
    idleAttractDelaySec: 1,
  });
  assert.equal(idle.mode, 'attract');
  assert.equal(idle.idleDelaySec, 60);
  assert.equal(idle.attractDelaySec, 30);
  assert.ok(IDLE_EXPERIENCE_MODES.includes(idle.mode));
});

test('matchIdlePersonality round-trips every pack', () => {
  Object.entries(IDLE_PERSONALITY_PACKS).forEach(([packId, types]) => {
    assert.equal(matchIdlePersonality([...types]), packId);
  });
  assert.equal(matchIdlePersonality(['orbit']), '');
});

// —— Now Playing takeover: Off preference always wins ——

test('takeover selectors gate on the Off preference', () => {
  const base = { spotify: { nowPlayingExperience: 'off' }, ui: { spotifyTakeoverActive: 'manual' } };
  assert.equal(selectSpotifyTakeoverActive(base), false);
  assert.equal(selectSpotifyImmersiveActive(base), false);

  const on = { spotify: { nowPlayingExperience: 'onDemand' }, ui: { spotifyTakeoverActive: 'manual' } };
  assert.equal(selectSpotifyTakeoverActive(on), true);

  const immersiveOnly = {
    spotify: { nowPlayingExperience: 'off', immersiveMode: { enabled: true } },
    ui: { spotifyTakeoverActive: false },
  };
  assert.equal(selectSpotifyImmersiveActive(immersiveOnly), true);
});

test('normalizeNowPlayingExperience defaults unknown values to onDemand', () => {
  assert.equal(normalizeNowPlayingExperience('autoIdle'), 'autoIdle');
  assert.equal(normalizeNowPlayingExperience('bogus'), 'onDemand');
  assert.equal(normalizeNowPlayingExperience(undefined), 'onDemand');
});

// —— Launch feedback modes ——

test('normalizeLaunchFeedbackMode falls back to the subtle default', () => {
  LAUNCH_FEEDBACK_MODES.forEach((mode) => assert.equal(normalizeLaunchFeedbackMode(mode), mode));
  assert.equal(normalizeLaunchFeedbackMode('wild'), DEFAULT_LAUNCH_FEEDBACK_MODE);
  assert.equal(DEFAULT_LAUNCH_FEEDBACK_MODE, 'subtle');
});

// —— .wee-preset files: versioned, visual-only round trip ——

test('preset file payload round-trips through parse as visual-only', () => {
  const payload = buildPresetFilePayload({
    id: 'p1',
    name: 'Sunset look',
    data: {
      wallpaper: { url: 'https://cdn.example.com/w.jpg' },
      channels: { dataBySpace: { home: { slots: [{ kind: 'channel' }] } } },
    },
  });
  assert.equal(payload.formatVersion, WEE_PRESET_FILE_VERSION);

  const parsed = parsePresetFile(JSON.stringify(payload));
  assert.equal(parsed.ok, true);
  assert.equal(parsed.preset.name, 'Sunset look');
  // Home channel data never survives the file path, even if a file claims it.
  assert.ok(!('channels' in parsed.preset.data));
});

test('parsePresetFile rejects wrong formats and future versions', () => {
  assert.equal(parsePresetFile('not json').ok, false);
  assert.equal(parsePresetFile(JSON.stringify({ format: 'other' })).ok, false);
  const future = parsePresetFile(
    JSON.stringify({ format: 'wee-preset', formatVersion: WEE_PRESET_FILE_VERSION + 1, preset: { data: {} } })
  );
  assert.equal(future.ok, false);
  assert.match(future.error, /newer version/);
});

// —— Caching: bounded memos, persistence pruning, registry clear-all ——

// The palette/tint memos load images lazily; a never-loading Image stub keeps the
// promises pending, which is all these bound/identity tests need.
globalThis.Image = class FakeImage {};

test('album-art palette memo is bounded and shares in-flight promises', () => {
  clearAlbumArtPaletteCache();
  const first = extractColorsFromAlbumArt('https://img.example/0.jpg');
  const again = extractColorsFromAlbumArt('https://img.example/0.jpg');
  assert.equal(first, again, 'same URL must reuse the cached promise');

  for (let i = 0; i < 30; i += 1) {
    extractColorsFromAlbumArt(`https://img.example/${i}.jpg`);
  }
  assert.ok(getAlbumArtPaletteCacheSize() <= 12, 'memo must stay bounded');

  clearAlbumArtPaletteCache();
  assert.equal(getAlbumArtPaletteCacheSize(), 0);
});

test('icon tint memo is bounded and keyed by url + color', () => {
  clearTintedIconCache();
  const a = getTintedIconUrl('https://icons.example/a.png', '#ff0000');
  const sameKey = getTintedIconUrl('https://icons.example/a.png', [255, 0, 0]);
  const otherColor = getTintedIconUrl('https://icons.example/a.png', '#00ff00');
  assert.equal(a, sameKey, 'hex and rgb array of the same color share one entry');
  assert.notEqual(a, otherColor, 'different colors are separate entries');

  for (let i = 0; i < 80; i += 1) {
    getTintedIconUrl(`https://icons.example/${i}.png`, '#0099ff');
  }
  assert.ok(getTintedIconCacheSize() <= 48, 'memo must stay bounded');

  clearTintedIconCache();
  assert.equal(getTintedIconCacheSize(), 0);
});

test('pruneKeyedCacheForPersistence bounds maps and drops in-flight entries', () => {
  const big = {};
  for (let i = 0; i < MEDIA_HUB_PERSISTED_CACHE_MAX_ENTRIES + 20; i += 1) {
    big[`id-${i}`] = { fetchedAt: 1000 + i, videos: [] };
  }
  const pruned = pruneKeyedCacheForPersistence(big);
  const keys = Object.keys(pruned);
  assert.equal(keys.length, MEDIA_HUB_PERSISTED_CACHE_MAX_ENTRIES);
  // Newest fetchedAt entries survive.
  assert.ok(!('id-0' in pruned));
  assert.ok(`id-${MEDIA_HUB_PERSISTED_CACHE_MAX_ENTRIES + 19}` in pruned);

  const mixed = {
    inflight: { loading: true },
    done: { loading: false, videos: [{}] },
    junk: 'not-an-object',
  };
  const cleaned = pruneKeyedCacheForPersistence(mixed);
  assert.deepEqual(Object.keys(cleaned), ['done']);

  assert.deepEqual(pruneKeyedCacheForPersistence(null), {});
  assert.deepEqual(pruneKeyedCacheForPersistence('garbage'), {});
});

await testAsync('cache registry clear-all clears every registered domain', async () => {
  const cleared = [];
  const disposeA = registerCacheDomain({
    id: 'test-a',
    label: 'Test A',
    description: 'refresh + clear',
    scope: 'session',
    getLastRefreshedAt: () => 12345,
    refresh: () => cleared.push('a:refresh'),
    clear: () => cleared.push('a:clear'),
  });
  const disposeB = registerCacheDomain({
    id: 'test-b',
    label: 'Test B',
    description: 'clear only',
    scope: 'session',
    clear: () => cleared.push('b:clear'),
  });

  try {
    assert.ok(listCacheDomains().some((d) => d.id === 'test-a'));

    // refresh prefers domain.refresh, falls back to clear.
    assert.equal((await refreshCacheDomain('test-a')).ok, true);
    assert.equal((await refreshCacheDomain('test-b')).ok, true);
    assert.deepEqual(cleared, ['a:refresh', 'b:clear']);

    // Domain-provided stamp wins over the registry stamp.
    assert.equal(getCacheDomainLastRefreshedAt('test-a'), 12345);
    assert.ok(getCacheDomainLastRefreshedAt('test-b') > 0);

    cleared.length = 0;
    const result = await clearAllCacheDomains();
    assert.equal(result.ok, true);
    assert.ok(cleared.includes('a:clear'));
    assert.ok(cleared.includes('b:clear'));

    assert.equal((await refreshCacheDomain('nope')).ok, false);
  } finally {
    disposeA();
    disposeB();
  }
  assert.ok(!listCacheDomains().some((d) => d.id === 'test-a'));
});

console.log('Experience roadmap invariant suite complete.');
