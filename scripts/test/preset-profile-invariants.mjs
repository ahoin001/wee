import assert from 'node:assert/strict';
import {
  sanitizePresetSettingsForCommunity,
  getPresetWallpaperUrl,
  normalizeWallpaperCurrentShape,
} from '../../src/utils/presetSharing.js';
import {
  PRESET_SCOPE_VISUAL,
  PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS,
} from '../../src/utils/presets/presetScopes.js';
import {
  normalizePresetRecord,
  sanitizePresetCollection,
  toVisualOnlyPreset,
} from '../../src/utils/presets/presetThemeData.js';

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
      focusChannels: { configuredChannels: { 2: { appId: 'y' } } },
    },
  });

  assert.equal(visualPreset.id, 'preset-123');
  assert.equal(visualPreset.captureScope, PRESET_SCOPE_VISUAL);
  assert.equal(visualPreset.includesHomeChannels, false);
  assert.equal(visualPreset.shareable, true);
  assert.ok(!('homeChannels' in visualPreset.data));
  assert.ok(!('focusChannels' in visualPreset.data));
});

test('normalizePresetRecord retains focus board and punched slots', () => {
  const punchedHome = {
    slots: [
      { kind: 'channel', channel: null, hidden: true, colSpan: 1, rowSpan: 1 },
      { kind: 'channel', channel: { appId: 'steam' }, hidden: false, colSpan: 1, rowSpan: 1 },
    ],
    configuredChannels: { 1: { appId: 'steam' } },
    slotMeta: { 0: { hidden: true } },
  };
  const focusBoard = {
    slots: [{ kind: 'channel', channel: null, hidden: true, colSpan: 1, rowSpan: 1 }],
    slotMeta: { 0: { hidden: true } },
  };
  const normalized = normalizePresetRecord({
    name: 'Punched mood',
    captureScope: PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS,
    data: {
      ui: { wallpaperMatchEnabled: true },
      homeChannels: punchedHome,
      focusChannels: focusBoard,
    },
  });

  assert.equal(normalized.captureScope, PRESET_SCOPE_VISUAL_WITH_HOME_CHANNELS);
  assert.equal(normalized.data.homeChannels.slots[0].hidden, true);
  assert.equal(normalized.data.focusChannels.slots[0].hidden, true);
  assert.equal(normalized.data.ui.wallpaperMatchEnabled, true);
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
  assert.equal(sanitized.wallpaper.savedWallpapers, undefined);
});

test('community sanitize promotes current.url and public wallpaper URL', () => {
  const sanitized = sanitizePresetSettingsForCommunity(
    {
      wallpaper: {
        current: { url: 'userdata://icons/bg.jpg', name: 'bg.jpg' },
        opacity: 0.9,
        blur: 2,
      },
      ribbon: { ribbonColor: '#112233' },
      time: { color: '#ffffff' },
      dock: { classicThemeId: 'wii-blue' },
      appearanceBySpace: {
        home: { blur: 4 },
        workspaces: { blur: 9 },
      },
    },
    {
      wallpaperPublicUrl: 'https://cdn.example.com/shared-bg.jpg',
      sourceWallpaperUrl: 'userdata://icons/bg.jpg',
    }
  );

  assert.equal(sanitized.wallpaper.current.url, 'https://cdn.example.com/shared-bg.jpg');
  assert.equal(sanitized.wallpaper.url, 'https://cdn.example.com/shared-bg.jpg');
  assert.equal(sanitized.wallpaper.source, 'community');
  assert.equal(sanitized.ribbon.ribbonColor, '#112233');
  assert.equal(sanitized.time.color, '#ffffff');
  assert.equal(sanitized.dock.classicThemeId, 'wii-blue');
  assert.deepEqual(sanitized.appearanceBySpace, {
    home: { blur: 4 },
    workspaces: { blur: 9 },
  });
});

test('community sanitize remaps visible page wallpaper and drops private siblings', () => {
  const sanitized = sanitizePresetSettingsForCommunity(
    {
      wallpaper: { current: { url: 'userdata://global.jpg' } },
      appearanceBySpace: {
        home: {
          wallpaper: {
            wallpaperScope: 'perPage',
            wallpaperByPage: {
              0: 'userdata://visible.jpg',
              1: 'userdata://private.jpg',
              2: 'https://cdn.example.com/public.jpg',
            },
          },
        },
        workspaces: {
          wallpaper: {
            useGlobalWallpaper: false,
            spaceWallpaperUrl: 'userdata://focus.jpg',
          },
        },
      },
    },
    {
      wallpaperPublicUrl: 'https://cdn.example.com/shared-visible.jpg',
      sourceWallpaperUrl: 'userdata://visible.jpg',
    }
  );

  assert.deepEqual(sanitized.appearanceBySpace.home.wallpaper.wallpaperByPage, {
    0: 'https://cdn.example.com/shared-visible.jpg',
    2: 'https://cdn.example.com/public.jpg',
  });
  assert.equal(sanitized.appearanceBySpace.home.wallpaper.wallpaperScope, 'perPage');
  assert.equal(sanitized.appearanceBySpace.workspaces.wallpaper.spaceWallpaperUrl, null);
  assert.equal(sanitized.appearanceBySpace.workspaces.wallpaper.useGlobalWallpaper, true);
});

test('getPresetWallpaperUrl prefers current.url', () => {
  assert.equal(
    getPresetWallpaperUrl({
      current: { url: 'userdata://a' },
      url: 'https://cdn.example.com/legacy.jpg',
    }),
    'userdata://a'
  );
  assert.equal(getPresetWallpaperUrl({ url: 'https://cdn.example.com/legacy.jpg' }), 'https://cdn.example.com/legacy.jpg');
  const normalized = normalizeWallpaperCurrentShape({ url: 'https://cdn.example.com/only.jpg', opacity: 1 });
  assert.equal(normalized.current.url, 'https://cdn.example.com/only.jpg');
  assert.equal(normalized.url, 'https://cdn.example.com/only.jpg');
});

console.log('Invariant suite complete.');
