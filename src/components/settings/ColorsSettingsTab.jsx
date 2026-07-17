import React, { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { m, useReducedMotion } from 'framer-motion';
import WToggle from '../../ui/WToggle';
import Text from '../../ui/Text';
import SettingsWeeSection from './SettingsWeeSection';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import RibbonLivePreview from './dock/RibbonLivePreview';
import { WeeHelpLinkButton, WeeModalFieldCard, WeeRevealWhen, WeeSectionEyebrow } from '../../ui/wee';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { saveUnifiedSettingsSnapshot } from '../../utils/electronApi';
import { openSettingsToTab, SETTINGS_TAB_ID } from '../../utils/settingsNavigation';
import { DEFAULT_RIBBON_GLOW_HEX, DEFAULT_RIBBON_SURFACE_HEX } from '../../design/runtimeColorStrings.js';
import { createWeeTransition } from '../../design/weeMotion';
import { DEFAULT_AMBIENT_COLOR } from '../../utils/theme/extractImagePalette';
import { resolveEffectiveAccent } from '../../utils/theme/resolveEffectiveAccent';
import { syncActiveSpaceAppearanceCapture } from '../../utils/appearance/spaceAppearance';
import './settings-wee-panels.css';

const QUICK_LINKS = [
  { id: SETTINGS_TAB_ID.DOCK, label: 'Dock colors', detail: 'Ribbon surface + glow controls' },
  { id: SETTINGS_TAB_ID.TIME, label: 'Time colors', detail: 'Clock text and pill styling' },
  { id: SETTINGS_TAB_ID.WALLPAPER, label: 'Wallpaper tones', detail: 'Blur, brightness, and saturation per space' },
  { id: SETTINGS_TAB_ID.PRESETS, label: 'Looks', detail: 'Save and apply complete visual setups' },
];

const ColorsSettingsTab = React.memo(() => {
  const reduceMotion = useReducedMotion();
  const press = useMemo(
    () => createWeeTransition('press', { reducedMotion: reduceMotion }),
    [reduceMotion]
  );

  const { ribbon, ui, time, spotifyColors } = useConsolidatedAppStore(
    useShallow((state) => ({
      ribbon: state.ribbon,
      ui: state.ui,
      time: state.time,
      spotifyColors: state.spotify?.extractedColors ?? null,
    }))
  );
  const { setRibbonState, setUIState } = useConsolidatedAppStore(
    useShallow((state) => ({
      setRibbonState: state.actions.setRibbonState,
      setUIState: state.actions.setUIState,
    }))
  );

  const wallpaperMatchEnabled = ui?.wallpaperMatchEnabled !== false;
  const ambient = ui?.ambientColor || DEFAULT_AMBIENT_COLOR;
  const seeds = Array.isArray(ambient.seeds) ? ambient.seeds : [];
  const palette = ambient.palette;

  const effective = useMemo(
    () =>
      resolveEffectiveAccent({
        wallpaperMatchEnabled,
        ambientPalette: palette,
        spotifyMatchEnabled: ui?.spotifyMatchEnabled ?? false,
        spotifyColors,
        dynamicRibbonColorEnabled: ribbon?.dynamicRibbonColorEnabled ?? false,
        ribbonGlowColor: ribbon?.ribbonGlowColor,
      }),
    [
      wallpaperMatchEnabled,
      palette,
      ui?.spotifyMatchEnabled,
      spotifyColors,
      ribbon?.dynamicRibbonColorEnabled,
      ribbon?.ribbonGlowColor,
    ]
  );

  const handleDynamicRibbonColorChange = useCallback(
    async (enabled) => {
      setRibbonState({ dynamicRibbonColorEnabled: enabled });
      await saveUnifiedSettingsSnapshot({
        ribbon: {
          dynamicRibbonColorEnabled: enabled,
        },
      });
    },
    [setRibbonState]
  );

  const handleWallpaperMatchChange = useCallback(
    async (enabled) => {
      setUIState({
        wallpaperMatchEnabled: enabled,
        ambientColor: enabled
          ? {
              ...ambient,
              cachedForUrl: null,
              source: enabled ? 'wallpaper' : 'manual',
            }
          : { ...DEFAULT_AMBIENT_COLOR },
      });
      await saveUnifiedSettingsSnapshot({
        ui: {
          wallpaperMatchEnabled: enabled,
        },
      });
    },
    [ambient, setUIState]
  );

  const handleLockLook = useCallback(async () => {
    const primary = palette?.primary || ambient.seedHex || effective.hex;
    const surface = palette?.surfaceHint || ribbon?.ribbonColor || DEFAULT_RIBBON_SURFACE_HEX;
    const glow = palette?.accent || primary || DEFAULT_RIBBON_GLOW_HEX;

    setRibbonState({
      ribbonColor: surface,
      ribbonGlowColor: glow,
      dynamicRibbonColorEnabled: true,
    });
    setUIState({
      wallpaperMatchEnabled: false,
      spotifyMatchEnabled: false,
      ambientColor: { ...DEFAULT_AMBIENT_COLOR },
    });

    const synced = syncActiveSpaceAppearanceCapture({
      getState: () => useConsolidatedAppStore.getState(),
      setAppearanceBySpaceState: useConsolidatedAppStore.getState().actions.setAppearanceBySpaceState,
    });

    await saveUnifiedSettingsSnapshot({
      ui: { wallpaperMatchEnabled: false, spotifyMatchEnabled: false },
      ribbon: {
        ribbonColor: surface,
        ribbonGlowColor: glow,
        dynamicRibbonColorEnabled: true,
      },
      ...(synced ? { appearanceBySpace: { [synced.spaceId]: synced.appearance } } : {}),
    });
  }, [
    ambient.seedHex,
    effective.hex,
    palette,
    ribbon?.ribbonColor,
    setRibbonState,
    setUIState,
  ]);

  const handlePickSeed = useCallback(
    (hex) => {
      if (!hex || !wallpaperMatchEnabled) return;
      const nextPalette = {
        ...(palette || {}),
        primary: hex,
        accent: hex,
        secondary: palette?.secondary || hex,
        surfaceHint: palette?.surfaceHint || hex,
      };
      setUIState({
        ambientColor: {
          ...ambient,
          seedHex: hex,
          palette: nextPalette,
          source: 'wallpaper',
        },
      });
    },
    [ambient, palette, setUIState, wallpaperMatchEnabled]
  );

  const sourceLabel =
    effective.source === 'spotify'
      ? 'Spotify Match'
      : effective.source === 'wallpaper'
        ? 'Wallpaper'
        : effective.source === 'manual'
          ? 'Ribbon glow'
          : 'Default blue';

  return (
    <div className="settings-wee-tab-root pb-12 [contain:layout]">
      <SettingsTabPageHeader
        title="Colors"
        subtitle="Match wallpaper (default on), follow Now Playing, or pick ribbon accents — Quick menu for everyday toggles"
      />

      <div className="mb-6">
        <RibbonLivePreview sticky compact />
      </div>

      <SettingsWeeSection eyebrow="Match wallpaper">
        <WeeModalFieldCard hoverAccent="primary" paddingClassName="p-5 md:p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Text variant="h3" className="mb-1 playful-hero-text">
                Match wallpaper
              </Text>
              <Text variant="desc" className="!m-0">
                Live accents from the wallpaper on screen. On by default — also in the Quick menu.
                Now Playing Color Match still wins while it&apos;s on.
              </Text>
            </div>
            <WToggle
              checked={wallpaperMatchEnabled}
              onChange={handleWallpaperMatchChange}
              disableLabelClick
              title="Toggle match wallpaper colors"
            />
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span
              className="h-10 w-10 rounded-full border-2 border-[hsl(var(--border-primary)/0.45)] shadow-[var(--shadow-sm)]"
              style={{ backgroundColor: effective.hex }}
              aria-hidden
            />
            <div className="min-w-0">
              <WeeSectionEyebrow className="block" trackingClassName="tracking-[0.14em]">
                Effective accent
              </WeeSectionEyebrow>
              <Text variant="body" className="!m-0 font-mono text-[12px]">
                {effective.hex.toUpperCase()} · {sourceLabel}
              </Text>
            </div>
          </div>

          <WeeRevealWhen when={wallpaperMatchEnabled && seeds.length > 0}>
            <div className="mb-4">
              <WeeSectionEyebrow className="mb-2 block" trackingClassName="tracking-[0.14em]">
                Seed swatches
              </WeeSectionEyebrow>
              <div className="flex flex-wrap gap-2" role="list" aria-label="Wallpaper seed colors">
                {[ambient.seedHex || palette?.primary, ...seeds]
                  .filter(Boolean)
                  .filter((hex, i, arr) => arr.indexOf(hex) === i)
                  .slice(0, 6)
                  .map((hex) => {
                    const selected = (palette?.primary || ambient.seedHex) === hex;
                    return (
                      <m.button
                        key={hex}
                        type="button"
                        role="listitem"
                        aria-pressed={selected}
                        title={hex}
                        onClick={() => handlePickSeed(hex)}
                        whileHover={reduceMotion ? undefined : { scale: 1.08 }}
                        whileTap={reduceMotion ? undefined : { scale: 0.92 }}
                        transition={press}
                        className={`h-9 w-9 rounded-full border-2 ${
                          selected
                            ? 'border-[hsl(var(--text-primary))] ring-2 ring-[hsl(var(--primary)/0.45)]'
                            : 'border-[hsl(var(--border-primary)/0.4)]'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    );
                  })}
              </div>
            </div>
          </WeeRevealWhen>

          <div className="flex flex-wrap items-center gap-3">
            <m.button
              type="button"
              disabled={!wallpaperMatchEnabled || !palette}
              onClick={handleLockLook}
              whileHover={reduceMotion || !wallpaperMatchEnabled ? undefined : { scale: 1.03 }}
              whileTap={reduceMotion || !wallpaperMatchEnabled ? undefined : { scale: 0.96 }}
              transition={press}
              className="rounded-full bg-[hsl(var(--primary))] px-4 py-2.5 text-[10px] font-black uppercase tracking-wide text-[hsl(var(--text-on-accent))] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Lock this look
            </m.button>
            <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
              Saves colors to the ribbon and stops live follow.
            </Text>
          </div>
        </WeeModalFieldCard>
      </SettingsWeeSection>

      <SettingsWeeSection eyebrow="Global behavior">
        <WeeModalFieldCard hoverAccent="primary" paddingClassName="p-5 md:p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Text variant="h3" className="mb-1 playful-hero-text">
                Dynamic chrome accents
              </Text>
              <Text variant="desc" className="!m-0">
                Off keeps brand blue when no live match is on. On lets a locked/manual ribbon glow
                drive --primary after Spotify and Wallpaper match.
              </Text>
            </div>
            <WToggle
              checked={ribbon?.dynamicRibbonColorEnabled ?? false}
              onChange={handleDynamicRibbonColorChange}
              disableLabelClick
              title="Toggle dynamic chrome accents"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-secondary)/0.55)] p-3">
              <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
                Ribbon glow (manual)
              </Text>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className="h-5 w-5 rounded-full border border-[hsl(var(--border-primary)/0.45)]"
                  style={{ backgroundColor: ribbon?.ribbonGlowColor ?? DEFAULT_RIBBON_GLOW_HEX }}
                  aria-hidden
                />
                <Text variant="body" className="!m-0 font-mono text-[12px]">
                  {(ribbon?.ribbonGlowColor ?? DEFAULT_RIBBON_GLOW_HEX).toUpperCase()}
                </Text>
              </div>
            </div>
            <div className="rounded-xl border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-secondary)/0.55)] p-3">
              <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
                Neutral fallback
              </Text>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className="h-5 w-5 rounded-full border border-[hsl(var(--border-primary)/0.45)]"
                  style={{ backgroundColor: DEFAULT_RIBBON_SURFACE_HEX }}
                  aria-hidden
                />
                <Text variant="body" className="!m-0 font-mono text-[12px]">
                  {DEFAULT_RIBBON_SURFACE_HEX.toUpperCase()}
                </Text>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-secondary)/0.55)] p-3">
            <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
              Precedence
            </Text>
            <Text variant="body" className="!mb-0 !mt-1">
              Spotify Match → Wallpaper match → Ribbon glow (when dynamic chrome is on) → Default.
              Now using {sourceLabel}.
            </Text>
            <Text variant="caption" className="!mb-0 !mt-1 text-[hsl(var(--text-tertiary))]">
              Time color {(time?.color || '#FFFFFF').toUpperCase()}. Edit ribbon colors in Dock.
            </Text>
          </div>
        </WeeModalFieldCard>
      </SettingsWeeSection>

      <SettingsWeeSection eyebrow="Quick links">
        <WeeModalFieldCard hoverAccent="primary" paddingClassName="p-5 md:p-6">
          <Text variant="h3" className="mb-1 playful-hero-text">
            Edit colors by feature
          </Text>
          <Text variant="desc" className="mb-4">
            Jump to each area without duplicating full color editors here.
          </Text>
          <div className="space-y-2">
            {QUICK_LINKS.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-secondary)/0.55)] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <Text variant="body" className="!m-0 font-semibold">
                    {link.label}
                  </Text>
                  <Text variant="caption" className="!mb-0 !mt-0.5 text-[hsl(var(--text-tertiary))]">
                    {link.detail}
                  </Text>
                </div>
                <WeeHelpLinkButton type="button" className="shrink-0" onClick={() => openSettingsToTab(link.id)}>
                  Open
                </WeeHelpLinkButton>
              </div>
            ))}
          </div>
        </WeeModalFieldCard>
      </SettingsWeeSection>
    </div>
  );
});

ColorsSettingsTab.displayName = 'ColorsSettingsTab';

export default ColorsSettingsTab;
