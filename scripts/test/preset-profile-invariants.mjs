import assert from 'node:assert/strict';
import { sanitizePresetSettingsForCommunity } from '../../src/utils/presetSharing.js';
import {
  PRESET_SCOPE_VISUAL,
  PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS,
} from '../../src/utils/presets/presetScopes.js';
import {
  normalizePresetRecord,
  sanitizePresetCollection,
  toVisualOnlyPreset,
} from '../../src/utils/presets/presetThemeData.js';
import {
  createSeededWorkspaceState,
  normalizeWorkspacesState,
} from '../../src/utils/workspaces/workspaceState.js';

function test(name, fn) {
  try {
    fn();
    console.log(`PASS: ${name}`);
  } catch (error) {
    console.error(`FAIL: ${name}`);
    throw error;
  }
}

test('normalizePresetRecord enforces visual scope without home channels', () => {
  const normalized = normalizePresetRecord({
    name: 'Legacy visual preset',
    captureScope: PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS,
    data: {
      wallpaper: { url: 'https://cdn.example.com/w.jpg' },
      sounds: { backgroundMusicEnabled: true },
      channels: { dataBySpace: { home: { configuredChannels: { 1: { id: 'app-a' } } } } },
    },
  });

  assert.equal(typeof normalized.id, 'string');
  assert.equal(normalized.captureScope, PRESET_SCOPE_VISUAL);
  assert.equal(normalized.includesHomeChannels, false);
  assert.equal(normalized.shareable, true);
  assert.ok(!('sounds' in normalized.data));
  assert.ok(!('channels' in normalized.data));
  assert.ok(!('homeChannels' in normalized.data));
});

test('normalizePresetRecord retains explicit home channels for profile-scoped presets', () => {
  const normalized = normalizePresetRecord({
    name: 'Profile preset',
    captureScope: PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS,
    data: {
      ribbon: { ribbonGlowStrength: 18 },
      homeChannels: {
        configuredChannels: { 2: { appId: 'steam' } },
      },
      soundLibrary: { foo: 'bar' },
    },
  });

  assert.equal(normalized.captureScope, PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS);
  assert.equal(normalized.includesHomeChannels, true);
  assert.equal(normalized.shareable, false);
  assert.deepEqual(normalized.data.homeChannels, {
    configuredChannels: { 2: { appId: 'steam' } },
  });
  assert.ok(!('soundLibrary' in normalized.data));
});

test('toVisualOnlyPreset strips home channels and marks shareable', () => {
  const visualPreset = toVisualOnlyPreset({
    id: 'preset-123',
    name: 'Visualized',
    data: {
      wallpaper: { url: 'https://cdn.example.com/w2.jpg' },
      homeChannels: { configuredChannels: { 1: { appId: 'x' } } },
    },
  });

  assert.equal(visualPreset.id, 'preset-123');
  assert.equal(visualPreset.captureScope, PRESET_SCOPE_VISUAL);
  assert.equal(visualPreset.includesHomeChannels, false);
  assert.equal(visualPreset.shareable, true);
  assert.ok(!('homeChannels' in visualPreset.data));
});

test('sanitizePresetCollection backfills missing ids', () => {
  const result = sanitizePresetCollection([
    { name: 'A', data: { wallpaper: { url: 'x' } } },
    { id: 'preset-b', name: 'B', data: { ribbon: { ribbonGlowStrength: 12 } } },
  ]);

  assert.equal(result.presets.length, 2);
  assert.equal(typeof result.presets[0].id, 'string');
  assert.equal(result.presets[1].id, 'preset-b');
});

test('community sanitize keeps visual allowlist and strips private data', () => {
  const sanitized = sanitizePresetSettingsForCommunity({
    wallpaper: {
      url: 'userdata://local-file',
      savedWallpapers: [
        { url: 'https://cdn.example.com/a.jpg' },
        { url: 'userdata://local-only' },
      ],
      likedWallpapers: [{ url: 'https://cdn.example.com/b.jpg' }],
    },
    ribbon: { ribbonGlowStrength: 20 },
    ui: { isDarkMode: true },
    time: { enablePill: true },
    overlay: { enabled: true },
    capturedSpotifyPalette: { accent: '#fff' },
    channels: { dataBySpace: { home: {} } },
    sounds: { backgroundMusicEnabled: true },
    extraPrivateSlice: { foo: 'bar' },
  });

  assert.ok('wallpaper' in sanitized);
  assert.ok('ribbon' in sanitized);
  assert.ok('ui' in sanitized);
  assert.ok(!('channels' in sanitized));
  assert.ok(!('sounds' in sanitized));
  assert.ok(!('extraPrivateSlice' in sanitized));
  assert.equal(sanitized.wallpaper.url, undefined);
  assert.deepEqual(sanitized.wallpaper.savedWallpapers, [{ url: 'https://cdn.example.com/a.jpg' }]);
});

test('workspace state seeding and normalization keep default profiles', () => {
  const seeded = createSeededWorkspaceState();
  assert.equal(seeded.items.length, 3);
  assert.equal(seeded.items[0].name, 'Home Space');
  assert.equal(seeded.activeWorkspaceId, seeded.items[0].id);

  const normalized = normalizeWorkspacesState({ items: [], activeWorkspaceId: null });
  assert.equal(normalized.items.length, 3);
  assert.equal(normalized.items[0].name, 'Home Space');
  assert.equal(normalized.activeWorkspaceId, normalized.items[0].id);
});

console.log('Invariant suite complete.');
