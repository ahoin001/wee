import React, { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import WToggle from '../../ui/WToggle';
import Text from '../../ui/Text';
import SettingsWeeSection from './SettingsWeeSection';
import SettingsTabPageHeader from './SettingsTabPageHeader';
import { WeeHelpLinkButton, WeeModalFieldCard } from '../../ui/wee';
import useConsolidatedAppStore from '../../utils/useConsolidatedAppStore';
import { saveUnifiedSettingsSnapshot } from '../../utils/electronApi';
import { openSettingsToTab, SETTINGS_TAB_ID } from '../../utils/settingsNavigation';
import { DEFAULT_RIBBON_GLOW_HEX, DEFAULT_RIBBON_SURFACE_HEX } from '../../design/runtimeColorStrings.js';
import './settings-wee-panels.css';

const QUICK_LINKS = [
  { id: SETTINGS_TAB_ID.DOCK, label: 'Dock colors', detail: 'Ribbon surface + glow controls' },
  { id: SETTINGS_TAB_ID.TIME, label: 'Time colors', detail: 'Clock text and pill styling' },
  { id: SETTINGS_TAB_ID.WALLPAPER, label: 'Wallpaper tones', detail: 'Blur, brightness, and saturation per space' },
  { id: SETTINGS_TAB_ID.PRESETS, label: 'Presets', detail: 'Save and apply complete visual setups' },
];

const ColorsSettingsTab = React.memo(() => {
  const { ribbon, ui, time } = useConsolidatedAppStore(
    useShallow((state) => ({
      ribbon: state.ribbon,
      ui: state.ui,
      time: state.time,
    }))
  );
  const { setRibbonState } = useConsolidatedAppStore(
    useShallow((state) => ({
      setRibbonState: state.actions.setRibbonState,
    }))
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

  return (
    <div className="settings-wee-tab-root pb-12">
      <SettingsTabPageHeader title="Colors" subtitle="Discover and tune color behavior" />

      <SettingsWeeSection eyebrow="Global behavior">
        <WeeModalFieldCard hoverAccent="primary" paddingClassName="p-5 md:p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Text variant="h3" className="mb-1 playful-hero-text">
                Dynamic color from ribbon
              </Text>
              <Text variant="desc" className="!m-0">
                Off keeps neutral grayscale accents. On uses ribbon glow + Spotify match where supported.
              </Text>
            </div>
            <WToggle
              checked={ribbon?.dynamicRibbonColorEnabled ?? false}
              onChange={handleDynamicRibbonColorChange}
              disableLabelClick
              title="Toggle dynamic color from ribbon"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-[hsl(var(--border-primary)/0.45)] bg-[hsl(var(--surface-secondary)/0.55)] p-3">
              <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
                Ribbon glow source
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
              Current status
            </Text>
            <Text variant="body" className="!mb-0 !mt-1">
              {ribbon?.dynamicRibbonColorEnabled
                ? 'Dynamic ribbon accents are active.'
                : 'Dynamic ribbon accents are disabled (neutral grays in supported areas).'}{' '}
              {ui?.spotifyMatchEnabled ? 'Spotify Match is enabled.' : 'Spotify Match is off.'}
            </Text>
            <Text variant="caption" className="!mb-0 !mt-1 text-[hsl(var(--text-tertiary))]">
              Time color currently set to {(time?.color || '#FFFFFF').toUpperCase()}.
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
            Use these shortcuts to jump to each area without duplicating full color editors here.
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
