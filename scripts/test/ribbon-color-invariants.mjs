/**
 * Ribbon / accent color precedence invariants.
 * Precedence: Spotify Match → explicit per-page → Wallpaper match → manual.
 * Run with: npm run test:ribbon-color
 */

import assert from 'node:assert/strict';
import {
  hasExplicitPageRibbonLook,
  resolveLiveMatchRibbonOverlay,
  resolveRibbonPaintTarget,
  spotifyColorsToRibbonLook,
} from '../../src/utils/appearance/resolveEffectiveRibbonLook.js';
import { resolveEffectiveAccent } from '../../src/utils/theme/resolveEffectiveAccent.js';

function test(name, fn) {
  try {
    fn();
    console.log(`PASS: ${name}`);
  } catch (error) {
    console.error(`FAIL: ${name}`);
    throw error;
  }
}

const MANUAL = {
  ribbonColor: '#e0e6ef',
  ribbonGlowColor: '#0099ff',
};

const SPOTIFY = {
  primary: 'rgb(10, 20, 30)',
  accent: 'rgb(200, 40, 80)',
  secondary: 'rgb(5, 10, 15)',
};

const WALLPAPER_PALETTE = {
  primary: '#112233',
  accent: '#445566',
  secondary: '#778899',
  surfaceHint: '#aabbcc',
};

test('spotifyColorsToRibbonLook maps primary fill + accent glow to hex', () => {
  const look = spotifyColorsToRibbonLook(SPOTIFY);
  assert.equal(look.ribbonColor, '#0a141e');
  assert.equal(look.ribbonGlowColor, '#c82850');
});

test('paint: Spotify Match beats wallpaper and manual', () => {
  const { look, source } = resolveRibbonPaintTarget({
    liveRibbon: MANUAL,
    wallpaperMatchEnabled: true,
    wallpaperUrl: 'file:///wall.jpg',
    ambientPalette: WALLPAPER_PALETTE,
    ambientCachedForUrl: 'file:///wall.jpg',
    spotifyMatchEnabled: true,
    spotifyColors: SPOTIFY,
  });
  assert.equal(source, 'spotify');
  assert.equal(look.ribbonColor, '#0a141e');
  assert.equal(look.ribbonGlowColor, '#c82850');
});

test('paint: Spotify Match beats explicit per-page look', () => {
  const { look, source } = resolveRibbonPaintTarget({
    liveRibbon: {
      ...MANUAL,
      ribbonScope: 'perPage',
      ribbonByPage: {
        0: { ribbonColor: '#111111', ribbonGlowColor: '#222222' },
      },
    },
    spaceRibbon: {
      ribbonScope: 'perPage',
      ribbonByPage: {
        0: { ribbonColor: '#111111', ribbonGlowColor: '#222222' },
      },
    },
    currentPage: 0,
    supportsPerPage: true,
    spotifyMatchEnabled: true,
    spotifyColors: SPOTIFY,
  });
  assert.equal(source, 'spotify');
  assert.equal(look.ribbonColor, '#0a141e');
});

test('paint: wallpaper match beats explicit per-page when match is on', () => {
  const { look, source } = resolveRibbonPaintTarget({
    liveRibbon: MANUAL,
    spaceRibbon: {
      ribbonScope: 'perPage',
      ribbonByPage: {
        1: { ribbonColor: '#abcdef', ribbonGlowColor: '#fedcba' },
      },
    },
    currentPage: 1,
    supportsPerPage: true,
    wallpaperMatchEnabled: true,
    wallpaperUrl: 'file:///wall.jpg',
    ambientPalette: WALLPAPER_PALETTE,
    ambientCachedForUrl: 'file:///wall.jpg',
    spotifyMatchEnabled: false,
  });
  assert.equal(source, 'wallpaper');
  assert.equal(look.ribbonColor, '#aabbcc');
});

test('paint: explicit per-page wins when wallpaper match is off', () => {
  const { look, source } = resolveRibbonPaintTarget({
    liveRibbon: MANUAL,
    spaceRibbon: {
      ribbonScope: 'perPage',
      ribbonByPage: {
        1: { ribbonColor: '#abcdef', ribbonGlowColor: '#fedcba' },
      },
    },
    currentPage: 1,
    supportsPerPage: true,
    wallpaperMatchEnabled: false,
    spotifyMatchEnabled: false,
  });
  assert.equal(source, 'page');
  assert.equal(look.ribbonColor, '#abcdef');
  assert.equal(look.ribbonGlowColor, '#fedcba');
});

test('paint: wallpaper store palette overlays manual when match on', () => {
  const { look, source } = resolveRibbonPaintTarget({
    liveRibbon: MANUAL,
    wallpaperMatchEnabled: true,
    wallpaperUrl: 'file:///wall.jpg',
    ambientPalette: WALLPAPER_PALETTE,
    ambientCachedForUrl: 'file:///wall.jpg',
    spotifyMatchEnabled: false,
  });
  assert.equal(source, 'wallpaper');
  assert.equal(look.ribbonColor, '#aabbcc');
  assert.equal(look.ribbonGlowColor, '#445566');
});

test('paint: manual when no live match', () => {
  const { look, source } = resolveRibbonPaintTarget({
    liveRibbon: MANUAL,
    wallpaperMatchEnabled: false,
    spotifyMatchEnabled: false,
  });
  assert.equal(source, 'manual');
  assert.equal(look.ribbonColor, MANUAL.ribbonColor);
  assert.equal(look.ribbonGlowColor, MANUAL.ribbonGlowColor);
});

test('accent: Spotify does not require dynamicRibbonColorEnabled', () => {
  const { hex, source } = resolveEffectiveAccent({
    spotifyMatchEnabled: true,
    spotifyColors: SPOTIFY,
    wallpaperMatchEnabled: true,
    ambientPalette: WALLPAPER_PALETTE,
    dynamicRibbonColorEnabled: false,
    ribbonGlowColor: '#0099ff',
  });
  assert.equal(source, 'spotify');
  assert.equal(hex, '#c82850');
});

test('accent: wallpaper does not require dynamicRibbonColorEnabled', () => {
  const { hex, source } = resolveEffectiveAccent({
    spotifyMatchEnabled: false,
    wallpaperMatchEnabled: true,
    ambientPalette: WALLPAPER_PALETTE,
    dynamicRibbonColorEnabled: false,
    ribbonGlowColor: '#0099ff',
  });
  assert.equal(source, 'wallpaper');
  assert.equal(hex, '#112233');
});

test('accent: manual glow only when dynamic chrome on', () => {
  const off = resolveEffectiveAccent({
    dynamicRibbonColorEnabled: false,
    ribbonGlowColor: '#ff00aa',
  });
  assert.equal(off.source, 'default');

  const on = resolveEffectiveAccent({
    dynamicRibbonColorEnabled: true,
    ribbonGlowColor: '#ff00aa',
  });
  assert.equal(on.source, 'manual');
  assert.equal(on.hex, '#ff00aa');
});

test('hasExplicitPageRibbonLook detects scoped page entries', () => {
  assert.equal(
    hasExplicitPageRibbonLook({
      spaceRibbon: {
        ribbonScope: 'perPage',
        ribbonByPage: { 0: { ribbonColor: '#123456' } },
      },
      currentPage: 0,
      supportsPerPage: true,
    }),
    true
  );
  assert.equal(
    hasExplicitPageRibbonLook({
      spaceRibbon: { ribbonScope: 'space' },
      currentPage: 0,
      supportsPerPage: true,
    }),
    false
  );
});

test('live match overlay for Save/Lock capture prefers Spotify', () => {
  const overlay = resolveLiveMatchRibbonOverlay({
    spotifyMatchEnabled: true,
    spotifyColors: SPOTIFY,
    wallpaperMatchEnabled: true,
    wallpaperUrl: 'file:///wall.jpg',
    ambientPalette: WALLPAPER_PALETTE,
    ambientCachedForUrl: 'file:///wall.jpg',
  });
  assert.equal(overlay.ribbonGlowColor, '#c82850');
});

console.log('\nAll ribbon-color invariants passed.');
