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

function test(name, fn) {
  try {
    fn();
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

console.log('Experience roadmap invariant suite complete.');
