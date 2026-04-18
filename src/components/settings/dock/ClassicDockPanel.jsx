import React from 'react';
import PropTypes from 'prop-types';
import { Gamepad2, Palette, Sparkles } from 'lucide-react';
import Text from '../../../ui/Text';
import Slider from '../../../ui/Slider';
import { WeeModalFieldCard, WeeSectionEyebrow, WeeSettingsCollapsibleSection } from '../../../ui/wee';
import SettingsToggleFieldCard from '../SettingsToggleFieldCard';
import DockSettingsColorRow from './DockSettingsColorRow';

const TOGGLE_TITLE =
  '!text-[0.8125rem] !font-black !uppercase !tracking-[0.06em] !leading-snug !text-[hsl(var(--text-primary))]';

function ClassicDockPanel({
  dock,
  themeGroups,
  dockDefault,
  expandedGroups,
  onToggleThemeGroup,
  getCurrentTheme,
  applyTheme,
  onColorChange,
  onGlassEnabled,
  onGlassOpacity,
  onGlassBlur,
}) {
  return (
    <div className="flex flex-col gap-6">
      <WeeSettingsCollapsibleSection
        icon={Gamepad2}
        title="Preset themes"
        description="Curated palettes — tap a card to apply the full set."
        defaultOpen
      >
        {Object.entries(themeGroups).map(([groupKey, group]) => (
          <div key={groupKey} className="rounded-[1.5rem] border border-[hsl(var(--border-primary)/0.4)] bg-[hsl(var(--surface-secondary)/0.65)] p-4">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 text-left transition-colors hover:opacity-95"
              onClick={() => onToggleThemeGroup(groupKey)}
            >
              <div>
                <WeeSectionEyebrow className="!mb-1 block" trackingClassName="tracking-[0.12em]">
                  {group.name}
                </WeeSectionEyebrow>
                <Text variant="caption" className="!m-0 text-[hsl(var(--text-tertiary))]">
                  {group.description}
                </Text>
              </div>
              <span
                className={`shrink-0 text-[hsl(var(--text-tertiary))] transition-transform duration-200 ${
                  expandedGroups[groupKey] ? 'rotate-180' : ''
                }`}
                aria-hidden
              >
                ▼
              </span>
            </button>

            {expandedGroups[groupKey] ? (
              <div className="surface-theme-grid mt-4">
                {Object.entries(group.themes).map(([themeKey, theme]) => {
                  const themePath = `${groupKey}.${themeKey}`;
                  const isSelected = getCurrentTheme() === themePath;
                  return (
                    <button
                      key={themeKey}
                      type="button"
                      onClick={() => applyTheme(themePath)}
                      className={`surface-theme-button ${isSelected ? 'surface-theme-button-selected' : 'surface-theme-button-unselected'}`}
                    >
                      <Text variant="body" className="font-semibold text-[hsl(var(--text-primary))]">
                        {theme.name}
                      </Text>
                      <Text variant="caption" className="text-[hsl(var(--text-secondary))]">
                        {theme.description}
                      </Text>
                      <div className="surface-color-swatches">
                        <div className="surface-color-dot" style={{ background: theme.colors.dockBaseGradientStart }} />
                        <div className="surface-color-dot" style={{ background: theme.colors.dockAccentColor }} />
                        <div className="surface-color-dot" style={{ background: theme.colors.buttonGradientStart }} />
                        <div className="surface-color-dot" style={{ background: theme.colors.buttonIconColor }} />
                      </div>
                      {isSelected ? (
                        <div className="surface-selected-check" aria-hidden>
                          ✓
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ))}
      </WeeSettingsCollapsibleSection>

      <WeeSettingsCollapsibleSection
        icon={Palette}
        title="Dock base colors"
        description="Main structure gradient and accent when not using a preset."
        defaultOpen={false}
      >
        <WeeModalFieldCard hoverAccent="none" paddingClassName="p-4 md:p-5">
          <div className="surface-controls">
            <DockSettingsColorRow
              label="Gradient start"
              value={dock?.dockBaseGradientStart}
              fallback={dockDefault.dockBaseGradientStart}
              onChange={(next) => onColorChange('dockBaseGradientStart', next)}
            />
            <DockSettingsColorRow
              label="Gradient end"
              value={dock?.dockBaseGradientEnd}
              fallback={dockDefault.dockBaseGradientEnd}
              onChange={(next) => onColorChange('dockBaseGradientEnd', next)}
            />
            <DockSettingsColorRow
              label="Accent"
              value={dock?.dockAccentColor}
              fallback={dockDefault.dockAccentColor}
              onChange={(next) => onColorChange('dockAccentColor', next)}
            />
          </div>
        </WeeModalFieldCard>
      </WeeSettingsCollapsibleSection>

      <WeeSettingsCollapsibleSection
        icon={Sparkles}
        title="Glass effect"
        description="Frosted glass on the classic dock shell."
        defaultOpen={false}
      >
        <SettingsToggleFieldCard
          hoverAccent="none"
          titleClassName={TOGGLE_TITLE}
          title="Glass morphism"
          desc="Apply blur and translucency to the dock body."
          checked={dock?.glassEnabled ?? false}
          onChange={onGlassEnabled}
        >
          {dock?.glassEnabled ? (
            <div className="surface-controls">
              <div>
                <Text variant="body" className="mb-2 text-[hsl(var(--text-secondary))]">
                  Glass opacity
                </Text>
                <Slider
                  value={dock?.glassOpacity ?? 0.18}
                  min={0.05}
                  max={0.5}
                  step={0.01}
                  onChange={onGlassOpacity}
                />
                <Text variant="caption" className="surface-caption">
                  {Math.round((dock?.glassOpacity ?? 0.18) * 100)}%
                </Text>
              </div>
              <div>
                <Text variant="body" className="mb-2 text-[hsl(var(--text-secondary))]">
                  Glass blur
                </Text>
                <Slider
                  value={dock?.glassBlur ?? 2.5}
                  min={0.5}
                  max={8}
                  step={0.1}
                  onChange={onGlassBlur}
                />
                <Text variant="caption" className="surface-caption">
                  {dock?.glassBlur ?? 2.5}px
                </Text>
              </div>
            </div>
          ) : null}
        </SettingsToggleFieldCard>
      </WeeSettingsCollapsibleSection>
    </div>
  );
}

ClassicDockPanel.propTypes = {
  dock: PropTypes.object,
  themeGroups: PropTypes.object.isRequired,
  dockDefault: PropTypes.object.isRequired,
  expandedGroups: PropTypes.object.isRequired,
  onToggleThemeGroup: PropTypes.func.isRequired,
  getCurrentTheme: PropTypes.func.isRequired,
  applyTheme: PropTypes.func.isRequired,
  onColorChange: PropTypes.func.isRequired,
  onGlassEnabled: PropTypes.func.isRequired,
  onGlassOpacity: PropTypes.func.isRequired,
  onGlassBlur: PropTypes.func.isRequired,
};

export default React.memo(ClassicDockPanel);
